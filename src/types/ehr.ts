/**
 * Patient EHR Schema Types
 * Stored in MongoDB `ehr_records` collection
 */

export interface PatientProfile {
  name: string;
  dob: string; // ISO date
  blood_group?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  emergency_contact?: {
    name: string;
    relation: string;
    phone: string;
  };
}

export interface MedicalHistoryEntry {
  date: string; // ISO date
  condition: string;
  treatment?: string;
  notes?: string;
  doctor_name?: string;
  hospital_name?: string;
}

export interface Prescription {
  id?: string;
  date: string; // ISO date
  doctor_name: string;
  hospital_name?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }>;
  diagnosis?: string;
  pdf_url?: string; // Supabase Storage or S3 URL
  parsed_data?: {
    medicines: string[];
    dosage: string[];
    duration: string[];
  };
  created_by?: string; // user_id
  created_at?: string;
}

export interface TestReport {
  id?: string;
  test_name: string;
  date: string; // ISO date
  lab_name?: string;
  doctor_name?: string;
  pdf_url?: string;
  parsed_results?: Record<string, any>; // e.g., { "hemoglobin": "14.5", "wbc": "8000" }
  notes?: string;
  created_by?: string;
  created_at?: string;
}

export type IoTDeviceType = 'heart_rate' | 'glucose' | 'blood_pressure' | 'spo2' | 'temperature';

export interface IoTDeviceLog {
  timestamp: string; // ISO timestamp
  value: number;
  unit: string;
  context?: string; // e.g., "resting", "after_exercise", "before_meal"
}

export interface IoTDevice {
  device_type: IoTDeviceType;
  device_id: string;
  device_name?: string;
  logs: IoTDeviceLog[];
}

export interface PatientEHR {
  patient_id: string;
  abha_id?: string;
  profile: PatientProfile;
  medical_history: MedicalHistoryEntry[];
  prescriptions: Prescription[];
  test_reports: TestReport[];
  iot_devices: IoTDevice[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Consent scopes - what data hospital can access
 */
export type ConsentScope = 
  | 'profile'
  | 'medical_history'
  | 'prescriptions'
  | 'test_reports'
  | 'iot_devices';

/**
 * Helper to filter EHR data by consent scope
 */
export function filterEHRByScope(ehr: PatientEHR, scopes: ConsentScope[]): Partial<PatientEHR> {
  const filtered: Partial<PatientEHR> = {
    patient_id: ehr.patient_id,
  };

  if (scopes.includes('profile')) {
    filtered.profile = ehr.profile;
  }

  if (scopes.includes('medical_history')) {
    filtered.medical_history = ehr.medical_history;
  }

  if (scopes.includes('prescriptions')) {
    filtered.prescriptions = ehr.prescriptions;
  }

  if (scopes.includes('test_reports')) {
    filtered.test_reports = ehr.test_reports;
  }

  if (scopes.includes('iot_devices')) {
    filtered.iot_devices = ehr.iot_devices;
  }

  return filtered;
}
