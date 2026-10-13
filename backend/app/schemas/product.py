from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    """Common fields for Product schemas."""

    product_code: str = Field(
        ...,
        min_length=1,
        max_length=50
    )

    barcode: Optional[str] = Field(
        None,
        max_length=100
    )

    name: str = Field(
        ...,
        min_length=1,
        max_length=200
    )

    description: Optional[str] = Field(
        None,
        max_length=500
    )

    category_id: Optional[int] = None

    price: float = Field(
        ...,
        ge=0
    )

    supplier: Optional[str] = Field(
        None,
        max_length=150
    )

    aisle: Optional[str] = Field(
        None,
        max_length=50
    )

    shelf: Optional[str] = Field(
        None,
        max_length=50
    )

    is_active: bool = True


class ProductCreate(ProductBase):
    """Schema used when creating a product."""

    pass


class ProductUpdate(BaseModel):
    """Schema used when updating a product."""

    product_code: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50
    )

    barcode: Optional[str] = Field(
        None,
        max_length=100
    )

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200
    )

    description: Optional[str] = Field(
        None,
        max_length=500
    )

    category_id: Optional[int] = None

    price: Optional[float] = Field(
        None,
        ge=0
    )

    supplier: Optional[str] = Field(
        None,
        max_length=150
    )

    aisle: Optional[str] = Field(
        None,
        max_length=50
    )

    shelf: Optional[str] = Field(
        None,
        max_length=50
    )

    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    """Schema returned by the API."""

    id: int

    model_config = ConfigDict(
        from_attributes=True
    )