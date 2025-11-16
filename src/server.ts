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
  durationMinutes: z.number().int().positive().max(240)
});

const ConsentRevokeSchema = z.object({
  consentId: z.string().min(6)
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

// Consent grant (stub logic)
app.post('/consent/grant', async (req, res) => {
  const parsed = ConsentGrantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  // TODO: issue consent JWT & store in Redis
  res.status(201).json({ stub: true, message: 'Consent grant not yet implemented' });
});

// Consent revoke (stub)
app.post('/consent/revoke', async (req, res) => {
  const parsed = ConsentRevokeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  // TODO: revoke in Redis
  res.json({ stub: true, message: 'Consent revoke not yet implemented' });
});

// EHR read (stub)
app.get('/ehr/patient/:id', async (req, res) => {
  const consentToken = req.header('X-Consent-Token');
  if (!consentToken) return res.status(401).json({ error: 'Missing consent token' });
  // TODO: validate staff JWT + consent token + Redis + fetch Mongo record
  res.json({ stub: true, patientId: req.params.id });
});

// Global error handler fallback
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info({ port }, 'Server listening'));
