# DGII Asistente

Asistente inteligente para la preparación y envío de formularios de la DGII (República Dominicana).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Package manager | Bun |
| Backend | FastAPI + Python 3.12 |
| Base de datos | Supabase (Postgres + RLS + Storage) |
| IA | Claude API (Anthropic) |
| Deploy frontend | Vercel |
| Deploy backend | Railway |

## Estructura del monorepo

```
dgii-asistente/
├── frontend/       → Next.js 15
├── backend/        → FastAPI Python
└── supabase/       → Migraciones y políticas RLS
```

## Inicio rápido

### Requisitos
- Bun >= 1.3
- Python >= 3.12
- Docker Desktop (para Supabase local)
- Supabase CLI

### 1. Clonar e instalar

```bash
git clone <repo>
cd dgii-asistente

# Frontend
cd frontend && bun install

# Backend
cd ../backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Variables de entorno

```bash
# frontend/.env.local
cp frontend/.env.example frontend/.env.local

# backend/.env
cp backend/.env.example backend/.env
```

Llena los valores en ambos archivos (ver sección Variables de entorno).

### 3. Supabase local

```bash
supabase start
supabase db push
```

### 4. Correr en desarrollo

```bash
# Terminal 1 — Frontend
cd frontend && bun dev

# Terminal 2 — Backend
cd backend && fastapi dev main.py
```

Frontend: http://localhost:3000  
Backend docs: http://localhost:8000/docs

## Variables de entorno

### frontend/.env.local
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### backend/.env
```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ENVIRONMENT=development
```

## Formularios soportados

- [x] Formato 606 — Compras de bienes y servicios
- [ ] Formato 607 — Ventas con NCF *(próximamente)*
- [ ] Formato 608 — NCF anulados *(próximamente)*
- [ ] Formato 609 — Pagos al exterior *(próximamente)*
