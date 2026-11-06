from decimal import Decimal
from models.formulario_607 import Registro607
from services.txt_generator import _fmt_monto


def generar_txt_607(
    rnc_empresa: str,
    periodo: str,
    registros: list[Registro607],
) -> str:
    """
    Genera el archivo TXT oficial del Formato 607 (Ventas de bienes y servicios).
    Cabecera: 607|RNC|PERIODO|CANTIDAD
    Detalle: 23 columnas oficiales separadas por pleca (|), sin relleno de espacios.
    """
    lineas: list[str] = []
    header = f"607|{rnc_empresa.strip()}|{periodo.strip()}|{len(registros)}"
    lineas.append(header)

    for r in registros:
        tipo_ingreso = (r.tipo_ingreso or "").strip()
        if tipo_ingreso and len(tipo_ingreso) == 1:
            tipo_ingreso = tipo_ingreso.zfill(2)

        campos = [
            (r.rnc_cedula_cliente or "").strip(),             # 1. RNC o Cédula Cliente
            (r.tipo_identificacion or "").strip(),            # 2. Tipo Identificación
            (r.ncf or "").strip(),                            # 3. NCF
            (r.ncf_modificado or "").strip(),                 # 4. NCF Modificado
            tipo_ingreso,                                     # 5. Tipo de Ingreso (01-06)
            (r.fecha_comprobante or "").strip(),              # 6. Fecha Comprobante (AAAAMMDD)
            (r.fecha_retencion or "").strip(),                # 7. Fecha Retención (AAAAMMDD)
            _fmt_monto(r.monto_facturado),                    # 8. Monto Facturado
            _fmt_monto(r.itbis_facturado),                    # 9. ITBIS Facturado
            _fmt_monto(r.itbis_retenido_terceros),            # 10. ITBIS Retenido por Terceros
            _fmt_monto(r.itbis_percibido),                    # 11. ITBIS Percibido
            _fmt_monto(r.retencion_renta_terceros),           # 12. Retención Renta por Terceros
            _fmt_monto(r.isr_percibido),                      # 13. ISR Percibido
            _fmt_monto(r.impuesto_selectivo),                 # 14. Impuesto Selectivo al Consumo
            _fmt_monto(r.otros_impuestos),                    # 15. Otros Impuestos/Tasas
            _fmt_monto(r.propina_legal),                      # 16. Propina Legal
            _fmt_monto(r.monto_efectivo),                     # 17. Efectivo
            _fmt_monto(r.monto_cheque_transferencia),         # 18. Cheque/Transferencia/Depósito
            _fmt_monto(r.monto_tarjeta),                      # 19. Tarjeta Débito/Crédito
            _fmt_monto(r.monto_venta_credito),                # 20. Venta a Crédito
            _fmt_monto(r.monto_bonos_certificados),           # 21. Bonos o Certificados de Regalo
            _fmt_monto(r.monto_permuta),                      # 22. Permuta
            _fmt_monto(r.monto_otras_formas),                 # 23. Otras Formas de Venta
        ]
        lineas.append("|".join(campos))

    return "\r\n".join(lineas)
