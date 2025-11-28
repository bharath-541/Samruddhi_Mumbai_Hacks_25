# Samruddhi Backend - Complete User Flow Summary

**Last Updated:** November 29, 2025  
**Production URL:** https://samruddhi-backend.onrender.com

---

## 🎯 Overview

The Samruddhi backend provides a complete hospital bed management system with patient EHR (Electronic Health Records) stored in MongoDB. The system supports patient registration, hospital bed availability checking, prescription management, and IoT device data logging.

---

## 📊 Database Architecture

### PostgreSQL (Supabase)

- **hospitals** - Hospital master data
- **departments** - Hospital departments
- **doctors** - Doctor information
- **beds** - Bed inventory and status
- **patients** - Patient metadata (links to MongoDB EHR)
- **admissions** - Patient admission records
- **consent_requests** - Consent workflow
- **audit_logs** - Audit trail

### MongoDB

- **ehr_records** - One document per patient containing:
  - `patient_id` - Links to PostgreSQL
  - `profile` - Patient profile info
  - **`prescriptions[]`** - Array of prescription objects
  - `medical_history[]` - Medical history entries
  - `test_reports[]` - Lab reports
  - `iot_devices[]` - IoT device logs (fitness bands, glucose monitors, etc.)

### Redis

- Consent tokens
- Session management

---

## 🔄 Complete User Flow

### 1️⃣ Patient Registration (No JWT Required)

**Endpoint:** `POST /auth/register`

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

**What Happens:**

1. Creates Supabase auth user
2. Creates patient record in PostgreSQL `patients` table
3. Creates EHR document in MongoDB `ehr_records` collection
4. Returns JWT token for subsequent requests

---

### 2️⃣ Patient Views Own Profile

**Endpoint:** `GET /ehr/my/profile`  
**Auth Required:** Yes (Patient JWT token)

```bash
curl https://samruddhi-backend.onrender.com/ehr/my/profile \
  -H "Authorization: Bearer <patient_token>"
```

**Returns:**

- Patient ID
- Profile information from MongoDB EHR document

---

### 3️⃣ Patient Checks Hospital Availability

**Endpoint:** `GET /hospitals`  
**Auth Required:** No (Public)

```bash
curl https://samruddhi-backend.onrender.com/hospitals
```

**Returns:** List of all hospitals with:

- Name, type, tier
- Total beds, ICU beds
- Occupied beds, available beds
- Contact information

**Endpoint:** `GET /hospitals/:id/capacity`  
**Auth Required:** No (Public)

```bash
curl https://samruddhi-backend.onrender.com/hospitals/<hospital-id>/capacity
```

**Returns:**

- Total beds: 1800
- Occupied beds: 1650
- Available beds: 150
- **bedOccupancy: 92%** ← NEW FIELD

---

### 4️⃣ Patient Views Own Prescriptions (MongoDB)

**Endpoint:** `GET /ehr/my/prescriptions`  
**Auth Required:** Yes (Patient JWT token)

```bash
curl https://samruddhi-backend.onrender.com/ehr/my/prescriptions \
  -H "Authorization: Bearer <patient_token>"
```

**Returns:** Array of prescriptions from MongoDB `ehr.prescriptions[]`

**Prescription Object:**

```json
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
```

---

### 5️⃣ Patient Adds Old Prescription (Self-Service)

**Endpoint:** `POST /ehr/my/prescription`  
**Auth Required:** Yes (Patient JWT token)

```bash
curl -X POST https://samruddhi-backend.onrender.com/ehr/my/prescription \
  -H "Authorization: Bearer <patient_token>" \
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

**What Happens:**

- MongoDB `$push` operation adds prescription to `ehr.prescriptions[]` array
- Marked as `added_by: 'patient'`

---

### 6️⃣ Doctor Login

**Endpoint:** `POST /auth/login`  
**Auth Required:** No (Public endpoint)

```bash
curl -X POST https://samruddhi-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rajesh.kumar@kem.edu",
    "password": "Doctor@123"
  }'
```

**Returns:** JWT token for doctor

---

### 7️⃣ Doctor Adds Prescription to Patient EHR

**Endpoint:** `POST /ehr/patient/:id/prescription`  
**Auth Required:** Yes (Doctor JWT token)

```bash
curl -X POST https://samruddhi-backend.onrender.com/ehr/patient/<patient-id>/prescription \
  -H "Authorization: Bearer <doctor_token>" \
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

**What Happens:**

- MongoDB `$push` operation adds prescription to patient's `ehr.prescriptions[]`
- Marked as `added_by: 'doctor'`

---

### 8️⃣ Patient Logs IoT Device Data

**Endpoint:** `POST /ehr/my/iot/:deviceType`  
**Auth Required:** Yes (Patient JWT token)

