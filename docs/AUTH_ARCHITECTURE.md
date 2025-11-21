# Auth Architecture & Patient Flow Update

**Date:** November 21, 2024  
**Status:** ✅ Updated for email-based authentication

---

## 🔐 Current Authentication Architecture

### **Single Supabase Auth Instance**

Both patients and hospital staff use **Supabase Auth** with email/password:

```javascript
// Patient Signup
supabase.auth.signUp({
  email: "patient@example.com",
  password: "secure123",
  options: {
    data: { role: "patient" }
  }
})

// Staff Signup  
supabase.auth.signUp({
  email: "doctor@hospital.com",
  password: "secure123",
  options: {
    data: {
      role: "doctor",
      hospital_id: "hospital-uuid"
    }
  }
})
```

**JWT Claims Include:**
- `sub` (user_id from Supabase)
- `email`
- `role` (patient, doctor, nurse, admin)
- `hospital_id` (for staff only)
- `patient_id` (for patients only - after registration)

---

## 📝 Patient Registration Flow (Email-Based)

### **Step 1: Supabase Auth Signup**
```javascript
// Frontend (Mobile/Web)
const { data, error } = await supabase.auth.signUp({
  email: "rajesh@example.com",
  password: "Secure123!",
  options: {
    data: { role: "patient" }
  }
});

// Supabase creates user → user_id: "abc-123-def"
```

### **Step 2: Patient Registration in Backend**
```javascript
// After Supabase signup, register patient details
POST /patients/register
Authorization: Bearer <SUPABASE_JWT>

Body:
{
  // OPTIONAL - auto-generated if not provided
  "abhaId": "1234-5678-9012",  
  
  // REQUIRED
  "name": "Rajesh Kumar",
  "dob": "1980-01-15",
  "gender": "male",
  "address": {
    "street": "123 MG Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  
  // OPTIONAL
  "bloodGroup": "A+",
  "phone": "+91-9876543210",
  "emergencyContact": "+91-9123456789"
}

Response:
{
  "success": true,
  "patient": {
    "id": "patient-uuid",
    "abhaId": "AUTO-12345678-9876",  // Auto-generated
    "email": "rajesh@example.com",   // From Supabase JWT
    "name": "Rajesh Kumar",
    "createdAt": "2024-11-21T06:00:00Z"
  },
  "ehrCreated": true
}
```

**What Happens:**
1. ✅ Backend extracts `user_id` and `email` from Supabase JWT
2. ✅ Auto-generates ABHA ID if not provided: `AUTO-{timestamp}-{random}`
3. ✅ Creates patient record in Postgres (`patients` table)
   - Links to Supabase user via `ehr_id` column
4. ✅ Creates EHR document in MongoDB with email, name, address
5. ✅ Returns patient ID and auto-generated ABHA ID

---

## 🆔 ABHA ID Behavior

### **Auto-Generated ABHA IDs**
Format: `AUTO-{timestamp}-{random}`  
Example: `AUTO-12345678-9876`

**Why:**
- ✅ No ABHA integration available yet
- ✅ Provides unique identifier for patients
- ✅ Can be replaced with real ABHA ID later

### **Provided ABHA IDs**
If user has real ABHA ID (future integration):
```json
{
  "abhaId": "1234-5678-9012",  // Real ABHA from govt
  "name": "Rajesh Kumar",
  ...
}
```

Backend validates uniqueness and stores it.

---

## 🔍 Patient Search

### **Search by ABHA ID**
```bash
GET /patients/search?abha_id=AUTO-12345678-9876

Response:
{
  "found": true,
  "patient": {
    "id": "patient-uuid",
    "abhaId": "AUTO-12345678-9876",
    "name": "Rajesh Kumar",
    ...
  }
}
```

### **Search by Email** (NEW)
```bash
GET /patients/search?email=rajesh@example.com

Response:
{
  "found": true,
  "patient": {
    "id": "patient-uuid",
    "abhaId": "AUTO-12345678-9876",
    "name": "Rajesh Kumar",
    ...
  }
}
```

**How it works:**
1. Backend searches MongoDB EHR collection for email
2. Gets `patient_id` from EHR record
3. Fetches patient details from Postgres

---

## 🏥 Hospital Staff Flow

### **Staff Signup**
```javascript
// Admin creates staff account
POST /auth/register/staff  // (To be built in future)

Body:
{
  "email": "dr.priya@apollo.com",
  "password": "Secure123!",
  "role": "doctor",
  "hospitalId": "hospital-uuid",
  "name": "Dr. Priya Sharma"
}
```

**JWT Claims:**
```json
{
  "sub": "staff-user-id",
  "email": "dr.priya@apollo.com",
  "role": "doctor",
  "hospital_id": "hospital-uuid",
  "aud": "authenticated"
}
```

---

## 🏃 Complete User Journey

### **Patient Side:**

1. **Signup** → Supabase Auth with email/password
2. **Register** → `POST /patients/register` with JWT
   - Backend extracts email from JWT
   - Auto-generates ABHA ID
   - Creates Postgres + MongoDB records
3. **Login** → Supabase Auth login → get JWT
4. **Use App** → JWT proves identity for all API calls

### **Hospital Side:**

1. **Signup** → Supabase Auth with email/password + hospital_id
2. **Login** → Supabase Auth login → get JWT with `hospital_id`
3. **Search Patient** → `GET /patients/search?email=X`
4. **Request Consent** → (To be built in TASK 4)
5. **Access EHR** → With patient's consent token

---

## 🚀 Next Steps: TASK 2 - Patient Self-Service EHR

Now that auth is clear:

### **Problem to Solve:**
Patients currently cannot view/add to their OWN medical records without consent (bug!)

### **Solution:**
Create `/ehr/my/*` routes that:
- Use `requirePatientAuth` middleware (NOT requireConsent)
- Extract `patient_id` from JWT
- Return patient's own EHR data
- No consent needed (it's their data!)

**New Endpoints:**
- `GET /ehr/my` - View complete EHR
- `GET /ehr/my/prescriptions` - View own prescriptions
- `POST /ehr/my/prescription` - Add old prescription
- And 6 more...

---

**Authentication Stack:**
- ✅ Supabase Auth (email/password)
- ✅ Custom JWT claims (role, hospital_id, patient_id)
- ✅ Optional ABHA ID (auto-generated or provided)
- ✅ Email as primary identifier

**Ready for TASK 2! 🎯**
