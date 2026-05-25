from datetime import datetime, timedelta
from typing import Optional, List
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from statistics import mean, stdev

from app.models.transaction import Transaction
from app.repositories.transaction_repo import TransactionRepository


@dataclass
class FraudCheckResult:
    """Результат проверки транзакции на мошенничество."""

    is_fraud: bool
    fraud_reason: str = ""
    fraud_score: float = 0.0  # 0.0–1.0, для будущего расширения
    checked_rules: List[str] = field(default_factory=list)


class FraudRule(ABC):
    """Базовый класс для правила антифрод-проверки."""

    @abstractmethod
    def check(
        self, transaction: Transaction, client_transactions: List[Transaction]
    ) -> Optional[str]:
        """
        Проверить транзакцию по правилу.
        :return: str с причиной фрода, если правило сработало, иначе None
        """
        pass


class HighAmountRule(FraudRule):
    """Правило: сумма транзакции значительно выше средней для клиента."""

    MULTIPLIER_THRESHOLD = 5.0  # во сколько раз выше среднего

    def check(
        self, transaction: Transaction, client_transactions: List[Transaction]
    ) -> Optional[str]:
        if not client_transactions:
            return None

        amounts = [t.amount for t in client_transactions if t.amount and t.amount > 0]
        if not amounts or not transaction.amount:
            return None

        avg_amount = mean(amounts)
        if (
            avg_amount > 0
            and transaction.amount > avg_amount * self.MULTIPLIER_THRESHOLD
        ):
            return f"Сумма {transaction.amount} превышает среднюю ({avg_amount:.2f}) более чем в {self.MULTIPLIER_THRESHOLD} раз"
        return None


class UnusualCountryRule(FraudRule):
    """Правило: транзакция из страны, не характерной для клиента."""

    HISTORY_SIZE = 10  # сколько последних транзакций анализировать

    def check(
        self, transaction: Transaction, client_transactions: List[Transaction]
    ) -> Optional[str]:
        if not transaction.country or not client_transactions:
            return None

        # Берём последние транзакции клиента
        recent = sorted(
            [t for t in client_transactions if t.country],
            key=lambda t: t.timestamp or datetime.min,
            reverse=True,
        )[: self.HISTORY_SIZE]

        known_countries = {t.country for t in recent}
        if transaction.country not in known_countries and len(known_countries) > 0:
            return f"Транзакция из необычной страны: {transaction.country} (история: {', '.join(known_countries)})"
        return None


class HighFrequencyRule(FraudRule):
    """Правило: много операций за короткий промежуток времени."""

    TIME_WINDOW_MINUTES = 10
    COUNT_THRESHOLD = 5

    def check(
        self, transaction: Transaction, client_transactions: List[Transaction]
    ) -> Optional[str]:
        if not transaction.timestamp or not client_transactions:
            return None

        window_start = transaction.timestamp - timedelta(
            minutes=self.TIME_WINDOW_MINUTES
        )
        count = sum(
            1
            for t in client_transactions
            if t.timestamp and window_start <= t.timestamp <= transaction.timestamp
        )

        if count >= self.COUNT_THRESHOLD:
            return f"Подозрительная частота: {count} операций за {self.TIME_WINDOW_MINUTES} минут"
        return None


class NightHighAmountRule(FraudRule):
    """Правило: операция ночью + высокая сумма."""

    NIGHT_START = 0  # 00:00
    NIGHT_END = 6  # 06:00
    NIGHT_AMOUNT_MULTIPLIER = 3.0

    def check(
        self, transaction: Transaction, client_transactions: List[Transaction]
    ) -> Optional[str]:
        if not transaction.timestamp or not transaction.amount:
            return None

        hour = transaction.timestamp.hour
        is_night = self.NIGHT_START <= hour < self.NIGHT_END

        if not is_night:
            return None

        amounts = [t.amount for t in client_transactions if t.amount and t.amount > 0]
        if not amounts:
            return None

        avg_amount = mean(amounts)
        if (
            avg_amount > 0
            and transaction.amount > avg_amount * self.NIGHT_AMOUNT_MULTIPLIER
        ):
            return f"Ночная операция ({hour}:00) с высокой суммой {transaction.amount} (средняя: {avg_amount:.2f})"
        return None


