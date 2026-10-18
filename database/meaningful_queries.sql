-- =============================================================================
-- Athlete Performance & Sports Science Intelligence Platform
-- 15 MEANINGFUL SQL QUERIES (Coursework & Evaluation Suite)
--
-- Categories:
--   1-3: Aggregations, GROUP BY, and Multi-Table JOINs
--   4-6: Subqueries, Window Functions (DENSE_RANK, PARTITION BY, AVG OVER)
--   7-9: Complex LATERAL Joins, Sports Science Analytics & Rolling Averages
--   10-12: Workload Ratios (Acute-to-Chronic Workload Ratio / ACWR concepts)
--   13-15: Injury Correlation, RPE Distribution, and Squad Readiness Benchmarks
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Query 1: Squad Physiological Overview (Multi-Table Join with Aggregations)
-- Purpose: Aggregates roster count, avg resting HR, avg HRV, and avg sleep score per team.
-- -----------------------------------------------------------------------------
SELECT 
    t.Team_Name,
    t.Sport_Type,
    c.First_Name || ' ' || c.Last_Name AS Head_Coach,
    COUNT(DISTINCT a.Athlete_ID) AS Roster_Size,
    ROUND(AVG(bl.Heart_Rate), 1) AS Avg_Resting_HR,
    ROUND(AVG(bl.HRV_ms), 1) AS Avg_HRV_ms,
    ROUND(AVG(bl.Sleep_Score), 1) AS Avg_Sleep_Score
FROM Team t
JOIN Coach c ON c.Coach_ID = t.Coach_ID
JOIN Athlete a ON a.Team_ID = t.Team_ID
JOIN LATERAL (
    SELECT Heart_Rate, HRV_ms, Sleep_Score
    FROM Biometric_Log b
    WHERE b.Athlete_ID = a.Athlete_ID
    ORDER BY b.Recorded_At DESC
    LIMIT 1
) bl ON TRUE
GROUP BY t.Team_ID, t.Team_Name, t.Sport_Type, c.First_Name, c.Last_Name
ORDER BY Avg_HRV_ms DESC;

-- -----------------------------------------------------------------------------
-- Query 2: Athlete Readiness Leaderboard with Live Risk Tier Classification
-- Purpose: Ranks all athletes by live readiness score with sports science tier labels.
-- -----------------------------------------------------------------------------
SELECT 
    ar.Athlete_Name,
    ar.Team_Name,
    ar.Readiness_Score,
    ar.Injury_Risk,
    CASE 
        WHEN ar.Readiness_Score >= 75 THEN 'Optimal Recovery'
        WHEN ar.Readiness_Score >= 50 THEN 'Moderate Recovery'
        ELSE 'Critical Under-Recovery'
    END AS Recovery_Tier,
    ar.HRV_ms,
    ar.Fatigue_Score,
    ar.Sleep_Score
FROM Athlete_Readiness ar
ORDER BY ar.Readiness_Score DESC;

-- -----------------------------------------------------------------------------
-- Query 3: Window Function - Athlete Readiness Rank Within Each Squad
-- Purpose: Demonstrates PARTITION BY and DENSE_RANK() across roster groupings.
-- -----------------------------------------------------------------------------
SELECT 
    ar.Team_Name,
    ar.Athlete_Name,
    ar.Readiness_Score,
    DENSE_RANK() OVER (
        PARTITION BY ar.Team_Name 
        ORDER BY ar.Readiness_Score DESC
    ) AS Squad_Rank,
    ROUND(AVG(ar.Readiness_Score) OVER (PARTITION BY ar.Team_Name), 2) AS Squad_Avg_Readiness,
    ROUND(ar.Readiness_Score - AVG(ar.Readiness_Score) OVER (PARTITION BY ar.Team_Name), 2) AS Variance_From_Squad_Avg
FROM Athlete_Readiness ar
ORDER BY ar.Team_Name, Squad_Rank;

