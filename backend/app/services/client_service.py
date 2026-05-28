from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.client_repo import ClientRepository
from app.schemas.client import ClientCreate, ClientUpdate
from app.services.scoring_service import ScoringService
from app.repositories.product_repo import ProductRepository
from typing import List
from app.models.product import Product

class ClientService:
    def __init__(self, db: AsyncSession):
        self.repo = ClientRepository(db)

    async def register_client(self, client_data: ClientCreate, user_id: int):
        """
        Регистрация нового клиента и расчет его первичного кредитного скоринга.
        """
        # Мы можем извлечь факторы скоринга из client_data, если они там есть.
        # Для демонстрации используем значения по умолчанию, если данных нет.
        monthly_income = getattr(client_data, 'monthly_income', 50000.0)
        overdue_days = 0
        open_loans = 0
        fraud_flags = 0
        active_products = 0

        # Расчет скоринга и уровня риска
        score = ScoringService.calculate_credit_score(
            monthly_income=monthly_income,
            overdue_days=overdue_days,
            open_loans=open_loans,
            fraud_flags=fraud_flags,
            active_products=active_products
        )
        
        risk_level, segment = ScoringService.determine_risk_level_and_segment(score, fraud_flags)
        
        # При необходимости обновляем данные клиента перед сохранением.
        # Поскольку схема может быть строгой, обновляем только если атрибут существует.
        if hasattr(client_data, 'credit_score'):
            client_data.credit_score = score
        if hasattr(client_data, 'segment'):
            client_data.segment = segment

        client = await self.repo.create_client(client_data, user_id)
        
        # Здесь также можно было бы создать профиль риска (RiskProfile) для клиента на основе скоринга
        
        return client

    async def get_client(self, client_id: int):
        return await self.repo.get_client_by_id(client_id)

    async def update_client(self, client_id: int, client_data: ClientUpdate):
        # При обновлении можно пересчитать скоринг
        return await self.repo.update_client(client_id, client_data)

    async def get_client_products(self, client_id: int) -> List[Product]:
        """Получить все продукты клиента."""
        client = await self.repo.get_client_by_id(client_id)
        if not client:
            return None
        
        product_repo = ProductRepository(self.repo.db)
        return await product_repo.get_products_by_client_id(client_id)
