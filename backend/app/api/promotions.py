from fastapi import APIRouter, Depends, HTTPException

from backend.app.models.user import User

from backend.app.core.security import (
    get_current_user,
    require_staff
)

from backend.app.services.promotion_service import (
    get_promotion_recommendation,
    get_all_promotion_offers
)


router = APIRouter(
    prefix="/api/promotions",
    tags=["Promotion Intelligence"]
)


# ============================================================
# BEST PROMOTION
# ============================================================

@router.get(
    "/recommend/{customer_id}/{product_id}"
)
def promotion_recommendation(
    customer_id: int,
    product_id: str,
    current_user: User = Depends(
        require_staff
    )
):

    result = get_promotion_recommendation(
        customer_id=customer_id,
        product_id=product_id
    )

    if result is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "Customer or product not found "
                "in promotion intelligence data"
            )
        )

    return {
        "customer_id":
            result["Customer ID"],

        "stock_code":
            result["StockCode"],

        "description":
            result["Description"],

        "customer_segment":
            result["CustomerSegment"],

        "purchase_probability":
            result["PurchaseProbability"],

        "recommended_offer":
            result["RecommendedOffer"],

        "discount_rate":
            result["DiscountRate"],

        "estimated_purchase_probability":
            result[
                "EstimatedPurchaseProbability"
            ],

        "product_price":
            result["ProductPrice"],

        "discounted_price":
            result["DiscountedPrice"],

        "expected_revenue":
            result["ExpectedRevenue"]
    }


# ============================================================
# ALL PROMOTION SCENARIOS
# ============================================================

@router.get(
    "/offers/{customer_id}/{product_id}"
)
def promotion_offers(
    customer_id: int,
    product_id: str,
    current_user: User = Depends(
        require_staff
    )
):

    results = get_all_promotion_offers(
        customer_id=customer_id,
        product_id=product_id
    )

    if results is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "Customer or product not found "
                "in promotion intelligence data"
            )
        )

    return {
        "customer_id": customer_id,
        "stock_code": product_id,
        "offers": results
    }