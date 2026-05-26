# app/services/__init__.py
"""Бизнес-логика (сервисный слой) для FinTrans CRM."""

from app.services.client_service import ClientService
from app.services.fraud_service import FraudService
from app.services.scoring_service import ScoringService
from app.services.transaction_service import TransactionService
from app.services.dashboard_service import DashboardService

__all__ = [
    "ClientService",
    "FraudService", 
    "ScoringService",
    "TransactionService",
    "DashboardService"
]
