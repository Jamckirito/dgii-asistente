from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from routers import extract, export

settings = get_settings()

app = FastAPI(
    title="DGII Asistente — API",
    description="Backend de extracción y generación de formularios DGII con IA",
    version="0.1.0",
    docs_url="/docs" if settings.environment == "development" else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(extract.router)
app.include_router(export.router)


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.environment}
