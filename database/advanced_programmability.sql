-- =============================================================================
-- Athlete Performance & Sports Science Intelligence Platform
-- PROCEDURES, FUNCTIONS, CURSORS & TRIGGERS (PL/pgSQL)
-- =============================================================================

-- =============================================================================
-- 1. FUNCTIONS (2 Required)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function 1: fn_calculate_readiness_score
-- Purpose: Encapsulates the sports science recovery formula in a reusable scalar function.
-- Formula: (Sleep * 0.30) + (LEAST(HRV, 100) * 0.25) + ((10 - Fatigue) * 10 * 0.25) + (Hydration * 0.20) - Penalty
-- Clamped to [0, 100].
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_readiness_score(
    p_sleep_score NUMERIC,
    p_hrv_ms NUMERIC,
    p_fatigue_score NUMERIC,
    p_hydration_pct NUMERIC,
    p_injury_penalty NUMERIC DEFAULT 0
)
RETURNS NUMERIC AS $$
DECLARE
    v_base_score NUMERIC;
    v_final_score NUMERIC;
BEGIN
    -- Validate and calculate base score
    v_base_score := (COALESCE(p_sleep_score, 0) * 0.30)
                  + (LEAST(COALESCE(p_hrv_ms, 0), 100) * 0.25)
                  + ((10 - COALESCE(p_fatigue_score, 0)) * 10 * 0.25)
                  + (COALESCE(p_hydration_pct, 0) * 0.20);

    -- Apply injury penalty and clamp to [0, 100]
    v_final_score := GREATEST(0, LEAST(100, ROUND(v_base_score - COALESCE(p_injury_penalty, 0), 2)));

    RETURN v_final_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calculate_readiness_score IS
'Calculates clamped AI readiness score (0-100) given physiological metrics and injury penalty.';


-- -----------------------------------------------------------------------------
-- Function 2: fn_get_athlete_injury_risk
-- Purpose: Evaluates physiological markers to classify injury risk status.
-- Returns: 'High' | 'Moderate' | 'Low'
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_athlete_injury_risk(
    p_fatigue_score NUMERIC,
    p_sleep_score NUMERIC
)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF p_fatigue_score > 7.0 OR p_sleep_score < 40.0 THEN
        RETURN 'High';
    ELSIF p_fatigue_score > 5.0 OR p_sleep_score < 60.0 THEN
        RETURN 'Moderate';
    ELSE
        RETURN 'Low';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_get_athlete_injury_risk IS
'Classifies injury risk level based on acute fatigue index and sleep restoration scores.';


-- =============================================================================
-- 2. PROCEDURES (2 Required)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Procedure 1: sp_log_training_session_with_attendance
-- Purpose: Atomically records a training session and logs initial athlete attendance.
-- Demonstrates transaction control in stored procedures.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_log_training_session_with_attendance(
    p_session_id UUID,
    p_session_date DATE,
    p_session_type VARCHAR(50),
    p_duration_min INT,
    p_intensity VARCHAR(10),
    p_athlete_ids UUID[],
    p_default_rpe INT DEFAULT 5
)
LANGUAGE plpgsql AS $$
DECLARE
    v_athlete_id UUID;
