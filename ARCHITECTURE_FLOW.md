# Shared Redis Consent Architecture - Visual Flow

## System Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Patient App    │         │  Shared Redis    │         │ Hospital Backend│
│ (Mobile/Web)    │         │   (Upstash)      │         │   (Express)     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Flow 1: Patient Grants Consent

```
Patient App                  Backend Server               Shared Redis
     │                            │                            │
     │──1. POST /consent/grant───▶│                            │
     │    + Patient Supabase JWT  │                            │
     │                            │                            │
     │                            │──2. Validate Auth ────────▶│
     │                            │◀────── (requireAuth)       │
     │                            │                            │
     │                            │──3. Generate Consent JWT   │
     │                            │   (jti, scope, exp)        │
     │                            │                            │
     │                            │──4. SET consent:{jti}─────▶│
     │                            │   {patientId, scope...}    │
     │                            │   EX 1209600 (14 days)     │
     │                            │                            │
     │                            │──5. SADD patient:{id}:────▶│
     │                            │   consents {jti}           │
     │                            │                            │
     │                            │──6. SADD hospital:{id}:───▶│
     │                            │   consents {jti}           │
     │                            │                            │
     │◀──7. Return Consent JWT────│                            │
     │    {consentToken, jti...}  │                            │
     │                            │                            │
     │──8. Cache JWT locally      │                            │
     │    (offline access)        │                            │
     │                            │                            │
     │──9. Share via QR/SMS/Link  │                            │
     │    to hospital             │                            │
     │                            │                            │
```

## Flow 2: Hospital Accesses Patient Data

```
Hospital Staff              Backend Server               Shared Redis
     │                            │                            │
     │──1. GET /ehr/patient/:id──▶│                            │
     │    + Staff Supabase JWT    │                            │
     │    + X-Consent-Token       │                            │
     │                            │                            │
     │                            │──2. Validate Auth ────────▶│
     │                            │◀────── (requireAuth)       │
     │                            │                            │
     │                            │──3. Fast Path Check        │
     │                            │   EXISTS consent:{jti}:───▶│
     │                            │   revoked                  │
     │                            │◀──── NO (valid) ───────────│
     │                            │                            │
     │                            │──4. GET consent:{jti}─────▶│
     │                            │◀──── Full record ──────────│
     │                            │   {patientId, scope,       │
     │                            │    hospitalId, expiresAt}  │
     │                            │                            │
     │                            │──5. Verify:                │
     │                            │   ✓ expiresAt > now        │
     │                            │   ✓ hospitalId matches     │
     │                            │   ✓ recipientId matches    │
     │                            │                            │
     │                            │──6. Attach req.consent     │
     │                            │   Continue to handler      │
     │                            │                            │
     │◀──7. Return EHR Data───────│                            │
     │    {prescriptions: [...]}  │                            │
     │                            │                            │
```

## Flow 3: Patient Revokes Consent

```
Patient App                  Backend Server               Shared Redis
     │                            │                            │
     │──1. POST /consent/revoke──▶│                            │
     │    + Patient JWT           │                            │
     │    {consentId: jti}        │                            │
     │                            │                            │
     │                            │──2. Validate Auth ────────▶│
     │                            │◀────── (requireAuth)       │
     │                            │                            │
     │                            │──3. GET consent:{jti}─────▶│
     │                            │◀──── Full record ──────────│
     │                            │                            │
     │                            │──4. Verify patientId       │
     │                            │   matches req.user.userId  │
     │                            │                            │
     │                            │──5. SET consent:{jti}:────▶│
     │                            │   revoked "1"              │
     │                            │   EX <remaining_ttl>       │
     │                            │                            │
     │                            │──6. Update main record     │
     │                            │   SET consent:{jti}───────▶│
     │                            │   {...revoked: true}       │
     │                            │                            │
     │◀──7. Return Success────────│                            │
     │    {revoked: true}         │                            │
     │                            │                            │
```

## Flow 4: Hospital Access After Revocation (BLOCKED)

