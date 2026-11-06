import logging
from fastapi import APIRouter, Depends
from core.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Devuelve los datos del usuario autenticado obtenidos y validados desde el token JWT de Supabase.
    """
    return current_user
