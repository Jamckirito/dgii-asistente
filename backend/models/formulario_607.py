import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from models.formulario_606 import parse_decimal_tolerant, validar_algoritmo_rnc, validar_algoritmo_cedula


class Registro607(BaseModel):
    """Campos oficiales del Formato 607 de la DGII (Ventas de bienes y servicios)."""

    rnc_cedula_cliente: str = Field(default="", description="RNC, Cédula o Pasaporte del cliente")
    tipo_identificacion: str = Field(default="1", description="1=RNC, 2=Cédula, 3=Pasaporte")
    ncf: str = Field(default="", description="Número de Comprobante Fiscal emitido")
    ncf_modificado: Optional[str] = Field(None, description="NCF afectado si es Nota de Crédito/Débito")
    tipo_ingreso: str = Field(default="01", description="Tipo de ingreso (01 a 06)")
    fecha_comprobante: str = Field(default="", description="Fecha de emisión AAAAMMDD")
    fecha_retencion: Optional[str] = Field(None, description="Fecha de retención AAAAMMDD")

    # Importes e impuestos
    monto_facturado: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_facturado: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_retenido_terceros: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_percibido: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    retencion_renta_terceros: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    isr_percibido: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    impuesto_selectivo: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    otros_impuestos: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    propina_legal: Decimal = Field(default_factory=lambda: Decimal("0.00"))

    # Formas de cobro
    monto_efectivo: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    monto_cheque_transferencia: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    monto_tarjeta: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    monto_venta_credito: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    monto_bonos_certificados: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    monto_permuta: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    monto_otras_formas: Decimal = Field(default_factory=lambda: Decimal("0.00"))

    advertencias: list[str] = Field(default_factory=list)

    @field_validator(
        "monto_facturado",
        "itbis_facturado",
        "itbis_retenido_terceros",
        "itbis_percibido",
        "retencion_renta_terceros",
        "isr_percibido",
        "impuesto_selectivo",
        "otros_impuestos",
        "propina_legal",
        "monto_efectivo",
        "monto_cheque_transferencia",
        "monto_tarjeta",
        "monto_venta_credito",
        "monto_bonos_certificados",
        "monto_permuta",
        "monto_otras_formas",
        mode="before",
    )
    @classmethod
    def validar_montos(cls, v: Any) -> Decimal:
        return parse_decimal_tolerant(v)

    @model_validator(mode="before")
    @classmethod
    def limpiar_identificadores(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values

        if "rnc_cedula_cliente" in values and isinstance(values["rnc_cedula_cliente"], str):
            values["rnc_cedula_cliente"] = re.sub(r"[-\s]", "", values["rnc_cedula_cliente"]).strip()

        if "ncf" in values and isinstance(values["ncf"], str):
            values["ncf"] = re.sub(r"[-\s]", "", values["ncf"]).strip().upper()

        if "ncf_modificado" in values and isinstance(values["ncf_modificado"], str):
            clean = re.sub(r"[-\s]", "", values["ncf_modificado"]).strip().upper()
            values["ncf_modificado"] = clean if clean else None

        return values

    @model_validator(mode="after")
    def auditar_consistencia(self) -> "Registro607":
        adv: list[str] = list(self.advertencias)

        if self.rnc_cedula_cliente:
            if self.tipo_identificacion == "1" and not validar_algoritmo_rnc(self.rnc_cedula_cliente):
                adv.append(f"El RNC del cliente '{self.rnc_cedula_cliente}' no supera el dígito verificador.")
            elif self.tipo_identificacion == "2" and not validar_algoritmo_cedula(self.rnc_cedula_cliente):
                adv.append(f"La Cédula del cliente '{self.rnc_cedula_cliente}' no supera el dígito verificador.")

        if (self.itbis_retenido_terceros > Decimal("0.00") or self.retencion_renta_terceros > Decimal("0.00")) and not self.fecha_retencion:
            adv.append("Existe ITBIS o ISR retenido pero falta la Fecha de Retención.")

        self.advertencias = adv
        return self
