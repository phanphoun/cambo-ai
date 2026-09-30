# Implementing Prometheus + Grafana in cambo-ai

Same concept as the SKAI project's monitoring stack: two dashboards, two
datasources, because they answer two different questions with two different
shapes of data.

- **Infra Overview** — is the *machine/containers* healthy? (CPU, memory,
  disk, restarts) → Prometheus, scraping exporters.
- **App Analytics** — is the *app* healthy and being used? (requests,
  latency, errors, providers, tokens) → a direct SQL datasource against
  Postgres, because cambo-ai's backend already has the data, it just isn't
  landing in a queryable place yet (see Step 3 — this is the one real gap to
  close).

cambo-ai is actually simpler to wire up than SKAI's setup: everything here is
**one** backend, **one** Postgres, and both already publish their ports to
the host (`5432` and `8001`) in both `docker-compose.yml` and
`docker-compose.prod.yml`. That means the monitoring stack never needs to
join cambo-ai's own compose network or worry about a shared "external"
Docker network — it can reach everything purely through
`host.docker.internal`, same trick, one less moving part than SKAI needed.

---

## What's already there vs. what you're building

Checked in this repo before writing this:

- `monitoring/` already exists but is an empty scaffold (`monitoring/prometheus/`
  has no file in it yet). You're filling this in from Step 0 onward.
- `backend/pyproject.toml` already lists `prometheus-fastapi-instrumentator`
  as a dependency — it's just never imported/wired into `app.py`. That's
  Step 2.
- `backend/database/models.py` already defines `ActivityLogDB` (table
  `activity_logs`, columns: `id`, `timestamp`, `action`, `user_email`,
  `provider`, `status_code`, `latency_ms`, `tokens_est`, `details`), and
  `init_db()` already creates this table on startup via
  `Base.metadata.create_all`. **But nothing ever writes a row into it.**
  `services/telemetry_service.py`'s `record_activity()` only appends to an
  in-memory `deque` and periodically dumps to `backend/data/activity_logs.json`
  — that's what powers the admin panel's live activity feed, but Grafana
  can't query a Python process's memory or a JSON file with SQL. Step 3 adds
  the missing Postgres write, reusing the table that's already defined.

So the real work here is: exporters + Prometheus (new), app `/metrics`
wiring (new), Grafana provisioning (new), and one bug-fix-shaped change to
`telemetry_service.py` so `activity_logs` actually gets rows.

---

## Step 0 — layout

```
cambo-ai/
  monitoring/
    docker-compose.yml
    .env                      # gitignored
    env.example               # committed
    prometheus/
      prometheus.yml
    grafana/
      provisioning/
        datasources/datasource.yml
        dashboards/dashboard.yml
      dashboards/
        infra-overview.json
        app-analytics.json
```

Keep it a separate compose project from `docker-compose.yml` /
`docker-compose.prod.yml` — its lifecycle (start/stop/upgrade Grafana) has
nothing to do with deploying the app itself.

---

## Step 1 — host + container metrics (exporters + Prometheus)

No app code here — standard exporters, identical to how SKAI does it.

```yaml
# monitoring/docker-compose.yml
networks:
  default:
    name: cambo_ai_monitoring

volumes:
  prometheus_data:
  grafana_data:

services:
  node-exporter:
    image: prom/node-exporter:v1.8.2
    container_name: cambo_ai_monitoring_node_exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.sysfs=/host/sys"
      - "--path.rootfs=/rootfs"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.49.1
    container_name: cambo_ai_monitoring_cadvisor
    restart: unless-stopped
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro

  prometheus:
    image: prom/prometheus:v2.55.1
    container_name: cambo_ai_monitoring_prometheus
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"   # to reach the backend's /metrics
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    depends_on:
      - node-exporter
      - cadvisor
```

```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: node
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: cadvisor
    static_configs:
      - targets: ["cadvisor:8080"]

  # backend's own /metrics (added in Step 2). Works whether the backend runs
  # on the host (`uv run app.py`, cambo-ai's dev workflow) or as the
  # `backend` container from docker-compose.prod.yml — both publish 8001 to
  # the host, so host.docker.internal:8001 reaches either one without this
  # compose project ever joining cambo-ai's own network.
  - job_name: cambo-backend
    static_configs:
      - targets: ["host.docker.internal:8001"]
    # bearer_token: "<value of backend's METRICS_TOKEN, if you set one>"
```

**Verify:** `cd monitoring && docker compose up -d`, then
`http://localhost:9090/targets` — `node` and `cadvisor` should already be
`UP`. `cambo-backend` will show `DOWN`/connection-refused until Step 2 is
done — that's expected at this point.

---

## Step 2 — expose `/metrics` on the backend

This is the code change. `prometheus-fastapi-instrumentator` is already a
declared dependency (`backend/pyproject.toml`) — `uv sync` (or
`pip install -r requirements.txt` after adding it there too) if it isn't
installed in your current venv yet.

```python
# backend/app.py — add near the other imports
from fastapi import Depends, Header, HTTPException, status
from prometheus_fastapi_instrumentator import Instrumentator
```

```python
# backend/app.py — add after the CORS middleware block, before "# Mount routes"

def require_metrics_token(authorization: str | None = Header(None)) -> None:
    """Guards GET /metrics with a static bearer token — Prometheus scrapes
    this on a schedule, it isn't a user session. No-op if METRICS_TOKEN is
    unset (fine for local dev; set one before this is reachable beyond
    localhost)."""
    if not settings.metrics_token:
        return
    if authorization != f"Bearer {settings.metrics_token}":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing metrics token")


# GET /metrics — per-route request-duration histograms + counts, scraped by
# monitoring/prometheus/prometheus.yml's `cambo-backend` job.
# should_ignore_untemplated=True so unmatched paths (bot scans, typo'd URLs)
# don't each become their own high-cardinality metric label.
Instrumentator(should_ignore_untemplated=True).instrument(app).expose(
    app, endpoint="/metrics", include_in_schema=False, dependencies=[Depends(require_metrics_token)]
)
```

```python
# backend/config.py — add alongside the other settings
    # --- Metrics ---
    # GET /metrics (Prometheus scrape target). Empty = no auth check (dev
    # default); set a real value before deploying anywhere public.
    metrics_token: str = ""
```

```bash
# backend/.env.example — add
# Prometheus /metrics endpoint auth. Leave empty for local dev.
METRICS_TOKEN=
```

**Verify:** start the backend, `curl http://localhost:8001/metrics` should
return Prometheus-format text (`http_requests_total`,
`http_request_duration_seconds_bucket`, etc.). Then re-check
`http://localhost:9090/targets` — `cambo-backend` should now be `UP`.

---

## Step 3 — the actual gap: get activity data into Postgres

`telemetry_service.record_activity()` (called from `app.py`'s
`request_context` middleware, and again from `routes/chat.py` for
chat-specific detail like provider/tokens) only writes to memory + JSON.
Grafana's SQL datasource needs real rows in `activity_logs`. Add an async
write path and call it alongside the existing one — don't remove the
in-memory path, the admin panel's live feed still needs fast, no-DB-latency
reads.

```python
# backend/services/telemetry_service.py — add near the top
import uuid
```

```python
# backend/services/telemetry_service.py — add as a method on TelemetryService
    async def record_activity_db(
        self,
        action: str,
        user_email: str = "guest@sastra.ai",
        provider: str = "gemini",
        status_code: int = 200,
        latency_ms: float = 0.0,
        tokens_est: int = 0,
        details: Optional[str] = None,
    ):
        """Persists one activity row to Postgres so Grafana's SQL datasource
        can query it directly — the in-memory/JSON path above stays as-is for
        the admin panel's fast live feed; this is the durable, queryable
        copy. Fire-and-forget (see app.py's asyncio.create_task call) so a
        slow/unavailable DB never adds latency to the actual request."""
        from database.models import ActivityLogDB
        from database.session import async_session_maker

        try:
            async with async_session_maker() as session:
                session.add(ActivityLogDB(
                    id=f"act-{uuid.uuid4().hex}",
                    timestamp=time.time(),
                    action=action,
                    user_email=user_email,
                    provider=provider,
                    status_code=status_code,
                    latency_ms=round(latency_ms, 1),
                    tokens_est=tokens_est,
                    details=details or "",
                ))
                await session.commit()
        except Exception as e:
            logger.error("Failed to persist activity to Postgres: %s", e)
```

```python
# backend/app.py — inside request_context, replace the existing
# telemetry_service.record_activity(...) call with both:
            if not request.url.path.startswith("/health") and not request.url.path.startswith("/docs"):
                telemetry_service.record_activity(
                    action=f"{request.method} {request.url.path}",
                    status_code=response.status_code,
                    latency_ms=elapsed,
                    tokens_est=int(elapsed * 1.5),
                )
                asyncio.create_task(telemetry_service.record_activity_db(
                    action=f"{request.method} {request.url.path}",
                    status_code=response.status_code,
                    latency_ms=elapsed,
                    tokens_est=int(elapsed * 1.5),
                ))
```

(add `import asyncio` at the top of `app.py`.)

Do the same next to the two `telemetry_service.record_activity(...)` calls
in `routes/chat.py` (lines 139 and 204) — those pass real `provider` and a
more meaningful `action`/`user_email` for chat requests specifically, which
is exactly the breakdown you want in the app-analytics dashboard (per-model
usage, per-user activity). Mirror each call with a matching
`asyncio.create_task(telemetry_service.record_activity_db(...))` using the
same arguments.

**Why fire-and-forget (`asyncio.create_task`) instead of `await`-ing it
inline:** the request already returned useful data to the user; a slow or
temporarily-down Postgres shouldn't add latency (or a failure path) to every
single request just to log telemetry. This is the same reasoning SKAI's
telemetry service uses when it queues to a Redis stream instead of writing
synchronously — cambo-ai doesn't need a queue in front of Postgres (it's a
single backend instance, not a fleet), so `create_task` is the equivalent
lightweight version of "don't block the request on telemetry".

**Verify:** hit a few endpoints (`/health` doesn't count, it's excluded),
then:
```bash
docker exec cambo_ai_postgres psql -U postgres -d cambo_ai -c "SELECT count(*), max(timestamp) FROM activity_logs;"
```
Row count should be growing and `max(timestamp)` should be "just now".

---

## Step 4 — Grafana, provisioned

```yaml
# monitoring/docker-compose.yml — add this service
  grafana:
    image: grafana/grafana:11.2.0
    container_name: cambo_ai_monitoring_grafana
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
      # Read by datasource.yml's $__env{} refs below — cambo-ai's own Postgres
      # credentials (its docker-compose.yml / .env), not this stack's.
      - CAMBO_DB_PORT=${CAMBO_DB_PORT:-5432}
      - CAMBO_DB_NAME=${CAMBO_DB_NAME:-cambo_ai}
      - CAMBO_DB_USER=${CAMBO_DB_USER:-postgres}
      - CAMBO_DB_PASSWORD=${CAMBO_DB_PASSWORD:-password123}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

```yaml
# monitoring/grafana/provisioning/datasources/datasource.yml
apiVersion: 1

datasources:
  - name: Prometheus
    uid: prometheus_ds
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false

  - name: Cambo AI (Postgres)
    uid: cambo_pg_ds
    type: postgres
    access: proxy
    # Grafana's own $__env{} substitution (resolved against this service's
    # `environment:` above) — NOT Docker Compose's ${VAR}, which doesn't
    # apply to a file just bind-mounted read-only into a running container.
    url: "host.docker.internal:$__env{CAMBO_DB_PORT}"
    database: $__env{CAMBO_DB_NAME}
    user: $__env{CAMBO_DB_USER}
    secureJsonData:
      password: $__env{CAMBO_DB_PASSWORD}
    jsonData:
      sslmode: disable
      postgresVersion: 1600
    isDefault: false
    editable: false
```

```yaml
# monitoring/grafana/provisioning/dashboards/dashboard.yml
apiVersion: 1

providers:
  - name: cambo
    orgId: 1
    folder: ""
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
```

```bash
# monitoring/env.example
GRAFANA_ADMIN_PASSWORD=change-me
# Must match cambo-ai's own docker-compose.yml / docker-compose.prod.yml
# Postgres credentials — check that file if these ever diverge.
CAMBO_DB_PORT=5432
CAMBO_DB_NAME=cambo_ai
CAMBO_DB_USER=postgres
CAMBO_DB_PASSWORD=password123
```

```bash
cd monitoring
cp env.example .env   # edit GRAFANA_ADMIN_PASSWORD before this is public
docker compose up -d
```

**Verify:** `http://localhost:3001`, log in as `admin` / your password,
Connections → Data sources → both "Prometheus" and "Cambo AI (Postgres)"
should say "Data source is working".

---

## Step 5 — dashboards

Build these by hand in the Grafana UI first (Explore → try a query → add as
panel), then Share → Export → "Save to file" into the two JSON files below,
so they become part of what's provisioned. Don't hand-write dashboard JSON
from scratch — nobody does that realistically.

### `infra-overview.json` (Prometheus datasource, uid `prometheus_ds`)

