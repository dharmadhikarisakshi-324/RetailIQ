from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base


class CustomerMetrics(Base):
    __tablename__ = "customer_metrics"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False,
        unique=True
    )

    total_spending = Column(
        Float,
        nullable=False,
        default=0.0
    )

    total_quantity = Column(
        Integer,
        nullable=False,
        default=0
    )

    number_of_transactions = Column(
        Integer,
        nullable=False,
        default=0
    )

    recency = Column(
        Integer,
        nullable=False,
        default=0
    )

    average_order_value = Column(
        Float,
        nullable=False,
        default=0.0
    )

    r_score = Column(
        Integer,
        nullable=True
    )

    f_score = Column(
        Integer,
        nullable=True
    )

    m_score = Column(
        Integer,
        nullable=True
    )

    rfm_score = Column(
        Integer,
        nullable=True
    )

    rfm_total = Column(
        Integer,
        nullable=True
    )

    customer = relationship("Customer")