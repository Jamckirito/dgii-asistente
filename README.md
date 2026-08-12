# DGII Asistente

Asistente inteligente para la preparación y envío de formularios de la DGII (República Dominicana).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Package manager | Bun |
| Backend | FastAPI + Python 3.12 |
| Base de datos | Supabase (Postgres + RLS + Storage) |
| IA | Google Gemini 2.5 Flash API |
| Deploy frontend | Vercel / Cloudflare Pages / Docker |
| Deploy backend | Railway / Render / Docker |

## Estructura del monorepo

```
dgii-asistente/
├── frontend/       → Next.js 15
├── backend/        → FastAPI Python
├── supabase/       → Migraciones y políticas RLS
└── docker-compose.yml → Orquestación completa
```

## Inicio rápido

### Requisitos
- Bun >= 1.3
- Python >= 3.12
- Docker Desktop (opcional para desarrollo local en contenedores)

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

### 3. Correr en desarrollo

```bash
# Terminal 1 — Frontend
cd frontend && bun dev

# Terminal 2 — Backend
cd backend && uvicorn main:app --reload --port 8000
```

Frontend: http://localhost:3000  
Backend docs: http://localhost:8000/docs

---

## 🚀 Despliegue a Producción (Deployment)

### Opción 1: Docker / Docker Compose (Recomendado para VPS / Servidor dedicado)

Para desplegar la aplicación completa con una sola orden:

```bash
docker compose up -d --build
```

Esto compilará y levantará:
- **Backend (FastAPI)** en el puerto `8000`
- **Frontend (Next.js)** en el puerto `3000`

### Opción 2: Vercel (Frontend) + Railway / Render (Backend)

#### Despliegue del Backend (FastAPI) en Railway o Render:
1. Conecta tu repositorio de GitHub a **Railway** o **Render**.
2. Selecciona el subdirectorio `backend/` como raíz de trabajo.
3. Configura el comando de inicio: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Define las variables de entorno en el panel del proveedor:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `ENVIRONMENT=production`
   - `CORS_ORIGINS=https://tu-frontend.vercel.app`

#### Despliegue del Frontend (Next.js) en Vercel:
1. Importa el repositorio en **Vercel**.
2. Selecciona la carpeta `frontend/` como Root Directory.
3. Configura las variables de entorno de producción:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BACKEND_URL=https://tu-backend.railway.app`
4. Haz clic en **Deploy**.

---

## Variables de entorno

### frontend/.env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### backend/.env
```env
GEMINI_API_KEY=tu-gemini-api-key
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
```

## Formularios soportados

- [x] Formato 606 — Compras de bienes y servicios
- [ ] Formato 607 — Ventas con NCF *(próximamente)*
- [ ] Formato 608 — NCF anulados *(próximamente)*
- [ ] Formato 609 — Pagos al exterior *(próximamente)*

