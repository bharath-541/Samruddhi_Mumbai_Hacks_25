# TASK 3: QR Code Generation for Consent Sharing

**Priority:** 🔴 CRITICAL (UX Essential)  
**Effort:** 2 hours  
**Dependencies:** None (works with existing consent system)  
**Status:** 📋 Planned

---

## 📝 Overview

**Problem:** Currently, consent tokens must be manually copied and pasted. This is impractical for hospital-patient interaction.

**Solution:** Generate QR codes containing consent tokens that patients can show and staff can scan.

---

## 🎯 Goals

1. Auto-generate QR code when consent is granted
2.

 Patient can retrieve QR code for any active consent
3. Hospital staff can scan QR code to extract consent token
4. QR codes contain all necessary information (token, expiry, patient ID)

---

## 📦 Dependencies

### NPM Packages

```bash
npm install qrcode @types/qrcode
```

**Package:** `qrcode` v1.5.x
- Pure JavaScript QR code generator
- Works in Node.js (server-side)
- Outputs base64, data URL, or buffer

---

## 🔌 API Endpoints

### 1. GET /consent/:id/qr

**Description:** Generate QR code for consent token

**Authentication:** `requirePatientAuth` (Patient JWT)

**Authorization:** Patient must own the consent

**Path Parameters:**
- `id` - Consent ID (jti)

**Query Parameters:**
- `format` (optional) - `dataurl` | `base64` | `png` (default: `dataurl`)
- `size` (optional) - QR code size in pixels (default: `300`)

**Response (200 OK):**
```json
{
  "consentId": "uuid",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "format": "dataurl",
  "expiresAt": "2024-01-29T10:30:00Z"
}
```

**QR Code Content (Encoded as JSON string):**
```json
{
  "type": "samruddhi_consent",
  "version": "1.0",
  "consentId": "uuid",
  "consentToken": "eyJhbGciOiJIUzI1NiIs...",
  "patientId": "uuid",
  "scope": ["prescriptions", "test_reports"],
  "expiresAt": "2024-01-29T10:30:00Z",
  "grantedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `404` - Consent not found
- `403` - Patient does not own this consent
- `410` - Consent expired or revoked

**Implementation:**
```typescript
import QRCode from 'qrcode';

