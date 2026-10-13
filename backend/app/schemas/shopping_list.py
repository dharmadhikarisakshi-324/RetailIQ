from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field, field_validator


# =========================================================
# SHOPPING LIST
# =========================================================

class ShoppingListCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Shopping list name cannot be empty.")

        return value


class ShoppingListUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Shopping list name cannot be empty.")

        return value


# =========================================================
# SHOPPING LIST ITEMS
# =========================================================

class ShoppingListItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(default=1, gt=0, le=10000)


class ShoppingListItemUpdate(BaseModel):
    quantity: int = Field(gt=0, le=10000)
    is_purchased: bool | None = None


# =========================================================
# PRODUCT SUMMARY IN A SHOPPING LIST
# =========================================================

class ShoppingListProductResponse(BaseModel):
    id: int
    product_code: str
    barcode: str | None = None
    name: str
    price: float
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# SHOPPING LIST ITEM RESPONSE
# =========================================================

class ShoppingListItemResponse(BaseModel):
    id: int
    shopping_list_id: int
    product_id: int
    quantity: int
    is_purchased: bool
    product: ShoppingListProductResponse

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# COMPLETE SHOPPING LIST RESPONSE
# =========================================================

class ShoppingListResponse(BaseModel):
    id: int
    customer_id: int
    name: str
    created_at: datetime
    updated_at: datetime
    items: List[ShoppingListItemResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)