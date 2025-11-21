# TASK 2: Patient Self-Service EHR Endpoints

**Priority:** 🔴 CRITICAL (Fixes Core Bug)  
**Effort:** 3 hours  
**Dependencies:** TASK 1 (Patient Registration)  
**Status:** 📋 Planned

---

## 📝 Overview

**CRITICAL BUG:** Current `/ehr/patient/:id/*` endpoints require consent middleware even for patients accessing their OWN records. This is fundamentally broken.

**Problem:** A patient cannot view or add to their own medical records without granting consent to themselves (nonsensical).

**Solution:** Create separate route group `/ehr/my/*` for patient self-access that uses `requirePatientAuth` instead of `requireConsent`.

---

## 🎯 Goals

1. Patients can view their complete EHR without consent
2. Patients can add their own medical records (prescriptions, test reports, history)
3. Keep existing `/ehr/patient/:id/*` routes for hospital access (with consent)
4. Clear separation: Self-access vs Hospital-access

---

## 🏗️ Architecture

### Current (Broken):
```
Patient wants to view own prescriptions
  ↓
GET /ehr/patient/:id/prescriptions
  ↓
requireConsent middleware
  ↓
Requires X-Consent-Token (patient granting consent to self?!)
  ↓
❌ FAILS - Patient can't access own data
```

### New (Fixed):
```
Patient Self-Access:
  GET /ehr/my/prescriptions
    ↓
  requirePatientAuth middleware
    ↓
  Validates patient JWT
    ↓
  ✅ Returns patient's own prescriptions

Hospital Access:
  GET /ehr/patient/:id/prescriptions
    ↓
  requireConsent middleware
    ↓
  Validates Staff JWT + Consent JWT
    ↓
  ✅ Returns patient data (with consent)
```

---

## 🔌 API Endpoints

### Read Endpoints (Patient Self-Access)

---

#### 1. GET /ehr/my

**Description:** Get complete patient EHR (own records)

**Authentication:** `requirePatientAuth` (Patient JWT only)

**Response (200 OK):**
```json
{
  "patientId": "uuid",
  "abhaId": "1234-5678-9012",
  "profile": {
    "name": "Rajesh Kumar",
    "dob": "1980-01-15",
    "bloodGroup": "A+",
    "phone": "+91-9876543210",
    "address": {
      "street": "123 MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  },
  "prescriptions": [...],
  "testReports": [...],
  "medicalHistory": [...],
  "iotDevices": [...]
}
```

---

#### 2. GET /ehr/my/prescriptions

**Description:** Get all prescriptions

**Authentication:** `requirePatientAuth`

**Response:**
```json
{
  "prescriptions": [
    {
      "date": "2024-01-15",
      "doctorName": "Dr. Priya Sharma",
      "hospitalName": "Apollo Hospital",
      "medications": [
        {
          "name": "Amoxicillin",
          "dosage": "500mg",
          "frequency": "3x daily",
          "duration": "7 days"
        }
      ],
      "diagnosis": "Bacterial infection",
      "pdfUrl": "https://storage.example.com/rx-123.pdf"
    }
  ]
}
```

---

#### 3. GET /ehr/my/test-reports

**Description:** Get all test reports

**Authentication:** `requirePatientAuth`

**Response:**
```json
{
  "testReports": [
    {
      "testName": "Complete Blood Count",
      "date": "2024-01-10",
      "labName": "Path Labs",
      "parsedResults": {
        "hemoglobin": "14.5 g/dL",
        "wbc": "8000 /cumm"
      },
      "pdfUrl": "https://storage.example.com/report-456.pdf"
    }
  ]
}
```

---

#### 4. GET /ehr/my/medical-history

**Description:** Get medical history

**Authentication:** `requirePatientAuth`

---

#### 5. GET /ehr/my/iot/:deviceType

**Description:** Get IoT device logs

**Authentication:** `requirePatientAuth`

**Path Parameters:**
- `deviceType`: `heart_rate`, `glucose`, `blood_pressure`, `spo2`, `temperature`

**Response:**
```json
{
  "deviceType": "heart_rate",
  "logs": [
    {
      "timestamp": "2024-01-15T08:30:00Z",
      "value": 72,
      "unit": "bpm",
      "context": "resting"
    },
    {
      "timestamp": "2024-01-15T14:00:00Z",
      "value": 110,
      "unit": "bpm",
      "context": "post-exercise"
    }
  ]
}
```

---

### Write Endpoints (Patient Self-Service)

---

#### 6. POST /ehr/my/prescription

**Description:** Patient adds old prescription to their records

**Authentication:** `requirePatientAuth`

**Use Case:** Patient uploads prescription from previous hospital visit

