# How We Built Infrastructure That Remembers Using Hindsight

When a production incident woke me up at 3:14 AM last month, our payment API was timing out with 5-second latencies. Three engineers jumped into the incident channel. We spent twenty minutes checking Kubernetes CPU throttles, restarting pods, and verifying network ingress latency before someone checked the database connection pool and realized it was saturated at 99%. 

Ten minutes after scaling the pool, the incident was resolved.

The frustrating part wasn't the bug. The frustrating part was that nearly the exact same outage had happened six weeks prior on another service. The post-mortem for that incident contained the exact root cause, the exact metrics to check first, and an explicit warning that restarting the API pods only triggered a cold-start connection storm that made latency worse.

Yet at 3:14 AM, our incident triage started from zero.

This is the fundamental problem in modern DevOps and SRE: operational knowledge is fragmented across closed tickets, static runbooks, scattered Slack threads, and the heads of engineers who may not even be on call. We don't lack observability data. We lack **persistent operational memory** at the moment an incident strikes.

To solve this, we built **Memora**, an incident response agent designed around a simple thesis: *infrastructure should remember*. Instead of stateless chatbots or static alert bots, Memora leverages [Hindsight agent memory](https://vectorize.io/what-is-agent-memory) to turn every resolved incident into persistent, reusable operational intelligence.

---

## The System Architecture

Memora splits concerns cleanly across two operational planes:

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite UI                      │
│      (Incident Workspace: Evidence | Agent | Memory)   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼─────────────────────────────┐
│                 Node.js / Express API                  │
├──────────────────────────┬─────────────────────────────┤
│   Supabase PostgreSQL    │   Hindsight Memory Engine   │
│   (Application State)    │   (Operational Experience)  │
│  - Incidents             │  - Recalled Post-Mortems    │
│  - Telemetry Evidence    │  - Successful Approaches    │
│  - Investigation Steps   │  - Failed Approaches        │
│  - Runbooks              │  - Behavioral Guidance      │
└──────────────────────────┴─────────────────────────────┘
```

1. **Supabase PostgreSQL** acts as the single source of truth for **application state**: incoming telemetry, incident logs, investigation audit logs, and verified resolutions.
2. [Hindsight](https://github.com/vectorize-io/hindsight) acts as the single source of truth for **reusable agent experience**: semantic recall during active investigation and structured retention upon incident resolution.

---

## Why Vector Search Isn't Enough: The Need for Semantic Experience Retention

When we initially thought about incident memory, the naive approach was simple: dump every raw log line into a vector database and perform cosine similarity search.

That approach failed immediately in testing:
- Raw logs are noisy and transient. A database timeout log contains timestamps, container hashes, and random stack traces that confuse embedding models.
- An alert is not an experience. Knowing that latency exceeded 5 seconds does not tell an agent *what worked* and *what failed*.

Instead, we defined a strict [Hindsight memory contract](https://hindsight.vectorize.io/). We only retain structured experience objects extracted after post-mortem resolution:

```typescript
const experienceToRetain = {
  type: 'incident_experience',
  service: 'payment-api',
  incident_key: 'INC-1001',
  symptoms: ['Payment API latency', 'Timeouts increasing'],
  important_evidence: ['db_connections: 99%', 'api_latency: 5.2s'],
  root_cause: 'Database connection pool exhaustion',
  investigation_path: [
    'Checked CPU and ruled out throttling',
    'Inspected DB connection pool and confirmed exhaustion'
  ],
  failed_approaches: [
    'Restarting the API did not resolve the issue (caused cold-start storm)'
  ],
  successful_approaches: [
    'Increased database connection pool max capacity from 50 to 100'
  ],
  runbook: 'DB-CONNECTION-POOL-03',
  outcome: 'Latency normalized within 14 minutes',
  lesson: 'When payment-api latency coincides with high DB connections, inspect pool before restarting.'
};

await hindsight.retain(bankId, formatExperience(experienceToRetain), {
  tags: ['incident_experience', 'payment-api'],
  metadata: { root_cause: experienceToRetain.root_cause }
});
```

Crucially, retaining **failed approaches** is just as vital as retaining successful fixes. In incident response, ruling out dead ends saves dozens of minutes of downtime.

---

## Grounding the Agent: Preventing Memory from Becoming Bias

One of our biggest engineering challenges was avoiding "memory hallucination" or anchoring bias. If an agent blindly applies the last incident's solution to every new alert, it becomes dangerous.

To prevent this, our agent engine enforces strict evidence labeling rules:
- `OBSERVED`: Facts directly verified by current telemetry metrics or logs.
- `HISTORICAL`: Reusable knowledge recalled from past incident experiences in Hindsight.
- `HYPOTHESIS`: Formulated causes that require testing against live evidence.
- `CONFIRMED`: Hypotheses verified by telemetry.
- `RULED_OUT`: Investigated and rejected.

Here is how the agent evaluates recalled memories against live evidence:

```typescript
// Case: Memory recalled, but current evidence diverges
if (hasHighRedis && !hasHighDb && pastDbExhausted) {
  // Divergence detected: do NOT recommend old fix
  differences.push('DB connection utilization is normal (34%), whereas INC-1001 had 99% pool saturation.');
  differences.push(`Redis memory is at ${redisEvidence.value}, indicating cache eviction.`);

  hypotheses.push({
    title: 'Redis cache memory pressure and eviction storm',
    label: 'HYPOTHESIS',
    confidence: 'high',
    reasoning: 'Redis memory is critical. Latency is driven by cache misses rather than DB pool exhaustion.'
  });

  hypotheses.push({
    title: 'Database connection pool exhaustion (Historical match)',
    label: 'RULED_OUT',
    confidence: 'low',
    reasoning: 'Although past incident INC-1001 had similar latency, DB connections are normal. Do NOT scale DB pool.'
  });
}
```

When current evidence contradicts historical memory, **current evidence always wins**. The agent explicitly tells the on-call engineer why the historical fix does not apply, preventing costly confirmation bias.

---

## Results and Behavior in Practice

We verified Memora across three progressive operational scenarios:

1. **The First Learning Event (`INC-1001`)**:
   `payment-api` latency spikes to 5.2s with 99% DB connection saturation. Memora runs a general triage, assists the engineer through runbook `DB-CONNECTION-POOL-03`, records the resolution, and retains the experience in Hindsight.

2. **Memory Changes Behavior (`INC-1007`)**:
   Weeks later, similar latency occurs with 97% DB connections. Memora immediately recalls `INC-1001`. It prioritizes the DB pool hypothesis and **explicitly warns the operator not to restart the service**, citing the past post-mortem. Mean time to resolution drops by over 60%.

3. **Rejecting Historical Bias (`INC-1008`)**:
   Another incident occurs with high latency. However, current evidence shows normal DB connections (34%) and 96% Redis memory. Memora recalls `INC-1001`, marks it as *divergent*, rules out the DB pool fix, and prioritizes Redis runbook `REDIS-MEMORY-02`.

---

## 4 Reusable Takeaways for Engineers Building Memory-Augmented Agents

1. **Store Experiences, Not Raw Logs**: An operational memory engine should store distilled learnings, failed attempts, and verified fixes—not thousands of transient log lines.
2. **Remember Failures to Avoid Repetition**: Engineers waste critical time repeating attempts that previously failed. Capturing `failed_approaches` provides immediate high-value guidance.
3. **Current Telemetry Trumps Historical Memory**: Never let an AI agent assume that history repeats itself identically. Always verify incoming metrics against historical hypotheses.
4. **Make Memory Explanations Visible in the UI**: An agent that says "Trust me, do X" will be ignored by skeptical SREs. An agent that shows *"Influenced by INC-1001 because DB connections reached 97%"* earns trust immediately.

---

### Resources
- [Hindsight GitHub Repository](https://github.com/vectorize-io/hindsight)
- [Hindsight Documentation](https://hindsight.vectorize.io/)
- [Vectorize: What is Agent Memory?](https://vectorize.io/what-is-agent-memory)
