from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Category ───────────────────────────────────────────────────────
class CategoryBase(BaseModel):
    name:        str
    slug:        str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id:         int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Product ────────────────────────────────────────────────────────
class ProductCreate(BaseModel):
    name:        str
    description: Optional[str] = None
    price:       float
    stock:       int = 0
    sku:         str
    category_id: Optional[int] = None
    image_url:   Optional[str] = None
    is_active:   bool = True

class ProductUpdate(BaseModel):
    name:        Optional[str] = None
    description: Optional[str] = None
    price:       Optional[float] = None
    stock:       Optional[int] = None
    category_id: Optional[int] = None
    image_url:   Optional[str] = None
    is_active:   Optional[bool] = None

class ProductResponse(BaseModel):
    id:          int
    name:        str
    description: Optional[str] = None
    price:       float
    stock:       int
    sku:         str
    category_id: Optional[int] = None
    image_url:   Optional[str] = None
    is_active:   bool
    category:    Optional[CategoryResponse] = None

    class Config:
        from_attributes = True
