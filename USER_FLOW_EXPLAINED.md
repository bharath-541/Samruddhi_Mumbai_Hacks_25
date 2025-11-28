# 🔄 Samruddhi User Flow & Consent System Explained

## 📋 Table of Contents

1. [Patient Signup & Login Flow](#1-patient-signup--login-flow)
2. [Doctor/Admin Signup Flow](#2-doctoradmin-signup-flow)
3. [Doctor Login Flow](#3-doctor-login-flow)
4. [EHR Consent System](#4-ehr-consent-system)
5. [Complete Flow Diagrams](#5-complete-flow-diagrams)
6. [Testing Each Endpoint](#6-testing-each-endpoint)

---

## 1. 👤 Patient Signup & Login Flow

### 🆕 Patient Signup (Single-Step Registration)

**Endpoint:** `POST /auth/patient/signup`

**How it works:**

1. Patient provides email, password, name, DOB, gender, etc.
2. System creates:
   - ✅ Supabase Auth user (for authentication)
   - ✅ PostgreSQL patient record (in `patients` table)
   - ✅ MongoDB EHR document (in `ehr_records` collection)
3. Auto-generates ABHA ID if not provided
4. Returns patient profile + session token

**Request Example:**

```bash
curl -X POST https://samruddhi-backend.onrender.com/auth/patient/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123",
    "name": "Rajesh Sharma",
    "dob": "1990-05-15",
    "gender": "male",
    "bloodGroup": "O+",
    "phone": "+919876543210",
    "address": {
      "street": "123 MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  }'
```

**Response:**

```json
{
  "message": "Patient registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "patient@example.com",
    "role": "patient"
  },
  "patient": {
    "id": "patient-uuid",
    "abha_id": "AUTO-12345678-9012",
    "ehr_id": "uuid-here",
    "gender": "male",
    "blood_group": "O+"
  },
  "ehr_created": true
}
```

### 🔐 Patient Login

**Endpoint:** `POST /auth/patient/login`

**How it works:**

1. Patient provides email + password
2. System authenticates via Supabase Auth
3. Fetches patient profile from PostgreSQL
4. Returns JWT access token + patient data

**Request Example:**

```bash
curl -X POST https://samruddhi-backend.onrender.com/auth/patient/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123"
  }'
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "patient@example.com",
    "role": "patient"
  },
  "patient": {
    "id": "patient-uuid",
    "abha_id": "AUTO-12345678-9012",
    "gender": "male",
    "blood_group": "O+"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_at": 1701234567
  },
  "note": "Store access_token and use as: Authorization: Bearer <access_token>"
}
```

**What happens after login:**

- Patient stores the `access_token`
- Uses it in all subsequent API calls: `Authorization: Bearer <token>`
- Token expires after time period (can be refreshed)

---

## 2. 👨‍⚕️ Doctor/Admin Signup Flow

### ⚠️ Current Implementation: Manual Database Creation

**There is NO public doctor signup endpoint yet.** Doctors/admins are created through:

#### Option 1: Database Seed Script

Run the seed script which creates doctors:

```bash
node scripts/seed_clean.js
```

This creates 9 doctors with:

- Name, specialization, qualifications
- Hospital assignments
- **Note:** `user_id` is currently NULL (no auth link)

#### Option 2: Manual Supabase Creation

1. Create user in Supabase Auth dashboard
2. Manually insert doctor record in PostgreSQL:

```sql
INSERT INTO doctors (id, user_id, name, specialization, qualifications, hospital_id)
VALUES (
  uuid_generate_v4(),
  'auth-user-uuid-here',
  'Dr. Priya Verma',
  'Cardiologist',
  'MBBS, MD Cardiology',
  'hospital-uuid-here'
);
```

### 🔮 Future Implementation: `/auth/doctor/signup`

**Expected endpoint:** `POST /auth/doctor/signup` (not implemented yet)

**Expected flow:**

```json
{
  "email": "doctor@hospital.com",
  "password": "SecurePass123",
  "name": "Dr. Priya Verma",
  "specialization": "Cardiologist",
  "qualifications": "MBBS, MD Cardiology",
  "hospital_id": "hospital-uuid",
  "registration_number": "MH-12345"
}
```

Would create:

- Supabase Auth user with role='doctor'
- Doctor record in PostgreSQL
- Link user_id to doctor record

---

## 3. 🔑 Doctor Login Flow

### 🔐 Doctor Login (Currently uses Supabase Auth directly)

**Current Method:** Doctors log in via Supabase client library (frontend)

**No dedicated backend endpoint exists yet**, but the expected flow would be:

**Future Endpoint:** `POST /auth/doctor/login`

**Expected Request:**

```bash
curl -X POST https://samruddhi-backend.onrender.com/auth/doctor/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "doctor-auth-uuid",
    "email": "doctor@hospital.com",
    "role": "doctor"
  },
  "doctor": {
    "id": "doctor-uuid",
    "name": "Dr. Priya Verma",
    "specialization": "Cardiologist",
    "hospital_id": "hospital-uuid",
    "hospital_name": "KEM Hospital"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": 1701234567
  }
}
```

### 📝 Current Workaround for Testing

Use Supabase Auth directly:

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "doctor@hospital.com",
  password: "password",
});
```

---

## 4. 🔒 EHR Consent System

The consent system allows patients to grant doctors temporary access to their EHR records.

### 🎯 Consent Architecture

**Two Layers of Security:**

1. **Authorization Token (JWT)** - Identifies the user (patient or doctor)
2. **Consent Token** - Grants specific permissions to access EHR data

**Storage:**

- **Redis:** Consent tokens with TTL (time-to-live)
- **PostgreSQL:** Consent request records (pending/approved/denied)

---

### 📋 Consent Flow Method 1: Direct Grant (Patient-Initiated)

**Step 1: Patient Grants Consent Directly**

**Endpoint:** `POST /consent/grant`

**Requires:** Patient's JWT token

**How it works:**

1. Patient specifies which doctor to grant access to
2. Patient chooses scope (read_ehr, write_prescription, etc.)
3. Patient sets duration (e.g., 7 days)
4. System generates:
   - **Consent Token** (special JWT with permissions)
   - **Consent ID** (UUID stored in Redis)
5. Doctor receives consent token to access EHR

**Request Example:**

```bash
curl -X POST https://samruddhi-backend.onrender.com/consent/grant \
  -H "Authorization: Bearer <patient-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "recipientId": "doctor-auth-uuid",
    "recipientHospitalId": "hospital-uuid",
    "scope": ["read_ehr", "write_prescription"],
    "durationDays": 7
  }'
```

**Response:**

```json
{
  "consentId": "consent-uuid-jti",
  "consentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXRpZW50LXV1aWQi...",
  "expiresAt": "2025-12-06T10:30:00.000Z",
  "scope": ["read_ehr", "write_prescription"],
  "durationDays": 7
}
```

**Redis Storage (Consent Record):**

```json
{
  "patientId": "patient-uuid",
  "recipientId": "doctor-auth-uuid",
  "recipientHospitalId": "hospital-uuid",
  "scope": ["read_ehr", "write_prescription"],
  "grantedAt": "2025-11-29T10:30:00.000Z",
  "expiresAt": "2025-12-06T10:30:00.000Z",
  "revoked": false
}
```

**Key stored in Redis:** `consent:consent-uuid-jti`
**TTL:** 7 days (604800 seconds)

---

**Step 2: Doctor Uses Consent Token to Access EHR**

**Endpoint:** `GET /ehr/patient/:patientId/profile` (or any EHR endpoint)

**Requires:**

- Doctor's JWT token (Authorization header)
- Consent token (X-Consent-Token header)

**How it works:**

1. Doctor sends request with both tokens
2. Middleware validates:
   - ✅ Doctor's JWT is valid
   - ✅ Consent token is valid and not expired
   - ✅ Consent not revoked
   - ✅ Doctor is the recipient specified in consent
   - ✅ Hospital matches (if specified)
   - ✅ Requested scope is included in consent
3. If all checks pass, doctor gets access to patient data

**Request Example:**

```bash
curl -X GET https://samruddhi-backend.onrender.com/ehr/patient/patient-uuid/profile \
  -H "Authorization: Bearer <doctor-jwt-token>" \
  -H "X-Consent-Token: <consent-token-from-step-1>"
```

**Response:**

```json
{
  "patient_id": "patient-uuid",
  "profile": {
    "name": "Rajesh Sharma",
    "dob": "1990-05-15",
    "gender": "male",
    "blood_group": "O+"
  },
  "medical_history": [...],
  "prescriptions": [...],
  "test_reports": [...]
}
```

---

**Step 3: Patient Revokes Consent**

**Endpoint:** `POST /consent/revoke`

**Requires:** Patient's JWT token

**Request Example:**

```bash
curl -X POST https://samruddhi-backend.onrender.com/consent/revoke \
  -H "Authorization: Bearer <patient-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "consentId": "consent-uuid-jti"
  }'
```

**Response:**

```json
{
  "revoked": true
}
```

**What happens:**

- Redis record updated: `revoked: true`
- Doctor can no longer access patient EHR using that consent token
- Consent token immediately becomes invalid

---

### 📋 Consent Flow Method 2: Request-Approval (Doctor-Initiated)

**Step 1: Doctor Requests Consent**

**Endpoint:** `POST /consent/request`

**Requires:** Doctor's JWT token (with hospitalId claim)

**How it works:**

1. Doctor specifies which patient they need access to
2. Doctor states purpose and required scope
3. System creates consent request in PostgreSQL
4. Request status: `pending`

**Request Example:**

```bash
curl -X POST https://samruddhi-backend.onrender.com/consent/request \
  -H "Authorization: Bearer <doctor-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "scope": ["read_ehr", "write_prescription"],
    "purpose": "Post-surgery follow-up consultation"
  }'
```

**Response:**

```json
{
  "request": {
    "id": "request-uuid",
    "patient_id": "patient-uuid",
    "doctor_id": "doctor-uuid",
    "hospital_id": "hospital-uuid",
    "scope": ["read_ehr", "write_prescription"],
    "purpose": "Post-surgery follow-up consultation",
    "status": "pending",
    "created_at": "2025-11-29T10:30:00.000Z"
  }
}
```

**PostgreSQL Storage:**

```sql
-- Table: consent_requests
INSERT INTO consent_requests (
  id, patient_id, doctor_id, hospital_id, scope, purpose, status
)
VALUES (
  'request-uuid',
  'patient-uuid',
  'doctor-uuid',
  'hospital-uuid',
  '{"read_ehr","write_prescription"}',
  'Post-surgery follow-up consultation',
  'pending'
);
```

---

**Step 2: Patient Views Consent Requests**

**Endpoint:** `GET /consent/requests/my`

**Requires:** Patient's JWT token

**Request Example:**

```bash
curl -X GET https://samruddhi-backend.onrender.com/consent/requests/my \
  -H "Authorization: Bearer <patient-jwt-token>"
```

**Response:**

```json
{
  "requests": [
    {
      "id": "request-uuid",
      "patient_id": "patient-uuid",
      "doctor_id": "doctor-uuid",
      "hospital_id": "hospital-uuid",
      "scope": ["read_ehr", "write_prescription"],
      "purpose": "Post-surgery follow-up consultation",
      "status": "pending",
      "created_at": "2025-11-29T10:30:00.000Z",
      "doctor": {
        "name": "Dr. Priya Verma",
        "specialization": "Cardiologist"
      },
      "hospital": {
        "name": "KEM Hospital"
      }
    }
  ]
}
```

---

**Step 3: Patient Approves Request**

**Endpoint:** `POST /consent/requests/:id/approve`

**Requires:** Patient's JWT token

**How it works:**

1. Patient approves the request by ID
2. System:
   - ✅ Updates request status to `approved` in PostgreSQL
   - ✅ Generates consent token and stores in Redis
   - ✅ Returns consent token to patient
3. Patient shares consent token with doctor (via QR code or secure channel)

**Request Example:**

```bash
curl -X POST https://samruddhi-backend.onrender.com/consent/requests/request-uuid/approve \
  -H "Authorization: Bearer <patient-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "durationDays": 7
  }'
