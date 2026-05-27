from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(50), unique=False, nullable=True)
    email = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String(20), default="manager")  # admin, manager, security, analyst
    is_active = Column(Boolean, default=True)
