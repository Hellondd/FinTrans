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


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None


class TransactionRead(TransactionBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionFilter(BaseModel):
    client_id: Optional[int] = None
    transaction_type: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None