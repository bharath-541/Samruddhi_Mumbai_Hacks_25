-- Grants for admissions RPCs (part 1)
GRANT EXECUTE ON FUNCTION admission_create_atomic(uuid,uuid,text,uuid,text) TO authenticated;
