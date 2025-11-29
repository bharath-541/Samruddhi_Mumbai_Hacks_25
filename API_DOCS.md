# Samruddhi Backend - Comprehensive API Documentation

> **Version:** 1.0  
> **Production URL:** `https://samruddhi-backend.onrender.com`  
> **Development URL:** `http://localhost:3000`  
> **Last Updated:** 2025-11-29

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints by Category](#api-endpoints-by-category)
   - [Health Checks](#health-checks)
   - [Authentication & Authorization](#authentication--authorization)
   - [Patient Management](#patient-management)
   - [Consent Management](#consent-management)
   - [EHR (Electronic Health Records)](#ehr-electronic-health-records)
   - [Hospital Management](#hospital-management)
   - [Bed Management](#bed-management)
   - [Doctor Management](#doctor-management)
   - [Admission Management](#admission-management)
   - [ML/AI Predictions](#mlai-predictions)
   - [File Upload](#file-upload)
4. [Data Schemas](#data-schemas)
5. [Error Responses](#error-responses)
6. [Rate Limiting & Security](#rate-limiting--security)

---

## Overview

The Samruddhi Backend API is a comprehensive healthcare management system that provides:

- **Patient EHR Management**: Secure electronic health records with consent-based access
- **Hospital Resource Management**: Bed tracking, doctor scheduling, admissions
- **Consent Framework**: JWT-based consent tokens with fine-grained scopes
- **ML/AI Integration**: Bed demand prediction using machine learning
- **Multi-tenant Architecture**: Support for multiple hospitals and healthcare providers

### Technology Stack

- **Runtime**: Node.js + Express
- **Database**: PostgreSQL (Supabase) + MongoDB
- **Cache**: Redis (for consent management)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth (JWT-based)

---

## Authentication

### Authentication Methods

The API uses **Bearer Token authentication** with Supabase JWT tokens.

```http
Authorization: Bearer <access_token>
```

### Authentication Levels

1. **Public** - No authentication required
2. **requireAuth** - Valid Supabase JWT token required
3. **requirePatientAuth** - Patient-specific authentication
4. **requireHospitalStaff** - Hospital staff authentication
5. **requireConsent** - Consent token required (for accessing patient EHR)

### Getting an Access Token

**Patient Login:**
```bash
POST /auth/patient/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "email": "patient@example.com",
    "role": "patient"
  },
  "patient": {
    "id": "patient-uuid",
    "abha_id": "1234-5678-9012",
    "gender": "male",
    "blood_group": "O+"
  },
  "session": {
    "access_token": "eyJhbGci...",
    "refresh_token": "refresh-token",
    "expires_at": 1234567890
  },
  "note": "Store access_token and use as: Authorization: Bearer <access_token>"
}
```

---

## API Endpoints by Category

### Health Checks

#### 1. Liveness Check
```http
GET /health/live
```

**Auth:** Public  
**Description:** Check if the server is running

**Response:**
```json
{
  "status": "ok"
}
```

---

#### 2. Readiness Check
```http
GET /health/ready
```

**Auth:** Public  
**Description:** Check if the server is ready (database connectivity)

**Response (Success):**
```json
{
  "status": "ready"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Database connection failed"
}
```

---

### Authentication & Authorization

#### 3. Patient Signup
```http
POST /auth/patient/signup
```

**Auth:** Public  
**Description:** Create new patient account with auth user and EHR record

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "dob": "1990-01-15",
  "gender": "male",
  "bloodGroup": "O+",
  "abhaId": "1234-5678-9012",  // Optional - auto-generated if not provided
  "phone": "+91-9876543210",   // Optional
  "emergencyContact": "+91-9876543211",  // Optional
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Patient registered successfully",
  "patient": {
    "id": "patient-uuid",
    "abha_id": "1234-5678-9012",
    "name": "John Doe",
    "email": "patient@example.com"
  },
  "user_id": "user-uuid",
  "next_step": "Call supabase.auth.signInWithPassword() to get JWT token"
}
```

---

#### 4. Patient Login
```http
POST /auth/patient/login
```

**Auth:** Public  
**Description:** Login as patient and receive JWT token

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!"
}
```

**Response:** (See [Authentication](#authentication))

---

#### 5. Patient Registration (Legacy - Deprecated)
```http
POST /patients/register
```

**Auth:** requireAuth  
**Description:** Register patient after Supabase Auth signup (use `/auth/patient/signup` instead)

---

### Patient Management

#### 6. Search Patient
```http
GET /patients/search?abha_id=1234-5678-9012
GET /patients/search?email=patient@example.com
```

**Auth:** Public  
**Description:** Search for a patient by ABHA ID or email

**Query Parameters:**
- `abha_id` (string, optional) - ABHA ID to search
- `email` (string, optional) - Email to search
- **Note:** Either `abha_id` OR `email` must be provided

**Response (Found):**
```json
{
  "found": true,
  "patient": {
    "id": "patient-uuid",
    "abhaId": "1234-5678-9012",
    "name": "John Doe",
    "gender": "male",
    "bloodGroup": "O+",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Response (Not Found):**
```json
{
  "found": false,
  "message": "No patient found with this ABHA ID"
}
```

---

#### 7. Get Patient by ID
```http
GET /patients/:id
```

**Auth:** requireAuth  
**Description:** Get patient basic information

**Response:**
```json
{
  "id": "patient-uuid",
  "abhaId": "1234-5678-9012",
  "name": "John Doe",
  "gender": "male",
  "bloodGroup": "O+",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

#### 8. Update Patient Profile
```http
PATCH /patients/:id/profile
```

**Auth:** requirePatientAuth  
**Description:** Update patient's own profile (patient can only update their own)

**Request Body:**
```json
{
  "phone": "+91-9876543210",
  "emergencyContact": "+91-9876543211",
  "address": {
    "street": "456 New Street",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated",
  "updatedFields": ["phone", "emergencyContact", "address"]
}
```

---

### Consent Management

The consent system uses JWT tokens with Redis-based storage for revocation and expiry tracking.

#### 9. Grant Consent
```http
POST /consent/grant
```

**Auth:** requireAuth (Patient only)  
**Description:** Patient grants consent to a hospital/doctor to access their EHR

**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "recipientId": "doctor-uuid",
  "recipientHospitalId": "hospital-uuid",
  "scope": ["profile", "medical_history", "prescriptions", "test_reports", "iot_devices"],
  "durationDays": 14  // Must be 7 or 14
}
```

**Scope Options:**
- `profile` - Basic profile information
- `medical_history` - Medical history records
- `prescriptions` - Prescription data
- `test_reports` - Lab test results
- `iot_devices` - IoT device logs (heart rate, BP, etc.)

**Response (201 Created):**
```json
{
  "consentId": "consent-uuid-jti",
  "consentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-02-12T00:00:00Z",
  "scope": ["profile", "medical_history", "prescriptions"],
  "durationDays": 14
}
```

---

#### 10. Revoke Consent
```http
POST /consent/revoke
```

**Auth:** requireAuth (Patient only - can only revoke own consent)  
**Description:** Revoke previously granted consent

**Request Body:**
```json
{
  "consentId": "consent-uuid-jti"
}
```

**Response:**
```json
{
  "revoked": true
}
```

---

#### 11. Check Consent Status
```http
GET /consent/status/:consentId
```

**Auth:** Public  
**Description:** Check if a consent is valid, revoked, or expired

**Response:**
```json
{
  "consentId": "consent-uuid",
  "valid": true,
  "revoked": false,
  "expired": false,
  "expiresAt": "2025-02-12T00:00:00Z",
  "scope": ["profile", "prescriptions"],
  "patientId": "patient-uuid",
  "recipientId": "doctor-uuid",
  "recipientHospitalId": "hospital-uuid",
  "grantedAt": "2025-01-29T00:00:00Z"
}
```

---

#### 12. Get My Consents (Patient)
```http
GET /consent/my
```

**Auth:** requireAuth (Patient)  
**Description:** Get all consents granted by the authenticated patient

**Response:**
```json
{
  "consents": [
    {
      "consentId": "consent-uuid",
      "recipientId": "doctor-uuid",
      "recipientHospitalId": "hospital-uuid",
      "hospitalName": "Apollo Hospital",
      "scope": ["profile", "prescriptions"],
      "grantedAt": "2025-01-29T00:00:00Z",
      "expiresAt": "2025-02-12T00:00:00Z",
      "valid": true,
      "revoked": false,
      "expired": false
    }
  ]
}
```

---

#### 13. Get Received Consents (Hospital)
```http
GET /consent/received
```

**Auth:** requireAuth (Hospital Staff)  
**Description:** Get all active consents received by the hospital

**Response:**
```json
{
  "consents": [
    {
      "consentId": "consent-uuid",
      "patientId": "patient-uuid",
      "recipientId": "doctor-uuid",
      "scope": ["profile", "medical_history"],
      "grantedAt": "2025-01-29T00:00:00Z",
      "expiresAt": "2025-02-12T00:00:00Z"
    }
  ]
}
```

---

#### 14. Generate QR Code for Consent
```http
GET /consent/:consentId/qr?token=<consent_token>
```

**Auth:** requireAuth  
**Description:** Generate a QR code containing the consent token for easy sharing

**Query Parameters:**
- `token` (required) - The consent JWT token

**Response:**
```json
{
  "consentId": "consent-uuid",
  "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

#### 15. Scan QR Code
```http
POST /consent/scan
```

**Auth:** requireAuth  
**Description:** Scan and verify a consent QR code

**Request Body:**
```json
{
  "qrData": "{\"type\":\"samruddhi_consent\",\"consentId\":\"...\",\"token\":\"...\"}"
}
```

**Response:**
```json
{
  "valid": true,
  "consent": {
    "consentId": "consent-uuid",
    "patientId": "patient-uuid",
    "scope": ["profile", "prescriptions"],
    "expiresAt": "2025-02-12T00:00:00.000Z",
    "hospitalId": "hospital-uuid"
  }
}
```

---

#### 16. Request Consent (Doctor → Patient)
```http
POST /consent/request
```

**Auth:** requireAuth (Hospital Staff)  
**Description:** Doctor requests consent from a patient

**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "recipientId": "doctor-uuid",
  "scope": ["profile", "medical_history", "prescriptions"],
  "purpose": "Treatment for diabetes consultation"
}
```

**Response (201 Created):**
```json
{
  "request": {
    "id": "request-uuid",
    "patient_id": "patient-uuid",
    "doctor_id": "doctor-uuid",
    "hospital_id": "hospital-uuid",
    "scope": ["profile", "medical_history"],
    "purpose": "Treatment for diabetes consultation",
    "status": "pending",
    "created_at": "2025-01-29T00:00:00Z"
  }
}
```

---

#### 17. View My Consent Requests (Patient)
```http
GET /consent/requests/my
```

**Auth:** requireAuth (Patient)  
**Description:** View all consent requests sent to the authenticated patient

**Response:**
```json
{
  "requests": [
    {
      "id": "request-uuid",
      "patient_id": "patient-uuid",
      "doctor_id": "doctor-uuid",
      "hospital_id": "hospital-uuid",
      "scope": ["profile", "medical_history"],
      "purpose": "Treatment consultation",
      "status": "pending",
      "created_at": "2025-01-29T00:00:00Z",
      "doctor": {
        "name": "Dr. Smith",
        "specialization": "Cardiologist"
      },
      "hospital": {
        "name": "Apollo Hospital"
      }
    }
  ]
}
```

---

#### 18. Approve Consent Request
```http
POST /consent/requests/:id/approve
```

**Auth:** requireAuth (Patient)  
**Description:** Approve a consent request (generates consent token)

**Response:**
```json
{
  "success": true,
  "consentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "consentId": "consent-uuid",
  "expiresAt": "2025-02-12T00:00:00.000Z"
}
```

---

#### 19. Deny Consent Request
```http
POST /consent/requests/:id/deny
```

**Auth:** requireAuth (Patient)  
**Description:** Deny a consent request

**Response:**
```json
{
  "success": true,
  "message": "Request denied"
}
```

---

### EHR (Electronic Health Records)

#### Patient Self-Service EHR (No Consent Required)

#### 20. Get My Complete EHR
```http
GET /ehr/my
```

**Auth:** requireAuth (Patient)  
**Description:** Get complete EHR for authenticated patient

**Response:**
```json
{
  "patientId": "patient-uuid",
  "abhaId": "1234-5678-9012",
  "profile": {
    "name": "John Doe",
    "email": "patient@example.com",
    "dob": "1990-01-15",
    "blood_group": "O+",
    "phone": "+91-9876543210",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "emergency_contact": "+91-9876543211"
  },
  "prescriptions": [],
  "testReports": [],
  "medicalHistory": [],
  "iotDevices": []
}
```

---

#### 21. Get My Prescriptions
```http
GET /ehr/my/prescriptions
```

**Auth:** requireAuth (Patient)  
**Description:** Get all prescriptions for authenticated patient

**Response:**
```json
{
  "prescriptions": [
    {
      "date": "2025-01-15",
      "doctor_name": "Dr. Smith",
      "hospital_name": "Apollo Hospital",
      "medications": [
        {
          "name": "Metformin",
          "dosage": "500mg",
          "frequency": "Twice daily",
          "duration": "30 days",
          "notes": "Take with meals"
        }
      ],
      "diagnosis": "Type 2 Diabetes",
      "pdf_url": "https://storage.example.com/prescription.pdf",
      "added_by": "patient",
      "added_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### 22. Get My Test Reports
```http
GET /ehr/my/test-reports
```

**Auth:** requireAuth (Patient)  
**Description:** Get all test reports for authenticated patient

**Response:**
```json
{
  "testReports": [
    {
      "test_name": "Complete Blood Count",
      "date": "2025-01-20",
      "lab_name": "PathLab",
      "doctor_name": "Dr. Johnson",
      "pdf_url": "https://storage.example.com/test-report.pdf",
      "parsed_results": {
        "hemoglobin": "14.5 g/dL",
        "wbc": "7500 cells/μL",
        "platelets": "250000 cells/μL"
      },
      "notes": "All values within normal range",
      "added_by": "patient",
      "added_at": "2025-01-20T15:00:00Z"
    }
  ]
}
```

---

#### 23. Get My Medical History
```http
GET /ehr/my/medical-history
```

**Auth:** requireAuth (Patient)  
**Description:** Get medical history for authenticated patient

**Response:**
```json
{
  "medicalHistory": [
    {
      "date": "2020-05-10",
      "condition": "Appendicitis",
      "treatment": "Appendectomy",
      "notes": "Successful surgery, no complications",
      "doctor_name": "Dr. Williams",
      "hospital_name": "City Hospital",
      "added_by": "patient",
      "added_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 24. Get My IoT Device Data
```http
GET /ehr/my/iot/:deviceType
```

**Auth:** requireAuth (Patient)  
**Description:** Get IoT device logs for a specific device type

**Path Parameters:**
- `deviceType` - One of: `heart_rate`, `glucose`, `blood_pressure`, `spo2`, `temperature`

**Response:**
```json
{
  "deviceType": "heart_rate",
  "deviceId": "fitbit-123",
  "logs": [
    {
      "timestamp": "2025-01-29T08:00:00Z",
      "value": 72,
      "unit": "bpm",
      "context": "resting"
    }
  ]
}
```

---

#### 25. Add My Prescription
```http
POST /ehr/my/prescription
```

**Auth:** requireAuth (Patient)  
**Description:** Add prescription to own EHR (e.g., from another hospital)

**Request Body:**
```json
{
  "date": "2025-01-15",
  "doctor_name": "Dr. Smith",
  "hospital_name": "Apollo Hospital",
  "medications": [
    {
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "30 days",
      "notes": "Take with meals"
    }
  ],
  "diagnosis": "Type 2 Diabetes",
  "pdf_url": "https://storage.example.com/prescription.pdf"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Prescription added to your records"
}
```

---

#### 26. Add My Test Report
```http
POST /ehr/my/test-report
```

**Auth:** requireAuth (Patient)  
**Description:** Add test report to own EHR

**Request Body:**
```json
{
  "test_name": "Complete Blood Count",
  "date": "2025-01-20",
  "lab_name": "PathLab",
  "doctor_name": "Dr. Johnson",
  "pdf_url": "https://storage.example.com/test-report.pdf",
  "parsed_results": {
    "hemoglobin": "14.5 g/dL",
    "wbc": "7500"
  },
  "notes": "Normal"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Test report added to your records"
}
```

---

#### 27. Add My Medical History Entry
```http
POST /ehr/my/medical-history
```

**Auth:** requireAuth (Patient)  
**Description:** Add medical history entry to own EHR

**Request Body:**
```json
{
  "date": "2020-05-10",
  "condition": "Appendicitis",
  "treatment": "Appendectomy",
  "notes": "Successful surgery",
  "doctor_name": "Dr. Williams",
  "hospital_name": "City Hospital"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Medical history entry added"
}
```

---

#### 28. Add My IoT Device Log
```http
POST /ehr/my/iot-log
```

**Auth:** requireAuth (Patient)  
**Description:** Add IoT device reading to own EHR

**Request Body:**
```json
{
  "device_type": "heart_rate",
  "device_id": "fitbit-123",
  "value": 72,
  "unit": "bpm",
  "context": "resting"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "IoT log added"
}
```

---

#### Doctor/Hospital EHR Access (Requires Consent)

#### 29. Get Patient EHR (With Consent)
```http
GET /ehr/patient/:id
```

**Auth:** requireConsent  
**Headers:** `X-Consent-Token: <consent_jwt_token>`  
**Description:** Get patient EHR (filtered by consent scopes)

**Response:**
```json
{
  "access": "granted",
  "patientId": "patient-uuid",
  "scopes": ["profile", "prescriptions"],
  "ehr": {
    "profile": {...},
    "prescriptions": [...]
  }
}
```

---

#### 30. Get Patient Prescriptions (With Consent)
```http
GET /ehr/patient/:id/prescriptions
```

**Auth:** requireConsent (requires 'prescriptions' scope)  
**Headers:** `X-Consent-Token: <consent_jwt_token>`  
**Description:** Get patient prescriptions with consent

**Response:**
```json
{
  "prescriptions": [...]
}
```

---

#### 31. Get Patient Test Reports (With Consent)
```http
GET /ehr/patient/:id/test-reports
```

**Auth:** requireConsent (requires 'test_reports' scope)  
**Headers:** `X-Consent-Token: <consent_jwt_token>`

---

#### 32. Get Patient Medical History (With Consent)
```http
GET /ehr/patient/:id/medical-history
```

**Auth:** requireConsent (requires 'medical_history' scope)  
**Headers:** `X-Consent-Token: <consent_jwt_token>`

---

#### 33. Get Patient IoT Device Data (With Consent)
```http
GET /ehr/patient/:id/iot/:deviceType
```

**Auth:** requireConsent (requires 'iot_devices' scope)  
**Headers:** `X-Consent-Token: <consent_jwt_token>`

---

#### 34. Add Prescription to Patient (Doctor)
```http
POST /ehr/patient/:id/prescription
```

**Auth:** requireAuth + requireHospitalStaff  
**Description:** Doctor adds prescription to patient record (direct assignment, no consent needed for own hospital)

**Request Body:** (Same as patient prescription schema)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Prescription added to patient record",
  "prescription": {...}
}
```

---

#### 35. Add Test Report to Patient (Doctor)
```http
POST /ehr/patient/:id/test-report
```

**Auth:** requireAuth + requireHospitalStaff  
**Description:** Doctor adds test report to patient record

---

### Hospital Management

#### 36. List Hospitals
```http
GET /hospitals?limit=10
```

**Auth:** Public  
**Description:** Get list of hospitals

**Query Parameters:**
- `limit` (number, optional, default: 10, max: 100)

**Response:**
```json
[
  {
    "id": "hospital-uuid",
    "name": "Apollo Hospital",
    "type": "multi_specialty",
    "tier": "tier_1",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

#### 37. Get Hospital Capacity
```http
GET /hospitals/:id/capacity
```

**Auth:** Public  
**Description:** Get hospital bed capacity summary

**Response:**
```json
{
  "id": "hospital-uuid",
  "name": "Apollo Hospital",
  "capacity_summary": {
    "total_beds": 500,
    "occupied_beds": 320,
    "available_beds": 180,
    "icu_beds": 50,
    "general_beds": 450
  },
  "total_beds": 500,
  "bedOccupancy": 64
}
```

---

#### 38. Get Hospital Dashboard
```http
GET /hospitals/:id/dashboard
```

**Auth:** Public  
**Description:** Get comprehensive hospital dashboard with real-time stats

**Response:**
```json
{
  "hospital": {
    "id": "hospital-uuid",
    "name": "Apollo Hospital"
  },
  "capacity_summary": {...},
  "bedOccupancy": 64,
  "beds": {
    "general": {
      "total": 400,
      "available": 150,
      "occupied": 240,
      "maintenance": 10
    },
    "icu": {
      "total": 50,
      "available": 10,
      "occupied": 38,
      "maintenance": 2
    }
  },
  "active_admissions": 280,
  "doctors": {
    "total": 120,
    "on_duty": 85,
    "by_specialization": {
      "cardiology": {
        "count": 15,
        "current_load": 45,
        "max_capacity": 150
      }
    }
  },
  "timestamp": "2025-01-29T04:00:00Z"
}
```

---

### Bed Management

#### 39. List Beds
```http
GET /beds?hospitalId=<uuid>&type=icu&status=available
```

**Auth:** Public  
**Description:** Get filtered list of beds

**Query Parameters:**
- `hospitalId` (required, UUID)
- `type` (optional) - One of: `general`, `icu`, `nicu`, `picu`, `emergency`, `isolation`
- `status` (optional) - One of: `available`, `occupied`, `maintenance`, `reserved`

**Response:**
```json
[
  {
    "id": "bed-uuid",
    "hospital_id": "hospital-uuid",
    "bed_number": "ICU-101",
    "type": "icu",
    "status": "available",
    "floor": 2,
    "ward": "ICU-A",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

#### 40. Create Bed
```http
POST /beds
```

**Auth:** requireAuth  
**Description:** Create a new bed

**Request Body:**
```json
{
  "hospital_id": "hospital-uuid",
  "bed_number": "ICU-101",
  "type": "icu",
  "floor": 2,
  "ward": "ICU-A",
  "status": "available"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "bed": {
    "id": "bed-uuid",
    "hospital_id": "hospital-uuid",
    "bed_number": "ICU-101",
    "type": "icu",
    "status": "available",
    "floor": 2,
    "ward": "ICU-A"
  }
}
```

---

#### 41. Update Bed
```http
PATCH /beds/:id
```

**Auth:** requireAuth  
**Description:** Update bed status, floor, or ward

**Request Body:**
```json
{
  "status": "maintenance",
  "floor": 3,
  "ward": "ICU-B"
}
```

**Response:**
```json
{
  "success": true,
  "bed": {...}
}
```

---

#### 42. Delete Bed
```http
DELETE /beds/:id
```

**Auth:** requireAuth  
**Description:** Delete a bed (cannot delete occupied beds)

**Response:**
```json
{
  "success": true,
  "message": "Bed deleted successfully"
}
```

---

### Doctor Management

#### 43. List Doctors
```http
GET /doctors?hospitalId=<uuid>&specialization=cardiology&isOnDuty=true
```

**Auth:** Public  
**Description:** Get filtered list of doctors

**Query Parameters:**
- `hospitalId` (required, UUID)
- `departmentId` (optional, UUID)
- `isOnDuty` (optional) - `true` or `false`
- `specialization` (optional, string)

**Response:**
```json
[
  {
    "id": "doctor-uuid",
    "user_id": "user-uuid",
    "hospital_id": "hospital-uuid",
    "name": "Dr. Smith",
    "specialization": "Cardiology",
    "qualification": "MD, DM Cardiology",
    "department_id": "dept-uuid",
    "is_on_duty": true,
    "is_active": true,
    "current_patient_count": 12,
    "max_patients": 20,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

#### 44. Create Doctor Profile
```http
POST /doctors
```

**Auth:** requireAuth  
**Description:** Create a new doctor profile

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "hospital_id": "hospital-uuid",
  "name": "Dr. Smith",
  "specialization": "Cardiology",
  "qualification": "MD, DM Cardiology",
  "department_id": "dept-uuid",
  "contact_number": "+91-9876543210",
  "email": "dr.smith@hospital.com",
  "is_on_duty": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "doctor": {...}
}
```

---

#### 45. Update Doctor Profile
```http
PATCH /doctors/:id
```

**Auth:** requireAuth  
**Description:** Update doctor profile

**Request Body:**
```json
{
  "specialization": "Interventional Cardiology",
  "is_on_duty": false,
  "contact_number": "+91-9876543211"
}
```

**Response:**
```json
{
  "success": true,
  "doctor": {...}
}
```

---

### Admission Management

#### 46. List Admissions
```http
GET /admissions?hospitalId=<uuid>&active=true
```

**Auth:** Public  
**Description:** Get filtered list of admissions

**Query Parameters:**
- `hospitalId` (required, UUID)
- `active` (optional) - `true` or `false`
- `patientId` (optional, UUID)
- `doctorId` (optional, UUID)

**Response:**
```json
[
  {
    "id": "admission-uuid",
    "patient_id": "patient-uuid",
    "hospital_id": "hospital-uuid",
    "bed_id": "bed-uuid",
    "primary_doctor_id": "doctor-uuid",
    "diagnosis": "Myocardial Infarction",
    "admission_type": "emergency",
    "admitted_at": "2025-01-28T10:00:00Z",
    "discharged_at": null,
    "created_at": "2025-01-28T10:00:00Z"
  }
]
```

---

#### 47. Get Single Admission
```http
GET /admissions/:id
```

**Auth:** Public  
**Description:** Get admission details by ID

---

#### 48. Create Admission
```http
POST /admissions
```

**Auth:** requireAuth  
**Description:** Create a new admission (assigns bed)

**Request Body:**
```json
{
  "patient_id": "patient-uuid",
  "hospital_id": "hospital-uuid",
  "bed_id": "bed-uuid",
  "primary_doctor_id": "doctor-uuid",
  "diagnosis": "Myocardial Infarction",
  "admission_type": "emergency",
  "department_id": "dept-uuid"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "admission": {
    "id": "admission-uuid",
    "patient_id": "patient-uuid",
    "hospital_id": "hospital-uuid",
    "bed_id": "bed-uuid",
    "primary_doctor_id": "doctor-uuid",
    "diagnosis": "Myocardial Infarction",
    "admission_type": "emergency",
    "admitted_at": "2025-01-28T10:00:00Z"
  }
}
```

---

#### 49. Discharge Patient
```http
PATCH /admissions/:id/discharge
```

**Auth:** requireAuth  
**Description:** Discharge a patient (frees up bed)

**Request Body:**
```json
{
  "discharge_summary": "Patient stable, prescribed medications",
  "follow_up_instructions": "Review after 2 weeks",
  "follow_up_date": "2025-02-12"
}
```

**Response:**
```json
{
  "success": true,
  "admission": {
    "id": "admission-uuid",
    "discharged_at": "2025-01-29T10:00:00Z",
    "discharge_summary": "Patient stable, prescribed medications",
    "follow_up_instructions": "Review after 2 weeks",
    "follow_up_date": "2025-02-12"
  }
}
```

---

### ML/AI Predictions

#### 50. Get Model Data for Hospital
```http
GET /ml/model-data/:hospitalId
```

**Auth:** requireAuth  
**Description:** Get all model parameters for ML prediction

**Response:**
```json
{
  "success": true,
  "hospital": {
    "id": "hospital-uuid",
    "name": "Apollo Hospital",
    "city": "Mumbai"
  },
  "model_data": {
    "date": "2025-01-29",
    "day_of_week": 3,
    "month": 1,
    "week_of_year": 5,
    "is_weekend": false,
    "season": "winter",
    "festival_intensity": 0,
    "is_festival": false,
    "temperature": 25.5,
    "humidity": 65,
    "aqi": 150,
    "rainfall": 0,
    "total_beds": 850,
    "icu_beds": 120,
    "doctors_count": 180,
    "nurses_count": 360,
    "hospital_type": "Government",
    "current_bed_demand": 450,
    "lag_1_day": 450,
    "lag_7_day": 450,
    "lag_14_day": 450,
    "rolling_avg_7": 450,
    "rolling_avg_14": 450,
    "rolling_std_7": 0
  },
  "features_count": 26,
  "ready_for_prediction": true,
  "message": "All 26 model parameters available"
}
```

---

#### 51. Get Model Data for All Hospitals
```http
GET /ml/model-data
```

**Auth:** requireAuth  
**Description:** Get model data for all active hospitals (batch prediction)

**Response:**
```json
{
  "success": true,
  "hospitals_count": 15,
  "hospitals": [
    {
      "hospital_id": "hospital-uuid",
      "hospital_name": "Apollo Hospital",
      "has_weather_data": true,
      "total_beds": 850,
      "current_demand": 450,
      "occupancy_rate": 52.9,
      "temperature": 25.5,
      "aqi": 150
    }
  ],
  "ready_for_batch_prediction": true
}
```

---

#### 52. Predict Bed Demand
```http
POST /ml/predict/:hospitalId
```

**Auth:** requireAuth  
**Description:** Predict bed demand for a hospital using ML model

**Response:**
```json
{
  "success": true,
  "hospital": {
    "id": "hospital-uuid",
    "name": "Apollo Hospital",
    "city": "Mumbai",
    "total_beds": 850,
    "current_demand": 450
  },
  "prediction": {
    "predicted_bed_demand": 562,
    "surge_expected": true,
    "surge_percentage": 24.89,
    "confidence": 0.87,
    "prediction_date": "2025-01-29"
  },
  "alert_level": "MEDIUM",
  "recommendation": "Bed surge expected! Increase capacity by 25%"
}
```

---

### File Upload

#### 53. Get Presigned Upload URL
```http
POST /upload/presigned-url
```

**Auth:** requireAuth  
**Description:** Get a presigned URL for uploading files to Supabase Storage

**Request Body:**
```json
{
  "fileName": "prescription.pdf",
  "fileType": "application/pdf"
}
```

**Allowed File Types:**
- `application/pdf`
- `image/jpeg`
- `image/png`
- `image/jpg`
- `text/markdown`

**Response:**
```json
{
  "uploadUrl": "https://storage.supabase.co/...",
  "path": "private/user-uuid/1234567890_prescription.pdf",
  "token": "upload-token-xyz"
}
```

**Usage:**
1. Get presigned URL from this endpoint
2. Upload file to `uploadUrl` using PUT request
3. Store the returned `path` in your database (e.g., in `pdf_url` field)

---

## Data Schemas

### Patient Registration Schema
```typescript
{
  abhaId?: string,           // Format: 1234-5678-9012 (auto-generated if not provided)
  name: string,              // Min 2 chars, max 100
  dob: string,               // Format: YYYY-MM-DD
  gender: "male" | "female" | "other" | "prefer_not_to_say",
  bloodGroup?: string,
  phone?: string,            // Format: +91-9876543210
  emergencyContact?: string, // Format: +91-9876543210
  address: {
    street: string,
    city: string,
    state: string,
    pincode: string          // 6 digits
  }
}
```

### Prescription Schema
```typescript
{
  date: string,              // ISO date string
  doctor_name: string,
  hospital_name?: string,
  medications: [
    {
      name: string,
      dosage: string,
      frequency?: string,
      duration?: string,
      notes?: string
    }
  ],
  diagnosis?: string,
  pdf_url?: string           // URL to PDF file
}
```

### Test Report Schema
```typescript
{
  test_name: string,
  date: string,
  lab_name?: string,
  doctor_name?: string,
  pdf_url?: string,
  parsed_results?: Record<string, any>,
  notes?: string
}
```

### Medical History Schema
```typescript
{
  date: string,
  condition: string,
  treatment?: string,
  notes?: string,
  doctor_name?: string,
  hospital_name?: string
}
```

### IoT Log Schema
```typescript
{
  device_type: "heart_rate" | "glucose" | "blood_pressure" | "spo2" | "temperature",
  device_id: string,
  value: number,
  unit: string,
  context?: string
}
```

### Consent Scopes
```typescript
type ConsentScope = 
  | "profile"           // Basic patient profile
  | "medical_history"   // Medical history records
  | "prescriptions"     // Prescription data
  | "test_reports"      // Lab test results
  | "iot_devices"       // IoT device logs
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message description"
}
```

### Validation Error Format (400)
```json
{
  "error": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting & Security

### Security Headers

The API uses Helmet.js to set secure HTTP headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`

### CORS Configuration

```javascript
{
  origin: '*',  // Allows all origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

### Token Expiry

- **Access Tokens**: Expire based on Supabase configuration (typically 1 hour)
- **Refresh Tokens**: Used to get new access tokens
- **Consent Tokens**: Expire after 7 or 14 days (configurable)

### Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (e.g., httpOnly cookies, secure storage)
3. **Refresh tokens** before expiry
4. **Revoke consent** when no longer needed
5. **Validate input** on client-side before sending
6. **Handle errors** gracefully
7. **Log security events** for audit trails

---

## Quick Start Examples

### Example 1: Patient Registration and Login

```bash
# 1. Register a new patient
curl -X POST https://api.example.com/auth/patient/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "dob": "1990-01-15",
    "gender": "male",
    "bloodGroup": "O+",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  }'

# 2. Login to get access token
curl -X POST https://api.example.com/auth/patient/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123!"
  }'

# Save the access_token from response
```

### Example 2: Grant Consent and Access EHR

```bash
# 1. Patient grants consent
curl -X POST https://api.example.com/consent/grant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <patient_access_token>" \
  -d '{
    "patientId": "patient-uuid",
    "recipientId": "doctor-uuid",
    "recipientHospitalId": "hospital-uuid",
    "scope": ["profile", "prescriptions", "test_reports"],
    "durationDays": 14
  }'

# Save the consentToken from response

# 2. Doctor accesses patient EHR with consent
curl -X GET https://api.example.com/ehr/patient/patient-uuid/prescriptions \
  -H "X-Consent-Token: <consent_token>"
```

### Example 3: Hospital Dashboard

 
## Support & Contact

For API support, documentation updates, or bug reports:
- **GitHub Issues**: [Repository Issues](https://github.com/your-repo/issues)
- **Email**: support@samruddhi.health
- **Documentation**: [Full Documentation](https://docs.samruddhi.health)

---

**Last Updated:** 2025-11-29  
**API Version:** 1.0  
**Documentation Version:** 1.0.0
