# Python Database Connectivity Client (psycopg2)

This directory contains the standalone **Python Database Connectivity Module** for the Athlete Performance & Sports Science Intelligence Platform.

## 🚀 Capabilities Demonstrated
1. **Direct Connection via psycopg2**: Connects directly to PostgreSQL 18 with connection verification.
2. **Dynamic Queries**: Fetches live readiness scores calculated dynamically by the database view.
3. **Cursor Execution**: Calls `fn_scan_high_risk_athletes_cursor()` which uses an explicit PL/pgSQL `CURSOR` to scan the athlete population.
4. **Stored Procedure Invocation**: Executes `CALL sp_clear_athlete_injuries(...)` to modify recovery statuses.
5. **Multi-Table Analytical Aggregations**: Extracts session attendance and RPE exertion statistics.

## 📦 Running the Client
```bash
# Ensure psycopg2-binary is installed
pip3 install psycopg2-binary

# Run the Python connectivity script
python3 python_client/athlete_db_client.py
```