- Host CPU: `100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
- Host memory used %: `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100`
- Disk usage by filesystem: `100 - (node_filesystem_avail_bytes / node_filesystem_size_bytes * 100)`
- Per-container CPU: `rate(container_cpu_usage_seconds_total{name!=""}[5m])`
- Per-container memory: `container_memory_usage_bytes{name!=""}`
- Container restarts: `changes(container_start_time_seconds{name!=""}[1h])`
- Backend request rate: `rate(http_requests_total{job="cambo-backend"}[5m])`
- Backend p95 latency: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="cambo-backend"}[5m]))`
- Backend error rate: `rate(http_requests_total{job="cambo-backend", status=~"5.."}[5m])`

### `app-analytics.json` (Postgres datasource, uid `cambo_pg_ds`)

All queries use `$__timeFilter(...)` so the dashboard's time-range picker
actually controls the window — never hardcode a date range.

```sql
-- Request volume over time
SELECT to_timestamp(timestamp) AS time, count(*) AS "requests"
FROM activity_logs
WHERE $__timeFilter(to_timestamp(timestamp))
GROUP BY 1
ORDER BY 1
```

```sql
-- Error rate
SELECT
  to_timestamp(timestamp) AS time,
  count(*) FILTER (WHERE status_code >= 400)::float / count(*) * 100 AS "error_pct"
FROM activity_logs
WHERE $__timeFilter(to_timestamp(timestamp))
GROUP BY 1
ORDER BY 1
```

```sql
-- Latency percentiles
SELECT
  to_timestamp(timestamp) AS time,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS "p50",
  percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS "p95"
FROM activity_logs
WHERE $__timeFilter(to_timestamp(timestamp))
GROUP BY 1
ORDER BY 1
```

```sql
-- Provider breakdown (which AI provider is actually being used)
SELECT provider, count(*) AS "requests"
FROM activity_logs
WHERE $__timeFilter(to_timestamp(timestamp))
GROUP BY 1
ORDER BY 2 DESC
```

```sql
-- Top actions/routes
SELECT action, count(*) AS "count"
FROM activity_logs
WHERE $__timeFilter(to_timestamp(timestamp))
GROUP BY 1
ORDER BY 2 DESC
LIMIT 15
```

```sql
-- Active users (distinct emails, per day)
SELECT date_trunc('day', to_timestamp(timestamp)) AS time, count(DISTINCT user_email) AS "active_users"
FROM activity_logs
WHERE $__timeFilter(to_timestamp(timestamp))
GROUP BY 1
ORDER BY 1
```

`timestamp` is stored as a Postgres `Float` (epoch seconds, from Python's
`time.time()`) — hence wrapping it in `to_timestamp(...)` everywhere so
`$__timeFilter` (which compares against a real `timestamp`/`timestamptz`)
works. That's a quirk of this schema, not something you'd need to do if
`activity_logs.timestamp` were a native timestamp column.

`tokens_est` is currently an estimate (`elapsed_ms * 1.5`, see
`app.py`'s middleware), not a real token count — if/when Gemini's actual
`usage_metadata` (prompt/response token counts) gets threaded through to
`record_activity`/`record_activity_db`, replace the "tokens over time" panel
query's column with the real value. Don't build that panel around the
estimate expecting it to mean anything precise; it's a rough proxy today.

---

## Step 6 — run it and check it worked

```bash
cd monitoring
cp env.example .env   # fill in real values
docker compose up -d
```

- `http://localhost:9090/targets` — `prometheus`, `node`, `cadvisor`,
  `cambo-backend` all `UP`.
- `http://localhost:3001` — both datasources connect, **Infra Overview** and
  **App Analytics** dashboards are already there, panels show non-zero data
  once you've actually hit a few backend endpoints (an empty dashboard right
  after first setup just means no traffic has happened yet in the selected
  time range — check `activity_logs` row count directly before assuming a
  query is broken).

---

## Order to build this in

1. Exporters + Prometheus scraping them (Step 1). Confirm `node`/`cadvisor`
   targets are `UP` before anything else.
2. Backend `/metrics` (Step 2). Confirm `cambo-backend` target turns `UP`.
3. The Postgres write path (Step 3) — this is the one piece that's an actual
   application bug fix, not new infrastructure. Confirm rows are landing in
   `activity_logs` before touching Grafana.
4. Grafana + both datasources (Step 4). Confirm both say "working".
5. Dashboards (Step 5), built panel-by-panel against real queries, then
   exported to the provisioned JSON files.

Same reasoning as SKAI's guide: build bottom-up so each layer is
independently verifiable, instead of wiring all five pieces at once and
debugging a dashboard full of zeros with no idea which layer is at fault.
