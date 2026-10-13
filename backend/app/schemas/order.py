from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# ORDER STATUS
# ============================================================

OrderStatus = Literal[
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
]


# ============================================================
# ORDER ITEM
# ============================================================

class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# CREATE ORDER
# ============================================================

class OrderCreate(BaseModel):
    customer_id: Optional[int] = None

    items: List[OrderItemCreate] = Field(min_length=1)

    status: OrderStatus = "pending"


# ============================================================
# UPDATE ORDER
# ============================================================

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None

    customer_id: Optional[int] = Field(
        default=None,
        gt=0,
    )


# ============================================================
# ORDER RESPONSE
# ============================================================

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: Optional[int]
    total_amount: float
    status: str
    created_at: datetime

    items: List[OrderItemResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)