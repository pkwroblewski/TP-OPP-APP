-- Core tables + job queue + rulesets
create table if not exists company (
  id bigserial primary key,
  name text not null,
  country_code char(2) not null default 'LU',
  rcs_number text,
  tax_id text
);

create table if not exists filing (
  id bigserial primary key,
  company_id bigint references company(id),
  period_start date,
  period_end date,
  file_hash char(64) unique not null,
  filename text,
  received_at timestamptz default now(),
  tool_pymupdf_version text,
  tool_pdfminer_version text,
  tool_tesseract_version text
);

create table if not exists statement (
  id bigserial primary key,
  filing_id bigint references filing(id),
  type text check (type in ('balance_sheet','pnl','cashflow','notes')),
  language text,
  currency char(3) default 'EUR'
);

create table if not exists statement_line (
  id bigserial primary key,
  statement_id bigint references statement(id),
  ref_code text,
  caption text,
  side text,
  period smallint,
  value numeric(24,2),
  unit text default 'EUR',
  status text check (status in ('extracted','not_found','ambiguous')) default 'extracted'
);

create table if not exists ic_disclosure (
  id bigserial primary key,
  filing_id bigint references filing(id),
  counterparty_name text,
  category text,
  maturity text,
  amount numeric(24,2),
  currency char(3) default 'EUR',
  note_ref text,
  status text check (status in ('extracted','not_found','ambiguous'))
);

create table if not exists anchor (
  id bigserial primary key,
  filing_id bigint references filing(id),
  source_type text check (source_type in ('text','ocr')),
  page int,
  bbox jsonb,
  snippet text
);

create table if not exists datum_anchor (
  datum_table text,
  datum_id bigint,
  anchor_id bigint references anchor(id)
);

do $$ begin
  create type job_status as enum ('queued','processing','succeeded','failed');
exception when duplicate_object then null; end $$;

create table if not exists ruleset (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Conservative',
  thresholds jsonb not null,
  weights jsonb not null default '{"financing":0.45,"services":0.30,"royalties":0.25}',
  currency char(3) not null default 'EUR',
  locale text not null default 'en',
  created_by uuid not null,
  created_at timestamptz default now()
);

create table if not exists job (
  id uuid primary key default gen_random_uuid(),
  filing_id bigint references filing(id) on delete cascade,
  created_by uuid not null,
  storage_path text not null,
  status job_status not null default 'queued',
  error text,
  ruleset_id uuid references ruleset(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table job enable row level security;
create policy if not exists job_owner_read on job for select using (created_by = auth.uid());
create policy if not exists job_owner_insert on job for insert with check (created_by = auth.uid());

