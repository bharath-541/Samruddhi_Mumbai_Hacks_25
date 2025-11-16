-- Admission Discharge RPC split out
CREATE OR REPLACE FUNCTION admission_discharge_atomic(
  p_admission_id uuid,
  p_discharge_type text,
  p_summary text
) RETURNS admissions AS $$
DECLARE
  v_admission admissions;
  v_bed_id uuid;
  v_hospital_id uuid;
  v_doctor_id uuid;
BEGIN
  -- Lock admission
  SELECT * INTO v_admission FROM admissions WHERE id = p_admission_id FOR UPDATE;
  IF v_admission.id IS NULL THEN
    RAISE EXCEPTION 'admission_not_found %', p_admission_id USING ERRCODE='no_data_found';
  END IF;
  IF v_admission.discharged_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_discharged %', p_admission_id USING ERRCODE='duplicate_object';
  END IF;

  v_bed_id := v_admission.bed_id;
  v_hospital_id := v_admission.hospital_id;
  v_doctor_id := v_admission.primary_doctor_id;

  -- Discharge admission
  UPDATE admissions SET discharged_at=now(), discharge_type=p_discharge_type, discharge_summary=p_summary, updated_at=now()
  WHERE id = p_admission_id
  RETURNING * INTO v_admission;

  -- Free bed
  UPDATE beds SET status='available', current_admission_id=NULL, last_cleaned_at=now(), updated_at=now()
  WHERE id = v_bed_id;

  -- Decrement doctor workload (avoid negative)
  UPDATE doctors SET current_patient_count = GREATEST(current_patient_count - 1, 0), updated_at=now()
  WHERE id = v_doctor_id;

  -- Refresh capacity summary
  WITH stats AS (
    SELECT
      count(*) FILTER (WHERE status='available') AS available_beds,
      count(*) FILTER (WHERE status='occupied') AS occupied_beds,
      count(*) FILTER (WHERE status='maintenance') AS maintenance_beds
    FROM beds WHERE hospital_id = v_hospital_id
  )
  UPDATE hospitals SET capacity_summary = jsonb_build_object(
    'available_beds', stats.available_beds,
    'occupied_beds', stats.occupied_beds,
    'maintenance_beds', stats.maintenance_beds
  ), updated_at=now()
  FROM stats
  WHERE id = v_hospital_id;

  -- Audit log
  INSERT INTO audit_logs (id,hospital_id,user_id,action,resource_type,resource_id,changes,created_at)
  VALUES (gen_random_uuid(), v_hospital_id, NULL, 'admission_discharge', 'admission', v_admission.id, NULL, now());

  RETURN v_admission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
