import os, psycopg
DB_URL = os.environ['SUPABASE_DB_URL']
def connect():
    return psycopg.connect(DB_URL, autocommit=False)
def fetch_one_job(conn):
    with conn.cursor() as cur:
        cur.execute("""        BEGIN;
        SELECT id, storage_path, filing_id, coalesce(ruleset_id::text,'') 
        FROM job
        WHERE status='queued'
        ORDER BY created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
        """)
        row = cur.fetchone()
        if not row:
            conn.rollback()
            return None
        job_id, storage_path, filing_id, ruleset_id = row
        cur.execute("UPDATE job SET status='processing' WHERE id=%s", (job_id,))
        conn.commit()
        return {'id': job_id, 'storage_path': storage_path, 'filing_id': filing_id, 'ruleset_id': ruleset_id}
def mark_job(conn, job_id: str, status: str, error: str|None=None):
    with conn.cursor() as cur:
        cur.execute("UPDATE job SET status=%s, error=%s, updated_at=now() WHERE id=%s", (status, error, job_id))
    conn.commit()

