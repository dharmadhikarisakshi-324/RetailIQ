from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

from backend.app.database.connection import Base


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    movement_type = Column(
        String(50),
        nullable=False
    )

    reference_id = Column(
        String(100),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )