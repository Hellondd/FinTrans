from pydantic import BaseModel
from typing import Optional


class ClientBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    passport_data: Optional[str] = None
    tax_id: Optional[str] = None
    risk_profile_id: Optional[int] = None


class ClientCreate(ClientBase):
    """Создание клиента — расширенная версия с полями для дашборда"""
    city: Optional[str] = None
    monthly_income: Optional[float] = None
    status: str = "ACTIVE"


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    city: Optional[str] = None
    monthly_income: Optional[float] = None
    status: Optional[str] = None


class ClientRead(ClientBase):
    client_id: int
    user_id: int
    city: Optional[str] = None
    monthly_income: Optional[float] = None
    status: str = "ACTIVE"
    credit_score: Optional[int] = None
    segment: Optional[str] = None

    class Config:
        from_attributes = True


class ClientFilter(BaseModel):
    """Filters for listing clients."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None
    risk_profile_id: Optional[int] = None
    city: Optional[str] = None
    status: Optional[str] = None
    segment: Optional[str] = None
