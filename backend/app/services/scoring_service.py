from typing import Tuple

class ScoringService:
    @staticmethod
    def calculate_credit_score(
        monthly_income: float,
        overdue_days: int,
        open_loans: int,
        fraud_flags: int,
        active_products: int
    ) -> int:
        """
        Расчет кредитного скоринга на основе 5 факторов.
        Возвращает скоринг от 300 до 850.
        """
        base_score = 500
        
        # 1. Фактор дохода
        if monthly_income > 150000:
            base_score += 100
        elif monthly_income > 80000:
            base_score += 50
        elif monthly_income < 30000:
            base_score -= 50

        # 2. Фактор просрочек
        if overdue_days > 90:
            base_score -= 200
        elif overdue_days > 30:
            base_score -= 100
        elif overdue_days > 0:
            base_score -= 30
        else:
            base_score += 50

        # 3. Открытые кредиты
        if open_loans > 5:
            base_score -= 100
        elif open_loans > 2:
            base_score -= 50
        elif open_loans == 0:
            base_score += 20
            
        # 4. Фрод-индикаторы
        if fraud_flags > 0:
            base_score -= 150 * fraud_flags

        # 5. Активные продукты (лояльность)
        base_score += active_products * 15

        # Нормализация скоринга
        return max(300, min(850, base_score))

    @staticmethod
    def calculate_recommended_limit(monthly_income: float, credit_score: int) -> float:
        """
        Расчет рекомендуемого лимита: доход * 5 * (скор / 500)
        """
        if credit_score < 400:
            return 0.0
        limit = monthly_income * 5 * (credit_score / 500.0)
        return round(limit, 2)

    @staticmethod
    def determine_risk_level_and_segment(credit_score: int, fraud_flags: int) -> Tuple[str, str]:
        """
        Определение уровня риска и сегмента клиента на основе скоринга.
        Возвращает: (risk_level, segment)
        """
        if fraud_flags > 1:
            return "critical", "mass"
            
        if credit_score >= 700:
            return "low", "premium"
        elif credit_score >= 500:
            return "medium", "standard"
        else:
            return "high", "mass"
