import pytest
from pydantic import ValidationError
from models.formulario_606 import Registro606

def test_registro_606_valid():
    # Test a valid 606 entry based on the Wind Telecom invoice data
    data = {
        "rnc_proveedor": "102315965",
        "tipo_id": "1",
        "tipo_compra": "02",  # Gastos por trabajos, suministros y servicios
        "ncf": "E320001295311",
        "fecha_comprobante": "20260728",
        "monto_servicios": 1188.46,
        "monto_bienes": 0.0,
        "itbis_facturado": 213.92,
        "impuesto_selectivo": 118.85,
        "otros_impuestos": 23.77,  # CDT
        "forma_pago": "3"  # Tarjeta
    }
    
    registro = Registro606(**data)
    assert registro.rnc_proveedor == "102315965"
    assert registro.total_facturado == 1188.46
    assert registro.itbis_adelantar == 213.92
    assert registro.ncf == "E320001295311"

def test_registro_606_clean_input():
    # Test cleaning hyphens and spaces
    data = {
        "rnc_proveedor": "1-02-31596-5",
        "tipo_id": "1",
        "tipo_compra": "02",
        "ncf": "e32-000129-5311",
        "fecha_comprobante": "20260728",
        "monto_servicios": 100.0,
        "monto_bienes": 50.0,
        "itbis_facturado": 18.0,
        "forma_pago": "1"
    }
    registro = Registro606(**data)
    assert registro.rnc_proveedor == "102315965"
    assert registro.ncf == "E320001295311"
    assert registro.total_facturado == 150.0
    assert registro.itbis_adelantar == 18.0

def test_registro_606_validation_rules():
    # 1. Si itbis_retenido > 0 -> fecha_pago es obligatoria
    data = {
        "rnc_proveedor": "102315965",
        "tipo_id": "1",
        "tipo_compra": "02",
        "ncf": "E320001295311",
        "fecha_comprobante": "20260728",
        "monto_servicios": 100.0,
        "itbis_facturado": 18.0,
        "itbis_retenido": 9.0,
        "forma_pago": "1"
    }
    with pytest.raises(ValidationError) as exc_info:
        Registro606(**data)
    assert "La fecha de pago es obligatoria si hay ITBIS retenido." in str(exc_info.value)

    # 2. Con fecha_pago es válido
    data["fecha_pago"] = "20260730"
    registro = Registro606(**data)
    assert registro.fecha_pago == "20260730"

def test_registro_606_invalid_ncf():
    data = {
        "rnc_proveedor": "102315965",
        "tipo_id": "1",
        "tipo_compra": "02",
        "ncf": "B01",  # Invalid length
        "fecha_comprobante": "20260728",
        "monto_servicios": 100.0,
        "forma_pago": "1"
    }
    with pytest.raises(ValidationError) as exc_info:
        Registro606(**data)
    assert "debe tener 11, 13 o 19 posiciones" in str(exc_info.value)
