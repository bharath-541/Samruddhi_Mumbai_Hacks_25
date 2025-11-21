# TASK 1: Patient Registration & Profile Management

**Priority:** 🔴 CRITICAL (Foundation)  
**Effort:** 4 hours  
**Dependencies:** None  
**Status:** 📋 Planned

---

## 📝 Overview

Enable patients to register in the system and manage their profiles. This creates the link between Supabase Auth users and the hospital system's patient records.

**Problem:** Currently, Supabase Auth has users, but there's no `patients` table in Postgres linking auth users to medical records.

**Solution:** Create patient registration flow and profile management endpoints.

---

## 🎯 Goals

1. Patient can register with ABHA ID after Supabase Auth signup
2. Link Supabase Auth user → Postgres `patients` table → MongoDB EHR
3. Hospital staff can search for patients by ABHA ID
4. Patients can update their own profile information

---

## 📊 Database Schema

### Postgres: `patients` Table

Already exists in schema (from migration), needs population:

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),  -- Link to Supabase Auth
  abha_id TEXT UNIQUE NOT NULL,
  name_encrypted BYTEA,  -- For now, store as TEXT (encryption later)
  dob_encrypted BYTEA,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_group TEXT,
  phone_encrypted BYTEA,
  emergency_contact_encrypted BYTEA,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_abha_id ON patients(abha_id);
