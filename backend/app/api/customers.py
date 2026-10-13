from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.customer import Customer
from backend.app.models.user import User

from backend.app.repositories import customer_repository as repo

from backend.app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)

from backend.app.core.security import (
    get_current_user,
    require_staff,
    require_admin,
)


router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"],
)


# ==================================================
# GET ALL CUSTOMERS — STAFF/ADMIN
# ==================================================

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    if skip < 0 or limit < 1 or limit > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pagination parameters",
        )

    return repo.get_all_customers(
        db,
        skip=skip,
        limit=limit,
    )


# ==================================================
# GET CUSTOMER BY ID — STAFF/ADMIN OR OWN PROFILE
# ==================================================

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = repo.get_customer_by_id(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    if current_user.role not in ("admin", "staff"):
        if (
            current_user.role != "customer"
            or not customer.email
            or customer.email.casefold() != current_user.email.casefold()
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

    return customer


# ==================================================
# CREATE CUSTOMER — STAFF/ADMIN
# ==================================================

@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    customer_data: CustomerCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    return repo.create_customer(
        db,
        customer_data.model_dump(),
    )


# ==================================================
# UPDATE CUSTOMER — STAFF/ADMIN
# ==================================================

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    customer = repo.get_customer_by_id(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    update_data = customer_data.model_dump(exclude_unset=True)

    return repo.update_customer(
        db,
        customer,
        update_data,
    )


# ==================================================
# DELETE CUSTOMER — ADMIN ONLY
# ==================================================

@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer(
    customer_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    customer = repo.get_customer_by_id(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    repo.delete_customer(db, customer)

    return None