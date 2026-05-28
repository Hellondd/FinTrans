from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime



class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"))
    amount = Column(Float)
    currency = Column(String(3), default="RUB")
    transaction_type = Column(String(30))   # income, expense, transfer
    timestamp = Column(DateTime, default=datetime.utcnow)
    device = Column(String(50))
    country = Column(String(60))
    is_fraud = Column(Boolean, default=False)
    status = Column(String(30), default="approved")
    description = Column(String(255), nullable=True)

    user = relationship("User", backref="transactions")
    client = relationship("Client", back_populates="transactions")
