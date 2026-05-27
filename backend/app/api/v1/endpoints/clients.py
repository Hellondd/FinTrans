from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.client import ClientRead, ClientCreate, ClientUpdate
from app.services.client_service import ClientService
from app.repositories.client_repo import ClientRepository
from app.services.scoring_service import ScoringService
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.models.client import Client



router = APIRouter(prefix="/clients", tags=["Клиенты"])

@router.get("/", response_model=dict)
async def get_clients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    
    total = await repo.count_filtered(segment=segment, city=city, risk_level=risk_level, status=status)
    
    # Преобразуем ORM объекты в Pydantic схемы
    data = [ClientRead.model_validate(client) for client in clients]
    
    return {
        "data": data,
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
    current_user: User = Depends(get_current_user)
):
    repo = ClientRepository(db)
    client = await repo.get_client_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return ClientRead.model_validate(client)


@router.post("/", response_model=ClientRead)
async def create_client(
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создание нового клиента."""
    service = ClientService(db)
    client = await service.register_client(client_data, current_user.id)
    return ClientRead.model_validate(client)


@router.put("/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновление данных клиента."""
    repo = ClientRepository(db)
    client = await repo.update_client(client_id, client_data)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return ClientRead.model_validate(client)


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удаление клиента."""
    repo = ClientRepository(db)
    deleted = await repo.delete_client(client_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return {"message": "Клиент успешно удалён"}

@router.get("/{client_id}/credit-score")
async def get_client_credit_score(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Загружаем клиента с связанными данными (жадная загрузка)
    result = await db.execute(
        select(Client)
        .where(Client.client_id == client_id)
        .options(
            selectinload(Client.risk_profile),
            selectinload(Client.products)
        )
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    
    # Получаем данные для расчёта
    monthly_income = client.monthly_income or 0
    overdue_days = 0
    open_loans = 0
    fraud_flags = 0
    active_products = 0
    
    # Если есть риск-профиль, берём данные оттуда
    if client.risk_profile:
        overdue_days = client.risk_profile.overdue_days or 0
        open_loans = client.risk_profile.open_loans or 0
        fraud_flags = client.risk_profile.fraud_flags or 0
    
    # Если есть продукты, считаем активные
    if client.products:
        active_products = len([p for p in client.products if p.status == "active"])
    
    # Расчёт скора
    score = ScoringService.calculate_credit_score(
        monthly_income=monthly_income,
        overdue_days=overdue_days,
        open_loans=open_loans,
        fraud_flags=fraud_flags,
        active_products=active_products
    )
    
    risk_level, segment = ScoringService.determine_risk_level_and_segment(score, fraud_flags)
    recommended_limit = ScoringService.calculate_recommended_limit(monthly_income, score)
    
    return {
        "client_id": client_id,
        "full_name": client.full_name,
        "credit_score": score,
        "risk_level": risk_level,
        "segment": segment,
        "recommended_limit": recommended_limit,
        "factors": {
            "monthly_income": monthly_income,
            "overdue_days": overdue_days,
            "open_loans": open_loans,
            "fraud_flags": fraud_flags,
            "active_products": active_products
        }
    }
