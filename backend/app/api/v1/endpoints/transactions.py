from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.repositories.transaction_repo import TransactionRepository
from app.schemas.transaction import TransactionRead

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
