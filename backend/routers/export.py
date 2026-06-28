from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from services.txt_generator import generar_txt_606
from models.formulario_606 import Registro606

router = APIRouter(prefix="/export", tags=["Exportación"])


class ExportRequest(BaseModel):
    rnc_empresa: str
    periodo: str           # YYYYMM
    registros: list[Registro606]


@router.post("/606/txt", response_class=PlainTextResponse)
async def export_606_txt(body: ExportRequest):
    """
    Genera el archivo TXT del Formato 606
    listo para subir al portal de la DGII.
    """
    contenido = generar_txt_606(
        rnc_empresa=body.rnc_empresa,
        periodo=body.periodo,
        registros=body.registros,
    )

    filename = f"DGII_F_606_{body.rnc_empresa}_{body.periodo}.TXT"

    return PlainTextResponse(
        content=contenido,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
