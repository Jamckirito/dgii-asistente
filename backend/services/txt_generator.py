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
            r.rnc_proveedor.ljust(11),
            r.tipo_id,
            r.ncf.ljust(19),
            (r.ncf_modificado or "").ljust(19),
            r.tipo_compra.zfill(2),
            r.fecha_comprobante,
            r.fecha_pago,
            _fmt_monto(r.monto_bienes),
            _fmt_monto(r.monto_servicios),
            _fmt_monto(r.total_facturado),
            _fmt_monto(r.itbis_facturado),
            _fmt_monto(r.itbis_retenido),
            _fmt_monto(r.itbis_proporcional),
            _fmt_monto(r.costo_servicio),
            _fmt_monto(r.bienes_capital),
            _fmt_monto(r.gastos_sujetos),
        ]
        lineas.append("|".join(campos))

    return "\n".join(lineas)


def _fmt_monto(valor: float) -> str:
    """Formatea montos al formato DGII: sin decimales si es entero."""
    if valor == int(valor):
        return str(int(valor))
    return f"{valor:.2f}"
