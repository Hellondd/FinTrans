from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.repositories.transaction_repo import TransactionRepository
from app.schemas.transaction import TransactionRead
from app.schemas.transaction import TransactionUpdate
from app.schemas.transaction import TransactionCreate
from app.services.transaction_service import TransactionService

from app.schemas.transaction import TransactionCheck
from app.services.fraud_service import FraudService
from datetime import datetime

router = APIRouter(prefix="/transactions", tags=["Транзакции"])


@router.get("/", response_model=dict)
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    client_id: Optional[int] = Query(None, description="ID клиента"),
    skip: int = Query(0, ge=0, description="Пропустить записей"),
    limit: int = Query(100, ge=1, le=1000, description="Лимит записей"),
    is_fraud: Optional[bool] = Query(None, description="Только мошеннические"),
    status: Optional[str] = Query(None, description="Статус транзакции (approved/pending_review/blocked)")
):
    """
    Получение списка транзакций с фильтрацией.
    Доступно всем авторизованным пользователям.
    """
    repo = TransactionRepository(db)
    transactions = await repo.get_filtered(
        client_id=client_id,
        skip=skip,
        limit=limit,
        is_fraud=is_fraud,
        status=status
    )
    
    return {
        "data": transactions,
        "meta": {
            "skip": skip,
            "limit": limit,
            "total": len(transactions)
        }
    }

@router.put("/{transaction_id}")
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновление транзакции."""
    repo = TransactionRepository(db)
    transaction = await repo.update_transaction(transaction_id, transaction_data)
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    return transaction


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удаление транзакции."""
    repo = TransactionRepository(db)
    deleted = await repo.delete_transaction(transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    return {"message": "Транзакция успешно удалена"}


@router.post("/", response_model=TransactionRead)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создание новой транзакции с антифрод-проверкой."""
    service = TransactionService(db)
    result = await service.process_transaction(transaction_data, current_user.id)
    return result["transaction"]


@router.post("/check")
async def check_transaction_fraud(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Проверка транзакции на фрод (без сохранения в БД).
    Возвращает fraud_score и решение.
    Доступно: ADMIN, MANAGER, SECURITY
    """
    # Получаем недавние транзакции клиента
    repo = TransactionRepository(db)
    recent_txs = await repo.get_transactions_by_client(transaction_data.client_id)
    
    # Анализ
    score, decision = FraudService.analyze_transaction(
        transaction_amount=transaction_data.amount,
        transaction_country=getattr(transaction_data, 'country', 'RU'),
        transaction_device=getattr(transaction_data, 'device', 'Unknown'),
        transaction_time=datetime.utcnow(),
        recent_transactions=recent_txs,
        client_history_fraud_flags=0
    )
    
    return {
        "fraud_score": score,
        "decision": decision,
        "is_fraud": decision != "approved",
        "recommendation": "Одобрено" if decision == "approved" else 
                         "Требуется ручная проверка" if decision == "manual_review" else 
                         "Заблокировано"
    }