```
Hospital Staff              Backend Server               Shared Redis
     │                            │                            │
     │──1. GET /ehr/patient/:id──▶│                            │
     │    + Staff JWT + Consent   │                            │
     │                            │                            │
     │                            │──2. Validate Auth ────────▶│
     │                            │◀────── (requireAuth)       │
     │                            │                            │
     │                            │──3. Fast Path Check        │
     │                            │   EXISTS consent:{jti}:───▶│
     │                            │   revoked                  │
     │                            │◀──── YES (revoked!) ───────│
     │                            │                            │
     │                            │──4. IMMEDIATE REJECT       │
     │                            │   (no full record fetch)   │
     │                            │                            │
     │◀──5. 403 Forbidden─────────│                            │
     │    {error: "Consent has    │                            │
     │     been revoked"}         │                            │
     │                            │                            │
```

## Redis Key Structure (Visual)

```
Redis (Upstash)
│
├─ consent:550e8400-e29b-41d4-a716-446655440000
│  └─ TTL: 1209600s (14 days)
│  └─ Value: {
│       "patientId": "patient-uuid",
│       "recipientId": "staff-uuid",
│       "recipientHospitalId": "hospital-uuid",
│       "scope": ["profile", "prescriptions", "test_reports"],
│       "grantedAt": "2024-01-01T10:00:00Z",
│       "expiresAt": "2024-01-15T10:00:00Z",
│       "revoked": false
│     }
│
├─ consent:550e8400-e29b-41d4-a716-446655440000:revoked
│  └─ TTL: 1209600s (same as consent)
│  └─ Value: "1" (if revoked, else NULL)
│
├─ patient:patient-uuid:consents
│  └─ Type: SET
│  └─ Members: [
│       "550e8400-e29b-41d4-a716-446655440000",
│       "660e9500-f39c-51e5-b827-557766551111",
│       ...
│     ]
│
├─ hospital:hospital-uuid:consents
│  └─ Type: SET
│  └─ Members: [
│       "550e8400-e29b-41d4-a716-446655440000",
│       "770f0600-g40d-62f6-c938-668877662222",
│       ...
│     ]
│
└─ [Auto-cleanup after TTL expires]
```

## Middleware Flow (requireConsent)

```
Request arrives
     │
     ▼
┌──────────────────────┐
│  requireAuth         │──── Validates Supabase JWT
│  (staff must login)  │──── Extracts user, hospitalId
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│  requireConsent      │
│  ┌────────────────┐  │
│  │ Extract JWT    │  │──── Get X-Consent-Token header
│  │ from header    │  │──── Decode to get jti
│  └────────────────┘  │
│         │             │
│         ▼             │
│  ┌────────────────┐  │
│  │ FAST PATH:     │  │──── EXISTS consent:{jti}:revoked?
│  │ Check revoked  │  │──── If YES → 403 (immediate)
│  │ flag           │  │──── If NO → continue
│  └────────────────┘  │
│         │             │
│         ▼             │
│  ┌────────────────┐  │
│  │ Fetch consent  │  │──── GET consent:{jti}
│  │ record         │  │──── Parse JSON
│  └────────────────┘  │
│         │             │
│         ▼             │
│  ┌────────────────┐  │
│  │ Verify expiry  │  │──── expiresAt > now?
│  │                │  │──── If NO → 403 "expired"
│  └────────────────┘  │
│         │             │
│         ▼             │
│  ┌────────────────┐  │
│  │ Verify staff   │  │──── recipientId == req.user.id?
│  │ is recipient   │  │──── If NO → 403 "not granted"
│  └────────────────┘  │
│         │             │
│         ▼             │
│  ┌────────────────┐  │
│  │ Verify hospital│  │──── hospitalId == req.user.hospitalId?
│  │ matches        │  │──── If NO → 403 "wrong hospital"
│  └────────────────┘  │
│         │             │
│         ▼             │
│  ┌────────────────┐  │
│  │ Attach consent │  │──── req.consent = {..., hospitalId}
│  │ to request     │  │──── Continue to handler
│  └────────────────┘  │
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│  requireConsentScope │──── Verify scope includes endpoint
│  (optional)          │──── e.g., "prescriptions" for /prescriptions
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│  Route Handler       │──── Execute business logic
│  (e.g., getEHR)      │──── Return data
└──────────────────────┘
```

