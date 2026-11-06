from models.formulario_608 import Registro608


def generar_txt_608(
    rnc_empresa: str,
    periodo: str,
    registros: list[Registro608],
) -> str:
    """
    Genera el archivo TXT oficial del Formato 608 (Comprobantes Anulados).
    Cabecera: 608|RNC|PERIODO|CANTIDAD
    Detalle: 3 columnas oficiales (NCF|FechaComprobante|TipoAnulacion).
    """
    lineas: list[str] = []
    header = f"608|{rnc_empresa.strip()}|{periodo.strip()}|{len(registros)}"
    lineas.append(header)

    for r in registros:
        tipo_anulacion = (r.tipo_anulacion or "").strip().zfill(2)
        campos = [
            (r.ncf or "").strip(),                  # 1. NCF Anulado
            (r.fecha_comprobante or "").strip(),    # 2. Fecha Comprobante (AAAAMMDD)
            tipo_anulacion,                         # 3. Tipo de Anulación (01-07)
        ]
        lineas.append("|".join(campos))

    return "\r\n".join(lineas)

