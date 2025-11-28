-- Fix patients table columns from BYTEA to TEXT
-- Since encryption is not implemented yet (Phase 2), we store as plain TEXT

ALTER TABLE patients 
  ALTER COLUMN name_encrypted TYPE TEXT USING name_encrypted::TEXT,
  ALTER COLUMN dob_encrypted TYPE TEXT USING dob_encrypted::TEXT,
  ALTER COLUMN emergency_contact_encrypted TYPE TEXT USING emergency_contact_encrypted::TEXT;

-- Add comment for future reference
COMMENT ON COLUMN patients.name_encrypted IS 'Patient name (will be encrypted in Phase 2)';
COMMENT ON COLUMN patients.dob_encrypted IS 'Date of birth (will be encrypted in Phase 2)';
COMMENT ON COLUMN patients.emergency_contact_encrypted IS 'Emergency contact (will be encrypted in Phase 2)';
