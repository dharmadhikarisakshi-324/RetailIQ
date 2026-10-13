from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# PAYMENT STATUS
# ============================================================

PaymentStatus = Literal[
    "pending",
    "processing",
    "paid",
    "failed",
    "cancelled",
    "refunded",
]


# ============================================================
# PAYMENT METHOD
# ============================================================

PaymentMethod = Literal[
    "cash",
    "card",
    "upi",
    "online",
]


# ============================================================
# CREATE PAYMENT
# Staff/Admin payment creation
# ============================================================

class PaymentCreate(BaseModel):
    order_id: int = Field(
        gt=0,
        description="ID of the associated order",
    )

    payment_method: PaymentMethod

    amount: float = Field(
        gt=0,
        description="Payment amount must be greater than zero",
    )

    transaction_reference: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    status: PaymentStatus = "pending"


# ============================================================
# CUSTOMER CHECKOUT PAYMENT REQUEST
# ============================================================

class CustomerCheckoutPaymentCreate(BaseModel):
    order_id: int = Field(
        gt=0,
        description="ID of the order being paid for",
    )

    payment_method: Literal[
        "cash",
        "online",
    ] = Field(
        description="Select cash on delivery or online payment",
    )


# ============================================================
# PAYMENT RESPONSE
# ============================================================

class PaymentResponse(BaseModel):
    id: int

    order_id: int

    payment_method: str

    amount: float

    status: str

    transaction_reference: Optional[str] = None

    paid_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
    )