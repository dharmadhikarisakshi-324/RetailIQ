from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db

from backend.app.models.user import User

from backend.app.repositories import customer_intelligence_repository as repo

from backend.app.schemas.customer_intelligence import (
    CustomerIntelligenceResponse
)

from backend.app.core.security import (
    require_staff
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/customer-intelligence",
    tags=["Customer Intelligence"]
)


# =========================================================
# GET ALL CUSTOMER INTELLIGENCE
# ADMIN + STAFF ONLY
# =========================================================

@router.get(
    "",
    response_model=List[CustomerIntelligenceResponse]
)
def get_customer_intelligence_list(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):

    results = repo.get_all_customer_intelligence(
        db,
        skip=skip,
        limit=limit
    )

    response = []

    for item in results:

        customer = item["customer"]
        metrics = item["metrics"]
        segment = item["segment"]

        response.append(
            CustomerIntelligenceResponse(
                customer_id=customer.id,
                customer_code=customer.customer_code,
                name=customer.name,
                email=customer.email,
                phone=customer.phone,
                loyalty_member=customer.loyalty_member,
                is_active=customer.is_active,

                total_spending=(
                    metrics.total_spending
                    if metrics else None
                ),

                total_quantity=(
                    metrics.total_quantity
                    if metrics else None
                ),

                number_of_transactions=(
                    metrics.number_of_transactions
                    if metrics else None
                ),

                recency=(
                    metrics.recency
                    if metrics else None
                ),

                average_order_value=(
                    metrics.average_order_value
                    if metrics else None
                ),

                r_score=(
                    metrics.r_score
                    if metrics else None
                ),

                f_score=(
                    metrics.f_score
                    if metrics else None
                ),

                m_score=(
                    metrics.m_score
                    if metrics else None
                ),

                rfm_score=(
                    metrics.rfm_score
                    if metrics else None
                ),

                rfm_total=(
                    metrics.rfm_total
                    if metrics else None
                ),

                ml_cluster=(
                    segment.ml_cluster
                    if segment else None
                ),

                segment_name=(
                    segment.segment_name
                    if segment else None
                )
            )
        )

    return response


# =========================================================
# GET CUSTOMER INTELLIGENCE BY ID
# ADMIN + STAFF ONLY
# =========================================================

@router.get(
    "/{customer_id}",
    response_model=CustomerIntelligenceResponse
)
def get_customer_intelligence(
    customer_id: int,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):

    result = repo.get_customer_intelligence(
        db,
        customer_id
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found"
        )

    customer = result["customer"]
    metrics = result["metrics"]
    segment = result["segment"]

    return CustomerIntelligenceResponse(
        customer_id=customer.id,
        customer_code=customer.customer_code,
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        loyalty_member=customer.loyalty_member,
        is_active=customer.is_active,

        total_spending=(
            metrics.total_spending
            if metrics else None
        ),

        total_quantity=(
            metrics.total_quantity
            if metrics else None
        ),

        number_of_transactions=(
            metrics.number_of_transactions
            if metrics else None
        ),

        recency=(
            metrics.recency
            if metrics else None
        ),

        average_order_value=(
            metrics.average_order_value
            if metrics else None
        ),

        r_score=(
            metrics.r_score
            if metrics else None
        ),

        f_score=(
            metrics.f_score
            if metrics else None
        ),

        m_score=(
            metrics.m_score
            if metrics else None
        ),

        rfm_score=(
            metrics.rfm_score
            if metrics else None
        ),

        rfm_total=(
            metrics.rfm_total
            if metrics else None
        ),

        ml_cluster=(
            segment.ml_cluster
            if segment else None
        ),

        segment_name=(
            segment.segment_name
            if segment else None
        )
    )