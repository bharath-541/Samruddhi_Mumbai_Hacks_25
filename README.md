# Samruddhi Backend — Phase 1 (Core + Admissions + Consent)

This README now covers: Day 0–1 completed work and immediate next steps to finish Phase 1 (atomic Admissions + initial Consent/EHR access). Keep it lean and actionable.

## What you provide

- Supabase: `project-ref`, `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE` (keep secret)
- Upstash Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Mongo Atlas: `MONGO_URI` (read-only user ok for MVP)
- Vercel: project name and preferred region (close to Supabase)

## One-time setup (macOS zsh)

```bash
# Tools
brew install supabase/tap/supabase
npm i -g vercel

# Login to providers (browser prompts)
supabase login
vercel login
```

## Repo setup

```bash
# Copy env template and fill values
cp .env.example .env.local

# Initialize Supabase project files (creates supabase/)
supabase init
supabase link --project-ref <YOUR_PROJECT_REF>

# Create first migration (edit SQL later if needed)
supabase db migration new init_core

# Push migrations
# locally (optional)
supabase db push
# or remote (recommended once SQL is ready)
supabase db push --remote
```

## Env vars (Vercel project)

Add these variables in Vercel → Settings → Environment Variables:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `MONGO_URI`, `JWT_SECRET`, `IDEMPOTENCY_SECRET`
- `NODE_ENV`, `PORT` (optional on serverless)

## Clean commits

```bash
git add .
git commit -m "chore: repo scaffolding (.gitignore, README, .env.example)"
```

---

## Phase 1 Status Snapshot

Completed (Day 0–1):

- Repo + env scaffolding (`.env.example`, `.gitignore`, Supabase linked)
- Core tables migrated: `users`, `hospitals`, `departments`, `doctors`, `patients`, `beds`, `admissions`, `audit_logs`
- RLS policies for hospital isolation + doctor-scope admissions
- Seed data: 1 super admin, 3 hospitals, 8 departments, 10 doctors, 150 beds (all available)
- Performance indexes: available beds, active admissions

Pending (to finish Phase 1):

- Postgres RPCs: `admission_create_atomic`, `admission_discharge_atomic`
- Bed & doctor workload trigger logic + capacity summary refresh
- Minimal patients + sample admission seed (after RPCs)
- Consent endpoints `/consent/grant`, `/consent/revoke` (JWT + Redis TTL)
- EHR read endpoint `GET /ehr/patient/:id` (Mongo + validated consent)

---

## Admissions Atomic Workflow (Design)

RPC: `admission_create_atomic(hospital_id uuid, patient_id uuid, bed_type text, doctor_id uuid, reason text)`
Steps (single transaction):

1. Select one `beds` row WHERE `hospital_id = $1 AND type = $3 AND status = 'available'` ORDER BY `bed_number` FOR UPDATE SKIP LOCKED.
2. INSERT into `admissions` with generated `admission_number`, `admitted_at = now()`.
3. UPDATE bed → `status='occupied'`, `current_admission_id = admissions.id`, `last_occupied_at = now()`.
4. UPDATE doctor workload: `current_patient_count = current_patient_count + 1` (check `< max_patients`).
5. Refresh hospital capacity summary (simple recompute or increment counters) and UPDATE `hospitals.capacity_summary`.
6. INSERT audit log `action='admission_create'`.
7. Return admission row + bed id.

RPC: `admission_discharge_atomic(admission_id uuid, discharge_type text, summary text)`
Steps:

1. SELECT admission FOR UPDATE (ensure not already discharged).
2. UPDATE admission: `discharged_at = now()`, `discharge_type`, `discharge_summary = summary`.
3. UPDATE bed: `status='available'`, `current_admission_id = NULL`, `last_cleaned_at = now()` (or leave for housekeeping trigger).
4. UPDATE doctor workload: decrement.
5. Refresh `hospitals.capacity_summary`.
6. INSERT audit log `action='admission_discharge'`.
7. Return updated admission.

Failure modes: no bed available → raises exception; doctor at capacity → exception; admission already discharged → exception.

Migration naming convention:

```bash
supabase db migration new admissions_rpcs
```

Add functions + SECURITY DEFINER if needed; ensure RLS policies allow execution.

---

## Consent & EHR (Initial MVP)

JWT (staff session): claims include `hospital_id`, `role`, optionally `doctor_id`.
Consent JWT (patient grant): `{ sub=patient_id, aud=staff_id, scope, exp, jti }` stored in Redis key `consent:{jti}` with TTL.

Endpoints:

```http
POST /consent/grant       { patientId, recipientId, scope, durationMinutes }
POST /consent/revoke      { consentId }
GET  /ehr/patient/:id     Headers: Authorization: Bearer <staffJWT>, X-Consent-Token: <consentJWT>
```

Validation pipeline (Gateway middleware):

1. Verify staff JWT signature & exp.
2. Verify consent JWT signature & exp.
3. Fetch Redis `consent:{jti}`; ensure `revoked=false`, `aud` matches staff ID, `scope` permits resource.
4. Proceed to EHR read (Mongo).

Revocation: set `revoked=true` in Redis; do not delete (audit trail) — TTL still handles expiry.

---

## Immediate Commands (Phase 1 Work Queue)

Create migration for RPCs:

```bash
supabase db migration new admissions_rpcs
# edit supabase/migrations/<timestamp>_admissions_rpcs.sql
supabase db push --remote
```

Generate types (run after each migration):

```bash
npx supabase gen types typescript --project-id <YOUR_PROJECT_REF> > src/types/supabase.ts
```

Run seed (after RPCs added and optional patient data extended):

```bash
node scripts/seed.js
```

Sketch consent implementation (serverless function):

```bash
# grant pseudo-flow
curl -X POST /api/consent/grant -d '{"patientId":"...","recipientId":"...","scope":"ehr:read:patient:...","durationMinutes":15}'
```

---

## Minimal API Surface (MVP)

- `POST /admissions` → calls `admission_create_atomic`
- `PATCH /admissions/:id/discharge` → calls `admission_discharge_atomic`
- `GET /beds?hospitalId=<id>&type=<type>&status=available`
- `POST /consent/grant` / `POST /consent/revoke`
- `GET /ehr/patient/:id`
- `GET /hospitals/:id/capacity` (reads `capacity_summary`)

---

## Remaining Phase 1 Checklist

- [ ] Migrate RPC functions (create + discharge)
- [ ] Implement triggers or inline logic for capacity summary refresh
- [ ] Add doctor workload constraints & error handling
- [ ] Add patient sample + one demo admission via RPC
- [ ] Implement consent grant/revoke (Redis integration)
- [ ] Implement EHR read route (Mongo lookup + consent validation)
- [ ] Wire audit logs for consent actions
- [ ] Add type generation + commit generated Supabase types

Optional (nice to have before demo): rate limiting (Upstash), structured logging fields (`requestId`, `userId`).

---

## Next After Phase 1 (Preview)

Phase 2: Inventory & transactions tables + low-stock alerts.
Phase 3: Transfer requests/responses & matching logic.
Phase 4: Hardening (full RLS coverage, metrics, dashboards, performance tuning).

---

Keep deeper architecture details in `CORE_HOSPITAL_SYSTEM.md`; this README stays operational.
