-- =============================================
-- DGII Asistente — Tabla de Usuarios y Funciones Auth (Seguras)
-- =============================================

-- Extension pgcrypto para encriptar/verificar contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(512) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    token VARCHAR(50),
    username VARCHAR(50) UNIQUE NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- Función RPC para verificar contraseña (Solo service_role)
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

-- Función RPC para login completo (Solo service_role)
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

-- Revocar cualquier acceso público / anónimo a las funciones de autenticación
REVOKE EXECUTE ON FUNCTION public.verify_user_password(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.login_user(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Asignar ejecución exclusivamente al rol de servicio
GRANT EXECUTE ON FUNCTION public.verify_user_password(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT, TEXT) TO service_role;

-- Habilitar RLS estricto en public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Acceso total service_role" ON public.users;
DROP POLICY IF EXISTS "Permitir lectura anon para auth" ON public.users;
DROP POLICY IF EXISTS "Acceso exclusivo service_role" ON public.users;

-- Revocar permisos directos de tabla a anon y authenticated
REVOKE ALL ON public.users FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.users TO service_role;

-- Política: única y exclusivamente service_role tiene acceso a users
CREATE POLICY "Acceso exclusivo service_role"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
