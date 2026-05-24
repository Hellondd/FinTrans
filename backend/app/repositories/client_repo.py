from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
            phone=client_data.phone,
            email=client_data.email,
            passport_data=client_data.passport_data,
            tax_id=client_data.tax_id,
            risk_profile_id=client_data.risk_profile_id
        )
        self.db.add(client)
        await self.db.commit()
        await self.db.refresh(client)
        return client

    async def get_client_by_id(self, client_id: int) -> Optional[Client]:
        """Get client by ID."""
        result = await self.db.execute(
            select(Client).where(Client.id == client_id)
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