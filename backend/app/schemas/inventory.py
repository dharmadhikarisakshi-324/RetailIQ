from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# NORMAL INVENTORY RESPONSE SCHEMA
# ============================================================

class InventoryResponse(BaseModel):
    id: int
    product_id: int
    stock_quantity: int
    reorder_level: int
    reorder_quantity: int
    unit_cost: Optional[float] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# NORMAL INVENTORY UPDATE SCHEMA
# ============================================================

class InventoryUpdate(BaseModel):
    stock_quantity: Optional[int] = Field(
        default=None,
        ge=0
    )

    reorder_level: Optional[int] = Field(
        default=None,
        ge=0
    )

    reorder_quantity: Optional[int] = Field(
        default=None,
        gt=0
    )

    unit_cost: Optional[float] = Field(
        default=None,
        ge=0
    )


# ============================================================
# INVENTORY INTELLIGENCE — DEMAND FORECAST RESPONSE
# ============================================================

class DemandForecastResponse(BaseModel):

    product_id: str

    forecast_date: str

    forecast_demand: float


# ============================================================
# INVENTORY INTELLIGENCE — RECOMMENDATION RESPONSE
# ============================================================

class InventoryRecommendationResponse(BaseModel):

    product_id: str

    current_stock: int

    predicted_daily_demand: float

    lead_time_days: int

    lead_time_demand: float

    demand_std: float

    safety_stock: float

    reorder_point: float

    recommended_order_quantity: int

    risk_level: str

    recommendation: str