import re
from typing import Any, Optional
from pydantic import BaseModel, Field, model_validator


class Registro608(BaseModel):
    """Campos oficiales del Formato 608 de la DGII (Comprobantes Fiscales Anulados)."""

    ncf: str = Field(..., description="Número de Comprobante Fiscal anulado (11 o 13 posiciones)")
    fecha_comprobante: str = Field(..., description="Fecha del comprobante anulado (AAAAMMDD)")
    tipo_anulacion: str = Field(..., description="Tipo de anulación (01 a 07)")
    comentario: Optional[str] = Field(None, description="Observaciones o comentarios adicionales")

    advertencias: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def limpiar_identificadores(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values

        if "ncf" in values and isinstance(values["ncf"], str):
            values["ncf"] = re.sub(r"[-\s]", "", values["ncf"]).strip().upper()

        if "tipo_anulacion" in values and isinstance(values["tipo_anulacion"], str):
            values["tipo_anulacion"] = values["tipo_anulacion"].strip().zfill(2)

        return values

    @model_validator(mode="after")
    def auditar_consistencia(self) -> "Registro608":
        adv: list[str] = list(self.advertencias)
        ncf_len = len(self.ncf) if self.ncf else 0
        if ncf_len not in (11, 13, 19):
            adv.append(f"El NCF anulado '{self.ncf}' tiene una longitud no estándar ({ncf_len} posiciones).")

        self.advertencias = adv
        return self

