from pydantic import BaseModel
from datetime import date
from typing import Optional

class ProductBase(BaseModel):
    client_id: int
    product_type: Optional[str]
    amount: Optional[float]
    interest_rate: Optional[float]
    status: Optional[str]
    start_date: Optional[date]

class ProductCreate(ProductBase):
    pass

class ProductRead(ProductBase):
    product_id: int

    class Config:
        from_attributes = True
