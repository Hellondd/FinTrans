from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.client import ClientRead, ClientFilter
from app.repositories.client_repo import ClientRepository

router = APIRouter(prefix="/clients", tags=["Клиенты"])

@router.get("/", response_model=dict)
async def get_clients(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    segment: str = Query(None),
    city: str = Query(None),
    risk_level: str = Query(None),
    min_income: float = Query(None),
    status: str = Query(None)
):
    repo = ClientRepository(db)
    clients = await repo.get_filtered(
        skip=skip,
        limit=limit,
        segment=segment,
        city=city,
        risk_level=risk_level,
        min_income=min_income,
        status=status
    )
    
    total = await repo.count_filtered(segment=segment, city=city, risk_level=risk_level)
    
    return {
        "data": clients,
        "meta": {
            "page": (skip // limit) + 1,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/{client_id}", response_model=ClientRead)
async def get_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = ClientRepository(db)
    client = await repo.get_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return client