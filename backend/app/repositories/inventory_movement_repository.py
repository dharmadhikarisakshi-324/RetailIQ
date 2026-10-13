from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.models.inventory_movement import InventoryMovement


def get_all_inventory_movements(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[InventoryMovement]:

    return (
        db.query(InventoryMovement)
        .order_by(InventoryMovement.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_inventory_movement_by_id(
    db: Session,
    movement_id: int
) -> Optional[InventoryMovement]:

    return (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.id == movement_id
        )
        .first()
    )


def get_movements_by_product_id(
    db: Session,
    product_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[InventoryMovement]:

    return (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.product_id == product_id
        )
        .order_by(InventoryMovement.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )