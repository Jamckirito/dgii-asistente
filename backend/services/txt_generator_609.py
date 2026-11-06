from decimal import Decimal
from models.formulario_609 import Registro609
from services.txt_generator import _fmt_monto


def generar_txt_609(
    rnc_empresa: str,
    periodo: str,
    registros: list[Registro609],
) -> str:
    """
    Genera el archivo TXT oficial del Formato 609 (Pagos por servicios al exterior).
    Cabecera: 609|RNC|PERIODO|CANTIDAD
    Detalle: 10 columnas oficiales.
    """
    lineas: list[str] = []
    header = f"609|{rnc_empresa.strip()}|{periodo.strip()}|{len(registros)}"
    lineas.append(header)

    for r in registros:
        tipo_servicio = (r.tipo_servicio_exterior or "").strip().zfill(2)
        tasa_str = f"{float(r.tasa_cambio):.4f}"

        campos = [
            (r.identificacion_fiscal_beneficiario or "").strip(), # 1. Tax ID Beneficiario
            (r.razon_social_beneficiario or "").strip(),          # 2. Nombre / Razón Social
            (r.pais_residencia or "").strip(),                    # 3. País de Residencia
            (r.fecha_pago or "").strip(),                         # 4. Fecha de Pago (AAAAMMDD)
            tipo_servicio,                                        # 5. Tipo de Servicio al Exterior
            _fmt_monto(r.monto_moneda_extranjera),                # 6. Monto Moneda Extranjera
            (r.codigo_moneda or "USD").strip().upper(),           # 7. Código de Moneda
            tasa_str,                                             # 8. Tasa de Cambio (4 decimales)
            _fmt_monto(r.monto_pesos_dominicanos),                # 9. Monto en Pesos Dominicanos
            _fmt_monto(r.retencion_isr),                          # 10. Retención de ISR
        ]
        lineas.append("|".join(campos))

    return "\r\n".join(lineas)

