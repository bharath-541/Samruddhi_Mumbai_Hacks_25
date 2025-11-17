import { Request } from 'express';
import { supabaseAdmin } from './supabase';

export interface AuditLogEntry {
  hospital_id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
}

/**
 * Log an audit event to the audit_logs table
 * Use this for all critical operations: admissions, consent, EHR access
 */
export async function logAudit(
  entry: AuditLogEntry,
  req?: Request
): Promise<boolean> {
  try {
    const auditRecord = {
      hospital_id: entry.hospital_id,
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      changes: entry.changes || {},
      ip_address: entry.ip_address || req?.ip || req?.header('x-forwarded-for') || 'unknown',
      user_agent: entry.user_agent || req?.header('user-agent') || 'unknown',
      request_id: entry.request_id || (req as any)?.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert(auditRecord);

    if (error) {
      console.error('Audit log failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Audit log exception:', error);
    return false;
  }
}

/**
 * Helper to log admission creation
 */
export async function logAdmissionCreate(
  userId: string,
  hospitalId: string,
  admissionId: string,
  admissionData: any,
  req?: Request
) {
  return logAudit({
    user_id: userId,
    hospital_id: hospitalId,
    action: 'admission_create',
    resource_type: 'admission',
    resource_id: admissionId,
    changes: {
      after: admissionData
    }
  }, req);
}

/**
 * Helper to log admission discharge
 */
export async function logAdmissionDischarge(
  userId: string,
  hospitalId: string,
  admissionId: string,
  beforeData: any,
  afterData: any,
  req?: Request
) {
  return logAudit({
    user_id: userId,
    hospital_id: hospitalId,
    action: 'admission_discharge',
    resource_type: 'admission',
    resource_id: admissionId,
    changes: {
      before: beforeData,
      after: afterData
    }
  }, req);
}

/**
 * Helper to log consent grant
 */
export async function logConsentGrant(
  patientId: string,
  recipientId: string,
  consentId: string,
  scope: string[],
  durationDays: number,
  req?: Request
) {
  return logAudit({
    user_id: patientId,
    action: 'consent_grant',
    resource_type: 'consent',
    resource_id: consentId,
    changes: {
      after: {
        recipient_id: recipientId,
        scope,
        duration_days: durationDays
      }
    }
  }, req);
}

/**
 * Helper to log consent revocation
 */
export async function logConsentRevoke(
  patientId: string,
  consentId: string,
  req?: Request
) {
  return logAudit({
    user_id: patientId,
    action: 'consent_revoke',
    resource_type: 'consent',
    resource_id: consentId,
    changes: {
      after: { revoked: true }
    }
  }, req);
}

/**
 * Helper to log EHR access (read)
 */
export async function logEHRAccess(
  staffId: string,
  patientId: string,
  hospitalId: string | undefined,
  accessType: 'full' | 'prescriptions' | 'test_reports' | 'medical_history' | 'iot_devices',
  req?: Request
) {
  return logAudit({
    user_id: staffId,
    hospital_id: hospitalId,
    action: `ehr_read_${accessType}`,
    resource_type: 'ehr',
    resource_id: patientId,
  }, req);
}

/**
 * Helper to log EHR write (prescription, report, etc)
 */
export async function logEHRWrite(
  staffId: string,
  patientId: string,
  hospitalId: string | undefined,
  writeType: 'prescription' | 'test_report' | 'iot_log' | 'medical_history',
  data: any,
  req?: Request
) {
  return logAudit({
    user_id: staffId,
    hospital_id: hospitalId,
    action: `ehr_write_${writeType}`,
    resource_type: 'ehr',
    resource_id: patientId,
    changes: {
      after: data
    }
  }, req);
}
