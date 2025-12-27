// Initialize Supabase schema locally via Node.
// Usage: SUPABASE_DB_URL="postgres://..." node scripts/init-supabase.mjs
import fs from 'fs';
import pg from 'pg';
const { Client } = pg;
const url = process.env.SUPABASE_DB_URL;
if (!url) { console.error('Missing SUPABASE_DB_URL'); process.exit(1); }
const sql = fs.readFileSync('supabase/migrations/001_init.sql', 'utf8');
const client = new Client({ connectionString: url });
await client.connect();
await client.query(sql);
await client.end();
console.log('Supabase schema initialized.');

