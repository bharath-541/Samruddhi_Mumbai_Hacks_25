# Samruddhi API Endpoints Documentation

## 🌐 Base URLs

- **Production:** `https://samruddhi-backend.onrender.com`
- **Development:** `http://localhost:3000`

## 📦 Database Architecture

- **PostgreSQL (Supabase):** Hospital data, beds, doctors, admissions, patients metadata
- **MongoDB:** Patient EHR (prescriptions, test reports, medical history, IoT data)
- **Redis:** Consent tokens, session management

---

## 🔐 Authentication Endpoints (NEW - Public)

### Patient Registration (Public - No Auth Required)

#### `POST /auth/register`

Single-step patient registration - creates Supabase auth user + patient record

**Body:**

```json
{
  "email": "patient@example.com",
  "password": "SecurePass@123",
  "role": "patient",
  "patientData": {
    "name": "John Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "bloodGroup": "O+",
    "phoneNumber": "+91-9876543210",
    "address": "Mumbai, India"
  }
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "patient@example.com",
    "role": "patient"
  },
  "patientId": "patient-uuid",
  "message": "Patient registered successfully"
}
```

```bash
curl -X POST https://samruddhi-backend.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass@123",
    "role": "patient",
    "patientData": {
      "name": "John Doe",
      "dateOfBirth": "1990-01-15",
      "gender": "male",
      "bloodGroup": "O+",
      "phoneNumber": "+91-9876543210",
      "address": "Mumbai, India"
    }
  }'
```

### Patient/Doctor Login (Public - No Auth Required)

#### `POST /auth/login`

Authenticate and get JWT token

**Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "patient"
  },
  "patientId": "patient-uuid",
  "message": "Login successful"
}
```

```bash
curl -X POST https://samruddhi-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass@123"
  }'
```

---

## 🏥 Hospital Management Endpoints

### Health Checks

#### `GET /health/live`

Liveness probe - server is running

```bash
curl http://localhost:3000/health/live
```

#### `GET /health/ready`

Readiness probe - database connection OK

```bash
curl http://localhost:3000/health/ready
```

---

### Beds Management

#### `GET /beds`

Query available beds by hospital, type, and status
**Query Parameters:**

- `hospitalId` (required): UUID
- `type` (optional): `general` | `icu` | `nicu` | `picu` | `emergency` | `isolation`
- `status` (optional): `available` | `occupied` | `maintenance` | `reserved`

```bash
curl "http://localhost:3000/beds?hospitalId=11111111-1111-1111-1111-111111111111&type=icu&status=available"
```

---

### Hospital List

#### `GET /hospitals`

Get all hospitals (Public - No Auth Required)

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "King Edward Memorial (KEM) Hospital",
    "type": "government",
    "tier": "tertiary",
    "address": {...},
    "contact_phone": "+91-22-24107000",
    "total_beds": 1800,
    "icu_beds": 200,
    "occupied_beds": 1650,
    "available_beds": 150
  }
]
```

```bash
curl https://samruddhi-backend.onrender.com/hospitals
```

### Hospital Capacity

#### `GET /hospitals/:id/capacity`

Get capacity summary with bed occupancy percentage

**Response:**

```json
{
  "hospital": {
    "id": "uuid",
    "name": "KEM Hospital"
  },
  "capacity": {
    "total_beds": 1800,
    "occupied_beds": 1650,
    "available_beds": 150,
    "icu_beds": 200,
    "icu_available": 15,
    "general_beds": 1600,
    "general_available": 135,
    "bedOccupancy": 92
  },
  "timestamp": "2025-11-29T10:30:00.000Z"
}
```

```bash
curl https://samruddhi-backend.onrender.com/hospitals/uuid/capacity
```

#### `GET /hospitals/:id/dashboard`

**Real-time hospital dashboard** with comprehensive stats including bed occupancy percentage

**Returns:**

- Beds breakdown by type (total, available, occupied, maintenance)
- Active admissions count
- Doctor workload by specialization
- Capacity summary with occupancy percentage

```bash
curl https://samruddhi-backend.onrender.com/hospitals/uuid/dashboard
```

**Example Response:**