app.get('/consent/:id/qr', requirePatientAuth, async (req, res) => {
  const consentId = req.params.id;
  const format = (req.query.format as string) || 'dataurl';
  const size = parseInt(req.query.size as string) || 300;
  
  // 1. Fetch consent from Redis
  const { getConsent, isConsentRevoked } = await import('./lib/redis');
  const consent = await getConsent(consentId);
  
  if (!consent) {
    return res.status(404).json({ error: 'Consent not found' });
  }
  
  // 2. Verify patient owns this consent
  const patientId = (req as any).user.patient_id;
  if (consent.patientId !== patientId) {
    return res.status(403).json({ error: 'You do not own this consent' });
  }
  
  // 3. Check if revoked
  const revoked = await isConsentRevoked(consentId);
  if (revoked) {
    return res.status(410).json({ error: 'Consent has been revoked' });
  }
  
  // 4. Check if expired
  const expiresAt = new Date(consent.expiresAt);
  if (expiresAt < new Date()) {
    return res.status(410).json({ error: 'Consent has expired' });
  }
  
  // 5. Get consent token (regenerate or fetch from Redis if stored)
  const { signConsent } = await import('./lib/jwt');
  const consentToken = signConsent({
    sub: consent.patientId,
    aud: consent.recipientId,
    hospital_id: consent.recipientHospitalId,
    scope: consent.scope,
    exp: Math.floor(expiresAt.getTime() / 1000),
    jti: consentId
  });
  
  // 6. Create QR payload
  const qrPayload = JSON.stringify({
    type: 'samruddhi_consent',
    version: '1.0',
    consentId,
    consentToken,
    patientId: consent.patientId,
    scope: consent.scope,
    expiresAt: consent.expiresAt,
    grantedAt: consent.grantedAt
  });
  
  // 7. Generate QR code
  let qrCode: string;
  try {
    if (format === 'dataurl') {
      qrCode = await QRCode.toDataURL(qrPayload, { width: size });
    } else if (format === 'base64') {
      const buffer = await QRCode.toBuffer(qrPayload, { width: size });
      qrCode = buffer.toString('base64');
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }
  } catch (e: any) {
    req.log.error({ err: e }, 'QR generation failed');
    return res.status(500).json({ error: 'QR generation failed' });
  }
  
  res.json({
    consentId,
    qrCode,
    format,
    expiresAt: consent.expiresAt
  });
});
```

---

### 2. POST /consent/scan

**Description:** Decode and validate QR code data

**Authentication:** `requireAuth` (Staff JWT)

**Use Case:** Hospital staff scans patient's QR code

**Request:**
```json
{
  "qrData": "{\"type\":\"samruddhi_consent\",\"consentId\":\"...\",\"consentToken\":\"eyJ...\"}"
}
```

**Validation:**
```typescript
const QRScanSchema = z.object({
  qrData: z.string().min(10)
});
```

**Response (200 OK):**
```json
{
  "valid": true,
  "consent": {
    "consentId": "uuid",
    "consentToken": "eyJhbGci...",
    "patientId": "uuid",
    "scope": ["prescriptions", "test_reports"],
    "expiresAt": "2024-01-29T10:30:00Z",
    "remainingTime": "13 days 5 hours"
  },
  "patient": {
    "id": "uuid",
    "abhaId": "1234-5678-9012",
    "name": "Rajesh Kumar"
  }
}
```

**Response (403 Forbidden - Revoked):**
```json
{
  "valid": false,
  "error": "Consent has been revoked",
  "consentId": "uuid"
}
```

**Implementation:**
```typescript
app.post('/consent/scan', requireAuth, async (req, res) => {
  const parsed = QRScanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  
  const { qrData } = parsed.data;
  
  // 1. Parse QR data
  let payload: any;
  try {
    payload = JSON.parse(qrData);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid QR data format' });
  }
  
  // 2. Validate payload structure
  if (payload.type !== 'samruddhi_consent' || !payload.consentToken) {
    return res.status(400).json({ error: 'Not a valid Samruddhi consent QR code' });
  }
  
  // 3. Validate consent token (signature + expiry)
  const { verifyConsent } = await import('./lib/jwt');
  let decodedToken;
  try {
    decodedToken = verifyConsent(payload.consentToken);
  } catch (e) {
    return res.status(403).json({ 
      valid: false,
      error: 'Consent token invalid or expired' 
    });
  }
  
  // 4. Check revocation in Redis
  const { isConsentRevoked, getConsent } = await import('./lib/redis');
  const revoked = await isConsentRevoked(payload.consentId);
  if (revoked) {
    return res.status(403).json({
      valid: false,
      error: 'Consent has been revoked',
      consentId: payload.consentId
    });
  }
  
  // 5. Fetch full consent record
  const consent = await getConsent(payload.consentId);
  if (!consent) {
    return res.status(404).json({ 
      valid: false,
      error: 'Consent not found' 
    });
  }
  
  // 6. Fetch patient info (optional, for display)
  const { data: patient } = await supabase
    .from('patients')
    .select('id, abha_id, name')
    .eq('id', payload.patientId)
    .single();
  
  // 7. Calculate remaining time
  const expiresAt = new Date(consent.expiresAt);
  const now = new Date();
  const remainingMs = expiresAt.getTime() - now.getTime();
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  res.json({
    valid: true,
    consent: {
      consentId: payload.consentId,
      consentToken: payload.consentToken,
      patientId: payload.patientId,
      scope: consent.scope,
      expiresAt: consent.expiresAt,
      remainingTime: `${remainingDays} days ${remainingHours} hours`
    },
    patient: patient || { id: payload.patientId }
  });
});
```

---

### 3. Update POST /consent/grant (Auto-include QR)

**Enhancement:** Auto-generate QR code when consent is granted

**Current Response:**
```json
{
  "consentId": "uuid",
  "consentToken": "eyJ...",
  "expiresAt": "2024-01-29T10:30:00Z",
  "scope": ["prescriptions"],
  "durationDays": 14
}
```

**New Response:**
```json
{
  "consentId": "uuid",
  "consentToken": "eyJ...",
  "expiresAt": "2024-01-29T10:30:00Z",
  "scope": ["prescriptions"],
  "durationDays": 14,
  "qrCode": "data:image/png;base64,iVBORw0KGgo..."  // Auto-generated!
}
```

**Implementation Change:**
```typescript
app.post('/consent/grant', requireAuth, async (req, res) => {
  // ... existing validation and consent creation
  
  // After consent created, generate QR code
  const qrPayload = JSON.stringify({
    type: 'samruddhi_consent',
    version: '1.0',
    consentId: jti,
    consentToken: token,
    patientId,
    scope,
    expiresAt: record.expiresAt,
    grantedAt: record.grantedAt
  });
  
  const qrCode = await QRCode.toDataURL(qrPayload, { width: 300 });
  
  res.status(201).json({ 
    consentId: jti, 
    consentToken: token, 
    expiresAt: record.expiresAt,
    scope,
    durationDays,
    qrCode  // Include QR automatically
  });
});
```

---

## 🧪 Testing

### Test Cases

**1. Generate QR Code for Active Consent**
```bash
# Patient grants consent
CONSENT_RESPONSE=$(curl -X POST http://localhost:3000/consent/grant \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -d '{"patientId":"...", "recipientId":"...", ...}')

CONSENT_ID=$(echo $CONSENT_RESPONSE | jq -r '.consentId')
QR_CODE=$(echo $CONSENT_RESPONSE | jq -r '.qrCode')

# QR code included in response!
echo "QR Code (first 50 chars): ${QR_CODE:0:50}"

# Also fetch separately
curl http://localhost:3000/consent/$CONSENT_ID/qr \
  -H "Authorization: Bearer $PATIENT_JWT"
```

**2. Staff Scans QR Code**
```bash
# Extract qrData from QR code (in real app, camera scanner does this)
# For testing, manually construct payload
QR_DATA='{"type":"samruddhi_consent","consentId":"'$CONSENT_ID'","consentToken":"'$CONSENT_TOKEN'",...}'

curl -X POST http://localhost:3000/consent/scan \
  -H "Authorization: Bearer $STAFF_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"qrData\": $(echo $QR_DATA | jq -R .)}"

# Expected: { "valid": true, "consent": {...}, "patient": {...} }
```

**3. QR Code for Revoked Consent (Error)**
```bash
# Revoke consent
curl -X POST http://localhost:3000/consent/revoke \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -d '{"consentId":"'$CONSENT_ID'"}'

# Try to generate QR
curl http://localhost:3000/consent/$CONSENT_ID/qr \
  -H "Authorization: Bearer $PATIENT_JWT"

# Expected: 410 Gone - "Consent has been revoked"
```

**4. Scan Revoked QR Code (Error)**
```bash
# Staff scans old QR code
curl -X POST http://localhost:3000/consent/scan \
  -H "Authorization: Bearer $STAFF_JWT" \
  -d '{"qrData":"..."}'

# Expected: { "valid": false, "error": "Consent has been revoked" }
```

**5. Patient Cannot Get Another Patient's QR (Security)**
```bash
# Patient A tries to get Patient B's consent QR
curl http://localhost:3000/consent/$PATIENT_B_CONSENT_ID/qr \
  -H "Authorization: Bearer $PATIENT_A_JWT"

# Expected: 403 Forbidden - "You do not own this consent"
```

---

## 🎨 Frontend Integration

### Patient App (React Native / Flutter)

**Display QR Code:**
```javascript
// After granting consent
const response = await fetch('http://api.samruddhi.com/consent/grant', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${patientJWT}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ patientId, recipientId, scope, durationDays })
});

