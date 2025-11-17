-- Custom JWT claims function for Supabase Auth
-- This adds role, hospital_id, patient_id to JWT tokens

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_hospital_id uuid;
  user_patient_id uuid;
BEGIN
  -- Get user metadata from users table
  SELECT 
    role,
    hospital_id,
    linked_entity_id
  INTO 
    user_role,
    user_hospital_id,
    user_patient_id
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  -- Build claims
  claims := event->'claims';
  
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  END IF;
  
  IF user_hospital_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{hospital_id}', to_jsonb(user_hospital_id::text));
  END IF;
  
  -- For patients, patient_id = linked_entity_id (references patients table)
  -- For staff, linked_entity_id references doctors/staff table
  IF user_role = 'patient' AND user_patient_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{patient_id}', to_jsonb(user_patient_id::text));
  END IF;

  -- Update event with new claims
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO anon;

-- Note: You must configure this hook in Supabase Dashboard:
-- Authentication → Hooks → Custom Access Token Hook → enable and set to public.custom_access_token_hook
