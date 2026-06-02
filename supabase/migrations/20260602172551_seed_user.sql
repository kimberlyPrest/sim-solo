DO $$
DECLARE
  new_user_id uuid;
  org_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kimberly@adapta.org') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', 'kimberly@adapta.org',
      crypt('Skip@Pass', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"name": "Kimberly"}',
      false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new_user_id, 'kimberly@adapta.org', 'Kimberly')
    ON CONFLICT (id) DO NOTHING;
    
    org_id := gen_random_uuid();
    INSERT INTO public.organizations (id, name) VALUES (org_id, 'Adapta') ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, new_user_id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;
