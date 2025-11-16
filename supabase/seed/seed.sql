-- Samruddhi Hospital Core — Seed Data (3 hospitals, beds, doctors)

-- 1. Create super admin user
INSERT INTO users (id, email, password_hash, role, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@samruddhi.health', '$2b$10$dummyhash', 'super_admin', true);

-- 2. Create 3 hospitals
INSERT INTO hospitals (id, name, registration_number, type, tier, address, coordinates, contact_phone, contact_email, admin_user_id, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Apollo Hospital Mumbai', 'MH-APO-2020-001', 'private', 'tertiary',
   '{"street":"Plot No. 13, Parsik Hill Road","city":"Mumbai","state":"Maharashtra","pincode":"400706"}'::jsonb,
   POINT(19.0760, 72.8777), '+91-22-6767-9999', 'contact@apollomumbai.in', '00000000-0000-0000-0000-000000000001', true),
  
  ('22222222-2222-2222-2222-222222222222', 'AIIMS Delhi', 'DL-AIIMS-1956-001', 'government', 'tertiary',
   '{"street":"Ansari Nagar East","city":"New Delhi","state":"Delhi","pincode":"110029"}'::jsonb,
   POINT(28.5672, 77.2100), '+91-11-2658-8500', 'info@aiims.edu', '00000000-0000-0000-0000-000000000001', true),
  
  ('33333333-3333-3333-3333-333333333333', 'Manipal Hospital Bangalore', 'KA-MAN-2015-042', 'private', 'tertiary',
   '{"street":"98, HAL Airport Road","city":"Bangalore","state":"Karnataka","pincode":"560017"}'::jsonb,
   POINT(12.9716, 77.5946), '+91-80-2502-4444', 'contact@manipalhospitals.com', '00000000-0000-0000-0000-000000000001', true);

-- 3. Create departments for Hospital 1 (Apollo Mumbai)
INSERT INTO departments (id, hospital_id, name, code, floor_number, is_active) VALUES
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Cardiology', 'CARD', 3, true),
  ('d1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Emergency', 'EMRG', 1, true),
  ('d1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'ICU', 'ICU', 4, true);

-- Departments for Hospital 2 (AIIMS Delhi)
INSERT INTO departments (id, hospital_id, name, code, floor_number, is_active) VALUES
  ('d2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Neurology', 'NEUR', 5, true),
  ('d2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Oncology', 'ONCO', 6, true),
  ('d2222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'General Surgery', 'GSUR', 2, true);

-- Departments for Hospital 3 (Manipal Bangalore)
INSERT INTO departments (id, hospital_id, name, code, floor_number, is_active) VALUES
  ('d3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Orthopedics', 'ORTH', 3, true),
  ('d3333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'Pediatrics', 'PEDI', 2, true);

-- 4. Create doctors (10 total: 4 for Apollo, 3 for AIIMS, 3 for Manipal)
INSERT INTO doctors (id, hospital_id, name, license_number, specialization, qualification, department_id, contact_phone, is_on_duty, max_patients, is_active) VALUES
  ('doc11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Dr. Anjali Mehta', 'MH-DOC-12345', 'Cardiologist', ARRAY['MBBS','MD'], 'd1111111-1111-1111-1111-111111111111', '+91-98765-43210', true, 12, true),
  ('doc11111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Dr. Rajesh Kumar', 'MH-DOC-12346', 'Emergency Physician', ARRAY['MBBS','DNB'], 'd1111111-1111-1111-1111-111111111112', '+91-98765-43211', true, 15, true),
  ('doc11111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Dr. Priya Singh', 'MH-DOC-12347', 'Intensivist', ARRAY['MBBS','MD','FICCM'], 'd1111111-1111-1111-1111-111111111113', '+91-98765-43212', true, 8, true),
  ('doc11111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'Dr. Vikram Sharma', 'MH-DOC-12348', 'General Physician', ARRAY['MBBS'], 'd1111111-1111-1111-1111-111111111112', false, 10, true),
  
  ('doc22222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Dr. Neha Gupta', 'DL-DOC-56789', 'Neurologist', ARRAY['MBBS','DM'], 'd2222222-2222-2222-2222-222222222221', '+91-98765-11111', true, 10, true),
  ('doc22222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Dr. Amit Verma', 'DL-DOC-56790', 'Oncologist', ARRAY['MBBS','MD','DrNB'], 'd2222222-2222-2222-2222-222222222222', '+91-98765-11112', true, 8, true),
  ('doc22222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222222', 'Dr. Sunita Rao', 'DL-DOC-56791', 'Surgeon', ARRAY['MBBS','MS'], 'd2222222-2222-2222-2222-222222222223', '+91-98765-11113', false, 6, true),
  
  ('doc33333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Dr. Karthik Reddy', 'KA-DOC-98765', 'Orthopedic Surgeon', ARRAY['MBBS','MS Ortho'], 'd3333333-3333-3333-3333-333333333331', '+91-98765-22221', true, 10, true),
  ('doc33333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'Dr. Lakshmi Iyer', 'KA-DOC-98766', 'Pediatrician', ARRAY['MBBS','MD Pediatrics'], 'd3333333-3333-3333-3333-333333333332', '+91-98765-22222', true, 12, true),
  ('doc33333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Dr. Ravi Nair', 'KA-DOC-98767', 'Pediatric Surgeon', ARRAY['MBBS','MS'], 'd3333333-3333-3333-3333-333333333332', '+91-98765-22223', false, 8, true);

-- 5. Create beds (50 per hospital = 150 total)
-- Apollo Mumbai (50 beds)
INSERT INTO beds (hospital_id, bed_number, department_id, type, status, floor_number, room_number)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  'A-' || LPAD(generate_series::text, 3, '0'),
  CASE 
    WHEN generate_series <= 10 THEN 'd1111111-1111-1111-1111-111111111113' -- ICU
    WHEN generate_series <= 25 THEN 'd1111111-1111-1111-1111-111111111112' -- Emergency
    ELSE 'd1111111-1111-1111-1111-111111111111' -- Cardiology
  END,
  CASE 
    WHEN generate_series <= 10 THEN 'icu'
    WHEN generate_series <= 25 THEN 'emergency'
    ELSE 'general'
  END,
  'available',
  CASE 
    WHEN generate_series <= 10 THEN 4
    WHEN generate_series <= 25 THEN 1
    ELSE 3
  END,
  'Room-' || LPAD(((generate_series - 1) / 2 + 1)::text, 3, '0')
FROM generate_series(1, 50);

-- AIIMS Delhi (50 beds)
INSERT INTO beds (hospital_id, bed_number, department_id, type, status, floor_number, room_number)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  'B-' || LPAD(generate_series::text, 3, '0'),
  CASE 
    WHEN generate_series <= 15 THEN 'd2222222-2222-2222-2222-222222222221' -- Neurology
    WHEN generate_series <= 30 THEN 'd2222222-2222-2222-2222-222222222222' -- Oncology
    ELSE 'd2222222-2222-2222-2222-222222222223' -- Surgery
  END,
  CASE 
    WHEN generate_series <= 15 THEN 'icu'
    ELSE 'general'
  END,
  'available',
  CASE 
    WHEN generate_series <= 15 THEN 5
    WHEN generate_series <= 30 THEN 6
    ELSE 2
  END,
  'Room-' || LPAD(((generate_series - 1) / 2 + 1)::text, 3, '0')
FROM generate_series(1, 50);

-- Manipal Bangalore (50 beds)
INSERT INTO beds (hospital_id, bed_number, department_id, type, status, floor_number, room_number)
SELECT 
  '33333333-3333-3333-3333-333333333333',
  'C-' || LPAD(generate_series::text, 3, '0'),
  CASE 
    WHEN generate_series <= 25 THEN 'd3333333-3333-3333-3333-333333333331' -- Orthopedics
    ELSE 'd3333333-3333-3333-3333-333333333332' -- Pediatrics
  END,
  CASE 
    WHEN generate_series <= 10 THEN 'icu'
    WHEN generate_series <= 20 THEN 'general'
    ELSE 'picu'
  END,
  'available',
  CASE 
    WHEN generate_series <= 25 THEN 3
    ELSE 2
  END,
  'Room-' || LPAD(((generate_series - 1) / 2 + 1)::text, 3, '0')
FROM generate_series(1, 50);

-- 6. Update capacity_summary for all hospitals
UPDATE hospitals SET capacity_summary = jsonb_build_object(
  'total_beds', (SELECT COUNT(*) FROM beds WHERE beds.hospital_id = hospitals.id),
  'available_beds', (SELECT COUNT(*) FROM beds WHERE beds.hospital_id = hospitals.id AND beds.status = 'available'),
  'occupied_beds', (SELECT COUNT(*) FROM beds WHERE beds.hospital_id = hospitals.id AND beds.status = 'occupied'),
  'icu_total', (SELECT COUNT(*) FROM beds WHERE beds.hospital_id = hospitals.id AND beds.type = 'icu'),
  'icu_available', (SELECT COUNT(*) FROM beds WHERE beds.hospital_id = hospitals.id AND beds.type = 'icu' AND beds.status = 'available')
);
