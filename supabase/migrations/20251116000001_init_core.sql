-- Samruddhi Hospital Core — Day 1 Migration
-- Core tables: hospitals, departments, doctors, beds, admissions, users

-- 1. Users (authentication & authorization)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'hospital_admin', 'doctor', 'nurse', 'staff')),
  hospital_id UUID, -- FK added after hospitals table
  linked_entity_id UUID,
  linked_entity_type TEXT CHECK (linked_entity_type IN ('doctor', 'staff')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_hospital_role ON users(hospital_id, role);

-- 2. Hospitals
CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  type TEXT CHECK (type IN ('government', 'private', 'trust')),
  tier TEXT CHECK (tier IN ('primary', 'secondary', 'tertiary')),
  address JSONB,
  coordinates POINT,
  contact_phone TEXT,
  contact_email TEXT,
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  capacity_summary JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_hospitals_coordinates ON hospitals USING GIST(coordinates);
CREATE INDEX idx_hospitals_capacity ON hospitals USING GIN(capacity_summary);

-- Add FK from users to hospitals
ALTER TABLE users ADD CONSTRAINT fk_users_hospital
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;

-- 3. Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  floor_number INT,
  head_doctor_id UUID, -- FK added after doctors
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, code)
);

CREATE INDEX idx_departments_hospital ON departments(hospital_id);

-- 4. Doctors
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  specialization TEXT,
  qualification TEXT[],
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  contact_phone TEXT,
  contact_email TEXT,
  shift_pattern JSONB,
  is_on_duty BOOLEAN DEFAULT false,
  max_patients INT DEFAULT 10,
  current_patient_count INT DEFAULT 0 CHECK (current_patient_count >= 0),
  is_active BOOLEAN DEFAULT true,
  hired_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX idx_doctors_department ON doctors(department_id);
CREATE INDEX idx_doctors_on_duty ON doctors(is_on_duty, is_active) WHERE is_active = true;

-- Add FK from departments to doctors
ALTER TABLE departments ADD CONSTRAINT fk_departments_head_doctor
  FOREIGN KEY (head_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- 5. Patients (minimal PII)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ehr_id UUID,
  abha_id TEXT UNIQUE,
  name_encrypted BYTEA,
  dob_encrypted BYTEA,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_group TEXT,
  emergency_contact_encrypted BYTEA,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_abha ON patients(abha_id);
CREATE INDEX idx_patients_ehr ON patients(ehr_id);

-- 6. Beds
CREATE TABLE beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('general', 'icu', 'nicu', 'picu', 'emergency', 'isolation')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  floor_number INT,
  room_number TEXT,
  features TEXT[],
  current_admission_id UUID, -- FK added after admissions
  last_occupied_at TIMESTAMPTZ,
  last_cleaned_at TIMESTAMPTZ,
  maintenance_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, bed_number)
);

CREATE INDEX idx_beds_hospital_status_type ON beds(hospital_id, status, type);
CREATE INDEX idx_beds_available ON beds(hospital_id, status, type) WHERE status = 'available';

-- 7. Admissions
CREATE TABLE admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT UNIQUE NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
  primary_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  admission_type TEXT CHECK (admission_type IN ('emergency', 'planned', 'transfer')),
  reason TEXT NOT NULL,
  diagnosis TEXT,
  severity TEXT CHECK (severity IN ('critical', 'serious', 'stable')),
  admitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_discharge_at TIMESTAMPTZ,
  discharged_at TIMESTAMPTZ,
  discharge_summary TEXT,
  discharge_type TEXT CHECK (discharge_type IN ('normal', 'against_advice', 'transferred', 'deceased')),
  transferred_to_hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  billing_status TEXT DEFAULT 'pending' CHECK (billing_status IN ('pending', 'partial', 'paid')),
  total_cost DECIMAL(10,2),
  insurance_claim_id TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admissions_hospital_date ON admissions(hospital_id, admitted_at DESC);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_active ON admissions(hospital_id, admitted_at DESC) WHERE discharged_at IS NULL;
CREATE INDEX idx_admissions_doctor ON admissions(primary_doctor_id);

-- Add FK from beds to admissions
ALTER TABLE beds ADD CONSTRAINT fk_beds_admission
  FOREIGN KEY (current_admission_id) REFERENCES admissions(id) ON DELETE SET NULL;

-- Constraint: bed occupied => admission linked
ALTER TABLE beds ADD CONSTRAINT chk_bed_occupied_admission
  CHECK (status != 'occupied' OR current_admission_id IS NOT NULL);

-- 8. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_hospital_date ON audit_logs(hospital_id, created_at DESC);
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_changes ON audit_logs USING GIN(changes);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_hospitals_updated_at BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_beds_updated_at BEFORE UPDATE ON beds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_admissions_updated_at BEFORE UPDATE ON admissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
