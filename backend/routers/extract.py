from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from services.gemini_service import extract_606_from_file
from models.formulario_606 import ExtractResponse, Registro606
import uuid

router = APIRouter(prefix="/extract", tags=["Extracción"])

ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("", response_model=ExtractResponse)
async def extract(
    files: list[UploadFile] = File(...),
    formulario: str = Form(default="606"),
):
    """
    Recibe uno o varios archivos (PDF, imágenes),
    los envía a Claude y devuelve los campos del formulario extraídos.
    """
    if formulario not in ("606", "607"):
        raise HTTPException(400, detail=f"Formulario '{formulario}' no soportado aún.")

    todos_los_registros: list[Registro606] = []
    todas_las_advertencias: list[str] = []
    archivos_procesados = 0

    for upload in files:
        content_type = upload.content_type or "application/octet-stream"

        if content_type not in ALLOWED_TYPES:
            todas_las_advertencias.append(
                f"'{upload.filename}' ignorado — tipo no soportado ({content_type}). "
                "Usa PDF o imagen JPG/PNG."
            )
            continue

        file_bytes = await upload.read()

        if len(file_bytes) > MAX_FILE_SIZE:
            todas_las_advertencias.append(
                f"'{upload.filename}' ignorado — excede el límite de 20 MB."
            )
            continue

        try:
            resultado = await extract_606_from_file(
                file_bytes=file_bytes,
                filename=upload.filename or "archivo",
                media_type=content_type,
            )

            import json
            print(f"--- RAW GEMINI RESPONSE FOR '{upload.filename}' ---")
            print(json.dumps(resultado, indent=2))

            for reg_data in resultado.get("registros", []):
                try:
                    reg = Registro606(**reg_data)
                    todos_los_registros.append(reg)
                except Exception as val_err:
                    print(f"Validation error for record in {upload.filename}: {reg_data}")
                    print(f"Error: {val_err}")
                    todas_las_advertencias.append(
                        f"Registro omitido en '{upload.filename}' por error de validación: {str(val_err)}"
                    )

            todas_las_advertencias.extend(resultado.get("advertencias", []))
            archivos_procesados += 1

        except Exception as e:
            import traceback
            print(f"Error processing file '{upload.filename}': {e}")
            traceback.print_exc()
            todas_las_advertencias.append(
                f"Error procesando '{upload.filename}': {str(e)}"
            )

    return ExtractResponse(
        registros=todos_los_registros,
        advertencias=todas_las_advertencias,
        archivos_procesados=archivos_procesados,
    )
