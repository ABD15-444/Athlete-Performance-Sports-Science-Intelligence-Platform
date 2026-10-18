-- =============================================================================
-- Athlete Performance & Sports Science Intelligence Platform
-- DATABASE SCHEMA
--
-- Table creation order respects all foreign-key dependencies:
--   Coach → Team → Athlete → (Position, Emergency_Contact,
--   Biometric_Log, Injury_Record, Athlete_Session) → Training_Session
--   → Drill_Telemetry
--
-- All UUID primary keys use gen_random_uuid() (provided by pgcrypto).
-- All user-supplied values use parameterised queries in the API layer;
-- the schema itself enforces domain integrity via CHECKs and NOT NULLs.
-- =============================================================================

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Coach
--    Stores coaching staff.  Email must be globally unique.
-- -----------------------------------------------------------------------------
CREATE TABLE Coach (
    Coach_ID   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    First_Name VARCHAR(50)  NOT NULL,
    Last_Name  VARCHAR(50)  NOT NULL,
    Email      VARCHAR(150) NOT NULL UNIQUE,
    Speciality VARCHAR(100),
    Cert_Level VARCHAR(50)
);

COMMENT ON TABLE  Coach             IS 'Coaching staff records.';
COMMENT ON COLUMN Coach.Cert_Level  IS 'E.g. CSCS, ACSM-CEP, UEFA-B.';

-- -----------------------------------------------------------------------------
-- 2. Team
--    Each team is managed by exactly one coach (FK → Coach).
-- -----------------------------------------------------------------------------
CREATE TABLE Team (
    Team_ID    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    Team_Name  VARCHAR(100) NOT NULL,
    Sport_Type VARCHAR(50)  NOT NULL,
    Coach_ID   UUID         NOT NULL REFERENCES Coach (Coach_ID) ON DELETE RESTRICT
);

COMMENT ON TABLE Team IS 'Sports teams; each belongs to one coach.';

