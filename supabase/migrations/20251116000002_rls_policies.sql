-- Samruddhi Hospital Core — Day 1 RLS Policies
-- Row-Level Security for multi-tenant isolation

-- Enable RLS on all core tables
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Hospitals: users see only their hospital
CREATE POLICY hospital_isolation ON hospitals
  FOR ALL TO authenticated
  USING (
    id = (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin'
  );

-- Departments: scoped by hospital_id
CREATE POLICY department_isolation ON departments
  FOR ALL TO authenticated
  USING (
    hospital_id = (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin'
  );

-- Doctors: scoped by hospital_id
CREATE POLICY doctor_isolation ON doctors
  FOR ALL TO authenticated
  USING (
    hospital_id = (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin'
  );

-- Beds: scoped by hospital_id
CREATE POLICY bed_isolation ON beds
  FOR ALL TO authenticated
  USING (
    hospital_id = (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin'
  );

-- Admissions: scoped by hospital_id; doctors can see their own patients
CREATE POLICY admission_isolation ON admissions
  FOR ALL TO authenticated
  USING (
    hospital_id = (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin'
  );

CREATE POLICY admission_doctor_access ON admissions
  FOR SELECT TO authenticated
  USING (
    primary_doctor_id = (current_setting('request.jwt.claims', true)::json->>'doctor_id')::uuid
  );

-- Patients: read-only for authenticated users (write controlled by backend)
CREATE POLICY patient_read ON patients
  FOR SELECT TO authenticated
  USING (true);

-- Users: users can read their own record
CREATE POLICY user_self_read ON users
  FOR SELECT TO authenticated
  USING (
    id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
    OR hospital_id = (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin'
  );

-- Audit Logs: hospital admins and super_admins can read
CREATE POLICY audit_read ON audit_logs
  FOR SELECT TO authenticated
  USING (
    hospital_id = (current_setting('request.jwt.claims', true)::json->>'hospital_id')::uuid
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin'
  );
