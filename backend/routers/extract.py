import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from core.auth import get_current_user
from core.rate_limit import extraction_rate_limiter
from services.gemini_service import extract_606_from_file
from models.formulario_606 import ExtractResponse, Registro606

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/extract", tags=["Extracción"])

ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def detectar_mime_real(file_bytes: bytes) -> str | None:
    """Verifica las cabeceras binarias (magic bytes) para validar el tipo real del archivo."""
    if len(file_bytes) < 4:
        return None
    if file_bytes.startswith(b"%PDF"):
        return "application/pdf"
    if file_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(file_bytes) >= 12 and file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.post("", response_model=ExtractResponse)
async def extract(
    files: list[UploadFile] = File(...),
    formulario: str = Form(default="606"),
    current_user: dict = Depends(get_current_user),
):
    """
    Recibe uno o varios archivos (PDF, imágenes),
    valida el tipo MIME real mediante magic bytes, aplica rate limiting por usuario
    y utiliza Gemini 2.5 Flash asíncrono con esquema Pydantic estructurado.
    """
    if formulario not in ("606", "607"):
        raise HTTPException(400, detail=f"Formulario '{formulario}' no soportado aún.")

    # Rate limit por usuario
    user_id = current_user.get("id", "anonymous")
    extraction_rate_limiter.check(user_id)

    todos_los_registros: list[Registro606] = []
    todas_las_advertencias: list[str] = []
    archivos_procesados = 0

    for upload in files:
        file_bytes = await upload.read()

        if len(file_bytes) > MAX_FILE_SIZE:
            todas_las_advertencias.append(
                f"'{upload.filename}' ignorado — excede el límite de 20 MB."
            )
            continue

        real_mime = detectar_mime_real(file_bytes)
        if not real_mime or real_mime not in ALLOWED_TYPES:
            todas_las_advertencias.append(
                f"'{upload.filename}' ignorado — tipo o contenido binario no soportado. "
                "Usa documentos PDF o imágenes JPG/PNG/WEBP genuinas."
            )
            continue

        try:
            resultado = await extract_606_from_file(
                file_bytes=file_bytes,
                filename=upload.filename or "archivo",
                media_type=real_mime,
            )

            logger.debug(
                "Gemini extrajo %d registros de '%s'",
                len(resultado.get("registros", [])),
                upload.filename,
            )

            for reg_data in resultado.get("registros", []):
                try:
                    reg = Registro606(**reg_data)
                    todos_los_registros.append(reg)
                except Exception as val_err:
                    logger.warning(
                        "Error al instanciar registro en '%s': %s — datos: %s",
                        upload.filename,
                        val_err,
                        reg_data,
                    )
                    todas_las_advertencias.append(
                        f"Advertencia en '{upload.filename}': {str(val_err)}"
                    )

            todas_las_advertencias.extend(resultado.get("advertencias", []))
            archivos_procesados += 1

        except Exception as e:
            logger.error("Error procesando '%s': %s", upload.filename, e, exc_info=True)
            todas_las_advertencias.append(
                f"Error procesando '{upload.filename}': {str(e)}"
            )

    return ExtractResponse(
        registros=todos_los_registros,
        advertencias=todas_las_advertencias,
        archivos_procesados=archivos_procesados,
    )
