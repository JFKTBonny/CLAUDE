# services/product-service/src/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, func
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(255), nullable=False)
    description = Column(String(1000))
    price       = Column(Float, nullable=False)
    stock       = Column(Integer, default=0)
    sku         = Column(String(100), unique=True, nullable=False)
    created_at  = Column(DateTime, server_default=func.now())