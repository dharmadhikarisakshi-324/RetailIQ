from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CustomerBase(BaseModel):
    """Common fields for Customer schemas."""

    customer_code: str = Field(
        ...,
        min_length=1,
        max_length=50
    )

    ml_customer_id: Optional[int] = None

    name: str = Field(
        ...,
        min_length=1,
        max_length=150
    )

    email: Optional[str] = Field(
        None,
        max_length=255
    )

    phone: Optional[str] = Field(
        None,
        max_length=20
    )

    loyalty_member: bool = False

    is_active: bool = True


class CustomerCreate(CustomerBase):
    """Schema used when creating a customer."""
    pass


class CustomerUpdate(BaseModel):
    """Schema used when updating a customer."""

    customer_code: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50
    )

    ml_customer_id: Optional[int] = None

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=150
    )

    email: Optional[str] = Field(
        None,
        max_length=255
    )

    phone: Optional[str] = Field(
        None,
        max_length=20
    )

    loyalty_member: Optional[bool] = None

    is_active: Optional[bool] = None


class CustomerResponse(CustomerBase):
    """Schema returned by the API."""

    id: int

    model_config = ConfigDict(
        from_attributes=True
    )