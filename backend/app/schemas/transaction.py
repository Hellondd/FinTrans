from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class TransactionBase(BaseModel):
    client_id: int
    amount: Decimal
    currency: str = "RUB"
    description: Optional[str] = None
    transaction_type: str  # "deposit", "withdrawal", "transfer"
    country: Optional[str] = None  
    device: Optional[str] = None   


class TransactionCreate(TransactionBase):
    status: Optional[str] = "approved"   
    is_fraud: Optional[bool] = False     


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None


class TransactionRead(TransactionBase):
    transaction_id: int  
    user_id: int
    status: str
    is_fraud: bool
    timestamp: datetime  
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionFilter(BaseModel):
    client_id: Optional[int] = None
    transaction_type: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class TransactionCheck(BaseModel):
    """Схема для проверки транзакции на фрод (без сохранения)"""
    client_id: int
    amount: float
    transaction_type: str
    currency: str = "RUB"
    country: str = "RU"
    device: str = "Unknown"
