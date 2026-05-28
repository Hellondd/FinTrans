from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_security_user
from app.schemas.fraud_alert import FraudAlertRead, FraudAlertUpdate
from app.repositories.fraud_alert_repo import FraudAlertRepository
from app.models.user import User

router = APIRouter()

@router.get("/alerts", response_model=List[FraudAlertRead])
async def get_fraud_alerts(
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_security_user)
):
    """
    Получение списка фрод-алертов (Только для SECURITY/ADMIN)
    """
    repo = FraudAlertRepository(db)
    return await repo.get_alerts(status)

@router.patch("/alerts/{alert_id}", response_model=FraudAlertRead)
async def update_fraud_alert_status(
    alert_id: int,
    alert_data: FraudAlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_security_user)
):
    """
    Обновление статуса алерта (например, перевод в resolved)
    """
    repo = FraudAlertRepository(db)
    alert = await repo.update_alert_status(alert_id, alert_data)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