```

**Response:**

```json
{
  "message": "Consent request approved",
  "request": {
    "id": "request-uuid",
    "status": "approved",
    "approved_at": "2025-11-29T11:00:00.000Z"
  },
  "consent": {
    "consentId": "consent-uuid-jti",
    "consentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-12-06T11:00:00.000Z",
    "scope": ["read_ehr", "write_prescription"]
  }
}
```

**PostgreSQL Update:**

```sql
UPDATE consent_requests
SET status = 'approved',
    approved_at = NOW()
WHERE id = 'request-uuid';
```

**Redis Storage (same as Method 1):**

```json
{
  "patientId": "patient-uuid",
  "recipientId": "doctor-auth-uuid",
  "recipientHospitalId": "hospital-uuid",
  "scope": ["read_ehr", "write_prescription"],
  "grantedAt": "2025-11-29T11:00:00.000Z",
  "expiresAt": "2025-12-06T11:00:00.000Z",
  "revoked": false
}
```

---

**Step 4: Doctor Uses Consent Token**

Same as Method 1 Step 2 - Doctor uses consent token in `X-Consent-Token` header to access EHR.

---

### 🔍 Consent Status Check

**Endpoint:** `GET /consent/status/:consentId`

**Public endpoint** (no auth required, but useful for verification)

**Request Example:**

```bash
curl -X GET https://samruddhi-backend.onrender.com/consent/status/consent-uuid-jti
```

**Response:**

```json
{
  "consentId": "consent-uuid-jti",
  "status": "active",
  "revoked": false,
  "expired": false,
  "expiresAt": "2025-12-06T11:00:00.000Z",
  "scope": ["read_ehr", "write_prescription"],
  "patient_id": "patient-uuid",
  "recipient_hospital_id": "hospital-uuid"
}
```

---

## 5. 🔄 Complete Flow Diagrams

### Patient Journey (Method 1: Direct Consent)

```
┌─────────────┐
│   Patient   │
│  Registers  │
└──────┬──────┘
       │
       ├─► POST /auth/patient/signup
       │   • Creates Auth user
       │   • Creates patient record (PostgreSQL)
       │   • Creates EHR document (MongoDB)
       │
       ├─► POST /auth/patient/login
       │   • Gets JWT token
       │
       ├─► GET /ehr/my/profile
       │   • Views own EHR data
       │
       ├─► POST /consent/grant
       │   • Grants doctor access
       │   • Generates consent token (Redis)
       │
       ├─► Shares consent token with doctor
       │
       └─► POST /consent/revoke (when done)
           • Revokes doctor's access
