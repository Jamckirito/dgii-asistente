-- =============================================
-- DGII Asistente — Migración inicial
-- =============================================

-- Tabla: empresas (multi-tenant)
create table if not exists public.empresas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rnc         varchar(11) not null,
  nombre      text not null,
  creado_en   timestamptz default now()
);

-- Tabla: declaraciones (cabecera)
create table if not exists public.declaraciones (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null references public.empresas(id) on delete cascade,
  formulario          varchar(3) not null,       -- '606', '607', etc.
  periodo             varchar(6) not null,        -- YYYYMM
  estado              text not null default 'borrador',  -- borrador | validado | enviado
  version_formulario  text,
  creado_en           timestamptz default now(),
  actualizado_en      timestamptz default now()
);

-- Tabla: registros_606
create table if not exists public.registros_606 (
  id                    uuid primary key default gen_random_uuid(),
  declaracion_id        uuid not null references public.declaraciones(id) on delete cascade,
  rnc_proveedor         varchar(11),
  tipo_id               char(1),
  tipo_compra           varchar(2),
  ncf                   varchar(19),
  ncf_modificado        varchar(19),
  fecha_comprobante     varchar(8),
  fecha_pago            varchar(8),
  monto_servicios       numeric(18,2) default 0,
  monto_bienes          numeric(18,2) default 0,
  total_facturado       numeric(18,2) default 0,
  itbis_facturado       numeric(18,2) default 0,
  itbis_retenido        numeric(18,2) default 0,
  itbis_proporcional    numeric(18,2) default 0,
  itbis_costo           numeric(18,2) default 0,
  itbis_adelantar       numeric(18,2) default 0,
  itbis_percibido       numeric(18,2) default 0,
  tipo_retencion_isr    char(1),
  monto_retencion_renta numeric(18,2) default 0,
  isr_percibido         numeric(18,2) default 0,
  impuesto_selectivo    numeric(18,2) default 0,
  otros_impuestos       numeric(18,2) default 0,
  propina_legal         numeric(18,2) default 0,
  forma_pago            char(1),
  creado_en             timestamptz default now()
);

-- Tabla: versiones de formularios (para el watcher de la DGII)
create table if not exists public.form_versions (
  form_id         varchar(3) primary key,   -- '606', '607', etc.
  last_modified   text,
  content_length  text,
  checked_at      timestamptz default now()
);

-- Seed inicial de versiones conocidas
insert into public.form_versions (form_id) values ('606'), ('607'), ('608'), ('609')
on conflict do nothing;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.empresas     enable row level security;
alter table public.declaraciones enable row level security;
alter table public.registros_606 enable row level security;

-- Políticas: cada usuario solo ve sus propios datos

-- empresas
create policy "usuario ve sus empresas"
  on public.empresas for all
  using (auth.uid() = user_id);

-- declaraciones (via empresa)
create policy "usuario ve sus declaraciones"
  on public.declaraciones for all
  using (
    empresa_id in (
      select id from public.empresas where user_id = auth.uid()
    )
  );

-- registros_606 (via declaracion -> empresa)
create policy "usuario ve sus registros 606"
  on public.registros_606 for all
  using (
    declaracion_id in (
      select d.id from public.declaraciones d
      join public.empresas e on e.id = d.empresa_id
      where e.user_id = auth.uid()
    )
  );

-- form_versions: lectura pública, escritura solo service_role
create policy "lectura publica de versiones"
  on public.form_versions for select
  using (true);
