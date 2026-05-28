from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta, date
from typing import List, Optional

from app.models.client import Client
from app.models.transaction import Transaction
from app.schemas.dashboard import (
    KPIResponse, DailyTransaction, FraudStats, ClientSegmentStats
)


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_kpi(self) -> KPIResponse:
        """Получение основных KPI для главного дашборда"""
        
        today = date.today()
        week_ago = today - timedelta(days=7)
        
        # 1. Общее количество клиентов
        total_clients = await self.db.scalar(
            select(func.count()).select_from(Client)
        ) or 0
        
        # 2. Новые клиенты за неделю (для расчёта динамики)
        clients_week_ago = await self.db.scalar(
            select(func.count()).select_from(Client)
            .where(Client.registration_date < week_ago)
        ) or 0
        
        total_clients_change = 0
        if clients_week_ago > 0:
            total_clients_change = round(
                (total_clients - clients_week_ago) / clients_week_ago * 100, 1
            )
        
        # 3. Активные клиенты
        active_clients = await self.db.scalar(
            select(func.count()).select_from(Client)
            .where(Client.status == "ACTIVE")
        ) or 0
        
        # 4. Транзакции
        total_transactions = await self.db.scalar(
            select(func.count()).select_from(Transaction)
        ) or 0
        
        transactions_today = await self.db.scalar(
            select(func.count()).select_from(Transaction)
            .where(Transaction.timestamp >= today)
        ) or 0
        
        # 5. Объём транзакций сегодня
        total_volume_today = await self.db.scalar(
            select(func.sum(Transaction.amount))
            .where(Transaction.timestamp >= today)
        ) or 0.0
        
        # 6. Fraud статистика
        fraud_blocked_today = await self.db.scalar(
            select(func.count()).select_from(Transaction)
            .where(and_(
                Transaction.timestamp >= today,
                Transaction.is_fraud == True
            ))
        ) or 0
        
        # Транзакции на ручном ревью (есть поле status)
        # Если нет поля, можно заменить на is_fraud = False и риск > 0.4
        fraud_review_today = await self.db.scalar(
            select(func.count()).select_from(Transaction)
            .where(and_(
                Transaction.timestamp >= today,
                Transaction.status == "pending_review"
            ))
        ) or 0
        
        # 7. Уровень фрода (процент заблокированных от всех транзакций сегодня)
        fraud_rate = 0.0
        if transactions_today > 0:
            fraud_rate = round(fraud_blocked_today / transactions_today * 100, 1)
        
        # 8. Средний кредитный скор
        avg_credit_score = await self.db.scalar(
            select(func.avg(Client.credit_score))
            .where(Client.credit_score.isnot(None))
        ) or 0.0
        avg_credit_score = round(avg_credit_score, 2)
        
        # 9. Количество премиум-клиентов (скор >= 700)
        premium_clients = await self.db.scalar(
            select(func.count()).select_from(Client)
            .where(Client.credit_score >= 700)
        ) or 0
        
        # 10. Количество клиентов с высоким риском (скор < 500)
        high_risk_clients = await self.db.scalar(
            select(func.count()).select_from(Client)
            .where(Client.credit_score < 500)
        ) or 0
        
        return KPIResponse(
            total_clients=total_clients,
            total_clients_change=total_clients_change,
            active_clients=active_clients,
            total_transactions=total_transactions,
            transactions_today=transactions_today,
            total_volume_today=round(total_volume_today, 2),
            fraud_blocked_today=fraud_blocked_today,
            fraud_review_today=fraud_review_today,
            fraud_rate=fraud_rate,
            avg_credit_score=avg_credit_score,
            premium_clients=premium_clients,
            high_risk_clients=high_risk_clients
        )

    async def get_daily_transactions(self, days: int = 30) -> List[DailyTransaction]:
        """Динамика транзакций по дням для графика"""
        
        result = []
        for i in range(days):
            day_date = date.today() - timedelta(days=i)
            next_day = day_date + timedelta(days=1)
            
            # Количество транзакций за день
            count = await self.db.scalar(
                select(func.count()).select_from(Transaction)
                .where(and_(
                    Transaction.timestamp >= day_date,
                    Transaction.timestamp < next_day
                ))
            ) or 0
            
            # Объём транзакций за день (СУММА)
            volume = await self.db.scalar(
                select(func.sum(Transaction.amount))
                .where(and_(
                    Transaction.timestamp >= day_date,
                    Transaction.timestamp < next_day
                ))
            ) or 0.0
            
            result.append(DailyTransaction(
                date=day_date,
                count=count,
                volume=round(volume, 2)  # ← volume = сумма
            ))
        
        # Возвращаем в хронологическом порядке (от старых к новым)
        return list(reversed(result))

    async def get_fraud_stats(self) -> FraudStats:
        """Статистика по фроду"""
        
        # Все транзакции
        total = await self.db.scalar(
            select(func.count()).select_from(Transaction)
        ) or 1
        
        # Заблокированные
        blocked = await self.db.scalar(
            select(func.count()).select_from(Transaction)
            .where(Transaction.is_fraud == True)
        ) or 0
        
        # На ручном ревью
        review = await self.db.scalar(
            select(func.count()).select_from(Transaction)
            .where(Transaction.status == "pending_review")
        ) or 0
        
        # Одобренные
        approved = total - blocked - review
        
        # Блокировки по странам
        blocked_by_country = {}
        countries_result = await self.db.execute(
            select(Transaction.country, func.count())
            .where(Transaction.is_fraud == True)
            .group_by(Transaction.country)
            .limit(10)
        )
        for country, count in countries_result:
            if country:
                blocked_by_country[country] = count
        
        return FraudStats(
            total_blocked=blocked,
            total_review=review,
            total_approved=approved,
            blocked_by_country=blocked_by_country
        )

    async def get_client_segment_stats(self) -> List[ClientSegmentStats]:
        """Распределение клиентов по сегментам"""
        
        total = await self.db.scalar(
            select(func.count()).select_from(Client)
        ) or 1
        
        segments_result = await self.db.execute(
            select(Client.segment, func.count())
            .where(Client.segment.isnot(None))
            .group_by(Client.segment)
        )
        
        stats = []
        for segment, count in segments_result:
            stats.append(ClientSegmentStats(
                segment=segment,
                count=count,
                percentage=round(count / total * 100, 1)
            ))
        
        # Сортировка по количеству
        return sorted(stats, key=lambda x: x.count, reverse=True)
