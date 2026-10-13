from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from backend.app.database.connection import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    order_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True
    )

    total_amount = Column(
        Float,
        nullable=False,
        default=0.0
    )

    status = Column(
        String(50),
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    customer = relationship("Customer")

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    payment = relationship(
        "Payment",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan"
    )