```json
{
  "hospital": {
    "id": "uuid",
    "name": "KEM Hospital Mumbai"
  },
  "summary": {
    "total_beds": 1800,
    "occupied_beds": 1650,
    "available_beds": 150,
    "maintenance_beds": 0,
    "bedOccupancy": 92
  },
  "beds_by_type": {
    "icu": { "total": 200, "available": 15, "occupied": 185, "maintenance": 0 },
    "general": {
      "total": 1400,
      "available": 120,
      "occupied": 1270,
      "maintenance": 10
    },
    "emergency": {
      "total": 150,
      "available": 12,
      "occupied": 138,
      "maintenance": 0
    },
    "isolation": {
      "total": 50,
      "available": 3,
      "occupied": 47,
      "maintenance": 0
    }
  },
  "active_admissions": 1640,
  "doctors": {
    "total": 250,
    "on_duty": 180,
    "by_specialization": {
      "Cardiologist": { "count": 35, "on_duty": 28, "current_load": 245 },
      "Neurologist": { "count": 22, "on_duty": 18, "current_load": 156 }
    }
  },
  "timestamp": "2025-11-29T10:30:00.000Z"
}
```

#### `GET /hospitals/:id/beds/available`

Get list of available beds at a hospital

```bash
curl https://samruddhi-backend.onrender.com/hospitals/uuid/beds/available
```

#### `GET /hospitals/:id/doctors`

Get list of doctors at a hospital

**Query Parameters:**

- `onDuty` (optional): `true` | `false`

```bash
curl https://samruddhi-backend.onrender.com/hospitals/uuid/doctors?onDuty=true
```

---

### Doctors

#### `GET /doctors`

Query doctors by hospital, department, duty status
**Query Parameters:**

- `hospitalId` (required): UUID
- `departmentId` (optional): UUID
- `isOnDuty` (optional): `true` | `false`
- `specialization` (optional): string (partial match)

```bash
curl "http://localhost:3000/doctors?hospitalId=11111111-1111-1111-1111-111111111111&isOnDuty=true&specialization=cardio"
```

---

### Admissions

#### `POST /admissions`

Create new admission (atomic operation with bed locking)
**Body:**

```json
{
  "hospitalId": "11111111-1111-1111-1111-111111111111",
  "patientId": "patient-uuid",
  "bedType": "icu",
  "doctorId": "doctor-uuid",
  "reason": "Emergency cardiac arrest"
}
```

**Effects:**

- Locks and assigns bed (FOR UPDATE SKIP LOCKED)
- Increments doctor workload
- Updates hospital capacity_summary
- Creates audit log

```bash
curl -X POST http://localhost:3000/admissions \
  -H "Content-Type: application/json" \
  -d '{"hospitalId":"...","patientId":"...","bedType":"icu","doctorId":"...","reason":"..."}'
```

#### `PATCH /admissions/:id/discharge`

Discharge patient (atomic operation)
**Body:**

```json
{
  "dischargeType": "normal",
  "summary": "Patient recovered fully"
}
```

**Effects:**

- Marks admission as discharged
- Frees bed (status → available)
- Decrements doctor workload
- Updates capacity_summary
- Creates audit log

```bash
curl -X PATCH http://localhost:3000/admissions/admission-id/discharge \
  -H "Content-Type: application/json" \
  -d '{"dischargeType":"normal","summary":"Recovered"}'
```

#### `GET /admissions`

Query admissions by hospital, status, patient, doctor
**Query Parameters:**

- `hospitalId` (required): UUID
- `active` (optional): `true` | `false`
- `patientId` (optional): UUID
- `doctorId` (optional): UUID

```bash
curl "http://localhost:3000/admissions?hospitalId=...&active=true"
```

#### `GET /admissions/:id`

Get single admission details

```bash
curl http://localhost:3000/admissions/admission-id
```

---

## 🔐 Consent Management

### Grant Consent

#### `POST /consent/grant`

Patient grants EHR access consent to hospital/staff
**Body:**

```json
{
  "patientId": "patient-uuid",
  "recipientId": "staff-uuid",
  "recipientHospitalId": "hospital-uuid",
  "scope": ["prescriptions", "test_reports", "iot_devices"],
  "durationDays": 14
}
```

