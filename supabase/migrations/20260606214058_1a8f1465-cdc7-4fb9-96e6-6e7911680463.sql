
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  acct public.account_type;
BEGIN
  BEGIN
    acct := COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, 'farmer');
  EXCEPTION WHEN others THEN
    acct := 'farmer';
  END;

  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    acct
  );
  RETURN NEW;
END;
$function$;
