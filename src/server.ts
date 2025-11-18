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
import { requireAuth } from './middleware/auth';

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
  recipientHospitalId: z.string().uuid(), // Required for consent scope
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
  const parsed = ConsentGrantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { patientId, recipientId, recipientHospitalId, scope, durationDays } = parsed.data;
  
  // Verify patient is granting consent for themselves
  const authUser = (req as any).user;
  if (!authUser || authUser.userId !== patientId) {
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
    if (consent.patientId !== authUser.userId) {
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
  const patientId = authUser.userId;
  
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

import crypto from 'node:crypto';
