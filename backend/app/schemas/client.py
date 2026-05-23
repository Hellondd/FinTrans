from pydantic import BaseModel
from datetime import date
from typing import Optional

class ClientRead(BaseModel):
    client_id: int
    full_name: str
    gender: Optional[str]
    city: Optional[str]
    monthly_income: Optional[float]
    credit_score: Optional[int]
    segment: Optional[str]
    status: Optional[str]
    risk_level: Optional[str]   # можно джойнить

    class Config:
        from_attributes = True


class ClientFilter(BaseModel):
    segment: Optional[str] = None
    city: Optional[str] = None
    risk_level: Optional[str] = None
    min_income: Optional[float] = None
    max_income: Optional[float] = None