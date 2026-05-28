import asyncio
import logging
import sys
from app.core.database import AsyncSessionLocal
from app.utils.excel_import import ExcelImportService

# Конфигурация логирования для консоли
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("run_import")

async def main():
    logger.info("Инициализация подключения к БД для миграции данных...")
    async with AsyncSessionLocal() as session:
        result = await ExcelImportService.import_all_data(session, "data/clients.xlsx")
        if result:
            logger.info("Процесс миграции завершен успешно.")
        else:
            logger.error(f"Процесс миграции завершен с ошибкой: {result['message']}")

if __name__ == "__main__":
    # Запуск асинхронного event loop
    asyncio.run(main())
