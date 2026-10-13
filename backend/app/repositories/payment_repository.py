from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.models.payment import Payment


def get_all_payments(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[Payment]:

    return (
        db.query(Payment)
        .order_by(Payment.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_payment_by_id(
    db: Session,
    payment_id: int
) -> Optional[Payment]:

    return (
        db.query(Payment)
        .filter(
            Payment.id == payment_id
        )
        .first()
    )


def get_payment_by_order_id(
    db: Session,
    order_id: int
) -> Optional[Payment]:

    return (
        db.query(Payment)
        .filter(
            Payment.order_id == order_id
        )
        .first()
    )


def create_payment(
    db: Session,
    payment: Payment
) -> Payment:

    db.add(payment)

    db.commit()

    db.refresh(payment)

    return payment