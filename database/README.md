# Database Layer — Phase 1

This folder contains the entire PostgreSQL database definition for the Athlete
Performance & Sports Science Intelligence Platform.

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Creates all 10 tables in FK-dependency order with CHECK constraints, comments, and UUID PKs |
| `views.sql`  | Creates the `Athlete_Readiness` view — live readiness scores with injury penalty |
| `seed.sql`   | Inserts 2 coaches, 2 teams, 6 athletes, 84 biometric logs, 5 sessions, 8 drills, 2 injuries |

## Setup Instructions

```bash
# 1. Create the database
createdb athlete_platform

# 2. Run schema (tables)
psql -d athlete_platform -f schema.sql

# 3. Run views
psql -d athlete_platform -f views.sql

# 4. Seed with sample data
psql -d athlete_platform -f seed.sql

# 5. Verify
psql -d athlete_platform -c "SELECT Athlete_Name, Readiness_Score, Injury_Risk FROM Athlete_Readiness ORDER BY Readiness_Score DESC;"
```

## Readiness Formula

```
Base Score =
  (Sleep_Score  × 0.30)           -- sleep quality (largest recovery driver)
  + (LEAST(HRV_ms, 100) × 0.25)  -- HRV capped at 100 to handle outliers
  + ((10 - Fatigue_Score) × 10 × 0.25)  -- inverted fatigue, scaled 0-100
  + (Hydration_pct × 0.20)        -- hydration effect on sustained output

Injury Penalty:
  Active + Severe   → -40
  Active + Moderate → -20
  Active + Minor    → -10
  Recovering / Cleared → 0

Final = GREATEST(0, LEAST(100, Base - Penalty))
```
