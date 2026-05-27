from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FraudAlertBase(BaseModel):
    transaction_id: int
    client_id: int
    fraud_score: float
    reason: str
    status: Optional[str] = "open"

class FraudAlertCreate(FraudAlertBase):
    pass

class FraudAlertUpdate(BaseModel):
    status: str

class FraudAlertRead(FraudAlertBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
