/**
 * routes/biometrics.js
 *
 * Endpoints:
 *   POST /api/athletes/:id/biometrics
 *     — Logs a new biometric reading for an athlete.
 *     — After inserting, checks for overtraining signal:
 *         Fatigue_Score > 7 OR Sleep_Score < 40
 *       If triggered, logs a console warning (in production this would
 *       fire a push notification / webhook).
 */

const express = require('express');
const router  = express.Router({ mergeParams: true }); // mergeParams gives access to :id from parent
const pool    = require('../db/pool');

// ---------------------------------------------------------------------------
// POST /api/athletes/:id/biometrics
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const athleteId = req.params.id;

  const {
    recorded_at,   // optional — defaults to NOW() in DB if omitted
    heart_rate,
    hrv_ms,
    sleep_score,
    sleep_hours,
    vo2_max,
    fatigue_score,
    hydration_pct,
  } = req.body;

  // --- Validate that the athlete exists ---
  try {
    const athleteCheck = await pool.query(
      'SELECT athlete_id, first_name, last_name FROM athlete WHERE athlete_id = $1',
      [athleteId]
    );
    if (athleteCheck.rows.length === 0) {
      return res.status(404).json({ error: `Athlete with ID ${athleteId} not found.` });
    }

    const athleteName = `${athleteCheck.rows[0].first_name} ${athleteCheck.rows[0].last_name}`;

    // --- Validate domain constraints before hitting the DB ---
    if (sleep_score   !== undefined && (sleep_score   < 0   || sleep_score   > 100)) {
      return res.status(400).json({ error: 'sleep_score must be between 0 and 100.' });
    }
    if (fatigue_score !== undefined && (fatigue_score < 0   || fatigue_score > 10)) {
      return res.status(400).json({ error: 'fatigue_score must be between 0 and 10.' });
    }
    if (hydration_pct !== undefined && (hydration_pct < 0   || hydration_pct > 100)) {
      return res.status(400).json({ error: 'hydration_pct must be between 0 and 100.' });
    }
    if (heart_rate    !== undefined && (heart_rate    < 30  || heart_rate    > 220)) {
      return res.status(400).json({ error: 'heart_rate must be between 30 and 220 bpm.' });
    }

    // --- Insert the new biometric log ---
    // Use COALESCE so that if recorded_at is not provided, the DB default NOW() fires.
    const insertResult = await pool.query(`
      INSERT INTO biometric_log
        (athlete_id, recorded_at, heart_rate, hrv_ms, sleep_score, sleep_hours, vo2_max, fatigue_score, hydration_pct)
      VALUES (
        $1,
        COALESCE($2::timestamptz, NOW()),
        $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING *
    `, [
      athleteId,
      recorded_at   || null,
      heart_rate    || null,
      hrv_ms        || null,
      sleep_score   || null,
      sleep_hours   || null,
      vo2_max       || null,
      fatigue_score || null,
      hydration_pct || null,
    ]);

    const newLog = insertResult.rows[0];

    // --- Overtraining / high-risk check ---
    // Fires when Fatigue_Score > 7 (overtraining threshold in sports science)
    // or Sleep_Score < 40 (severe sleep deprivation).
    const overtrained = (fatigue_score !== undefined && fatigue_score > 7)
                     || (sleep_score   !== undefined && sleep_score   < 40);

    if (overtrained) {
      // In production: trigger push notification / Slack alert / email
      console.warn(
        `\n⚠️  OVERTRAINING ALERT: ${athleteName}` +
        `\n   Fatigue Score : ${fatigue_score ?? 'N/A'} (threshold > 7)` +
        `\n   Sleep Score   : ${sleep_score   ?? 'N/A'} (threshold < 40)` +
        `\n   Logged at     : ${newLog.recorded_at}` +
        `\n   (In production this would trigger a push notification)\n`
      );
    }

    // Return the inserted row plus whether the alert fired
    res.status(201).json({
      ...newLog,
      overtraining_alert: overtrained,
    });
  } catch (err) {
    console.error(`POST /api/athletes/${athleteId}/biometrics error:`, err.message);
    res.status(500).json({ error: 'Failed to log biometric reading.', detail: err.message });
  }
});

module.exports = router;