```

### Doctor Journey (Using Consent)

```
┌─────────────┐
│   Doctor    │
│ (Pre-created)│
└──────┬──────┘
       │
       ├─► Logs in via Supabase Auth
       │   • Gets JWT token
       │
       ├─► Receives consent token from patient
       │
       ├─► GET /ehr/patient/:id/profile
       │   Headers:
       │   • Authorization: Bearer <doctor-jwt>
       │   • X-Consent-Token: <consent-token>
       │
       │   Middleware validates:
       │   ✓ Doctor JWT valid
       │   ✓ Consent token valid & not expired
       │   ✓ Consent not revoked
       │   ✓ Doctor is recipient
       │   ✓ Scope includes requested permission
       │
       ├─► POST /ehr/patient/:id/prescription
       │   • Adds prescription to patient EHR (MongoDB)
       │
       └─► Consent expires after duration
           or patient revokes
```

### Doctor Journey (Method 2: Request-Approval)

```
┌─────────────┐
│   Doctor    │
└──────┬──────┘
       │
       ├─► POST /consent/request
       │   • Creates consent request (PostgreSQL)
       │   • Status: pending
       │
       ▼
┌─────────────┐
│   Patient   │
└──────┬──────┘
       │
       ├─► GET /consent/requests/my
       │   • Views pending requests
       │
       ├─► POST /consent/requests/:id/approve
       │   • Approves request
       │   • Generates consent token (Redis)
       │
       ├─► Shares consent token with doctor
       │   (via QR code, SMS, app notification)
       │
       ▼
