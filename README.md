# Samruddhi Backend — Hospital Core + Shared Redis Consent System

## ✅ Completed (Phase 1)

**Infrastructure:** Express + TypeScript, Supabase (7 migrations), Upstash Redis (shared), MongoDB Atlas  
**Core Schema:** users, hospitals, departments, doctors, patients, beds, admissions, audit_logs + RLS  
**Auth:** Supabase Auth for patients & staff with custom JWT claims (role, hospital_id, patient_id)  
**Admissions:** Atomic RPCs (create with bed locking, discharge with workload updates) + endpoints  
**Consent Architecture:** Shared Redis between patient app and hospital backend (Option B)  
**EHR System:** MongoDB with full schema (profile, prescriptions, test_reports, iot_devices, medical_history)  
**Endpoints:** 25+ endpoints (hospitals, beds, doctors, admissions, consent, EHR read/write)  
**Verified:** Redis ✓, MongoDB ✓, Supabase Auth ✓, Consent JWT ✓

---

## 🏗️ Architecture: Shared Redis Consent (Option B)

### **Two JWT Systems**

1. **Authentication JWT** (Supabase)

   - Issued when user logs in (patient or admin)
   - Short-lived (1 hour, auto-refreshed)
   - Contains: `sub` (user_id), `role`, `hospital_id`, `patient_id`
   - Used to prove WHO you are

