/**
 * routes/teams.js
 *
 * Endpoints:
 *   GET /api/teams              — All teams with their coach info
 *   GET /api/teams/:id/overview — All athletes in team + readiness scores +
 *                                 active injury count + average team readiness
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// ---------------------------------------------------------------------------
// GET /api/teams
// Returns all teams with their assigned coach.
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.team_id,
        t.team_name,
        t.sport_type,
        c.coach_id,
        c.first_name || ' ' || c.last_name  AS coach_name,
        c.speciality                         AS coach_speciality,
        c.cert_level                         AS coach_cert_level,
        -- Athlete count per team
        (
          SELECT COUNT(*)
          FROM   athlete a
          WHERE  a.team_id = t.team_id
        ) AS athlete_count
      FROM team    t
      JOIN coach   c ON c.coach_id = t.coach_id
      ORDER BY t.team_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/teams error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve teams.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/teams
// Creates a new team and assigns an existing coach.
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { team_name, sport_type, coach_id } = req.body;

  if (!team_name || !sport_type || !coach_id) {
    return res.status(400).json({
      error: 'team_name, sport_type, and coach_id are required fields.',
    });
  }

  try {
    // Check that the coach exists
    const coachCheck = await pool.query('SELECT coach_id FROM coach WHERE coach_id = $1', [coach_id]);
    if (coachCheck.rows.length === 0) {
      return res.status(404).json({ error: `Coach with ID ${coach_id} not found.` });
    }

    const result = await pool.query(`
      INSERT INTO team (team_name, sport_type, coach_id)
      VALUES ($1, $2, $3)
      RETURNING team_id, team_name, sport_type, coach_id
    `, [team_name.trim(), sport_type.trim(), coach_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/teams error:', err.message);
    res.status(500).json({ error: 'Failed to create team.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/teams/:id/overview
// Returns a full team dashboard summary:
//   • Team metadata + coach
//   • Array of athletes with readiness scores and active injury counts
//   • Aggregate: average team readiness, total active injuries
// ---------------------------------------------------------------------------
router.get('/:id/overview', async (req, res) => {
  const { id } = req.params;

  try {
    // --- 1. Verify team exists ---
    const teamResult = await pool.query(`
      SELECT
        t.team_id,
        t.team_name,
        t.sport_type,
        c.first_name || ' ' || c.last_name  AS coach_name,
        c.speciality                         AS coach_speciality,
        c.cert_level                         AS coach_cert_level
      FROM team  t
      JOIN coach c ON c.coach_id = t.coach_id
      WHERE t.team_id = $1
    `, [id]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: `Team with ID ${id} not found.` });
    }

    const team = teamResult.rows[0];

    // --- 2. Athletes in this team with their live readiness data ---
    const athletesResult = await pool.query(`
      SELECT
        a.athlete_id,
        a.first_name,
        a.last_name,
        a.first_name || ' ' || a.last_name  AS full_name,
        a.dob,
        a.height_cm,
        a.weight_kg,
        ar.readiness_score,
        ar.injury_risk,
        ar.heart_rate,
        ar.hrv_ms,
        ar.sleep_score,
        ar.fatigue_score,
        ar.hydration_pct,
        ar.recorded_at  AS last_biometric_at,
        -- Active injury count per athlete (scalar subquery — parameterised)
        (
          SELECT COUNT(*)
          FROM   injury_record ir
          WHERE  ir.athlete_id = a.athlete_id
            AND  ir.recovery_status = 'Active'
        ) AS active_injury_count
      FROM athlete a
      LEFT JOIN athlete_readiness ar ON ar.athlete_id = a.athlete_id
      WHERE a.team_id = $1
      ORDER BY ar.readiness_score DESC NULLS LAST
    `, [id]);

    const athletes = athletesResult.rows;

    // --- 3. Compute aggregate statistics server-side ---
    const scoresOnly = athletes
      .map(a => a.readiness_score)
      .filter(s => s !== null);

    const avg_readiness = scoresOnly.length > 0
      ? parseFloat(
          (scoresOnly.reduce((sum, s) => sum + parseFloat(s), 0) / scoresOnly.length).toFixed(2)
        )
      : null;

    const total_active_injuries = athletes.reduce(
      (sum, a) => sum + parseInt(a.active_injury_count, 10),
      0
    );

    const high_risk_count = athletes.filter(a => a.injury_risk === 'High').length;

    res.json({
      ...team,
      avg_readiness,
      total_active_injuries,
      high_risk_count,
      athlete_count: athletes.length,
      athletes,
    });
  } catch (err) {
    console.error(`GET /api/teams/${id}/overview error:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve team overview.' });
  }
});

module.exports = router;
