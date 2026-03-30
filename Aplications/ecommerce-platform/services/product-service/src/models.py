from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base


class Category(Base):
    __tablename__ = "categories"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), nullable=False)
    slug        = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))
    created_at  = Column(DateTime, server_default=func.now())

    products    = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(255), nullable=False)
    description = Column(String(1000))
    price       = Column(Float, nullable=False)
    stock       = Column(Integer, default=0)
    sku         = Column(String(100), unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    image_url   = Column(String(500))
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, server_default=func.now())

    category    = relationship("Category", back_populates="products")
