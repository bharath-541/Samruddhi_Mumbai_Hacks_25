# Samruddhi Backend — Hospital Core + Consent System

## ✅ Completed (Phase 1)

**Infrastructure:** Express + TypeScript, Supabase (6 migrations), Upstash Redis, MongoDB Atlas  
**Core Schema:** users, hospitals, departments, doctors, patients, beds, admissions, audit_logs + RLS  
**Seed Data:** 3 hospitals, 8 departments, 10 doctors, 150 beds (idempotent script)  
**Admissions:** Atomic RPCs (create with bed locking, discharge with workload updates) + endpoints  
**Consent Flow:** JWT grant/revoke + Redis TTL + middleware validation  
**EHR Access:** GET endpoint with requireConsent guard + MongoDB integration  
**Read Endpoints:** beds, capacity, doctors, admissions (all with query filters)  
**Verified:** Redis write/read ✓, MongoDB write/read ✓, RPC dry-run ✓

## 🚀 Quick Start

```bash
npm install
npm run dev          # Start server (port 3000)
npm run seed         # Load/update seed data
npm run build        # Compile TypeScript
```

## 📋 Today's Plan (17 Nov 2025)

### Priority 1: Generate Types & Add Patient Seeds
- [ ] Run `npx supabase gen types` to generate real Supabase types
- [ ] Add 10 sample patients to seed script
- [ ] Link 3-5 patients to admissions via RPC
- [ ] Verify occupied bed logic works

### Priority 2: Inventory Module (Phase 2 Start)
- [ ] Create migration: inventory + inventory_transactions tables
- [ ] Add triggers for stock updates + audit trail
- [ ] Seed inventory items (medicines, equipment, consumables)
- [ ] Implement low-stock alert endpoint

### Priority 3: Testing & Quality
- [ ] Add Vitest + Supertest setup
- [ ] Write tests for admission endpoints
- [ ] Write tests for consent flow
- [ ] Add basic integration tests

### Priority 4: Observability
- [ ] Add Sentry integration
- [ ] Structured logging with request IDs
- [ ] Add `/metrics` endpoint for monitoring
- [ ] Rate limiting on public endpoints

## 📚 Docs

- Architecture: `CORE_HOSPITAL_SYSTEM.md`
- Roadmap: `samruddhi_roadmap_and_dependencies.md`
- Supabase Setup: `samruddhi_supabase_hospital_setup.md`

## 🔑 Environment Variables

Required in `.env.local`:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `MONGO_URI`
- `JWT_SECRET`
- `PORT` (default: 3000)

## 📦 Key NPM Scripts

```bash
npm run dev              # Dev server with hot reload
npm run build            # Compile TypeScript
npm run seed             # Idempotent seed data
npm run typegen          # Generate Supabase types
npm run consent:grant    # CLI: Grant consent
npm run consent:revoke   # CLI: Revoke consent
```

## 🏥 API Endpoints

**Admissions:**
- `POST /admissions` - Create admission (atomic with bed locking)
- `PATCH /admissions/:id/discharge` - Discharge patient
- `GET /admissions?hospitalId=&active=true` - List admissions
- `GET /admissions/:id` - Get single admission

**Resources:**
- `GET /beds?hospitalId=&type=&status=` - Query beds
- `GET /hospitals/:id/capacity` - Get capacity summary
- `GET /doctors?hospitalId=&departmentId=` - List doctors

**Consent & EHR:**
- `POST /consent/grant` - Grant EHR access (7-day TTL)
- `POST /consent/revoke` - Revoke consent
- `GET /ehr/patient/:id` - Read EHR (requires consent)

**Health:**
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## 🎯 Next Steps After Today

**Phase 2:** Inventory management + stock tracking  
**Phase 3:** Transfer requests (inter-hospital resource sharing)  
**Phase 4:** ML predictions, dashboards, deployment

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
