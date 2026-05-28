from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate
from app.models.risk_profile import RiskProfile


class ClientRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_client(self, client_data: ClientCreate, user_id: int) -> Client:
        """Create a new client."""
        client = Client(
            user_id=user_id,
            full_name=client_data.full_name,
            city=client_data.city,
            monthly_income=client_data.monthly_income,
            status=client_data.status
        )
        self.db.add(client)
        await self.db.commit()
        await self.db.refresh(client)
        return client

    async def get_client_by_id(self, client_id: int) -> Optional[Client]:
        """Get client by ID."""
        result = await self.db.execute(
            select(Client).where(Client.client_id == client_id)
        )
        return result.scalar_one_or_none()

    async def get_clients_by_user(self, user_id: int) -> List[Client]:
        """Get all clients for a user."""
        result = await self.db.execute(
            select(Client).where(Client.user_id == user_id)
        )
        return result.scalars().all()

    async def update_client(self, client_id: int, client_data: ClientUpdate) -> Optional[Client]:
        """Update client."""
        client = await self.get_client_by_id(client_id)
        if not client:
            return None
        
        update_data = client_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(client, field):
                setattr(client, field, value)
        
        await self.db.commit()
        await self.db.refresh(client)
        return client

    async def delete_client(self, client_id: int) -> bool:
        """Delete client."""
        client = await self.get_client_by_id(client_id)
        if not client:
            return False
        
        await self.db.delete(client)
        await self.db.commit()
        return True

    async def get_filtered(
        self,
        skip: int = 0,
        limit: int = 50,
        search: str = None,
        segment: str = None,
        city: str = None,
        risk_level: str = None,
        min_income: float = None,
        status: str = None
    ):
        query = select(Client)

        if search:
            query = query.where(Client.full_name.ilike(f"%{search}%"))

        if segment:
            query = query.where(Client.segment == segment)
        if city:
            query = query.where(Client.city.ilike(f"%{city}%"))
        if status:
            query = query.where(Client.status == status)
        if min_income is not None:
            query = query.where(Client.monthly_income >= min_income)

        if risk_level:
            query = query.join(RiskProfile, Client.risk_profile)
            query = query.where(RiskProfile.risk_level == risk_level)

        query = query.offset(skip).limit(limit).order_by(Client.client_id)

        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def count_filtered(
        self,
        search: str = None,
        segment: str = None,
        city: str = None,
        risk_level: str = None,
        min_income: float = None,      # оставляем для совместимости
        status: str = None
    ) -> int:
        """Подсчёт количества клиентов с фильтрацией."""
        query = select(func.count()).select_from(Client)

        if search:
            query = query.where(Client.full_name.ilike(f"%{search}%"))
        if segment:
            query = query.where(Client.segment == segment)
        if city:
            query = query.where(Client.city.ilike(f"%{city}%"))
        if status:
            query = query.where(Client.status == status)
        if min_income is not None:
            query = query.where(Client.monthly_income >= min_income)

        if risk_level:
            query = query.join(RiskProfile, Client.risk_profile)
            query = query.where(RiskProfile.risk_level == risk_level)

        result = await self.db.execute(query)
        return result.scalar() or 0
    
    
