-- =============================================
-- DGII Asistente — Tabla de Usuarios y RPC Auth
-- =============================================

-- Extension pgcrypto para encriptar/verificar contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(512) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    token VARCHAR(50),
    username VARCHAR(50) UNIQUE NOT NULL
);

-- Seed de usuarios iniciales
INSERT INTO public.users (email, password_hash, token, username)
VALUES
    ('stepbizarre21@gmail.com', crypt('katia258', gen_salt('bf')), '', 'laparita'),
    ('nkatia.g3@gmail.com', crypt('*La_creta202', gen_salt('bf')), '', 'lamejor'),
    ('jamckirigaya@gmail.com', crypt('Mendez21', gen_salt('bf')), '', 'kirito'),
    ('edelcalmen@gmail.com', crypt('Edelcalmen', gen_salt('bf')), '', 'lic.contable')
ON CONFLICT (email) DO NOTHING;

-- Función RPC para verificar contraseña
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

-- Función RPC para login completo (Verifica contraseña y actualiza token)
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

-- Habilitar RLS en public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Acceso total service_role" ON public.users;
DROP POLICY IF EXISTS "Permitir lectura anon para auth" ON public.users;

CREATE POLICY "Acceso total service_role" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura anon para auth" ON public.users FOR SELECT TO anon USING (true);
