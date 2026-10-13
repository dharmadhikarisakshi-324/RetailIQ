from typing import List

from pydantic import BaseModel


# =========================================================
# RECOMMENDATION ITEM
# =========================================================

class RecommendationItem(BaseModel):
    StockCode: str
    Description: str


# =========================================================
# RECOMMENDATION RESPONSE
# =========================================================

class RecommendationResponse(BaseModel):
    customer_id: int
    recommendations: List[RecommendationItem]