┌─────────────┐
│   Doctor    │
└──────┬──────┘
       │
       ├─► GET /ehr/patient/:id/profile
       │   • Uses consent token to access EHR
       │
       └─► POST /ehr/patient/:id/prescription
           • Adds prescription
```

---

## 6. 🧪 Testing Each Endpoint

### Test Script Location

```bash
/Users/sohamkarandikar/Documents/Samruddhi_Backend/scripts/test_complete_user_flow.js
```

### Run Complete Test

```bash
cd /Users/sohamkarandikar/Documents/Samruddhi_Backend
node scripts/test_complete_user_flow.js
```

---

### Manual Testing: Step-by-Step

#### Test 1: Patient Signup ✅

```bash
curl -X POST https://samruddhi-backend.onrender.com/auth/patient/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.patient@example.com",
    "password": "TestPass123",
    "name": "Test Patient",
    "dob": "1995-01-15",
    "gender": "male",
    "bloodGroup": "A+"
  }'
```

**Expected:** 201 Created + patient profile + EHR created

---

#### Test 2: Patient Login ✅

```bash
curl -X POST https://samruddhi-backend.onrender.com/auth/patient/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.patient@example.com",
    "password": "TestPass123"
  }'
```

**Expected:** 200 OK + JWT access_token + patient data

**Save the access_token for next tests!**

---

#### Test 3: View Patient Profile ✅

```bash
curl -X GET https://samruddhi-backend.onrender.com/ehr/my/profile \
  -H "Authorization: Bearer <access_token>"
