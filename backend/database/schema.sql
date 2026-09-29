create extension if not exists pgcrypto;

create table if not exists incidents (
    id uuid primary key default gen_random_uuid(),
    incident_key text unique not null,
    title text not null,
    service text not null,
    severity text not null check (severity in ('SEV-1','SEV-2','SEV-3','SEV-4')),
    status text not null default 'open' check (status in ('open','investigating','resolved')),
    description text,
    detected_at timestamptz default now(),
    resolved_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists incident_evidence (
    id uuid primary key default gen_random_uuid(),
    incident_id uuid not null references incidents(id) on delete cascade,
    type text not null,
    name text not null,
    value text,
    source text,
    metadata jsonb default '{}',
    recorded_at timestamptz default now()
);

create table if not exists investigations (
    id uuid primary key default gen_random_uuid(),
    incident_id uuid not null references incidents(id) on delete cascade,
    status text not null default 'running',
    summary text,
    started_at timestamptz default now(),
    completed_at timestamptz
);

create table if not exists investigation_steps (
    id uuid primary key default gen_random_uuid(),
    investigation_id uuid not null references investigations(id) on delete cascade,
    step_number integer not null,
    hypothesis text,
    action text,
    observation text,
    result text,
    status text not null,
    created_at timestamptz default now()
);

create table if not exists runbooks (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    service text,
    description text,
    steps jsonb default '[]',
    version text default '1.0',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists resolutions (
    id uuid primary key default gen_random_uuid(),
    incident_id uuid unique not null references incidents(id) on delete cascade,
    root_cause text,
    resolution_summary text,
    runbook_id uuid references runbooks(id),
    resolution_time_minutes integer,
    verified boolean default false,
    failed_approaches jsonb default '[]',
    successful_approaches jsonb default '[]',
    lessons_learned text,
    created_at timestamptz default now()
);

create index if not exists idx_incidents_service on incidents(service);
create index if not exists idx_incidents_status on incidents(status);
create index if not exists idx_evidence_incident on incident_evidence(incident_id);
create index if not exists idx_investigation_incident on investigations(incident_id);
