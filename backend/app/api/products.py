from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db

from backend.app.repositories import product_repository as repo

from backend.app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate
)

from backend.app.core.security import (
    get_current_user,
    require_admin,
    require_staff
)

from backend.app.models.user import User


# ==================================================
# ROUTER
# ==================================================

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


# ==================================================
# GET ALL PRODUCTS
# ==================================================

@router.get(
    "",
    response_model=List[ProductResponse]
)
def get_products(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return repo.get_all_products(
        db,
        skip=skip,
        limit=limit
    )


# ==================================================
# GET PRODUCT BY ID
# ==================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    product = repo.get_product_by_id(
        db,
        product_id
    )

    if product is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    return product


# ==================================================
# CREATE PRODUCT
# ==================================================

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):

    # ----------------------------------------------
    # Create product
    # ----------------------------------------------

    try:

        product = repo.create_product(
            db,
            product_data.model_dump()
        )

        return product

    # ----------------------------------------------
    # Handle duplicate / database constraint errors
    # ----------------------------------------------

    except IntegrityError as exc:

        db.rollback()

        error_message = str(exc.orig)

        if "ix_products_product_code" in error_message:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Product code "
                    f"'{product_data.product_code}' "
                    f"already exists"
                )
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product could not be created because of a database constraint"
        )


# ==================================================
# UPDATE PRODUCT
# ==================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):

    # ----------------------------------------------
    # Find product
    # ----------------------------------------------

    product = repo.get_product_by_id(
        db,
        product_id
    )

    if product is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    # ----------------------------------------------
    # Update product
    # ----------------------------------------------

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    product = repo.update_product(
        db,
        product,
        update_data
    )

    return product


# ==================================================
# DELETE PRODUCT
# ==================================================

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_product(
    product_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):

    # ----------------------------------------------
    # Find product
    # ----------------------------------------------

    product = repo.get_product_by_id(
        db,
        product_id
    )

    if product is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    # ----------------------------------------------
    # Delete product
    # ----------------------------------------------

    repo.delete_product(
        db,
        product
    )

    return None