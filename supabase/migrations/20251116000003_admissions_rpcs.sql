-- Admission & Discharge Atomic RPCs (Phase 1)
-- NOTE: Adjust timestamp in filename if conflicts; uses gen_random_uuid()

CREATE OR REPLACE FUNCTION admission_create_atomic(
  p_hospital_id uuid,
  p_patient_id uuid,
  p_bed_type text,
  p_doctor_id uuid,
  p_reason text
) RETURNS admissions AS $$
DECLARE
  v_bed_id uuid;
  v_department_id uuid;
  v_curr int;
  v_max int;
  v_admission admissions;
BEGIN
  -- Lock an available bed matching criteria
  SELECT id, department_id INTO v_bed_id, v_department_id
  FROM beds
  WHERE hospital_id = p_hospital_id
    AND type = p_bed_type
    AND status = 'available'
  ORDER BY bed_number
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_bed_id IS NULL THEN
    RAISE EXCEPTION 'no_available_bed for type %', p_bed_type USING ERRCODE = 'no_data_found';
  END IF;

  -- Check doctor workload
  SELECT current_patient_count, max_patients INTO v_curr, v_max
  FROM doctors
  WHERE id = p_doctor_id AND hospital_id = p_hospital_id
  FOR UPDATE;

  IF v_curr IS NULL THEN
    RAISE EXCEPTION 'doctor_not_found %', p_doctor_id USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF v_curr >= v_max THEN
    RAISE EXCEPTION 'doctor_at_capacity %/%', v_curr, v_max USING ERRCODE = 'check_violation';
  END IF;

  -- Insert admission
  INSERT INTO admissions (
    id,
    admission_number,
    hospital_id,
    patient_id,
    bed_id,
    primary_doctor_id,
    department_id,
    admission_type,
    reason,
    severity,
    admitted_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'ADM-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,8),
    p_hospital_id,
    p_patient_id,
    v_bed_id,
    p_doctor_id,
    v_department_id,
    'planned',
    p_reason,
    'stable',
    now(),
    now(),
    now()
  ) RETURNING * INTO v_admission;

  -- Update bed to occupied
  UPDATE beds SET status='occupied', current_admission_id=v_admission.id, last_occupied_at=now(), updated_at=now()
  WHERE id = v_bed_id;

  -- Increment doctor workload
  UPDATE doctors SET current_patient_count = current_patient_count + 1, updated_at=now()
  WHERE id = p_doctor_id;

  -- Refresh capacity summary (simple counts)
  WITH stats AS (
    SELECT
      count(*) FILTER (WHERE status='available') AS available_beds,
      count(*) FILTER (WHERE status='occupied') AS occupied_beds,
      count(*) FILTER (WHERE status='maintenance') AS maintenance_beds
    FROM beds WHERE hospital_id = p_hospital_id
  )
  UPDATE hospitals SET capacity_summary = jsonb_build_object(
    'available_beds', stats.available_beds,
    'occupied_beds', stats.occupied_beds,
    'maintenance_beds', stats.maintenance_beds
  ), updated_at=now()
  FROM stats
  WHERE id = p_hospital_id;

  -- Audit log
  INSERT INTO audit_logs (id,hospital_id,user_id,action,resource_type,resource_id,changes,created_at)
  VALUES (gen_random_uuid(), p_hospital_id, NULL, 'admission_create', 'admission', v_admission.id, NULL, now());

  RETURN v_admission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Discharge RPC & grants moved to subsequent migrations to avoid multi-statement issues)