**Device Types:** `fitness_band`, `glucose_monitor`, `bp_monitor`, `pulse_oximeter`

```bash
curl -X POST https://samruddhi-backend.onrender.com/ehr/my/iot/fitness_band \
  -H "Authorization: Bearer <patient_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "fitband-001",
    "timestamp": "2025-11-29T08:00:00.000Z",
    "data": {
      "heart_rate": 75,
      "steps": 8432,
      "calories": 342,
      "sleep_hours": 7.5
    }
  }'
```

**What Happens:**

- Finds or creates device entry in `ehr.iot_devices[]`
- Appends log to device's `logs[]` array

---

## ✅ Key Questions Answered

### Q: Is there a patient-wise document in MongoDB?

**A: YES!**

Each patient has **ONE document** in the `ehr_records` collection with structure:

```javascript
{
  patient_id: "uuid",
  profile: {...},
  prescriptions: [...],  // ← Prescriptions stored here
  medical_history: [...],
  test_reports: [...],
  iot_devices: [...]
}
```

### Q: Where are prescriptions getting stored given by doctors?

**A:** In MongoDB `ehr_records` collection, inside the patient's document at `prescriptions[]` array.

**Two ways prescriptions are added:**

1. **Doctor adds:** `POST /ehr/patient/:id/prescription` → marked as `added_by: 'doctor'`
2. **Patient adds:** `POST /ehr/my/prescription` → marked as `added_by: 'patient'`

Both use MongoDB `$push` operation to append to the same `prescriptions[]` array.

### Q: Is there an endpoint for prescriptions?

**A: YES! Multiple endpoints:**

**For Patients (self-service):**

- `GET /ehr/my/prescriptions` - View own prescriptions
- `POST /ehr/my/prescription` - Add old prescription from another hospital

**For Doctors (with auth):**

- `POST /ehr/patient/:id/prescription` - Add prescription to patient
- `GET /ehr/patient/:id/prescriptions` - View patient prescriptions (with consent)

---

## 🗄️ Current Production Data

After running clean seed script:

### Hospitals (5 total)

1. **King Edward Memorial (KEM) Hospital** - Government, 1800 beds, 200 ICU
2. **Lokmanya Tilak Municipal General Hospital (Sion)** - Government, 1400 beds, 150 ICU
3. **Lilavati Hospital & Research Centre** - Private, 323 beds, 65 ICU
4. **Hinduja Hospital** - Private, 450 beds, 85 ICU
5. **Breach Candy Hospital** - Private, 225 beds, 45 ICU

### Other Data

- **Departments:** 19 (Cardiology, Neurology, Emergency, ICU, etc.)
- **Doctors:** 9 (distributed across hospitals)
- **Beds:** 200 seeded (60, 50, 30, 40, 20 per hospital)
- **Patients:** 10 test patients

---

## 🔧 What Changed (vs Original Design)

### ✅ New Public Auth Endpoints

- `POST /auth/register` - No JWT required for signup
- `POST /auth/login` - Get JWT token
- **Before:** Required two-step (Supabase signup → backend registration)
- **After:** Single-step registration

### ✅ Patient Self-Service EHR

- `GET /ehr/my/profile` - View own profile
- `GET /ehr/my/prescriptions` - View own prescriptions
- `POST /ehr/my/prescription` - Add old prescriptions
- `GET /ehr/my/medical-history` - View medical history
- `POST /ehr/my/iot/:deviceType` - Log IoT data

### ✅ Bed Occupancy Percentage

- Added `bedOccupancy` field to:
  - `GET /hospitals/:id/capacity`
  - `GET /hospitals/:id/dashboard`
- Calculated as: `(occupied_beds / total_beds) * 100`

### ✅ Clean Hospital Data

- Removed duplicate hospitals (was 8, now 6)
- Added proper bed counts (no more null values)
- Real Mumbai hospitals with accurate data

---

## 🧪 Testing

Run the complete user flow test:

```bash
node scripts/test_complete_user_flow.js
```

This tests:

1. Patient registration
2. Profile viewing
3. Hospital list and capacity
4. Doctor login
5. Prescription management
6. IoT device logging
7. Consent flow

---

## 📞 Production Status

**URL:** https://samruddhi-backend.onrender.com

**Health Check:** https://samruddhi-backend.onrender.com/health/live

**Deployment:** Automatic via GitHub push to `main` branch

**Build Time:** ~5-10 minutes after push

---

## 📚 Documentation

- **API Endpoints:** `API_ENDPOINTS.md`
- **User Flow:** This file (`USER_FLOW_SUMMARY.md`)
- **Architecture:** `ARCHITECTURE_FLOW.md`
- **Production Status:** `PRODUCTION_STATUS.md`

---

_This document provides a complete overview of the user flow with emphasis on prescription storage and MongoDB document structure._
