# Samruddhi Backend - Implementation Roadmap

> **Goal:** Build complete patient-hospital interaction flows in 3 phases  
> **Current Status:** 27 endpoints ✅ | 31 endpoints ❌ | ~46% complete  
> **Target:** Production-ready MVP in Phase 1 (5-7 days)

---

## 📋 PHASE 1: CRITICAL MVP (Week 1)

**Goal:** Enable real patient-doctor workflows  
**Deliverable:** Patients can register, manage records, grant consent via QR

### Priority Order (Dependencies First)

---

### ✅ TASK 1: Patient Registration & Profile (FOUNDATION)
**Priority:** 🔴 CRITICAL - Everything depends on this  
**Effort:** 4 hours  
**Files to modify:** `src/server.ts`, `scripts/seed.js`

#### Subtasks:
- [ ] **1.1** Add patient registration endpoint
  - `POST /patients/register` - Create patient record
  - Links Supabase Auth user to `patients` table
  - Creates initial EHR document in MongoDB
  
- [ ] **1.2** Add patient profile endpoints
  - `GET /patients/:id` - Get patient basic info
  - `PATCH /patients/:id/profile` - Update profile
  - `GET /patients/search?abha_id=X` - Search by ABHA ID
  
- [ ] **1.3** Add middleware `requirePatientAuth`
  - Validates patient is accessing their own records
  - No consent needed for self-access
  
- [ ] **1.4** Seed test patients
  - Add 10 patients to `patients` table (Postgres)
  - Create matching EHR records in MongoDB
  - Link to existing Supabase Auth users

**Validation:**
```bash
# Register patient
curl -X POST http://localhost:3000/patients/register \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -d '{"abhaId":"1234-5678-9012", "name":"Rajesh Kumar", ...}'

# Search patient
curl "http://localhost:3000/patients/search?abha_id=1234-5678-9012"
```

---

### ✅ TASK 2: Patient Self-Service EHR (FIX CRITICAL BUG)
**Priority:** 🔴 CRITICAL - Currently broken  
**Effort:** 3 hours  
**Dependencies:** Task 1 complete

#### Subtasks:
- [ ] **2.1** Create new route group `/ehr/my/*`
  - Separate from hospital access routes
  - Uses `requirePatientAuth` instead of `requireConsent`
  
- [ ] **2.2** Add patient self-access endpoints
  - `GET /ehr/my` - View complete EHR
  - `GET /ehr/my/prescriptions` - View prescriptions
  - `GET /ehr/my/test-reports` - View test reports
  - `GET /ehr/my/medical-history` - View history
  - `GET /ehr/my/iot/:deviceType` - View IoT data
  
- [ ] **2.3** Add patient self-write endpoints
  - `POST /ehr/my/prescription` - Add old prescription
  - `POST /ehr/my/test-report` - Add test result
  - `POST /ehr/my/medical-history` - Add history
  - `POST /ehr/my/iot-log` - Add IoT reading
  
- [ ] **2.4** Update existing hospital routes
  - Keep `/ehr/patient/:id/*` for hospital access
  - Continue requiring consent + staff auth

**Validation:**
```bash
# Patient adds their own test report (no consent needed!)
curl -X POST http://localhost:3000/ehr/my/test-report \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -d '{"test_name":"Blood Test", ...}'

# Patient views own records
curl http://localhost:3000/ehr/my/prescriptions \
  -H "Authorization: Bearer $PATIENT_JWT"
```

---

### ✅ TASK 3: QR Code Generation for Consent
**Priority:** 🔴 CRITICAL - Makes consent sharing practical  
**Effort:** 2 hours  
**Dependencies:** None (works with existing consent system)

#### Subtasks:
- [ ] **3.1** Install QR code library
  ```bash
  npm install qrcode @types/qrcode
  ```
  
- [ ] **3.2** Add QR generation endpoint
  - `GET /consent/:id/qr` - Generate QR code image
  - Returns base64 PNG or data URL
  - Encodes: `{ consentId, consentToken, expiresAt, patientId }`
  
- [ ] **3.3** Add QR scan/decode endpoint
  - `POST /consent/scan` - Decode QR data
  - Validates consent token
  - Returns consent details
  
- [ ] **3.4** Add QR to consent grant response
  - Auto-generate QR when consent is granted
  - Return both token and QR code

**Validation:**
```bash
# Get QR code for consent
curl http://localhost:3000/consent/$CONSENT_ID/qr \
  -H "Authorization: Bearer $PATIENT_JWT"

# Returns: { qrCodeDataUrl: "data:image/png;base64,..." }
```

---

### ✅ TASK 4: Consent Request Workflow (Doctor → Patient)
**Priority:** 🟡 HIGH - Completes consent UX  
**Effort:** 6 hours  
**Dependencies:** Task 1 (needs patients), Task 3 (QR codes)

#### Subtasks:
- [ ] **4.1** Design Redis schema for requests
  ```redis
  consent_request:{request_id} → JSON
  patient:{id}:consent_requests → SET
  hospital:{id}:consent_requests → SET
  ```
  