2. **Consent JWT** (Custom)
   - Issued when patient grants access to hospital
   - Long-lived (7 or 14 days, patient's choice)
   - Stored in **shared Upstash Redis** (patient app + hospital backend)
   - Used to prove patient GRANTED ACCESS

### **Shared Redis Key Structure**

```redis
# Consent Record (main)
consent:{jti}                           → Full consent record (JSON)
  TTL: durationDays * 86400 seconds
  Fields: { patientId, recipientId, recipientHospitalId, scope[], grantedAt, expiresAt, revoked }

# Patient Index (for listing patient's consents)
patient:{patientId}:consents            → Set of consent JTIs
  SADD when granted, SREM when expired/revoked

# Hospital Index (for listing hospital's received consents)
hospital:{hospitalId}:consents          → Set of consent JTIs
  SADD when granted, SREM when expired/revoked

# Revocation Flag (fast check)
consent:{jti}:revoked                   → "1" if revoked, NULL if valid
  TTL: same as consent (auto-cleanup)
```

### **Why Shared Redis (Option B)?**

✅ **Single source of truth** - Both patient app and hospital backend see same data  
✅ **Instant revocation** - Patient revokes → hospital sees it immediately  
✅ **No patient API needed** - Hospital doesn't call patient's server  
✅ **Works offline** - Patient can check cached JWT locally  
✅ **Simple architecture** - One Upstash Redis instance, shared credentials

---

## 🔄 Complete Consent Flow

### **1. Patient Grants Access**

```http
POST /consent/grant
Authorization: Bearer <PATIENT_SUPABASE_JWT>
Content-Type: application/json

{
  "recipientId": "staff-uuid",
  "recipientHospitalId": "hospital-uuid",
  "scope": ["profile", "prescriptions", "test_reports", "iot_devices"],
  "durationDays": 14
}
```

**Server Actions:**

1. Validate patient JWT (requireAuth middleware)
2. Extract `patientId` from `req.user.sub`
3. Verify patient can only grant consent for themselves
4. Generate Consent JWT with `jti` (unique consent ID)
5. Store in shared Redis:
   ```redis
   SET consent:{jti} '{"patientId":"...","scope":[...],...}' EX 1209600
   SADD patient:{patientId}:consents {jti}
   SADD hospital:{hospitalId}:consents {jti}
   ```
6. Return Consent JWT to patient

**Patient App Actions:**

- Receives Consent JWT
- Optionally caches locally for offline check
- Shares JWT with hospital (QR code, deep link, SMS, etc.)

---

### **2. Hospital Accesses Patient Data**

```http
GET /ehr/patient/{patientId}/prescriptions
Authorization: Bearer <ADMIN_SUPABASE_JWT>    # Proves admin identity
X-Consent-Token: <CONSENT_JWT>                # Proves patient consent
```

**Middleware Validation (requireConsent):**

1. Verify Admin JWT (Supabase)
2. Decode Consent JWT and extract `jti`
3. **Check shared Redis:**
   ```redis
   EXISTS consent:{jti}:revoked  → if 1, return 403 "Consent revoked"
   GET consent:{jti}              → if null, return 403 "Consent expired"
   ```
4. Validate:
   - `consent.hospitalId === req.user.hospital_id`
   - `consent.patientId === req.params.id`
   - `"prescriptions" IN consent.scope`
5. If all pass, fetch prescriptions from MongoDB

---

### **3. Patient Revokes Access**

```http
POST /consent/revoke
Authorization: Bearer <PATIENT_SUPABASE_JWT>
Content-Type: application/json

{ "consentId": "jti-uuid" }
```

**Server Actions:**

1. Validate patient JWT
2. Get consent: `GET consent:{consentId}`
3. Verify ownership: `req.user.sub === consent.patientId`
4. Mark revoked:
   ```redis
   SET consent:{consentId}:revoked "1" EX {remaining_ttl}
   ```
5. Update consent record: `{ ...consent, revoked: true }`

**Result:**

- Hospital's next request will fail with 403 (sees `consent:revoked` flag)
- Patient app clears local cache

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

---

## 📚 Implementation Status

### **✅ Completed**

- Supabase Auth with custom JWT claims (role, hospital_id, patient_id)
- Shared Redis consent architecture (Option B) **FULLY IMPLEMENTED**
  - Redis helpers: isConsentRevoked, addToPatientIndex, addToHospitalIndex, getPatientConsents, getHospitalConsents
  - Fast path revocation checking (consent:{jti}:revoked flag)
  - Patient and hospital indexes for listing consents
- **5 Consent Endpoints IMPLEMENTED:**
  - POST /consent/grant (requireAuth, patient ownership validation)
  - POST /consent/revoke (requireAuth, patient ownership validation)
  - GET /consent/status/:consentId (public, returns valid/revoked/expired status)
  - GET /consent/my (requireAuth, patient's granted consents with hospital names)
  - GET /consent/received (requireAuth, hospital's received active consents)
- Enhanced consent middleware with fast path revocation check + hospital validation
- Complete EHR schema in MongoDB (profile, prescriptions, test_reports, iot_devices, medical_history)
- Auth middleware (requireAuth, requireRole, requireHospital)
- Consent middleware (requireConsent, requireConsentScope)
- 30+ API endpoints (hospitals, beds, admissions, consent, EHR read/write)
- Hospital dashboard with real-time stats
- Audit logging infrastructure (8 helper functions)
- Atomic admission RPCs (create/discharge with bed locking)
- **Test script with complete consent flow** (grant → access → revoke → blocked verification)

### **⏳ In Progress**

- Wire audit logs to all endpoints
- Test complete end-to-end consent workflow with server running

### **📋 Pending**

- Generate Supabase TypeScript types (npm run typegen)
- Seed patient data with EHR records
- Create test admissions via RPC
- QR code generation for consent sharing
- Patient-side Redis integration docs

---

## 🎯 Next Steps

**Immediate (Today):**

1. ✅ Implement consent list endpoints (my, received, status) - DONE
2. ✅ Enhanced consent middleware with fast revocation check - DONE
3. ✅ Update test script for complete workflow - DONE
4. Run test script to verify: grant → access → revoke → blocked flow
5. Wire audit logging to all consent/EHR operations

**Phase 2 (Next Session):**

1. Inventory management + stock tracking
2. Transfer requests (inter-hospital resource sharing)
3. ML predictions for capacity forecasting
4. Admin dashboards and visualizations

**Phase 3 (Production Ready):**

1. Rate limiting (Upstash)
2. Sentry integration
3. Performance optimization
4. CI/CD pipeline
5. Deployment (Railway/Fly.io)

---

## 📚 Additional Documentation

- Architecture: `CORE_HOSPITAL_SYSTEM.md`
- API Reference: `API_ENDPOINTS.md`
- Roadmap: `samruddhi_roadmap_and_dependencies.md`
- Supabase Setup: `samruddhi_supabase_hospital_setup.md`

---

---

## 📡 API Endpoints (Complete)

### **Consent Management**

#### `POST /consent/grant` (Patient Auth Required)

Grant EHR access to hospital for specified scopes and duration.

**Headers:** `Authorization: Bearer <PATIENT_SUPABASE_JWT>`

**Body:**

```json
{
  "recipientId": "staff-uuid",
  "recipientHospitalId": "hospital-uuid",
  "scope": ["profile", "prescriptions", "test_reports", "iot_devices"],
  "durationDays": 14
}
```

**Response:**

```json
{
  "consentId": "jti-uuid",
  "consentToken": "eyJhbGci...",
  "expiresAt": "2025-12-01T10:00:00Z",
  "scope": ["profile", "prescriptions"],
  "durationDays": 14
}
```

---

#### `POST /consent/revoke` (Patient Auth Required)

Revoke previously granted consent.

**Headers:** `Authorization: Bearer <PATIENT_SUPABASE_JWT>`

**Body:**

```json
{ "consentId": "jti-uuid" }
```

**Response:**

```json
{
  "success": true,
  "message": "Consent revoked",
  "consentId": "jti-uuid"
}
```

---

#### `GET /consent/status/:consentId` (Optional Auth)

Check consent validity (both patient and hospital can call).

**Response:**

```json
{
  "consentId": "jti-uuid",
  "valid": true,
  "revoked": false,
  "expiresAt": "2025-12-01T10:00:00Z",
  "scope": ["profile", "prescriptions"],
  "patientId": "patient-uuid",
  "hospitalId": "hospital-uuid"
}
```

---

#### `GET /consent/my` (Patient Auth Required)

List all consents granted by patient.

**Response:**

```json
{
  "consents": [
    {
      "consentId": "jti-uuid",
      "hospitalId": "hospital-uuid",
      "hospitalName": "City General Hospital",
      "scope": ["profile", "prescriptions"],
      "grantedAt": "2025-11-17T10:00:00Z",
      "expiresAt": "2025-12-01T10:00:00Z",
      "revoked": false
    }
  ]
}
```

---

#### `GET /consent/received` (Hospital Admin Auth Required)

List all consents received by hospital.

**Response:**

```json
{
  "consents": [
    {
      "consentId": "jti-uuid",
      "patientId": "patient-uuid",
      "scope": ["profile", "test_reports"],
      "grantedAt": "2025-11-17T10:00:00Z",
      "expiresAt": "2025-12-01T10:00:00Z",
      "revoked": false
    }
  ]
}
```

---

### **Patient EHR Access (Requires Consent + Admin Auth)**

All EHR endpoints require:

- `Authorization: Bearer <ADMIN_SUPABASE_JWT>`
- `X-Consent-Token: <CONSENT_JWT>`

#### Read Endpoints

- `GET /ehr/patient/:id` - Full EHR (filtered by consent scopes)
- `GET /ehr/patient/:id/prescriptions` - All prescriptions
- `GET /ehr/patient/:id/test-reports` - All test reports
- `GET /ehr/patient/:id/medical-history` - Medical history
- `GET /ehr/patient/:id/iot/:deviceType` - IoT logs (heart_rate, glucose, bp, spo2)

#### Write Endpoints

- `POST /ehr/patient/:id/prescription` - Add new prescription
- `POST /ehr/patient/:id/test-report` - Add test report
- `POST /ehr/patient/:id/iot-log` - Add IoT reading
- `POST /ehr/patient/:id/medical-history` - Add medical history entry

---

### **Hospital Management**

- `GET /hospitals` - List hospitals (discovery)
- `GET /hospitals/:id/capacity` - Get capacity summary
- `GET /hospitals/:id/dashboard` - Real-time stats (beds, admissions, doctor workload)

### **Admissions**

- `POST /admissions` - Create admission (atomic with bed locking)
- `PATCH /admissions/:id/discharge` - Discharge patient
- `GET /admissions?hospitalId=&active=true` - List admissions
- `GET /admissions/:id` - Get single admission

### **Resources**

- `GET /beds?hospitalId=&type=&status=` - Query beds
- `GET /doctors?hospitalId=&departmentId=` - List doctors

### **Health Checks**

- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

---

## 🔧 Patient-Side Integration Guide

### **Connect to Shared Redis**

```javascript
// React Native / Flutter / Web
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

### **Grant Consent Flow**

```javascript
// 1. Patient selects hospital and scopes
const response = await fetch("https://api.samruddhi.com/consent/grant", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${patientSupabaseJWT}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    recipientId: staffId,
    recipientHospitalId: hospitalId,
    scope: ["profile", "prescriptions", "test_reports"],
    durationDays: 14,
  }),
});

