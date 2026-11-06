import json
import logging
from typing import Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from core.config import get_settings

logger = logging.getLogger(__name__)

PROMPT_606 = """Eres un asistente contable especializado en formularios de la DGII de República Dominicana (Norma General 07-18).
Del documento adjunto (factura o libro de compras), extrae con total precisión TODOS los registros de compras para el Formato 606.

Reglas tributarias:
- rnc_proveedor: RNC o Cédula sin guiones ni espacios.
- tipo_id: '1' si es RNC (9 dígitos), '2' si es Cédula (11 dígitos).
- tipo_compra: código de clasificación del '01' al '11' (01: Gastos de personal, 02: Gastos por trabajos/servicios, 03: Arrendamientos, 04: Activos fijos, 05: Representación, 06: Otras deducciones, 07: Financieros, 08: Extraordinarios, 09: Costo de venta, 10: Activos, 11: Seguros).
- ncf: Número de comprobante fiscal completo (ej: B0100000001 o e-CF como E320000000001).
- fecha_comprobante: formato YYYYMMDD.
- fecha_pago: formato YYYYMMDD (obligatoria si hay ITBIS retenido o retención de ISR).
- montos: extrae los valores numéricos exactos de servicios, bienes, ITBIS, retenciones, ISC, otros impuestos, propina legal y forma de pago (1: Efectivo, 2: Cheques/Transferencias, 3: Tarjeta, 4: Crédito).
- En 'advertencias', añade cualquier nota sobre legibilidad, datos faltantes o incongruencias numéricas encontradas en el documento.
"""


class GeminiRegistro606Item(BaseModel):
    rnc_proveedor: str = Field(description="RNC (9 dígitos) o Cédula (11 dígitos) del proveedor")
    tipo_id: str = Field(description="'1' si es RNC o '2' si es Cédula")
    tipo_compra: str = Field(description="Código del '01' al '11'")
    ncf: str = Field(description="Número de Comprobante Fiscal completo (sin guiones)")
    ncf_modificado: Optional[str] = Field(None, description="NCF modificado por nota de crédito/débito si aplica")
    fecha_comprobante: str = Field(description="Fecha de emisión en formato YYYYMMDD")
    fecha_pago: Optional[str] = Field(None, description="Fecha de pago en formato YYYYMMDD si aplica")
    monto_servicios: str = Field(default="0.00", description="Monto Facturado en Servicios")
    monto_bienes: str = Field(default="0.00", description="Monto Facturado en Bienes")
    total_facturado: str = Field(default="0.00", description="Total Facturado (Bienes + Servicios)")
    itbis_facturado: str = Field(default="0.00", description="ITBIS Facturado total")
    itbis_retenido: str = Field(default="0.00", description="ITBIS Retenido si aplica")
    itbis_proporcional: str = Field(default="0.00", description="ITBIS proporcional (Art. 349)")
    itbis_costo: str = Field(default="0.00", description="ITBIS llevado al costo")
    itbis_adelantar: str = Field(default="0.00", description="ITBIS a adelantar")
    itbis_percibido: str = Field(default="0.00", description="ITBIS percibido en compras")
    tipo_retencion_isr: Optional[str] = Field(None, description="Código de retención de ISR (1-9)")
    monto_retencion_renta: str = Field(default="0.00", description="Monto de ISR retenido")
    isr_percibido: str = Field(default="0.00", description="ISR percibido en compras")
    impuesto_selectivo: str = Field(default="0.00", description="Impuesto Selectivo al Consumo (ISC)")
    otros_impuestos: str = Field(default="0.00", description="Otros Impuestos y Tasas (CDT, etc.)")
    propina_legal: str = Field(default="0.00", description="Monto de Propina Legal (10%)")
    forma_pago: Optional[str] = Field(None, description="Código de forma de pago (1-7)")


class Gemini606ExtractionResult(BaseModel):
    registros: list[GeminiRegistro606Item]
    advertencias: list[str] = Field(default_factory=list)


# Singleton
_gemini_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        settings = get_settings()
        _gemini_client = genai.Client(api_key=settings.gemini_api_key)
        logger.info("Cliente Gemini inicializado")
    return _gemini_client


async def extract_606_from_file(
    file_bytes: bytes,
    filename: str,
    media_type: str,
) -> dict:
    """
    Envía el archivo a Gemini usando el cliente asíncrono no bloqueante (client.aio)
    y response_schema garantizado por Pydantic.
    """
    client = _get_client()

    part = types.Part.from_bytes(
        data=file_bytes,
        mime_type=media_type,
    )

    # Llamada asíncrona no bloqueante con esquema estructurado garantizado
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=[part, PROMPT_606],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=Gemini606ExtractionResult,
            temperature=0.0,
        ),
    )

    if not response.text:
        raise ValueError(f"Gemini no devolvió contenido de texto para '{filename}'.")

    raw = response.text.strip()
    data = json.loads(raw)
    return data
