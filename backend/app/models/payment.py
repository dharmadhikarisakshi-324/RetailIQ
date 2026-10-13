from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base


class Payment(Base):

    __tablename__ = "payments"

    # ==========================================
    # PRIMARY KEY
    # ==========================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ==========================================
    # ORDER REFERENCE
    # ==========================================

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False,
        unique=True,
    )

    # ==========================================
    # PAYMENT DETAILS
    # ==========================================

    payment_method = Column(
        String(50),
        nullable=False,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    # New payment records remain pending by default.
    status = Column(
        String(50),
        nullable=False,
        default="pending",
    )

    # Used when a payment gateway provides a reference.
    transaction_reference = Column(
        String(100),
        nullable=True,
        default=None,
    )

    # Set this only when payment is actually completed.
    paid_at = Column(
        DateTime,
        nullable=True,
        default=None,
    )

    # ==========================================
    # RELATIONSHIP
    # ==========================================

    order = relationship(
        "Order",
        back_populates="payment",
    )