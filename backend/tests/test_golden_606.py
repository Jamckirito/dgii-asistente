from decimal import Decimal
from pathlib import Path
from models.formulario_606 import Registro606
from services.txt_generator import generar_txt_606


def test_generar_txt_606_golden_file():
    """
    Verifica que la salida de generar_txt_606 coincida exactamente con el archivo golden file:
    - Cabecera: 606|RNC|PERIODO|CANTIDAD
    - Detalle: exactamente 23 columnas separadas por plecas (|)
    - Sin espacios de relleno
    - Montos formateados con 2 decimales fijos
    """
    rnc_empresa = "101000000"
    periodo = "202607"

    reg1 = Registro606(
        rnc_proveedor="102315965",
        tipo_id="1",
        tipo_compra="02",
        ncf="E320001295311",
        fecha_comprobante="20260728",
        monto_servicios=Decimal("1188.46"),
        monto_bienes=Decimal("0.00"),
        itbis_facturado=Decimal("213.92"),
        impuesto_selectivo=Decimal("118.85"),
        otros_impuestos=Decimal("23.77"),
        forma_pago="3",
    )

    reg2 = Registro606(
        rnc_proveedor="40200000001",
        tipo_id="2",
        tipo_compra="02",
        ncf="B0100000005",
        fecha_comprobante="20260715",
        fecha_pago="20260720",
        monto_servicios=Decimal("10000.00"),
        monto_bienes=Decimal("0.00"),
        itbis_facturado=Decimal("1800.00"),
        itbis_retenido=Decimal("1800.00"),
        tipo_retencion_isr="2",
        monto_retencion_renta=Decimal("1000.00"),
        forma_pago="2",
    )

    resultado = generar_txt_606(
        rnc_empresa=rnc_empresa,
        periodo=periodo,
        registros=[reg1, reg2],
    )

    # Normalizar retornos de línea para comparación
    resultado_lineas = [l.strip() for l in resultado.splitlines() if l.strip()]

    golden_path = Path(__file__).parent / "golden_files" / "dgii_606_golden.txt"
    golden_lineas = [l.strip() for l in golden_path.read_text(encoding="utf-8").splitlines() if l.strip()]

    assert len(resultado_lineas) == len(golden_lineas)
    assert resultado_lineas == golden_lineas

    # Verificar que cada fila de detalle tenga exactamente 23 columnas
    for linea in resultado_lineas[1:]:
        columnas = linea.split("|")
        assert len(columnas) == 23, f"La fila debe tener 23 columnas, tiene {len(columnas)}: {linea}"
