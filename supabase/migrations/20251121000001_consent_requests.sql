-- Create consent_requests table
CREATE TABLE IF NOT EXISTS consent_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    scope TEXT[] NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by patient and doctor
CREATE INDEX idx_consent_requests_patient ON consent_requests(patient_id);
CREATE INDEX idx_consent_requests_doctor ON consent_requests(doctor_id);
CREATE INDEX idx_consent_requests_status ON consent_requests(status);

-- Add RLS policies (Row Level Security)
ALTER TABLE consent_requests ENABLE ROW LEVEL SECURITY;

-- Doctors can create requests
CREATE POLICY "Doctors can create consent requests" ON consent_requests
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM doctors WHERE id = doctor_id
    ));

-- Doctors can view requests they created
CREATE POLICY "Doctors can view their own requests" ON consent_requests
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM doctors WHERE id = doctor_id
    ));

-- Patients can view requests for themselves
CREATE POLICY "Patients can view requests for themselves" ON consent_requests
    FOR SELECT
    USING (auth.uid() IN (
        SELECT ehr_id FROM patients WHERE id = patient_id
    ));

-- Patients can update status (approve/reject)
CREATE POLICY "Patients can update their own requests" ON consent_requests
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT ehr_id FROM patients WHERE id = patient_id
    ))
    WITH CHECK (auth.uid() IN (
        SELECT ehr_id FROM patients WHERE id = patient_id
    ));
