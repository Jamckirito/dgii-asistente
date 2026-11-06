-- =========================================================================
-- DGII Asistente — Migración 003: Unificación definitiva en Supabase Auth
-- =========================================================================

-- 1. Eliminar funciones RPC inseguras asociadas a public.users
DROP FUNCTION IF EXISTS public.login_user(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.verify_user_password(TEXT, TEXT);

-- 2. Eliminar la tabla custom public.users
DROP TABLE IF EXISTS public.users CASCADE;

-- 3. Confirmar que la tabla 'empresas' referencia a auth.users(id)
ALTER TABLE IF EXISTS public.empresas
  DROP CONSTRAINT IF EXISTS empresas_user_id_fkey,
  ADD CONSTRAINT empresas_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Reafirmar las políticas de RLS basadas en auth.uid()
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.declaraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_606 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuario ve sus empresas" ON public.empresas;
CREATE POLICY "usuario ve sus empresas"
  ON public.empresas FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuario ve sus declaraciones" ON public.declaraciones;
CREATE POLICY "usuario ve sus declaraciones"
  ON public.declaraciones FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM public.empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM public.empresas WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "usuario ve sus registros 606" ON public.registros_606;
CREATE POLICY "usuario ve sus registros 606"
  ON public.registros_606 FOR ALL
  TO authenticated
  USING (
    declaracion_id IN (
      SELECT d.id FROM public.declaraciones d
      JOIN public.empresas e ON e.id = d.empresa_id
      WHERE e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    declaracion_id IN (
      SELECT d.id FROM public.declaraciones d
      JOIN public.empresas e ON e.id = d.empresa_id
      WHERE e.user_id = auth.uid()
    )
  );

