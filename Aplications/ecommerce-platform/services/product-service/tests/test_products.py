# services/product-service/tests/test_products.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "UP"

def test_list_products_unauthorized():
    res = client.get("/api/products")
    assert res.status_code == 401

def test_create_and_get_product(auth_headers, db_session):
    payload = {"name": "Laptop", "price": 999.99, "sku": "LAP-001", "stock": 10}
    res = client.post("/api/products", json=payload, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["sku"] == "LAP-001"