from models.formulario_606 import Registro606


def generar_txt_606(
    rnc_empresa: str,
    periodo: str,
    registros: list[Registro606],
) -> str:
    """
    Genera el contenido del archivo TXT del Formato 606
    según las especificaciones oficiales de la DGII.
    """
    lineas: list[str] = []
    
    # Encabezado obligatorio del formato 606 (Norma 07-18)
    # formato: TipoReporte(606)|RNC|Periodo(AAAAMM)|CantidadRegistros
    header = f"606|{rnc_empresa}|{periodo}|{len(registros)}"
    lineas.append(header)

    for r in registros:
        campos = [
            rnc_empresa.ljust(11),
            periodo,                                      # YYYYMM
            r.rnc_proveedor.ljust(11),                    # Col 1: RNC/Cédula
            r.tipo_id,                                    # Col 2: Tipo Id
            r.tipo_compra.zfill(2),                       # Col 3: Tipo Compra
            r.ncf.ljust(19),                              # Col 4: NCF
            (r.ncf_modificado or "").ljust(19),           # Col 5: NCF Modificado
            r.fecha_comprobante,                          # Col 6: F. Comprobante
            (r.fecha_pago or "").ljust(8),                # Col 7: F. Pago
            _fmt_monto(r.monto_servicios),                # Col 8: Monto Servicios
            _fmt_monto(r.monto_bienes),                   # Col 9: Monto Bienes
            _fmt_monto(r.total_facturado),                # Col 10: Total Facturado
            _fmt_monto(r.itbis_facturado),                # Col 11: ITBIS Facturado
            _fmt_monto(r.itbis_retenido),                 # Col 12: ITBIS Retenido
            _fmt_monto(r.itbis_proporcional),             # Col 13: ITBIS Proporcional
            _fmt_monto(r.itbis_costo),                    # Col 14: ITBIS Costo
            _fmt_monto(r.itbis_adelantar),                # Col 15: ITBIS Adelantar
            _fmt_monto(r.itbis_percibido),                # Col 16: ITBIS Percibido
            (r.tipo_retencion_isr or "").ljust(1),        # Col 17: Tipo Retención ISR
            _fmt_monto(r.monto_retencion_renta),          # Col 18: Retención ISR
            _fmt_monto(r.isr_percibido),                  # Col 19: ISR Percibido
            _fmt_monto(r.impuesto_selectivo),             # Col 20: ISC
            _fmt_monto(r.otros_impuestos),                # Col 21: Otros Impuestos
            _fmt_monto(r.propina_legal),                  # Col 22: Propina Legal
            (r.forma_pago or "").ljust(1),                # Col 23: Forma de Pago
        ]
        lineas.append("|".join(campos))

    return "\n".join(lineas)


def _fmt_monto(valor: float) -> str:
    """Formatea montos al formato DGII: sin decimales si es entero."""
    if valor == int(valor):
        return str(int(valor))
    return f"{valor:.2f}"
