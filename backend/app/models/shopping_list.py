from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(100), nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    items = relationship(
        "ShoppingListItem",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ShoppingListItem.id",
    )


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    __table_args__ = (
        UniqueConstraint(
            "shopping_list_id",
            "product_id",
            name="uq_shopping_list_product",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    shopping_list_id = Column(
        Integer,
        ForeignKey("shopping_lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        index=True,
    )

    quantity = Column(Integer, nullable=False, default=1)

    is_purchased = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    shopping_list = relationship(
        "ShoppingList",
        back_populates="items",
    )

    product = relationship("Product")