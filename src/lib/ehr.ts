 import { Db } from 'mongodb';
import { getMongo } from './mongo';
import {
  PatientEHR,
  PatientProfile,
  Prescription,
  TestReport,
  IoTDeviceType,
  IoTDeviceLog,
  ConsentScope,
  filterEHRByScope,
} from '../types/ehr';

const COLLECTION = 'ehr_records';

/**
 * Create a new patient EHR record
 */
export async function createPatientEHR(
  patientId: string,
  profile: PatientProfile,
  abhaId?: string
): Promise<PatientEHR> {
  const db = await getMongo();
  
  const ehr: PatientEHR = {
    patient_id: patientId,
    abha_id: abhaId,
    profile,
    medical_history: [],
    prescriptions: [],
    test_reports: [],
    iot_devices: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  await db.collection(COLLECTION).insertOne(ehr);
  return ehr;
}

/**
 * Get patient EHR with optional scope filtering
 */
export async function getPatientEHR(
  patientId: string,
  scopes?: ConsentScope[]
): Promise<Partial<PatientEHR> | null> {
  const db = await getMongo();
  const ehr = await db.collection(COLLECTION).findOne({ patient_id: patientId }) as PatientEHR | null;
  
  if (!ehr) return null;

  // Filter by consent scope if provided
  if (scopes && scopes.length > 0) {
    return filterEHRByScope(ehr, scopes);
  }

  return ehr;
}

/**
 * Update patient profile
 */
export async function updatePatientProfile(
  patientId: string,
  profile: Partial<PatientProfile>
): Promise<boolean> {
  const db = await getMongo();
  const result = await db.collection(COLLECTION).updateOne(
    { patient_id: patientId },
    {
      $set: {
        profile,
        updated_at: new Date(),
      },
    }
  );
  return result.modifiedCount > 0;
}

/**
 * Add a prescription to patient EHR
 */
export async function addPrescription(
  patientId: string,
  prescription: Prescription
): Promise<boolean> {
  const db = await getMongo();
  
  const prescriptionWithMeta = {
    ...prescription,
    id: prescription.id || generateId(),
    created_at: new Date().toISOString(),
  };

  const result = await db.collection(COLLECTION).updateOne(
    { patient_id: patientId },
    {
      $push: { prescriptions: prescriptionWithMeta } as any,
      $set: { updated_at: new Date() },
    }
  );
  return result.modifiedCount > 0;
}

/**
 * Add a test report to patient EHR
 */
export async function addTestReport(
  patientId: string,
  report: TestReport
): Promise<boolean> {
  const db = await getMongo();
  
  const reportWithMeta = {
    ...report,
    id: report.id || generateId(),
    created_at: new Date().toISOString(),
  };

  const result = await db.collection(COLLECTION).updateOne(
    { patient_id: patientId },
    {
      $push: { test_reports: reportWithMeta } as any,
      $set: { updated_at: new Date() },
    }
  );
  return result.modifiedCount > 0;
}

/**
 * Add IoT device log entry
 */
export async function addIoTLog(
  patientId: string,
  deviceType: IoTDeviceType,
  deviceId: string,
  log: IoTDeviceLog
): Promise<boolean> {
  const db = await getMongo();
  
  // Check if device exists, if not create it
  const ehr = await db.collection(COLLECTION).findOne({ patient_id: patientId });
  
  if (!ehr) return false;

  const existingDevice = (ehr as any).iot_devices?.find(
    (d: any) => d.device_type === deviceType && d.device_id === deviceId
  );

  if (existingDevice) {
    // Add log to existing device
    const result = await db.collection(COLLECTION).updateOne(
      { 
        patient_id: patientId,
        'iot_devices.device_id': deviceId,
      },
      {
        $push: { 'iot_devices.$.logs': log } as any,
        $set: { updated_at: new Date() },
      }
    );
    return result.modifiedCount > 0;
  } else {
    // Create new device with first log
    const result = await db.collection(COLLECTION).updateOne(
      { patient_id: patientId },
      {
        $push: {
          iot_devices: {
            device_type: deviceType,
            device_id: deviceId,
            logs: [log],
          },
        } as any,
        $set: { updated_at: new Date() },
      }
    );
    return result.modifiedCount > 0;
  }
}

/**
 * Get IoT device logs for specific device type
 */
export async function getIoTLogs(
  patientId: string,
  deviceType: IoTDeviceType
): Promise<IoTDeviceLog[]> {
  const db = await getMongo();
  const ehr = await db.collection(COLLECTION).findOne({ patient_id: patientId });
  
  if (!ehr) return [];

  const device = (ehr as any).iot_devices?.find((d: any) => d.device_type === deviceType);
  return device?.logs || [];
}

/**
 * Add medical history entry
 */
export async function addMedicalHistory(
  patientId: string,
  entry: {
    date: string;
    condition: string;
    treatment?: string;
    notes?: string;
    doctor_name?: string;
    hospital_name?: string;
  }
): Promise<boolean> {
  const db = await getMongo();
  const result = await db.collection(COLLECTION).updateOne(
    { patient_id: patientId },
    {
      $push: { medical_history: entry } as any,
      $set: { updated_at: new Date() },
    }
  );
  return result.modifiedCount > 0;
}

/**
 * Helper to generate short IDs
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
