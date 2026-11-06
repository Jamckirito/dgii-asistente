import pytest
from decimal import Decimal
from models.formulario_606 import Registro606


def test_registro_606_valid_decimal():
    data = {
        "rnc_proveedor": "102315965",
        "tipo_id": "1",
        "tipo_compra": "02",
        "ncf": "E320001295311",
        "fecha_comprobante": "20260728",
        "monto_servicios": "1,188.46",
        "monto_bienes": "0.00",
        "itbis_facturado": "213.92",
        "impuesto_selectivo": "118.85",
        "otros_impuestos": "23.77",
        "forma_pago": "3",
    }

    registro = Registro606(**data)
    assert registro.rnc_proveedor == "102315965"
    assert isinstance(registro.total_facturado, Decimal)
    assert registro.total_facturado == Decimal("1188.46")
    assert registro.itbis_adelantar == Decimal("213.92")
    assert registro.ncf == "E320001295311"
    # Sin advertencias
    assert len(registro.advertencias) == 0


def test_registro_606_tolerant_parsing():
    """Valida parseo de comas, signos de pesos y espacios sin fallar."""
    data = {
        "rnc_proveedor": " 1-02-31596-5 ",
        "tipo_id": "1",
        "tipo_compra": "02",
        "ncf": " e32-000129-5311 ",
        "fecha_comprobante": "20260728",
        "monto_servicios": "RD$ 1,500.25",
        "monto_bienes": "",
        "itbis_facturado": 270.045,
        "forma_pago": "1",
    }
    registro = Registro606(**data)
    assert registro.rnc_proveedor == "102315965"
    assert registro.ncf == "E320001295311"
    assert registro.monto_servicios == Decimal("1500.25")
    assert registro.monto_bienes == Decimal("0.00")
    assert registro.itbis_facturado == Decimal("270.05")


def test_registro_606_warnings_non_blocking():
    """
    Inconsistencias fiscales generan advertencias visibles
    y NO bloquean la edición ni lanzan excepciones que descarten el registro.
    """
    # 1. Falta fecha_pago con retención de ITBIS
    data = {
        "rnc_proveedor": "102315965",
        "tipo_id": "1",
        "tipo_compra": "02",
        "ncf": "E320001295311",
        "fecha_comprobante": "20260728",
        "monto_servicios": 100.0,
        "itbis_facturado": 18.0,
        "itbis_retenido": 18.0,
        "forma_pago": "1",
    }
    registro = Registro606(**data)
    assert any("falta la Fecha de Pago" in w for w in registro.advertencias)

    # 2. Total facturado no coincide con servicios + bienes
    data_inconsistente = {
        "rnc_proveedor": "102315965",
        "tipo_id": "1",
        "tipo_compra": "02",
        "ncf": "E320001295311",
        "fecha_comprobante": "20260728",
        "monto_servicios": 100.0,
        "monto_bienes": 50.0,
        "total_facturado": 300.0,  # No coincide con 150.00
    }
    reg_inc = Registro606(**data_inconsistente)
    # No sobrescribe en silencio
    assert reg_inc.total_facturado == Decimal("300.00")
    assert any("no coincide con la suma" in w for w in reg_inc.advertencias)

    # 3. RNC con dígito verificador inválido
    data_bad_rnc = {
        "rnc_proveedor": "102315969",  # Dígito verificador incorrecto
        "tipo_id": "1",
        "tipo_compra": "02",
        "ncf": "E320001295311",
        "fecha_comprobante": "20260728",
    }
    reg_bad_rnc = Registro606(**data_bad_rnc)
    assert any("dígito verificador" in w for w in reg_bad_rnc.advertencias)
