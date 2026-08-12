-- =======================================================
-- DGII Asistente — Funciones RPC de Autenticación Supabase
-- =======================================================

-- 1. Función RPC para verificar contraseña
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
        u.username::TEXT
    FROM public.users u
    WHERE u.email = p_email;
END;
$$;

-- 2. Función RPC para Login Atómico (Verifica y actualiza el token en 1 sola llamada)
CREATE OR REPLACE FUNCTION public.login_user(
    p_email TEXT,
    p_password TEXT,
    p_token TEXT
)
RETURNS TABLE (is_valid BOOLEAN, username TEXT, msg TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user public.users%ROWTYPE;
BEGIN
    SELECT * INTO v_user
    FROM public.users u
    WHERE u.email = p_email;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, ''::TEXT, 'Usuario no encontrado'::TEXT;
        RETURN;
    END IF;

    IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
        UPDATE public.users
        SET token = p_token
        WHERE email = p_email;

        RETURN QUERY SELECT TRUE, v_user.username::TEXT, 'Login exitoso'::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, ''::TEXT, 'Contraseña incorrecta'::TEXT;
    END IF;
END;
$$;

-- Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.verify_user_password(TEXT, TEXT) TO service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT, TEXT) TO service_role, anon, authenticated;
