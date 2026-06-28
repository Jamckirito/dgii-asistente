from pydantic import BaseModel, Field, model_validator
from typing import Optional


class Registro606(BaseModel):
    """Campos exactos del Formato 606 de la DGII (23 columnas oficiales)"""
    rnc_proveedor: str = Field(..., description="RNC o cédula del proveedor (sin guiones ni espacios)")
    tipo_id: str = Field(..., description="1=RNC, 2=Cédula")
    tipo_compra: str = Field(..., description="Tipo de bienes y servicios comprados (01-11)")
    ncf: str = Field(..., description="Número de comprobante fiscal completo (11, 13 o 19 posiciones)")
    ncf_modificado: Optional[str] = Field(None, description="NCF afectado por nota de crédito/débito")
    fecha_comprobante: str = Field(..., description="Fecha del comprobante (AAAAMMDD)")
    fecha_pago: Optional[str] = Field(None, description="Fecha de pago (AAAAMMDD)")
    monto_servicios: float = Field(default=0.0, description="Monto Facturado en Servicios")
    monto_bienes: float = Field(default=0.0, description="Monto Facturado en Bienes")
    total_facturado: float = Field(default=0.0, description="Total Monto Facturado (Monto Bienes + Monto Servicios)")
    itbis_facturado: float = Field(default=0.0, description="ITBIS Facturado")
    itbis_retenido: float = Field(default=0.0, description="ITBIS Retenido")
    itbis_proporcional: float = Field(default=0.0, description="ITBIS sujeto a Proporcionalidad (Art. 349)")
    itbis_costo: float = Field(default=0.0, description="ITBIS llevado al Costo")
    itbis_adelantar: float = Field(default=0.0, description="ITBIS por Adelantar")
    itbis_percibido: float = Field(default=0.0, description="ITBIS percibido en compras")
    tipo_retencion_isr: Optional[str] = Field(None, description="Tipo de Retención en ISR (1-9)")
    monto_retencion_renta: float = Field(default=0.0, description="Monto Retención Renta")
    isr_percibido: float = Field(default=0.0, description="ISR Percibido en compras")
    impuesto_selectivo: float = Field(default=0.0, description="Impuesto Selectivo al Consumo")
    otros_impuestos: float = Field(default=0.0, description="Otros Impuestos/Tasas")
    propina_legal: float = Field(default=0.0, description="Monto Propina Legal")
    forma_pago: Optional[str] = Field(None, description="Forma de Pago (1-7)")

    @model_validator(mode="before")
    @classmethod
    def compute_fields(cls, values: dict) -> dict:
        # Calcular total_facturado
        monto_bienes = float(values.get("monto_bienes") or 0.0)
        monto_servicios = float(values.get("monto_servicios") or 0.0)
        values["total_facturado"] = round(monto_bienes + monto_servicios, 2)

        # Calcular itbis_adelantar = itbis_facturado - itbis_costo
        itbis_facturado = float(values.get("itbis_facturado") or 0.0)
        itbis_costo = float(values.get("itbis_costo") or 0.0)
        values["itbis_adelantar"] = round(itbis_facturado - itbis_costo, 2)

        # Limpiar RNC/Cédula y NCF si traen guiones, espacios o están en minúsculas
        if "rnc_proveedor" in values and isinstance(values["rnc_proveedor"], str):
            values["rnc_proveedor"] = values["rnc_proveedor"].replace("-", "").replace(" ", "").strip()
        if "ncf" in values and isinstance(values["ncf"], str):
            values["ncf"] = values["ncf"].replace("-", "").replace(" ", "").strip().upper()
        if "ncf_modificado" in values and isinstance(values["ncf_modificado"], str):
            values["ncf_modificado"] = values["ncf_modificado"].replace("-", "").replace(" ", "").strip().upper()

        return values

    @model_validator(mode="after")
    def validate_rules(self) -> "Registro606":
        # 1. Si itbis_retenido > 0 → fecha_pago es obligatoria
        if self.itbis_retenido > 0 and not self.fecha_pago:
            raise ValueError("La fecha de pago es obligatoria si hay ITBIS retenido.")

        # 2. Si tipo_retencion_isr está lleno → fecha_pago es obligatoria
        if self.tipo_retencion_isr and not self.fecha_pago:
            raise ValueError("La fecha de pago es obligatoria si se especifica un Tipo de Retención en ISR.")

        # 3. Si monto_retencion_renta > 0 → fecha_pago es obligatoria
        if self.monto_retencion_renta > 0 and not self.fecha_pago:
            raise ValueError("La fecha de pago es obligatoria si hay Retención de Renta.")

        # 4. NCF: 11 o 13 posiciones alfanuméricas (o 19 para históricos)
        ncf_len = len(self.ncf) if self.ncf else 0
        if ncf_len not in (11, 13, 19):
            raise ValueError(f"El NCF '{self.ncf}' debe tener 11, 13 o 19 posiciones.")

        return self


class ExtractResponse(BaseModel):
    registros: list[Registro606]
    advertencias: list[str] = []
    archivos_procesados: int

