# Samruddhi API Endpoints Documentation

**Base URL:** `http://localhost:3000` (development)

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

### Hospital Capacity

#### `GET /hospitals/:id/capacity`

Get capacity summary for a specific hospital

```bash
curl http://localhost:3000/hospitals/11111111-1111-1111-1111-111111111111/capacity
```

#### `GET /hospitals/:id/dashboard`

**Real-time hospital dashboard** with comprehensive stats
**Returns:**

- Beds breakdown by type (total, available, occupied, maintenance)
- Active admissions count
- Doctor workload by specialization
- Capacity summary

```bash
curl http://localhost:3000/hospitals/11111111-1111-1111-1111-111111111111/dashboard
```

**Example Response:**

```json
{
  "hospital": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Apollo Hospital Mumbai"
  },
  "beds": {
    "icu": { "total": 20, "available": 5, "occupied": 15, "maintenance": 0 },
    "general": {
      "total": 50,
      "available": 30,
      "occupied": 18,
      "maintenance": 2
    }
  },
  "active_admissions": 33,
  "doctors": {
    "total": 10,
    "on_duty": 7,
    "by_specialization": {
      "cardiology": { "count": 3, "current_load": 12, "max_capacity": 30 }
    }
  },
  "timestamp": "2025-11-17T10:30:00.000Z"
}
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

```

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
```

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

## 📋 Patient EHR Endpoints

**All EHR endpoints require:**

1. `Authorization: Bearer <staff_jwt>` - Staff authentication (Supabase Auth)
2. `X-Consent-Token: <consent_jwt>` - Valid consent token from patient
3. Consent must include required scope for the resource

---

### Read Endpoints

#### `GET /ehr/patient/:id`

Get complete patient EHR (filtered by consent scopes)
**Headers:**

- `Authorization: Bearer <staff_jwt>`
- `X-Consent-Token: <consent_jwt>`

**Returns:** All data patient consented to share

```bash
curl http://localhost:3000/ehr/patient/patient-uuid \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt"
```

#### `GET /ehr/patient/:id/prescriptions`

Get all prescriptions (requires `prescriptions` scope)

```bash
curl http://localhost:3000/ehr/patient/patient-uuid/prescriptions \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt"
```

#### `GET /ehr/patient/:id/test-reports`

Get all test reports (requires `test_reports` scope)

```bash
curl http://localhost:3000/ehr/patient/patient-uuid/test-reports \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt"
```

#### `GET /ehr/patient/:id/medical-history`

Get medical history (requires `medical_history` scope)

```bash
curl http://localhost:3000/ehr/patient/patient-uuid/medical-history \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt"
```

#### `GET /ehr/patient/:id/iot/:deviceType`

Get IoT device logs (requires `iot_devices` scope)
**Device Types:** `heart_rate`, `glucose`, `blood_pressure`, `spo2`, `temperature`

```bash
curl http://localhost:3000/ehr/patient/patient-uuid/iot/heart_rate \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt"
```

---

### Write Endpoints

#### `POST /ehr/patient/:id/prescription`

Add prescription (requires `prescriptions` scope)
**Headers:** Authorization + X-Consent-Token
**Body:**

```json
{
  "date": "2025-11-17",
  "doctor_name": "Dr. Sharma",
  "hospital_name": "Apollo Mumbai",
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "notes": "Take with food"
    }
  ],
  "diagnosis": "Bacterial infection",
  "pdf_url": "https://storage.example.com/prescription.pdf",
  "parsed_data": {
    "medicines": ["Amoxicillin"],
    "dosage": ["500mg"],
    "duration": ["7 days"]
  }
}
```

```bash
curl -X POST http://localhost:3000/ehr/patient/patient-uuid/prescription \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

#### `POST /ehr/patient/:id/test-report`

Add test report (requires `test_reports` scope)
**Body:**

```json
{
  "test_name": "Complete Blood Count",
  "date": "2025-11-17",
  "lab_name": "Path Labs",
  "doctor_name": "Dr. Patel",
  "pdf_url": "https://storage.example.com/report.pdf",
  "parsed_results": {
    "hemoglobin": "14.5 g/dL",
    "wbc": "8000 /cumm",
    "platelets": "250000 /cumm"
  },
  "notes": "All values within normal range"
}
```

```bash
curl -X POST http://localhost:3000/ehr/patient/patient-uuid/test-report \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

#### `POST /ehr/patient/:id/iot-log`

Add IoT device reading (requires `iot_devices` scope)
**Body:**

```json
{
  "device_type": "heart_rate",
  "device_id": "fitbit-12345",
  "value": 72,
  "unit": "bpm",
  "context": "resting"
}
```

**Device Types:**

- `heart_rate` - BPM readings
- `glucose` - Blood sugar in mg/dL
- `blood_pressure` - Systolic/diastolic
- `spo2` - Oxygen saturation %
- `temperature` - Body temp in °C/°F

```bash
curl -X POST http://localhost:3000/ehr/patient/patient-uuid/iot-log \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt" \
  -H "Content-Type: application/json" \
  -d '{"device_type":"heart_rate","device_id":"...","value":72,"unit":"bpm"}'
```

#### `POST /ehr/patient/:id/medical-history`

Add medical history entry (requires `medical_history` scope)
**Body:**

```json
{
  "date": "2025-01-15",
  "condition": "Hypertension",
  "treatment": "Prescribed ACE inhibitors",
  "notes": "Patient responded well to treatment",
  "doctor_name": "Dr. Kumar",
  "hospital_name": "AIIMS Delhi"
}
```

```bash
curl -X POST http://localhost:3000/ehr/patient/patient-uuid/medical-history \
  -H "Authorization: Bearer staff-jwt" \
  -H "X-Consent-Token: consent-jwt" \
  -H "Content-Type: application/json" \
  -d '{...}'
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