- [ ] **4.2** Add request creation endpoint
  - `POST /consent/request` - Doctor requests consent
  - Stores in Redis with 24h TTL
  - Returns request ID
  
- [ ] **4.3** Add patient request endpoints
  - `GET /consent/requests/pending` - Patient's pending requests
  - `POST /consent/requests/:id/approve` - Approve & auto-grant consent
  - `POST /consent/requests/:id/deny` - Deny request
  
- [ ] **4.4** Add hospital request tracking
  - `GET /consent/requests/sent` - Hospital's sent requests
  - `GET /consent/requests/:id/status` - Check request status
  
- [ ] **4.5** Update Redis helpers in `src/lib/redis.ts`
  - `createConsentRequest()`
  - `getPatientConsentRequests()`
  - `approveConsentRequest()` → auto-creates consent
  - `denyConsentRequest()`

**Validation:**
```bash
# Doctor requests consent
curl -X POST http://localhost:3000/consent/request \
  -H "Authorization: Bearer $DOCTOR_JWT" \
  -d '{"patientId":"...", "requestedScope":["prescriptions"], "reason":"Pre-surgery"}'

# Patient sees pending requests
curl http://localhost:3000/consent/requests/pending \
  -H "Authorization: Bearer $PATIENT_JWT"

# Patient approves
curl -X POST http://localhost:3000/consent/requests/$REQUEST_ID/approve \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -d '{"durationDays":7}'
```

---

### ✅ TASK 5: File Upload Support
**Priority:** 🟡 HIGH - Needed for real medical records  
**Effort:** 5 hours  
**Dependencies:** Task 2 (patient self-service)

#### Subtasks:
- [ ] **5.1** Set up Supabase Storage
  - Create bucket: `medical-documents`
  - Set RLS policies (patient can CRUD own files)
  
- [ ] **5.2** Install multer for file uploads
  ```bash
  npm install multer @types/multer
  ```
  
- [ ] **5.3** Add patient upload endpoint
  - `POST /ehr/my/upload` - Upload PDF/image
  - Max size: 10MB
  - Allowed types: PDF, JPG, PNG
  - Returns: `{ fileUrl, fileId }`
  
- [ ] **5.4** Add hospital upload endpoint
  - `POST /ehr/patient/:id/upload` - Hospital uploads for patient
  - Requires consent + write scope
  
- [ ] **5.5** Update EHR schemas to include file URLs
  - Add `attachments: [{ fileUrl, fileType, uploadedAt }]`
  - Link to prescriptions/test reports

**Validation:**
```bash
# Patient uploads test report PDF
curl -X POST http://localhost:3000/ehr/my/upload \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -F "file=@test_report.pdf" \
  -F "type=test_report"
```

---

### ✅ TASK 6: Audit Trail Visibility
**Priority:** 🟡 HIGH - Patient trust + compliance  
**Effort:** 3 hours  
**Dependencies:** Existing audit helpers

#### Subtasks:
- [ ] **6.1** Wire audit logging to ALL endpoints
  - Import audit helpers in `server.ts`
  - Add logging to consent operations
  - Add logging to EHR read/write
  - Add logging to admissions
  
- [ ] **6.2** Add patient audit endpoint
  - `GET /ehr/my/audit-log` - Patient views access history
  - Query params: `?startDate=X&endDate=Y&action=read|write`
  - Returns: `[{ timestamp, hospitalName, doctorName, action, resourceType }]`
  
- [ ] **6.3** Add hospital audit endpoint
  - `GET /hospitals/:id/audit-log` - Hospital admin views
  - Staff access history (compliance)
  
- [ ] **6.4** Test audit logging
  - Verify all operations logged
  - Check audit log query performance

**Validation:**
```bash
# Patient sees who accessed their records
curl http://localhost:3000/ehr/my/audit-log?startDate=2024-01-01 \
  -H "Authorization: Bearer $PATIENT_JWT"

# Shows: Dr. Priya (Apollo Hospital) viewed prescriptions on Jan 15, 2024
```

---

## 🎯 PHASE 1 COMPLETION CRITERIA

**Definition of Done:**
- ✅ Patients can register with ABHA ID
- ✅ Patients can add/view their own medical records (no consent needed)
- ✅ Doctors can REQUEST consent from patients
- ✅ Patients can approve/deny requests
- ✅ Consent sharing via QR codes working
- ✅ Medical documents (PDFs) can be uploaded
- ✅ Patients can see audit trail of who accessed their data
- ✅ All operations logged to `audit_logs` table

**Testing Checklist:**
```bash
# End-to-end happy path
1. Register patient → ✅ Patient record created
2. Patient adds test report → ✅ Saved without consent
3. Doctor requests consent → ✅ Request created
4. Patient approves → ✅ Consent auto-granted
5. Patient shows QR code → ✅ QR generated
6. Doctor scans QR → ✅ Token extracted
7. Doctor reads prescriptions → ✅ Access granted
8. Patient views audit log → ✅ Access logged
9. Patient revokes consent → ✅ Doctor blocked
10. Patient uploads PDF → ✅ File stored in Supabase Storage
```

