from decimal import Decimal
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator
from models.formulario_606 import parse_decimal_tolerant


class Registro609(BaseModel):
    """Campos oficiales del Formato 609 de la DGII (Pagos por servicios al exterior)."""

    identificacion_fiscal_beneficiario: str = Field(..., description="ID fiscal o Tax ID del proveedor extranjero")
    razon_social_beneficiario: str = Field(..., description="Nombre o razón social del proveedor en el exterior")
    pais_residencia: str = Field(..., description="País de residencia fiscal del beneficiario")
    fecha_pago: str = Field(..., description="Fecha de pago (AAAAMMDD)")
    tipo_servicio_exterior: str = Field(default="01", description="Tipo de bien o servicio según catálogo DGII")

    monto_moneda_extranjera: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    codigo_moneda: str = Field(default="USD", description="Código de moneda (USD, EUR, etc.)")
    tasa_cambio: Decimal = Field(default_factory=lambda: Decimal("1.0000"))
    monto_pesos_dominicanos: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    retencion_isr: Decimal = Field(default_factory=lambda: Decimal("0.00"))

    advertencias: list[str] = Field(default_factory=list)

    @field_validator(
        "monto_moneda_extranjera",
        "tasa_cambio",
        "monto_pesos_dominicanos",
        "retencion_isr",
        mode="before",
    )
    @classmethod
    def validar_montos(cls, v: Any) -> Decimal:
        return parse_decimal_tolerant(v)

