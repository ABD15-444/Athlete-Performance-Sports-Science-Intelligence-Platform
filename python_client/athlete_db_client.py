#!/usr/bin/env python3
"""
Athlete Performance & Sports Science Intelligence Platform
Python Database Connectivity & Analytics Client

This client demonstrates direct PostgreSQL connectivity using psycopg2, executing:
  1. Connection test & pool health verification
  2. Live athlete readiness extraction
  3. Dynamic execution of stored procedure: sp_clear_athlete_injuries
  4. Execution of cursor-based function: fn_scan_high_risk_athletes_cursor
  5. High-exertion anomaly detection query
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

# Parse .env manually if available to avoid external dotenv dependency
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
if os.path.exists(dotenv_path):
    with open(dotenv_path) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ.setdefault(k, v)

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'athlete_platform')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', '696969')


def get_db_connection():
    """Establishes and returns a connection to PostgreSQL."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL database: {e}")
        sys.exit(1)


def display_section(title):
    print("\n" + "=" * 70)
    print(f" 📊 {title.upper()}")
    print("=" * 70)


def test_connection(conn):
    display_section("1. Database Connection & System Health")
    with conn.cursor() as cur:
        cur.execute("SELECT version();")
        db_version = cur.fetchone()[0]
        print(f"✅ Connected to: {db_version.split(',')[0]}")
        print(f"   Database: {DB_NAME} on {DB_HOST}:{DB_PORT} as user '{DB_USER}'")


def get_athlete_readiness(conn):
    display_section("2. Live AI Athlete Readiness (Top 5)")
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        query = """
            SELECT 
                athlete_name,
                team_name,
                readiness_score,
                injury_risk,
                hrv_ms,
                sleep_score,
                fatigue_score
            FROM Athlete_Readiness
            ORDER BY readiness_score DESC
            LIMIT 5;
        """
        cur.execute(query)
        rows = cur.fetchall()

        print(f"{'Athlete Name':<20} | {'Team':<18} | {'Readiness':<10} | {'Risk':<10} | {'HRV (ms)':<9} | {'Sleep':<6}")
        print("-" * 85)
        for r in rows:
            print(f"{r['athlete_name']:<20} | {r['team_name']:<18} | {r['readiness_score']:<10} | {r['injury_risk']:<10} | {r['hrv_ms']:<9} | {r['sleep_score']:<6}")


def run_cursor_risk_scan(conn):
    display_section("3. High-Risk Athlete Cursor Scanner (fn_scan_high_risk_athletes_cursor)")
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM fn_scan_high_risk_athletes_cursor();")
        flagged = cur.fetchall()

        if not flagged:
            print("✅ All athletes within safe physiological limits.")
            return

        for a in flagged:
            print(f"⚠️  [{a['risk_level'].upper()}] {a['athlete_name']} ({a['team_name']})")
            print(f"   Fatigue: {a['fatigue_score']}/10 | Sleep: {a['sleep_score']}%")
            print(f"   Action Required: {a['action_required']}\n")


def invoke_stored_procedure(conn, athlete_id):
    display_section("4. Invoke PL/pgSQL Stored Procedure (sp_clear_athlete_injuries)")
    with conn.cursor() as cur:
        print(f"Executing: CALL sp_clear_athlete_injuries('{athlete_id}');")
        cur.execute("CALL sp_clear_athlete_injuries(%s, CURRENT_DATE);", (athlete_id,))
        conn.commit()
        print("✅ Stored procedure executed successfully.")


def query_workload_metrics(conn):
    display_section("5. Session RPE Exertion Summary (Multi-Table Aggregation)")
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        query = """
            SELECT 
                ts.session_type,
                ts.intensity,
                COUNT(s.athlete_id) as attendances,
                ROUND(AVG(s.rpe), 1) as avg_rpe
            FROM training_session ts
            JOIN athlete_session s ON s.session_id = ts.session_id
            GROUP BY ts.session_type, ts.intensity
            ORDER BY avg_rpe DESC
            LIMIT 5;
        """
        cur.execute(query)
        rows = cur.fetchall()
        for r in rows:
            print(f"• {r['session_type']} ({r['intensity']}): {r['attendances']} athletes | Mean RPE: {r['avg_rpe']}/10")


def main():
    print("\n🏋️‍♂️ Athlete Performance & Sports Science Intelligence Platform")
    print("   Python Database Connectivity (psycopg2) CLI Suite")

    conn = get_db_connection()
    try:
        test_connection(conn)
        get_athlete_readiness(conn)
        run_cursor_risk_scan(conn)
        query_workload_metrics(conn)
        
        # Test Stored Procedure on Marcus Thompson
        marcus_id = '00000000-0000-0000-0000-000000000301'
        invoke_stored_procedure(conn, marcus_id)
        
        print("\n" + "=" * 70)
        print("🎉 ALL PYTHON CONNECTIVITY & PL/pgSQL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 70 + "\n")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