const { consentId, qrCode, expiresAt } = await response.json();

// Display QR code
<Image source={{ uri: qrCode }} style={{ width: 300, height: 300 }} />

// Or refresh QR later
const qrRefresh = await fetch(`http://api.samruddhi.com/consent/${consentId}/qr`, {
  headers: { 'Authorization': `Bearer ${patientJWT}` }
});
```

---

### Hospital Dashboard (React Web)

**Scan QR Code:**
```javascript
import QRScanner from 'react-qr-scanner';

function ConsentScanner() {
  const handleScan = async (data) => {
    if (!data) return;
    
    const qrData = data.text; // Scanned JSON string
    
    const response = await fetch('http://api.samruddhi.com/consent/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${staffJWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ qrData })
    });
    
    const result = await response.json();
    
    if (result.valid) {
      // Store consent token
      sessionStorage.setItem('consentToken', result.consent.consentToken);
      
      // Navigate to patient EHR view
      navigate(`/ehr/patient/${result.patient.id}`);
    } else {
      Alert.error(result.error);
    }
  };
  
  return <QRScanner onScan={handleScan} />;
}
```

---

## ✅ Acceptance Criteria

- [ ] QR code auto-generated when consent is granted
- [ ] QR code retrievable via `/consent/:id/qr`
- [ ] QR code format options: dataurl, base64
- [ ] QR code size customizable (default 300px)
- [ ] Patient cannot get QR for another patient's consent
- [ ] Revoked consents return 410 Gone
- [ ] Staff can scan QR to extract consent token
- [ ] Scan validates token signature and expiry
- [ ] Scan checks revocation status in Redis
- [ ] Scan returns patient info for display
- [ ] Invalid QR data returns 400 Bad Request

---

## 🚀 Implementation Checklist

### Step 1: Install Dependencies (5 min)
- [ ] `npm install qrcode @types/qrcode`
- [ ] Verify installation

### Step 2: Add QR Generation Endpoint (30 min)
- [ ] `GET /consent/:id/qr`
- [ ] Validate patient ownership
- [ ] Check revocation/expiry
- [ ] Generate QR with qrcode package
- [ ] Support multiple formats

### Step 3: Add QR Scan Endpoint (30 min)
- [ ] `POST /consent/scan`
- [ ] Parse and validate QR data
- [ ] Verify consent token
- [ ] Check revocation
- [ ] Return consent + patient info

### Step 4: Update Consent Grant (15 min)
- [ ] Auto-generate QR in `POST /consent/grant`
- [ ] Include in response

### Step 5: Testing (30 min)
- [ ] Test all 5 test cases
- [ ] Verify QR codes scannable with real scanner
- [ ] Test with QR scanner apps (iOS/Android)

### Step 6: Documentation (15 min)
- [ ] Update `API_ENDPOINTS.md`
- [ ] Add QR code examples

**Total Time:** ~2 hours

---

## 📝 Notes

**QR Code Size:**
- 300x300px is optimal for phone screens
- Contains ~500 chars (JWT + metadata)
- QR Code Level: M (15% error correction)

**Security:**
- QR codes contain sensitive consent token
- Should be shown briefly (not screenshots)
- Patient app can regenerate QR anytime

**Offline Support:**
- Patient can cache QR code locally
- Works even if server is unreachable
- Token validation still requires server (Redis check)

**Future Enhancement:**
- Add QR code expiry (shorter than consent expiry)
- One-time QR codes (invalidate after scan)
- QR code analytics (track scan events)

---

**Status:** Ready for implementation ✅  
**Depends On:** None (works with existing consent system)  
**Blocks:** None  
**Next Task:** TASK 4 - Consent Request Workflow
