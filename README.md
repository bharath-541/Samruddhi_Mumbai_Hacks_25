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

## 📋 Implementation Plan (Phase 2: Auth + EHR)

### **Goal:** Production-ready hospital API with:

- ✅ Supabase Auth for patients & staff (role-based)
- ✅ Patient EHR in MongoDB (prescriptions, reports, IoT logs)
- ✅ 7/14-day consent with scope-based access
- ✅ Hospital can read/write patient records during consent
- ✅ Complete audit trail of all operations

---

### **Phase A: Supabase Auth Setup** 🔐

#### Step 1: Enable Supabase Auth (Manual)

**Action Required:** Go to Supabase Dashboard → Authentication → Providers

- Enable **Email** provider (for both patients & staff)
- Set JWT expiry to 7 days (default is fine)
- Save ANON_KEY to `.env.local` as `SUPABASE_ANON_KEY`

#### Step 2: Custom JWT Claims

- [ ] Create Postgres function to add claims: `role`, `hospital_id`, `patient_id`
- [ ] Deploy via migration: `20251117000001_auth_claims.sql`
- [ ] Test: signup → JWT contains custom claims

#### Step 3: Auth Middleware

- [ ] Create `src/middleware/auth.ts` - validate Supabase JWT
- [ ] Extract `userId`, `role`, `hospitalId`, `patientId` from claims
- [ ] Attach to `req` object for downstream use
- [ ] Apply to protected routes

---

### **Phase B: MongoDB EHR Schema** 📦

#### Step 4: EHR Data Structure

```typescript
interface PatientEHR {
  patient_id: string;
  abha_id: string;
  profile: { name; dob; blood_group; phone; address };
  medical_history: Array<{ date; condition; treatment; notes }>;
  prescriptions: Array<{
    date;
    doctor_name;
    medications;
    pdf_url?: string; // Supabase Storage URL
    parsed_data: { medicines; dosage; duration };
  }>;
  test_reports: Array<{
    test_name;
    date;
    lab_name;
    pdf_url?: string;
    parsed_results: Record<string, any>;
  }>;
  iot_devices: Array<{
    device_type: "heart_rate" | "glucose" | "bp" | "spo2";
    device_id: string;
    logs: Array<{ timestamp; value; unit; context }>;
  }>;
  created_at: Date;
  updated_at: Date;
}
```

#### Step 5: EHR Helper Functions

- [ ] `src/lib/ehr.ts` - MongoDB helpers
- [ ] `createPatientEHR(patientId, profile)`
- [ ] `getPatientEHR(patientId, scope)` - filter by consent scope
- [ ] `addPrescription(patientId, prescription)`
- [ ] `addTestReport(patientId, report)`
- [ ] `addIoTLog(patientId, deviceType, log)`

---

### **Phase C: Consent System Upgrade** 🔐

#### Step 6: Consent with Scopes

- [ ] Update `POST /consent/grant` schema:
  ```json
  {
    "patientId": "uuid",
    "recipientHospitalId": "uuid",
    "recipientStaffId": "uuid (optional)",
    "scope": ["medical_history", "prescriptions", "test_reports", "iot_devices"],
    "durationDays": 7 | 14
  }
  ```
- [ ] Store in Redis with TTL (7/14 days)
- [ ] Return consent token + QR code data

#### Step 7: Scope-Based Validation

- [ ] Update `requireConsent` middleware
- [ ] Check if requested resource in granted scope
- [ ] Return 403 if scope insufficient

---

### **Phase D: Hospital EHR Access** 🏥

#### Step 8: Read Endpoints (require consent)

- [ ] `GET /ehr/patient/:id` - Full EHR (filtered by scope)
- [ ] `GET /ehr/patient/:id/prescriptions` - All prescriptions
- [ ] `GET /ehr/patient/:id/test-reports` - All reports
- [ ] `GET /ehr/patient/:id/iot/:deviceType` - IoT logs

#### Step 9: Write Endpoints (require consent + staff auth)

- [ ] `POST /ehr/patient/:id/prescription` - Add new prescription
- [ ] `POST /ehr/patient/:id/test-report` - Add test report
- [ ] `POST /ehr/patient/:id/iot-log` - Add IoT reading
- [ ] `PATCH /ehr/patient/:id/profile` - Update profile

---

### **Phase E: Audit & Capacity** 📊

#### Step 10: Comprehensive Audit Logging

- [ ] Create `src/lib/audit.ts` - `logAudit()` helper
- [ ] Wire to: admissions, discharge, consent grant/revoke, all EHR ops
- [ ] Include: userId, action, resourceType, changes (before/after), IP, requestId

#### Step 11: Capacity Dashboard

- [ ] `GET /hospitals/:id/dashboard` - Real-time stats
  - Available beds by type
  - Active admissions count
  - Doctor workload (current/max patients)
  - Low inventory alerts

---

### **Phase F: Seeds & Testing** ✅

#### Step 12: Patient Seeds with EHR Data

- [ ] Add 10 patients to `scripts/seed.js`
- [ ] Create sample EHR records in MongoDB:
  - 2-3 prescriptions per patient (with parsed data)
  - 1-2 test reports (blood test, x-ray)
  - IoT logs (heart rate: 60-100 bpm, glucose: 80-140 mg/dL)

#### Step 13: Test Admissions

- [ ] Use RPC to create 5 admissions
- [ ] Verify: beds → occupied, doctor workload ↑, capacity updates

#### Step 14: Generate Types

- [ ] Run `npm run typegen` with Supabase project ID
- [ ] Update imports across codebase

#### Step 15: End-to-End Testing

- [ ] Patient signup (Supabase Auth)
- [ ] Grant 14-day consent (all scopes)
- [ ] Staff login → view patient EHR
- [ ] Add prescription → verify audit log
- [ ] Create admission → verify bed occupied
- [ ] Discharge → verify bed available
- [ ] Check all audit logs created

---

### **Phase G: Observability** 📈

- [ ] Add Sentry integration
- [ ] Structured logging with `requestId`
- [ ] Rate limiting (Upstash)
- [ ] `/metrics` endpoint

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
