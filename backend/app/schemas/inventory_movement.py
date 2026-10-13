from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InventoryMovementResponse(BaseModel):

    id: int
    product_id: int
    quantity: int
    movement_type: str
    reference_id: str | None = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )