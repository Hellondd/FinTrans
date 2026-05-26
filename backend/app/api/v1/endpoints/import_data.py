from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.utils.excel_import import ExcelImportService

router = APIRouter(prefix="/import", tags=["Import"])


@router.post("/excel")
async def import_excel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Импорт данных из clients.xlsx (только для ADMIN)."""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Доступ только для ADMIN")
    
    result = await ExcelImportService.import_all_data(db, "data/clients.xlsx")
    if result:
        return {"message": "Импорт завершён успешно"}
    else:
        raise HTTPException(status_code=500, detail="Ошибка при импорте")