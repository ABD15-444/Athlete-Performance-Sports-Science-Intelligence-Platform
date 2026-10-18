/**
 * routes/sessions.js
 *
 * Endpoints:
 *   POST /api/sessions               — Create a new training session
 *   POST /api/sessions/:id/athletes  — Link an athlete to a session with their RPE
 *   GET  /api/sessions               — List all training sessions (newest first)
 *   GET  /api/sessions/:id           — Single session with all participating athletes
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// ---------------------------------------------------------------------------
// GET /api/sessions
// Returns all training sessions ordered newest first.
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ts.session_id,
        ts.session_date,
        ts.session_type,
        ts.duration_min,
        ts.intensity,
        -- Count of athletes linked to this session
        (
          SELECT COUNT(*)
          FROM athlete_session ats
          WHERE ats.session_id = ts.session_id
        ) AS participant_count
      FROM training_session ts
      ORDER BY ts.session_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/sessions error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve sessions.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/sessions/:id
// Returns a single session with all participating athletes and their RPE.
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sessionResult = await pool.query(
      'SELECT * FROM training_session WHERE session_id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: `Session with ID ${id} not found.` });
    }

    const participantsResult = await pool.query(`
      SELECT
        a.athlete_id,
        a.first_name || ' ' || a.last_name  AS athlete_name,
        ats.rpe
      FROM athlete_session ats
      JOIN athlete a ON a.athlete_id = ats.athlete_id
      WHERE ats.session_id = $1
      ORDER BY athlete_name
    `, [id]);

    res.json({
      ...sessionResult.rows[0],
      participants: participantsResult.rows,
    });
  } catch (err) {
    console.error(`GET /api/sessions/${id} error:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve session.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/sessions
// Creates a new training session.
// Required: session_date, session_type, duration_min, intensity
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { session_date, session_type, duration_min, intensity } = req.body;

  // Validate required fields
  if (!session_date || !session_type || !duration_min || !intensity) {
    return res.status(400).json({
      error: 'Missing required fields: session_date, session_type, duration_min, intensity.',
    });
  }

  // Validate intensity value against CHECK constraint
  const validIntensities = ['Low', 'Moderate', 'High', 'Max'];
  if (!validIntensities.includes(intensity)) {
    return res.status(400).json({
      error: `intensity must be one of: ${validIntensities.join(', ')}.`,
    });
  }

  if (parseInt(duration_min, 10) <= 0) {
    return res.status(400).json({ error: 'duration_min must be a positive integer.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO training_session (session_date, session_type, duration_min, intensity)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [session_date, session_type, parseInt(duration_min, 10), intensity]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/sessions error:', err.message);
    res.status(500).json({ error: 'Failed to create training session.', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/sessions/:id/athletes
// Links an existing athlete to an existing session, recording their RPE.
// Required body: athlete_id
// Optional body: rpe (1–10)
// ---------------------------------------------------------------------------
router.post('/:id/athletes', async (req, res) => {
  const sessionId = req.params.id;
  const { athlete_id, rpe } = req.body;

  if (!athlete_id) {
    return res.status(400).json({ error: 'athlete_id is required.' });
  }

  if (rpe !== undefined && (parseInt(rpe, 10) < 1 || parseInt(rpe, 10) > 10)) {
    return res.status(400).json({ error: 'rpe must be between 1 and 10.' });
  }

  try {
    // Verify session exists
    const sessionCheck = await pool.query(
      'SELECT session_id FROM training_session WHERE session_id = $1',
      [sessionId]
    );
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: `Session with ID ${sessionId} not found.` });
    }

    // Verify athlete exists
    const athleteCheck = await pool.query(
      'SELECT athlete_id FROM athlete WHERE athlete_id = $1',
      [athlete_id]
    );
    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({ error: `Athlete with ID ${athlete_id} not found.` });
    }

    // Insert into join table — ON CONFLICT to handle duplicate links gracefully
    const result = await pool.query(`
      INSERT INTO athlete_session (athlete_id, session_id, rpe)
      VALUES ($1, $2, $3)
      ON CONFLICT (athlete_id, session_id)
        DO UPDATE SET rpe = EXCLUDED.rpe
      RETURNING *
    `, [athlete_id, sessionId, rpe ? parseInt(rpe, 10) : null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`POST /api/sessions/${sessionId}/athletes error:`, err.message);
    res.status(500).json({ error: 'Failed to link athlete to session.', detail: err.message });
  }
});

module.exports = router;