```

**Expected:** 200 OK + MongoDB EHR document with profile, prescriptions, etc.

---

#### Test 4: Grant Consent to Doctor ✅

```bash
curl -X POST https://samruddhi-backend.onrender.com/consent/grant \
  -H "Authorization: Bearer <patient_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "<patient-ehr-id>",
    "recipientId": "<doctor-auth-uuid>",
    "recipientHospitalId": "<hospital-uuid>",
    "scope": ["read_ehr", "write_prescription"],
    "durationDays": 7
  }'
```

**Expected:** 201 Created + consentToken

**Save the consentToken for doctor tests!**

---

#### Test 5: Doctor Access Patient EHR ✅

```bash
curl -X GET https://samruddhi-backend.onrender.com/ehr/patient/<patient-uuid>/profile \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "X-Consent-Token: <consent_token>"
```

**Expected:** 200 OK + patient EHR data (if consent valid)

---

#### Test 6: Doctor Adds Prescription ✅

```bash
curl -X POST https://samruddhi-backend.onrender.com/ehr/patient/<patient-uuid>/prescription \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "X-Consent-Token: <consent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "medication": "Amoxicillin 500mg",
    "dosage": "1 tablet twice daily",
    "duration": "7 days",
    "instructions": "Take after meals"
  }'
```

**Expected:** 201 Created + prescription added to MongoDB

---

#### Test 7: Patient Revokes Consent ✅

```bash
curl -X POST https://samruddhi-backend.onrender.com/consent/revoke \
  -H "Authorization: Bearer <patient_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "consentId": "<consent-uuid>"
  }'
```

**Expected:** 200 OK + revoked: true

---

#### Test 8: Doctor Access After Revoke ❌

```bash
curl -X GET https://samruddhi-backend.onrender.com/ehr/patient/<patient-uuid>/profile \
  -H "Authorization: Bearer <doctor_jwt_token>" \
  -H "X-Consent-Token: <consent_token>"
