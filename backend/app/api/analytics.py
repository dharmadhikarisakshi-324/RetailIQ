from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db

from backend.app.models.user import User
from backend.app.models.order import Order
from backend.app.models.order_item import OrderItem
from backend.app.models.product import Product
from backend.app.models.customer import Customer
from backend.app.models.inventory import Inventory

from backend.app.core.security import get_current_user


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get("/dashboard")
def dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_sales = (
        db.query(
            func.coalesce(func.sum(Order.total_amount), 0)
        )
        .filter(Order.status == "paid")
        .scalar()
    )

    total_orders = (
        db.query(func.count(Order.id))
        .scalar()
    )

    total_customers = (
        db.query(func.count(Customer.id))
        .filter(Customer.is_active.is_(True))
        .scalar()
    )

    total_products = (
        db.query(func.count(Product.id))
        .filter(Product.is_active.is_(True))
        .scalar()
    )

    low_stock_products = (
        db.query(func.count(Inventory.id))
        .filter(
            Inventory.stock_quantity <= Inventory.reorder_level
        )
        .scalar()
    )

    return {
        "total_sales": float(total_sales or 0),
        "total_orders": int(total_orders or 0),
        "total_customers": int(total_customers or 0),
        "total_products": int(total_products or 0),
        "low_stock_products": int(low_stock_products or 0),
    }


# =========================================================
# SALES ANALYTICS
# =========================================================

@router.get("/sales")
def sales_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("sales"),
            func.count(Order.id).label("orders"),
        )
        .filter(Order.status == "paid")
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    return [
        {
            "date": str(row.date),
            "sales": float(row.sales or 0),
            "orders": int(row.orders or 0),
        }
        for row in results
    ]


# =========================================================
# TOP PRODUCTS
# =========================================================

@router.get("/top-products")
def top_products(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100.",
        )

    results = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.sum(OrderItem.quantity).label("quantity_sold"),
            func.sum(OrderItem.subtotal).label("revenue"),
        )
        .join(
            OrderItem,
            OrderItem.product_id == Product.id,
        )
        .join(
            Order,
            Order.id == OrderItem.order_id,
        )
        .filter(Order.status == "paid")
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "quantity_sold": int(row.quantity_sold or 0),
            "revenue": float(row.revenue or 0),
        }
        for row in results
    ]


# =========================================================
# LOW-STOCK PRODUCTS
# =========================================================

@router.get("/low-stock")
def low_stock_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        results = (
            db.query(
                Inventory.product_id.label("product_id"),
                Product.name.label("product_name"),
                Inventory.stock_quantity.label("stock_quantity"),
                Inventory.reorder_level.label("reorder_level"),
            )
            .join(
                Product,
                Inventory.product_id == Product.id,
            )
            .filter(
                Inventory.stock_quantity <= Inventory.reorder_level,
            )
            .order_by(
                Inventory.stock_quantity.asc(),
                Product.name.asc(),
            )
            .all()
        )

        return [
            {
                "product_id": row.product_id,
                "product_name": row.product_name,
                "stock_quantity": row.stock_quantity,
                "reorder_level": row.reorder_level,
            }
            for row in results
        ]

    except Exception:
        db.rollback()

        # Log the full error in the backend terminal.
        import logging

        logging.exception("Failed to fetch low-stock products")

        raise HTTPException(
            status_code=500,
            detail="Unable to fetch low-stock products.",
        )