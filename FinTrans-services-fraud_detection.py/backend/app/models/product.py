from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"))
    product_type = Column(String(50))
    amount = Column(Float)
    interest_rate = Column(Float)
    status = Column(String(30))
    start_date = Column(Date)