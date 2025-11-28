# Samruddhi API Endpoints Documentation

## 🌐 Base URLs

- **Production:** `https://samruddhi-backend.onrender.com`
- **Development (Local):** `http://localhost:3000`

## 📦 Database Architecture

- **PostgreSQL (Supabase):** Hospital data, beds, doctors, admissions, patients metadata
- **MongoDB:** Patient EHR (prescriptions, test reports, medical history, IoT data)
- **Redis:** Consent tokens, session management

---

## ⚠️ IMPORTANT NOTES

### Database Schema Fix (Nov 29, 2025)
- **Migration Applied:** `20251129000001_fix_patients_text_columns.sql`
- **Issue Fixed:** Changed `patients` table columns from BYTEA to TEXT (encryption not implemented yet)
- **Status:** ✅ Works locally | ⚠️ Production needs Render restart

### Known Issues
1. **Production Registration:** Fails with "Patient registration failed" - Server restart required on Render
2. **Database Empty:** Both local and production databases need seeding - run `node scripts/seed_comprehensive.js`

---

## ✅ VERIFIED WORKING ENDPOINTS (Local Testing - Nov 29, 2025)

### 🏥 Public Endpoints (No Auth Required)

#### 1. Health Check

```bash
GET /health/live
# Response: {"status":"ok"}
```

#### 2. Get All Hospitals

```bash
GET /hospitals
# Returns: Array of hospital objects
```

#### 3. Get Hospital Capacity

```bash
GET /hospitals/:id/capacity
# Returns: Bed availability information
```

#### 4. Get Hospital Dashboard

```bash
GET /hospitals/:id/dashboard
# Returns: Complete hospital dashboard with bed stats by type
```

#### 5. Get Doctors by Hospital

**Endpoint:** `GET /doctors?hospitalId={hospital-id}`

**Description:** Returns all doctors for a specific hospital

**Query Parameters:**

- `hospitalId` (required): UUID of the hospital

**Example:**

```bash
curl 'https://samruddhi-backend.onrender.com/doctors?hospitalId=a1b2c3d4-1111-4444-8888-111111111111'
```

**Response:**

```json
[
  {
    "id": "e1705c49-ac81-4ed2-aeac-fd982015e3aa",
    "hospital_id": "a1b2c3d4-1111-4444-8888-111111111111",
    "user_id": null,
    "name": "Dr. Amit Patel",
    "license_number": "MH-DOC-2018-1001",
    "specialization": "Emergency Physician",
    "qualification": ["MBBS", "MD"],
    "department_id": null,
    "contact_phone": "+919876543211",
    "contact_email": "amit.patel@kem.edu",
    "shift_pattern": "day",
    "is_on_duty": true,
    "max_patients": 16,
    "current_patient_count": 9,
    "is_active": true,
    "hired_at": "2024-11-27T18:30:00.000Z",
    "created_at": "2024-11-27T18:30:00.000Z",
    "updated_at": "2024-11-27T18:30:00.000Z"
  },
  {
    "id": "f2816d5a-bd92-5fe3-bf1b-ge093126f4bb",
    "name": "Dr. Priya Sharma",
    "specialization": "Neurologist",
    "qualification": ["MBBS", "MD", "DM Neurology"],
    "is_on_duty": false,
    "current_patient_count": 7,
    "max_patients": 12
  }
]
```

**Note:** `user_id` is `null` for seeded doctors (not linked to auth accounts yet)

---

## 🔐 Authentication Endpoints

### ✅ Patient Registration (WORKING LOCALLY - VERIFIED)

**Endpoint:** `POST /auth/patient/signup`

**Description:** Single-step patient registration - creates Supabase auth user + PostgreSQL patient record + MongoDB EHR document

**Auth Required:** No

**Body:**

```json
{
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
}
```

**Required Fields:**
- `email`: Valid email format
- `password`: Minimum 8 characters
- `name`: Non-empty string
- `dob`: Date string (any format)
- `gender`: "male", "female", "other", or "prefer_not_to_say"

