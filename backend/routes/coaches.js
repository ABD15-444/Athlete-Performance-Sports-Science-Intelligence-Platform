/**
 * routes/coaches.js
 *
 * Endpoints:
 *   GET  /api/coaches — List all coaches with assigned team count
 *   POST /api/coaches — Create a new coach
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// GET /api/coaches
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.coach_id,
        c.first_name,
        c.last_name,
        c.first_name || ' ' || c.last_name AS full_name,
        c.email,
        c.speciality,
        c.cert_level,
        COUNT(t.team_id) AS team_count
      FROM coach c
      LEFT JOIN team t ON t.coach_id = c.coach_id
      GROUP BY c.coach_id
      ORDER BY c.first_name, c.last_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/coaches error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve coaches.' });
  }
});

// POST /api/coaches
router.post('/', async (req, res) => {
  const { first_name, last_name, email, speciality, cert_level } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({
      error: 'first_name, last_name, and email are required fields.',
    });
  }

  try {
    const result = await pool.query(`
      INSERT INTO coach (first_name, last_name, email, speciality, cert_level)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING coach_id, first_name, last_name, email, speciality, cert_level
    `, [first_name.trim(), last_name.trim(), email.trim(), speciality?.trim() || null, cert_level?.trim() || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/coaches error:', err.message);
    if (err.code === '23505') { // Unique constraint violation (email)
      return res.status(409).json({ error: 'A coach with this email address already exists.' });
    }
    res.status(500).json({ error: 'Failed to create coach.' });
  }
});

module.exports = router;
