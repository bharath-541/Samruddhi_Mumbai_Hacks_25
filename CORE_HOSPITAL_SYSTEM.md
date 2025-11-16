# Samruddhi — Core Hospital System (Architecture & Consent)

Generated: 16 November 2025
Status: Design Snapshot (JWT consent + Hospital Core schema)

---

## Part A — Time‑Bound Patient Consent (Mobile ↔ Web)

### Problem

Patient uses mobile app to grant temporary EHR access; hospital staff uses a web dashboard. We need cryptographically secure, revocable, time‑limited authorization that works across both platforms.

### Solution: JWT + Redis Consent Token Flow

1. Patient grants consent (Mobile App)

- Mobile → Auth: `POST /consent/grant { patientId, recipientId, scope, duration }`
- Auth Service creates short‑lived JWT (consent token) with claims: `{ sub=patientId, aud=recipientId, scope, exp, jti=consentId }`
- Persist `consent:{jti}` in Redis with TTL to match `exp`: `{ patientId, recipientId, scope, revoked=false, expires_at }`
- Returns: `{ consentToken, consentId }`

2. Staff accesses EHR (Web)

- Web → Gateway: `GET /ehr/patient/:id` with headers
  - `Authorization: Bearer {staffJWT}`
  - `X-Consent-Token: {consentJWT}`
- Gateway validates: staff JWT, consent JWT signature+exp, Redis `consent:{jti}` exists and `revoked=false`, `aud` matches staff ID, scope matches resource.
- Gateway forwards to EHR service (also performs its own checks) and returns FHIR data.

3. Revocation (Mobile)

- Mobile → Auth: `POST /consent/revoke { consentId }`
- Auth sets `revoked=true` on `consent:{jti}` (immediate effect on next access).

#### Redis Schema

- Key: `consent:{consentId}`
- Value: `{ patient_id, recipient_id, scope, granted_at, expires_at, revoked, audit: [...] }`
- TTL: equal to token `exp` (auto‑cleanup)

#### Consent JWT Claims (example)

```json
{
  "iss": "samruddhi-auth",
  "sub": "patient-123",
  "aud": "doctor-456",
  "scope": "ehr:read:patient:123",
  "exp": 1731759600,
  "iat": 1731752400,
  "jti": "consent-uuid"
}
```

#### Staff Session JWT (example)

```json
{
  "iss": "samruddhi-auth",
  "sub": "doctor-456",
  "role": "doctor",
  "hospital_id": "hospital-789",
  "scope": "hospital:* ehr:request",
  "exp": 1731838800
}
```

#### QR Code Bridge (Hackathon‑friendly)

- Staff generates QR `{ doctorId, requestId, callback_url }`.
- Patient scans → app calls `/consent/grant` → sends token to `callback_url` or displays token.
- Staff proceeds immediately; countdown shows time left.

#### Trade‑offs

- JWT + Redis: stateless verification + instant revocation; requires Redis, dual tokens.
- JWT only: simpler; no revocation (requires very short expiry).
- Session: easy revocation; less scalable for microservices.

## Hackathon MVP Stack — Small-Scale Decision

- Use managed services to move fast: Supabase (Postgres + Auth + RLS), Vercel (serverless API), Upstash Redis (consent + rate limiting), MongoDB Atlas (EHR read-only).
- Client: `@supabase/supabase-js` (typed via Supabase type-gen). No Prisma, no Docker for the hackathon.
- SQL-only migrations via Supabase CLI; use 1–2 Postgres RPCs for atomic flows (admission/discharge).
- Enable pgBouncer on Supabase; keep serverless functions short; offload long jobs post-demo.

Quick checklist

