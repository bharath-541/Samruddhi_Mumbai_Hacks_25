# Critical Issues Found in Samruddhi Backend

## 🚨 **ISSUE #1: Patient EHR Endpoints Failing (CRITICAL)**

### **Problem**
All `/ehr/my/*` endpoints are returning `{"error": "Patient access required"}` even with valid JWT tokens.

### **Root Cause**
The `/auth/patient/signup` endpoint (lines 267-394) **does NOT update Supabase user metadata** with `patient_id`. 

The EHR endpoints check for `user?.patientId` (line 1469):
```typescript
if (!user?.patientId) {
  return res.status(403).json({ error: 'Patient access required' });
}
```

But the JWT token doesn't contain `patient_id` in metadata because signup doesn't set it!

### **Fix Required**
Add this code after creating the patient record in `/auth/patient/signup` (after line 343):

```typescript
// Step 4: Update Supabase Auth user metadata with patient_id
const { error: metadataError } = await supabase.auth.admin.updateUserById(
  userId,
  {
    user_metadata: {
      patient_id: patient.id,
      role: 'patient',
      abha_id: finalAbhaId
    }
  }
);

if (metadataError) {
  req.log.warn({ err: metadataError }, 'Failed to update user metadata (non-critical)');
}
```

### **Impact**
- ✅ After fix: All patient self-service endpoints will work
- ✅ Patients can add/view their EHR data
- ✅ File upload → prescription flow will work end-to-end

---

## 🔍 **ISSUE #2: MongoDB/PostgreSQL Connection Issues (PRODUCTION)**

### **Problem**
New patient registrations failing with `"Patient registration failed"` error.

### **Root Cause**
Production environment (Render) cannot connect to MongoDB or PostgreSQL during patient record creation.

### **Evidence**
- Supabase Auth user creation succeeds (no error at line 305)
- Patient record creation in PostgreSQL OR MongoDB EHR creation fails (line 339 or 350)
- Error falls through to generic "Patient registration failed" (line 342)

### **Fix Required**
Check Render environment variables:

1. **Go to Render Dashboard** → samruddhi-backend → Environment
2. **Verify these variables exist:**
   - `MONGODB_URI` - MongoDB connection string
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE` or `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` - For consent tokens

3. **Check Render Logs** for specific errors:
   ```bash
   # In Render dashboard → Logs tab
   # Look for:
   # - "MongoDB connection failed"  
   # - "Patient insert failed"
   # - "EHR creation failed"
   ```

### **Temporary Workaround**
Use existing working patient account for testing:
- Email: `demouser1234@example.com`
- Password: `DemoPass123!`
- Patient ID: `f0f1a779-045c-49d8-9cd6-19dbb1e020f0`

---

## ✅ **VERIFIED WORKING**

### **File Upload Flow** ✅
1. `/upload/presigned-url` - ✅ Working
2. Upload to Supabase Storage - ✅ Working
3. File path returned correctly - ✅ Working

**Test Results:**
```json
{
  "uploadUrl": "https://bbgyfxgdyevciaggalmn.supabase.co/storage/...",
  "path": "private/35ebee6d-efcf-4be7-a7bc-4ae28d790172/1764381052694_test_prescription.pdf"
}
```

File uploaded successfully to Supabase Storage (HTTP 200).

---

## 📊 **MongoDB Prescription Storage Structure**

### **Current Implementation (CORRECT)**
Prescriptions are stored as an **array** in MongoDB, NOT as "prescription1, prescription2":

```json
{
  "patient_id": "uuid",
  "abha_id": "AUTO-123",
  "prescriptions": [
    {
      "date": "2025-11-29",
      "doctor_name": "Dr. Smith",
      "medications": [...],
      "pdf_url": "private/user-id/...",
      "added_by": "patient",
      "added_at": "2025-11-29T..."
    },
    {
      "date": "2025-11-28",
      "doctor_name": "Dr. Kumar",
      ...
    }
  ],
  "test_reports": [],
  "medical_history": [],
  "iot_data": {...}
}
```

### **How It Works**
- Line 1485: `$push: { prescriptions: { ...parsed.data, added_by: 'patient', added_at: new Date() } }`
- MongoDB automatically appends to the array
- Each prescription is a separate object in the array
- Frontend receives all prescriptions as an array when calling `/ehr/my/prescriptions`

---

## 🏥 **Doctor-Side API Issues**

### **Issue: Doctor Cannot Add Prescriptions**
Doctor endpoints require `requireHospitalStaff` middleware (line 1640).

**Endpoint:**
```typescript
POST /ehr/patient/:id/prescription
Headers: Authorization: Bearer <doctor_token>
```

**Requirements:**
1. Doctor must have `hospitalId` in their JWT token metadata
2. Token must be from a hospital staff account (not patient)

**Current Issues:**
- No doctor registration flow in the API
- No way for doctors to get JWT tokens with `hospitalId`
- Missing `/auth/doctor/signup` and `/auth/doctor/login` endpoints

**Needed for Doctors:**
- Doctor signup/login endpoints
- Update Supabase user metadata with `hospital_id` and `doctor_id`
- Or use `/doctors` POST endpoint to create doctor profiles manually

---

## 🩺 **EHR Access API Issues**

### **Patient Self-Service** ❌ BROKEN
All these endpoints fail due to Issue #1:
- `GET /ehr/my` - Get complete EHR
- `GET /ehr/my/prescriptions`
- `GET /ehr/my/test-reports`
- `GET /ehr/my/medical-history`
- `GET /ehr/my/iot/:deviceType`
- `POST /ehr/my/prescription` - Add prescription
- `POST /ehr/my/test-report`
- `POST /ehr/my/medical-history`
- `POST /ehr/my/iot-log`

**All fail with:** `{"error": "Patient access required"}`

**Fix:** Apply Issue #1 fix above

---

### **Hospital/Doctor EHR Access (With Consent)** ⚠️ UNTESTED
These endpoints require consent tokens:
- `GET /ehr/patient/:id`
- `GET /ehr/patient/:id/prescriptions`
- `GET /ehr/patient/:id/test-reports`
- `GET /ehr/patient/:id/medical-history`
- `GET /ehr/patient/:id/iot/:deviceType`

**Cannot test without:**
1. Working patient accounts (Issue #1)
2. Consent tokens (requires working patient)
3. Doctor accounts

---

## 🔧 **Immediate Action Items**

### **Priority 1 - Critical (Blocks Frontend)**
1. ✅ **Fix Issue #1** - Update `/auth/patient/signup` to set `patient_id` in user metadata
2. ⚠️ **Fix Issue #2** - Check Render environment variables and database connections

### **Priority 2 - High (Needed for Full Flow)**
3. Create `/auth/doctor/signup` and `/auth/doctor/login` endpoints
4. Add `hospital_id` to doctor JWT metadata
5. Test consent flow end-to-end

### **Priority 3 - Nice to Have**
6. Improve error messages (don't use generic "Patient registration failed")
7. Add better logging for debugging production issues
8. Add health check for MongoDB connection

---

## 📝 **Summary**

| Component | Status | Issue |
|-----------|--------|-------|
| Patient Signup | ⚠️ Partial | Works but doesn't set metadata |
| Patient Login | ✅ Working | Returns JWT token |
| File Upload | ✅ Working | All 3 steps tested successfully |
| Patient EHR Self-Service | ❌ Broken | Missing `patient_id` in JWT |
| Doctor APIs | ❌ Not Implemented | No doctor auth flow |
| Consent Flow | ⚠️ Untested | Blocked by above issues |
| Hospital Management | ✅ Working | Public endpoints work |

---

## 🎯 **Next Steps**

1. **Apply Fix for Issue #1** (15 minutes)
2. **Check Render Environment** (10 minutes)
3. **Test Patient EHR Endpoints** (20 minutes)
4. **Implement Doctor Auth** (2-3 hours)
5. **Test Consent Flow** (1 hour)

**Total Time to Full Working State:** ~4-5 hours

---

**Created:** 2025-11-29T07:25:00+05:30  
**Status:** URGENT - Patient EHR endpoints are completely broken in production
