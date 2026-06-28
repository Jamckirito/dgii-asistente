from pydantic import BaseModel, Field
from typing import Optional


class Registro606(BaseModel):
    """Campos exactos del Formato 606 de la DGII"""
    rnc_proveedor: str = Field(..., description="RNC o cédula del proveedor")
    tipo_id: str = Field(..., description="1=RNC, 2=Cédula, 3=Pasaporte")
    ncf: str = Field(..., description="Número de comprobante fiscal")
    ncf_modificado: Optional[str] = Field(None, description="NCF nota crédito/débito")
    tipo_compra: str = Field(..., description="Tipo de bienes/servicios 01-16")
    fecha_comprobante: str = Field(..., description="YYYYMMDD")
    fecha_pago: str = Field(..., description="YYYYMMDD")
    monto_bienes: float = Field(default=0.0)
    monto_servicios: float = Field(default=0.0)
    total_facturado: float
    itbis_facturado: float = Field(default=0.0)
    itbis_retenido: float = Field(default=0.0)
    itbis_proporcional: float = Field(default=0.0)
    costo_servicio: float = Field(default=0.0)
    bienes_capital: float = Field(default=0.0)
    gastos_sujetos: float = Field(default=0.0)


class ExtractResponse(BaseModel):
    registros: list[Registro606]
    advertencias: list[str] = []
    archivos_procesados: int
