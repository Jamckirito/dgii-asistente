import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


def parse_decimal_tolerant(value: Any) -> Decimal:
    """
    Parsea de forma tolerante importes monetarios con comas, espacios, vacíos o símbolos.
    Retorna siempre un Decimal con 2 decimales fijos (ej. Decimal("123.45")).
    """
    if value is None:
        return Decimal("0.00")
    if isinstance(value, Decimal):
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if isinstance(value, (int, float)):
        return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    val_str = str(value).strip()
    # Eliminar cualquier carácter que no sea dígito, coma, punto o signo negativo
    val_str = re.sub(r"[^\d.,\-]", "", val_str)
    if not val_str:
        return Decimal("0.00")

    # Separadores de miles vs decimales
    if "," in val_str and "." in val_str:
        if val_str.rfind(",") < val_str.rfind("."):
            # Formato estándar 1,234.56
            val_str = val_str.replace(",", "")
        else:
            # Formato europeo 1.234,56
            val_str = val_str.replace(".", "").replace(",", ".")
    elif "," in val_str and "." not in val_str:
        partes = val_str.split(",")
        if len(partes) == 2 and len(partes[1]) == 2:
            val_str = val_str.replace(",", ".")
        else:
            val_str = val_str.replace(",", "")

    try:
        return Decimal(val_str).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        return Decimal("0.00")


def validar_algoritmo_rnc(rnc: str) -> bool:
    """Valida RNC de 9 dígitos según algoritmo de Módulo 11 de la DGII."""
    if not re.fullmatch(r"\d{9}", rnc):
        return False
    pesos = [7, 9, 8, 6, 5, 4, 3, 2]
    suma = sum(int(rnc[i]) * pesos[i] for i in range(8))
    resto = suma % 11
    digito = 2 if resto == 0 else (1 if resto == 1 else 11 - resto)
    return digito == int(rnc[8])