**Scope Options:**

- `profile` - Basic patient information
- `medical_history` - Past conditions and treatments
- `prescriptions` - Medications and prescriptions
- `test_reports` - Lab results and reports
- `iot_devices` - Connected device data (heart rate, glucose, etc.)

**Duration:** `7` or `14` days only

**Returns:**

```json
{
  "consentId": "uuid",
  "consentToken": "JWT...",
  "expiresAt": "2025-12-01T10:00:00.000Z",
  "scope": ["prescriptions", "test_reports"],
  "durationDays": 14
}
```

```bash
curl -X POST http://localhost:3000/consent/grant \
  -H "Content-Type: application/json" \
  -d '{"patientId":"...","recipientId":"...","scope":["prescriptions"],"durationDays":7}'
```

### Revoke Consent

#### `POST /consent/revoke`

Patient revokes consent (immediate effect)
**Body:**

```json
{
  "consentId": "uuid"
}
```

```bash
curl -X POST http://localhost:3000/consent/revoke \
  -H "Content-Type: application/json" \
  -d '{"consentId":"..."}'
```

````

### Consent Requests (Workflow)

#### `POST /consent/request`

Doctor requests consent from patient.
**Auth:** Doctor/Staff only
**Body:**

```json
{
  "patientId": "patient-uuid",
  "scope": ["prescriptions", "test_reports"],
  "purpose": "Follow-up consultation"
}
````

#### `GET /consent/requests/my`

Patient views their pending and past requests.
**Auth:** Patient only

#### `POST /consent/requests/:id/approve`

Patient approves request.
**Auth:** Patient only
**Effects:**

- Generates Consent Token
- Stores in Redis
- Updates request status to 'approved'
  **Returns:** `{ success: true, consentToken: "..." }`

#### `POST /consent/requests/:id/deny`

Patient denies request.
**Auth:** Patient only
**Effects:** Updates request status to 'rejected'

---

## 📋 Patient EHR Endpoints (MongoDB)

**Storage:** All patient medical records stored in MongoDB `ehr_records` collection

**Document Structure:**

```json
{
  "patient_id": "uuid",
  "abha_id": "1234-5678-9012",
  "profile": {
    "name": "John Doe",
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "blood_group": "O+",
    "phone": "+91-9876543210",
    "address": "Mumbai, India"
  },
  "prescriptions": [
    {
      "id": "prescription-id",
      "medication": "Paracetamol 500mg",
      "dosage": "1 tablet",
      "frequency": "Twice daily",
      "duration": "5 days",
      "prescribed_by": "Dr. Rajesh Kumar",
      "hospital_name": "KEM Hospital",
      "date": "2025-11-29",
      "notes": "Take after meals",
      "added_by": "doctor",
      "created_at": "2025-11-29T10:30:00.000Z"
    }
  ],
  "medical_history": [
    {
      "date": "2024-05-10",
      "condition": "Hypertension",
      "treatment": "ACE inhibitors",
      "doctor_name": "Dr. Sharma",
      "hospital_name": "Previous Hospital"
    }
  ],
  "test_reports": [
    {
      "id": "report-id",
      "test_name": "Complete Blood Count",
      "date": "2025-11-20",
      "lab_name": "Path Labs",
      "results": {...},
      "pdf_url": "https://..."
    }
  ],
  "iot_devices": [
    {
      "device_type": "fitness_band",
      "device_id": "fitband-001",
      "logs": [
        {
          "timestamp": "2025-11-29T08:00:00.000Z",
          "data": {
            "heart_rate": 75,
            "steps": 8432,
            "calories": 342,
            "sleep_hours": 7.5
          }
        }
      ]
    }
  ],
  "created_at": "2025-11-01T00:00:00.000Z",
  "updated_at": "2025-11-29T10:30:00.000Z"
}
```

### Patient Self-Service (Own EHR) - **Requires Auth**

#### `GET /ehr/my/profile`

View own profile (Requires: Patient JWT token)

**Headers:**

```
Authorization: Bearer <patient_jwt_token>
```

**Response:**

```json
{
  "patientId": "uuid",
  "profile": {
    "name": "John Doe",
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "blood_group": "O+",
    "phone": "+91-9876543210"
  }
}
```

```bash
curl https://samruddhi-backend.onrender.com/ehr/my/profile \
  -H "Authorization: Bearer <token>"
