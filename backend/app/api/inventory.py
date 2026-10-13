from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db

from backend.app.models.user import User

from backend.app.repositories import inventory_repository as repo

from backend.app.schemas.inventory import (
    InventoryResponse,
    InventoryUpdate,
    InventoryRecommendationResponse,
)

from backend.app.core.security import (
    get_current_user,
    require_staff,
)

from backend.app.services.inventory_intelligence import (
    get_inventory_recommendation,
)


# ==================================================
# ROUTER
# ==================================================

router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"],
)


# ==================================================
# GET ALL INVENTORY
# ==================================================

@router.get(
    "",
    response_model=List[InventoryResponse],
)
def get_inventory(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return repo.get_all_inventory(
        db,
        skip=skip,
        limit=limit,
    )


# ==================================================
# INVENTORY INTELLIGENCE
# ==================================================

@router.get(
    "/intelligence/{product_id}",
    response_model=InventoryRecommendationResponse,
)
def get_inventory_intelligence(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = get_inventory_recommendation(
        product_id,
        db=db,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Product {product_id} "
                "not found in inventory intelligence data"
            ),
        )

    return result


# ==================================================
# GET INVENTORY BY ID
# ==================================================

@router.get(
    "/{inventory_id}",
    response_model=InventoryResponse,
)
def get_inventory_item(
    inventory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inventory = repo.get_inventory_by_id(
        db,
        inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Inventory with id {inventory_id} not found"
            ),
        )

    return inventory


# ==================================================
# UPDATE INVENTORY
# ==================================================

@router.put(
    "/{inventory_id}",
    response_model=InventoryResponse,
)
def update_inventory(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    inventory = repo.get_inventory_by_id(
        db,
        inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Inventory with id {inventory_id} not found"
            ),
        )

    update_data = inventory_data.model_dump(
        exclude_unset=True,
    )

    inventory = repo.update_inventory(
        db,
        inventory,
        update_data,
    )

    return inventory