from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.models.inventory import Inventory


def get_all_inventory(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[Inventory]:

    return (
        db.query(Inventory)
        .order_by(Inventory.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_inventory_by_id(
    db: Session,
    inventory_id: int
) -> Optional[Inventory]:

    return (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )


def get_inventory_by_product_id(
    db: Session,
    product_id: int
) -> Optional[Inventory]:

    return (
        db.query(Inventory)
        .filter(Inventory.product_id == product_id)
        .first()
    )


def update_inventory(
    db: Session,
    inventory: Inventory,
    data: dict
) -> Inventory:

    for field, value in data.items():
        setattr(inventory, field, value)

    db.commit()
    db.refresh(inventory)

    return inventory