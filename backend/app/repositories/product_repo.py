from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product

class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_products_by_client_id(self, client_id: int) -> List[Product]:
        """Получить все продукты конкретного клиента по его ID."""
        result = await self.db.execute(
            select(Product).where(Product.client_id == client_id)
        )
        return result.scalars().all()
