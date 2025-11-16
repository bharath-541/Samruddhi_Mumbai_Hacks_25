# Samruddhi — All-purpose Roadmap & Dependency Relations

**Purpose:** Single-file roadmap for developers and project managers that explains milestones, service-level dependencies, runtime relationships, recommended libraries, env vars, and deployment/testing flows for the Samruddhi backend.

---

## 1. Project mission & MVP
- Deliver a working demo where hospitals can manage resources (beds, ICU, staff, inventory), request/accept resource transfers, and patients can grant time-bound access to their EHR.
- Core components for hackathon MVP: Hospital Core (Postgres/Supabase), EHR Vault (MongoDB), Orchestrator, ML stub, Dispatch, API Gateway, Auth, Redis.

---

## 2. Major milestones (high level)
1. **Infra & auth**: Docker Compose, Supabase project, MongoDB, Redis, auth-stub. (Day 0)  
2. **Hospital Core**: DB schema, CRUD endpoints, admin UI stubs. (Day 1)  
3. **EHR Vault**: FHIR storage, consent token flow (Redis), read APIs. (Day 2)  
4. **Orchestrator + ML**: Ingest agents → call ML stub → store forecasts. (Day 3)  
5. **Dispatcher**: Request → match → confirm flow + dashboard hooks. (Day 3)  
6. **Integration & polish**: WebSocket updates, audit logs, auth enforcement, demo. (Day 4)

---

## 3. Services & responsibilities (who owns what)
- **Gateway** (Node): routing, token validation, rate-limiting, OpenAPI docs.
- **Hospital Core** (Node): CRUD operations against Supabase/Postgres; admissions & assignments.
- **EHR Service** (Node): stores FHIR bundles in MongoDB; enforces consent via Redis.
- **Orchestrator** (Node): ingests agent events and coordinates ML calls.
- **ML Service** (FastAPI Python): `/predict` endpoint (stub for hackathon).
- **Dispatch** (Node): matching logic and queue consumer/producers.
- **Auth-Stub** (Node): issues service JWTs and admin tokens for local dev.
- **Infra**: `redis`, `postgres` (supabase local or remote), `mongo`, `rabbitmq` (optional).

---

## 4. Dependency relation map (summary)
- **Gateway** depends on Auth-Stub (for token validation) and routes to other services.  
- **Hospital Core** reads/writes Postgres (Supabase); publishes resource changes to Redis stream for Orchestrator/Dispatcher.  
- **EHR Service** writes to Mongo, verifies consent in Redis and accepts push from Sync Engine.  
- **Orchestrator** consumes agent events (Redis streams), calls ML Service, persists to Mongo/Postgres as needed.  
- **Dispatch** consumes queue (Redis/Rabbit), queries Hospital Core to find donors, writes back match results.

Mermaid-style relationship (textual):
```
Clients -> Gateway -> {HospitalCore, EHR, Orchestrator, Dispatch}
HospitalCore -> Postgres (Supabase) [writes]
HospitalCore -> Redis (publish resource updates)
EHR -> MongoDB (store FHIR)
Gateway -> Auth-Stub (validate tokens)
Orchestrator -> ML-Service (HTTP) -> returns prediction
```

---

## 5. Package & dependency recommendations (per service)

### Gateway
- express, helmet, cors, express-rate-limit, pino-http, jsonwebtoken, swagger-ui-express

### Hospital Core (Node + Supabase)
- express, prisma (or pg), zod/joi, ioredis, pino, express-validator

### EHR Service
- express, mongoose (or mongodb), ioredis, multer (for attachments), pino

### Orchestrator
- express or nestjs, axios/httpx, bullmq (if queuing), ioredis

### Dispatch
- express, redis/bullmq, axios, pino

### Auth-Stub
- express, jsonwebtoken, bcrypt (if doing password), pino

### ML Service (Python FastAPI)
- fastapi, uvicorn, pydantic, scikit-learn/xgboost/torch, joblib, redis

---

## 6. Important env vars (common across services)
- `NODE_ENV` (development|production)  
- `PORT`  
- `JWT_SECRET` or `JWT_PRIVATE_KEY`  
- `POSTGRES_URL` (Supabase connection)  
- `MONGO_URI`  
- `REDIS_URL`  
- `ML_SERVICE_URL`  
- `S3_BUCKET` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`  
- `IDEMPOTENCY_SECRET` (optional)  

---

## 7. Data flow patterns & idempotency
- For external ingestion (agents, hospitals) require `Idempotency-Key` header.  
- Use `X-Request-ID` for tracing.  
- Publish resource-change events (hospital resource updates) to a Redis stream `hospital.resources` and let Orchestrator/Dispatch subscribe.

---

## 8. Auth mapping & scopes
- Admin users: `role:admin`, scope: `hospital:*`  
- Hospital system clients: scopes like `ehr:write`, `resources:write`  
- ML/agent clients: `agent:ingest`  
- Patient consent tokens: `ehr:read:patient:{id}` with TTL in Redis

---

## 9. Observability & quality gates
- Logging: pino structured logs with `requestId`, `userId`, `scope`.  
- Error tracking: Sentry for runtime.  
- Health checks: `/health/live` and `/health/ready`.  
- Metrics: Expose `/metrics` for Prometheus.  
- CI: Lint → Unit tests → Integration tests (docker-compose up) → Build image.

---

## 10. CI/CD & deployment hints
- Use GitHub Actions for lint/test/build.  
- Use multi-stage Dockerfiles.  
- For demo: deploy services to Render / Heroku / Fly.io; keep ML service separate if GPU required.

---

## 11. Testing strategy (local & CI)
- Unit tests for services.  
- Contract tests: verify OpenAPI spec compatibility across gateway and services.  
- Integration tests: spin up docker-compose, run end-to-end scenario (create hospital → create bed → request dispatch → consent & EHR read).

---

## 12. Deliverables checklist (hackathon-ready)
- `openapi.yml` at repo root  
- `docker-compose.yml` for local infra  
- Seed data (`infra/seeds`)  
- Postman collection  
- Demo script and screenshots  

---

*If you'd like, I can now:* generate the `docker-compose.yml` (with placeholders), or export this file as a downloadable markdown. 

