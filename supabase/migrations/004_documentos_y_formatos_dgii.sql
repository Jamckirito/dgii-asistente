-- =========================================================================
-- DGII Asistente — Migración 004: Documentos, Auditoría y Formatos 607, 608, 609
-- =========================================================================

-- 1. Tabla de Documentos Físicos / Digitales Procesados
CREATE TABLE IF NOT EXISTS public.documentos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_archivo      TEXT NOT NULL,
  tamano_bytes        BIGINT NOT NULL DEFAULT 0,
  hash_sha256         VARCHAR(64) NOT NULL,
  storage_path        TEXT,
  tipo_documento      TEXT NOT NULL DEFAULT 'desconocido',
  formato_sugerido    VARCHAR(3) DEFAULT '606',
  estado              TEXT NOT NULL DEFAULT 'pendiente_revision', -- 'procesando', 'pendiente_revision', 'validado', 'rechazado'
  metadatos_extraccion JSONB DEFAULT '{}'::jsonb,
  creado_en           TIMESTAMPTZ DEFAULT now(),
  actualizado_en      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_empresa_documento_hash UNIQUE (empresa_id, hash_sha256)
);

-- Vincular registros_606 con el documento fuente
ALTER TABLE public.registros_606
  ADD COLUMN IF NOT EXISTS documento_id UUID REFERENCES public.documentos(id) ON DELETE SET NULL;

-- 2. Tabla de Auditoría y Trazabilidad de Campos (Human-in-the-loop)
CREATE TABLE IF NOT EXISTS public.documento_campos_auditoria (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id        UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campo               TEXT NOT NULL,
  valor_original      TEXT,
  valor_corregido     TEXT,
  confianza           NUMERIC(4,3) DEFAULT 1.000,
  fue_modificado      BOOLEAN DEFAULT false,
  justificacion       TEXT,
  fecha_modificacion  TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla: registros_607 (Ventas de Bienes y Servicios)
CREATE TABLE IF NOT EXISTS public.registros_607 (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaracion_id              UUID REFERENCES public.declaraciones(id) ON DELETE CASCADE,
  documento_id                UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
  rnc_cedula_cliente          VARCHAR(11) NOT NULL,
  tipo_identificacion         CHAR(1) NOT NULL,
  ncf                         VARCHAR(19) NOT NULL,
  ncf_modificado              VARCHAR(19),
  tipo_ingreso                VARCHAR(2) NOT NULL DEFAULT '01',
  fecha_comprobante           VARCHAR(8) NOT NULL,
  fecha_retencion             VARCHAR(8),
  monto_facturado             NUMERIC(18,2) DEFAULT 0.00,
  itbis_facturado             NUMERIC(18,2) DEFAULT 0.00,
  itbis_retenido_terceros     NUMERIC(18,2) DEFAULT 0.00,
  itbis_percibido             NUMERIC(18,2) DEFAULT 0.00,
  retencion_renta_terceros    NUMERIC(18,2) DEFAULT 0.00,
  isr_percibido               NUMERIC(18,2) DEFAULT 0.00,
  impuesto_selectivo          NUMERIC(18,2) DEFAULT 0.00,
  otros_impuestos             NUMERIC(18,2) DEFAULT 0.00,
  propina_legal               NUMERIC(18,2) DEFAULT 0.00,
  monto_efectivo              NUMERIC(18,2) DEFAULT 0.00,
  monto_cheque_transferencia  NUMERIC(18,2) DEFAULT 0.00,
  monto_tarjeta               NUMERIC(18,2) DEFAULT 0.00,
  monto_venta_credito         NUMERIC(18,2) DEFAULT 0.00,
  monto_bonos_certificados    NUMERIC(18,2) DEFAULT 0.00,
  monto_permuta               NUMERIC(18,2) DEFAULT 0.00,
  monto_otras_formas          NUMERIC(18,2) DEFAULT 0.00,
  creado_en                   TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla: registros_608 (Comprobantes Anulados)
CREATE TABLE IF NOT EXISTS public.registros_608 (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaracion_id      UUID REFERENCES public.declaraciones(id) ON DELETE CASCADE,
  documento_id        UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
  ncf                 VARCHAR(19) NOT NULL,
  fecha_comprobante   VARCHAR(8) NOT NULL,
  tipo_anulacion      VARCHAR(2) NOT NULL,
  comentario          TEXT,
  creado_en           TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla: registros_609 (Pagos al Exterior)
CREATE TABLE IF NOT EXISTS public.registros_609 (
  id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaracion_id                      UUID REFERENCES public.declaraciones(id) ON DELETE CASCADE,
  documento_id                        UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
  identificacion_fiscal_beneficiario  VARCHAR(50) NOT NULL,
  razon_social_beneficiario           TEXT NOT NULL,
  pais_residencia                     VARCHAR(50) NOT NULL,
  fecha_pago                          VARCHAR(8) NOT NULL,
  tipo_servicio_exterior              VARCHAR(2) NOT NULL,
  monto_moneda_extranjera             NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  codigo_moneda                       VARCHAR(3) NOT NULL DEFAULT 'USD',
  tasa_cambio                         NUMERIC(18,4) NOT NULL DEFAULT 1.0000,
  monto_pesos_dominicanos             NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  retencion_isr                       NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  creado_en                           TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- Habilitación de Row Level Security (RLS) en todas las tablas
-- =========================================================================

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_campos_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_607 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_608 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_609 ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para documentos
DROP POLICY IF EXISTS "usuario ve sus documentos" ON public.documentos;
CREATE POLICY "usuario ve sus documentos"
  ON public.documentos FOR ALL
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

-- Políticas para auditoría
DROP POLICY IF EXISTS "usuario ve auditoria de sus documentos" ON public.documento_campos_auditoria;
CREATE POLICY "usuario ve auditoria de sus documentos"
  ON public.documento_campos_auditoria FOR ALL
  TO authenticated
  USING (
    documento_id IN (
      SELECT d.id FROM public.documentos d
      JOIN public.empresas e ON e.id = d.empresa_id
      WHERE e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    documento_id IN (
      SELECT d.id FROM public.documentos d
      JOIN public.empresas e ON e.id = d.empresa_id
      WHERE e.user_id = auth.uid()
    )
  );

-- Políticas para 607, 608 y 609
DROP POLICY IF EXISTS "usuario ve sus registros 607" ON public.registros_607;
CREATE POLICY "usuario ve sus registros 607"
  ON public.registros_607 FOR ALL
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

DROP POLICY IF EXISTS "usuario ve sus registros 608" ON public.registros_608;
CREATE POLICY "usuario ve sus registros 608"
  ON public.registros_608 FOR ALL
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

DROP POLICY IF EXISTS "usuario ve sus registros 609" ON public.registros_609;
CREATE POLICY "usuario ve sus registros 609"
  ON public.registros_609 FOR ALL
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

-- =========================================================================
-- Configuración de Storage para Comprobantes Fiscales
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes-fiscales', 'comprobantes-fiscales', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS para el Bucket comprobantes-fiscales
DROP POLICY IF EXISTS "Permitir subida a usuarios autenticados de su empresa" ON storage.objects;
CREATE POLICY "Permitir subida a usuarios autenticados de su empresa"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comprobantes-fiscales');

DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON storage.objects;
CREATE POLICY "Permitir lectura a usuarios autenticados"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'comprobantes-fiscales');
