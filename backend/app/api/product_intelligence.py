from fastapi import APIRouter, Depends, HTTPException, Query

from backend.app.models.user import User

from backend.app.core.security import require_staff

from backend.app.services.product_intelligence import (
    get_product_intelligence,
    get_product_summary,
    get_similar_products,
    get_association_rules
)

from backend.app.schemas.product_intelligence import (
    ProductIntelligenceResponse,
    ProductSummary,
    SimilarProductsResponse
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/product-intelligence",
    tags=["Product Intelligence"]
)


# =========================================================
# COMPLETE PRODUCT INTELLIGENCE
# =========================================================

@router.get(
    "/{stock_code}",
    response_model=ProductIntelligenceResponse
)
def product_intelligence(
    stock_code: str,
    top_n: int = Query(
        default=5,
        ge=1,
        le=20
    ),
    current_user: User = Depends(require_staff)
):

    result = get_product_intelligence(
        stock_code=stock_code,
        top_n=top_n
    )

    if result is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Product {stock_code} "
                "not found in product intelligence data"
            )
        )

    return result


# =========================================================
# PRODUCT SUMMARY
# =========================================================

@router.get(
    "/summary/{stock_code}",
    response_model=ProductSummary
)
def product_summary(
    stock_code: str,
    current_user: User = Depends(require_staff)
):

    result = get_product_summary(
        stock_code=stock_code
    )

    if result is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Product {stock_code} "
                "not found in product summary"
            )
        )

    return result


# =========================================================
# SIMILAR PRODUCTS
# =========================================================

@router.get(
    "/similar/{stock_code}",
    response_model=SimilarProductsResponse
)
def similar_products(
    stock_code: str,
    top_n: int = Query(
        default=5,
        ge=1,
        le=20
    ),
    current_user: User = Depends(require_staff)
):

    summary = get_product_summary(
        stock_code
    )

    if summary is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Product {stock_code} "
                "not found"
            )
        )

    results = get_similar_products(
        stock_code=stock_code,
        top_n=top_n
    )

    return {
        "StockCode": summary["StockCode"],
        "Description": summary["Description"],
        "similar_products": results
    }


# =========================================================
# ASSOCIATION RULES
# =========================================================

@router.get(
    "/associations/{stock_code}"
)
def product_association_rules(
    stock_code: str,
    current_user: User = Depends(require_staff)
):

    summary = get_product_summary(
        stock_code
    )

    if summary is None:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Product {stock_code} "
                "not found"
            )
        )

    return {
        "StockCode": summary["StockCode"],
        "Description": summary["Description"],
        "association_rules":
            get_association_rules(
                stock_code
            )
    }