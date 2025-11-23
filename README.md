# Samruddhi Backend - Hospital Core System

> **EHR & Consent Management Platform** - Phase 1 Complete

A TypeScript/Express backend powering India's unified Electronic Health Record (EHR) system with distributed consent management. Built for hospitals to securely manage patient records while giving patients full control over data sharing.

---

## 🎉 Phase 1: Core Features - COMPLETE

### ✅ Completed Tasks

| Task | Feature | Status |
|------|---------|--------|
| **Task 1** | Patient Registration & ABHA Integration | ✅ Complete |
| **Task 2** | Patient Self-Service EHR | ✅ Complete |
| **Task 3** | QR Code Generation & Scanning | ✅ Complete |
| **Task 4** | Consent Request Workflow | ✅ Complete |
| **Task 5** | File Upload Support (Supabase Storage) | ✅ Complete |

### 🔧 Key Features Implemented

- **Authentication**: Supabase Auth with JWT + custom claims (`patient_id`, `role`)
- **Patient Registration**: Auto-generates ABHA ID, creates Postgres + MongoDB records
- **EHR Management**: Prescriptions, Test Reports, Medical History, IoT device logs
- **Consent System**: JWT-based tokens stored in Upstash Redis (7-365 day expiry)
- **QR Codes**: Dynamic QR generation for consent sharing
- **File Uploads**: Presigned URLs for direct-to-Supabase-Storage uploads (PDFs, images)
- **Audit Logging**: Pino structured logs for all operations

---

## ⚠️ Known Issues & Fixes Needed

### 🐛 Active Bugs
1. **Prescription Validation**: `medications` array schema too strict - needs relaxed format
2. **Consent Grant**: `recipientId` UUID validation too strict - allow flexible formats
3. **ABHA ID**: Not generating/returning correctly (shows `undefined` in response)

### 📋 Missing Features (Phase 2)
- Task 6: Audit Trail Visibility (frontend endpoint)
- Hospital/Doctor registration endpoints
- Advanced search & filtering
- Batch operations

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (Postgres + Auth)
- MongoDB Atlas cluster
- Upstash Redis instance

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your credentials in .env.local:
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# - MONGODB_URI
# - REDIS_URL, REDIS_TOKEN

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Initial Setup

1. **Create Supabase Storage Bucket**:
   - Go to Storage → Create bucket: `samruddhi-storage` (Private)
   - Add policies for authenticated users (SELECT, INSERT, UPDATE on `storage.objects`)

2. **Seed Database** (optional):
   ```bash
   node scripts/seed.js
   ```

---

## 🧪 Testing

### Comprehensive Integration Test

Tests **all** endpoints with real authentication and data:

```bash
node scripts/test_all_endpoints.js
```

**What it tests:**
- ✅ Authentication (signup & JWT)
- ✅ Patient Registration (with metadata update)
- ✅ EHR Self-Service (Test Reports, IoT logs)
- ✅ File Upload (presigned URLs + actual upload)
- ⚠️ Consent/QR (known validation issues)

### System Health Check

Verifies all 27 endpoints are responding:

```bash
node scripts/check_system_health.js
```

### Manual Testing with Token

Get a valid JWT for manual API calls:

```bash
node scripts/get_token.js
# Copy the printed token
export TOKEN=ey...
node scripts/verify_protected_api.js
```

---

## 📁 Project Structure

```
samruddhi_backend/
├─ src/
│  ├─ server.ts              # Main Express app (all endpoints)
│  ├─ middleware/
│  │  ├─ auth.ts            # JWT validation (requireAuth, requirePatientAuth)
│  │  └─ consent.ts         # Consent token validation
│  ├─ lib/
│  │  ├─ mongo.ts           # MongoDB connection
│  │  ├─ redis.ts           # Redis helpers (consent storage)
│  │  └─ jwt.ts             # JWT signing/verification
│  └─ utils/
│     └─ logger.ts          # Pino logger setup
├─ scripts/
│  ├─ test_all_endpoints.js # Comprehensive test suite ⭐
│  ├─ check_system_health.js# Health checker
│  ├─ get_token.js          # Token generator
│  └─ seed.js               # Database seeding
├─ supabase/migrations/     # Postgres schema
├─ tasks/phase-1/           # Task specifications & completion reports
└─ docs/                    # Architecture & API docs
```

---

## 📡 API Endpoints

### Authentication
- `POST /patients/register` - Register new patient

### Patient EHR (Self-Service)
- `GET /ehr/my` - Get complete EHR
- `POST /ehr/my/prescription` - Add prescription
- `POST /ehr/my/test-report` - Add test report
- `POST /ehr/my/iot-log` - Log IoT device data

### Consent Management
- `POST /consent/grant` - Grant data access
- `POST /consent/request` - Request consent (doctor)
- `GET /consent/requests/my` - View requests (patient)
- `POST /consent/requests/:id/approve` - Approve request

### QR Codes
- `GET /consent/:id/qr` - Generate QR code
- `POST /consent/scan` - Scan & validate QR

### File Upload
- `POST /upload/presigned-url` - Get upload URL

**Full API Reference**: See [`API_ENDPOINTS.md`](./API_ENDPOINTS.md)

---

## 🏗️ Architecture

- **Database**: Postgres (metadata) + MongoDB (EHR documents)
- **Auth**: Supabase Auth (email/password)
- **Consent**: Redis (distributed cache, 7-365 day TTL)
- **Storage**: Supabase Storage (presigned URLs)
- **Logging**: Pino (JSON structured logs)

**Detailed Diagrams**: See [`ARCHITECTURE_FLOW.md`](./ARCHITECTURE_FLOW.md)

---

## 🔐 Security

- JWT-based authentication (Supabase)
- Row-Level Security (RLS) on Postgres
- Consent tokens with expiry (Redis TTL)
- File upload: User-isolated paths (`private/{user_id}/`)
- Input validation: Zod schemas

---

## 📝 Development Notes

### Task Completion Reports
All completed tasks have detailed reports in `tasks/phase-1/`:
- [TASK-01-COMPLETION-REPORT.md](./tasks/phase-1/TASK-01-COMPLETION-REPORT.md)
- [TASK-02-COMPLETION-REPORT.md](./tasks/phase-1/TASK-02-COMPLETION-REPORT.md)
- [TASK-03-COMPLETION-REPORT.md](./tasks/phase-1/TASK-03-COMPLETION-REPORT.md)
- [TASK-04-COMPLETION-REPORT.md](./tasks/phase-1/TASK-04-COMPLETION-REPORT.md)
- [TASK-05-COMPLETION-REPORT.md](./tasks/phase-1/TASK-05-COMPLETION-REPORT.md)

### Next Steps
1. Fix known bugs (prescription/consent validation)
2. Implement Task 6: Audit Trail Visibility
3. Add hospital/doctor registration
4. Build frontend integration
5. Deploy to staging

---

## 📞 Support & Contributing

**Documentation**:
- [System Architecture](./ARCHITECTURE_FLOW.md)
- [API Reference](./API_ENDPOINTS.md)
- [Consent Implementation](./CONSENT_IMPLEMENTATION.md)

**Issues**: See "Known Issues" section above

---

**Built with ❤️ for India's healthcare system**
