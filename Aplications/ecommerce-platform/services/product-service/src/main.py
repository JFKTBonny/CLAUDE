# services/product-service/src/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os

from .database import get_db, engine
from .models   import Base, Product
from .schemas  import ProductCreate, ProductResponse
from .auth     import verify_token

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Product Service", version="1.0.0")

@app.get("/health")
def health():
    return {
        "status":  "UP",
        "service": "product-service",
        "version": os.getenv("APP_VERSION", "1.0.0")
    }

@app.get("/api/products", response_model=List[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    _=Depends(verify_token)
):
    return db.query(Product).offset(skip).limit(limit).all()

@app.get("/api/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), _=Depends(verify_token)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/products", response_model=ProductResponse, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _=Depends(verify_token)
):
    product = Product(**payload.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product