from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime


class KPICard(BaseModel):
    """Отдельный KPI для отображения на дашборде"""
    title: str
    value: float | int
    change: Optional[float] = None  
    change_type: Optional[str] = None 


class KPIResponse(BaseModel):
    """Полный ответ с KPI"""
    total_clients: int
    total_clients_change: float
    
    active_clients: int
    
    total_transactions: int
    transactions_today: int
    total_volume_today: float
    
    fraud_blocked_today: int
    fraud_review_today: int
    fraud_rate: float
    
    avg_credit_score: float
    premium_clients: int
    high_risk_clients: int


class DailyTransaction(BaseModel):
    date: date
    count: int
    volume: float


class FraudStats(BaseModel):
    total_blocked: int
    total_review: int
    total_approved: int
    blocked_by_country: dict[str, int]


class ClientSegmentStats(BaseModel):
    segment: str
    count: int
    percentage: float


    
