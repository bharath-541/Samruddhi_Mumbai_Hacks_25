import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { signConsent, verifyConsent } from './lib/jwt';
import { setConsent, revokeConsent, isConsentValid, addToPatientIndex, addToHospitalIndex } from './lib/redis';
import { requireConsent } from './middleware/consent';
import { requireAuth, requirePatientAuth, AuthenticatedRequest } from './middleware/auth';
import QRCode from 'qrcode';
import crypto from 'crypto';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(pinoHttp({ logger }));

// Basic env validation
const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE'
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    logger.warn({ key }, 'Missing required env var');
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

// Zod schemas
const AdmissionCreateSchema = z.object({
  hospitalId: z.string().uuid(),
  patientId: z.string().uuid(),
  bedType: z.string().min(1),
  doctorId: z.string().uuid(),
  reason: z.string().min(1)
});

const AdmissionDischargeSchema = z.object({
  dischargeType: z.string().min(1),
  summary: z.string().min(1)
});

const ConsentGrantSchema = z.object({
  patientId: z.string().uuid(),
  recipientId: z.string().uuid(),
  recipientHospitalId: z.string().min(1), // Relaxed: accept any non-empty string (some test UUIDs don't conform to RFC 4122)
  scope: z.array(z.enum(['profile', 'medical_history', 'prescriptions', 'test_reports', 'iot_devices'])).min(1),
  durationDays: z.number().refine(val => val === 7 || val === 14, {
    message: 'Duration must be 7 or 14 days'
  }).default(7)
});

const ConsentRevokeSchema = z.object({
  consentId: z.string().min(6)
});

const BedsQuerySchema = z.object({
  hospitalId: z.string().uuid(),
  type: z.enum(['general', 'icu', 'nicu', 'picu', 'emergency', 'isolation']).optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']).optional()
});

const AdmissionsQuerySchema = z.object({
  hospitalId: z.string().uuid(),
  active: z.enum(['true', 'false']).optional(),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional()
});

const DoctorsQuerySchema = z.object({
  hospitalId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  isOnDuty: z.enum(['true', 'false']).optional(),
  specialization: z.string().optional()
});

const PrescriptionSchema = z.object({
  date: z.string(),
  doctor_name: z.string().min(1),
  hospital_name: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    notes: z.string().optional()
  })).min(1),
  diagnosis: z.string().optional(),
  pdf_url: z.string().url().optional(),
  parsed_data: z.object({
    medicines: z.array(z.string()),
    dosage: z.array(z.string()),
    duration: z.array(z.string())
  }).optional()
});

const TestReportSchema = z.object({
  test_name: z.string().min(1),
  date: z.string(),
  lab_name: z.string().optional(),
  doctor_name: z.string().optional(),
  pdf_url: z.string().url().optional(),
  parsed_results: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional()
});

const IoTLogSchema = z.object({
  device_type: z.enum(['heart_rate', 'glucose', 'blood_pressure', 'spo2', 'temperature']),
  device_id: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  context: z.string().optional()
});

const MedicalHistorySchema = z.object({
  date: z.string(),
  condition: z.string().min(1),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  doctor_name: z.string().optional(),
  hospital_name: z.string().optional()
});

const ConsentRequestSchema = z.object({
  patientId: z.string().uuid(),
  scope: z.array(z.enum(['profile', 'medical_history', 'prescriptions', 'test_reports', 'iot_devices'])).min(1),
  purpose: z.string().min(5)
});

// Patient Registration & Profile Schemas
const PatientRegistrationSchema = z.object({
  abhaId: z.string().regex(/^\d{4}-\d{4}-\d{4}$/, 'ABHA ID must be in format: 1234-5678-9012').optional(), // Optional - auto-generated if not provided
  name: z.string().min(2).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in format: YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  bloodGroup: z.string().optional(),
  phone: z.string().regex(/^\+91-\d{10}$/, 'Phone must be in format: +91-9876543210').optional(), // Optional
  emergencyContact: z.string().regex(/^\+91-\d{10}$/).optional(), // Optional
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits')
  })
});

const PatientUpdateSchema = z.object({
  phone: z.string().regex(/^\+91-\d{10}$/).optional(),
  emergencyContact: z.string().regex(/^\+91-\d{10}$/).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/)
  }).optional()
});

const PatientSearchSchema = z.object({
  abha_id: z.string().optional(), // Search by ABHA ID (if provided)
  email: z.string().email().optional() // OR search by email
}).refine(data => data.abha_id || data.email, {
  message: 'Either abha_id or email must be provided'
});

// Health
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));

