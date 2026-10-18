/**
 * routes/injuries.js
 *
 * Endpoints:
 *   POST  /api/athletes/:id/injury    — Log a new injury (always starts Active)
 *   PATCH /api/injuries/:id/status    — Update recovery status
 *   GET   /api/injuries               — All injury records across all athletes
 *   GET   /api/athletes/:id/injuries  — All injuries for a specific athlete
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// ---------------------------------------------------------------------------
// GET /api/injuries
// Returns all injury records across all athletes, newest first.
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ir.injury_id,
        ir.athlete_id,
        a.first_name || ' ' || a.last_name  AS athlete_name,
        t.team_name,
        ir.injury_date,
        ir.injury_type,
        ir.severity,
        ir.body_part,
        ir.recovery_status,
        ir.expected_return
      FROM injury_record ir
      JOIN athlete a ON a.athlete_id = ir.athlete_id
      JOIN team    t ON t.team_id    = a.team_id
      ORDER BY ir.injury_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/injuries error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve injury records.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/athletes/:athleteId/injuries
// All injuries for a specific athlete.
// ---------------------------------------------------------------------------
router.get('/athletes/:athleteId/injuries', async (req, res) => {
  const { athleteId } = req.params;

  try {
    const athleteCheck = await pool.query(
      'SELECT athlete_id FROM athlete WHERE athlete_id = $1',
      [athleteId]
    );
    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({ error: `Athlete with ID ${athleteId} not found.` });
    }

    const result = await pool.query(`
      SELECT *
      FROM injury_record
      WHERE athlete_id = $1
      ORDER BY injury_date DESC
    `, [athleteId]);

    res.json(result.rows);
  } catch (err) {
    console.error(`GET /api/athletes/${athleteId}/injuries error:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve athlete injuries.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/athletes/:id/injury
// Logs a new injury record.  Recovery_Status is always set to 'Active' on
// creation — medical staff must explicitly update it via PATCH.
// Required: injury_date, injury_type, severity
// Optional: body_part, expected_return
// ---------------------------------------------------------------------------
router.post('/athletes/:id/injury', async (req, res) => {
  const athleteId = req.params.id;
  const { injury_date, injury_type, severity, body_part, expected_return } = req.body;

  // Validate required fields
  if (!injury_date || !injury_type || !severity) {
    return res.status(400).json({
      error: 'Missing required fields: injury_date, injury_type, severity.',
    });
  }

  // Validate severity against CHECK constraint
  const validSeverities = ['Minor', 'Moderate', 'Severe'];
  if (!validSeverities.includes(severity)) {
    return res.status(400).json({
      error: `severity must be one of: ${validSeverities.join(', ')}.`,
    });
  }

  try {
    // Verify athlete exists
    const athleteCheck = await pool.query(
      'SELECT athlete_id, first_name, last_name FROM athlete WHERE athlete_id = $1',
      [athleteId]
    );
    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({ error: `Athlete with ID ${athleteId} not found.` });
    }

    const result = await pool.query(`
      INSERT INTO injury_record
        (athlete_id, injury_date, injury_type, severity, body_part, recovery_status, expected_return)
      VALUES ($1, $2, $3, $4, $5, 'Active', $6)
      RETURNING *
    `, [
      athleteId,
      injury_date,
      injury_type,
      severity,
      body_part       || null,
      expected_return || null,
    ]);

    const injury = result.rows[0];

    // Log the new injury so coaches are immediately aware
    console.log(
      `🩺 INJURY LOGGED: ${athleteCheck.rows[0].first_name} ${athleteCheck.rows[0].last_name}` +
      ` — ${severity} ${injury_type}` +
      (body_part ? ` (${body_part})` : '') +
      `. Readiness penalty: ${severity === 'Severe' ? '-40' : severity === 'Moderate' ? '-20' : '-10'} pts`
    );

    res.status(201).json(injury);
  } catch (err) {
    console.error(`POST /api/athletes/${athleteId}/injury error:`, err.message);
    res.status(500).json({ error: 'Failed to log injury.', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/injuries/:id/status
// Updates the recovery_status of an injury record.
// Allowed transitions: Active → Recovering → Cleared
// When set to Cleared, the readiness penalty is automatically lifted because
// the Athlete_Readiness view filters on recovery_status = 'Active'.
// ---------------------------------------------------------------------------
router.patch('/:id/status', async (req, res) => {
  const injuryId = req.params.id;
  const { recovery_status } = req.body;

  // Validate the new status
  const validStatuses = ['Active', 'Recovering', 'Cleared'];
  if (!recovery_status) {
    return res.status(400).json({ error: 'recovery_status is required.' });
  }
  if (!validStatuses.includes(recovery_status)) {
    return res.status(400).json({
      error: `recovery_status must be one of: ${validStatuses.join(', ')}.`,
    });
  }

  try {
    // Verify the injury record exists
    const injuryCheck = await pool.query(
      'SELECT injury_id, athlete_id, severity, recovery_status FROM injury_record WHERE injury_id = $1',
      [injuryId]
    );
    if (injuryCheck.rows.length === 0) {
      return res.status(404).json({ error: `Injury with ID ${injuryId} not found.` });
    }

    const prev = injuryCheck.rows[0];

    // Perform the update
    const result = await pool.query(`
      UPDATE injury_record
      SET recovery_status = $1
      WHERE injury_id = $2
      RETURNING *
    `, [recovery_status, injuryId]);

    const updated = result.rows[0];

    // If the status was just set to Cleared, confirm the penalty has lifted
    if (recovery_status === 'Cleared' && prev.recovery_status !== 'Cleared') {
      console.log(
        `✅ INJURY CLEARED: injury_id=${injuryId}, athlete_id=${updated.athlete_id}.` +
        ` Readiness penalty (${prev.severity}) automatically removed — view will recalculate on next read.`
      );
    }

    res.json(updated);
  } catch (err) {
    console.error(`PATCH /api/injuries/${injuryId}/status error:`, err.message);
    res.status(500).json({ error: 'Failed to update injury status.', detail: err.message });
  }
});

module.exports = router;
