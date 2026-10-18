-- =============================================================================
-- Athlete Performance & Sports Science Intelligence Platform
-- EXPANDED SEED DATA: Ensures at least 10 meaningful records per table
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. COACHES (Add 8 more coaches -> Total = 10)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Coach (Coach_ID, First_Name, Last_Name, Email, Speciality, Cert_Level) VALUES
('00000000-0000-0000-0000-000000000103', 'Liam', 'Vance', 'liam.vance@sportscience.com', 'Biomechanics & Gait Analysis', 'CSCS')
ON CONFLICT (Coach_ID) DO NOTHING;

INSERT INTO Coach (Coach_ID, First_Name, Last_Name, Email, Speciality, Cert_Level) VALUES
('00000000-0000-0000-0000-000000000104', 'Sarah', 'Chen', 'sarah.chen@sportscience.com', 'Sports Nutrition & Hydration', 'CISSN')
ON CONFLICT (Coach_ID) DO NOTHING;

INSERT INTO Coach (Coach_ID, First_Name, Last_Name, Email, Speciality, Cert_Level) VALUES
('00000000-0000-0000-0000-000000000105', 'Carlos', 'Mendoza', 'carlos.mendoza@sportscience.com', 'High Performance & Speed Dev', 'USATF-3')
ON CONFLICT (Coach_ID) DO NOTHING;

INSERT INTO Coach (Coach_ID, First_Name, Last_Name, Email, Speciality, Cert_Level) VALUES
('00000000-0000-0000-0000-000000000106', 'Emma', 'Johansson', 'emma.johansson@sportscience.com', 'Rehabilitation & Return-To-Play', 'PT-DPT')
ON CONFLICT (Coach_ID) DO NOTHING;

INSERT INTO Coach (Coach_ID, First_Name, Last_Name, Email, Speciality, Cert_Level) VALUES
('00000000-0000-0000-0000-000000000107', 'David', 'Kim', 'david.kim@sportscience.com', 'Neuromuscular Activation', 'NASM-PES')
ON CONFLICT (Coach_ID) DO NOTHING;

INSERT INTO Coach (Coach_ID, First_Name, Last_Name, Email, Speciality, Cert_Level) VALUES
('00000000-0000-0000-0000-000000000108', 'Fatima', 'Al-Mansoor', 'fatima.almansoor@sportscience.com', 'Physiology & Recovery Science', 'ACSM-EP')
ON CONFLICT (Coach_ID) DO NOTHING;

INSERT INTO Coach (Coach_ID, First_Name, Last_Name, Email, Speciality, Cert_Level) VALUES
('00000000-0000-0000-0000-000000000109', 'Nils', 'Lindqvist', 'nils.lindqvist@sportscience.com', 'Cardiorespiratory Endurance', 'ACSM-CEP')
ON CONFLICT (Coach_ID) DO NOTHING;

INSERT INTO Coach (Coach_ID, First_Name, Last_Name, Email, Speciality, Cert_Level) VALUES
('00000000-0000-0000-0000-000000000110', 'Chloe', 'Dubois', 'chloe.dubois@sportscience.com', 'Youth Athletic Development', 'CSCS')
ON CONFLICT (Coach_ID) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TEAMS (Add 8 more teams -> Total = 10)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Team (Team_ID, Team_Name, Sport_Type, Coach_ID) VALUES
('00000000-0000-0000-0000-000000000203', 'Apex Track & Field', 'Athletics', '00000000-0000-0000-0000-000000000105')
ON CONFLICT (Team_ID) DO NOTHING;

INSERT INTO Team (Team_ID, Team_Name, Sport_Type, Coach_ID) VALUES
('00000000-0000-0000-0000-000000000204', 'Vanguard Swimming', 'Swimming', '00000000-0000-0000-0000-000000000109')
ON CONFLICT (Team_ID) DO NOTHING;

INSERT INTO Team (Team_ID, Team_Name, Sport_Type, Coach_ID) VALUES
('00000000-0000-0000-0000-000000000205', 'Titan Rugby Club', 'Rugby', '00000000-0000-0000-0000-000000000103')
ON CONFLICT (Team_ID) DO NOTHING;

INSERT INTO Team (Team_ID, Team_Name, Sport_Type, Coach_ID) VALUES
('00000000-0000-0000-0000-000000000206', 'Solaris Volleyball', 'Volleyball', '00000000-0000-0000-0000-000000000107')
ON CONFLICT (Team_ID) DO NOTHING;

