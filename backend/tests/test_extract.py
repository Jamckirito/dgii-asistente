import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from core.rate_limit import extraction_rate_limiter

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token"}


def test_extract_endpoint_unauthorized():
    files = {"files": ("factura.pdf", b"%PDF-1.4 dummy", "application/pdf")}
    response = client.post("/extract", files=files, data={"formulario": "606"})
    assert response.status_code == 401


def test_export_endpoint_unauthorized():
    response = client.post(
        "/export/606/txt",
        json={"rnc_empresa": "101000000", "periodo": "202607", "registros": []},
    )
    assert response.status_code == 401


@patch("routers.extract.extract_606_from_file")
def test_extract_endpoint_success(mock_extract):
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
                "monto_servicios": "1188.46",
                "monto_bienes": "0.00",
                "itbis_facturado": "213.92",
                "itbis_retenido": "0.00",
                "itbis_proporcional": "0.00",
                "itbis_costo": "0.00",
                "itbis_percibido": "0.00",
                "tipo_retencion_isr": None,
                "monto_retencion_renta": "0.00",
                "isr_percibido": "0.00",
                "impuesto_selectivo": "118.85",
                "otros_impuestos": "23.77",
                "propina_legal": "0.00",
                "forma_pago": "4",
            }
        ],
        "advertencias": [],
    }

    # PDF genuino con magic bytes %PDF
    files = {"files": ("factura_wind.pdf", b"%PDF-1.5 valid pdf content", "application/pdf")}
    data = {"formulario": "606"}

    response = client.post("/extract", files=files, data=data, headers=AUTH_HEADERS)

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["archivos_procesados"] == 1
    assert len(json_data["registros"]) == 1

    registro = json_data["registros"][0]
    assert registro["rnc_proveedor"] == "102315965"
    assert registro["ncf"] == "E320001295311"
    assert str(registro["total_facturado"]) == "1188.46"
    assert str(registro["itbis_adelantar"]) == "213.92"
    assert str(registro["impuesto_selectivo"]) == "118.85"
    assert str(registro["otros_impuestos"]) == "23.77"


def test_extract_endpoint_fake_mime_type():
    # Archivo con extensión .pdf pero con contenido de texto (magic bytes inválidos)
    files = {"files": ("factura_falsa.pdf", b"ESTO NO ES UN PDF REAL", "application/pdf")}
    data = {"formulario": "606"}

    response = client.post("/extract", files=files, data=data, headers=AUTH_HEADERS)

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["archivos_procesados"] == 0
    assert len(json_data["registros"]) == 0
    assert any("contenido binario no soportado" in adv for adv in json_data["advertencias"])


def test_extract_rate_limiting():
    # Limpiar estado previo de rate limit para usuario de test
    extraction_rate_limiter.user_requests["test-user-id"] = []
    files = {"files": ("doc.pdf", b"%PDF-1.4 dummy", "application/pdf")}

    # Llenar cuota de peticiones
    with patch("routers.extract.extract_606_from_file") as mock_extract:
        mock_extract.return_value = {"registros": [], "advertencias": []}
        for _ in range(20):
            res = client.post("/extract", files=files, data={"formulario": "606"}, headers=AUTH_HEADERS)
            assert res.status_code == 200

        # La 21ª petición debe ser rechazada con 429 Too Many Requests
        rate_limited_res = client.post("/extract", files=files, data={"formulario": "606"}, headers=AUTH_HEADERS)
        assert rate_limited_res.status_code == 429
        assert "Retry-After" in rate_limited_res.headers

    # Limpiar estado de rate limit
    extraction_rate_limiter.user_requests["test-user-id"] = []
