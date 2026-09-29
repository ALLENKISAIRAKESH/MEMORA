-- Memora demo seed data
-- The data is intentionally realistic but synthetic.

insert into incidents
(incident_key,title,service,severity,status,description,detected_at,resolved_at)
values
('INC-1001','Payment API latency','payment-api','SEV-1','resolved',
 'Payment requests exceeded 5 seconds and timeouts increased.',
 now() - interval '30 days', now() - interval '30 days' + interval '14 minutes'),
('INC-1002','Checkout timeout','checkout-api','SEV-2','resolved',
 'Checkout requests intermittently timed out.',
 now() - interval '21 days', now() - interval '21 days' + interval '19 minutes'),
('INC-1003','Redis memory pressure','payment-api','SEV-2','resolved',
 'Redis memory utilization crossed the alert threshold.',
 now() - interval '14 days', now() - interval '14 days' + interval '17 minutes');

insert into incident_evidence(incident_id,type,name,value,source)
select id,'metric','api_latency','5.2s','synthetic-monitoring'
from incidents where incident_key='INC-1001';

insert into incident_evidence(incident_id,type,name,value,source)
select id,'metric','db_connections','99%','synthetic-monitoring'
from incidents where incident_key='INC-1001';

insert into incident_evidence(incident_id,type,name,value,source)
select id,'log','payment-api','connection pool exhausted','synthetic-log';

insert into incident_evidence(incident_id,type,name,value,source)
select id,'metric','redis_memory','94%','synthetic-monitoring'
from incidents where incident_key='INC-1003';

insert into runbooks(name,service,description,steps)
values
('DB-CONNECTION-POOL-03','payment-api',
 'Investigate and remediate database connection pool exhaustion.',
 '[{"step":1,"action":"Inspect connection utilization"},{"step":2,"action":"Compare pool configuration"},{"step":3,"action":"Increase pool if evidence supports exhaustion"},{"step":4,"action":"Verify latency and connection recovery"}]'::jsonb),
('REDIS-MEMORY-02','payment-api',
 'Investigate Redis memory pressure.',
 '[{"step":1,"action":"Inspect memory utilization"},{"step":2,"action":"Identify high-memory keys"},{"step":3,"action":"Check recent cache changes"},{"step":4,"action":"Verify recovery"}]'::jsonb);

insert into resolutions
(incident_id,root_cause,resolution_summary,resolution_time_minutes,verified,failed_approaches,successful_approaches,lessons_learned)
select id,
'Database connection pool exhaustion',
'Increased database connection pool capacity from 50 to 100 and verified latency recovery.',
14,true,
'["Restarting the API did not resolve the issue","Increasing request timeout did not resolve the issue"]'::jsonb,
'["Inspecting DB connection utilization exposed the exhausted pool","Increasing pool capacity restored normal behavior"]'::jsonb,
'When payment-api latency coincides with high database connection utilization, inspect the connection pool before restarting the service.'
from incidents where incident_key='INC-1001';
