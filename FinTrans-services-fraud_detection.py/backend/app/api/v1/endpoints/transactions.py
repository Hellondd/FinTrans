from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.transaction import TransactionRead
from app.repositories.transaction_repo import TransactionRepository

router = APIRouter(prefix="/transactions", tags=["Транзакции"])

@router.get("/")
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    client_id: int = Query(None),
    skip: int = 0,
    limit: int = 100,
    is_fraud: bool = Query(None)
):
    repo = TransactionRepository(db)
    transactions = await repo.get_filtered(
        client_id=client_id,
        skip=skip,
        limit=limit,
        is_fraud=is_fraud
    )
    
    return {
        "data": transactions,
        "meta": {"skip": skip, "limit": limit}
    }