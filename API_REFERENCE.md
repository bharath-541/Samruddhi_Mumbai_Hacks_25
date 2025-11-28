# Samruddhi Backend API Reference

🌐 **Production URL**: `https://samruddhi-backend.onrender.com`

✅ **Status**: Live and ready for integration

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Health Checks](#health-checks)
3. [Hospital Management](#hospital-management)
4. [Patient Registration & Search](#patient-registration--search)
5. [Consent Management](#consent-management)
6. [Admissions](#admissions)
7. [Electronic Health Records (EHR)](#electronic-health-records-ehr)
8. [Error Handling](#error-handling)
9. [Rate Limits](#rate-limits)

---

## 🔐 Authentication

### Authentication Types

1. **No Auth** - Public endpoints (health checks, hospital listings)
2. **Patient Auth** - Requires Supabase JWT from patient login
3. **Staff Auth** - Requires Supabase JWT from hospital staff login
4. **EHR Auth** - Requires both Staff JWT + Consent Token

### Headers

```javascript
// For Patient/Staff endpoints:
{
  "Authorization": "Bearer <SUPABASE_JWT>"
}

// For EHR endpoints (requires BOTH):
{
  "Authorization": "Bearer <STAFF_SUPABASE_JWT>",
  "X-Consent-Token": "<CONSENT_JWT_FROM_QR_OR_GRANT>"
}
```

### Getting Authentication Tokens

#### Patient Registration/Login

```javascript
// Use Supabase client to register/login
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Register new user
const { data, error } = await supabase.auth.signUp({
  email: "patient@example.com",
  password: "securepassword",
  options: {
    data: { role: "patient" },
  },
});

// Login
const {
  data: { session },
  error,
} = await supabase.auth.signInWithPassword({
  email: "patient@example.com",
  password: "securepassword",
});

const JWT = session.access_token; // Use this in Authorization header
```

#### Hospital Staff Login

```javascript
// Same as patient, but with role: 'hospital_staff'
const { data, error } = await supabase.auth.signInWithPassword({
  email: "doctor@hospital.com",
  password: "securepassword",
});

const JWT = data.session.access_token;
```

---

## 🏥 Health Checks

### Check Server Status

```
GET /health/live
```

**Auth**: None

**Response**: `200 OK`

```json
{
  "status": "ok"
}
```

### Check Database Connection

```
GET /health/ready
```

**Auth**: None

**Response**: `200 OK`

```json
{
  "status": "ready",
  "timestamp": "2025-11-28T19:45:32.123Z"
}
```

---

## 🏥 Hospital Management

### List All Hospitals

```
GET /hospitals?limit=10&offset=0&type=government&tier=tertiary
```

**Auth**: None

**Query Parameters**:

- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by type (`government`, `private`, `charitable`)
- `tier` (optional): Filter by tier (`primary`, `secondary`, `tertiary`, `quaternary`)

**Response**: `200 OK`

```json
[
  {
    "id": "b113834f-b7d3-448c-b646-f1a5bdfb559c",
    "name": "Government General Hospital Mumbai",
    "type": "government",
    "tier": "tertiary",
    "address": "123 Main St, Mumbai",
    "phone": "+91-22-12345678",
    "email": "admin@ggh.gov.in",
    "lat": 19.076,
    "lon": 72.8777,
    "created_at": "2025-11-28T16:52:19.833853+00:00"
  }
]
```

### Get Hospital Capacity

```
GET /hospitals/:hospitalId/capacity
```

**Auth**: None

**Response**: `200 OK`

```json
{
  "id": "b113834f-...",
  "name": "Government General Hospital Mumbai",
  "capacity_summary": {
    "icu": { "total": 50, "available": 12 },
    "general": { "total": 200, "available": 45 },
    "emergency": { "total": 30, "available": 8 }
  },
  "timestamp": "2025-11-28T19:45:32.123Z"
}
```

### Get Hospital Dashboard

```
GET /hospitals/:hospitalId/dashboard
```

**Auth**: None

**Response**: `200 OK`

```json
{
  "hospital": {
    "id": "b113834f-...",
    "name": "Government General Hospital Mumbai"
  },
  "capacity_summary": {
    "icu": { "total": 50, "available": 12 }
  },
  "beds": {
    "icu": { "total": 50, "occupied": 38, "available": 12 },
    "general": { "total": 200, "occupied": 155, "available": 45 }
  },
  "active_admissions": 193,
  "doctors": {
    "total": 85,
    "on_duty": 42,
    "by_specialization": {
      "cardiology": 12,
      "neurology": 8,
      "general": 25
    }
  },
  "timestamp": "2025-11-28T19:45:32.123Z"
}
```

---

## 🛏️ Beds

### List Beds

```
GET /beds?hospitalId=xxx&type=icu&status=available
```

**Auth**: None

**Query Parameters**:

- `hospitalId` (required): Hospital UUID
- `type` (optional): Bed type (`icu`, `general`, `emergency`, `isolation`)
- `status` (optional): Bed status (`available`, `occupied`, `maintenance`)
- `limit` (optional): Results limit (default: 50)

**Response**: `200 OK`

```json
[
  {
    "id": "bed-uuid-123",
    "hospital_id": "hospital-uuid",
    "bed_number": "ICU-101",
    "type": "icu",
    "status": "available",
    "floor": 3,
    "ward": "ICU Ward A",
    "created_at": "2025-11-28T10:00:00Z"
  }
]
```

---

## 👨‍⚕️ Doctors

### List Doctors

```
GET /doctors?hospitalId=xxx&specialization=cardiology&status=on_duty
```

**Auth**: None

**Query Parameters**:

- `hospitalId` (required): Hospital UUID
- `specialization` (optional): Filter by specialization
- `status` (optional): `on_duty`, `off_duty`, `on_leave`
- `limit` (optional): Results limit (default: 50)

**Response**: `200 OK`

```json
[
  {
    "id": "doctor-uuid-123",
    "hospital_id": "hospital-uuid",
    "name": "Dr. Rajesh Sharma",
    "specialization": "cardiology",
    "qualification": "MD, DM (Cardiology)",
    "status": "on_duty",
    "contact": "+91-98765-43210",
    "created_at": "2025-11-20T08:00:00Z"
  }
]
```

---

## 👤 Patient Registration & Search

### Register New Patient

```
POST /patients/register
```

**Auth**: Patient JWT (Supabase)

**Request Body**:

```json
{
  "abha_id": "12-3456-7890-1234",
  "name": "Amit Kumar",
  "dob": "1990-05-15",
  "gender": "male",
  "phone": "+91-98765-43210",
  "email": "amit@example.com",
  "address": "123 Street, Mumbai, Maharashtra"
}
```

**Response**: `201 Created`

```json
{
  "message": "Patient registered successfully",
  "patient": {
    "id": "patient-uuid-123",
    "user_id": "supabase-user-uuid",
    "abha_id": "12-3456-7890-1234",
    "name": "Amit Kumar",
    "created_at": "2025-11-28T19:45:32.123Z"
  }
}
```

### Search Patient

```
GET /patients/search?abha_id=12-3456-7890-1234
```

**Auth**: Patient/Staff JWT

**Query Parameters**:

- `abha_id` (optional): Search by ABHA ID
- `phone` (optional): Search by phone
- `email` (optional): Search by email

**Response**: `200 OK`

```json
{
  "patient": {
    "id": "patient-uuid-123",
    "abha_id": "12-3456-7890-1234",
    "name": "Amit Kumar",
    "dob": "1990-05-15",
    "gender": "male",
    "phone": "+91-98765-43210"
  }
}
```

---

## 🤝 Consent Management

### Grant Consent to Hospital (Patient Action)

```
POST /consent/grant
```

**Auth**: Patient JWT

**Request Body**:

```json
{
  "hospital_id": "hospital-uuid",
  "consent_type": "full_access",
  "purpose": "treatment",
  "expiry": "2025-12-31T23:59:59Z"
}
```

**Response**: `201 Created`

```json
{
  "consent": {
    "id": "consent-uuid-123",
    "patient_id": "patient-uuid",
    "hospital_id": "hospital-uuid",
    "status": "granted",
    "consent_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "qr_code_url": "/consent/consent-uuid-123/qr",
    "expires_at": "2025-12-31T23:59:59Z",
    "created_at": "2025-11-28T19:45:32.123Z"
  }
}
```

### Get QR Code for Consent

```
GET /consent/:consentId/qr
```

**Auth**: Patient JWT (must own the consent)

**Response**: `200 OK` (PNG image)

### Revoke Consent

```
POST /consent/revoke
```

**Auth**: Patient JWT

**Request Body**:

```json
{
  "consent_id": "consent-uuid-123",
  "reason": "treatment_completed"
}
```

**Response**: `200 OK`

```json
{
  "message": "Consent revoked successfully",
  "consent": {
    "id": "consent-uuid-123",
    "status": "revoked",
    "revoked_at": "2025-11-28T20:00:00Z"
  }
}
```

### List My Consents (Patient)

```
GET /consent/my
```

**Auth**: Patient JWT

**Response**: `200 OK`

```json
{
  "consents": [
    {
      "id": "consent-uuid-123",
      "hospital_name": "Government General Hospital Mumbai",
      "status": "granted",
      "expires_at": "2025-12-31T23:59:59Z",
      "created_at": "2025-11-28T19:45:32.123Z"
    }
  ]
}
```

### Check Consent Status (Public)

```
GET /consent/status/:consentId
```

**Auth**: None

**Response**: `200 OK` or `404 Not Found`

```json
{
  "consent_id": "consent-uuid-123",
  "status": "granted",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

### View Received Consents (Hospital Staff)

```
GET /consent/received?hospitalId=xxx
```

**Auth**: Staff JWT

**Query Parameters**:

- `hospitalId` (required): Hospital UUID
- `status` (optional): Filter by status (`granted`, `revoked`, `expired`)

**Response**: `200 OK`

```json
{
  "consents": [
    {
      "id": "consent-uuid-123",
      "patient_name": "Amit Kumar",
      "patient_abha": "12-3456-7890-1234",
      "status": "granted",
      "expires_at": "2025-12-31T23:59:59Z",
      "granted_at": "2025-11-28T19:45:32.123Z"
    }
  ]
}
```

### Request Consent (Hospital Staff)

```
POST /consent-requests
```

**Auth**: Staff JWT

**Request Body**:

```json
{
  "patient_id": "patient-uuid",
  "hospital_id": "hospital-uuid",
  "purpose": "follow_up_treatment",
  "expiry_date": "2025-12-31"
}
```

**Response**: `201 Created`

```json
{
  "request": {
    "id": "request-uuid-123",
    "patient_id": "patient-uuid",
    "hospital_id": "hospital-uuid",
    "status": "pending",
    "created_at": "2025-11-28T20:00:00Z"
  }
}
```

---

## 🏨 Admissions

### List Admissions

```
GET /admissions?hospitalId=xxx&status=active
```

**Auth**: None

**Query Parameters**:

- `hospitalId` (required): Hospital UUID
- `status` (optional): `active`, `discharged`
- `limit` (optional): Results limit (default: 50)

**Response**: `200 OK`

```json
[
  {
    "id": "admission-uuid-123",
    "patient_id": "patient-uuid",
    "hospital_id": "hospital-uuid",
    "bed_id": "bed-uuid",
    "admission_date": "2025-11-25T10:00:00Z",
    "status": "active",
    "primary_doctor_id": "doctor-uuid",
    "diagnosis": "Acute respiratory infection"
  }
]
```

### Create Admission (Hospital Staff)

```
POST /admissions
```

**Auth**: Staff JWT

**Request Body**:

```json
{
  "patient_id": "patient-uuid",
  "hospital_id": "hospital-uuid",
  "bed_id": "bed-uuid",
  "primary_doctor_id": "doctor-uuid",
  "diagnosis": "Acute respiratory infection",
  "admission_type": "emergency"
}
```

**Response**: `201 Created`

```json
{
  "admission": {
    "id": "admission-uuid-123",
    "patient_id": "patient-uuid",
    "hospital_id": "hospital-uuid",
    "bed_id": "bed-uuid",
    "status": "active",
    "admission_date": "2025-11-28T20:00:00Z"
  }
}
```

### Discharge Patient

```
PATCH /admissions/:admissionId/discharge
```

**Auth**: Staff JWT

**Request Body**:

```json
{
  "discharge_summary": "Patient recovered well, discharged with medications",
  "follow_up_date": "2025-12-05"
}
```

**Response**: `200 OK`

```json
{
  "admission": {
    "id": "admission-uuid-123",
    "status": "discharged",
    "discharge_date": "2025-11-28T20:30:00Z",
    "discharge_summary": "Patient recovered well..."
  }
}
```

---

## 📋 Electronic Health Records (EHR)

**Important**: All EHR endpoints require **BOTH** Staff JWT and Consent Token

### Headers Required

```javascript
{
  "Authorization": "Bearer <STAFF_JWT>",
  "X-Consent-Token": "<CONSENT_JWT>"
}
```

### Get Patient Profile

```
GET /ehr/patient/:patientId
```

**Auth**: Staff JWT + Consent Token

**Response**: `200 OK`

```json
{
  "patient": {
    "id": "patient-uuid",
    "abha_id": "12-3456-7890-1234",
    "name": "Amit Kumar",
    "dob": "1990-05-15",
    "gender": "male",
    "blood_group": "O+",
    "allergies": ["Penicillin"],
    "chronic_conditions": ["Hypertension"]
  }
}
```

### Get Prescriptions

```
GET /ehr/patient/:patientId/prescriptions?limit=10
```

**Auth**: Staff JWT + Consent Token

**Response**: `200 OK`

```json
{
  "prescriptions": [
    {
      "id": "prescription-uuid",
      "date": "2025-11-28",
      "doctor_name": "Dr. Rajesh Sharma",
      "medications": [
        {
          "name": "Amoxicillin",
          "dosage": "500mg",
          "frequency": "3 times daily",
          "duration": "7 days"
        }
      ]
    }
  ]
}
```

### Get Test Reports

```
GET /ehr/patient/:patientId/test-reports?limit=10
```

**Auth**: Staff JWT + Consent Token

**Response**: `200 OK`

```json
{
  "reports": [
    {
      "id": "report-uuid",
      "test_name": "Complete Blood Count",
      "date": "2025-11-27",
      "results": {
        "hemoglobin": "14.5 g/dL",
        "wbc": "8000/μL",
        "platelets": "250000/μL"
      },
      "status": "normal"
    }
  ]
}
```

### Get Medical History

```
GET /ehr/patient/:patientId/medical-history
```

**Auth**: Staff JWT + Consent Token

**Response**: `200 OK`

```json
{
  "history": {
    "previous_admissions": [
      {
        "date": "2024-03-15",
        "hospital": "City Hospital",
        "diagnosis": "Appendicitis",
        "treatment": "Appendectomy"
      }
    ],
    "surgeries": [
      {
        "date": "2024-03-16",
        "procedure": "Laparoscopic appendectomy",
        "surgeon": "Dr. Priya Desai"
      }
    ],
    "family_history": {
      "diabetes": true,
      "heart_disease": false
    }
  }
}
```

### Get IoT Device Data

```
GET /ehr/patient/:patientId/iot/:deviceType?from=2025-11-28T00:00:00Z&to=2025-11-28T23:59:59Z
```

**Auth**: Staff JWT + Consent Token

**Path Parameters**:

- `deviceType`: `heart_rate`, `blood_pressure`, `oxygen_saturation`, `temperature`

**Query Parameters**:

- `from` (optional): Start timestamp
- `to` (optional): End timestamp
- `limit` (optional): Results limit (default: 100)

**Response**: `200 OK`

```json
{
  "device_type": "heart_rate",
  "readings": [
    {
      "timestamp": "2025-11-28T10:00:00Z",
      "value": 72,
      "unit": "bpm",
      "status": "normal"
    },
    {
      "timestamp": "2025-11-28T11:00:00Z",
      "value": 75,
      "unit": "bpm",
      "status": "normal"
    }
  ]
}
```

### Add Prescription

```
POST /ehr/patient/:patientId/prescription
```

**Auth**: Staff JWT + Consent Token

**Request Body**:

```json
{
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "instructions": "Take with food"
    }
  ],
  "diagnosis": "Upper respiratory tract infection",
  "notes": "Follow up in 7 days if symptoms persist"
}
```

**Response**: `201 Created`

```json
{
  "prescription": {
    "id": "prescription-uuid",
    "patient_id": "patient-uuid",
    "doctor_id": "doctor-uuid",
    "date": "2025-11-28T20:00:00Z",
    "medications": [...]
  }
}
```

### Add Test Report

```
POST /ehr/patient/:patientId/test-report
```

**Auth**: Staff JWT + Consent Token

**Request Body**:

```json
{
  "test_name": "Complete Blood Count",
  "test_date": "2025-11-28",
  "results": {
    "hemoglobin": "14.5 g/dL",
    "wbc": "8000/μL",
    "platelets": "250000/μL"
  },
  "status": "normal",
  "notes": "All values within normal range"
}
```

**Response**: `201 Created`

```json
{
  "report": {
    "id": "report-uuid",
    "patient_id": "patient-uuid",
    "test_name": "Complete Blood Count",
    "date": "2025-11-28",
    "status": "normal"
  }
}
```

### Log IoT Reading

```
POST /ehr/patient/:patientId/iot-log
```

**Auth**: Staff JWT + Consent Token

**Request Body**:

```json
{
  "device_type": "heart_rate",
  "value": 72,
  "unit": "bpm",
  "timestamp": "2025-11-28T20:00:00Z",
  "status": "normal"
}
```

**Response**: `201 Created`

```json
{
  "log": {
    "id": "log-uuid",
    "patient_id": "patient-uuid",
    "device_type": "heart_rate",
    "value": 72,
    "timestamp": "2025-11-28T20:00:00Z"
  }
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common HTTP Status Codes

| Status | Meaning               | Example                                                |
| ------ | --------------------- | ------------------------------------------------------ |
| `200`  | Success               | Request completed successfully                         |
| `201`  | Created               | Resource created (POST requests)                       |
| `400`  | Bad Request           | Invalid request body or parameters                     |
| `401`  | Unauthorized          | Missing or invalid JWT token                           |
| `403`  | Forbidden             | Valid token but insufficient permissions               |
| `404`  | Not Found             | Resource doesn't exist                                 |
| `409`  | Conflict              | Resource already exists (e.g., duplicate registration) |
| `422`  | Unprocessable Entity  | Validation failed                                      |
| `500`  | Internal Server Error | Server-side error                                      |

### Example Error Responses

#### Missing Authentication

```json
{
  "error": "Authorization token required",
  "code": "AUTH_REQUIRED"
}
```

#### Invalid Consent Token

```json
{
  "error": "Invalid or expired consent token",
  "code": "INVALID_CONSENT"
}
```

#### Missing Required Field

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "abha_id": "ABHA ID is required"
  }
}
```

#### Resource Not Found

```json
{
  "error": "Patient not found",
  "code": "NOT_FOUND"
}
```

---

## 🚦 Rate Limits

Currently no rate limits enforced, but consider implementing client-side throttling:

- Max 100 requests per minute per user
- Max 1000 requests per hour per IP

---

## 📝 Notes for Frontend Developers

### 1. Authentication Flow

```javascript
// 1. Patient registers/logs in via Supabase
const { data: { session } } = await supabase.auth.signInWithPassword({
  email, password
})
const patientJWT = session.access_token

// 2. Patient registers with backend
await fetch('https://samruddhi-backend.onrender.com/patients/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${patientJWT}`
  },
  body: JSON.stringify({ abha_id, name, dob, ... })
})

// 3. Patient grants consent to hospital
const { consent } = await fetch('.../consent/grant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${patientJWT}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ hospital_id, consent_type: 'full_access', ... })
}).then(r => r.json())

// 4. Patient shows QR code to hospital staff
const qrCodeUrl = consent.qr_code_url
// OR share consent_token directly

// 5. Hospital staff scans QR or gets token, can now access EHR
await fetch(`/ehr/patient/${patientId}/prescriptions`, {
  headers: {
    'Authorization': `Bearer ${staffJWT}`,
    'X-Consent-Token': consent.consent_token
  }
})
```

### 2. Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API
VITE_API_BASE_URL=https://samruddhi-backend.onrender.com
```

### 3. Example Fetch Helper

```typescript
const API_BASE = "https://samruddhi-backend.onrender.com";

async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  consentToken?: string
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  if (consentToken) {
    headers["X-Consent-Token"] = consentToken;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

// Usage
const hospitals = await apiCall("/hospitals?limit=10");
const prescriptions = await apiCall(
  `/ehr/patient/${patientId}/prescriptions`,
  {},
  consentToken
);
```

### 4. Testing Checklist

- [ ] Test patient registration flow
- [ ] Test patient login and JWT refresh
- [ ] Test consent grant/revoke flow
- [ ] Test QR code generation and display
- [ ] Test hospital staff login
- [ ] Test staff viewing received consents
- [ ] Test EHR access with valid consent token
- [ ] Test EHR access denial without consent
- [ ] Test admission creation and discharge
- [ ] Test error handling (401, 403, 404, etc.)

---

## 🔗 Additional Resources

- **Repository**: https://github.com/Soham-1304/Samruddhi_Backend
- **Deployment Guide**: See `DEPLOYMENT.md` in repository
- **Architecture**: See `ARCHITECTURE_FLOW.md` for system design

---

## 📞 Support

For API issues or questions:

1. Check error response codes and messages
2. Review authentication headers
3. Verify consent tokens are valid and not expired
4. Check Supabase JWT expiration (default: 1 hour)

---

**Last Updated**: November 28, 2025
**API Version**: 1.0.0
**Status**: Production Ready ✅