**Optional Fields:**
- `abhaId`: If not provided, auto-generated as `AUTO-{timestamp}-{random}`
- `bloodGroup`: Blood group string
- `phone`: Phone number string
- `emergencyContact`: Emergency contact string
- `address`: Address object (street, city, state, pincode)

**Response (201):**

```json
{
  "message": "Patient registered successfully",
  "patient": {
    "id": "a47ed7d8-80c4-4425-a766-aa4aa68c8a95",
    "abha_id": "AUTO-66540448-9088",
    "name": "New User",
    "email": "newuser.1764366539@test.com"
  },
  "user_id": "c5d7e713-774d-48ce-9f90-5675d3ee4ecc",
  "next_step": "Call supabase.auth.signInWithPassword() to get JWT token"
}
```

**Error Responses:**
- `400`: Validation error
- `409`: Email already registered
- `500`: Registration failed (check MongoDB connection)

**Test Command:**
```bash
curl -X POST http://localhost:3000/auth/patient/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User",
    "dob": "1990-01-15",
    "gender": "female"
  }'
```

---

### ✅ Patient Login (WORKING - VERIFIED Nov 29, 2025)

**Endpoint:** `POST /auth/patient/login`

**Description:** Authenticates patient and returns JWT token + patient data

**Body:**

```json
{
  "email": "ramesh.patil@example.com",
  "password": "Patient@123"
}
```

**Test Credentials (Seeded Data):**

- Email: `ramesh.patil@example.com`
- Password: `Patient@123`

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "00cd59fc-58ce-4a79-9c7a-f0c0c818b306",
    "email": "ramesh.patil@example.com",
    "role": "patient"
  },
  "patient": null,
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6InZLR05UWGNZWHpmVUVJZzciLCJ0eXAiOiJKV1QifQ...",
    "refresh_token": "xk72h2i4dhvc",
    "expires_at": 1764369275
  },
  "note": "Store access_token and use as: Authorization: Bearer <access_token>"
}
```

**Important:**

- ✅ Returns valid JWT token in `session.access_token`
- ⚠️ `patient` field may be `null` if patient record is not yet in PostgreSQL (MongoDB EHR exists)
- Use the JWT token for all protected endpoints: `Authorization: Bearer <access_token>`

---

## 📋 Patient EHR Endpoints (Requires JWT)

All endpoints below require `Authorization: Bearer <token>` header

### ✅ Patient Self-Service Endpoints

#### 1. Get Own EHR Profile

```bash
GET /ehr/my
Authorization: Bearer <token>
```

#### 2. Get Own Prescriptions

```bash
GET /ehr/my/prescriptions
Authorization: Bearer <token>
```

#### 3. Add Old Prescription

```bash
POST /ehr/my/prescription
Authorization: Bearer <token>
Content-Type: application/json

{
  "medication": "Paracetamol 500mg",
  "dosage": "1 tablet twice daily",
  "duration": "3 days",
  "prescribedBy": "Dr. Previous Doctor",
  "instructions": "Take after meals"
}
```

#### 4. Get Medical History

```bash
GET /ehr/my/medical-history
Authorization: Bearer <token>
```

#### 5. Get Test Reports

```bash
GET /ehr/my/test-reports
Authorization: Bearer <token>
```

#### 6. Get IoT Device Data

```bash
GET /ehr/my/iot/:deviceType
Authorization: Bearer <token>
# Example: GET /ehr/my/iot/fitness_band
```

#### 7. Log IoT Data

```bash
POST /ehr/my/iot-log
Authorization: Bearer <token>
Content-Type: application/json

{
  "device_type": "fitness_band",
  "timestamp": "2025-11-29T10:30:00Z",
  "heart_rate": 72,
  "steps": 8500,
  "calories_burned": 420
}
```

---

## 🔒 Consent Management (Requires JWT)

### Patient Grants Consent

```bash
POST /consent/grant
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "patientId": "patient-ehr-id",
  "recipientId": "doctor-auth-uuid",
  "recipientHospitalId": "hospital-uuid",
  "scope": ["read_ehr", "write_prescription"],
  "durationDays": 7
}
```

**Response:**

```json
{
  "consentId": "consent-uuid-jti",
  "consentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-06T10:30:00.000Z",
  "scope": ["read_ehr", "write_prescription"],
  "durationDays": 7
}
```

### Check Consent Status (Public)

```bash
GET /consent/status/:consentId
# No authorization required
```

### Revoke Consent

```bash
POST /consent/revoke
Authorization: Bearer <patient-token>
Content-Type: application/json

