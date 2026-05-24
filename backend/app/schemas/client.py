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
    pass


class ClientUpdate(ClientBase):
    full_name: Optional[str] = None


class ClientRead(ClientBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class ClientFilter(BaseModel):
    """Filters for listing clients."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None
    risk_profile_id: Optional[int] = None
