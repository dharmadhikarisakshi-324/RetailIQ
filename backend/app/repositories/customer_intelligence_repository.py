from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.models.customer import Customer
from backend.app.models.customer_metrics import CustomerMetrics
from backend.app.models.customer_segments import CustomerSegment


def get_customer_intelligence(
    db: Session,
    customer_id: int
) -> Optional[dict]:
    """
    Fetch one customer's profile, RFM metrics,
    and ML segmentation information.
    """

    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if customer is None:
        return None

    metrics = (
        db.query(CustomerMetrics)
        .filter(
            CustomerMetrics.customer_id == customer.id
        )
        .first()
    )

    segment = (
        db.query(CustomerSegment)
        .filter(
            CustomerSegment.customer_id == customer.id
        )
        .first()
    )

    return {
        "customer": customer,
        "metrics": metrics,
        "segment": segment,
    }


def get_all_customer_intelligence(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[dict]:
    """
    Fetch customer profile, RFM metrics,
    and ML segmentation information for multiple customers.
    """

    customers = (
        db.query(Customer)
        .order_by(Customer.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []

    for customer in customers:

        metrics = (
            db.query(CustomerMetrics)
            .filter(
                CustomerMetrics.customer_id == customer.id
            )
            .first()
        )

        segment = (
            db.query(CustomerSegment)
            .filter(
                CustomerSegment.customer_id == customer.id
            )
            .first()
        )

        results.append(
            {
                "customer": customer,
                "metrics": metrics,
                "segment": segment,
            }
        )

    return results