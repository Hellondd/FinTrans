from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.fraud_alert import FraudAlert
from app.schemas.fraud_alert import FraudAlertCreate, FraudAlertUpdate

class FraudAlertRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_alert(self, alert_data: FraudAlertCreate) -> FraudAlert:
        alert = FraudAlert(**alert_data.dict())
        self.db.add(alert)
        await self.db.commit()
        await self.db.refresh(alert)
        return alert

    async def get_alerts(self, status: Optional[str] = None) -> List[FraudAlert]:
        query = select(FraudAlert)
        if status:
            query = query.where(FraudAlert.status == status)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_alert_by_id(self, alert_id: int) -> Optional[FraudAlert]:
        result = await self.db.execute(select(FraudAlert).where(FraudAlert.id == alert_id))
        return result.scalar_one_or_none()

    async def update_alert_status(self, alert_id: int, alert_data: FraudAlertUpdate) -> Optional[FraudAlert]:
        alert = await self.get_alert_by_id(alert_id)
        if not alert:
            return None
        alert.status = alert_data.status
        await self.db.commit()
        await self.db.refresh(alert)
        return alert