```

#### `GET /ehr/my/prescriptions`

View own prescriptions from MongoDB (Requires: Patient JWT token)

**Response:**

```json
{
  "prescriptions": [
    {
      "id": "prescription-id",
      "medication": "Paracetamol 500mg",
      "dosage": "1 tablet",
      "frequency": "Twice daily",
      "duration": "5 days",
      "prescribed_by": "Dr. Rajesh Kumar",
      "hospital_name": "KEM Hospital",
      "date": "2025-11-29",
      "notes": "Take after meals",
      "added_by": "doctor",
      "created_at": "2025-11-29T10:30:00.000Z"
    }
  ]
}
```

```bash
curl https://samruddhi-backend.onrender.com/ehr/my/prescriptions \
  -H "Authorization: Bearer <token>"
```

#### `POST /ehr/my/prescription`

Add old prescription from another hospital (Requires: Patient JWT token)

**Body:**

```json
{
  "medication": "Amoxicillin 250mg",
  "dosage": "1 capsule",
  "frequency": "Three times daily",
  "duration": "7 days",
  "prescribed_by": "Dr. External Doctor",
  "hospital_name": "Previous Hospital",
  "date": "2024-10-15",
  "notes": "Old prescription from previous treatment"
}
```

```bash
curl -X POST https://samruddhi-backend.onrender.com/ehr/my/prescription \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

#### `GET /ehr/my/medical-history`

View own medical history (Requires: Patient JWT token)

```bash
curl https://samruddhi-backend.onrender.com/ehr/my/medical-history \
  -H "Authorization: Bearer <token>"
```

#### `GET /ehr/my/test-reports`

View own test reports (Requires: Patient JWT token)

```bash
curl https://samruddhi-backend.onrender.com/ehr/my/test-reports \
  -H "Authorization: Bearer <token>"
```

#### `POST /ehr/my/iot/:deviceType`

Log IoT device data (Requires: Patient JWT token)

**Device Types:** `fitness_band`, `glucose_monitor`, `bp_monitor`, `pulse_oximeter`

**Body:**

```json
{
  "device_id": "fitband-001",
  "timestamp": "2025-11-29T08:00:00.000Z",
  "data": {
    "heart_rate": 75,
    "steps": 8432,
    "calories": 342,
    "sleep_hours": 7.5
  }
}
```

```bash
curl -X POST https://samruddhi-backend.onrender.com/ehr/my/iot/fitness_band \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Doctor/Hospital Access (With Consent) - **Requires Auth + Consent**

#### `POST /ehr/patient/:id/prescription`

Doctor adds prescription to patient EHR

**Headers:**

- `Authorization: Bearer <doctor_jwt_token>`
- `X-Consent-Token: <consent_jwt>` (if consent system active)

**Body:**

```json
{
  "medication": "Paracetamol 500mg",
  "dosage": "1 tablet",
  "frequency": "Twice daily",
  "duration": "5 days",
  "prescribed_by": "Dr. Rajesh Kumar",
  "hospital_name": "KEM Hospital",
  "date": "2025-11-29",
  "notes": "Take after meals"
}
```

```bash
curl -X POST https://samruddhi-backend.onrender.com/ehr/patient/uuid/prescription \
  -H "Authorization: Bearer <doctor_token>" \
  -H "X-Consent-Token: <consent_token>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

#### `GET /ehr/patient/:id`

Doctor views patient EHR (with consent)

```bash
curl https://samruddhi-backend.onrender.com/ehr/patient/uuid \
  -H "Authorization: Bearer <doctor_token>" \
  -H "X-Consent-Token: <consent_token>"
```

#### `GET /ehr/patient/:id/prescriptions`

Doctor views patient prescriptions (with consent)

```bash
curl https://samruddhi-backend.onrender.com/ehr/patient/uuid/prescriptions \
  -H "Authorization: Bearer <doctor_token>" \
  -H "X-Consent-Token: <consent_token>"
```

---

## 🔒 Authentication Flow

