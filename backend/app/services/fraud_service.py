from datetime import datetime
from typing import Tuple, List
from app.models.transaction import Transaction

class FraudService:
    @staticmethod
    def analyze_transaction(
        transaction_amount: float,
        transaction_country: str,
        transaction_device: str,
        transaction_time: datetime,
        recent_transactions: List[Transaction],
        client_history_fraud_flags: int
    ) -> Tuple[float, str]:
        """
        6-факторный анализ транзакции.
        Возвращает (fraud_score, decision)
        Решения (decision): "approved", "manual_review", "blocked"
        """
        fraud_score = 0.0
        
        # 1. Фактор суммы
        if transaction_amount > 500000:
            fraud_score += 0.3
        elif transaction_amount > 100000:
            fraud_score += 0.15

        # 2. Фактор гео/страны
        high_risk_countries = ["NG", "KP", "SY", "IR", "CU"]
        if transaction_country in high_risk_countries:
            fraud_score += 0.4

        # 3. Фактор времени (ночное время 00:00 - 05:00)
        hour = transaction_time.hour
        if 0 <= hour <= 5:
            fraud_score += 0.15

        # 4. Фактор устройства (подозрительно, если используется эмулятор)
        if "emulator" in (transaction_device or "").lower():
            fraud_score += 0.3
            
        # 5. Фактор частоты/флуда (много транзакций за короткое время)
        recent_count = len(recent_transactions)
        if recent_count > 10:
            fraud_score += 0.4
        elif recent_count > 5:
            fraud_score += 0.2

        # 6. Фактор истории клиента
        if client_history_fraud_flags > 0:
            fraud_score += 0.2 * client_history_fraud_flags

        # Финальный скор (максимум 1.0)
        fraud_score = min(1.0, fraud_score)

        # Принятие решения
        if fraud_score < 0.4:
            decision = "approved"
        elif fraud_score <= 0.6:
            decision = "manual_review"
        else:
            decision = "blocked"

        return fraud_score, decision
