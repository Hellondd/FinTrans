from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_transaction(self, transaction_data: TransactionCreate, user_id: int) -> Transaction:
        """Create a new transaction."""
        transaction = Transaction(
            user_id=user_id,
            client_id=transaction_data.client_id,
            amount=transaction_data.amount,
            currency=transaction_data.currency,
            description=transaction_data.description,
            transaction_type=transaction_data.transaction_type,
            status="pending"
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def get_transaction_by_id(self, transaction_id: int) -> Optional[Transaction]:
        """Get transaction by ID."""
        result = await self.db.execute(
            select(Transaction).where(Transaction.id == transaction_id)
        )
        return result.scalar_one_or_none()

    async def get_transactions_by_user(self, user_id: int) -> List[Transaction]:
        """Get all transactions for a user."""
        result = await self.db.execute(
            select(Transaction).where(Transaction.user_id == user_id)
        )
        return result.scalars().all()

    async def get_transactions_by_client(self, client_id: int) -> List[Transaction]:
        """Get all transactions for a client."""
        result = await self.db.execute(
            select(Transaction).where(Transaction.client_id == client_id)
        )
        return result.scalars().all()

    async def update_transaction(self, transaction_id: int, transaction_data: TransactionUpdate) -> Optional[Transaction]:
        """Update transaction."""
        transaction = await self.get_transaction_by_id(transaction_id)
        if not transaction:
            return None
        
        update_data = transaction_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(transaction, field, value)
        
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction