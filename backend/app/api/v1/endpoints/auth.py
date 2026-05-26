from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import UserCreate, Token
from app.repositories.user_repo import UserRepository

router = APIRouter(tags=["Авторизация"], prefix="/auth")


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    
    if await repo.get_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if await repo.get_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    
    user = await repo.create_user(user_data, hashed_password)

    access_token = create_access_token(subject=user.username)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(username: str, password: str, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_username(username)
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.username)
    return {"access_token": access_token, "token_type": "bearer"}
