# TASK 4: Consent Request Workflow

## 🎯 Objective
Implement a workflow for doctors to request consent from patients, and for patients to view and manage these requests. This replaces the need for patients to proactively grant consent without context.

## 🛠️ Specifications

### 1. Database Schema (Postgres)
New table `consent_requests`:
- `id` (UUID, PK)
- `patient_id` (UUID, FK -> patients.id)
- `doctor_id` (UUID, FK -> doctors.id)
- `hospital_id` (UUID, FK -> hospitals.id)
- `scope` (Text[], e.g., ['prescriptions', 'test_reports'])
- `purpose` (Text)
- `status` (Text: 'pending', 'approved', 'rejected')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 2. API Endpoints

#### Doctor: Request Consent
- **POST** `/consent/request`
- **Auth:** Doctor/Hospital Staff
- **Body:** `{ patientId, scope, purpose }`
- **Action:** Creates a record in `consent_requests` with status 'pending'.

#### Patient: View Requests
- **GET** `/consent/requests/my`
- **Auth:** Patient
- **Action:** Returns all requests for the logged-in patient.

#### Patient: Approve Request
- **POST** `/consent/requests/:id/approve`
- **Auth:** Patient
- **Action:**
    1.  Verifies request belongs to patient.
    2.  Generates Consent Token (JWT).
    3.  Stores Consent in Redis (`setConsent`).
    4.  Updates request status to 'approved'.
    5.  Returns the generated token (optional, but mainly updates state).

#### Patient: Deny Request
- **POST** `/consent/requests/:id/deny`
- **Auth:** Patient
- **Action:** Updates request status to 'rejected'.

### 3. Security
- Doctors can only request for patients they have a valid reason to access (audit this).
- Patients can only see/approve their own requests.

## ✅ Acceptance Criteria
- [ ] `consent_requests` table created in Supabase.
- [ ] Doctor can create a request.
- [ ] Patient can see the request.
- [ ] Patient can approve -> Consent Token is generated and active in Redis.
- [ ] Patient can deny -> Request status updated.
- [ ] Audit logs created for all actions.

## 📅 Implementation Plan
1.  Create migration SQL.
2.  Implement `POST /consent/request`.
3.  Implement `GET /consent/requests/my`.
4.  Implement `POST /consent/requests/:id/approve` & `deny`.
5.  Test workflow.