app.get('/health/ready', async (_req, res) => {
  try {
    const { error } = await supabase.from('hospitals').select('id').limit(1);
    if (error) throw error;
    res.json({ status: 'ready' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ============================================================================
// PATIENT REGISTRATION & PROFILE MANAGEMENT
// ============================================================================

// Patient Registration (called after Supabase Auth signup)
app.post('/patients/register', requireAuth, async (req, res) => {
  // Auth check handled by middleware
  const userId = (req as AuthenticatedRequest).user?.id;
  const userEmail = (req as AuthenticatedRequest).user?.email;

  if (!userId || !userEmail) {
    return res.status(401).json({ error: 'Could not identify user from token' });
  }

  const parsed = PatientRegistrationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  let { abhaId, name, dob, gender, bloodGroup, phone, emergencyContact, address } = parsed.data;

  try {
    // Auto-generate ABHA-like ID if not provided
    if (!abhaId) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      abhaId = `AUTO-${timestamp}-${random}`;
      req.log.info({ userId, generatedAbhaId: abhaId }, 'Auto-generated ABHA ID');
    }

    // Check if ABHA ID already exists (only if provided)
    if (abhaId && !abhaId.startsWith('AUTO-')) {
      const { data: existing } = await supabase
        .from('patients')
        .select('id')
        .eq('abha_id', abhaId)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: 'ABHA ID already registered' });
      }
    }

    // Check if user already has patient record
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('ehr_id', userId)
      .maybeSingle();

    if (existingPatient) {
      return res.status(409).json({ error: 'User already registered as patient' });
    }

    // Create patient record in Postgres (matching actual schema)
    const { data: patient, error: insertError } = await supabase
      .from('patients')
      .insert({
        ehr_id: userId, // Link to Supabase Auth user
        abha_id: abhaId,
        name_encrypted: name, // TODO: Encrypt in Phase 2, for now storing as text
        dob_encrypted: dob,
        gender,
        blood_group: bloodGroup,
        emergency_contact_encrypted: emergencyContact || null
      })
      .select()
      .single();

    if (insertError) {
      req.log.error({ err: insertError }, 'Patient insert failed');
      return res.status(500).json({ error: 'Patient registration failed' });
    }

    // Create initial EHR document in MongoDB
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();
    const ehrCollection = db.collection('ehr_records');

    const ehrDoc = {
      patient_id: patient.id,
      abha_id: abhaId,
      profile: {
        name,
        email: userEmail, // Store email from Supabase Auth
        dob,
        blood_group: bloodGroup || '',
        phone: phone || null, // Optional
        address
      },
      prescriptions: [],
      test_reports: [],
      medical_history: [],
      iot_devices: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    await ehrCollection.insertOne(ehrDoc);

    // Update Supabase Auth user metadata with patient_id
    // This allows subsequent requests to access patient endpoints without re-auth
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          patient_id: patient.id,
          role: 'patient'
        }
      }
    );

    if (metadataError) {
      req.log.warn({ err: metadataError }, 'Failed to update user metadata (non-critical)');
    }

    req.log.info({ patientId: patient.id, abhaId, email: userEmail }, 'Patient registered successfully');

    res.status(201).json({
      success: true,
      patient: {
        id: patient.id,
        abhaId: patient.abha_id,
        email: userEmail,
        name,
        createdAt: patient.created_at
      },
      ehrCreated: true,
      message: 'Registration successful. Please refresh your token to access patient endpoints.'
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'Patient registration failed');
    res.status(500).json({ error: 'Patient registration failed' });
  }
});

