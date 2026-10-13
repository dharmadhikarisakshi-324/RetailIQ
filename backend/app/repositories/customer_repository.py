from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.models.customer import Customer


def get_all_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[Customer]:
    """Return a page of customers."""
    return (
        db.query(Customer)
        .order_by(Customer.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_customer_by_id(
    db: Session,
    customer_id: int
) -> Optional[Customer]:
    """Return one customer, or None if not found."""
    return (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )


def create_customer(
    db: Session,
    data: dict
) -> Customer:
    """Insert a new customer and return it."""
    customer = Customer(**data)

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


def update_customer(
    db: Session,
    customer: Customer,
    data: dict
) -> Customer:
    """Update an existing customer."""
    for field, value in data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    return customer


def delete_customer(
    db: Session,
    customer: Customer
) -> None:
    """Delete a customer."""
    db.delete(customer)
    db.commit()