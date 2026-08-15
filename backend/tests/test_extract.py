import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@patch("routers.extract.extract_606_from_file")
def test_extract_endpoint_success(mock_extract):
    # Mocking Gemini service response
    mock_extract.return_value = {
        "registros": [
            {
                "rnc_proveedor": "102315965",
                "tipo_id": "1",
                "tipo_compra": "02",
                "ncf": "E320001295311",
                "ncf_modificado": None,
                "fecha_comprobante": "20260728",
                "fecha_pago": None,
                "monto_servicios": 1188.46,
                "monto_bienes": 0.0,
                "itbis_facturado": 213.92,
                "itbis_retenido": 0.0,
                "itbis_proporcional": 0.0,
                "itbis_costo": 0.0,
                "itbis_percibido": 0.0,
                "tipo_retencion_isr": None,
                "monto_retencion_renta": 0.0,
                "isr_percibido": 0.0,
                "impuesto_selectivo": 118.85,
                "otros_impuestos": 23.77,
                "propina_legal": 0.0,
                "forma_pago": "4"
            }
        ],
        "advertencias": []
    }

    # Dummy file to send
    files = {"files": ("factura_wind.pdf", b"pdf_content_dummy", "application/pdf")}
    data = {"formulario": "606"}

    response = client.post("/extract", files=files, data=data)
    
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["archivos_procesados"] == 1
    assert len(json_data["registros"]) == 1
    
    registro = json_data["registros"][0]
    assert registro["rnc_proveedor"] == "102315965"
    assert registro["ncf"] == "E320001295311"
    assert registro["total_facturado"] == 1188.46
    assert registro["itbis_adelantar"] == 213.92
    assert registro["impuesto_selectivo"] == 118.85
    assert registro["otros_impuestos"] == 23.77

def test_extract_endpoint_unsupported_file():
    # Send an unsupported file type
    files = {"files": ("factura_wind.txt", b"txt_content_dummy", "text/plain")}
    data = {"formulario": "606"}

    response = client.post("/extract", files=files, data=data)
    
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["archivos_procesados"] == 0
    assert len(json_data["registros"]) == 0
    assert any("ignorado — tipo no soportado" in adv for adv in json_data["advertencias"])