const { consentId, consentToken, expiresAt } = await response.json();

// 2. Cache locally (optional, for offline check)
await AsyncStorage.setItem(
  `consent:${hospitalId}`,
  JSON.stringify({
    consentId,
    consentToken,
    expiresAt,
    scope: ["profile", "prescriptions", "test_reports"],
  })
);

// 3. Share with hospital (QR code, deep link, etc.)
generateQRCode(consentToken);
// or
shareViaDeepLink(`samruddhi://consent?token=${consentToken}`);
```

### **Check Consent Status**

```javascript
const status = await fetch(
  `https://api.samruddhi.com/consent/status/${consentId}`,
  {
    headers: { Authorization: `Bearer ${patientSupabaseJWT}` },
  }
);

const { valid, revoked, expiresAt } = await status.json();

if (revoked) {
  alert("Consent has been revoked");
  await AsyncStorage.removeItem(`consent:${hospitalId}`);
}
```

### **Revoke Consent**

```javascript
await fetch("https://api.samruddhi.com/consent/revoke", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${patientSupabaseJWT}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ consentId }),
});

// Clear local cache
await AsyncStorage.removeItem(`consent:${hospitalId}`);
```

---

## 🏥 Hospital-Side Integration Guide

### **Receive Consent from Patient**

```javascript
// Patient shares via QR code or deep link
const consentToken = scanQRCode(); // or from deep link parameter