INSERT INTO Team (Team_ID, Team_Name, Sport_Type, Coach_ID) VALUES
('00000000-0000-0000-0000-000000000207', 'Glacier Ice Hockey', 'Ice Hockey', '00000000-0000-0000-0000-000000000106')
ON CONFLICT (Team_ID) DO NOTHING;

INSERT INTO Team (Team_ID, Team_Name, Sport_Type, Coach_ID) VALUES
('00000000-0000-0000-0000-000000000208', 'Tempest Rowing', 'Rowing', '00000000-0000-0000-0000-000000000108')
ON CONFLICT (Team_ID) DO NOTHING;

INSERT INTO Team (Team_ID, Team_Name, Sport_Type, Coach_ID) VALUES
('00000000-0000-0000-0000-000000000209', 'Eclipse Tennis Academy', 'Tennis', '00000000-0000-0000-0000-000000000104')
ON CONFLICT (Team_ID) DO NOTHING;

INSERT INTO Team (Team_ID, Team_Name, Sport_Type, Coach_ID) VALUES
('00000000-0000-0000-0000-000000000210', 'Spartan Cross Country', 'Cross Country', '00000000-0000-0000-0000-000000000110')
ON CONFLICT (Team_ID) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ATHLETES (Add 6 more athletes -> Total = 12)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Athlete (Athlete_ID, Team_ID, First_Name, Last_Name, DOB, Height_cm, Weight_kg) VALUES
('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000203', 'Mateo', 'Silva', '2002-04-12', 183.0, 74.5),
('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000203', 'Zara', 'Okafor', '2001-09-30', 170.0, 59.0),
('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000204', 'Lucas', 'Brunner', '1999-11-18', 190.5, 86.0),
('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000205', 'Tariq', 'Al-Hassan', '2000-06-25', 188.0, 98.0),
('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000206', 'Hannah', 'Van Der Beek', '2003-01-08', 182.0, 68.0),
('00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000207', 'Viktor', 'Larsson', '1998-08-14', 186.0, 92.5)
ON CONFLICT (Athlete_ID) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ATHLETE POSITIONS (Add positions for new athletes -> Total >= 15)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Athlete_Position (Athlete_ID, Position_Name) VALUES
('00000000-0000-0000-0000-000000000307', 'Sprinter'),
('00000000-0000-0000-0000-000000000307', 'Long Jumper'),
('00000000-0000-0000-0000-000000000308', 'Hurdler'),
('00000000-0000-0000-0000-000000000309', 'Freestyle Specialist'),
('00000000-0000-0000-0000-000000000310', 'Fly-Half'),
('00000000-0000-0000-0000-000000000311', 'Outside Hitter'),
('00000000-0000-0000-0000-000000000312', 'Defenceman')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. EMERGENCY CONTACTS (Add contacts -> Total >= 14)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Emergency_Contact (Athlete_ID, Contact_Phone, Contact_Name, Relationship) VALUES
('00000000-0000-0000-0000-000000000307', '+1-555-0701', 'Luisa Silva', 'Mother'),
('00000000-0000-0000-0000-000000000308', '+1-555-0801', 'Emeka Okafor', 'Father'),
('00000000-0000-0000-0000-000000000309', '+1-555-0901', 'Astrid Brunner', 'Spouse'),
('00000000-0000-0000-0000-000000000310', '+1-555-1001', 'Zayd Al-Hassan', 'Brother'),
('00000000-0000-0000-0000-000000000311', '+1-555-1101', 'Gerrit Van Der Beek', 'Father'),
('00000000-0000-0000-0000-000000000312', '+1-555-1201', 'Freja Larsson', 'Mother')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. BIOMETRIC LOGS FOR NEW ATHLETES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Biometric_Log (Athlete_ID, Recorded_At, Heart_Rate, HRV_ms, Sleep_Score, Sleep_Hours, VO2_Max, Fatigue_Score, Hydration_pct) VALUES
('00000000-0000-0000-0000-000000000307', NOW(), 52, 94.0, 88.0, 8.5, 61.2, 2.5, 90.0),
('00000000-0000-0000-0000-000000000308', NOW(), 56, 82.0, 79.0, 7.8, 55.4, 3.8, 84.0),
('00000000-0000-0000-0000-000000000309', NOW(), 48, 102.0, 92.0, 9.0, 68.0, 2.0, 95.0),
('00000000-0000-0000-0000-000000000310', NOW(), 64, 68.0, 72.0, 7.2, 52.0, 5.0, 80.0),
('00000000-0000-0000-0000-000000000311', NOW(), 58, 78.0, 84.0, 8.0, 54.5, 3.2, 88.0),
('00000000-0000-0000-0000-000000000312', NOW(), 60, 74.0, 76.0, 7.5, 56.0, 4.5, 82.0)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TRAINING SESSIONS (Add 7 more sessions -> Total = 12)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Training_Session (Session_ID, Session_Date, Session_Type, Duration_min, Intensity) VALUES
('00000000-0000-0000-0000-000000000406', '2026-10-18', 'Sprint Intervals', 60, 'Max'),
('00000000-0000-0000-0000-000000000407', '2026-10-18', 'Threshold Swim', 90, 'High'),
('00000000-0000-0000-0000-000000000408', '2026-10-18', 'Tackle & Ruck Conditioning', 75, 'High'),
('00000000-0000-0000-0000-000000000409', '2026-10-19', 'Vertical Jump & Plyometrics', 50, 'High'),
('00000000-0000-0000-0000-000000000410', '2026-10-19', 'Power Skating & Deceleration', 65, 'Max'),
('00000000-0000-0000-0000-000000000411', '2026-10-19', 'Anaerobic Lactic Capacity', 80, 'Max'),
('00000000-0000-0000-0000-000000000412', '2026-10-20', 'Active Neuromuscular Flush', 45, 'Low')
ON CONFLICT (Session_ID) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ATHLETE SESSIONS (Add participation records -> Total >= 35)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Athlete_Session (Session_ID, Athlete_ID, RPE) VALUES
('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000307', 9),
('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000308', 8),
('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000309', 7),
('00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000310', 8),
('00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000311', 7),
('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000312', 9),
('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000305', 8),
('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000302', 3)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. DRILL TELEMETRY (Add drills -> Total >= 15)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Drill_Telemetry (Drill_ID, Session_ID, Athlete_ID, Recorded_At, Drill_Type, Top_Speed_kmh, Avg_Speed_kmh, Distance_m, Accel_ms2) VALUES
('00000000-0000-0000-0000-000000000609', '00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000307', '2026-10-18 09:15:00+00', 'Flying 30m', 34.20, 29.50, 300.00, 6.20),
('00000000-0000-0000-0000-000000000610', '00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000308', '2026-10-18 09:20:00+00', '100m Hurdle Sprint', 28.50, 23.40, 400.00, 4.90),
('00000000-0000-0000-0000-000000000611', '00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000309', '2026-10-18 10:45:00+00', 'Tumble Turn Sprint', 7.50, 6.10, 500.00, 2.10),
('00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000310', '2026-10-18 14:20:00+00', 'Maul Drive Drill', 18.20, 12.40, 250.00, 4.10),
('00000000-0000-0000-0000-000000000613', '00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000311', '2026-10-19 08:45:00+00', 'Approach Spike Jump', 21.00, 15.00, 180.00, 5.40),
('00000000-0000-0000-0000-000000000614', '00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000312', '2026-10-19 11:20:00+00', 'Slalom Crossover', 31.80, 25.10, 350.00, 5.90),
('00000000-0000-0000-0000-000000000615', '00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000305', '2026-10-19 15:20:00+00', 'Wing Counter-Attack', 33.10, 27.00, 420.00, 5.60)
ON CONFLICT (Drill_ID) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. INJURY RECORDS (Add more injuries -> Total >= 10)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO Injury_Record (Injury_ID, Athlete_ID, Injury_Date, Injury_Type, Severity, Body_Part, Recovery_Status, Expected_Return) VALUES
('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000307', '2026-09-10', 'Plantar Fasciitis', 'Minor', 'Right Heel', 'Cleared', '2026-09-24'),
('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000308', '2026-08-15', 'Shin Splints', 'Minor', 'Left Tibia', 'Cleared', '2026-08-30'),
('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000309', '2026-09-01', 'Rotator Cuff Impingement', 'Moderate', 'Right Shoulder', 'Recovering', '2026-11-05'),
('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000310', '2026-07-20', 'Acromioclavicular Separation', 'Severe', 'Left Shoulder', 'Cleared', '2026-09-15'),
('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000311', '2026-10-02', 'Patellar Tendinopathy', 'Minor', 'Left Knee', 'Recovering', '2026-10-25'),
('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000312', '2026-08-01', 'Groin Strain', 'Moderate', 'Right Adductor', 'Cleared', '2026-08-28'),
('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000306', '2026-09-18', 'Lumbar Strain', 'Minor', 'Lower Back', 'Cleared', '2026-10-02'),
('00000000-0000-0000-0000-000000000510', '00000000-0000-0000-0000-000000000305', '2026-06-12', 'Wrist Hyperextension', 'Minor', 'Right Wrist', 'Cleared', '2026-06-25')
ON CONFLICT (Injury_ID) DO NOTHING;