### Patient Flow

1. Patient signs up/logs in via Supabase Auth
2. Gets Supabase JWT (auth token)
3. Calls `/consent/grant` to create consent token
4. Shares consent token (QR code/text) with hospital

### Hospital Staff Flow

1. Staff logs in via Supabase Auth
2. Gets staff JWT with claims: `role`, `hospital_id`
3. Receives consent token from patient
4. Makes EHR requests with both tokens:
   - `Authorization: Bearer <staff_jwt>`
   - `X-Consent-Token: <consent_jwt>`

### Consent Validation

Every EHR request validates:

1. ✅ Staff JWT is valid (Supabase Auth)
2. ✅ Consent JWT is valid (signature + expiry)
3. ✅ Consent record exists in Redis (not revoked)
4. ✅ Required scope is granted
5. ✅ Staff ID matches consent recipient

---

## 📊 Audit Logs

All critical operations are logged to `audit_logs` table:

- ✅ Admission create/discharge
- ✅ Consent grant/revoke
- ✅ EHR read operations
- ✅ EHR write operations

**Captured Data:**

- `user_id`, `hospital_id`, `action`, `resource_type`, `resource_id`
- `changes` (before/after state)
- `ip_address`, `user_agent`, `request_id`, `timestamp`

---

## 🚀 Quick Start Examples

### Complete Workflow Example

```bash
# 1. Patient grants 14-day consent for prescriptions
CONSENT_RESPONSE=$(curl -X POST http://localhost:3000/consent/grant \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "recipientId": "doctor-456",
    "recipientHospitalId": "hospital-789",
    "scope": ["prescriptions", "test_reports"],
    "durationDays": 14
  }')

CONSENT_TOKEN=$(echo $CONSENT_RESPONSE | jq -r '.consentToken')

# 2. Hospital staff reads patient prescriptions
curl http://localhost:3000/ehr/patient/patient-123/prescriptions \
  -H "Authorization: Bearer $STAFF_JWT" \
  -H "X-Consent-Token: $CONSENT_TOKEN"

# 3. Doctor adds new prescription
curl -X POST http://localhost:3000/ehr/patient/patient-123/prescription \
  -H "Authorization: Bearer $STAFF_JWT" \
  -H "X-Consent-Token: $CONSENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-17",
    "doctor_name": "Dr. Sharma",
    "medications": [{
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days"
    }]
  }'

# 4. Create admission
curl -X POST http://localhost:3000/admissions \
  -H "Content-Type: application/json" \
  -d '{
    "hospitalId": "hospital-789",
    "patientId": "patient-123",
    "bedType": "general",
    "doctorId": "doctor-456",
    "reason": "Bacterial infection treatment"
  }'
```

---

## 📈 Response Codes

- `200` - Success
- `201` - Resource created
- `400` - Invalid request (validation failed)
- `401` - Unauthorized (missing/invalid auth token)
- `403` - Forbidden (insufficient consent scope)
- `404` - Resource not found
- `409` - Conflict (e.g., no available beds)
- `500` - Server error

---

## 🔑 Environment Variables Required

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJ...
SUPABASE_ANON_KEY=eyJ...
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=3000
```

---

## 🚀 Complete User Flow Examples

### 1. Patient Registration & Profile View

```bash
# Register new patient
RESPONSE=$(curl -X POST https://samruddhi-backend.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass@123",
    "role": "patient",
    "patientData": {
      "name": "John Doe",
      "dateOfBirth": "1990-01-15",
      "gender": "male",
      "bloodGroup": "O+",
      "phoneNumber": "+91-9876543210",
      "address": "Mumbai, India"
    }
  }')

# Extract token
TOKEN=$(echo $RESPONSE | jq -r '.token')
PATIENT_ID=$(echo $RESPONSE | jq -r '.patientId')

# View own profile
curl https://samruddhi-backend.onrender.com/ehr/my/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Patient Views Hospitals & Checks Bed Availability

```bash
# List all hospitals
curl https://samruddhi-backend.onrender.com/hospitals

# Check specific hospital capacity
curl https://samruddhi-backend.onrender.com/hospitals/<hospital-id>/capacity

# View detailed dashboard
curl https://samruddhi-backend.onrender.com/hospitals/<hospital-id>/dashboard
```

