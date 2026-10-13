from typing import Any

from fastapi import APIRouter, Depends, Query

from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.services.recommendation_service import (
    get_customer_recommendations,
    get_recommended_products,
)


router = APIRouter(
    prefix="/api/recommendations",
    tags=["Customer Recommendations"],
)


# ============================================================
# CUSTOMER RECOMMENDATIONS
# ============================================================

@router.get("/for-you")
def recommendations_for_customer(
    top_n: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Return product recommendations for the authenticated customer.
    """

    customer_id = getattr(current_user, "id", None)

    result = get_customer_recommendations(
        customer_id=customer_id,
        top_n=top_n,
    )

    return result


# ============================================================
# SIMILAR PRODUCTS
# ============================================================

@router.get("/similar/{stock_code}")
def similar_products_for_customer(
    stock_code: str,
    top_n: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Return products similar to a selected product.
    """

    products = get_recommended_products(
        stock_code=stock_code,
        top_n=top_n,
    )

    return {
        "stock_code": stock_code,
        "recommendation_type": "similar_products",
        "products": products,
    }