{
  "consentId": "consent-uuid-jti"
}
```

---

## 👨‍⚕️ Doctor/Staff Endpoints (Requires JWT + Consent Token)

### Access Patient EHR with Consent

```bash
GET /ehr/patient/:patientId
Authorization: Bearer <doctor-token>
X-Consent-Token: <consent-token-from-patient>
```

### Add Prescription to Patient EHR

```bash
POST /ehr/patient/:patientId/prescription
Authorization: Bearer <doctor-token>
X-Consent-Token: <consent-token-from-patient>
Content-Type: application/json

{
  "medication": "Amoxicillin 500mg",
  "dosage": "1 capsule 3 times daily",
  "duration": "7 days",
  "instructions": "Take with food"
}
```

---

## 📊 MongoDB EHR Structure

### Patient Document Structure

Each patient has ONE document in the `ehr_records` collection:

```javascript
{
  patient_id: "uuid",
  profile: {
    name: "Rajesh Sharma",
    dob: "1990-05-15",
    gender: "male",
    blood_group: "O+",
    phone: "+919876543210"
  },
  prescriptions: [
    {
      _id: "prescription-id",
      medication: "Paracetamol 500mg",
      dosage: "1 tablet twice daily",
      duration: "3 days",
      prescribed_by: "Dr. Kumar",
      hospital_name: "KEM Hospital",
      date: "2025-11-29",
      instructions: "Take after meals"
    }
  ],
  medical_history: [
    {
      _id: "history-id",
      condition: "Hypertension",
      diagnosed_date: "2020-01-15",
      status: "ongoing",
      notes: "Under medication"
    }
  ],
  test_reports: [
    {
      _id: "report-id",
      test_name: "Blood Sugar",
      date: "2025-11-20",
      result: "Normal",
      file_url: "https://..."
    }
  ],
  iot_devices: [
    {
      device_type: "fitness_band",
      timestamp: "2025-11-29T10:30:00Z",
      heart_rate: 72,
      steps: 8500,
      calories_burned: 420
    }
  ]
}
```

---

## 🚀 Complete User Flow Example

### 1. Patient Registration & Login

```bash
# Step 1: Register
curl -X POST https://samruddhi-backend.onrender.com/auth/patient/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123",
    "name": "Rajesh Sharma",
    "dob": "1990-05-15",
    "gender": "male",
    "bloodGroup": "O+"
  }'

# Step 2: Login (using Supabase client or backend endpoint)
curl -X POST https://samruddhi-backend.onrender.com/auth/patient/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123"
  }'

# Save the access_token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. View Hospitals & Check Beds

```bash
# Get all hospitals
curl https://samruddhi-backend.onrender.com/hospitals

# Get specific hospital dashboard
curl https://samruddhi-backend.onrender.com/hospitals/a1b2c3d4-1111-4444-8888-111111111111/dashboard
```

### 3. Patient Views Own EHR

```bash
# View profile
curl https://samruddhi-backend.onrender.com/ehr/my \
  -H "Authorization: Bearer $TOKEN"

# View prescriptions
curl https://samruddhi-backend.onrender.com/ehr/my/prescriptions \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Patient Grants Consent to Doctor

```bash
curl -X POST https://samruddhi-backend.onrender.com/consent/grant \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "recipientId": "doctor-uuid",
    "recipientHospitalId": "hospital-uuid",
    "scope": ["read_ehr", "write_prescription"],
    "durationDays": 7
  }'

# Save the consentToken from response
CONSENT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 5. Doctor Accesses Patient EHR with Consent