- Decide environments: dev (default), prod (after demo)
- Create Supabase project; note `PROJECT_URL`, `ANON_KEY`, `SERVICE_ROLE`
- Provision Upstash Redis; copy `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Create MongoDB Atlas free cluster; copy `MONGO_URI`
- Create a Vercel project; add all env vars; set regions close to Supabase

Required environment variables (API/Gateway)

- `NODE_ENV`, `PORT`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`
- `REDIS_URL` (or Upstash REST: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- `MONGO_URI`
- `JWT_SECRET` (for staff/admin tokens if not using Supabase Auth)
- `IDEMPOTENCY_SECRET` (optional)

Setup steps (macOS zsh)

```bash
# Supabase CLI
brew install supabase/tap/supabase
supabase login

# Initialize migrations in repo (creates supabase/ directory)
supabase init

# Create a new migration file and apply to local (optional) or remote
supabase db migration new init_core
# Edit the generated SQL, then:
supabase db push                 # local
# or deploy to remote project
supabase link --project-ref <your-ref>
supabase db push --remote        # apply SQL migrations to remote

# Type generation for supabase-js (run in CI too)
npx supabase gen types typescript --project-id <your-ref> \
#### Next Steps (Consent)
```

When to add Prisma or Docker (after demo)

- Prisma: team >3, model churn high, move API to serverful (Render/Fly) or use Prisma Accelerate.
- Docker Compose: if local parity/offline dev becomes painful; include Postgres, Redis, EHR stub.

- Implement Auth Service endpoints: `/consent/grant`, `/consent/revoke`.
- Gateway middleware: validate staff JWT + consent JWT + Redis.
- Mobile UI: QR scan + consent screen.
- Web UI: input/receive consent token; display expiry countdown.

---

## Part B — Hospital Core Schema & Architecture

### Design Principles

- Multi‑tenancy: every domain table includes `hospital_id`.
- Auditability: complete change history for critical operations.
- Real‑time capacity: low‑latency availability queries.
- Transfer workflows: inter‑hospital sharing (beds, inventory, etc.).
- Compliance‑ready: scoped access, PII minimization, encryption.

### 1) Hospitals

```
hospitals
- id (uuid, PK)
- name (text, NOT NULL)
- registration_number (text, UNIQUE)
- type (enum: government, private, trust)
- tier (enum: primary, secondary, tertiary)
- address (jsonb)              -- { street, city, state, pincode }
- coordinates (point/geography)
- contact_phone (text)
- contact_email (text)
- admin_user_id (uuid, FK -> users.id)
- capacity_summary (jsonb)     -- denormalized dashboard cache
- is_active (boolean)
- created_at, updated_at (timestamptz)
- metadata (jsonb)
Indexes: geospatial on coordinates, gin(capacity_summary)
```

### 2) Departments

```
departments
- id (uuid, PK)
- hospital_id (uuid, FK)
- name (text)
- code (text)                  -- UNIQUE(hospital_id, code)
- floor_number (int)
- head_doctor_id (uuid, FK -> doctors.id, nullable)
- is_active (boolean)
- created_at, updated_at
Indexes: (hospital_id)
```

### 3) Doctors

```
doctors
- id (uuid, PK)
- hospital_id (uuid, FK)
- user_id (uuid, FK -> users.id, nullable)
- name (text)
- license_number (text, UNIQUE)
- specialization (text)
- qualification (text[])
- department_id (uuid, FK)
- contact_phone (text)
- contact_email (text)
- shift_pattern (jsonb)
- is_on_duty (boolean)
- max_patients (int default 10)
- current_patient_count (int default 0)
- is_active (boolean)
- hired_at (date)
- created_at, updated_at
Indexes: (hospital_id), (department_id), (is_on_duty, is_active)
```

### 4) Staff (Nurses & Support)

```
staff
- id (uuid, PK)
- hospital_id (uuid, FK)
- user_id (uuid, FK -> users.id, nullable)
- name (text)
- role (enum: nurse, technician, admin, janitor, security)
- department_id (uuid, FK)
- shift (enum: morning, evening, night, rotating)
- shift_start_time, shift_end_time (time)
- contact_phone (text)
- is_on_duty (boolean)
- is_active (boolean)
- hired_at (date)
- created_at, updated_at
Indexes: (hospital_id), (is_on_duty, shift)
```

### 5) Beds

```
beds
- id (uuid, PK)
- hospital_id (uuid, FK)
- bed_number (text)            -- UNIQUE(hospital_id, bed_number)
- department_id (uuid, FK)
- type (enum: general, icu, nicu, picu, emergency, isolation)
- status (enum: available, occupied, maintenance, reserved)
- floor_number (int)
- room_number (text)
- features (text[])
- current_admission_id (uuid, FK -> admissions.id, nullable)
- last_occupied_at, last_cleaned_at (timestamptz)
- maintenance_notes (text)
- created_at, updated_at
Indexes: (hospital_id, status, type), partial index WHERE status='available'
Checks: occupied ⇒ current_admission_id IS NOT NULL
```

### 6) Admissions

```
admissions
- id (uuid, PK)
- admission_number (text, UNIQUE)
- hospital_id (uuid, FK)
- patient_id (uuid, FK -> patients.id)
- bed_id (uuid, FK -> beds.id)
- primary_doctor_id (uuid, FK -> doctors.id)
- department_id (uuid, FK)
- admission_type (enum: emergency, planned, transfer)
- reason (text)
- diagnosis (text)
- severity (enum: critical, serious, stable)
- admitted_at (timestamptz)
- estimated_discharge_at (timestamptz)
- discharged_at (timestamptz, nullable)
- discharge_summary (text)
- discharge_type (enum: normal, against_advice, transferred, deceased)
- transferred_to_hospital_id (uuid, FK -> hospitals.id, nullable)
- billing_status (enum: pending, partial, paid)
- total_cost (decimal)
- insurance_claim_id (text)
- created_by (uuid, FK -> users.id)
- created_at, updated_at
Indexes: (hospital_id, admitted_at DESC), (patient_id), (discharged_at NULLS FIRST), (primary_doctor_id)
```

Business rules (triggers):

- On admission insert: set bed → `occupied`, link `current_admission_id`, increment doctor load, update `capacity_summary`.
- On discharge: free bed, unlink admission, decrement doctor load, update `capacity_summary`.

### 7) Inventory

```
inventory
- id (uuid, PK)
- hospital_id (uuid, FK)
- item_name (text)
- category (enum: medicine, equipment, consumable, blood, oxygen)
- sku (text)
- current_stock (decimal >= 0)
- unit (text)
- reorder_threshold (decimal)
- max_capacity (decimal)
- cost_per_unit (decimal)
- supplier (text)
- expiry_date (date, nullable)
- batch_number (text)
- storage_location (text)
- last_restocked_at (timestamptz)
- is_critical (boolean)
- created_at, updated_at
Indexes: (hospital_id, category), partial WHERE current_stock <= reorder_threshold
Unique: (hospital_id, item_name, batch_number)
```

### 8) Inventory Transactions (Audit)

```
inventory_transactions
- id (uuid, PK)
- inventory_id (uuid, FK -> inventory.id)
- transaction_type (enum: restock, consume, transfer_out, transfer_in, adjustment, waste)
- quantity (decimal)
- previous_stock (decimal)
- new_stock (decimal)
- reference_type (text)
- reference_id (uuid)
- performed_by (uuid, FK -> users.id)
- notes (text)
- created_at (timestamptz)
Indexes: (inventory_id, created_at DESC), (reference_id)
```

### 9) Transfer Requests (Inter‑hospital)

```
transfer_requests
- id (uuid, PK)
- request_number (text, UNIQUE)
- requester_hospital_id (uuid, FK)
- donor_hospital_id (uuid, FK, nullable)
- resource_type (enum: bed, doctor, inventory, ambulance)
- resource_details (jsonb)
- urgency (enum: critical, high, medium, low)
- patient_condition (text)
- requested_by (uuid, FK -> users.id)
- status (enum: pending, matched, accepted, rejected, fulfilled, cancelled, expired)
- matched_at, accepted_at, fulfilled_at (timestamptz)
- rejection_reason (text)
- expires_at (timestamptz)
- created_at, updated_at
Indexes: (status, urgency, created_at), (donor_hospital_id) WHERE status='pending'
```

### 10) Transfer Responses

```
transfer_responses
- id (uuid, PK)
- transfer_request_id (uuid, FK -> transfer_requests.id)
- donor_hospital_id (uuid, FK)
- resource_id (uuid)             -- e.g., bed.id or inventory.id
- response_type (enum: offer, accept, reject)
- offered_at (timestamptz)
- availability_until (timestamptz)
- estimated_transfer_time (interval)
- conditions (text)
- responded_by (uuid, FK -> users.id)
- created_at (timestamptz)
Indexes: (transfer_request_id), (donor_hospital_id)
```

### 11) Patients (Minimal PII)

```
patients
- id (uuid, PK)
- ehr_id (uuid)                  -- EHR service reference
- abha_id (text, UNIQUE)
- name_encrypted (bytea)
- dob_encrypted (bytea)
- gender (enum: male, female, other, prefer_not_to_say)
- blood_group (text)
- emergency_contact_encrypted (bytea)
- created_at, updated_at
Indexes: (abha_id), (ehr_id)
```

### 12) Users

```
users
- id (uuid, PK)
- email (text, UNIQUE)
- password_hash (text)
- role (enum: super_admin, hospital_admin, doctor, nurse, staff)
- hospital_id (uuid, FK, nullable)
- linked_entity_id (uuid)        -- doctor.id or staff.id
- linked_entity_type (text)
- is_active (boolean)
- last_login_at (timestamptz)
- created_at, updated_at
Indexes: (email), (hospital_id, role)
```

### 13) Audit Logs

```
audit_logs
- id (uuid, PK)
- hospital_id (uuid, FK)
- user_id (uuid, FK)
- action (text)                  -- e.g., "admission_create"
- resource_type (text)           -- e.g., "bed"
- resource_id (uuid)
- changes (jsonb)                -- { before, after }
- ip_address (inet)
- user_agent (text)
- request_id (uuid)
- created_at (timestamptz)
Indexes: (hospital_id, created_at DESC), (user_id, created_at DESC), (resource_type, resource_id), gin(changes)
```

---

## Performance‑Critical Indexes (SQL)

```sql
-- Bed availability
CREATE INDEX IF NOT EXISTS idx_beds_available
ON beds(hospital_id, status, type)
WHERE status = 'available';

-- Active admissions
CREATE INDEX IF NOT EXISTS idx_admissions_active
ON admissions(hospital_id, admitted_at DESC)
WHERE discharged_at IS NULL;

-- Low inventory alerts
CREATE INDEX IF NOT EXISTS idx_inventory_low
ON inventory(hospital_id, category)
WHERE current_stock <= reorder_threshold;

-- Pending transfers
CREATE INDEX IF NOT EXISTS idx_transfers_pending
ON transfer_requests(status, urgency, created_at)
WHERE status = 'pending';
```

---

## Real‑time & Caching

### Redis Streams

- `hospital.resources`: bed/inventory changes
- `hospital.alerts`: low stock, capacity warnings
- `transfer.requests`: newly created requests

### Example Event Payloads

```json
{ "event": "bed.occupied", "hospital_id": "uuid", "bed_id": "uuid", "bed_type": "icu", "timestamp": "2025-11-16T10:30:00Z" }
{ "event": "inventory.low", "hospital_id": "uuid", "item": "Oxygen cylinder", "current_stock": 2, "threshold": 5 }
{ "event": "transfer.request.created", "request_id": "uuid", "resource_type": "bed", "urgency": "critical" }
```

### Cache Keys (TTL ~5m)

- `hospital:{id}:capacity`
- `hospital:{id}:alerts`
- `doctor:{id}:workload`

---

## Security & RLS (Supabase examples)

```sql
-- Hospital data isolation
CREATE POLICY hospital_isolation ON admissions
FOR ALL TO authenticated
USING (hospital_id = current_setting('jwt.claims.hospital_id')::uuid);

-- Doctor sees own patients
CREATE POLICY doctor_patients ON admissions
FOR SELECT TO authenticated
USING (primary_doctor_id = current_setting('jwt.claims.doctor_id')::uuid);
```

PII:

- Encrypt patient name/DOB/contact at rest; rotate keys; strict audit in `audit_logs`.

---

## Hackathon Roadmap (4–5 Days)

Day 0 — Infra & Envs

- Create Supabase project, Upstash Redis, Mongo Atlas, Vercel project
- Add env vars; enable Supabase pgBouncer; set region affinity
- Initialize SQL migrations repo structure; commit baseline

Day 1 — Core Schema & RLS

- Implement tables: hospitals, departments, doctors, beds, admissions, users
- Add performance indexes from this doc; seed minimal data
- Add RLS policies for `hospital_id` isolation and doctor-scope reads; verify claim mapping

Day 2 — Admissions Workflow (Atomic)

- Implement Postgres RPC `admission_create_atomic(hospital_id, patient_id, bed_type, doctor_id, reason)`
- Implement RPC `admission_discharge_atomic(admission_id, discharge_type, summary)`
- API routes: `POST /admissions`, `PATCH /admissions/:id/discharge`; connect supabase-js
- Publish bed updates to Redis stream `hospital.resources`

Day 3 — Consent & EHR Read

- Implement Auth endpoints: `/consent/grant`, `/consent/revoke` using Upstash Redis TTL
- Gateway middleware validates staff JWT + consent JWT + Redis
- Connect EHR read-only path (`GET /ehr/patient/:id`) to Mongo Atlas

Day 4 — Dashboards, Quality Gates, Demo

- Dashboards: available beds, active admissions, low inventory (read-first)
- Add Upstash rate limiting; Sentry; Supabase slow-query alerts
- Polish OpenAPI, Postman collection, demo script/screenshots

## Operational Targets

- Dashboard load < 200ms (cache + denormalized `capacity_summary`).
- Bed availability < 50ms (partial index).
- Admission create < 500ms (single transaction).
- Transfer matching < 2s (pre‑scored by ML).

---

## Migration Plan

- Phase 1 (Core): hospitals, departments, doctors, staff, beds, admissions + core indexes.
- Phase 2 (Inventory & Audit): inventory, inventory_transactions, audit_logs + triggers.
- Phase 3 (Transfers): transfer_requests, transfer_responses + state machine.
- Phase 4 (Hardening): RLS, Redis streams, performance tuning, backups.

---

## Immediate Next Steps

1. Generate SQL migrations (Supabase CLI) for core tables and indexes; commit.
2. Write two Postgres RPCs for atomic admissions and discharge; test via SQL.
3. Build Gateway middleware for consent token validation (JWT + Redis).
4. Create seed data (3 hospitals, 50 beds each, 10 doctors, basic inventory).
5. Implement minimal API routes on Vercel; wire supabase-js and Upstash.
6. Add Sentry, Upstash rate limiting, and enable Supabase query logs.

Questions to Confirm:

- Prisma vs raw SQL for migrations?
- Read replicas required for analytics?
- Inventory as bulk vs serialized items?
- Concurrency control for bed assignment (optimistic locking)?
