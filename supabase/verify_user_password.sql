-- Ejecuta esto en el SQL Editor de Supabase
-- (Database → SQL Editor → New query)

CREATE OR REPLACE FUNCTION public.verify_user_password(
    p_email TEXT,
    p_password TEXT
)
RETURNS TABLE (is_valid BOOLEAN, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (u.password_hash = crypt(p_password, u.password_hash)) AS is_valid,
        u.username
    FROM public.users u
    WHERE u.email = p_email;
END;
$$;

-- Asegura que la función sea accesible desde el backend con service_role
GRANT EXECUTE ON FUNCTION public.verify_user_password(TEXT, TEXT) TO service_role;
