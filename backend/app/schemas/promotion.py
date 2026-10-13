from typing import List, Optional

from pydantic import BaseModel


class PromotionRecommendationResponse(
    BaseModel
):

    customer_id: int
    stock_code: str
    description: str
    customer_segment: str

    purchase_probability: float

    recommended_offer: str
    discount_rate: float

    estimated_purchase_probability: float

    product_price: float
    discounted_price: float

    expected_revenue: float


class PromotionOffer(BaseModel):

    offer: str
    discount_rate: float
    response_factor: float
    estimated_purchase_probability: float
    discounted_price: float
    expected_revenue: float


class PromotionOffersResponse(BaseModel):

    customer_id: int
    stock_code: str
    offers: List[PromotionOffer]