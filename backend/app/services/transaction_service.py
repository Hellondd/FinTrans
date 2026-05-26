from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.transaction_repo import TransactionRepository
from app.schemas.transaction import TransactionCreate
from app.services.fraud_service import FraudService
from datetime import datetime

class TransactionService:
    def __init__(self, db: AsyncSession):
        self.repo = TransactionRepository(db)

    async def process_transaction(self, transaction_data: TransactionCreate, user_id: int):
        """
        Обработка транзакции с предварительной проверкой на фрод (мошенничество) перед сохранением.
        """
        # Получение недавних транзакций для анализа флуда (упрощенно)
        recent_txs = await self.repo.get_transactions_by_client(transaction_data.client_id)
        
        # Значения по умолчанию, если они отсутствуют в схеме
        amount = getattr(transaction_data, 'amount', 0.0)
        country = getattr(transaction_data, 'country', 'RU')
        device = getattr(transaction_data, 'device', 'Unknown')
        
        # В реальном приложении мы бы запрашивали историю фрод-флагов клиента из БД
        client_fraud_flags = 0

        # Анализ транзакции
        score, decision = FraudService.analyze_transaction(
            transaction_amount=amount,
            transaction_country=country,
            transaction_device=device,
            transaction_time=datetime.utcnow(),
            recent_transactions=recent_txs,
            client_history_fraud_flags=client_fraud_flags
        )

        # Обновление статуса на основе решения
        if decision == "blocked":
            transaction_data.status = "blocked"
            transaction_data.is_fraud = True
        elif decision == "manual_review":
            transaction_data.status = "pending_review"
            transaction_data.is_fraud = False
        else:
            transaction_data.status = "approved"
            transaction_data.is_fraud = False

        # Создание записи в базе данных
        transaction = await self.repo.create_transaction(transaction_data, user_id)

        return {
            "transaction": transaction,
            "fraud_score": score,
            "decision": decision
        }
