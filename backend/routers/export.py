from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from core.auth import get_current_user
from services.txt_generator import generar_txt_606
from services.txt_generator_607 import generar_txt_607
from services.txt_generator_608 import generar_txt_608
from services.txt_generator_609 import generar_txt_609
from models.formulario_606 import Registro606
from models.formulario_607 import Registro607
from models.formulario_608 import Registro608
from models.formulario_609 import Registro609

router = APIRouter(prefix="/export", tags=["Exportación"])


class Export606Request(BaseModel):
    rnc_empresa: str
    periodo: str  # YYYYMM
    registros: list[Registro606]


class Export607Request(BaseModel):
    rnc_empresa: str
    periodo: str  # YYYYMM
    registros: list[Registro607]


class Export608Request(BaseModel):
    rnc_empresa: str
    periodo: str  # YYYYMM
    registros: list[Registro608]


class Export609Request(BaseModel):
    rnc_empresa: str
    periodo: str  # YYYYMM
    registros: list[Registro609]


@router.post("/606/txt", response_class=PlainTextResponse)
async def export_606_txt(
    body: Export606Request,
    current_user: dict = Depends(get_current_user),
):
    """Genera el archivo TXT oficial del Formato 606 (Compras)."""
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


@router.post("/607/txt", response_class=PlainTextResponse)
async def export_607_txt(
    body: Export607Request,
    current_user: dict = Depends(get_current_user),
):
    """Genera el archivo TXT oficial del Formato 607 (Ventas)."""
    contenido = generar_txt_607(
        rnc_empresa=body.rnc_empresa,
        periodo=body.periodo,
        registros=body.registros,
    )
    filename = f"DGII_F_607_{body.rnc_empresa}_{body.periodo}.TXT"
    return PlainTextResponse(
        content=contenido,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/608/txt", response_class=PlainTextResponse)
async def export_608_txt(
    body: Export608Request,
    current_user: dict = Depends(get_current_user),
):
    """Genera el archivo TXT oficial del Formato 608 (Anulados)."""
    contenido = generar_txt_608(
        rnc_empresa=body.rnc_empresa,
        periodo=body.periodo,
        registros=body.registros,
    )
    filename = f"DGII_F_608_{body.rnc_empresa}_{body.periodo}.TXT"
    return PlainTextResponse(
        content=contenido,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/609/txt", response_class=PlainTextResponse)
async def export_609_txt(
    body: Export609Request,
    current_user: dict = Depends(get_current_user),
):
    """Genera el archivo TXT oficial del Formato 609 (Servicios al Exterior)."""
    contenido = generar_txt_609(
        rnc_empresa=body.rnc_empresa,
        periodo=body.periodo,
        registros=body.registros,
    )
    filename = f"DGII_F_609_{body.rnc_empresa}_{body.periodo}.TXT"
    return PlainTextResponse(
        content=contenido,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
