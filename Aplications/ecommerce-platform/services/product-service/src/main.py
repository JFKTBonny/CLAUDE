from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import os

from .database import get_db, engine
from .models   import Base, Product, Category
from .schemas  import (
    ProductCreate, ProductUpdate, ProductResponse,
    CategoryCreate, CategoryResponse
)
from .auth import verify_token

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Product Service", version="2.0.0")


# ── Health ─────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":  "UP",
        "service": "product-service",
        "version": os.getenv("APP_VERSION", "2.0.0")
    }


# ── Categories ─────────────────────────────────────────────────────
@app.get("/api/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@app.get("/api/categories/{slug}", response_model=CategoryResponse)
def get_category(slug: str, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.post("/api/categories", response_model=CategoryResponse, status_code=201)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _=Depends(verify_token)
):
    category = Category(**payload.dict())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# ── Products ───────────────────────────────────────────────────────
@app.get("/api/products", response_model=List[ProductResponse])
def list_products(
    search:      Optional[str]   = Query(None, description="Search by name or description"),
    category_id: Optional[int]   = Query(None, description="Filter by category id"),
    category:    Optional[str]   = Query(None, description="Filter by category slug"),
    min_price:   Optional[float] = Query(None, description="Minimum price"),
    max_price:   Optional[float] = Query(None, description="Maximum price"),
    in_stock:    Optional[bool]  = Query(None, description="Only show in-stock items"),
    skip:        int             = Query(0, ge=0),
    limit:       int             = Query(20, ge=1, le=100),
    db:          Session         = Depends(get_db),
    _=Depends(verify_token)
):
    query = db.query(Product).filter(Product.is_active == True)

    # Search
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%")
            )
        )

    # Filter by category id
    if category_id:
        query = query.filter(Product.category_id == category_id)

    # Filter by category slug
    if category:
        cat = db.query(Category).filter(Category.slug == category).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)

    # Price range
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Stock filter
    if in_stock:
        query = query.filter(Product.stock > 0)

    return query.offset(skip).limit(limit).all()


@app.get("/api/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _=Depends(verify_token)
):
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


@app.patch("/api/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _=Depends(verify_token)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@app.delete("/api/products/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _=Depends(verify_token)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Soft delete — just mark inactive
    product.is_active = False
    db.commit()
    return None


@app.patch("/api/products/{product_id}/stock", response_model=ProductResponse)
def update_stock(
    product_id: int,
    quantity: int = Query(..., description="Amount to add (positive) or remove (negative)"),
    db: Session = Depends(get_db),
    _=Depends(verify_token)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_stock = product.stock + quantity
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    product.stock = new_stock
    db.commit()
    db.refresh(product)
    return product
