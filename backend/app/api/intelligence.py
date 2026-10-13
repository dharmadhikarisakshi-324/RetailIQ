from fastapi import APIRouter, Depends

from backend.app.models.user import User

from backend.app.core.security import (
    get_current_user,
    require_staff
)


router = APIRouter(
    prefix="/api/intelligence",
    tags=["AI Intelligence"]
)


@router.get("/status")
def intelligence_status(
    current_user: User = Depends(get_current_user)
):

    return {
        "customer_intelligence": "available",
        "product_intelligence": "available",
        "recommendation_engine": "available",
        "promotion_engine": "available",
        "inventory_intelligence": "available",
        "status": "ready"
    }


@router.get("/summary")
def intelligence_summary(
    current_user: User = Depends(require_staff)
):

    return {
        "modules": [
            {
                "name": "Customer Intelligence",
                "status": "ready",
                "models": [
                    "RFM",
                    "KMeans",
                    "XGBoost CLV",
                    "Random Forest Churn",
                    "SHAP"
                ]
            },
            {
                "name": "Product Intelligence",
                "status": "ready",
                "models": [
                    "Market Basket Analysis",
                    "Product Similarity",
                    "Substitution"
                ]
            },
            {
                "name": "Recommendation",
                "status": "ready",
                "models": [
                    "Collaborative Filtering",
                    "Content-Based Filtering",
                    "Hybrid Recommendation"
                ]
            },
            {
                "name": "Promotion",
                "status": "ready",
                "models": [
                    "Purchase Propensity",
                    "Expected Value",
                    "Offer Optimization"
                ]
            },
            {
                "name": "Inventory",
                "status": "ready",
                "models": [
                    "Demand Forecast",
                    "Safety Stock",
                    "Reorder Point",
                    "Inventory Risk"
                ]
            }
        ]
    }