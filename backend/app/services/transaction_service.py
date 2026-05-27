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
        # Получение недавних транзакций для анализа флуда
        recent_txs = await self.repo.get_transactions_by_client(transaction_data.client_id)
        
        # Значения по умолчанию
        amount = transaction_data.amount
        country = transaction_data.country or 'RU'
        device = transaction_data.device or 'Unknown'
        
        # История фрод-флагов клиента (пока заглушка)
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

        # Определяем статус и флаг фрода на основе решения
        if decision == "blocked":
            status = "blocked"
            is_fraud = True
        elif decision == "manual_review":
            status = "pending_review"
            is_fraud = False
        else:
            status = "approved"
            is_fraud = False

        # Создание записи в базе данных
        transaction = await self.repo.create_transaction(
            transaction_data, 
            user_id,
            status=status,
            is_fraud=is_fraud
        )

        return {
            "transaction": transaction,
            "fraud_score": score,
            "decision": decision
        }