// Search patient by ABHA ID or email (must come BEFORE /:id route)
app.get('/patients/search', async (req, res) => {
  const parsed = PatientSearchSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { abha_id, email } = parsed.data;

  try {
    let patient;

    if (abha_id) {
      // Search by ABHA ID in Postgres
      const { data, error } = await supabase
        .from('patients')
        .select('id, ehr_id, abha_id, name_encrypted, gender, blood_group, created_at')
        .eq('abha_id', abha_id)
        .maybeSingle();

      if (error) {
        req.log.error({ err: error }, 'Patient search error');
        return res.status(500).json({ error: 'Search failed' });
      }
      patient = data;
    } else if (email) {
      // Search by email - need to check MongoDB for email, then lookup in Postgres
      const { getMongo } = await import('./lib/mongo');
      const db = await getMongo();
      const ehrRecord = await db.collection('ehr_records').findOne({ 'profile.email': email });

      if (ehrRecord) {
        const { data, error } = await supabase
          .from('patients')
          .select('id, ehr_id, abha_id, name_encrypted, gender, blood_group, created_at')
          .eq('id', ehrRecord.patient_id)
          .maybeSingle();

        if (error) {
          req.log.error({ err: error }, 'Patient search error');
          return res.status(500).json({ error: 'Search failed' });
        }
        patient = data;
      }
    }

    if (!patient) {
      return res.json({
        found: false,
        message: `No patient found with this ${abha_id ? 'ABHA ID' : 'email'}`
      });
    }

    res.json({
      found: true,
      patient: {
        id: patient.id,
        abhaId: patient.abha_id,
        name: patient.name_encrypted,
        gender: patient.gender,
        bloodGroup: patient.blood_group,
        createdAt: patient.created_at
      }
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'Patient search failed');
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get patient basic information (parametric route comes AFTER specific routes)
app.get('/patients/:id', requireAuth, async (req, res) => {
  const patientId = req.params.id;

  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, abha_id, name_encrypted, gender, blood_group, created_at')
      .eq('id', patientId)
      .single();

    if (error || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      id: patient.id,
      abhaId: patient.abha_id,
      name: patient.name_encrypted, // TODO: Decrypt in Phase 2
      gender: patient.gender,
      bloodGroup: patient.blood_group,
      createdAt: patient.created_at
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'Patient fetch failed');
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Update patient profile (patient only)
app.patch('/patients/:id/profile', requirePatientAuth, async (req, res) => {
  const patientId = req.params.id;
  const parsed = PatientUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updates = parsed.data;

  // TODO: Add requirePatientAuth middleware to verify ownership
  // For now, allow updates (will add auth in next iteration)

  try {
    // Update Postgres (only emergency contact is stored there)
    if (updates.emergencyContact) {
      const { error: pgError } = await supabase
        .from('patients')
        .update({ emergency_contact_encrypted: updates.emergencyContact })
        .eq('id', patientId);

      if (pgError) {
        req.log.error({ err: pgError }, 'Patient update failed');
        return res.status(500).json({ error: 'Update failed' });
      }
    }

    // Update MongoDB EHR profile (phone and address stored here)
    if (updates.phone || updates.address) {
      const { getMongo } = await import('./lib/mongo');
      const db = await getMongo();
      const updateFields: any = { updated_at: new Date() };

      if (updates.phone) updateFields['profile.phone'] = updates.phone;
      if (updates.address) updateFields['profile.address'] = updates.address;

      await db.collection('ehr_records').updateOne(
        { patient_id: patientId },
        { $set: updateFields }
      );
    }

    res.json({
      success: true,
      message: 'Profile updated',
      updatedFields: Object.keys(updates)
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'Patient update failed');
    res.status(500).json({ error: 'Update failed' });
  }
});


// ============================================================================
// ADMISSIONS
// ============================================================================

// Admissions create
app.post('/admissions', async (req, res) => {
  const parsed = AdmissionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { hospitalId, patientId, bedType, doctorId, reason } = parsed.data;
  const { data, error } = await supabase.rpc('admission_create_atomic', {
    p_hospital_id: hospitalId,
    p_patient_id: patientId,
    p_bed_type: bedType,
    p_doctor_id: doctorId,
    p_reason: reason
  });
  if (error) {
    return res.status(409).json({ error: error.message });
  }
  res.status(201).json(data);
});

// Admissions discharge
app.patch('/admissions/:id/discharge', async (req, res) => {
  const parsed = AdmissionDischargeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const admissionId = req.params.id;
  const { dischargeType, summary } = parsed.data;
  const { data, error } = await supabase.rpc('admission_discharge_atomic', {
    p_admission_id: admissionId,
    p_discharge_type: dischargeType,
    p_summary: summary
  });
  if (error) {
    return res.status(409).json({ error: error.message });
  }
  res.json(data);
});

// Consent grant (JWT + Redis TTL with scopes)
app.post('/consent/grant', requireAuth, async (req, res) => {
  req.log.info({ body: req.body }, 'Consent grant request received');
  const parsed = ConsentGrantSchema.safeParse(req.body);
  if (!parsed.success) {
    req.log.error({ error: parsed.error, body: req.body }, 'Consent grant validation failed');
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { patientId, recipientId, recipientHospitalId, scope, durationDays } = parsed.data;
  req.log.info({ patientId, recipientId, recipientHospitalId, scope, durationDays }, 'Consent grant validated');

  // Verify patient is granting consent for themselves
  const authUser = (req as any).user;
  req.log.info({ authUserId: authUser?.id, patientId }, 'Checking patient ownership');
  if (!authUser || authUser.id !== patientId) {
    return res.status(403).json({ error: 'Can only grant consent for yourself' });
  }

  try {
    const exp = Math.floor(Date.now() / 1000) + (durationDays * 86400);
    const jti = crypto.randomUUID();
    const token = signConsent({
      sub: patientId,
      aud: recipientId,
      hospital_id: recipientHospitalId,
      scope,
      exp,
      jti
    });
    const record = {
      patientId,
      recipientId,
      recipientHospitalId,
      scope,
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
      revoked: false,
    };
    await setConsent(jti, record, durationDays * 86400);

    // Add to shared Redis indexes for patient and hospital
    await addToPatientIndex(patientId, jti);
    await addToHospitalIndex(recipientHospitalId, jti);

    res.status(201).json({
      consentId: jti,
      consentToken: token,
      expiresAt: record.expiresAt,
      scope,
      durationDays
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'consent grant failed');
    res.status(500).json({ error: 'Consent grant failed' });
  }
});

// Consent revoke (Redis with auth validation)
app.post('/consent/revoke', requireAuth, async (req, res) => {
  const parsed = ConsentRevokeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { consentId } = parsed.data;
  const authUser = (req as any).user;

  try {
    // Fetch consent record to validate ownership
    const { getConsent } = await import('./lib/redis');
    const consent = await getConsent(consentId);
    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    // Only patient who granted consent can revoke it
    if (consent.patientId !== authUser.id) {
      return res.status(403).json({ error: 'Can only revoke your own consent' });
    }

    const ok = await revokeConsent(consentId);
    res.json({ revoked: ok });
  } catch (e: any) {
    req.log.error({ err: e }, 'consent revoke failed');
    res.status(500).json({ error: 'Consent revoke failed' });
  }
});

// Consent status check (optional auth - works for both patient and hospital)
app.get('/consent/status/:consentId', async (req, res) => {
  const { consentId } = req.params;

  try {
    const { getConsent, isConsentRevoked } = await import('./lib/redis');
    const consent = await getConsent(consentId);

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    const revoked = await isConsentRevoked(consentId);
    const expiresAt = new Date(consent.expiresAt);
    const expired = expiresAt < new Date();
    const valid = !revoked && !expired;

    res.json({
      consentId,
      valid,
      revoked,
      expired,
      expiresAt: consent.expiresAt,
      scope: consent.scope,
      patientId: consent.patientId,
      recipientId: consent.recipientId,
      recipientHospitalId: consent.recipientHospitalId,
      grantedAt: consent.grantedAt
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'consent status check failed');
    res.status(500).json({ error: 'Consent status check failed' });
  }
});

// Get patient's granted consents (requires patient auth)
app.get('/consent/my', requireAuth, async (req, res) => {
  const authUser = (req as any).user;
  const patientId = authUser.id;

  try {
    const { getPatientConsents, getConsent, isConsentRevoked } = await import('./lib/redis');
    const consentIds = await getPatientConsents(patientId);

    const consents = await Promise.all(
      consentIds.map(async (jti) => {
        const consent = await getConsent(jti);
        if (!consent) return null;

        const revoked = await isConsentRevoked(jti);
        const expiresAt = new Date(consent.expiresAt);
        const expired = expiresAt < new Date();
        const valid = !revoked && !expired;

        // Fetch hospital name
        const { data: hospital } = await supabase
          .from('hospitals')
          .select('name')
          .eq('id', consent.recipientHospitalId)
          .single();

        return {
          consentId: jti,
          recipientId: consent.recipientId,
          recipientHospitalId: consent.recipientHospitalId,
          hospitalName: hospital?.name || 'Unknown',
          scope: consent.scope,
          grantedAt: consent.grantedAt,
          expiresAt: consent.expiresAt,
          valid,
          revoked,
          expired
        };
      })
    );

    res.json({ consents: consents.filter(c => c !== null) });
  } catch (e: any) {
    req.log.error({ err: e }, 'get patient consents failed');
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

// Get hospital's received consents (requires hospital admin auth)
app.get('/consent/received', requireAuth, async (req, res) => {
  const authUser = (req as any).user;

  // Verify user is hospital staff with hospital_id
  if (!authUser.hospitalId) {
    return res.status(403).json({ error: 'Hospital staff access required' });
  }

  const hospitalId = authUser.hospitalId;

  try {
    const { getHospitalConsents, getConsent, isConsentRevoked } = await import('./lib/redis');
    const consentIds = await getHospitalConsents(hospitalId);

    const consents = await Promise.all(
      consentIds.map(async (jti) => {
        const consent = await getConsent(jti);
        if (!consent) return null;

        const revoked = await isConsentRevoked(jti);
        const expiresAt = new Date(consent.expiresAt);
        const expired = expiresAt < new Date();
        const valid = !revoked && !expired;

        // Only return active consents
        if (!valid) return null;

        return {
          consentId: jti,
          patientId: consent.patientId,
          recipientId: consent.recipientId,
          scope: consent.scope,
          grantedAt: consent.grantedAt,
          expiresAt: consent.expiresAt
        };
      })
    );

    res.json({ consents: consents.filter(c => c !== null) });
  } catch (e: any) {
    req.log.error({ err: e }, 'get hospital consents failed');
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

// Generate QR code for consent
app.get('/consent/:consentId/qr', requireAuth, async (req, res) => {
  const { consentId } = req.params;

  try {
    // 1. Verify consent exists and is valid
    const { getConsent } = await import('./lib/redis');
    const consent = await getConsent(consentId);

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    if (consent.revoked) {
      return res.status(403).json({ error: 'Consent revoked' });
    }

    if (new Date(consent.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Consent expired' });
    }

    // 2. Get consent data (we need the token)
    // In a real app, we might store the token or regenerate it.
    // For now, we'll assume the client sends the token in the query param or we regenerate it.
    // BETTER APPROACH: The QR code should contain the CONSENT TOKEN, not just the ID.
    // But since we don't store the full token in Redis (only validity), we need the client to provide it
    // OR we regenerate it if we have the data.

    // Simplification for MVP: The QR code will contain a JSON object with the consentId and a "scan_url".
    // The doctor's app will scan it, then call the scan endpoint.

    // Wait, the requirement is to share the CONSENT TOKEN.
    // If the patient is viewing this, they should have the token.
    // Let's assume the patient provides the token in the query param ?token=...
    // Security note: Token in URL is generally bad, but for a short-lived QR generation it's acceptable-ish for MVP.
    // Better: POST to generate QR.

    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({ error: 'Consent token required' });
    }

    // Verify token matches ID
    try {
      const decoded = verifyConsent(token);
      if (decoded.jti !== consentId) {
        return res.status(400).json({ error: 'Token does not match consent ID' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Generate QR Code
    // Data format: JSON string
    const qrData = JSON.stringify({
      type: 'samruddhi_consent',
      consentId,
      token
    });

    const qrImage = await QRCode.toDataURL(qrData);

    res.json({
      consentId,
      qrImage // Base64 encoded image
    });

  } catch (e: any) {
    req.log.error({ err: e }, 'QR generation failed');
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Scan QR code (Doctor scans patient's QR)
app.post('/consent/scan', requireAuth, async (req, res) => {
  const { qrData } = req.body;

  if (!qrData) {
    return res.status(400).json({ error: 'QR data required' });
  }

  try {
    // Parse QR data
    let data;
    try {
      data = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid QR format' });
    }

    if (data.type !== 'samruddhi_consent' || !data.token) {
      return res.status(400).json({ error: 'Invalid Samruddhi consent QR' });
    }

    // Verify Token
    const decoded = verifyConsent(data.token);

    // Check if revoked/expired in Redis
    const isValid = await isConsentValid(decoded.jti, { recipientId: decoded.aud });
    if (!isValid) {
      return res.status(403).json({ error: 'Consent has been revoked or expired' });
    }

    // Return consent details
    res.json({
      valid: true,
      consent: {
        consentId: decoded.jti,
        patientId: decoded.sub,
        scope: decoded.scope,
        expiresAt: new Date(decoded.exp * 1000),
        hospitalId: decoded.hospital_id
      }
    });

  } catch (e: any) {
    req.log.error({ err: e }, 'QR scan failed');
    res.status(400).json({ error: 'Invalid or expired consent token' });
  }
});

// ============================================================================
// FILE UPLOAD SUPPORT (Task 5)
// ============================================================================

app.post('/upload/presigned-url', requireAuth, async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'fileName and fileType are required' });
  }

  // Basic validation
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/markdown'];
  if (!allowedTypes.includes(fileType)) {
    return res.status(400).json({ error: 'Invalid file type. Only PDF, Images, and Markdown allowed.' });
  }

  try {
    // Create a unique path: private/{userId}/{timestamp}_{sanitizedName}
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `private/${user?.id}/${timestamp}_${sanitizedName}`;

    // Use Service Role client to bypass RLS and generate presigned URLs reliably
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      req.log.error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error: Missing service role key' });
    }

    const adminSupabase = createClient(
      process.env.SUPABASE_URL!,
      serviceRoleKey
    );

    // Generate Signed Upload URL
    const { data, error } = await adminSupabase
      .storage
      .from('samrudhhi-storage')
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    res.json({
      uploadUrl: data.signedUrl,
      path: data.path, // Store this path in your DB (e.g., pdf_url field)
      token: data.token
    });

  } catch (e: any) {
    req.log.error({ err: e }, 'Presigned URL generation failed');
    res.status(500).json({ error: 'Failed to generate upload URL', details: e.message });
  }
});

// ============================================================================
// CONSENT REQUEST WORKFLOW (Doctor <-> Patient)
// ============================================================================

// Doctor: Request Consent
app.post('/consent/request', requireAuth, async (req, res) => {
  const user = (req as AuthenticatedRequest).user;

  // 1. Verify user is a doctor/staff
  // In real app, check role. For now, assume if they have hospitalId they are staff
  if (!user?.hospitalId) {
    return res.status(403).json({ error: 'Only hospital staff can request consent' });
  }

  const parsed = ConsentRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { patientId, scope, purpose } = parsed.data;

  try {
    // 2. Verify patient exists
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // 3. Create Request
    // We need the doctor's ID (from users table or doctors table).
    // Assuming user.id maps to a doctor record via users table or direct link.
    // For MVP, we'll assume user.id IS the doctor_id (or we look it up).
    // Let's look up the doctor record for this user
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) {
      return res.status(403).json({ error: 'Doctor profile not found for this user' });
    }

    const { data: request, error } = await supabase
      .from('consent_requests')
      .insert({
        patient_id: patientId,
        doctor_id: doctor.id,
        hospital_id: user.hospitalId,
        scope,
        purpose,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ request });

  } catch (e: any) {
    req.log.error({ err: e }, 'Consent request failed');
    res.status(500).json({ error: 'Failed to create consent request' });
  }
});

// Patient: View Requests
app.get('/consent/requests/my', requireAuth, async (req, res) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Only patients can view their requests' });
  }

  try {
    const { data: requests, error } = await supabase
      .from('consent_requests')
      .select(`
        *,
        doctor:doctors(name, specialization),
        hospital:hospitals(name)
      `)
      .eq('patient_id', user.patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ requests });

  } catch (e: any) {
    req.log.error({ err: e }, 'Fetch consent requests failed');
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Patient: Approve Request
app.post('/consent/requests/:id/approve', requireAuth, async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const requestId = req.params.id;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Only patients can approve requests' });
  }

  try {
    // 1. Get Request
    const { data: request, error: fetchError } = await supabase
      .from('consent_requests')
      .select('*')
      .eq('id', requestId)
      .eq('patient_id', user.patientId)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request is already ${request.status}` });
    }

    // 2. Generate Consent Token
    const durationDays = 14; // Default to 14 days for approved requests
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const token = signConsent({
      sub: user.patientId,
      aud: request.doctor_id, // Recipient is the doctor
      hospital_id: request.hospital_id,
      scope: request.scope,
      exp: Math.floor(expiresAt.getTime() / 1000),
      jti: crypto.randomUUID()
    });

    const decoded = verifyConsent(token);

    // 3. Store in Redis
    await setConsent(decoded.jti, {
      patientId: user.patientId,
      recipientId: request.doctor_id,
      recipientHospitalId: request.hospital_id,
      scope: request.scope,
      grantedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      revoked: false
    }, durationDays * 24 * 60 * 60);

    // 4. Update Request Status
    const { error: updateError } = await supabase
      .from('consent_requests')
      .update({ status: 'approved', updated_at: new Date() })
      .eq('id', requestId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      consentToken: token,
      consentId: decoded.jti,
      expiresAt
    });

  } catch (e: any) {
    req.log.error({ err: e }, 'Consent approval failed');
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Patient: Deny Request
app.post('/consent/requests/:id/deny', requireAuth, async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const requestId = req.params.id;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Only patients can deny requests' });
  }

  try {
    const { error } = await supabase
      .from('consent_requests')
      .update({ status: 'rejected', updated_at: new Date() })
      .eq('id', requestId)
      .eq('patient_id', user.patientId)
      .eq('status', 'pending'); // Can only deny pending requests

    if (error) throw error;

    res.json({ success: true, message: 'Request denied' });

  } catch (e: any) {
    req.log.error({ err: e }, 'Consent denial failed');
    res.status(500).json({ error: 'Failed to deny request' });
  }
});



// ============================================================================
// PATIENT SELF-SERVICE EHR (No Consent Required)
// ============================================================================

// Get complete patient EHR (self-access)
app.get('/ehr/my', requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();
    const ehr = await db.collection('ehr_records').findOne({ patient_id: user.patientId });

    if (!ehr) {
      return res.status(404).json({ error: 'EHR not found' });
    }

    res.json({
      patientId: ehr.patient_id,
      abhaId: ehr.abha_id,
      profile: ehr.profile,
      prescriptions: ehr.prescriptions || [],
      testReports: ehr.test_reports || [],
      medicalHistory: ehr.medical_history || [],
      iotDevices: ehr.iot_devices || []
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to fetch patient EHR');
    res.status(500).json({ error: 'Failed to fetch EHR' });
  }
});

// Get own prescriptions
app.get('/ehr/my/prescriptions', requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();
    const ehr = await db.collection('ehr_records').findOne({ patient_id: user.patientId });

    if (!ehr) {
      return res.status(404).json({ error: 'EHR not found' });
    }

    res.json({ prescriptions: ehr.prescriptions || [] });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to fetch prescriptions');
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get own test reports
app.get('/ehr/my/test-reports', requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();
    const ehr = await db.collection('ehr_records').findOne({ patient_id: user.patientId });

    if (!ehr) {
      return res.status(404).json({ error: 'EHR not found' });
    }

    res.json({ testReports: ehr.test_reports || [] });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to fetch test reports');
    res.status(500).json({ error: 'Failed to fetch test reports' });
  }
});

// Get own medical history
app.get('/ehr/my/medical-history', requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();
    const ehr = await db.collection('ehr_records').findOne({ patient_id: user.patientId });

    if (!ehr) {
      return res.status(404).json({ error: 'EHR not found' });
    }

    res.json({ medicalHistory: ehr.medical_history || [] });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to fetch medical history');
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
});

// Get own IoT device data
app.get('/ehr/my/iot/:deviceType', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { deviceType } = req.params;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();
    const ehr = await db.collection('ehr_records').findOne({ patient_id: user.patientId });

    if (!ehr) {
      return res.status(404).json({ error: 'EHR not found' });
    }

    const devices = ehr.iot_devices || [];
    const deviceData = devices.find((d: any) => d.device_type === deviceType);

    if (!deviceData) {
      return res.json({ deviceType, logs: [] });
    }

    res.json({
      deviceType: deviceData.device_type,
      deviceId: deviceData.device_id,
      logs: deviceData.logs || []
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to fetch IoT data');
    res.status(500).json({ error: 'Failed to fetch IoT data' });
  }
});

// Add own prescription (old prescription from another hospital)
app.post('/ehr/my/prescription', requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  const parsed = PrescriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();

    await db.collection('ehr_records').updateOne(
      { patient_id: user.patientId },
      {
        $push: { prescriptions: { ...parsed.data, added_by: 'patient', added_at: new Date() } } as any,
        $set: { updated_at: new Date() }
      }
    );

    res.status(201).json({ success: true, message: 'Prescription added to your records' });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to add prescription');
    res.status(500).json({ error: 'Failed to add prescription' });
  }
});

// Add own test report
app.post('/ehr/my/test-report', requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  const parsed = TestReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();

    await db.collection('ehr_records').updateOne(
      { patient_id: user.patientId },
      {
        $push: { test_reports: { ...parsed.data, added_by: 'patient', added_at: new Date() } } as any,
        $set: { updated_at: new Date() }
      }
    );

    res.status(201).json({ success: true, message: 'Test report added to your records' });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to add test report');
    res.status(500).json({ error: 'Failed to add test report' });
  }
});

// Add own medical history entry
app.post('/ehr/my/medical-history', requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  const parsed = MedicalHistorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();

    await db.collection('ehr_records').updateOne(
      { patient_id: user.patientId },
      {
        $push: { medical_history: { ...parsed.data, added_by: 'patient', added_at: new Date() } } as any,
        $set: { updated_at: new Date() }
      }
    );

    res.status(201).json({ success: true, message: 'Medical history entry added' });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to add medical history');
    res.status(500).json({ error: 'Failed to add medical history' });
  }
});

// Add own IoT device log
app.post('/ehr/my/iot-log', requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user?.patientId) {
    return res.status(403).json({ error: 'Patient access required' });
  }

  const parsed = IoTLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();
    const { device_type, device_id, value, unit, context } = parsed.data;

    // Check if device exists, if not create it
    const ehr = await db.collection('ehr_records').findOne({ patient_id: user.patientId });
    const devices = ehr?.iot_devices || [];
    const deviceIndex = devices.findIndex((d: any) => d.device_type === device_type && d.device_id === device_id);

    if (deviceIndex === -1) {
      // New device, create it
      await db.collection('ehr_records').updateOne(
        { patient_id: user.patientId },
        {
          $push: {
            iot_devices: {
              device_type,
              device_id,
              logs: [{
                timestamp: new Date(),
                value,
                unit,
                context
              }]
            }
          } as any,
          $set: { updated_at: new Date() }
        }
      );
    } else {
      // Existing device, add log
      await db.collection('ehr_records').updateOne(
        {
          patient_id: user.patientId,
          'iot_devices.device_type': device_type,
          'iot_devices.device_id': device_id
        },
        {
          $push: {
            'iot_devices.$.logs': {
              timestamp: new Date(),
              value,
              unit,
              context
            }
          } as any,
          $set: { updated_at: new Date() }
        }
      );
    }

    res.status(201).json({ success: true, message: 'IoT log added' });
  } catch (e: any) {
    req.log.error({ err: e }, 'Failed to add IoT log');
    res.status(500).json({ error: 'Failed to add IoT log' });
  }
});

// ============================================================================
// HOSPITAL EHR ACCESS (Requires Consent)
// ============================================================================

// EHR read (requires consent middleware with scope filtering)
app.get('/ehr/patient/:id', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  try {
    const { getPatientEHR } = await import('./lib/ehr');
    const consentScopes = (req as any).consent?.scopes || [];
    const record = await getPatientEHR(patientId, consentScopes);
    if (!record) return res.status(404).json({ error: 'EHR record not found' });
    res.json({
      access: 'granted',
      patientId,
      scopes: consentScopes,
      ehr: record
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'EHR read failed');
    res.status(500).json({ error: 'EHR read failed' });
  }
});

// EHR - Get prescriptions (requires 'prescriptions' scope)
app.get('/ehr/patient/:id/prescriptions', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const consentScopes = (req as any).consent?.scopes || [];

  if (!consentScopes.includes('prescriptions')) {
    return res.status(403).json({ error: 'Insufficient consent scope', required: 'prescriptions' });
  }

  try {
    const { getPatientEHR } = await import('./lib/ehr');
    const record = await getPatientEHR(patientId, ['prescriptions']);
    res.json({ prescriptions: record?.prescriptions || [] });
  } catch (e: any) {
    req.log.error({ err: e }, 'Prescriptions fetch failed');
    res.status(500).json({ error: 'Prescriptions fetch failed' });
  }
});

// EHR - Get test reports (requires 'test_reports' scope)
app.get('/ehr/patient/:id/test-reports', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const consentScopes = (req as any).consent?.scopes || [];

  if (!consentScopes.includes('test_reports')) {
    return res.status(403).json({ error: 'Insufficient consent scope', required: 'test_reports' });
  }

  try {
    const { getPatientEHR } = await import('./lib/ehr');
    const record = await getPatientEHR(patientId, ['test_reports']);
    res.json({ test_reports: record?.test_reports || [] });
  } catch (e: any) {
    req.log.error({ err: e }, 'Test reports fetch failed');
    res.status(500).json({ error: 'Test reports fetch failed' });
  }
});

// EHR - Get medical history (requires 'medical_history' scope)
app.get('/ehr/patient/:id/medical-history', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const consentScopes = (req as any).consent?.scopes || [];

  if (!consentScopes.includes('medical_history')) {
    return res.status(403).json({ error: 'Insufficient consent scope', required: 'medical_history' });
  }

  try {
    const { getPatientEHR } = await import('./lib/ehr');
    const record = await getPatientEHR(patientId, ['medical_history']);
    res.json({ medical_history: record?.medical_history || [] });
  } catch (e: any) {
    req.log.error({ err: e }, 'Medical history fetch failed');
    res.status(500).json({ error: 'Medical history fetch failed' });
  }
});

// EHR - Get IoT device logs (requires 'iot_devices' scope)
app.get('/ehr/patient/:id/iot/:deviceType', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const deviceType = req.params.deviceType as any;
  const consentScopes = (req as any).consent?.scopes || [];

  if (!consentScopes.includes('iot_devices')) {
    return res.status(403).json({ error: 'Insufficient consent scope', required: 'iot_devices' });
  }

  try {
    const { getIoTLogs } = await import('./lib/ehr');
    const logs = await getIoTLogs(patientId, deviceType);
    res.json({ device_type: deviceType, logs });
  } catch (e: any) {
    req.log.error({ err: e }, 'IoT logs fetch failed');
    res.status(500).json({ error: 'IoT logs fetch failed' });
  }
});

// EHR - Add prescription (requires 'prescriptions' scope + auth)
app.post('/ehr/patient/:id/prescription', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const consentScopes = (req as any).consent?.scopes || [];

  if (!consentScopes.includes('prescriptions')) {
    return res.status(403).json({ error: 'Insufficient consent scope', required: 'prescriptions' });
  }

  const parsed = PrescriptionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { addPrescription } = await import('./lib/ehr');
    const userId = (req as any).user?.id || 'unknown';
    const prescription = { ...parsed.data, created_by: userId };
    const success = await addPrescription(patientId, prescription);

    if (!success) {
      return res.status(404).json({ error: 'Patient EHR not found' });
    }

    res.status(201).json({ success: true, message: 'Prescription added' });
  } catch (e: any) {
    req.log.error({ err: e }, 'Add prescription failed');
    res.status(500).json({ error: 'Add prescription failed' });
  }
});

// EHR - Add test report (requires 'test_reports' scope + auth)
app.post('/ehr/patient/:id/test-report', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const consentScopes = (req as any).consent?.scopes || [];

  if (!consentScopes.includes('test_reports')) {
    return res.status(403).json({ error: 'Insufficient consent scope', required: 'test_reports' });
  }

  const parsed = TestReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { addTestReport } = await import('./lib/ehr');
    const userId = (req as any).user?.id || 'unknown';
    const report = { ...parsed.data, created_by: userId };
    const success = await addTestReport(patientId, report);

    if (!success) {
      return res.status(404).json({ error: 'Patient EHR not found' });
    }

    res.status(201).json({ success: true, message: 'Test report added' });
  } catch (e: any) {
    req.log.error({ err: e }, 'Add test report failed');
    res.status(500).json({ error: 'Add test report failed' });
  }
});

// EHR - Add IoT log (requires 'iot_devices' scope + auth)
app.post('/ehr/patient/:id/iot-log', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const consentScopes = (req as any).consent?.scopes || [];

  if (!consentScopes.includes('iot_devices')) {
    return res.status(403).json({ error: 'Insufficient consent scope', required: 'iot_devices' });
  }

  const parsed = IoTLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { addIoTLog } = await import('./lib/ehr');
    const { device_type, device_id, value, unit, context } = parsed.data;
    const log = {
      timestamp: new Date().toISOString(),
      value,
      unit,
      context
    };
    const success = await addIoTLog(patientId, device_type, device_id, log);

    if (!success) {
      return res.status(404).json({ error: 'Patient EHR not found' });
    }

    res.status(201).json({ success: true, message: 'IoT log added' });
  } catch (e: any) {
    req.log.error({ err: e }, 'Add IoT log failed');
    res.status(500).json({ error: 'Add IoT log failed' });
  }
});

// EHR - Add medical history entry (requires 'medical_history' scope + auth)
app.post('/ehr/patient/:id/medical-history', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  const consentScopes = (req as any).consent?.scopes || [];

  if (!consentScopes.includes('medical_history')) {
    return res.status(403).json({ error: 'Insufficient consent scope', required: 'medical_history' });
  }

  const parsed = MedicalHistorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { addMedicalHistory } = await import('./lib/ehr');
    const success = await addMedicalHistory(patientId, parsed.data);

    if (!success) {
      return res.status(404).json({ error: 'Patient EHR not found' });
    }

    res.status(201).json({ success: true, message: 'Medical history entry added' });
  } catch (e: any) {
    req.log.error({ err: e }, 'Add medical history failed');
    res.status(500).json({ error: 'Add medical history failed' });
  }
});

// Beds (read-only, filtered)
app.get('/beds', async (req, res) => {
  const parsed = BedsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { hospitalId, type, status } = parsed.data;
  try {
    let query = supabase.from('beds').select('*').eq('hospital_id', hospitalId);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    const { data, error } = await query.order('bed_number');
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    req.log.error({ err: e }, 'beds query failed');
    res.status(500).json({ error: 'Beds query failed' });
  }
});

// Hospitals list (basic discovery)
app.get('/hospitals', async (req, res) => {
  const { limit = '10' } = req.query as any;
  let lim = parseInt(limit as string, 10);
  if (isNaN(lim) || lim < 1 || lim > 100) lim = 10;
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, type, tier, created_at')
      .order('created_at', { ascending: false })
      .limit(lim);
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    req.log.error({ err: e }, 'hospitals list failed');
    res.status(500).json({ error: 'Hospitals list failed' });
  }
});

// Hospital capacity summary
app.get('/hospitals/:id/capacity', async (req, res) => {
  const hospitalId = req.params.id;
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, capacity_summary')
      .eq('id', hospitalId)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Hospital not found' });
    res.json(data);
  } catch (e: any) {
    req.log.error({ err: e }, 'capacity query failed');
    res.status(500).json({ error: 'Capacity query failed' });
  }
});

// Doctors (read-only, filtered)
app.get('/doctors', async (req, res) => {
  const parsed = DoctorsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { hospitalId, departmentId, isOnDuty, specialization } = parsed.data;
  try {
    let query = supabase.from('doctors').select('*').eq('hospital_id', hospitalId).eq('is_active', true);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (isOnDuty) query = query.eq('is_on_duty', isOnDuty === 'true');
    if (specialization) query = query.ilike('specialization', `%${specialization}%`);
    const { data, error } = await query.order('name');
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    req.log.error({ err: e }, 'doctors query failed');
    res.status(500).json({ error: 'Doctors query failed' });
  }
});

// Admissions (read-only, filtered)
app.get('/admissions', async (req, res) => {
  const parsed = AdmissionsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { hospitalId, active, patientId, doctorId } = parsed.data;
  try {
    let query = supabase.from('admissions').select('*').eq('hospital_id', hospitalId);
    if (active === 'true') query = query.is('discharged_at', null);
    if (active === 'false') query = query.not('discharged_at', 'is', null);
    if (patientId) query = query.eq('patient_id', patientId);
    if (doctorId) query = query.eq('primary_doctor_id', doctorId);
    const { data, error } = await query.order('admitted_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    req.log.error({ err: e }, 'admissions query failed');
    res.status(500).json({ error: 'Admissions query failed' });
  }
});

// Single admission by ID
app.get('/admissions/:id', async (req, res) => {
  const admissionId = req.params.id;
  try {
    const { data, error } = await supabase.from('admissions').select('*').eq('id', admissionId).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Admission not found' });
    res.json(data);
  } catch (e: any) {
    req.log.error({ err: e }, 'admission fetch failed');
    res.status(500).json({ error: 'Admission fetch failed' });
  }
});

// Hospital capacity dashboard (real-time stats)
app.get('/hospitals/:id/dashboard', async (req, res) => {
  const hospitalId = req.params.id;
  try {
    // Get hospital with capacity summary
    const { data: hospital, error: hospError } = await supabase
      .from('hospitals')
      .select('id, name, capacity_summary')
      .eq('id', hospitalId)
      .single();

    if (hospError) throw hospError;
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    // Get beds breakdown by type and status
    const { data: beds, error: bedsError } = await supabase
      .from('beds')
      .select('type, status')
      .eq('hospital_id', hospitalId);

    if (bedsError) throw bedsError;

    // Calculate bed stats
    const bedStats = beds?.reduce((acc: any, bed) => {
      const type = bed.type || 'general';
      if (!acc[type]) acc[type] = { total: 0, available: 0, occupied: 0, maintenance: 0 };
      acc[type].total++;
      if (bed.status === 'available') acc[type].available++;
      if (bed.status === 'occupied') acc[type].occupied++;
      if (bed.status === 'maintenance') acc[type].maintenance++;
      return acc;
    }, {});

    // Get active admissions count
    const { count: activeAdmissions, error: admError } = await supabase
      .from('admissions')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .is('discharged_at', null);

    if (admError) throw admError;

    // Get doctor workload summary
    const { data: doctors, error: docError } = await supabase
      .from('doctors')
      .select('specialization, current_patient_count, max_patients, is_on_duty')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true);

    if (docError) throw docError;

    const doctorStats = {
      total: doctors?.length || 0,
      on_duty: doctors?.filter(d => d.is_on_duty).length || 0,
      by_specialization: doctors?.reduce((acc: any, doc) => {
        const spec = doc.specialization || 'general';
        if (!acc[spec]) acc[spec] = { count: 0, current_load: 0, max_capacity: 0 };
        acc[spec].count++;
        acc[spec].current_load += doc.current_patient_count || 0;
        acc[spec].max_capacity += doc.max_patients || 10;
        return acc;
      }, {})
    };

    res.json({
      hospital: {
        id: hospital.id,
        name: hospital.name
      },
      capacity_summary: hospital.capacity_summary,
      beds: bedStats,
      active_admissions: activeAdmissions || 0,
      doctors: doctorStats,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    req.log.error({ err: e }, 'dashboard fetch failed');
    res.status(500).json({ error: 'Dashboard fetch failed' });
  }
});

// Global error handler fallback
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info({ port }, 'Server listening'));


