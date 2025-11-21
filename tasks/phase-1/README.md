# Phase 1 Task Specifications - Master Index

**Project:** Samruddhi Backend  
**Phase:** 1 - Critical MVP  
**Total Tasks:** 6  
**Total Effort:** ~23 hours  
**Goal:** Production-ready patient-hospital workflow

---

## 📋 Task List

| # | Task | Priority | Effort | Status | Dependencies |
|---|------|----------|--------|--------|--------------|
| 1 | [Patient Registration](./TASK-01-PATIENT-REGISTRATION.md) | 🔴 CRITICAL | 4h | 📋 Planned | None |
| 2 | [Patient Self-Service EHR](./TASK-02-PATIENT-SELF-SERVICE.md) | 🔴 CRITICAL | 3h | 📋 Planned | TASK 1 |
| 3 | [QR Code Generation](./TASK-03-QR-CODE-GENERATION.md) | 🔴 CRITICAL | 2h | 📋 Planned | None |
| 4 | Consent Request Workflow | 🟡 HIGH | 6h | 🔄 In Progress | TASK 1, 3 |
| 5 | File Upload Support | 🟡 HIGH | 5h | 📋 Planned | TASK 2 |
| 6 | Audit Trail Visibility | 🟡 HIGH | 3h | 📋 Planned | None |

---

## 🎯 Phase 1 Goals

**Objective:** Enable complete patient-doctor interaction workflow

### Before Phase 1:
- ❌ Patients can't register in system
- ❌ Patients can't access own medical records
- ❌ No practical consent sharing mechanism
- ❌ No consent request flow
- ❌ No file uploads for medical documents
- ❌ No audit visibility for patients

### After Phase 1:
- ✅ Patients can register with ABHA ID
- ✅ Patients can manage own EHR
- ✅ QR code consent sharing working
-  Doctors can REQUEST consent from patients
- ✅ Medical documents (PDFs) uploadable
- ✅ Complete audit trail visible

---

## 📊 Progress Tracking

### Endpoints Summary

| Task | Endpoints Added | Cumulative Total |
|------|----------------|------------------|
| Current | - | 27 |
| TASK 1 | +4 | 31 |
| TASK 2 | +9 | 40 |
| TASK 3 | +2 (+1 enhanced) | 42 |
| TASK 4 | +5 | 47 |
| TASK 5 | +2 | 49 |
| TASK 6 | +2 | 51 |

**Final:** 51 endpoints (from 27) = +24 new endpoints

---

## 🔄 Dependency Graph

```
TASK 1 (Patient Registration)
  ├──> TASK 2 (Self-Service) - Needs patient records
  └──> TASK 4 (Consent Requests) - Needs patient lookup

TASK 3 (QR Codes)
  └──> TASK 4 (Consent Requests) - QR in request approval

TASK 2 (Self-Service)
  └──> TASK 5 (File Uploads) - Upload to own EHR

Independent:
  - TASK 6 (Audit Trail) - Can run parallel
```

**Critical Path:** TASK 1 → TASK 2 → TASK 5  
**Parallel Opportunities:** TASK 3 and TASK 6 can run alongside

---

## 🚀 Recommended Execution Order

### Day 1-2 (Foundation)
1. **TASK 1** - Patient Registration (4h)
   - Essential for everything else
   - Seed test patients
   
2. **TASK 2** - Patient Self-Service (3h)
   - Critical bug fix
   - Immediate value

### Day 3 (UX)
3. **TASK 3** - QR Codes (2h)
   - Makes consent practical
   - Can start after TASK 1 finishes

### Day 4-5 (Workflow)
4. **TASK 4** - Consent Requests (6h)
   - Completes doctor→patient flow
   - Needs TASK 1 + 3

### Day 6 (Enhancement)
5. **TASK 5** - File Uploads (5h)
   - Real medical documents
   - Needs TASK 2

6. **TASK 6** - Audit Trail (3h)
   - Trust & compliance
   - Can run parallel anytime

---

## ✅ Definition of Done (Phase 1)

**Technical Criteria:**
- [ ] All 24 endpoints implemented
- [ ] All endpoints tested with curl
- [ ] Zod validation on all inputs
- [ ] Error handling (400, 403, 404, 500)
- [ ] All code documented in API_ENDPOINTS.md
- [ ] Seed data includes 10 patients with EHR
- [ ] Test scripts updated

**Functional Criteria:**
- [ ] Patient can register with ABHA ID
- [ ] Patient can add/view own medical records
- [ ] Doctor can REQUEST consent
- [ ] Patient can approve/deny via mobile app
- [ ] QR code sharing works end-to-end
- [ ] PDF uploads work (Supabase Storage)
- [ ] Patients see audit trail of accesses

**Business Criteria:**
- [ ] End-to-end flow testable
- [ ] Demo-ready for stakeholders
- [ ] No critical security issues
- [ ] Performance < 500ms per endpoint

---

## 📝 Notes

**Created:** 2024-01-15  
**Author:** Development Team  
**Phase:** 1 of 3  
**Next Phase:** Production Hardening (Emergency overrides, Notifications, Inventory)

---

**Ready to implement!** 🚀

See individual task files for detailed specifications.
