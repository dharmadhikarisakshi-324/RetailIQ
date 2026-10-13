from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.models.product import Product


def get_all_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    """Return a page of products."""
    return db.query(Product).order_by(Product.id).offset(skip).limit(limit).all()


def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    """Return one product, or None if it does not exist."""
    return db.query(Product).filter(Product.id == product_id).first()


def create_product(db: Session, data: dict) -> Product:
    """Insert a new product and return it."""
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, data: dict) -> Product:
    """Apply the given fields to an existing product."""
    for field, value in data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    """Delete a product."""
    db.delete(product)
    db.commit()