from typing import Tuple

class ScoringService:
    """
    Сервис расчёта кредитного скоринга и рекомендаций.
    """

    @staticmethod
    def calculate_credit_score(
        monthly_income: float = 0,
        overdue_days: int = 0,
        open_loans: int = 0,
        fraud_flags: int = 0,
        active_products: int = 0,
        credit_score: int = 0
    ) -> int:
        """Возвращает скоринг от 300 до 850."""
        income = monthly_income or 0
        score = 500

        # 1. Доход
        if income > 150000:
            score += 110
        elif income > 80000:
            score += 65
        elif income > 40000:
            score += 25
        elif income < 25000:
            score -= 75

        # 2. Кредитный рейтинг
        if credit_score:
            if credit_score >= 750:
                score += 100
            elif credit_score >= 650:
                score += 55
            elif credit_score < 500:
                score -= 90

        # 3. Просрочки
        if overdue_days > 90:
            score -= 140
        elif overdue_days > 30:
            score -= 75
        elif overdue_days > 0:
            score -= 35

        # 4. Fraud-флаги
        if fraud_flags >= 3:
            score -= 180
        elif fraud_flags >= 1:
            score -= 70

        # 5. Активные продукты
        score += active_products * 12

        return max(300, min(850, score))


    @staticmethod
    def calculate_recommended_limit(monthly_income: float = 0, credit_score: int = 500) -> float:
        """Расчёт рекомендуемого лимита"""
        income = monthly_income or 0
        if income <= 0 or credit_score < 400:
            return 0.0

        multiplier = credit_score / 550.0   # чуть мягче
        limit = income * 4.2 * multiplier
        return round(limit, 2)


    @staticmethod
    def determine_risk_level_and_segment(credit_score: int, fraud_flags: int = 0) -> Tuple[str, str]:
        if fraud_flags >= 3:
            return "critical", "RISKY"

        if credit_score >= 720:
            return "low", "VIP"
        elif credit_score >= 580:
            return "medium", "STANDARD"
        else:
            return "high", "MASS"
