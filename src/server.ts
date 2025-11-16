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
import { setConsent, revokeConsent, isConsentValid } from './lib/redis';
import { requireConsent } from './middleware/consent';

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
  scope: z.string().min(3),
  durationDays: z.number().int().positive().max(30).default(7)
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

// Consent grant (JWT + Redis TTL)
app.post('/consent/grant', async (req, res) => {
  const parsed = ConsentGrantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { patientId, recipientId, scope, durationDays } = parsed.data;
  try {
    const exp = Math.floor(Date.now() / 1000) + durationDays * 86400;
    const jti = crypto.randomUUID();
    const token = signConsent({ sub: patientId, aud: recipientId, scope, exp, jti });
    const record = {
      patientId,
      recipientId,
      scope,
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
      revoked: false,
    };
    await setConsent(jti, record as any, durationDays * 86400);
    res.status(201).json({ consentId: jti, consentToken: token, expiresAt: record.expiresAt });
  } catch (e: any) {
    req.log.error({ err: e }, 'consent grant failed');
    res.status(500).json({ error: 'Consent grant failed' });
  }
});

// Consent revoke (Redis)
app.post('/consent/revoke', async (req, res) => {
  const parsed = ConsentRevokeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const ok = await revokeConsent(parsed.data.consentId);
    res.json({ revoked: ok });
  } catch (e: any) {
    req.log.error({ err: e }, 'consent revoke failed');
    res.status(500).json({ error: 'Consent revoke failed' });
  }
});

// EHR read (requires consent middleware)
app.get('/ehr/patient/:id', requireConsent, async (req, res) => {
  const patientId = req.params.id;
  try {
    const { getMongo } = await import('./lib/mongo');
    const db = await getMongo();
    const record = await db.collection('ehr_records').findOne({ patient_id: patientId });
    if (!record) return res.status(404).json({ error: 'EHR record not found' });
    res.json({ access: 'granted', patientId, ehr: record });
  } catch (e: any) {
    req.log.error({ err: e }, 'EHR read failed');
    res.status(500).json({ error: 'EHR read failed' });
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

// Global error handler fallback
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info({ port }, 'Server listening'));

import crypto from 'node:crypto';