// Store in hospital's session
sessionStorage.setItem("activeConsent", consentToken);
```

### **Access Patient EHR**

```javascript
const prescriptions = await fetch(
  `https://api.samruddhi.com/ehr/patient/${patientId}/prescriptions`,
  {
    headers: {
      Authorization: `Bearer ${adminSupabaseJWT}`,
      "X-Consent-Token": consentToken,
    },
  }
);

if (prescriptions.status === 403) {
  alert("Consent expired or revoked");
} else {
  const data = await prescriptions.json();
  displayPrescriptions(data);
}
```

### **Add Prescription**

```javascript
await fetch(`https://api.samruddhi.com/ehr/patient/${patientId}/prescription`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${adminSupabaseJWT}`,
    "X-Consent-Token": consentToken,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    date: "2025-11-17",
    doctor_name: "Dr. Smith",
    medications: [
      {
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "3x daily",
        duration: "7 days",
      },
    ],
  }),
});
```

---

## 🚀 Quick Start

```bash
npm install
npm run dev          # Start server (port 3000)
npm run build        # Compile TypeScript
npm run seed         # Load seed data
```

## 🔑 Environment Variables

Required in `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE=eyJhbGci...

UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYh3bGci...

MONGO_URI=mongodb+srv://...

JWT_SECRET=your-jwt-secret-32-bytes
PORT=3000
```

---

## 📦 Key NPM Scripts

```bash
npm run dev              # Dev server with hot reload
npm run build            # Compile TypeScript
npm run seed             # Idempotent seed data
npm run typegen          # Generate Supabase types
npm run consent:grant    # CLI: Grant consent
npm run consent:revoke   # CLI: Revoke consent
```

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
