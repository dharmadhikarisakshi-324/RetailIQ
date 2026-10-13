from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.models.order import Order


def get_all_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[Order]:
    return (
        db.query(Order)
        .order_by(Order.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_order_by_id(
    db: Session,
    order_id: int
) -> Optional[Order]:
    return (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )


def get_order_by_number(
    db: Session,
    order_number: str
) -> Optional[Order]:
    return (
        db.query(Order)
        .filter(Order.order_number == order_number)
        .first()
    )


def create_order(
    db: Session,
    order: Order
) -> Order:
    db.add(order)
    db.commit()
    db.refresh(order)

    return order


def update_order(
    db: Session,
    order: Order,
    data: dict
) -> Order:
    for field, value in data.items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)

    return order