```

**Expected:** 403 Forbidden + "Consent has been revoked"

---

## 🎯 Key Differences Summary

| Feature            | Patient                                   | Doctor/Admin                               |
| ------------------ | ----------------------------------------- | ------------------------------------------ |
| **Signup**         | ✅ Public endpoint `/auth/patient/signup` | ❌ No endpoint (manual creation)           |
| **Login**          | ✅ Public endpoint `/auth/patient/login`  | ⚠️ No dedicated endpoint (use Supabase)    |
| **EHR Access**     | ✅ Self-service `/ehr/my/*` endpoints     | ✅ With consent token `/ehr/patient/:id/*` |
| **Consent**        | ✅ Can grant/revoke                       | ✅ Can request/use                         |
| **Authentication** | JWT token                                 | JWT token (manual creation)                |
| **Database**       | PostgreSQL + MongoDB                      | PostgreSQL only                            |

---

## 🔐 Security Flow Summary

### Patient Authentication

```
User Input (email/password)
    ↓
Supabase Auth (creates/validates user)
    ↓
JWT Token Generated
    ↓
Patient uses JWT for all API calls
```

### Doctor Authentication (Current)

```
Manual Database Creation
    ↓
Supabase Auth (via frontend client)
    ↓
JWT Token Generated
    ↓
Doctor uses JWT for API calls
```

### Consent Validation

```
Doctor's Request with JWT + Consent Token
    ↓
Middleware: requireAuth (validates doctor JWT)
    ↓
Middleware: requireConsent (validates consent token)
    ↓
Checks:
  ✓ Consent exists in Redis
  ✓ Not expired (TTL)
  ✓ Not revoked
  ✓ Doctor is recipient
  ✓ Hospital matches
  ✓ Scope includes requested permission
    ↓
Access Granted to Patient EHR
```

---

## 📊 Data Flow Summary

### Patient Signup Data Flow

```
Frontend
    ↓
POST /auth/patient/signup
    ↓
Server creates:
  1. Supabase Auth User (id: uuid)
  2. PostgreSQL Patient (ehr_id: uuid, abha_id: AUTO-xxx)
  3. MongoDB EHR Document (patient_id: uuid)
    ↓
Response: patient profile + session token
```

### Consent Grant Data Flow

```
Patient
    ↓
POST /consent/grant
    ↓
Server:
  1. Generates Consent JWT
  2. Stores in Redis (TTL = durationDays)
  3. Indexes by patient_id and hospital_id
    ↓
Response: consentToken + consentId
    ↓
Patient shares token with doctor
    ↓
Doctor uses in X-Consent-Token header
```

### EHR Access Data Flow (with Consent)

```
Doctor
    ↓
GET /ehr/patient/:id/profile
Headers:
  - Authorization: Bearer <doctor-jwt>
  - X-Consent-Token: <consent-token>
    ↓
Middleware validates both tokens
    ↓
Server fetches from MongoDB ehr_records
    ↓
Response: patient EHR data
```

---

## 🚀 Next Steps for Full Implementation

### Missing Features (To Be Implemented)

1. **Doctor Signup Endpoint**

   - `POST /auth/doctor/signup`
   - Create auth user + doctor record + hospital link

2. **Doctor Login Endpoint**

   - `POST /auth/doctor/login`
   - Return doctor profile + hospital data + JWT

3. **Admin Signup/Login**

   - `POST /auth/admin/signup`
   - `POST /auth/admin/login`
   - Admin role with hospital management permissions

4. **Consent Request Notifications**

   - Push notifications when doctor requests consent
   - Email/SMS alerts to patient

5. **QR Code Consent Sharing**
   - Generate QR code from consent token
   - Scan to instantly grant doctor access

---

## 📚 Additional Resources

- **API Documentation:** `/Users/sohamkarandikar/Documents/Samruddhi_Backend/API_ENDPOINTS.md`
- **Test Script:** `/Users/sohamkarandikar/Documents/Samruddhi_Backend/scripts/test_complete_user_flow.js`
- **User Flow Summary:** `/Users/sohamkarandikar/Documents/Samruddhi_Backend/USER_FLOW_SUMMARY.md`
- **Consent Implementation:** `/Users/sohamkarandikar/Documents/Samruddhi_Backend/CONSENT_IMPLEMENTATION.md`

---

**Last Updated:** November 29, 2025
**Production URL:** https://samruddhi-backend.onrender.com
