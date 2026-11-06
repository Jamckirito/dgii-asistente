import logging
from typing import Annotated
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from core.config import get_settings
from supabase import create_client

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(security)],
) -> dict:
    """
    Valida el JWT de Supabase en cada endpoint protegido y retorna los datos del usuario.
    Obtiene el user_id directamente del token validado por Supabase Auth (nunca del cliente).
    """
    settings = get_settings()

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autorización no proporcionado o formato inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Permite token de prueba en desarrollo/test
    if token == "test-token" and settings.environment in ("development", "test"):
        return {"id": "test-user-id", "email": "test@example.com"}

    try:
        supabase = create_client(settings.supabase_url, settings.supabase_service_key)
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de Supabase inválido o sesión expirada.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = user_response.user
        return {
            "id": str(user.id),
            "email": user.email,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error al validar token contra Supabase Auth: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al autenticar usuario contra el servicio de identidad.",
            headers={"WWW-Authenticate": "Bearer"},
        )
