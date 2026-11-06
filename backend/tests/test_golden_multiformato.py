from decimal import Decimal
from pathlib import Path
from models.formulario_607 import Registro607
from models.formulario_608 import Registro608
from models.formulario_609 import Registro609
from services.txt_generator_607 import generar_txt_607
from services.txt_generator_608 import generar_txt_608
from services.txt_generator_609 import generar_txt_609


def test_generar_txt_607_golden():
    reg = Registro607(
        rnc_cedula_cliente="102315965",
        tipo_identificacion="1",
        ncf="E31000000001",
        tipo_ingreso="01",
        fecha_comprobante="20260720",
        monto_facturado=Decimal("50000.00"),
        itbis_facturado=Decimal("9000.00"),
        monto_efectivo=Decimal("59000.00"),
    )

    txt = generar_txt_607(rnc_empresa="101000000", periodo="202607", registros=[reg])
    lineas = [l.strip() for l in txt.splitlines() if l.strip()]

    golden_path = Path(__file__).parent / "golden_files" / "dgii_607_golden.txt"
    golden_lineas = [l.strip() for l in golden_path.read_text(encoding="utf-8").splitlines() if l.strip()]

    assert lineas == golden_lineas
    # Verificar que el detalle tenga 23 columnas
    assert len(lineas[1].split("|")) == 23


def test_generar_txt_608_golden():
    reg = Registro608(
        ncf="B0100000099",
        fecha_comprobante="20260715",
        tipo_anulacion="02",
    )

    txt = generar_txt_608(rnc_empresa="101000000", periodo="202607", registros=[reg])
    lineas = [l.strip() for l in txt.splitlines() if l.strip()]

    golden_path = Path(__file__).parent / "golden_files" / "dgii_608_golden.txt"
    golden_lineas = [l.strip() for l in golden_path.read_text(encoding="utf-8").splitlines() if l.strip()]

    assert lineas == golden_lineas
    # Verificar que el detalle tenga 3 columnas
    assert len(lineas[1].split("|")) == 3


def test_generar_txt_609_golden():
    reg = Registro609(
        identificacion_fiscal_beneficiario="US987654321",
        razon_social_beneficiario="Amazon Web Services Inc",
        pais_residencia="Estados Unidos",
        fecha_pago="20260710",
        tipo_servicio_exterior="02",
        monto_moneda_extranjera=Decimal("1500.00"),
        codigo_moneda="USD",
        tasa_cambio=Decimal("60.2500"),
        monto_pesos_dominicanos=Decimal("90375.00"),
        retencion_isr=Decimal("24393.75"),
    )

    txt = generar_txt_609(rnc_empresa="101000000", periodo="202607", registros=[reg])
    lineas = [l.strip() for l in txt.splitlines() if l.strip()]

    golden_path = Path(__file__).parent / "golden_files" / "dgii_609_golden.txt"
    golden_lineas = [l.strip() for l in golden_path.read_text(encoding="utf-8").splitlines() if l.strip()]

    assert lineas == golden_lineas
    # Verificar que el detalle tenga 10 columnas
    assert len(lineas[1].split("|")) == 10
