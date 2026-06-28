import anthropic
import base64
import json
from pathlib import Path
from core.config import get_settings
from models.formulario_606 import Registro606

PROMPT_606 = """Eres un asistente contable especializado en formularios de la DGII de República Dominicana.

Del documento adjunto, extrae TODOS los registros de compras y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta. NO incluyas texto adicional, ni marcadores de código.

{
  "registros": [
    {
      "rnc_proveedor": "string — RNC o cédula del proveedor (sin guiones)",
      "tipo_id": "1",
      "ncf": "string — ej: B0100000001",
      "ncf_modificado": null,
      "tipo_compra": "01",
      "fecha_comprobante": "YYYYMMDD",
      "fecha_pago": "YYYYMMDD",
      "monto_bienes": 0.00,
      "monto_servicios": 0.00,
      "total_facturado": 0.00,
      "itbis_facturado": 0.00,
      "itbis_retenido": 0.00,
      "itbis_proporcional": 0.00,
      "costo_servicio": 0.00,
      "bienes_capital": 0.00,
      "gastos_sujetos": 0.00
    }
  ],
  "advertencias": []
}

Reglas importantes:
- tipo_id: "1" para RNC, "2" para cédula, "3" para pasaporte
- tipo_compra: "01" bienes, "02" servicios, "03" alquileres, "04" gastos menores, "05" activos, "06" gastos de personal, "07" gastos financieros, "08" gastos representación, "09" otras deducciones, "10" compras al exterior, "11" exportaciones, "12" pagos a nombre terceros, "13" depreciaciones, "14" dividendos, "15" remesas, "16" otros
- Fechas en formato YYYYMMDD sin guiones
- Montos como números decimales sin símbolo de moneda
- Si un campo no está disponible, usa null o 0 según corresponda
- En advertencias incluye cualquier dato faltante o ambiguo que encontraste
"""


async def extract_606_from_file(
    file_bytes: bytes,
    filename: str,
    media_type: str,
) -> dict:
    """
    Envía el archivo a Claude y extrae los campos del Formato 606.
    Soporta PDF e imágenes.
    """
    settings = get_settings()
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    b64 = base64.standard_b64encode(file_bytes).decode("utf-8")

    # Determinar si es PDF o imagen
    if media_type == "application/pdf":
        source = {
            "type": "base64",
            "media_type": "application/pdf",
            "data": b64,
        }
        content_type = "document"
    else:
        source = {
            "type": "base64",
            "media_type": media_type,
            "data": b64,
        }
        content_type = "image"

    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": content_type,
                        "source": source,
                    },
                    {
                        "type": "text",
                        "text": PROMPT_606,
                    },
                ],
            }
        ],
    )

    raw = message.content[0].text.strip()

    # Limpiar posibles backticks si Claude los incluye
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)