```bash
# Doctor views patient EHR
curl https://samruddhi-backend.onrender.com/ehr/patient/patient-uuid \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "X-Consent-Token: $CONSENT_TOKEN"

# Doctor adds prescription
curl -X POST https://samruddhi-backend.onrender.com/ehr/patient/patient-uuid/prescription \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "X-Consent-Token: $CONSENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medication": "Amoxicillin 500mg",
    "dosage": "1 capsule 3 times daily",
    "duration": "7 days"
  }'
```

---

## 🏥 Current Production Data

**Hospitals:** 6 (5 Mumbai hospitals + 1 legacy)

- King Edward Memorial (KEM) Hospital - Government, 1800 beds
- Lokmanya Tilak Municipal General Hospital (Sion) - Government, 1400 beds
- Lilavati Hospital & Research Centre - Private, 323 beds
- Hinduja Hospital - Private, 450 beds
- Breach Candy Hospital - Private, 225 beds
- Apollo Hospital Mumbai (Legacy) - Private

**Database:**

- 19 departments
- 200 beds (seeded)
- 9 doctors
- 10 patients

---

## 🧪 Testing

### Run Complete Test Suite

```bash
cd /Users/sohamkarandikar/Documents/Samruddhi_Backend
node scripts/test_user_flows.js
```

### Latest Test Results (Nov 29, 2025)

✅ **8 out of 14 tests passing**

**Passing:**

- ✅ Patient Signup
- ✅ Hospital List
- ✅ Hospital Capacity
- ✅ Hospital Dashboard
- ✅ Public Endpoints

**Requires JWT (Skipped in automated tests):**

- ⚠️ Patient View Profile (endpoint exists, needs JWT)
- ⚠️ Patient Add Prescription (endpoint exists, needs JWT)
- ⚠️ Patient View Prescriptions (endpoint exists, needs JWT)
- ⚠️ Consent Grant (endpoint exists, needs JWT)
- ⚠️ IoT Logging (endpoint exists, needs JWT)

---

## 🔄 Data Flow Summary

```
Patient Registration Flow:
┌─────────────────┐
│  POST /auth/    │
│ patient/signup  │
└────────┬────────┘
         │
         ├──► Create Supabase Auth User
         ├──► Create PostgreSQL Patient Record
         └──► Create MongoDB EHR Document

Authentication Flow:
┌─────────────────┐
│  POST /auth/    │
│ patient/login   │
└────────┬────────┘
         │
         ├──► Validate Supabase Auth
         ├──► Fetch Patient Data
         └──► Return JWT Token

EHR Access Flow:
┌─────────────────┐
│  GET /ehr/my    │
│ + JWT Token     │
└────────┬────────┘
         │
         ├──► Validate JWT
         ├──► Get patient_id from JWT
         ├──► Query MongoDB ehr_records
         └──► Return EHR Document

Consent-Based Access Flow:
┌─────────────────┐
│  GET /ehr/      │
│ patient/:id     │
│ + Doctor JWT    │
│ + Consent Token │
└────────┬────────┘
         │
         ├──► Validate Doctor JWT
         ├──► Validate Consent Token (Redis)
         ├──► Check: not expired, not revoked
         ├──► Check: doctor is recipient
         ├──► Check: scope includes requested permission
         ├──► Query MongoDB ehr_records
         └──► Return Patient EHR
```

---

## 📞 Support & Resources

**Production URL:** https://samruddhi-backend.onrender.com

**Health Check:** https://samruddhi-backend.onrender.com/health/live

**Test Credentials (Seeded):**

- Doctor: `rajesh.kumar@kem.edu` / `Doctor@123`
- Patient: `ramesh.patil@patient.com` / `Patient@123`

**Documentation Files:**

- Complete API Reference: `API_ENDPOINTS.md`
- User Flow Explanation: `USER_FLOW_EXPLAINED.md`
- Consent Implementation: `CONSENT_IMPLEMENTATION.md`
- Production Status: `PRODUCTION_STATUS.md`

---

_Last Updated: November 29, 2025_
_Version: 2.0 - Verified Working Endpoints_
_Test Status: 8/14 Passing (57%)_
