import uuid
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from core.config import get_settings
from supabase import create_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticación"])

settings = get_settings()
_supabase = create_client(settings.supabase_url, settings.supabase_service_key)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    email: str


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    """
    Verifica credenciales contra public.users (contraseñas hasheadas con bcrypt/pgcrypto).
    Si son correctas, genera un token UUID, lo guarda en la columna `token` y lo devuelve.
    """
    try:
        # Verificar contraseña usando crypt() de pgcrypto a través de una consulta SQL raw
        result = (
            _supabase
            .rpc("verify_user_password", {"p_email": body.email, "p_password": body.password})
            .execute()
        )
    except Exception as e:
        logger.error("Error al verificar contraseña: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno al verificar credenciales.")

    # La función RPC devuelve una lista con un dict que contiene is_valid, username
    data = result.data
    if not data or not data[0].get("is_valid"):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")

    username = data[0].get("username", "")
    new_token = str(uuid.uuid4()).replace("-", "")[:50]

    # Guardar el token generado en public.users
    try:
        _supabase.table("users").update({"token": new_token}).eq("email", body.email).execute()
    except Exception as e:
        logger.error("Error al guardar token: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno al crear sesión.")

    return LoginResponse(token=new_token, username=username, email=body.email)


@router.post("/logout")
async def logout(token: str):
    """
    Invalida el token de sesión borrándolo de public.users.
    """
    try:
        _supabase.table("users").update({"token": ""}).eq("token", token).execute()
    except Exception as e:
        logger.warning("Error al invalidar token: %s", e)
    return {"ok": True}


@router.get("/verify")
async def verify_token(token: str):
    """
    Verifica si un token de sesión es válido.
    Devuelve los datos del usuario si el token existe y no está vacío.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido.")
    try:
        result = (
            _supabase
            .table("users")
            .select("id, email, username")
            .eq("token", token)
            .neq("token", "")
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

    if not result.data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")

    return result.data
