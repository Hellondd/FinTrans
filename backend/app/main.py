from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.endpoints import auth, clients, transactions


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(clients.router, prefix=settings.API_V1_STR)
app.include_router(transactions.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "ФинТранс Backend API"}