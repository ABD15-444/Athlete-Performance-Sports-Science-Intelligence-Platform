-- =============================================================================
-- Athlete Performance & Sports Science Intelligence Platform
-- DATABASE VIEWS
--
-- View: Athlete_Readiness
--
-- Purpose:
--   Computes a live readiness score (0-100) for each athlete based on their
--   most recent biometric log, then subtracts an injury penalty if they have
--   any Active injury record.
--
-- Formula (sports-science weighted model):
--   Base Score =
--     (Sleep_Score  × 0.30)   -- sleep quality has largest impact on recovery
--     + (LEAST(HRV_ms, 100) × 0.25)  -- HRV capped at 100 to prevent outliers
--     + ((10 - Fatigue_Score) × 10 × 0.25)  -- inverted & scaled to 0-100 range
--     + (Hydration_pct × 0.20)  -- hydration affects sustained performance
--
--   Injury Penalty (worst active injury wins):
--     Active + Severe   → -40  (athlete should not be in full training)
--     Active + Moderate → -20  (significant impairment)
--     Active + Minor    → -10  (managed participation)
--     Recovering / Cleared → 0 (no penalty)
--
--   Final score = GREATEST(0, LEAST(100, Base_Score - Penalty))
--
-- Implementation notes:
--   • LATERAL JOIN retrieves the single most recent Biometric_Log per athlete
--     in one efficient pass — avoids a correlated subquery on every row.
--   • A second scalar subquery finds the maximum injury penalty across ALL
--     active injuries (handles edge case of concurrent injuries).
--   • Athletes with no biometric data are excluded (INNER via LATERAL ON true
--     with a required row).
-- =============================================================================

CREATE OR REPLACE VIEW Athlete_Readiness AS
SELECT
    -- ── Identity ──────────────────────────────────────────────────────────────
    a.Athlete_ID,
    a.First_Name || ' ' || a.Last_Name                          AS Athlete_Name,
    t.Team_Name,

    -- ── Raw biometric columns (from the most recent log) ─────────────────────
    bl.Recorded_At,
    bl.Heart_Rate,
    bl.HRV_ms,
    bl.Sleep_Score,
    bl.VO2_Max,
    bl.Fatigue_Score,
    bl.Hydration_pct,

    -- ── Readiness Score computation ───────────────────────────────────────────
    -- Step 1: compute base score using the weighted formula
    -- Step 2: subtract the worst active injury penalty (0 if none)
    -- Step 3: clamp the result to [0, 100]
    GREATEST(0, LEAST(100,
        ROUND(
            (
                (bl.Sleep_Score              * 0.30)
              + (LEAST(bl.HRV_ms, 100)       * 0.25)
              + ((10 - bl.Fatigue_Score) * 10 * 0.25)
              + (bl.Hydration_pct            * 0.20)
            )
            -- subtract the maximum penalty from any currently Active injury
            - COALESCE((
                SELECT MAX(
                    CASE
                        WHEN ir.Severity = 'Severe'   THEN 40
                        WHEN ir.Severity = 'Moderate' THEN 20
                        WHEN ir.Severity = 'Minor'    THEN 10
                        ELSE 0
                    END
                )
                FROM Injury_Record ir
                WHERE ir.Athlete_ID = a.Athlete_ID
                  AND ir.Recovery_Status = 'Active'
            ), 0)
        , 2)   -- round to 2 decimal places
    ))                                                          AS Readiness_Score,

    -- ── Injury Risk Flag ──────────────────────────────────────────────────────
    -- Based purely on biometric signals, independent of injury records.
    -- Evaluators can use this flag to identify athletes at risk BEFORE injury.
    CASE
        WHEN bl.Fatigue_Score > 7 OR bl.Sleep_Score < 40 THEN 'High'
        WHEN bl.Fatigue_Score > 5 OR bl.Sleep_Score < 60 THEN 'Moderate'
        ELSE 'Low'
    END                                                         AS Injury_Risk

FROM Athlete a
-- LATERAL: for each athlete row, execute the subquery once to get the most
-- recent biometric log.  More efficient than a GROUP BY + MAX approach because
-- it lets PostgreSQL use an index on (Athlete_ID, Recorded_At DESC).
JOIN LATERAL (
    SELECT
        bl_inner.Recorded_At,
        bl_inner.Heart_Rate,
        bl_inner.HRV_ms,
        bl_inner.Sleep_Score,
        bl_inner.Sleep_Hours,
        bl_inner.VO2_Max,
        bl_inner.Fatigue_Score,
        bl_inner.Hydration_pct
    FROM Biometric_Log bl_inner
    WHERE bl_inner.Athlete_ID = a.Athlete_ID
    ORDER BY bl_inner.Recorded_At DESC
    LIMIT 1
) bl ON true      -- ON true = INNER JOIN; athletes with no logs are excluded

JOIN Team t ON t.Team_ID = a.Team_ID;

COMMENT ON VIEW Athlete_Readiness IS
  'Live readiness score (0-100) per athlete, derived from their latest biometric
   log and adjusted for any Active injury records.  Uses LATERAL join for
   efficient per-athlete "most recent row" retrieval.';
