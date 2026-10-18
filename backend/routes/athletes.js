/**
 * routes/athletes.js
 *
 * Endpoints:
 *   GET  /api/athletes        — All athletes with latest readiness score, ordered by score DESC
 *   GET  /api/athletes/:id    — Full profile: info + biometrics + sessions + injuries
 *   POST /api/athletes        — Create a new athlete
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// ---------------------------------------------------------------------------
// GET /api/athletes
// Returns every athlete joined with their latest readiness score from the
// Athlete_Readiness view.  Athletes with no biometric data will not appear
// in the view, so we use LEFT JOIN and return nulls for their score fields.
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.athlete_id,
        a.first_name,
        a.middle_name,
        a.last_name,
        a.first_name || ' ' || a.last_name  AS full_name,
        a.dob,
        a.height_cm,
        a.weight_kg,
        a.created_at,
        t.team_id,
        t.team_name,
        t.sport_type,
        ar.readiness_score,
        ar.injury_risk,
        ar.heart_rate,
        ar.hrv_ms,
        ar.sleep_score,
        ar.fatigue_score,
        ar.hydration_pct,
        ar.vo2_max,
        ar.recorded_at  AS last_biometric_at,
        -- Count of currently active injuries for this athlete
        (
          SELECT COUNT(*)
          FROM injury_record ir
          WHERE ir.athlete_id = a.athlete_id
            AND ir.recovery_status = 'Active'
        ) AS active_injury_count
      FROM athlete a
      JOIN team t ON t.team_id = a.team_id
      LEFT JOIN athlete_readiness ar ON ar.athlete_id = a.athlete_id
      ORDER BY ar.readiness_score DESC NULLS LAST
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/athletes error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve athletes.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/athletes/:id
// Returns a complete athlete profile:
//   • Basic info + team
//   • Positions (array)
//   • Emergency contacts (array)
//   • Latest readiness score from the view
//   • Last 30 biometric logs (newest first)
//   • Last 20 training sessions with RPE (newest first)
//   • All injury records (newest first)
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // --- 1. Core athlete record ---
    const athleteResult = await pool.query(`
      SELECT
        a.athlete_id,
        a.first_name,
        a.middle_name,
        a.last_name,
        a.first_name || ' ' || a.last_name  AS full_name,
        a.dob,
        a.height_cm,
        a.weight_kg,
        a.created_at,
        t.team_id,
        t.team_name,
        t.sport_type,
        c.first_name || ' ' || c.last_name  AS coach_name,
        c.speciality                         AS coach_speciality
      FROM athlete a
      JOIN team    t ON t.team_id   = a.team_id
      JOIN coach   c ON c.coach_id  = t.coach_id
      WHERE a.athlete_id = $1
    `, [id]);

    if (athleteResult.rows.length === 0) {
      return res.status(404).json({ error: `Athlete with ID ${id} not found.` });
    }

    const athlete = athleteResult.rows[0];

    // --- 2. Positions (multivalued attribute) ---
    const positionsResult = await pool.query(`
      SELECT position_name
      FROM   athlete_position
      WHERE  athlete_id = $1
      ORDER  BY position_name
    `, [id]);

    // --- 3. Emergency contacts ---
    const contactsResult = await pool.query(`
      SELECT contact_phone, contact_name, relationship
      FROM   emergency_contact
      WHERE  athlete_id = $1
      ORDER  BY contact_name
    `, [id]);

    // --- 4. Readiness score from the live view ---
    const readinessResult = await pool.query(`
      SELECT
        readiness_score,
        injury_risk,
        heart_rate,
        hrv_ms,
        sleep_score,
        vo2_max,
        fatigue_score,
        hydration_pct,
        recorded_at AS last_biometric_at
      FROM athlete_readiness
      WHERE athlete_id = $1
    `, [id]);

    // --- 5. Last 30 biometric logs ---
    const biometricsResult = await pool.query(`
      SELECT
        log_id,
        recorded_at,
        heart_rate,
        hrv_ms,
        sleep_score,
        sleep_hours,
        vo2_max,
        fatigue_score,
        hydration_pct
      FROM   biometric_log
      WHERE  athlete_id = $1
      ORDER  BY recorded_at DESC
      LIMIT  30
    `, [id]);

    // --- 6. Last 20 training sessions (via join table) ---
    const sessionsResult = await pool.query(`
      SELECT
        ts.session_id,
        ts.session_date,
        ts.session_type,
        ts.duration_min,
        ts.intensity,
        ats.rpe
      FROM   athlete_session ats
      JOIN   training_session ts ON ts.session_id = ats.session_id
      WHERE  ats.athlete_id = $1
      ORDER  BY ts.session_date DESC
      LIMIT  20
    `, [id]);

    // --- 7. All injury records ---
    const injuriesResult = await pool.query(`
      SELECT
        injury_id,
        injury_date,
        injury_type,
        severity,
        body_part,
        recovery_status,
        expected_return
      FROM   injury_record
      WHERE  athlete_id = $1
      ORDER  BY injury_date DESC
    `, [id]);

    // Assemble the full profile response
    res.json({
      ...athlete,
      positions:        positionsResult.rows.map(r => r.position_name),
      emergency_contacts: contactsResult.rows,
      readiness:        readinessResult.rows[0] || null,
      biometric_logs:   biometricsResult.rows,
      training_sessions: sessionsResult.rows,
      injury_records:   injuriesResult.rows,
    });
  } catch (err) {
    console.error(`GET /api/athletes/${id} error:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve athlete profile.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/athletes
// Creates a new athlete record.
// Required fields: first_name, last_name, dob, team_id
// Optional: middle_name, height_cm, weight_kg
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    dob,
    height_cm,
    weight_kg,
    team_id,
  } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !dob || !team_id) {
    return res.status(400).json({
      error: 'Missing required fields: first_name, last_name, dob, team_id.',
    });
  }

  // Ensure the referenced team exists
  try {
    const teamCheck = await pool.query(
      'SELECT team_id FROM team WHERE team_id = $1',
      [team_id]
    );
    if (teamCheck.rows.length === 0) {
      return res.status(400).json({ error: `Team with ID ${team_id} does not exist.` });
    }

    const result = await pool.query(`
      INSERT INTO athlete
        (first_name, middle_name, last_name, dob, height_cm, weight_kg, team_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      first_name,
      middle_name || null,
      last_name,
      dob,
      height_cm  || null,
      weight_kg  || null,
      team_id,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/athletes error:', err.message);
    // Catch FK violation, date parse errors, etc.
    res.status(500).json({ error: 'Failed to create athlete.', detail: err.message });
  }
});

module.exports = router;
