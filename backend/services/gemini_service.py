from google import genai
from google.genai import types
import json
from core.config import get_settings

PROMPT_606 = """Eres un asistente contable especializado en formularios de la DGII de República Dominicana.

Del documento adjunto, extrae TODOS los registros de compras y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta. NO incluyas texto adicional, ni marcadores de código.

{
  "registros": [
    {
      "rnc_proveedor": "string — RNC o cédula del proveedor (sin guiones ni espacios)",
      "tipo_id": "string — '1' si es RNC (9 dígitos), '2' si es Cédula (11 dígitos)",
      "tipo_compra": "string — código de clasificación de la compra del '01' al '11'",
      "ncf": "string — ej: B0100000001 (sin espacios)",
      "ncf_modificado": null,
      "fecha_comprobante": "string — YYYYMMDD",
      "fecha_pago": null,
      "monto_servicios": 0.00,
      "monto_bienes": 0.00,
      "itbis_facturado": 0.00,
      "itbis_retenido": 0.00,
      "itbis_proporcional": 0.00,
      "itbis_costo": 0.00,
      "itbis_percibido": 0.00,
      "tipo_retencion_isr": null,
      "monto_retencion_renta": 0.00,
      "isr_percibido": 0.00,
      "impuesto_selectivo": 0.00,
      "otros_impuestos": 0.00,
      "propina_legal": 0.00,
      "forma_pago": "string — código de la forma de pago del '1' al '7'"
    }
  ],
  "advertencias": []
}

Reglas importantes:
- rnc_proveedor: RNC o Cédula del proveedor. Limpia guiones y espacios.
- tipo_id: "1" si es RNC, "2" si es Cédula.
- tipo_compra: Clasifica la compra usando obligatoriamente uno de estos códigos:
  * "01": Gastos de personal
  * "02": Gastos por trabajos, suministros y servicios
  * "03": Arrendamientos
  * "04": Gastos de activos fijos
  * "05": Gastos de representación
  * "06": Otras deducciones admitidas
  * "07": Gastos financieros
  * "08": Gastos extraordinarios
  * "09": Compras y gastos que formarán parte del costo de venta
  * "10": Adquisiciones de activos
  * "11": Gastos de seguros
- ncf: Número de Comprobante Fiscal completo (11 o 13 posiciones alfanuméricas). Si empieza con 'E' es e-CF.
- ncf_modificado: Solo si la factura es afectada por Nota de Crédito/Débito.
- fecha_comprobante: Fecha de emisión en formato YYYYMMDD sin guiones.
- fecha_pago: Fecha de pago en formato YYYYMMDD sin guiones (usar null si no se ha pagado o no se indica). Obligatoria si itbis_retenido > 0 o tipo_retencion_isr tiene valor o monto_retencion_renta > 0.
- monto_servicios: Suma de montos de servicios facturados sin incluir ITBIS ni otros impuestos.
- monto_bienes: Suma de montos de bienes facturados sin incluir ITBIS ni otros impuestos.
- itbis_facturado: ITBIS total facturado.
- itbis_retenido: ITBIS retenido si aplica.
- itbis_proporcional: ITBIS sujeto a proporcionalidad (Art. 349).
- itbis_costo: ITBIS llevado al costo directamente.
- itbis_percibido: ITBIS percibido en compras.
- tipo_retencion_isr: Código de retención de ISR si aplica (del 1 al 9):
  * "1": Alquileres
  * "2": Honorarios por servicios
  * "3": Otras rentas
  * "4": Otras rentas (rentas presuntas)
  * "5": Intereses pagados a personas jurídicas residentes
  * "6": Intereses pagados a personas físicas residentes
  * "7": Retención por proveedores del Estado
  * "8": Juegos telefónicos
  * "9": Retenciones subsector de ganadería de carne bovina
- monto_retencion_renta: Monto del ISR retenido.
- isr_percibido: ISR percibido en compras.
- impuesto_selectivo: Impuesto Selectivo al Consumo (ISC).
- otros_impuestos: Otros impuestos o tasas.
- propina_legal: Propina de ley (10%).
- forma_pago: Código del método de pago utilizado (del 1 al 7):
  * "1": Efectivo
  * "2": Cheques/Transferencias/Depósito
  * "3": Tarjeta crédito/débito
  * "4": Compra a crédito
  * "5": Permuta
  * "6": Notas de crédito
  * "7": Mixto
- En 'advertencias' añade notas sobre valores dudosos o campos incompletos hallados en el documento.
"""


async def extract_606_from_file(
    file_bytes: bytes,
    filename: str,
    media_type: str,
) -> dict:
    """
    Envía el archivo a Gemini y extrae los campos del Formato 606.
    Soporta PDF e imágenes.
    """
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)

    # El SDK moderno de Gemini recibe Part.from_bytes para multimedia
    part = types.Part.from_bytes(
        data=file_bytes,
        mime_type=media_type,
    )

    # Gemini 2.5 Flash es excelente para esto
    # Se habilita response_mime_type="application/json" para asegurar que la respuesta sea JSON válido
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[part, PROMPT_606],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()
    return json.loads(raw)
