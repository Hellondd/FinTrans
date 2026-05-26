from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"))
    amount = Column(Float)
    transaction_type = Column(String(30))   # income, expense, transfer
    timestamp = Column(DateTime)
    device = Column(String(50))
    country = Column(String(60))
    is_fraud = Column(Boolean, default=False)

    client = relationship("Client", back_populates="transactions")
