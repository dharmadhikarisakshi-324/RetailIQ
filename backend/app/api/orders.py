from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db

from backend.app.models.order import Order
from backend.app.models.order_item import OrderItem
from backend.app.models.product import Product
from backend.app.models.customer import Customer
from backend.app.models.user import User

from backend.app.repositories import order_repository as repo

from backend.app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderUpdate,
)

from backend.app.core.security import (
    get_current_user,
    require_staff,
)


router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"],
)


# ============================================================
# ROLE HELPERS
# ============================================================

def get_user_role(current_user: User) -> str:
    """Return the normalized role of the authenticated user."""
    return str(current_user.role or "").strip().lower()


def ensure_staff_or_admin(current_user: User) -> None:
    """Allow only staff and admin users."""

    if get_user_role(current_user) not in ("admin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or staff access required",
        )


# ============================================================
# FIND CUSTOMER PROFILE
# ============================================================

def get_linked_customer(
    current_user: User,
    db: Session,
) -> Customer | None:
    """
    Find the customer profile associated with the authenticated user.

    User.email and Customer.email are assumed to identify
    the same registered customer.
    """

    if get_user_role(current_user) != "customer":
        return None

    email = (current_user.email or "").strip()

    if not email:
        return None

    return (
        db.query(Customer)
        .filter(Customer.email.ilike(email))
        .first()
    )


# ============================================================
# CHECK ACCESS TO A SPECIFIC ORDER
# ============================================================

def ensure_order_access(
    order: Order,
    current_user: User,
    db: Session,
) -> None:
    """Customers may access only their own orders."""

    role = get_user_role(current_user)

    if role in ("admin", "staff"):
        return

    if role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    customer = get_linked_customer(
        current_user=current_user,
        db=db,
    )

    if customer is None or order.customer_id != customer.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )


# ============================================================
# VALIDATE PAGINATION
# ============================================================

def validate_pagination(
    skip: int,
    limit: int,
) -> None:

    if skip < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skip cannot be negative",
        )

    if limit < 1 or limit > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be between 1 and 500",
        )


# ============================================================
# GET ALL ORDERS / CUSTOMER'S OWN ORDERS
# ============================================================

@router.get(
    "",
    response_model=List[OrderResponse],
)
def get_orders(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve orders accessible to the authenticated user."""

    validate_pagination(skip, limit)

    role = get_user_role(current_user)

    if role in ("admin", "staff"):
        return repo.get_all_orders(
            db,
            skip=skip,
            limit=limit,
        )

    if role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    customer = get_linked_customer(
        current_user=current_user,
        db=db,
    )

    if customer is None:
        return []

    return (
        db.query(Order)
        .filter(Order.customer_id == customer.id)
        .order_by(Order.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# GET ORDER BY ID
# ============================================================

@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve an order after checking access permissions."""

    if order_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID must be positive",
        )

    order = repo.get_order_by_id(
        db,
        order_id,
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    ensure_order_access(
        order=order,
        current_user=current_user,
        db=db,
    )

    return order


# ============================================================
# CREATE ORDER
# ============================================================

@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Customers create orders for themselves.
    Staff/admin may create orders for a selected customer.

    Product prices and order totals are calculated on the backend.
    Customer-submitted totals and statuses are not trusted.
    """

    role = get_user_role(current_user)

    if role not in ("customer", "admin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # --------------------------------------------------------
    # 1. VALIDATE ORDER ITEMS
    # --------------------------------------------------------

    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An order must contain at least one item",
        )

    # --------------------------------------------------------
    # 2. DETERMINE CUSTOMER
    # --------------------------------------------------------

    if role == "customer":

        customer = get_linked_customer(
            current_user=current_user,
            db=db,
        )

        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "No customer profile is linked to this account. "
                    "Please verify the account's email and customer record."
                ),
            )

        # Customers cannot choose another customer's ID.
        customer_id = customer.id

    else:

        customer_id = order_data.customer_id

        if customer_id is not None:
            customer = (
                db.query(Customer)
                .filter(Customer.id == customer_id)
                .first()
            )

            if customer is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Customer not found",
                )

    # --------------------------------------------------------
    # 3. COMBINE DUPLICATE PRODUCT ITEMS
    # --------------------------------------------------------

    combined_quantities = {}

    for item_data in order_data.items:

        product_id = item_data.product_id
        quantity = item_data.quantity

        if product_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product ID must be positive",
            )

        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be greater than zero",
            )

        combined_quantities[product_id] = (
            combined_quantities.get(product_id, 0) + quantity
        )

    # --------------------------------------------------------
    # 4. VALIDATE PRODUCTS AND CALCULATE TOTAL
    # --------------------------------------------------------

    order_items = []
    total_amount = 0.0

    for product_id, quantity in combined_quantities.items():

        product = (
            db.query(Product)
            .filter(Product.id == product_id)
            .first()
        )

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found",
            )

        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {product_id} is not available",
            )

        unit_price = round(float(product.price), 2)

        if unit_price < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {product_id} has an invalid price",
            )

        subtotal = round(unit_price * quantity, 2)
        total_amount += subtotal

        order_items.append(
            {
                "product_id": product.id,
                "quantity": quantity,
                "unit_price": unit_price,
                "subtotal": subtotal,
            }
        )

    total_amount = round(total_amount, 2)

    if total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order total must be greater than zero",
        )

    # --------------------------------------------------------
    # 5. GENERATE UNIQUE ORDER NUMBER
    # --------------------------------------------------------

    order_number = f"ORD-{uuid4().hex[:12].upper()}"

    # --------------------------------------------------------
    # 6. CREATE ORDER AND ORDER ITEMS
    # --------------------------------------------------------

    try:
        order = Order(
            order_number=order_number,
            customer_id=customer_id,
            total_amount=total_amount,
            status="pending",
        )

        db.add(order)
        db.flush()

        for item in order_items:
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    subtotal=item["subtotal"],
                )
            )

        db.commit()
        db.refresh(order)

        return order

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order",
        )


# ============================================================
# UPDATE ORDER — STAFF / ADMIN ONLY
# ============================================================

@router.put(
    "/{order_id}",
    response_model=OrderResponse,
)
def update_order(
    order_id: int,
    order_data: OrderUpdate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Only staff/admin may update order information."""

    ensure_staff_or_admin(current_user)

    if order_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID must be positive",
        )

    order = repo.get_order_by_id(
        db,
        order_id,
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    update_data = order_data.model_dump(
        exclude_unset=True,
    )

    # --------------------------------------------------------
    # VALIDATE CUSTOMER ASSIGNMENT
    # --------------------------------------------------------

    if update_data.get("customer_id") is not None:

        customer = (
            db.query(Customer)
            .filter(Customer.id == update_data["customer_id"])
            .first()
        )

        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

    # --------------------------------------------------------
    # VALIDATE ORDER STATUS
    # --------------------------------------------------------

    if update_data.get("status") is not None:

        new_status = str(
            update_data["status"]
        ).strip().lower()

        allowed_statuses = {
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "completed",
        }

        if new_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported order status",
            )

        update_data["status"] = new_status

    try:
        return repo.update_order(
            db,
            order,
            update_data,
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order",
        )