CREATE INDEX idx_patients_user_id ON patients(user_id);
```

**Note:** For MVP, we'll store name/phone as plain text, add encryption in Phase 2.

### MongoDB: `ehr_records` Collection

Initial EHR document created on registration:

```javascript
{
  _id: ObjectId(),
  patient_id: "uuid",  // Matches Postgres patients.id
  abha_id: "1234-5678-9012",
  profile: {
    name: "Rajesh Kumar",
    dob: "1980-01-15",
    blood_group: "A+",
    phone: "+91-9876543210",
    address: {
      street: "123 MG Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001"
    }
  },
  prescriptions: [],
  test_reports: [],
  medical_history: [],
  iot_devices: [],
  created_at: ISODate(),
  updated_at: ISODate()
}
```

---

## 🔌 API Endpoints

### 1. POST /patients/register

**Description:** Register new patient (called after Supabase Auth signup)

**Authentication:** Required (Patient JWT from Supabase)

**Request:**
```json
{
  "abhaId": "1234-5678-9012",
  "name": "Rajesh Kumar",
  "dob": "1980-01-15",
  "gender": "male",
  "bloodGroup": "A+",
  "phone": "+91-9876543210",
  "emergencyContact": "+91-9123456789",
  "address": {
    "street": "123 MG Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

**Validation (Zod Schema):**
```typescript
const PatientRegistrationSchema = z.object({
  abhaId: z.string().regex(/^\d{4}-\d{4}-\d{4}$/),
  name: z.string().min(2).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  bloodGroup: z.string().optional(),
  phone: z.string().regex(/^\+91-\d{10}$/),
  emergencyContact: z.string().regex(/^\+91-\d{10}$/),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string().regex(/^\d{6}$/)
  })
});
```

**Response (201 Created):**
```json
{
  "success": true,
  "patient": {
    "id": "uuid",
    "userId": "supabase-user-uuid",
    "abhaId": "1234-5678-9012",
    "name": "Rajesh Kumar",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "ehrCreated": true
}
```

**Error Responses:**
- `400` - Validation failed
- `409` - ABHA ID already registered
- `401` - Not authenticated
- `500` - Server error

**Implementation Steps:**
1. Validate request body with Zod
2. Extract `userId` from JWT (`req.user.id`)
3. Check if patient already exists (`SELECT * FROM patients WHERE user_id = $1`)
4. If exists, return 409 Conflict
5. Insert into `patients` table
6. Create initial EHR document in MongoDB
7. Return patient record

---

### 2. GET /patients/:id

**Description:** Get patient basic information

**Authentication:** Required (Any authenticated user)

**Path Parameters:**
- `id` - Patient UUID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "abhaId": "1234-5678-9012",
  "name": "Rajesh Kumar",
  "gender": "male",
  "bloodGroup": "A+",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Notes:**
- Returns only public info (no phone/emergency contact)
- Used by hospital staff during check-in
- No PII beyond name and blood group

---

### 3. PATCH /patients/:id/profile

**Description:** Update patient profile

**Authentication:** Required (Patient JWT only)

**Authorization:** Patient can only update their own profile

**Request:**
```json
{
  "phone": "+91-9999999999",
  "emergencyContact": "+91-8888888888",
  "address": {
    "street": "456 New Address",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated",
  "updatedFields": ["phone", "address"]
}
```

**Validation:**
- Verify `req.params.id === req.user.patient_id` (patient updating own profile)
- Cannot update: ABHA ID, name, DOB, gender (require verification)

---

### 4. GET /patients/search

**Description:** Search for patient by ABHA ID

**Authentication:** Required (Hospital staff only)

**Query Parameters:**
- `abha_id` - ABHA ID to search (required)

**Example:**
```
GET /patients/search?abha_id=1234-5678-9012
```

**Response (200 OK):**
```json
{
  "found": true,
  "patient": {
    "id": "uuid",
    "abhaId": "1234-5678-9012",
    "name": "Rajesh Kumar",
    "gender": "male",
    "bloodGroup": "A+",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "found": false,
  "message": "No patient found with this ABHA ID"
}
```

**Use Cases:**
- Emergency admission (search for existing patient)
- Check-in at reception
- Verify patient identity

---

## 🛡️ Middleware

### New: `requirePatientAuth`

**Purpose:** Validate patient is accessing their own records

**File:** `src/middleware/auth.ts`

**Implementation:**
```typescript
export const requirePatientAuth = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Validate Supabase JWT (reuse existing requireAuth)
  const authResult = await requireAuth(req, res, () => {});
  if (!authResult) return; // Already sent 401
  
  // 2. Verify user has patient_id claim
  const user = (req as any).user;
  if (!user.patient_id) {
    return res.status(403).json({ error: 'Patient access required' });
  }
  
  // 3. For routes with :id param, verify it matches patient_id
  if (req.params.id && req.params.id !== user.patient_id) {
    return res.status(403).json({ error: 'Cannot access other patient records' });
  }
  
  next();
};
```

**Usage:**
```typescript
app.get('/patients/:id/profile', requirePatientAuth, async (req, res) => {
  // req.user.patient_id === req.params.id guaranteed
});
```

---

## 🧪 Testing

### Test Cases

**1. Register New Patient (Happy Path)**
```bash
# Assumes patient already signed up via Supabase Auth
curl -X POST http://localhost:3000/patients/register \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "abhaId": "1234-5678-9012",
    "name": "Rajesh Kumar",
    "dob": "1980-01-15",
    "gender": "male",
    "bloodGroup": "A+",
    "phone": "+91-9876543210",
    "emergencyContact": "+91-9123456789",
    "address": {
      "street": "123 MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  }'

# Expected: 201 Created with patient record
```

**2. Search Patient by ABHA ID**
```bash
curl "http://localhost:3000/patients/search?abha_id=1234-5678-9012" \
  -H "Authorization: Bearer $STAFF_JWT"

# Expected: 200 OK with patient info
```

**3. Patient Updates Own Profile**
```bash
curl -X PATCH http://localhost:3000/patients/$PATIENT_ID/profile \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+91-9999999999"}'

# Expected: 200 OK
```

**4. Duplicate ABHA ID (Error Case)**
```bash
# Try to register same ABHA ID twice
curl -X POST http://localhost:3000/patients/register \
  -H "Authorization: Bearer $ANOTHER_PATIENT_JWT" \
  -d '{"abhaId": "1234-5678-9012", ...}'

# Expected: 409 Conflict - "ABHA ID already registered"
```

**5. Patient Tries to Update Another Patient (Security Test)**
```bash
curl -X PATCH http://localhost:3000/patients/$OTHER_PATIENT_ID/profile \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -d '{"phone": "..."}'

# Expected: 403 Forbidden - "Cannot access other patient records"
```

---

## 📦 Seed Data

### File: `scripts/seed_patients.js`

Create 10 test patients:

```javascript
const patients = [
  {
    abhaId: '1111-1111-1111',
    name: 'Rajesh Kumar',
    dob: '1980-01-15',
    gender: 'male',
    bloodGroup: 'A+',
    phone: '+91-9876543210',
    emergencyContact: '+91-9123456789'
  },
  {
    abhaId: '2222-2222-2222',
    name: 'Priya Sharma',
    dob: '1985-05-20',
    gender: 'female',
    bloodGroup: 'B+',
    phone: '+91-9876543211',
    emergencyContact: '+91-9123456788'
  },
  // ... 8 more
];

// For each:
// 1. Create Supabase Auth user (if not exists)
// 2. Insert into patients table
// 3. Create MongoDB EHR document
```

---

## 🔗 Dependencies & Integration

**Before This Task:**
- ✅ Supabase Auth working
- ✅ Postgres `patients` table exists (from migrations)
- ✅ MongoDB connection working

**After This Task:**
- ✅ Patients can register
- ✅ Link: Supabase Auth ↔ Postgres ↔ MongoDB
- ✅ Hospital can search for patients
- ✅ Foundation for Task 2 (Patient self-service)

**Blocks:**
- Task 2 (Patient Self-Service) - Needs patient records
- Task 4 (Consent Requests) - Needs patient lookup

---

## ✅ Acceptance Criteria

- [ ] Patient can register with valid ABHA ID
- [ ] Registration creates records in both Postgres and MongoDB
- [ ] Duplicate ABHA ID returns 409 error
- [ ] Patient can view their own profile
- [ ] Patient can update phone/address (but not ABHA/name)
- [ ] Hospital staff can search patient by ABHA ID
- [ ] Search returns 404 for non-existent ABHA ID
- [ ] Patient cannot update another patient's profile
- [ ] 10 test patients seeded successfully
- [ ] All endpoints documented in API_ENDPOINTS.md

---

## 🚀 Implementation Checklist

### Step 1: Add Zod Schemas (15 min)
- [ ] Add `PatientRegistrationSchema` to `src/server.ts`
- [ ] Add `PatientUpdateSchema`

### Step 2: Add Middleware (20 min)
- [ ] Create `requirePatientAuth` in `src/middleware/auth.ts`
- [ ] Test with dummy endpoint

### Step 3: Add Registration Endpoint (45 min)
- [ ] `POST /patients/register`
- [ ] Postgres insert logic
- [ ] MongoDB EHR creation
- [ ] Error handling (duplicate ABHA ID)

### Step 4: Add Profile Endpoints (30 min)
- [ ] `GET /patients/:id`
- [ ] `PATCH /patients/:id/profile`
- [ ] Ownership validation

### Step 5: Add Search Endpoint (20 min)
- [ ] `GET /patients/search?abha_id=X`
- [ ] Query Postgres by ABHA ID

### Step 6: Create Seed Script (40 min)
- [ ] `scripts/seed_patients.js`
- [ ] Create 10 test patients
- [ ] Verify in both Postgres and MongoDB

### Step 7: Testing (30 min)
- [ ] Manual test all 5 test cases
- [ ] Update `scripts/test_endpoints.js`

### Step 8: Documentation (20 min)
- [ ] Update `API_ENDPOINTS.md`
- [ ] Add examples

**Total Estimated Time:** 4 hours

---

## 📝 Notes

**ABHA Integration (Future):**
- Currently accepting any ABHA format
- In production, validate against ABDM API
- Fetch patient details from ABHA registry

**Encryption (Phase 2):**
- Name, phone, emergency contact should be encrypted at rest
- Use Postgres `pgcrypto` extension
- For MVP, plain text is acceptable

**Profile Photo (Phase 3):**
- Add `profile_photo_url` field
- Upload to Supabase Storage
- Link in patient record

---

**Status:** Ready for implementation ✅  
**Next Task:** TASK 2 - Patient Self-Service EHR
