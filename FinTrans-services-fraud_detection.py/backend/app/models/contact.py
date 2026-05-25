from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), unique=True)
    email = Column(String(120), unique=True)
    phone = Column(String(20))
    telegram = Column(String(50))
    preferred_contact = Column(String(20))

    client = relationship("Client", back_populates="contact")