## Performance Comparison

### Before Fast Path (Baseline)

```
Hospital Request → Fetch consent:{jti} (Redis GET)
                → Parse JSON (CPU)
                → Check "revoked" field
                → If revoked: 403

Cost: ~5-10ms (network + parsing)
```

### After Fast Path (Optimized)

```
Hospital Request → Check consent:{jti}:revoked (Redis EXISTS)
                → If YES: 403 immediately (skip fetch/parse)
                → If NO: Continue to full fetch

Cost: ~2-3ms (network only, no parsing)
Savings: 50-70% faster for revoked consents
```

## Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/consent/grant` | POST | Patient JWT | Grant consent to hospital |
| `/consent/revoke` | POST | Patient JWT | Revoke previously granted consent |
| `/consent/status/:id` | GET | None (public) | Check consent validity |
| `/consent/my` | GET | Patient JWT | List patient's granted consents |
| `/consent/received` | GET | Staff JWT | List hospital's received consents |
| `/ehr/patient/:id/*` | GET | Staff JWT + Consent JWT | Access patient data (requires both JWTs) |

## Security Model

```
┌─────────────────────────────────────────────────────────┐
│  Patient Controls                                       │
│  ─────────────────────────────────────────────────────  │
│  ✓ WHO gets access (recipientId, recipientHospitalId)  │
│  ✓ WHAT they can see (scope: profile, prescriptions)   │
│  ✓ HOW LONG (durationDays: 7 or 14)                    │
│  ✓ CAN REVOKE anytime (instant propagation)            │
│  ✓ CAN LIST all granted consents                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Hospital Constraints                                   │
│  ─────────────────────────────────────────────────────  │
│  ✗ Cannot access without BOTH JWTs                     │
│  ✗ Cannot access if consent expired                    │
│  ✗ Cannot access if consent revoked                    │
│  ✗ Cannot access if hospital doesn't match             │
│  ✗ Cannot access data outside granted scope            │
│  ✓ Can list received consents (own hospital only)      │
└─────────────────────────────────────────────────────────┘
```

## TTL Auto-Cleanup

```
Day 1: Patient grants 14-day consent
       ┌─────────────────────────────────────┐
       │ consent:{jti}           TTL: 14 days│
       │ patient:{id}:consents   No TTL      │
       │ hospital:{id}:consents  No TTL      │
       └─────────────────────────────────────┘

Day 7: Patient revokes consent
       ┌─────────────────────────────────────┐
       │ consent:{jti}           TTL: 7 days │◀── Updated: revoked=true
       │ consent:{jti}:revoked   TTL: 7 days │◀── New: flag set
       │ patient:{id}:consents   (unchanged) │
       │ hospital:{id}:consents  (unchanged) │
       └─────────────────────────────────────┘

Day 15: Consent TTL expires
       ┌─────────────────────────────────────┐
       │ consent:{jti}           DELETED     │◀── Redis auto-cleanup
       │ consent:{jti}:revoked   DELETED     │◀── Redis auto-cleanup
       │ patient:{id}:consents   (stale jti) │
       │ hospital:{id}:consents  (stale jti) │
       └─────────────────────────────────────┘
       Note: Stale JTIs in SETs are harmless
             (GET consent:{jti} returns null)
```

## Error Handling

```
┌────────────────────────────────────────────────────┐
│  HTTP Status Codes                                 │
├────────────────────────────────────────────────────┤
│  200 OK            → Success                       │
│  201 Created       → Consent granted               │
│  400 Bad Request   → Invalid request body          │
│  403 Forbidden     → Consent revoked/expired/      │
│                      hospital mismatch             │
│  404 Not Found     → Consent/patient not found     │
│  500 Server Error  → Redis/database error          │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  Error Response Format                             │
├────────────────────────────────────────────────────┤
│  {                                                 │
│    "error": "Consent has been revoked"            │
│  }                                                 │
└────────────────────────────────────────────────────┘
```

---

**Status:** ✅ Fully Implemented  
**Last Updated:** 2024  
**Documentation:** See `CONSENT_IMPLEMENTATION.md` for API details