**Request:**
```json
{
  "date": "2023-12-01",
  "doctorName": "Dr. Kumar",
  "hospitalName": "AIIMS Delhi",
  "medications": [
    {
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "2x daily",
      "duration": "30 days",
      "notes": "Take with meals"
    }
  ],
  "diagnosis": "Type 2 Diabetes",
  "pdfUrl": "https://storage.example.com/old-rx.pdf"
}
```

**Validation:**
```typescript
const SelfPrescriptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  doctorName: z.string().min(2),
  hospitalName: z.string().optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    notes: z.string().optional()
  })),
  diagnosis: z.string().optional(),
  pdfUrl: z.string().url().optional()
});
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Prescription added to your records"
}
```

---

#### 7. POST /ehr/my/test-report

**Description:** Patient adds test report

**Authentication:** `requirePatientAuth`

**Use Case:** Patient uploads lab results from external lab

**Request:**
```json
{
  "testName": "Blood Sugar Fasting",
  "date": "2024-01-15",
  "labName": "Path Labs",
  "parsedResults": {
    "glucose": "105 mg/dL"
  },
  "notes": "Slightly elevated",
  "pdfUrl": "https://storage.example.com/report.pdf"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Test report added"
}
```

---

#### 8. POST /ehr/my/medical-history

**Description:** Patient adds past medical condition

**Request:**
```json
{
  "date": "2020-03-15",
  "condition": "Appendicitis",
  "treatment": "Laparoscopic appendectomy",
  "notes": "Successful surgery, no complications",
  "doctorName": "Dr. Verma",
  "hospitalName": "Max Hospital"
}
```

---

#### 9. POST /ehr/my/iot-log

**Description:** Patient adds IoT device reading

**Use Case:** Patient manually logs glucose reading from home monitor

**Request:**
```json
{
  "deviceType": "glucose",
  "deviceId": "accu-chek-12345",
  "value": 110,
  "unit": "mg/dL",
  "context": "fasting"
}
```

**Auto-timestamp:** Backend adds `timestamp: new Date()`

---

## 🔄 Comparison: Self vs Hospital Access

| Feature | Self-Access (`/ehr/my/*`) | Hospital Access (`/ehr/patient/:id/*`) |
|---------|---------------------------|----------------------------------------|
| **Auth** | Patient JWT only | Staff JWT + Consent JWT |
| **Middleware** | `requirePatientAuth` | `requireAuth` + `requireConsent` |
| **Scope Check** | None (full access) | Validates consent scopes |
| **Hospital Match** | N/A | Validates `hospital_id` |
| **Use Case** | Patient manages own records | Doctor reviews with consent |
| **Write Access** | Patient adds own records | Hospital adds records for patient |

---

## 🛡️ Middleware Updates

### Modify: `src/middleware/auth.ts`

Add `requirePatientAuth` (from TASK 1):

```typescript
export const requirePatientAuth = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Validate Supabase JWT
  await requireAuth(req, res, () => {});
  
  // 2. Verify user has patient_id claim
  const user = (req as any).user;
  if (!user?.patient_id) {
    return res.status(403).json({ error: 'Patient access required' });
  }
  
  // 3. Attach patient_id to request for MongoDB queries
  (req as any).patientId = user.patient_id;
  
  next();
};
```

**Usage in Routes:**
```typescript
// Patient self-access (no consent needed)
app.get('/ehr/my/prescriptions', requirePatientAuth, async (req, res) => {
  const patientId = (req as any).patientId; // From middleware
  // Fetch from MongoDB using patientId
});

// Hospital access (consent required)
app.get('/ehr/patient/:id/prescriptions', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const consent = (req as any).consent; // From requireConsent
  // Verify scope includes 'prescriptions'
});
```

---

## 📦 Update EHR Helpers

### File: `src/lib/ehr.ts`

Current helper assumes consent scopes for filtering. Add self-access variant:

```typescript
// New: Patient self-access (no scope filtering)
export async function getMyPatientEHR(patientId: string): Promise<PatientEHR | null> {
  const db = await getDb();
  const collection = db.collection('ehr_records');
  
  const record = await collection.findOne({ patient_id: patientId });
  
  if (!record) return null;
  
  // Return full EHR (no filtering)
  return {
    patient_id: record.patient_id,
    abha_id: record.abha_id,
    profile: record.profile,
    prescriptions: record.prescriptions || [],
    test_reports: record.test_reports || [],
    medical_history: record.medical_history || [],
    iot_devices: record.iot_devices || []
  };
}

// Existing: Hospital access (scope filtering)
export async function getPatientEHR(
  patientId: string,
  scopes: string[]
): Promise<Partial<PatientEHR> | null> {
  // ... existing implementation with scope filtering
}
```

---

## 🧪 Testing

### Test Cases

**1. Patient Views Own Prescriptions**
```bash
# Patient logs in, gets JWT
curl http://localhost:3000/ehr/my/prescriptions \
  -H "Authorization: Bearer $PATIENT_JWT"

# Expected: 200 OK with prescriptions array
# No consent needed!
```

**2. Patient Adds Own Test Report**
```bash
curl -X POST http://localhost:3000/ehr/my/test-report \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "Blood Test",
    "date": "2024-01-15",
    "labName": "Path Labs",
    "parsedResults": {"hemoglobin": "14.5"}
  }'

# Expected: 201 Created
# Verify in MongoDB that record was added
```

**3. Patient Cannot Access Another Patient's Records**
```bash
# Patient A tries to access Patient B's records
curl http://localhost:3000/ehr/my/prescriptions \
  -H "Authorization: Bearer $PATIENT_A_JWT"

# Backend extracts patient_id from JWT → Patient A's ID
# Returns Patient A's records only
# No way to access Patient B's data via /ehr/my/* routes
```

**4. Hospital Still Uses Consent Routes**
```bash
# Doctor with consent token
curl http://localhost:3000/ehr/patient/$PATIENT_ID/prescriptions \
  -H "Authorization: Bearer $DOCTOR_JWT" \
  -H "X-Consent-Token: $CONSENT_JWT"

# Expected: 200 OK (with consent)
# This route unchanged
```

**5. Patient Adds Prescription, Doctor Sees It**
```bash
# Step 1: Patient adds old prescription
curl -X POST http://localhost:3000/ehr/my/prescription \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -d '{"date":"2023-12-01", "doctorName":"Dr. Kumar", ...}'

# Step 2: Doctor (with consent) views prescriptions
curl http://localhost:3000/ehr/patient/$PATIENT_ID/prescriptions \
  -H "Authorization: Bearer $DOCTOR_JWT" \
  -H "X-Consent-Token: $CONSENT_JWT"

# Expected: See OLD prescription + any new ones doctor added
```

---

## ✅ Acceptance Criteria

- [ ] Patient can view complete EHR via `/ehr/my` without consent
- [ ] Patient can view specific sections (prescriptions, reports, etc.)
- [ ] Patient can add prescriptions to own records
- [ ] Patient can add test reports to own records
- [ ] Patient can add medical history entries
- [ ] Patient can log IoT device readings
- [ ] Patient cannot access another patient's `/ehr/my/*` routes
- [ ] Existing hospital routes (`/ehr/patient/:id/*`) still work with consent
- [ ] All writes validated with Zod schemas
- [ ] All writes logged to audit trail (Patient ID as actor)

---

## 🚀 Implementation Checklist

### Step 1: Add Zod Schemas (20 min)
- [ ] `SelfPrescriptionSchema`
- [ ] `SelfTestReportSchema`
- [ ] `SelfMedicalHistorySchema`
- [ ] `SelfIoTLogSchema`

### Step 2: Update EHR Helpers (30 min)
- [ ] Add `getMyPatientEHR()` in `src/lib/ehr.ts`
- [ ] Add `addMyPrescription()` (links to patient ID from JWT)
- [ ] Add `addMyTestReport()`
- [ ] Add `addMyMedicalHistory()`
- [ ] Add `addMyIoTLog()`

### Step 3: Add Read Endpoints (30 min)
- [ ] `GET /ehr/my` - Complete EHR
- [ ] `GET /ehr/my/prescriptions`
- [ ] `GET /ehr/my/test-reports`
- [ ] `GET /ehr/my/medical-history`
- [ ] `GET /ehr/my/iot/:deviceType`

### Step 4: Add Write Endpoints (40 min)
- [ ] `POST /ehr/my/prescription`
- [ ] `POST /ehr/my/test-report`
- [ ] `POST /ehr/my/medical-history`
- [ ] `POST /ehr/my/iot-log`

### Step 5: Testing (30 min)
- [ ] Test all 5 test cases above
- [ ] Verify patient cannot access other patient data
- [ ] Verify hospital routes still work

### Step 6: Documentation (20 min)
- [ ] Update `API_ENDPOINTS.md`
- [ ] Add `/ehr/my/*` section

**Total Time:** ~3 hours

---

## 📝 Notes

**Why Separate Routes?**
- `/ehr/my/*` - Patient self-access (natural, intuitive)
- `/ehr/patient/:id/*` - Hospital access (requires consent)
- Clear separation prevents middleware confusion

**Audit Logging:**
- Patient self-writes should still be audited
- Actor: Patient ID
- Action: "patient_add_prescription", "patient_add_test_report"
- Helps detect anomalies (e.g., patient account compromise)

**Future Enhancement:**
- Add `approve_review: boolean` flag for patient-added records
- Doctors can "verify" patient-uploaded prescriptions
- Helps detect fake/fraudulent records

---

**Status:** Ready for implementation ✅  
**Depends On:** TASK 1 (Patient Registration) must be complete  
**Blocks:** None (parallel with other tasks)  
**Next Task:** TASK 3 - QR Code Generation