class MultiCountryDeviceRule(FraudRule):
    """Правило: одно устройство используется в разных странах за короткий период."""

    TIME_WINDOW_HOURS = 1
    MIN_COUNTRIES = 2

    def check(
        self, transaction: Transaction, client_transactions: List[Transaction]
    ) -> Optional[str]:
        if (
            not transaction.device
            or not transaction.timestamp
            or not transaction.country
        ):
            return None

        window_start = transaction.timestamp - timedelta(hours=self.TIME_WINDOW_HOURS)

        same_device_txns = [
            t
            for t in client_transactions
            if t.device == transaction.device
            and t.timestamp
            and window_start <= t.timestamp <= transaction.timestamp
            and t.country
        ]

        countries = {t.country for t in same_device_txns}
        if len(countries) >= self.MIN_COUNTRIES:
            return f"Устройство {transaction.device} использовалось в {len(countries)} странах за {self.TIME_WINDOW_HOURS} ч: {', '.join(countries)}"
        return None


class FraudDetectionService:
    """
    Сервис для выявления мошеннических операций.
    Легко расширяется: добавляйте новые правила в _init_rules().
    """

    def __init__(self, transaction_repo: TransactionRepository):
        self.repo = transaction_repo
        self.rules: List[FraudRule] = self._init_rules()

    def _init_rules(self) -> List[FraudRule]:
        """Инициализация списка правил. Добавляйте новые правила сюда."""
        return [
            HighAmountRule(),
            UnusualCountryRule(),
            HighFrequencyRule(),
            NightHighAmountRule(),
            MultiCountryDeviceRule(),
        ]

    def _get_client_transactions(
        self, transactions: List[Transaction], client_id: int
    ) -> List[Transaction]:
        """Фильтрация транзакций по клиенту (для внутренней логики)."""
        return [t for t in transactions if t.client_id == client_id]

    def check_transaction(
        self,
        transaction: Transaction,
        client_transactions: Optional[List[Transaction]] = None,
    ) -> FraudCheckResult:
        """
        Проверить одну транзакцию на мошенничество.

        :param transaction: проверяемая транзакция
        :param client_transactions: опционально, история транзакций клиента (если нет — загрузим)
        :return: FraudCheckResult с результатом проверки
        """
        if client_transactions is None:
            # Если история не передана, загружаем её (требует async, поэтому возвращаем пустой список)
            # В реальном использовании передавайте историю извне
            client_transactions = []

        result = FraudCheckResult(is_fraud=False, checked_rules=[])

        for rule in self.rules:
            rule_name = rule.__class__.__name__
            result.checked_rules.append(rule_name)

            reason = rule.check(transaction, client_transactions)
            if reason:
                result.is_fraud = True
                result.fraud_reason = reason
                result.fraud_score = 0.7
                break

        return result

    async def analyze_client_transactions(
        self, client_id: int
    ) -> List[FraudCheckResult]:
        """
        Проанализировать все транзакции клиента.

        :param client_id: ID клиента
        :return: список результатов проверки для каждой транзакции
        """
        all_txns = await self.repo.get_transactions_by_client(client_id)
        client_txns = [t for t in all_txns if t.client_id == client_id]

        results = []
        for txn in client_txns:
            result = self.check_transaction(txn, client_txns)
            results.append(result)

        return results

    async def mark_fraudulent_transactions(self) -> dict:
        """
        Массово пометить подозрительные транзакции.

        :return: статистика обработки
        """

        return {
            "status": "not_implemented_full_scan",
            "message": "Массовая проверка требует списка всех клиентов. Используйте analyze_client_transactions для конкретного client_id.",
        }
