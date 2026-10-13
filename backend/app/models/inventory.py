from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
)
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        unique=True,
    )

    stock_quantity = Column(
        Integer,
        nullable=False,
        default=0,
    )

    reorder_level = Column(
        Integer,
        nullable=False,
        default=10,
    )

    reorder_quantity = Column(
        Integer,
        nullable=False,
        default=50,
    )

    unit_cost = Column(
        Float,
        nullable=True,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    product = relationship("Product")