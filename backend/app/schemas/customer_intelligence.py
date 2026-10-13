from typing import Optional

from pydantic import BaseModel


class CustomerIntelligenceResponse(BaseModel):
    customer_id: int
    customer_code: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    loyalty_member: bool
    is_active: bool

    total_spending: Optional[float] = None
    total_quantity: Optional[int] = None
    number_of_transactions: Optional[int] = None
    recency: Optional[int] = None
    average_order_value: Optional[float] = None

    r_score: Optional[int] = None
    f_score: Optional[int] = None
    m_score: Optional[int] = None
    rfm_score: Optional[int] = None
    rfm_total: Optional[int] = None

    ml_cluster: Optional[int] = None
    segment_name: Optional[str] = None