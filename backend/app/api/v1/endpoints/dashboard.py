from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (
    KPIResponse, DailyTransaction, FraudStats, ClientSegmentStats
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpi", response_model=KPIResponse)
async def get_kpi(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получение основных KPI для дашборда.
    Доступно всем авторизованным пользователям.
    """
    service = DashboardService(db)
    return await service.get_kpi()


@router.get("/transactions/daily", response_model=List[DailyTransaction])
async def get_daily_transactions(
    days: int = Query(default=30, ge=1, le=180, description="Количество дней"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Динамика транзакций по дням для графика.
    Доступно всем авторизованным пользователям.
    """
    service = DashboardService(db)
    return await service.get_daily_transactions(days)


@router.get("/fraud/stats", response_model=FraudStats)
async def get_fraud_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Статистика по фроду. Только для ADMIN и SECURITY.
    """
    # Проверка прав
    if current_user.role not in ["ADMIN", "SECURITY"]:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для ADMIN и SECURITY"
        )
    
    service = DashboardService(db)
    return await service.get_fraud_stats()


@router.get("/segments", response_model=List[ClientSegmentStats])
async def get_client_segments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Распределение клиентов по сегментам.
    Доступно всем авторизованным.
    """
    service = DashboardService(db)
    return await service.get_client_segment_stats()


@router.get("/segments/distribution")
async def get_segments_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Распределение клиентов по сегментам для круговой диаграммы.
    Доступно всем авторизованным пользователям.
    """
    from sqlalchemy import func
    from app.models.client import Client
    
    result = await db.execute(
        select(
            Client.segment,
            func.count(Client.client_id).label('count')
        )
        .where(Client.segment.isnot(None))
        .group_by(Client.segment)
        .order_by(func.count(Client.client_id).desc())
    )
    
    colors = ['#6c8ebf', '#7bb87b', '#b87b6c', '#8c6cbf', '#6cbfa8', '#bfa86c', '#a86cbf', '#6ca8bf']
    
    data = []
    for idx, row in enumerate(result):
        data.append({
            "name": row.segment,
            "value": row.count,
            "color": colors[idx % len(colors)]
        })
    
    return data
