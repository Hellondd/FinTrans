from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.transaction_id"))
    client_id = Column(Integer, ForeignKey("clients.client_id"))
    fraud_score = Column(Float)
    reason = Column(String(255))
    status = Column(String(30), default="open") # open, resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", backref="fraud_alerts")
    client = relationship("Client", backref="fraud_alerts")
