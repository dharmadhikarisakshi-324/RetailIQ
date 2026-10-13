from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db

from backend.app.models.inventory_movement import InventoryMovement
from backend.app.models.user import User

from backend.app.repositories import (
    inventory_movement_repository as repo
)

from backend.app.schemas.inventory_movement import (
    InventoryMovementResponse
)

from backend.app.core.security import (
    get_current_user
)


# ==================================================
# ROUTER
# ==================================================

router = APIRouter(
    prefix="/api/inventory-movements",
    tags=["Inventory Movements"]
)


# ==================================================
# GET ALL INVENTORY MOVEMENTS
# ==================================================

@router.get(
    "",
    response_model=List[InventoryMovementResponse]
)
def get_inventory_movements(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return repo.get_all_inventory_movements(
        db,
        skip=skip,
        limit=limit
    )


# ==================================================
# GET MOVEMENT BY ID
# ==================================================

@router.get(
    "/{movement_id}",
    response_model=InventoryMovementResponse
)
def get_inventory_movement(
    movement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    movement = repo.get_inventory_movement_by_id(
        db,
        movement_id
    )

    if movement is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Inventory movement with id "
                f"{movement_id} not found"
            )
        )

    return movement


# ==================================================
# GET MOVEMENTS BY PRODUCT
# ==================================================

@router.get(
    "/product/{product_id}",
    response_model=List[InventoryMovementResponse]
)
def get_product_inventory_movements(
    product_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return repo.get_movements_by_product_id(
        db,
        product_id=product_id,
        skip=skip,
        limit=limit
    )