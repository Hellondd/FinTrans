from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate


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
        limit: int = 100,
        segment: Optional[str] = None,
        city: Optional[str] = None,
        risk_level: Optional[str] = None,
        min_income: Optional[float] = None,
        status: Optional[str] = None
    ) -> List[Client]:
        """Получение списка клиентов с фильтрацией и пагинацией."""
        query = select(Client)
        
        if segment:
            query = query.where(Client.segment == segment)
        if city:
            query = query.where(Client.city == city)
        if min_income:
            query = query.where(Client.monthly_income >= min_income)
        if status:
            query = query.where(Client.status == status)
        # risk_level требует связи с RiskProfile, пока пропустим
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_filtered(
        self,
        segment: Optional[str] = None,
        city: Optional[str] = None,
        risk_level: Optional[str] = None,
        status: Optional[str] = None
    ) -> int:
        """Подсчёт количества клиентов с фильтрацией."""
        query = select(Client)
        
        if segment:
            query = query.where(Client.segment == segment)
        if city:
            query = query.where(Client.city == city)
        if status:
            query = query.where(Client.status == status)
        
        count_query = select(func.count()).select_from(query.subquery())
        result = await self.db.execute(count_query)
        return result.scalar() or 0
