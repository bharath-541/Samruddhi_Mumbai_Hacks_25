# Samruddhi Consent Flow Implementation Guide

This guide details the complete flow for a patient granting consent to a doctor, generating a QR code, and the doctor scanning it to access records.

## 🔄 The 4-Step Consent Flow

1.  **Patient** grants consent to a specific Doctor/Hospital.
2.  **Patient** generates a QR code for that consent.
3.  **Doctor** scans the QR code to validate consent.
4.  **Doctor** uses the consent token to access Patient's EHR.

---

## 📱 Step 1: Patient Grants Consent

**Actor:** Patient App  
**Endpoint:** `POST /consent/grant`  
**Auth:** Bearer Token (Patient)

### Request
```json
POST https://samruddhi-backend.onrender.com/consent/grant
Content-Type: application/json
Authorization: Bearer <patient_access_token>

{
  "patientId": "patient-uuid",          // From patient's profile
  "recipientId": "doctor-uuid",         // The Doctor's User ID (scanned or selected)
  "recipientHospitalId": "hospital-id", // The Hospital's ID
  "scope": [
    "profile", 
    "medical_history", 
    "prescriptions", 
    "test_reports"
  ],
  "durationDays": 7                     // Must be 7 or 14
}
```

### Response
```json
{
  "consentId": "consent-uuid",
  "token": "eyJhbGciOiJIUz..." // <--- SAVE THIS TOKEN!
}
```

---

## 📱 Step 2: Patient Generates QR Code

**Actor:** Patient App  
**Endpoint:** `GET /consent/:consentId/qr`  
**Auth:** Bearer Token (Patient)

### Request
```http
GET https://samruddhi-backend.onrender.com/consent/<consentId>/qr?token=<token_from_step_1>
Authorization: Bearer <patient_access_token>
```

### Response
```json
{
  "consentId": "consent-uuid",
  "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." // Display this image
}
```

---

## 👨‍⚕️ Step 3: Doctor Scans QR Code

**Actor:** Doctor App  
**Endpoint:** `POST /consent/scan`  
**Auth:** Bearer Token (Doctor)

The Doctor's app uses a camera to scan the QR code displayed on the Patient's phone. The QR code contains a JSON string.

### Request
```json
POST https://samruddhi-backend.onrender.com/consent/scan
Content-Type: application/json
Authorization: Bearer <doctor_access_token>

{
  "qrData": "{\"type\":\"samruddhi_consent\",\"consentId\":\"...\",\"token\":\"...\"}" 
  // Send the exact string scanned from the QR code
}
```

### Response
```json
{
  "valid": true,
  "consent": {
    "consentId": "...",
    "patientId": "...",
    "scope": ["profile", "prescriptions", ...],
    "expiresAt": "2025-12-01T..."
  }
}
```

---

## 👨‍⚕️ Step 4: Doctor Accesses EHR Data

**Actor:** Doctor App  
**Endpoint:** `GET /ehr/patient/:patientId/prescriptions` (or other endpoints)  
**Auth:** Bearer Token (Doctor) + **X-Consent-Token**

### Request
```http
GET https://samruddhi-backend.onrender.com/ehr/patient/<patientId>/prescriptions
Authorization: Bearer <doctor_access_token>
X-Consent-Token: <token_from_qr_scan>  <--- CRITICAL HEADER
```

### Response
```json
{
  "prescriptions": [ ... ]
}
```

---

## 💻 Flutter Implementation Tips

### Patient Side: Granting Consent
```dart
Future<String> grantConsent(String doctorId, String hospitalId) async {
  final response = await http.post(
    Uri.parse('$baseUrl/consent/grant'),
    headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
    body: jsonEncode({
      'patientId': currentPatient.id,
      'recipientId': doctorId,
      'recipientHospitalId': hospitalId,
      'scope': ['profile', 'prescriptions'],
      'durationDays': 7
    }),
  );
  
  final data = jsonDecode(response.body);
  return data['token']; // Return the consent token
}
```

### Doctor Side: Fetching Data
```dart
Future<List<Prescription>> fetchPatientPrescriptions(String patientId, String consentToken) async {
  final response = await http.get(
    Uri.parse('$baseUrl/ehr/patient/$patientId/prescriptions'),
    headers: {
      'Authorization': 'Bearer $doctorToken',
      'X-Consent-Token': consentToken, // Pass the token here
    },
  );
  
  // Parse response...
}
```
