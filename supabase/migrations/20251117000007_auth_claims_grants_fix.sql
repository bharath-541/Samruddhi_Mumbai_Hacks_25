-- Fix: Harden custom access token hook and grant permissions
-- Context: Hook failed with unexpected_failure. Likely missing privileges or null claims handling.

-- 1) Recreate function to be more defensive (ensure claims key exists)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb := COALESCE(event->'claims', '{}'::jsonb);
  user_role text;
  user_hospital_id uuid;
  user_patient_id uuid;
  uid uuid := ((event->>'user_id')::uuid);
BEGIN
  -- Try to read from public.users; if table missing, just skip
  BEGIN
    SELECT u.role, u.hospital_id, u.linked_entity_id
    INTO user_role, user_hospital_id, user_patient_id
    FROM public.users u
    WHERE u.id = uid;
  EXCEPTION WHEN undefined_table THEN
    -- Table not present; skip without failing the hook
    user_role := NULL;
    user_hospital_id := NULL;
    user_patient_id := NULL;
  END;

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  END IF;

  IF user_hospital_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{hospital_id}', to_jsonb(user_hospital_id::text));
  END IF;

  IF user_role = 'patient' AND user_patient_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{patient_id}', to_jsonb(user_patient_id::text));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- 2) Ensure required privileges for the hook executor (supabase_auth_admin)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON TABLE public.users TO supabase_auth_admin;

-- Optional: allow authenticated/anon to execute (if needed for local testing)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO anon;

-- 3) Quick self-test (to run manually in SQL editor):
-- SELECT public.custom_access_token_hook(jsonb_build_object('user_id', '<uuid>', 'claims', jsonb_build_object()));
