from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    product_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    barcode = Column(
        String(100),
        unique=True,
        nullable=True,
        index=True,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        String(500),
        nullable=True,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=True,
    )

    price = Column(
        Float,
        nullable=False,
    )

    supplier = Column(
        String(150),
        nullable=True,
    )

    aisle = Column(
        String(50),
        nullable=True,
    )

    shelf = Column(
        String(50),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    category = relationship("Category")