**Endpoints Added:** 17 new endpoints
**Total Endpoints:** 27 (current) + 17 = **44 endpoints**
**Completion:** ~75% of critical features

---

## 📋 PHASE 2: PRODUCTION-READY (Week 2)

**Goal:** Handle edge cases and hospital operations  
**Deliverable:** Emergency access, notifications, inventory tracking

### ✅ TASK 7: Emergency Consent Override
**Priority:** 🟡 HIGH - Medical emergency handling  
**Effort:** 4 hours

#### Subtasks:
- [ ] **7.1** Add emergency override endpoint
  - `POST /consent/emergency-override`
  - Requires dual auth (doctor + admin)
  - Creates 24h emergency consent
  - Logs prominently in audit trail
  
- [ ] **7.2** Add emergency consent validation
  - Update consent middleware to recognize emergency flag
  - Allow access without patient grant
  - Track emergency reason and approver

**Endpoints:** 2 new

---

### ✅ TASK 8: Real-Time Notifications
**Priority:** 🟡 HIGH - Better UX  
**Effort:** 6 hours

#### Subtasks:
- [ ] **8.1** Set up Supabase Realtime channels
  - Patient channel: `patient:{id}:notifications`
  - Hospital channel: `hospital:{id}:notifications`
  
- [ ] **8.2** Publish events
  - Consent granted → notify hospital
  - Consent revoked → notify hospital
  - New test result → notify patient
  - Emergency override → notify patient
  
- [ ] **8.3** Add notification endpoints
  - `GET /notifications/my` - Patient's notifications
  - `PATCH /notifications/:id/read` - Mark as read

**Endpoints:** 2 new

---

### ✅ TASK 9: Inventory Management
**Priority:** 🟢 MEDIUM - Hospital operations  
**Effort:** 12 hours

#### Subtasks:
- [ ] **9.1** Add inventory CRUD
  - `GET /inventory` - List items
  - `POST /inventory` - Add item
  - `PATCH /inventory/:id` - Update stock
  
- [ ] **9.2** Add inventory transactions
  - `POST /inventory/:id/consume` - Consume stock
  - `POST /inventory/:id/restock` - Add stock
  
- [ ] **9.3** Add low stock alerts
  - `GET /inventory/alerts` - Low stock items
  
- [ ] **9.4** Auto-consume during admissions
  - Deduct standard admission kits
  - Link to inventory transactions

**Endpoints:** 7 new

---

## 📋 PHASE 3: ADVANCED FEATURES (Week 3)

**Goal:** Inter-hospital collaboration and analytics  
**Deliverable:** Transfer system, reporting

### ✅ TASK 10: Inter-Hospital Transfers
**Effort:** 16 hours

**Endpoints:** 6 new

---

### ✅ TASK 11: Analytics & Reporting
**Effort:** 12 hours

**Endpoints:** 5 new

---

## 📊 PROGRESS TRACKING

### Current Status
- ✅ **Phase 0 (Current):** 27 endpoints | 46% complete
- 🔄 **After Phase 1:** 44 endpoints | 75% complete | **MVP Ready**
- 🔄 **After Phase 2:** 53 endpoints | 90% complete | **Production Ready**
- 🔄 **After Phase 3:** 64 endpoints | 100% complete | **Full Featured**

---

## 🚀 IMMEDIATE NEXT STEPS

### Right Now (Today):
1. ✅ Create implementation plan (DONE)
2. 🔄 Start Task 1.1: Patient registration endpoint
3. 🔄 Start Task 1.4: Seed test patients

### This Week:
- Day 1-2: Tasks 1-2 (Patient foundation)
- Day 3: Task 3 (QR codes)
- Day 4-5: Task 4 (Consent requests)
- Day 6: Task 5 (File uploads)
- Day 7: Task 6 (Audit trail)

### Success Metrics:
- Code quality: TypeScript strict mode, proper error handling
- Testing: Manual test scripts for each endpoint
- Documentation: Update API_ENDPOINTS.md as we go
- Performance: All endpoints < 500ms response time

---

## 🛠️ DEVELOPMENT WORKFLOW

### For Each Task:
1. **Plan** - Read subtask checklist
2. **Code** - Implement in `src/server.ts` or new files
3. **Test** - Manual curl commands
4. **Document** - Add to API_ENDPOINTS.md
5. **Commit** - Git commit with task number

### Branch Strategy:
```bash
main (stable, deployed endpoints)
├── feature/patient-registration (Task 1)
├── feature/patient-self-service (Task 2)
├── feature/qr-codes (Task 3)
└── feature/consent-requests (Task 4)
```

### Testing Strategy:
- Manual test scripts in `scripts/`
- Update `scripts/test_endpoints.js` with new flows
- Add validation scripts for each task

---

**Ready to start implementation? Let's build Task 1 first! 🚀**