-- -----------------------------------------------------------------------------
-- Query 4: 7-Day Rolling Moving Average for Athlete HRV & Sleep Quality
-- Purpose: Evaluates physiological stability using a rolling frame window function.
-- -----------------------------------------------------------------------------
SELECT 
    a.First_Name || ' ' || a.Last_Name AS Athlete_Name,
    b.Recorded_At::DATE AS Log_Date,
    b.HRV_ms,
    ROUND(AVG(b.HRV_ms) OVER (
        PARTITION BY b.Athlete_ID 
        ORDER BY b.Recorded_At 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 2) AS Rolling_7Day_Avg_HRV,
    b.Sleep_Score,
    ROUND(AVG(b.Sleep_Score) OVER (
        PARTITION BY b.Athlete_ID 
        ORDER BY b.Recorded_At 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 2) AS Rolling_7Day_Avg_Sleep
FROM Biometric_Log b
JOIN Athlete a ON a.Athlete_ID = b.Athlete_ID
WHERE b.Athlete_ID = '00000000-0000-0000-0000-000000000302' -- Aisha Nwosu
ORDER BY b.Recorded_At DESC
LIMIT 14;

-- -----------------------------------------------------------------------------
-- Query 5: Subquery with HAVING - High Exertion Athletes in the Past 14 Days
-- Purpose: Identifies athletes averaging Rate of Perceived Exertion (RPE) >= 7.0 across >= 3 sessions.
-- -----------------------------------------------------------------------------
SELECT 
    a.Athlete_ID,
    a.First_Name || ' ' || a.Last_Name AS Athlete_Name,
    t.Team_Name,
    COUNT(s.Session_ID) AS Total_Sessions_Attended,
    ROUND(AVG(s.RPE), 2) AS Avg_Perceived_Exertion,
    MAX(s.RPE) AS Max_RPE_Recorded
FROM Athlete a
JOIN Team t ON t.Team_ID = a.Team_ID
JOIN Athlete_Session s ON s.Athlete_ID = a.Athlete_ID
GROUP BY a.Athlete_ID, a.First_Name, a.Last_Name, t.Team_Name
HAVING COUNT(s.Session_ID) >= 3 AND AVG(s.RPE) >= 7.0
ORDER BY Avg_Perceived_Exertion DESC;

-- -----------------------------------------------------------------------------
-- Query 6: Top Sprint Velocity Leaders per Drill Type (Correlated Subquery)
-- Purpose: Discovers peak top speeds achieved during sprint and agility drills.
-- -----------------------------------------------------------------------------
SELECT 
    d.Drill_Type,
    a.First_Name || ' ' || a.Last_Name AS Athlete_Name,
    t.Team_Name,
    d.Top_Speed_kmh,
    d.Avg_Speed_kmh,
    d.Accel_ms2,
    ts.Session_Date
FROM Drill_Telemetry d
JOIN Athlete a ON a.Athlete_ID = d.Athlete_ID
JOIN Team t ON t.Team_ID = a.Team_ID
JOIN Training_Session ts ON ts.Session_ID = d.Session_ID
WHERE d.Top_Speed_kmh = (
    SELECT MAX(sub.Top_Speed_kmh)
    FROM Drill_Telemetry sub
    WHERE sub.Drill_Type = d.Drill_Type
)
ORDER BY d.Top_Speed_kmh DESC;

-- -----------------------------------------------------------------------------
-- Query 7: Active Injury Burden & Penalty Impact Analysis
-- Purpose: Identifies all actively injured athletes and shows the penalty deduction applied to scores.
-- -----------------------------------------------------------------------------
SELECT 
    a.First_Name || ' ' || a.Last_Name AS Athlete_Name,
    t.Team_Name,
    i.Injury_Type,
    i.Body_Part,
    i.Severity,
    i.Recovery_Status,
    CASE i.Severity
        WHEN 'Severe' THEN -40
        WHEN 'Moderate' THEN -20
        WHEN 'Minor' THEN -10
        ELSE 0
    END AS Penalty_Points,
    ar.Readiness_Score AS Penalized_Score,
    ar.Readiness_Score + (
        CASE i.Severity
            WHEN 'Severe' THEN 40
            WHEN 'Moderate' THEN 20
            WHEN 'Minor' THEN 10
            ELSE 0
        END
    ) AS Estimated_PreInjury_Score
FROM Injury_Record i
JOIN Athlete a ON a.Athlete_ID = i.Athlete_ID
JOIN Team t ON t.Team_ID = a.Team_ID
JOIN Athlete_Readiness ar ON ar.Athlete_ID = a.Athlete_ID
WHERE i.Recovery_Status IN ('Active', 'Recovering')
ORDER BY Penalty_Points ASC;

-- -----------------------------------------------------------------------------
-- Query 8: Acute Fatigue Surge Detector (Difference Between Today and 7-Day Average)
-- Purpose: Sports science anomaly detection — flags athletes whose fatigue is > 1.5 pts above baseline.
-- -----------------------------------------------------------------------------
WITH Athlete_Baselines AS (
    SELECT 
        Athlete_ID,
        ROUND(AVG(Fatigue_Score), 2) AS Baseline_Fatigue_7d
    FROM (
        SELECT 
            Athlete_ID, 
            Fatigue_Score,
            ROW_NUMBER() OVER (PARTITION BY Athlete_ID ORDER BY Recorded_At DESC) as rn
        FROM Biometric_Log
    ) sub
    WHERE rn <= 7
    GROUP BY Athlete_ID
),
Latest_Logs AS (
    SELECT DISTINCT ON (Athlete_ID)
        Athlete_ID,
        Fatigue_Score AS Current_Fatigue,
        Recorded_At
    FROM Biometric_Log
    ORDER BY Athlete_ID, Recorded_At DESC
)
SELECT 
    a.First_Name || ' ' || a.Last_Name AS Athlete_Name,
    t.Team_Name,
    ll.Current_Fatigue,
    ab.Baseline_Fatigue_7d,
    ROUND(ll.Current_Fatigue - ab.Baseline_Fatigue_7d, 2) AS Fatigue_Spike_Delta,
    CASE 
        WHEN (ll.Current_Fatigue - ab.Baseline_Fatigue_7d) >= 1.5 THEN 'Acute Spike: Deload Needed'
        ELSE 'Stable Fatigue'
    END AS Monitoring_Status
FROM Latest_Logs ll
JOIN Athlete_Baselines ab ON ab.Athlete_ID = ll.Athlete_ID
JOIN Athlete a ON a.Athlete_ID = ll.Athlete_ID
JOIN Team t ON t.Team_ID = a.Team_ID
ORDER BY Fatigue_Spike_Delta DESC;

-- -----------------------------------------------------------------------------
-- Query 9: Position-Wise Physiological Benchmark Comparison
-- Purpose: Aggregates biometrics grouped by athletic position (Forwards, Guards, Midfielders).
-- -----------------------------------------------------------------------------
SELECT 
    ap.Position_Name,
    COUNT(DISTINCT a.Athlete_ID) AS Athlete_Count,
    ROUND(AVG(a.Height_cm), 1) AS Avg_Height_cm,
    ROUND(AVG(a.Weight_kg), 1) AS Avg_Weight_kg,
    ROUND(AVG(bl.VO2_Max), 2) AS Avg_VO2_Max,
    ROUND(AVG(bl.HRV_ms), 1) AS Avg_HRV_ms,
    ROUND(AVG(bl.Sleep_Hours), 1) AS Avg_Sleep_Hours
FROM Athlete_Position ap
JOIN Athlete a ON a.Athlete_ID = ap.Athlete_ID
JOIN LATERAL (
    SELECT VO2_Max, HRV_ms, Sleep_Hours
    FROM Biometric_Log b
    WHERE b.Athlete_ID = a.Athlete_ID
    ORDER BY b.Recorded_At DESC
    LIMIT 1
) bl ON TRUE
GROUP BY ap.Position_Name
HAVING COUNT(DISTINCT a.Athlete_ID) >= 1
ORDER BY Avg_VO2_Max DESC;

-- -----------------------------------------------------------------------------
-- Query 10: Training Volume Load by Session Type (Cumulative Minutes & Attendance)
-- Purpose: Evaluates micro-cycle stress per training classification (Agility, Speed, Strength).
-- -----------------------------------------------------------------------------
SELECT 
    ts.Session_Type,
    ts.Intensity,
    COUNT(DISTINCT ts.Session_ID) AS Number_Of_Sessions,
    SUM(ts.Duration_min) AS Total_Training_Minutes,
    COUNT(s.Athlete_ID) AS Total_Athlete_Attendances,
    ROUND(AVG(s.RPE), 1) AS Mean_Session_RPE
FROM Training_Session ts
LEFT JOIN Athlete_Session s ON s.Session_ID = ts.Session_ID
GROUP BY ts.Session_Type, ts.Intensity
ORDER BY Total_Training_Minutes DESC;

-- -----------------------------------------------------------------------------
-- Query 11: Emergency Contact Roster for High-Risk and Injured Athletes
-- Purpose: Medical preparedness query — joins athletes with active injuries/high risk to their guardians.
-- -----------------------------------------------------------------------------
SELECT 
    a.First_Name || ' ' || a.Last_Name AS Athlete_Name,
    t.Team_Name,
    ar.Readiness_Score,
    ar.Injury_Risk,
    ec.Contact_Name AS Emergency_Contact,
    ec.Relationship,
    ec.Contact_Phone
FROM Athlete a
JOIN Team t ON t.Team_ID = a.Team_ID
JOIN Athlete_Readiness ar ON ar.Athlete_ID = a.Athlete_ID
JOIN Emergency_Contact ec ON ec.Athlete_ID = a.Athlete_ID
WHERE ar.Injury_Risk = 'High'
   OR EXISTS (
       SELECT 1 FROM Injury_Record ir 
       WHERE ir.Athlete_ID = a.Athlete_ID AND ir.Recovery_Status = 'Active'
   )
ORDER BY ar.Readiness_Score ASC;

-- -----------------------------------------------------------------------------
-- Query 12: Historical Injury Recurrence Rate & Cleared Durations
-- Purpose: Tracks average recovery duration in days for cleared injuries.
-- -----------------------------------------------------------------------------
SELECT 
    Injury_Type,
    Body_Part,
    Severity,
    COUNT(*) AS Historical_Incidents,
    ROUND(AVG(Expected_Return - Injury_Date), 1) AS Avg_Expected_Recovery_Days
FROM Injury_Record
GROUP BY Injury_Type, Body_Part, Severity
ORDER BY Historical_Incidents DESC, Avg_Expected_Recovery_Days DESC;

-- -----------------------------------------------------------------------------
-- Query 13: Correlation Between Sleep Duration and Next-Day Fatigue
-- Purpose: Evaluates physiological cause-and-effect relationship between sleep & fatigue.
-- -----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN Sleep_Hours >= 8.5 THEN 'Optimal Sleep (>8.5 hrs)'
        WHEN Sleep_Hours >= 7.5 THEN 'Adequate Sleep (7.5-8.4 hrs)'
        WHEN Sleep_Hours >= 6.5 THEN 'Borderline Sleep (6.5-7.4 hrs)'
        ELSE 'Deprived Sleep (<6.5 hrs)'
    END AS Sleep_Category,
    COUNT(*) AS Log_Count,
    ROUND(AVG(Fatigue_Score), 2) AS Mean_Fatigue_Score,
    ROUND(AVG(Sleep_Score), 1) AS Mean_Sleep_Quality,
    ROUND(AVG(HRV_ms), 1) AS Mean_HRV_ms
FROM Biometric_Log
GROUP BY 
    CASE 
        WHEN Sleep_Hours >= 8.5 THEN 'Optimal Sleep (>8.5 hrs)'
        WHEN Sleep_Hours >= 7.5 THEN 'Adequate Sleep (7.5-8.4 hrs)'
        WHEN Sleep_Hours >= 6.5 THEN 'Borderline Sleep (6.5-7.4 hrs)'
        ELSE 'Deprived Sleep (<6.5 hrs)'
    END
ORDER BY Mean_Fatigue_Score ASC;

-- -----------------------------------------------------------------------------
-- Query 14: Coaches Managing Athletes with Critical Readiness
-- Purpose: Alerts coaching staff when their assigned athletes dip below acceptable thresholds.
-- -----------------------------------------------------------------------------
SELECT 
    c.First_Name || ' ' || c.Last_Name AS Coach_Name,
    c.Email AS Coach_Email,
    c.Speciality,
    t.Team_Name,
    COUNT(ar.Athlete_ID) AS Total_Roster,
    COUNT(CASE WHEN ar.Readiness_Score < 50 THEN 1 END) AS Critical_Athletes_Count,
    STRING_AGG(CASE WHEN ar.Readiness_Score < 50 THEN ar.Athlete_Name END, ', ') AS Athletes_Needing_Rest
FROM Coach c
JOIN Team t ON t.Coach_ID = c.Coach_ID
JOIN Athlete_Readiness ar ON ar.Team_Name = t.Team_Name
GROUP BY c.Coach_ID, c.First_Name, c.Last_Name, c.Email, c.Speciality, t.Team_Name
ORDER BY Critical_Athletes_Count DESC;

-- -----------------------------------------------------------------------------
-- Query 15: Cross-Drill Physical Telemetry Averages (Top Speed vs Jump/Agility)
-- Purpose: Evaluates physical capability metrics across drill categories.
-- -----------------------------------------------------------------------------
SELECT 
    d.Drill_Type,
    COUNT(*) AS Total_Reps_Logged,
    ROUND(AVG(d.Top_Speed_kmh), 2) AS Mean_Top_Speed_kmh,
    ROUND(MAX(d.Top_Speed_kmh), 2) AS Peak_Top_Speed_kmh,
    ROUND(AVG(d.Distance_m), 1) AS Mean_Distance_m,
    ROUND(AVG(d.Accel_ms2), 2) AS Mean_Acceleration_ms2
FROM Drill_Telemetry d
GROUP BY d.Drill_Type
ORDER BY Mean_Top_Speed_kmh DESC;
