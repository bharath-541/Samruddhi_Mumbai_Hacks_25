# Samruddhi Backend API Documentation

**Last Updated:** November 29, 2025  
**Status:** ✅ Local Testing Complete | ⚠️ Production Needs Restart  
**Version:** 2.0.0

## 🔧 Recent Changes (Nov 29, 2025)

**Schema Migration Applied:** `20251129000001_fix_patients_text_columns.sql`

- Fixed: Changed `patients` table columns from BYTEA to TEXT
- Status: ✅ Works locally | ⚠️ Production server restart pending
- Impact: Patient registration now working correctly

## Base URL

```
Production: https://samruddhi-backend.onrender.com
Local: http://localhost:3000
```

## Table of Contents

1. [Authentication](#authentication)
2. [Public Endpoints](#public-endpoints)
3. [Patient Endpoints](#patient-endpoints)
4. [Consent Management](#consent-management)
5. [Hospital Staff Endpoints](#hospital-staff-endpoints)
6. [EHR (Electronic Health Records)](#ehr-electronic-health-records)
7. [Management Endpoints](#management-endpoints)
8. [ML & Analytics](#ml--analytics)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

### Overview

The API uses Supabase Authentication for user management and JWT tokens for API authorization.

### User Roles

- **Patient**: Regular users with ABHA IDs
- **Staff**: Hospital staff (doctors, nurses, admin)
- **Super Admin**: System administrators

### Authentication Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

### Get JWT Token

Use Supabase client library to authenticate:

```javascript
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://bbgyfxgdyevciaggalmn.supabase.co",
  "YOUR_ANON_KEY"
);

// Patient login
const { data, error } = await supabase.auth.signInWithPassword({
  email: "patient@example.com",
  password: "password123",
});

const token = data.session.access_token;
```

---

## Public Endpoints

### Health Check

```http
GET /health/live
```

**Response:**

```json
{
  "status": "ok"
}
```

**Status:** ✅ Working (verified Nov 29, 2025)

### Readiness Check

```http
GET /health/ready
```

**Response:**

```json
{
  "status": "ready",
  "services": {
    "postgres": "connected",
    "redis": "connected",
    "mongodb": "connected"
  }
}
```

### List Hospitals

```http
GET /hospitals
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Filter by hospital name (partial match) |
| `type` | string | Filter by type: `government`, `private`, `trust` |
| `tier` | string | Filter by tier: `primary`, `secondary`, `tertiary` |
| `city` | string | Filter by city |
| `state` | string | Filter by state |
| `limit` | number | Limit results (default: 50) |

**Response:**

```json
[
  {
    "id": "b113834f-b7d3-448c-b646-f1a5bdfb559c",
    "name": "KEM Hospital Mumbai",
    "type": "government",
    "tier": "tertiary",
    "address": {
      "street": "Acharya Donde Marg, Parel",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400012"
    },
    "contact_phone": "+91-22-24107000",
    "contact_email": "admin@kem.edu",
    "total_beds": 950,
    "icu_beds": 140,
    "current_bed_demand": 650,
    "bed_occupancy_rate": 68.42,
    "capacity_summary": {
      "total_beds": 950,
      "available_beds": 300,
      "occupied_beds": 650,
      "icu_total": 140,
      "icu_available": 45
    }
  }
]
```

### List Beds

```http
GET /beds
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `hospitalId` | UUID | **Required**. Hospital ID |
| `status` | string | Filter by status: `available`, `occupied`, `maintenance`, `reserved` |
| `type` | string | Filter by type: `general`, `icu`, `nicu`, `picu`, `emergency`, `isolation` |
| `floor` | number | Filter by floor number |
| `limit` | number | Limit results (default: 100) |

**Response:**

```json
[
  {
    "id": "bed-uuid-1",
    "hospital_id": "b113834f-b7d3-448c-b646-f1a5bdfb559c",
    "bed_number": "MH-BED-001",
    "type": "icu",
    "status": "available",
    "floor_number": 4,
    "room_number": "R401",
    "department_id": "dept-uuid",
    "features": ["ventilator", "cardiac_monitor"],
    "last_cleaned_at": "2025-11-29T08:00:00Z"
  }
]
```

### List Doctors

```http
GET /doctors
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `hospitalId` | UUID | **Required**. Hospital ID |
| `specialization` | string | Filter by specialization |
| `status` | string | Filter: `on_duty`, `off_duty` |
| `departmentId` | UUID | Filter by department |
| `limit` | number | Limit results (default: 50) |

**Response:**

```json
[
  {
    "id": "doctor-uuid-1",
    "name": "Dr. Rajesh Kumar",
    "specialization": "Cardiologist",
    "qualification": ["MBBS", "MD"],
    "hospital_id": "b113834f-b7d3-448c-b646-f1a5bdfb559c",
    "department_id": "dept-uuid",
    "is_on_duty": true,
    "max_patients": 12,
    "current_patient_count": 8,
    "contact_phone": "+91-9876543210"
  }
]
```

### List Admissions

```http
GET /admissions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `hospitalId` | UUID | **Required**. Hospital ID |
| `status` | string | Filter: `active`, `discharged` |
| `patientId` | UUID | Filter by patient |
| `doctorId` | UUID | Filter by doctor |
| `limit` | number | Limit results (default: 50) |

---

## Patient Endpoints

### Register Patient

```http
POST /patients/register
Authorization: Bearer <PATIENT_JWT>
```

**Request Body:**

```json
{
  "abha_id": "1234-5678-9012",
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "blood_group": "O+",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "emergency_contact": {
    "name": "John Doe",
    "relationship": "father",
    "phone": "+91-9876543210"
  }
}
```

**Response:**

```json
{
  "success": true,
  "patient": {
    "id": "patient-uuid",
    "abha_id": "1234-5678-9012",
    "gender": "male",
    "blood_group": "O+",
    "created_at": "2025-11-29T10:30:00Z"
  }
}
```

### Search Patient by ABHA

```http
GET /patients/search?abha_id=1234-5678-9012
Authorization: Bearer <STAFF_JWT>
```

**Response:**

```json
{
  "id": "patient-uuid",
  "abha_id": "1234-5678-9012",
  "gender": "male",
  "blood_group": "O+",
  "created_at": "2025-11-29T10:30:00Z"
}
```

---

## Consent Management

### Grant Consent

```http
POST /consent/grant
Authorization: Bearer <PATIENT_JWT>
```

**Request Body:**

```json
{
  "patientId": "patient-auth-user-id",
  "recipientId": "staff-auth-user-id",
  "recipientHospitalId": "hospital-uuid",
  "scope": [
    "profile",
    "prescriptions",
    "test_reports",
    "medical_history",
    "iot_data"
  ],
  "durationDays": 7
}
```

**Response:**

```json
{
  "consentId": "consent-uuid",
  "consentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-06T10:30:00Z"
}
```

### Get Consent QR Code

```http
GET /consent/:consentId/qr?token=<CONSENT_TOKEN>
```

**Response:**

- Content-Type: `image/png`
- QR code image containing consent token

### Check Consent Status (Public)

```http
GET /consent/:consentId/status
```

**Response:**

```json
{
  "id": "consent-uuid",
  "status": "active",
  "scope": ["profile", "prescriptions"],
  "granted_at": "2025-11-29T10:30:00Z",
  "expires_at": "2025-12-06T10:30:00Z"
}
```

### List My Consents (Patient)

```http
GET /consent/my-consents
Authorization: Bearer <PATIENT_JWT>
```

**Response:**

```json
[
  {
    "id": "consent-uuid",
    "recipient_hospital_name": "KEM Hospital",
    "recipient_doctor_name": "Dr. Rajesh Kumar",
    "scope": ["profile", "prescriptions"],
    "status": "active",
    "granted_at": "2025-11-29T10:30:00Z",
    "expires_at": "2025-12-06T10:30:00Z"
  }
]
```

### List Received Consents (Staff)

```http
GET /consent/received
Authorization: Bearer <STAFF_JWT>
```

**Response:**

```json
[
  {
    "id": "consent-uuid",
    "patient_abha_id": "1234-5678-9012",
    "scope": ["profile", "prescriptions"],
    "status": "active",
    "granted_at": "2025-11-29T10:30:00Z",
    "expires_at": "2025-12-06T10:30:00Z"
  }
]
```

### Request Consent from Patient

```http
POST /consent/request
Authorization: Bearer <STAFF_JWT>
```

**Request Body:**

```json
{
  "patientAbhaId": "1234-5678-9012",
  "scope": ["profile", "prescriptions", "test_reports"],
  "purpose": "Treatment consultation",
  "durationDays": 7
}
```

**Response:**

```json
{
  "success": true,
  "requestId": "request-uuid",
  "message": "Consent request sent to patient"
}
```

### Revoke Consent

```http
DELETE /consent/:consentId
Authorization: Bearer <PATIENT_JWT>
```

**Response:**

```json
{
  "success": true,
  "message": "Consent revoked successfully"
}
```

---

## Hospital Staff Endpoints

### Create Doctor Profile

```http
POST /doctors
Authorization: Bearer <STAFF_JWT>
```

**Request Body:**

```json
{
  "user_id": "staff-auth-user-id",
  "hospital_id": "hospital-uuid",
  "name": "Dr. Rajesh Kumar",
  "license_number": "MH-DOC-12345",
  "specialization": "Cardiologist",
  "qualification": ["MBBS", "MD", "DM"],
  "department_id": "dept-uuid",
  "contact_phone": "+91-9876543210",
  "is_on_duty": true,
  "max_patients": 12
}
```

**Response:**

```json
{
  "success": true,
  "doctor": {
    "id": "doctor-uuid",
    "name": "Dr. Rajesh Kumar",
    "specialization": "Cardiologist",
    "is_on_duty": true,
    "created_at": "2025-11-29T10:30:00Z"
  }
}
```

### Update Doctor Profile

```http
PATCH /doctors/:id
Authorization: Bearer <STAFF_JWT>
```

**Request Body:**

```json
{
  "specialization": "Interventional Cardiologist",
  "is_on_duty": false,
  "max_patients": 15
}
```

---

## EHR (Electronic Health Records)

All EHR endpoints require:

1. Staff JWT token in `Authorization` header
2. Valid consent token in `X-Consent-Token` header

### Get Patient Profile

```http
GET /ehr/patient/:patientId
Authorization: Bearer <STAFF_JWT>
X-Consent-Token: <CONSENT_JWT>
```

**Response:**

```json
{
  "patient_id": "patient-uuid",
  "abha_id": "1234-5678-9012",
  "name": "John Doe",
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "blood_group": "O+",
  "address": {
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "emergency_contact": {
    "name": "Jane Doe",
    "phone": "+91-9876543210"
  }
}
```

### Get Prescriptions

```http
GET /ehr/patient/:patientId/prescriptions
Authorization: Bearer <STAFF_JWT>
X-Consent-Token: <CONSENT_JWT>
```

**Response:**

```json
[
  {
    "id": "prescription-id",
    "date": "2025-11-28",
    "doctor_name": "Dr. Rajesh Kumar",
    "hospital_name": "KEM Hospital",
    "diagnosis": "Hypertension",
    "medications": [
      {
        "name": "Amlodipine",
        "dosage": "5mg",
        "frequency": "Once daily",
        "duration": "30 days"
      }
    ]
  }
]
```

### Add Prescription

```http
POST /ehr/patient/:patientId/prescription
Authorization: Bearer <STAFF_JWT>
X-Consent-Token: <CONSENT_JWT>
```

**Request Body:**

```json
{
  "date": "2025-11-29",
  "doctor_name": "Dr. Rajesh Kumar",
  "hospital_name": "KEM Hospital",
  "diagnosis": "Upper respiratory infection",
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days",
      "notes": "Take with food"
    }
  ]
}
```

### Get Test Reports

```http
GET /ehr/patient/:patientId/test-reports
Authorization: Bearer <STAFF_JWT>
X-Consent-Token: <CONSENT_JWT>
```

### Add Test Report

```http
POST /ehr/patient/:patientId/test-report
Authorization: Bearer <STAFF_JWT>
X-Consent-Token: <CONSENT_JWT>
```

**Request Body:**

```json
{
  "test_name": "Complete Blood Count",
  "date": "2025-11-29",
  "lab_name": "City Lab",
  "doctor_name": "Dr. Rajesh Kumar",
  "parsed_results": {
    "hemoglobin": "14.5 g/dL",
    "wbc": "8000/μL",
    "platelets": "250000/μL"
  },
  "notes": "All values within normal range"
}
```

### Get Medical History

```http
GET /ehr/patient/:patientId/medical-history
Authorization: Bearer <STAFF_JWT>
X-Consent-Token: <CONSENT_JWT>
```

### Get IoT Data

```http
GET /ehr/patient/:patientId/iot/:deviceType
Authorization: Bearer <STAFF_JWT>
X-Consent-Token: <CONSENT_JWT>
```

**Device Types:** `heart_rate`, `blood_pressure`, `blood_glucose`, `temperature`, `oxygen_saturation`

### Log IoT Reading

```http
POST /ehr/patient/:patientId/iot-log
Authorization: Bearer <STAFF_JWT>
X-Consent-Token: <CONSENT_JWT>
```

**Request Body:**

```json
{
  "device_type": "heart_rate",
  "device_id": "HR-MONITOR-001",
  "value": 72,
  "unit": "bpm",
  "recorded_at": "2025-11-29T10:30:00Z"
}
```

---

## Management Endpoints

### Create Bed

```http
POST /beds
Authorization: Bearer <STAFF_JWT>
```

**Request Body:**

```json
{
  "hospital_id": "hospital-uuid",
  "bed_number": "ICU-101",
  "type": "icu",
  "floor_number": 4,
  "room_number": "R401",
  "department_id": "dept-uuid",
  "status": "available",
  "features": ["ventilator", "cardiac_monitor"]
}
```

**Response:**

```json
{
  "success": true,
  "bed": {
    "id": "bed-uuid",
    "bed_number": "ICU-101",
    "type": "icu",
    "status": "available",
    "created_at": "2025-11-29T10:30:00Z"
  }
}
```

### Update Bed

```http
PATCH /beds/:id
Authorization: Bearer <STAFF_JWT>
```

**Request Body:**

```json
{
  "status": "maintenance",
  "maintenance_notes": "Scheduled cleaning",
  "floor_number": 5
}
```

### Delete Bed

```http
DELETE /beds/:id
Authorization: Bearer <STAFF_JWT>
```

**Note:** Cannot delete beds with status `occupied`.

### Create Admission

```http
POST /admissions
Authorization: Bearer <STAFF_JWT>
```

**Request Body:**

```json
{
  "patient_id": "patient-uuid",
  "hospital_id": "hospital-uuid",
  "bed_id": "bed-uuid",
  "primary_doctor_id": "doctor-uuid",
  "department_id": "dept-uuid",
  "admission_type": "emergency",
  "reason": "Chest pain",
  "diagnosis": "Suspected MI",
  "severity": "critical"
}
```

**Response:**

```json
{
  "success": true,
  "admission": {
    "id": "admission-uuid",
    "admission_number": "ADM-2025-001",
    "admitted_at": "2025-11-29T10:30:00Z",
    "bed": {
      "bed_number": "ICU-101",
      "status": "occupied"
    }
  }
}
```

### Discharge Patient

```http
PATCH /admissions/:id/discharge
Authorization: Bearer <STAFF_JWT>
```

**Request Body:**

```json
{
  "discharge_summary": "Patient stable, symptoms resolved",
  "discharge_type": "normal",
  "follow_up_instructions": "Review after 1 week",
  "follow_up_date": "2025-12-06",
  "total_cost": 15000.0
}
```

**Response:**

```json
{
  "success": true,
  "admission": {
    "id": "admission-uuid",
    "discharged_at": "2025-11-29T15:30:00Z",
    "discharge_type": "normal",
    "bed": {
      "status": "available"
    }
  }
}
```

---

## ML & Analytics

### Predict Bed Demand

```http
POST /ml/predict-bed-demand
Authorization: Bearer <STAFF_JWT>
```

**Request Body:**

```json
{
  "hospital_id": "hospital-uuid",
  "date": "2025-12-01",
  "weather": {
    "temperature": 28,
    "humidity": 65,
    "rainfall": 0,
    "aqi": 120
  }
}
```

**Response:**

```json
{
  "hospital_id": "hospital-uuid",
  "hospital_name": "KEM Hospital Mumbai",
  "prediction_date": "2025-12-01",
  "predicted_demand": 685,
  "confidence": 0.89,
  "capacity": {
    "total_beds": 950,
    "current_occupancy": 650,
    "predicted_occupancy_rate": 72.11
  },
  "recommendations": [
    "Predicted demand within normal range",
    "45 ICU beds available for emergencies"
  ]
}
```

### Dashboard Stats

```http
GET /dashboard/stats?hospitalId=<hospital-uuid>
Authorization: Bearer <STAFF_JWT>
```

**Response:**

```json
{
  "hospital": {
    "name": "KEM Hospital Mumbai",
    "total_beds": 950,
    "occupied_beds": 650,
    "available_beds": 300,
    "occupancy_rate": 68.42
  },
  "departments": [
    {
      "name": "ICU",
      "total_beds": 140,
      "occupied": 95,
      "available": 45
    }
  ],
  "admissions": {
    "today": 12,
    "this_week": 78,
    "this_month": 312
  },
  "doctors": {
    "total": 200,
    "on_duty": 145
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  }
}
```

### HTTP Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | Success                                 |
| 201  | Created                                 |
| 400  | Bad Request - Invalid input             |
| 401  | Unauthorized - Missing or invalid token |
| 403  | Forbidden - No permission               |
| 404  | Not Found                               |
| 409  | Conflict - Duplicate resource           |
| 422  | Unprocessable Entity - Validation error |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error                   |

### Common Error Codes

| Code                 | Description                                 |
| -------------------- | ------------------------------------------- |
| `INVALID_TOKEN`      | JWT token is invalid or expired             |
| `CONSENT_REQUIRED`   | Valid consent token required for EHR access |
| `CONSENT_EXPIRED`    | Consent token has expired                   |
| `INSUFFICIENT_SCOPE` | Consent doesn't include required scope      |
| `PATIENT_NOT_FOUND`  | Patient record not found                    |
| `HOSPITAL_NOT_FOUND` | Hospital not found                          |
| `BED_NOT_AVAILABLE`  | Bed is occupied or not available            |
| `DOCTOR_NOT_FOUND`   | Doctor profile not found                    |
| `DUPLICATE_ENTRY`    | Resource already exists                     |

---

## Rate Limiting

### Limits

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 300 requests per minute
- **EHR endpoints**: 100 requests per minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 295
X-RateLimit-Reset: 1732880400
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

---

## Testing

### Test Credentials

**Patient:**

```
Email: test.patient@samruddhi.test
Password: Password123!
ABHA ID: 1234-5678-9012
```

**Staff/Doctor:**

```
Email: test.staff@samruddhi.test
Password: Password123!
```

### Example Request Flow

1. **Authenticate Patient**

```javascript
const { data } = await supabase.auth.signInWithPassword({
  email: "test.patient@samruddhi.test",
  password: "Password123!",
});
const patientToken = data.session.access_token;
```

2. **Grant Consent**

```javascript
const response = await fetch(
  "https://samruddhi-backend.onrender.com/consent/grant",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${patientToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      patientId: data.user.id,
      recipientId: "staff-user-id",
      recipientHospitalId: "hospital-uuid",
      scope: ["profile", "prescriptions"],
      durationDays: 7,
    }),
  }
);
const { consentToken } = await response.json();
```

3. **Access EHR**

```javascript
const ehrResponse = await fetch(
  `https://samruddhi-backend.onrender.com/ehr/patient/${patientId}`,
  {
    headers: {
      Authorization: `Bearer ${staffToken}`,
      "X-Consent-Token": consentToken,
    },
  }
);
```

---

## Support

For issues or questions:

- GitHub: [Samruddhi_Backend](https://github.com/Soham-1304/Samruddhi_Backend)
- Documentation: `/docs/`
- Health Check: `https://samruddhi-backend.onrender.com/health`

---

**Last Updated:** November 29, 2025  
**API Version:** 1.0.0  
**Status:** ✅ Production Ready