def validar_algoritmo_cedula(cedula: str) -> bool:
    """Valida Cédula dominicana de 11 dígitos según algoritmo de Luhn (Módulo 10)."""
    if not re.fullmatch(r"\d{11}", cedula):
        return False
    multiplicadores = [1, 2] * 5
    suma = 0
    for i in range(10):
        prod = int(cedula[i]) * multiplicadores[i]
        suma += (prod // 10) + (prod % 10)
    verificador = (10 - (suma % 10)) % 10
    return verificador == int(cedula[10])


class Registro606(BaseModel):
    """Campos oficiales del Formato 606 de la DGII con tipos Decimal y validación tolerante."""

    rnc_proveedor: str = Field(default="", description="RNC o cédula del proveedor")
    tipo_id: str = Field(default="1", description="1=RNC, 2=Cédula")
    tipo_compra: str = Field(default="02", description="Tipo de bienes y servicios (01-11)")
    ncf: str = Field(default="", description="Número de Comprobante Fiscal")
    ncf_modificado: Optional[str] = Field(None, description="NCF afectado por nota de crédito/débito")
    fecha_comprobante: str = Field(default="", description="Fecha de emisión AAAAMMDD")
    fecha_pago: Optional[str] = Field(None, description="Fecha de pago AAAAMMDD")

    # Montos monetarios con Decimal exacto
    monto_servicios: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    monto_bienes: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    total_facturado: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_facturado: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_retenido: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_proporcional: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_costo: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_adelantar: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    itbis_percibido: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    tipo_retencion_isr: Optional[str] = Field(None, description="Tipo de retención ISR (1-9)")
    monto_retencion_renta: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    isr_percibido: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    impuesto_selectivo: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    otros_impuestos: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    propina_legal: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    forma_pago: Optional[str] = Field(None, description="Forma de pago (1-7)")

    # Advertencias visibles de consistencia (sin bloquear edición)
    advertencias: list[str] = Field(default_factory=list, description="Advertencias no bloqueantes de consistencia fiscal")

    @field_validator(
        "monto_servicios",
        "monto_bienes",
        "total_facturado",
        "itbis_facturado",
        "itbis_retenido",
        "itbis_proporcional",
        "itbis_costo",
        "itbis_adelantar",
        "itbis_percibido",
        "monto_retencion_renta",
        "isr_percibido",
        "impuesto_selectivo",
        "otros_impuestos",
        "propina_legal",
        mode="before",
    )
    @classmethod
    def validar_montos_tolerante(cls, v: Any) -> Decimal:
        return parse_decimal_tolerant(v)

    @model_validator(mode="before")
    @classmethod
    def limpiar_identificadores(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values

        # Limpiar RNC/Cédula
        if "rnc_proveedor" in values and isinstance(values["rnc_proveedor"], str):
            values["rnc_proveedor"] = re.sub(r"[-\s]", "", values["rnc_proveedor"]).strip()

        # Limpiar NCF
        if "ncf" in values and isinstance(values["ncf"], str):
            values["ncf"] = re.sub(r"[-\s]", "", values["ncf"]).strip().upper()

        if "ncf_modificado" in values and isinstance(values["ncf_modificado"], str):
            clean = re.sub(r"[-\s]", "", values["ncf_modificado"]).strip().upper()
            values["ncf_modificado"] = clean if clean else None

        return values

    @model_validator(mode="after")
    def auditar_inconsistencias(self) -> "Registro606":
        adv: list[str] = list(self.advertencias)

        # 1. Auditoría de Total Facturado
        suma_calculada = self.monto_servicios + self.monto_bienes
        if self.total_facturado == Decimal("0.00") and suma_calculada > Decimal("0.00"):
            self.total_facturado = suma_calculada
        elif self.total_facturado > Decimal("0.00") and self.total_facturado != suma_calculada:
            adv.append(
                f"El Total Facturado ({self.total_facturado}) no coincide con la suma de servicios ({self.monto_servicios}) y bienes ({self.monto_bienes})."
            )

        # 2. Auditoría de ITBIS
        if self.itbis_adelantar == Decimal("0.00") and self.itbis_facturado > Decimal("0.00"):
            self.itbis_adelantar = max(Decimal("0.00"), self.itbis_facturado - self.itbis_costo - self.itbis_retenido)

        if (self.itbis_retenido + self.itbis_costo + self.itbis_adelantar) > (self.itbis_facturado + Decimal("0.01")):
            adv.append(
                f"La suma de ITBIS retenido ({self.itbis_retenido}), costo ({self.itbis_costo}) y adelantar ({self.itbis_adelantar}) excede el ITBIS facturado ({self.itbis_facturado})."
            )

        # 3. Auditoría de Fecha de Pago cuando hay retenciones
        if self.itbis_retenido > Decimal("0.00") and not self.fecha_pago:
            adv.append("Hay ITBIS retenido pero falta la Fecha de Pago (requerida por DGII).")

        if self.monto_retencion_renta > Decimal("0.00") and not self.fecha_pago:
            adv.append("Hay Retención de Renta pero falta la Fecha de Pago (requerida por DGII).")

        if self.tipo_retencion_isr and not self.fecha_pago:
            adv.append("Se especificó Tipo de Retención ISR pero falta la Fecha de Pago (requerida por DGII).")

        # 4. Auditoría de algoritmo de RNC / Cédula
        if self.rnc_proveedor:
            if self.tipo_id == "1":
                if len(self.rnc_proveedor) != 9 or not validar_algoritmo_rnc(self.rnc_proveedor):
                    adv.append(f"El RNC '{self.rnc_proveedor}' no supera la validación del dígito verificador (Módulo 11).")
            elif self.tipo_id == "2":
                if len(self.rnc_proveedor) != 11 or not validar_algoritmo_cedula(self.rnc_proveedor):
                    adv.append(f"La Cédula '{self.rnc_proveedor}' no supera la validación de dígito verificador (Luhn).")

        # 5. Auditoría de NCF
        ncf_len = len(self.ncf) if self.ncf else 0
        if self.ncf and ncf_len not in (11, 13, 19):
            adv.append(f"El NCF '{self.ncf}' tiene longitud no estándar ({ncf_len} caracteres).")

        self.advertencias = adv
        return self


class ExtractResponse(BaseModel):
    registros: list[Registro606]
    advertencias: list[str] = []
    archivos_procesados: int
