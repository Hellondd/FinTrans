from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), unique=True)
    passport_number = Column(String(20), unique=True)
    inn = Column(String(12), unique=True)
    snils = Column(String(14))
    document_verified = Column(Boolean, default=False)
    verification_date = Column(Date)

    client = relationship("Client", back_populates="document")