-- -----------------------------------------------------------------------------
-- 3. Athlete
--    Core entity.  Team_ID is NOT NULL — every athlete must belong to a team.
-- -----------------------------------------------------------------------------
CREATE TABLE Athlete (
    Athlete_ID  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    First_Name  VARCHAR(50)  NOT NULL,
    Middle_Name VARCHAR(50),
    Last_Name   VARCHAR(50)  NOT NULL,
    DOB         DATE         NOT NULL,
    Height_cm   NUMERIC(5,1) CHECK (Height_cm > 0),
    Weight_kg   NUMERIC(5,2) CHECK (Weight_kg > 0),
    Team_ID     UUID         NOT NULL REFERENCES Team (Team_ID) ON DELETE RESTRICT,
    Created_At  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  Athlete          IS 'Core athlete entity.  Every athlete must have a team.';
COMMENT ON COLUMN Athlete.Team_ID  IS 'NOT NULL — an athlete without a team cannot exist.';

-- -----------------------------------------------------------------------------
-- 4. Athlete_Position
--    Models the multivalued position attribute (e.g. PG + SG in basketball).
--    Composite primary key (Athlete_ID, Position_Name).
-- -----------------------------------------------------------------------------
CREATE TABLE Athlete_Position (
    Athlete_ID    UUID        NOT NULL REFERENCES Athlete (Athlete_ID) ON DELETE CASCADE,
    Position_Name VARCHAR(50) NOT NULL,
    PRIMARY KEY (Athlete_ID, Position_Name)
);

COMMENT ON TABLE Athlete_Position IS 'Multivalued attribute: one athlete may play multiple positions.';

-- -----------------------------------------------------------------------------
-- 5. Emergency_Contact
--    Weak entity — existence depends on Athlete.
--    Composite PK (Athlete_ID, Contact_Phone) ensures no duplicate numbers
--    for the same athlete.
-- -----------------------------------------------------------------------------
CREATE TABLE Emergency_Contact (
    Athlete_ID    UUID         NOT NULL REFERENCES Athlete (Athlete_ID) ON DELETE CASCADE,
    Contact_Phone VARCHAR(20)  NOT NULL,
    Contact_Name  VARCHAR(100) NOT NULL,
    Relationship  VARCHAR(50),
    PRIMARY KEY (Athlete_ID, Contact_Phone)
);

COMMENT ON TABLE Emergency_Contact IS 'Weak entity: phone numbers for athlete emergency contacts.';

-- -----------------------------------------------------------------------------
-- 6. Biometric_Log
--    Wearable data (Whoop / Fitbit / manual entry) recorded per athlete.
--    HRV_ms, Fatigue_Score, Hydration_pct feed the Readiness formula in
--    the Athlete_Readiness view.
-- -----------------------------------------------------------------------------
CREATE TABLE Biometric_Log (
    Log_ID        UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    Athlete_ID    UUID           NOT NULL REFERENCES Athlete (Athlete_ID) ON DELETE CASCADE,
    Recorded_At   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    Heart_Rate    INT            CHECK (Heart_Rate BETWEEN 30 AND 220),
    HRV_ms        NUMERIC(6, 2)  CHECK (HRV_ms >= 0),
    Sleep_Score   NUMERIC(5, 2)  CHECK (Sleep_Score BETWEEN 0 AND 100),
    Sleep_Hours   NUMERIC(4, 2)  CHECK (Sleep_Hours BETWEEN 0 AND 24),
    VO2_Max       NUMERIC(5, 2)  CHECK (VO2_Max >= 0),
    Fatigue_Score NUMERIC(4, 2)  CHECK (Fatigue_Score BETWEEN 0 AND 10),
    Hydration_pct NUMERIC(5, 2)  CHECK (Hydration_pct BETWEEN 0 AND 100)
);

COMMENT ON TABLE  Biometric_Log             IS 'Daily wearable data per athlete; feeds the Readiness view.';
COMMENT ON COLUMN Biometric_Log.HRV_ms      IS 'Heart Rate Variability in milliseconds.';
COMMENT ON COLUMN Biometric_Log.Sleep_Score IS 'Composite sleep quality score 0-100.';

-- -----------------------------------------------------------------------------
-- 7. Training_Session
--    A single training event shared by multiple athletes (resolved via
--    the Athlete_Session join table).
-- -----------------------------------------------------------------------------
CREATE TABLE Training_Session (
    Session_ID   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    Session_Date DATE        NOT NULL,
    Session_Type VARCHAR(50) NOT NULL,
    Duration_min INT         NOT NULL CHECK (Duration_min > 0),
    Intensity    VARCHAR(10) NOT NULL
        CHECK (Intensity IN ('Low', 'Moderate', 'High', 'Max'))
);

COMMENT ON TABLE  Training_Session           IS 'One training event; many athletes attend via Athlete_Session.';
COMMENT ON COLUMN Training_Session.Intensity IS 'Allowed values: Low | Moderate | High | Max.';

-- -----------------------------------------------------------------------------
-- 8. Athlete_Session
--    Join table: links athletes to sessions.
--    RPE (Rate of Perceived Exertion) is athlete-specific — it records how
--    hard THIS athlete found the session, not the session intensity itself.
-- -----------------------------------------------------------------------------
CREATE TABLE Athlete_Session (
    Athlete_ID UUID NOT NULL REFERENCES Athlete          (Athlete_ID) ON DELETE CASCADE,
    Session_ID UUID NOT NULL REFERENCES Training_Session (Session_ID) ON DELETE CASCADE,
    RPE        INT  CHECK (RPE BETWEEN 1 AND 10),
    PRIMARY KEY (Athlete_ID, Session_ID)
);

COMMENT ON TABLE  Athlete_Session     IS 'Join table linking athletes to training sessions.';
COMMENT ON COLUMN Athlete_Session.RPE IS 'Rate of Perceived Exertion: 1 (very easy) to 10 (maximal).';

-- -----------------------------------------------------------------------------
-- 9. Drill_Telemetry
--    GPS / speed sensor data captured per drill within a session.
--    Linked to both Session and Athlete so individual performance can be
--    compared within a shared session.
-- -----------------------------------------------------------------------------
CREATE TABLE Drill_Telemetry (
    Drill_ID      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    Session_ID    UUID           NOT NULL REFERENCES Training_Session (Session_ID) ON DELETE CASCADE,
    Athlete_ID    UUID           NOT NULL REFERENCES Athlete          (Athlete_ID) ON DELETE CASCADE,
    Recorded_At   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    Drill_Type    VARCHAR(50),
    Top_Speed_kmh NUMERIC(5, 2)  CHECK (Top_Speed_kmh >= 0),
    Avg_Speed_kmh NUMERIC(5, 2)  CHECK (Avg_Speed_kmh >= 0),
    Distance_m    NUMERIC(8, 2)  CHECK (Distance_m >= 0),
    Accel_ms2     NUMERIC(5, 3)  CHECK (Accel_ms2 >= 0)
);

COMMENT ON TABLE Drill_Telemetry IS 'GPS/accelerometer data per drill per athlete within a session.';

-- -----------------------------------------------------------------------------
-- 10. Injury_Record
--     Logged by medical staff.  Recovery_Status drives the readiness penalty:
--       Active     → penalty applied  (see Athlete_Readiness view)
--       Recovering → no penalty (athlete managed but training normally)
--       Cleared    → no penalty (fully fit)
-- -----------------------------------------------------------------------------
CREATE TABLE Injury_Record (
    Injury_ID       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    Athlete_ID      UUID         NOT NULL REFERENCES Athlete (Athlete_ID) ON DELETE CASCADE,
    Injury_Date     DATE         NOT NULL,
    Injury_Type     VARCHAR(100) NOT NULL,
    Severity        VARCHAR(10)  NOT NULL
        CHECK (Severity IN ('Minor', 'Moderate', 'Severe')),
    Body_Part       VARCHAR(50),
    Recovery_Status VARCHAR(15)  NOT NULL DEFAULT 'Active'
        CHECK (Recovery_Status IN ('Active', 'Recovering', 'Cleared')),
    Expected_Return DATE
);

COMMENT ON COLUMN Injury_Record.Severity        IS 'Minor | Moderate | Severe — drives readiness penalty magnitude.';
COMMENT ON COLUMN Injury_Record.Recovery_Status IS 'Active => penalty applied; Recovering | Cleared => no penalty.';