### 3. Patient Adds Old Prescription

```bash
curl -X POST https://samruddhi-backend.onrender.com/ehr/my/prescription \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medication": "Amoxicillin 250mg",
    "dosage": "1 capsule",
    "frequency": "Three times daily",
    "duration": "7 days",
    "prescribed_by": "Dr. Previous Doctor",
    "hospital_name": "Old Hospital",
    "date": "2024-10-15",
    "notes": "From previous treatment"
  }'
```

### 4. Doctor Login & Add Prescription to Patient

```bash
# Doctor login
DOC_RESPONSE=$(curl -X POST https://samruddhi-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rajesh.kumar@kem.edu",
    "password": "Doctor@123"
  }')

DOC_TOKEN=$(echo $DOC_RESPONSE | jq -r '.token')

# Doctor adds prescription to patient
curl -X POST https://samruddhi-backend.onrender.com/ehr/patient/$PATIENT_ID/prescription \
  -H "Authorization: Bearer $DOC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medication": "Paracetamol 500mg",
    "dosage": "1 tablet",
    "frequency": "Twice daily",
    "duration": "5 days",
    "prescribed_by": "Dr. Rajesh Kumar",
    "hospital_name": "KEM Hospital",
    "date": "2025-11-29",
    "notes": "Take after meals"
  }'
```

### 5. Patient Views All Prescriptions (MongoDB)

```bash
curl https://samruddhi-backend.onrender.com/ehr/my/prescriptions \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Key Features

### ✅ What's Working

1. **Public Auth Endpoints** - Single-step registration and login (no JWT needed initially)
2. **Patient EHR in MongoDB** - All medical records stored patient-wise in `ehr_records` collection
3. **Prescription Management** - Patients can view and add their own prescriptions
4. **Doctor Prescription Access** - Doctors can add prescriptions to patient records
5. **Hospital Dashboard** - Real-time bed availability with occupancy percentage
6. **IoT Device Logging** - Fitness bands and health monitors data storage
7. **Medical History** - Comprehensive patient medical history tracking
8. **Bed Occupancy Calculation** - Percentage-based availability display

### 📍 MongoDB Collections

- **`ehr_records`** - Patient medical records (one document per patient)
  - `patient_id` - Links to PostgreSQL patients table
  - `profile` - Basic patient information
  - `prescriptions[]` - Array of prescription objects
  - `medical_history[]` - Array of medical history entries
  - `test_reports[]` - Array of test report objects
  - `iot_devices[]` - Array of IoT device logs

---

## 🏥 Current Hospital Data (Production)

After running the clean seed script:

1. **King Edward Memorial (KEM) Hospital** - Government, 1800 beds, 200 ICU
2. **Lokmanya Tilak Municipal General Hospital (Sion)** - Government, 1400 beds, 150 ICU
3. **Lilavati Hospital & Research Centre** - Private, 323 beds, 65 ICU
4. **Hinduja Hospital** - Private, 450 beds, 85 ICU
5. **Breach Candy Hospital** - Private, 225 beds, 45 ICU

**Total:** 5 hospitals, 19 departments, 200 beds, 9 doctors, 10 patients

---

## 🔄 Data Flow Summary

```
Patient Registration → Supabase Auth User Created
                    → Patient Record in PostgreSQL (patients table)
                    → EHR Document in MongoDB (ehr_records collection)

Patient Views Profile → JWT Auth → MongoDB ehr_records lookup

Doctor Adds Prescription → JWT Auth → MongoDB $push to ehr.prescriptions[]

Patient Views Prescriptions → JWT Auth → MongoDB query ehr.prescriptions

Hospital Capacity → PostgreSQL aggregation → Bed occupancy %
```

---

## 📞 Support & Testing

**Production URL:** https://samruddhi-backend.onrender.com

**Health Check:** https://samruddhi-backend.onrender.com/health/live

**Test Script:** Run `node scripts/test_complete_user_flow.js` for end-to-end testing

---

*Last Updated: November 29, 2025*
*Version: 2.0 - Public Auth + MongoDB EHR + Bed Occupancy*
