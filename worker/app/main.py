import os, time, requests, tempfile, traceback, psycopg
from .db import connect, fetch_one_job, mark_job
from .parser import parse_mvp
SUPABASE_URL = os.environ['SUPABASE_PROJECT_URL'].rstrip('/')
SERVICE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
BUCKET = os.environ.get('SUPABASE_BUCKET','filings')
def download_pdf(storage_path: str) -> str:
    url = f"{SUPABASE_URL}/storage/v1/object/{storage_path}" if storage_path.startswith(BUCKET) else f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"
    headers = {'Authorization': f'Bearer {SERVICE_KEY}', 'apikey': SERVICE_KEY}
    r = requests.get(url, headers=headers); r.raise_for_status()
    fd, tmp = tempfile.mkstemp(suffix='.pdf')
    with os.fdopen(fd, 'wb') as f: f.write(r.content)
    return tmp
def ensure_statements(conn, filing_id: int):
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM statement WHERE filing_id=%s AND type='balance_sheet'", (filing_id,))
        if not cur.fetchone():
            cur.execute("INSERT INTO statement (filing_id, type, language, currency) VALUES (%s,'balance_sheet','en','EUR')", (filing_id,))
        cur.execute("SELECT 1 FROM statement WHERE filing_id=%s AND type='pnl'", (filing_id,))
        if not cur.fetchone():
            cur.execute("INSERT INTO statement (filing_id, type, language, currency) VALUES (%s,'pnl','en','EUR')", (filing_id,))
    conn.commit()
def insert_lines(conn, filing_id: int, lines, anchors):
    with conn.cursor() as cur:
        anc_ids = []
        for anc in anchors:
            cur.execute("INSERT INTO anchor (filing_id, source_type, page, bbox, snippet) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                        (filing_id, anc.get('source_type','text'), anc['page'], psycopg.types.json.Json(anc['bbox']), anc['snippet'][:800]))
            anc_ids.append(cur.fetchone()[0])
        for line in lines:
            cur.execute("INSERT INTO statement_line (statement_id, ref_code, caption, side, period, value, unit, status) VALUES ((SELECT id FROM statement WHERE filing_id=%s AND type=%s LIMIT 1), %s,%s,%s,%s,%s,%s) RETURNING id",
                        (filing_id, line['statement_type'], line.get('ref_code'), line['caption'], line.get('side'), 0 if line['period']=='current' else 1, line.get('value'), line.get('unit','EUR'), line.get('status','extracted')))
            line_id = cur.fetchone()[0]
            for idx in line.get('anchor_indices', []):
                cur.execute("INSERT INTO datum_anchor (datum_table, datum_id, anchor_id) VALUES ('statement_line', %s, %s)", (line_id, anc_ids[idx]))
    conn.commit()
def main():
    while True:
        with connect() as conn:
            job = fetch_one_job(conn)
            if not job:
                time.sleep(3); continue
            try:
                ensure_statements(conn, job['filing_id'])
                path = download_pdf(job['storage_path'])
                result = parse_mvp(path)
                insert_lines(conn, job['filing_id'], result['lines'], result['anchors'])
                mark_job(conn, job['id'], 'succeeded', None)
            except Exception as e:
                traceback.print_exc()
                mark_job(conn, job['id'], 'failed', str(e))
if __name__ == '__main__':
    main()

