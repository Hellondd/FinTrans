from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), unique=True)
    country = Column(String(60))
    region = Column(String(100))
    city = Column(String(100))
    street = Column(String(150))
    house = Column(String(20))
    postal_code = Column(String(20))

    client = relationship("Client", back_populates="address")