BEGIN
    -- 1. Insert parent training session
    INSERT INTO Training_Session (
        Session_ID,
        Session_Date,
        Session_Type,
        Duration_min,
        Intensity
    ) VALUES (
        p_session_id,
        p_session_date,
        p_session_type,
        p_duration_min,
        p_intensity
    );

    -- 2. Insert attendance rows for each provided athlete
    IF p_athlete_ids IS NOT NULL THEN
        FOREACH v_athlete_id IN ARRAY p_athlete_ids
        LOOP
            INSERT INTO Athlete_Session (
                Session_ID,
                Athlete_ID,
                RPE
            ) VALUES (
                p_session_id,
                v_athlete_id,
                p_default_rpe
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RAISE NOTICE 'Training session % logged with % athletes.', p_session_id, array_length(p_athlete_ids, 1);
END;
$$;

COMMENT ON PROCEDURE sp_log_training_session_with_attendance IS
'Atomically inserts a training session and populates attendance records for a squad.';


-- -----------------------------------------------------------------------------
-- Procedure 2: sp_clear_athlete_injuries
-- Purpose: Bulk updates active injuries for an athlete to "Cleared" and logs
-- the status update with return date stamp.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_clear_athlete_injuries(
    p_athlete_id UUID,
    p_cleared_date DATE DEFAULT CURRENT_DATE
)
LANGUAGE plpgsql AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE Injury_Record
    SET Recovery_Status = 'Cleared',
        Expected_Return = LEAST(Expected_Return, p_cleared_date)
    WHERE Athlete_ID = p_athlete_id
      AND Recovery_Status IN ('Active', 'Recovering');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Cleared % active injury records for athlete %.', v_count, p_athlete_id;
END;
$$;

COMMENT ON PROCEDURE sp_clear_athlete_injuries IS
'Sets active or recovering injuries to Cleared for an athlete, lifting score penalties.';


-- =============================================================================
-- 3. CURSOR (1 Required)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function / Procedure with Cursor: fn_scan_high_risk_athletes_cursor
-- Purpose: Uses an explicit PL/pgSQL CURSOR to iterate over the athlete population,
-- fetch their latest biometric data, compute physiological stress, and return
-- a summary report of athletes in the High / Moderate alert state.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_scan_high_risk_athletes_cursor()
RETURNS TABLE (
    athlete_id UUID,
    athlete_name TEXT,
    team_name VARCHAR(100),
    fatigue_score NUMERIC(4,2),
    sleep_score NUMERIC(5,2),
    risk_level VARCHAR(20),
    action_required TEXT
) AS $$
DECLARE
    -- Explicit cursor definition
    cur_athletes CURSOR FOR
        SELECT 
            a.Athlete_ID,
            a.First_Name || ' ' || a.Last_Name AS Full_Name,
            t.Team_Name,
            bl.Fatigue_Score,
            bl.Sleep_Score
        FROM Athlete a
        JOIN Team t ON t.Team_ID = a.Team_ID
        JOIN LATERAL (
            SELECT b.Fatigue_Score, b.Sleep_Score
            FROM Biometric_Log b
            WHERE b.Athlete_ID = a.Athlete_ID
            ORDER BY b.Recorded_At DESC
            LIMIT 1
        ) bl ON TRUE;

    v_rec RECORD;
    v_risk VARCHAR(20);
BEGIN
    -- Open cursor
    OPEN cur_athletes;

    LOOP
        -- Fetch next row from cursor
        FETCH cur_athletes INTO v_rec;
        EXIT WHEN NOT FOUND;

        v_risk := fn_get_athlete_injury_risk(v_rec.Fatigue_Score, v_rec.Sleep_Score);

        IF v_risk IN ('High', 'Moderate') THEN
            athlete_id := v_rec.Athlete_ID;
            athlete_name := v_rec.Full_Name;
            team_name := v_rec.Team_Name;
            fatigue_score := v_rec.Fatigue_Score;
            sleep_score := v_rec.Sleep_Score;
            risk_level := v_risk;
            
            IF v_risk = 'High' THEN
                action_required := 'CRITICAL: Mandatory load reduction. Prohibit high-speed drills.';
            ELSE
                action_required := 'MONITOR: Adjust plyometrics and provide recovery shake.';
            END IF;

            RETURN NEXT;
        END IF;
    END LOOP;

    -- Close cursor
    CLOSE cur_athletes;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_scan_high_risk_athletes_cursor IS
'Iterates over all athletes using an explicit cursor and returns high/moderate risk flagged athletes.';


-- =============================================================================
-- 4. TRIGGERS (2 Required)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Audit / Log Table for Triggers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Biometric_Alert_Audit (
    Alert_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    Athlete_ID UUID NOT NULL REFERENCES Athlete(Athlete_ID) ON DELETE CASCADE,
    Alert_Type VARCHAR(50) NOT NULL,
    Severity VARCHAR(20) NOT NULL,
    Message TEXT NOT NULL,
    Created_At TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Trigger 1: trg_check_overtraining_alert
-- Event: BEFORE / AFTER INSERT ON Biometric_Log
-- Purpose: Automatically intercepts new biometric log rows and writes an alert
-- record into Biometric_Alert_Audit if fatigue or sleep breach acute safety limits.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_check_overtraining()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Fatigue_Score > 7.0 OR NEW.Sleep_Score < 40.0 THEN
        INSERT INTO Biometric_Alert_Audit (
            Athlete_ID,
            Alert_Type,
            Severity,
            Message
        ) VALUES (
            NEW.Athlete_ID,
            'Overtraining Warning',
            'High',
            FORMAT('Fatigue score elevated (%s/10) or Sleep severely depressed (%s%%) at %s.',
                   NEW.Fatigue_Score, NEW.Sleep_Score, NEW.Recorded_At)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_biometric_overtraining ON Biometric_Log;
CREATE TRIGGER trg_biometric_overtraining
AFTER INSERT ON Biometric_Log
FOR EACH ROW
EXECUTE FUNCTION fn_trg_check_overtraining();

COMMENT ON TRIGGER trg_biometric_overtraining ON Biometric_Log IS
'Automatically logs an audit alert when acute fatigue or sleep breach clinical thresholds.';


-- -----------------------------------------------------------------------------
-- Trigger 2: trg_audit_injury_status_change
-- Event: AFTER UPDATE OF Recovery_Status ON Injury_Record
-- Purpose: Tracks all medical clearance transitions and recovery status changes
-- into the audit log for medical accountability and sports science tracking.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_audit_injury_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.Recovery_Status IS DISTINCT FROM NEW.Recovery_Status THEN
        INSERT INTO Biometric_Alert_Audit (
            Athlete_ID,
            Alert_Type,
            Severity,
            Message
        ) VALUES (
            NEW.Athlete_ID,
            'Injury Status Transition',
            CASE WHEN NEW.Recovery_Status = 'Cleared' THEN 'Info' ELSE 'Moderate' END,
            FORMAT('Injury (%s - %s) transitioned from "%s" to "%s".',
                   NEW.Injury_Type, NEW.Body_Part, OLD.Recovery_Status, NEW.Recovery_Status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_injury_status_audit ON Injury_Record;
CREATE TRIGGER trg_injury_status_audit
AFTER UPDATE OF Recovery_Status ON Injury_Record
FOR EACH ROW
EXECUTE FUNCTION fn_trg_audit_injury_status();

COMMENT ON TRIGGER trg_injury_status_audit ON Injury_Record IS
'Audits all injury recovery status transitions (e.g. Active -> Cleared) for sports medicine tracking.';
