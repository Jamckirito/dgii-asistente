from decimal import Decimal
from models.formulario_606 import Registro606


def _fmt_monto(valor: Decimal | float | int | None) -> str:
    """Formatea montos según especificación DGII: exactamente dos decimales fijos."""
    if valor is None:
        return "0.00"
    dec = Decimal(str(valor))
    return f"{dec:.2f}"


def generar_txt_606(
    rnc_empresa: str,
    periodo: str,
    registros: list[Registro606],
) -> str:
    """
    Genera el archivo TXT oficial del Formato 606 según la Norma 07-18 de la DGII.
    Cabecera: 606|RNC|PERIODO|CANTIDAD
    Detalle: 23 columnas separadas por pleca (|), sin relleno de espacios en blanco.
    Campos vacíos como cadena vacía (""). Montos con 2 decimales obligatorios.
    """
    lineas: list[str] = []

    # Cabecera oficial: 606|RNC_EMPRESA|PERIODO|CANTIDAD_REGISTROS
    header = f"606|{rnc_empresa.strip()}|{periodo.strip()}|{len(registros)}"
    lineas.append(header)

    for r in registros:
        tipo_compra = (r.tipo_compra or "").strip()
        if tipo_compra and len(tipo_compra) == 1:
            tipo_compra = tipo_compra.zfill(2)

        campos = [
            (r.rnc_proveedor or "").strip(),                  # Col 1: RNC/Cédula Proveedor
            (r.tipo_id or "").strip(),                        # Col 2: Tipo Identificación (1=RNC, 2=Cédula)
            tipo_compra,                                      # Col 3: Tipo de Bienes y Servicios (01-11)
            (r.ncf or "").strip(),                            # Col 4: NCF
            (r.ncf_modificado or "").strip(),                 # Col 5: NCF Modificado
            (r.fecha_comprobante or "").strip(),              # Col 6: Fecha Comprobante (AAAAMMDD)
            (r.fecha_pago or "").strip(),                     # Col 7: Fecha Pago (AAAAMMDD)
            _fmt_monto(r.monto_servicios),                    # Col 8: Monto Facturado en Servicios
            _fmt_monto(r.monto_bienes),                       # Col 9: Monto Facturado en Bienes
            _fmt_monto(r.total_facturado),                    # Col 10: Total Monto Facturado
            _fmt_monto(r.itbis_facturado),                    # Col 11: ITBIS Facturado
            _fmt_monto(r.itbis_retenido),                     # Col 12: ITBIS Retenido
            _fmt_monto(r.itbis_proporcional),                 # Col 13: ITBIS sujeto a Proporcionalidad
            _fmt_monto(r.itbis_costo),                        # Col 14: ITBIS llevado al Costo
            _fmt_monto(r.itbis_adelantar),                    # Col 15: ITBIS por Adelantar
            _fmt_monto(r.itbis_percibido),                    # Col 16: ITBIS percibido en compras
            (r.tipo_retencion_isr or "").strip(),             # Col 17: Tipo de Retención en ISR
            _fmt_monto(r.monto_retencion_renta),              # Col 18: Monto Retención Renta
            _fmt_monto(r.isr_percibido),                      # Col 19: ISR Percibido en compras
            _fmt_monto(r.impuesto_selectivo),                 # Col 20: Impuesto Selectivo al Consumo
            _fmt_monto(r.otros_impuestos),                    # Col 21: Otros Impuestos/Tasas
            _fmt_monto(r.propina_legal),                      # Col 22: Monto Propina Legal
            (r.forma_pago or "").strip(),                     # Col 23: Forma de Pago
        ]
        lineas.append("|".join(campos))

    return "\r\n".join(lineas)
