from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class RiskProfile(Base):
    __tablename__ = "risk_profiles"

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), unique=True)
    risk_level = Column(String(20))          # low, medium, high
    fraud_flags = Column(Integer, default=0)
    overdue_days = Column(Integer, default=0)
    open_loans = Column(Integer, default=0)
    recommended_limit = Column(Float)

    client = relationship("Client", back_populates="risk_profile")
