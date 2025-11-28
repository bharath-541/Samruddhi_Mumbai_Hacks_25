-- Add public read access for hospital discovery and bed availability
-- These endpoints need to be accessible without authentication for:
-- - Patient hospital search
-- - Emergency bed availability checks
-- - Doctor search for new patients

-- Hospitals: Allow public read for active hospitals
CREATE POLICY hospital_public_read ON hospitals
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Departments: Allow public read
CREATE POLICY department_public_read ON departments
  FOR SELECT TO anon, authenticated
  USING (true);

-- Doctors: Allow public read for active, on-duty doctors
CREATE POLICY doctor_public_read ON doctors
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Beds: Allow public read for bed availability
CREATE POLICY bed_public_read ON beds
  FOR SELECT TO anon, authenticated
  USING (true);

-- Admissions: Keep private (already has authenticated-only policies)
-- No public read for admissions

-- Patients: Keep private (already has authenticated-only policy)
-- No public read for patients
