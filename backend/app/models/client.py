from sqlalchemy import Column, Integer, String, Date, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Client(Base):
    __tablename__ = "clients"

    client_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    gender = Column(String(10))
    birth_date = Column(Date)
    city = Column(String(100))
    monthly_income = Column(Float)
    credit_score = Column(Integer)
    segment = Column(String(50))
    status = Column(String(30))
    registration_date = Column(Date)

    # Связи
    contact = relationship("Contact", back_populates="client", uselist=False)
    address = relationship("Address", back_populates="client", uselist=False)
    document = relationship("Document", back_populates="client", uselist=False)
    risk_profile = relationship("RiskProfile", back_populates="client", uselist=False)
    products = relationship("Product", back_populates="client")
    transactions = relationship("Transaction", back_populates="client")