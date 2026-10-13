from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db

from backend.app.models.payment import Payment
from backend.app.models.order import Order
from backend.app.models.customer import Customer
from backend.app.models.user import User

from backend.app.repositories import payment_repository as repo

from backend.app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    CustomerCheckoutPaymentCreate,
)

from backend.app.core.security import (
    get_current_user,
    require_staff,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
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
# FIND CUSTOMER LINKED TO USER
# ============================================================

def get_linked_customer(
    current_user: User,
    db: Session,
):
    """Find a customer profile using the authenticated user's email."""

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
# CHECK PAYMENT ACCESS
# ============================================================

def ensure_payment_access(
    payment: Payment,
    current_user: User,
    db: Session,
) -> None:
    """Staff/admin can access all payments; customers can access their own."""

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

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    order = (
        db.query(Order)
        .filter(Order.id == payment.order_id)
        .first()
    )

    if order is None or order.customer_id != customer.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
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
# GET ALL PAYMENTS
# GET /api/payments
# ============================================================

@router.get(
    "",
    response_model=List[PaymentResponse],
)
def get_payments(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return payments accessible to the authenticated user."""

    validate_pagination(skip, limit)

    role = get_user_role(current_user)

    if role in ("admin", "staff"):
        return repo.get_all_payments(
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
        db.query(Payment)
        .join(Order, Payment.order_id == Order.id)
        .filter(Order.customer_id == customer.id)
        .order_by(Payment.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================
# GET PAYMENT BY ID
# GET /api/payments/{payment_id}
# ============================================================

@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve one payment after checking access permissions."""

    if payment_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment ID must be positive",
        )

    payment = repo.get_payment_by_id(
        db,
        payment_id,
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    ensure_payment_access(
        payment=payment,
        current_user=current_user,
        db=db,
    )

    return payment


# ============================================================
# GET PAYMENT BY ORDER ID
# GET /api/payments/order/{order_id}
# ============================================================

@router.get(
    "/order/{order_id}",
    response_model=PaymentResponse,
)
def get_payment_by_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the payment belonging to an accessible order."""

    if order_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID must be positive",
        )

    payment = repo.get_payment_by_order_id(
        db,
        order_id,
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    ensure_payment_access(
        payment=payment,
        current_user=current_user,
        db=db,
    )

    return payment


# ============================================================
# CUSTOMER CHECKOUT PAYMENT
# POST /api/payments/checkout
# ============================================================

@router.post(
    "/checkout",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_checkout_payment(
    checkout_data: CustomerCheckoutPaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a pending payment record for the authenticated customer's order.

    The order total is calculated by the backend.
    This endpoint does not process real online payments.
    """

    # --------------------------------------------------------
    # 1. Verify customer role
    # --------------------------------------------------------

    if get_user_role(current_user) != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required",
        )

    # --------------------------------------------------------
    # 2. Find linked customer profile
    # --------------------------------------------------------

    customer = get_linked_customer(
        current_user=current_user,
        db=db,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No customer profile is linked to this account",
        )

    # --------------------------------------------------------
    # 3. Find the customer's own order
    # --------------------------------------------------------

    order = (
        db.query(Order)
        .filter(
            Order.id == checkout_data.order_id,
            Order.customer_id == customer.id,
        )
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # --------------------------------------------------------
    # 4. Validate order status
    # --------------------------------------------------------

    order_status = str(order.status or "").strip().lower()

    if order_status in {
        "cancelled",
        "completed",
        "delivered",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment cannot be initiated for this order",
        )

    # --------------------------------------------------------
    # 5. Check for an existing payment
    # --------------------------------------------------------

    existing_payment = repo.get_payment_by_order_id(
        db,
        order.id,
    )

    if existing_payment is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A payment record already exists for this order",
        )

    # --------------------------------------------------------
    # 6. Validate payment method
    # --------------------------------------------------------

    payment_method = checkout_data.payment_method

    if payment_method not in ("cash", "online"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported checkout payment method",
        )

    # --------------------------------------------------------
    # 7. Create pending payment
    # --------------------------------------------------------

    payment = Payment(
        order_id=order.id,
        payment_method=payment_method,
        amount=round(float(order.total_amount), 2),
        status="pending",
        transaction_reference=None,
        paid_at=None,
    )

    # --------------------------------------------------------
    # 8. Save payment
    # --------------------------------------------------------

    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return payment

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout payment",
        )


# ============================================================
# CREATE PAYMENT RECORD
# STAFF / ADMIN ONLY
# POST /api/payments
# ============================================================

@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Create a payment record for staff/admin workflows."""

    ensure_staff_or_admin(current_user)

    # --------------------------------------------------------
    # 1. Verify order
    # --------------------------------------------------------

    order = (
        db.query(Order)
        .filter(Order.id == payment_data.order_id)
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # --------------------------------------------------------
    # 2. Check existing payment
    # --------------------------------------------------------

    existing_payment = repo.get_payment_by_order_id(
        db,
        payment_data.order_id,
    )

    if existing_payment is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment already exists for this order",
        )

    # --------------------------------------------------------
    # 3. Verify amount against backend order total
    # --------------------------------------------------------

    order_total = round(float(order.total_amount), 2)
    payment_amount = round(float(payment_data.amount), 2)

    if payment_amount != order_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Payment amount does not match order total",
                "order_total": order_total,
                "payment_amount": payment_amount,
            },
        )

    payment_method = str(
        payment_data.payment_method
    ).strip().lower()

    requested_status = str(
        payment_data.status
    ).strip().lower()

    # --------------------------------------------------------
    # 4. Do not allow unverified successful payments
    # --------------------------------------------------------

    if requested_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Payment cannot be marked successful without "
                "verified payment-provider confirmation."
            ),
        )

    allowed_statuses = {
        "pending",
        "processing",
        "failed",
        "cancelled",
        "refunded",
    }

    if requested_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported payment status",
        )

    # --------------------------------------------------------
    # 5. Create payment record
    # --------------------------------------------------------

    payment = Payment(
        order_id=payment_data.order_id,
        payment_method=payment_method,
        amount=payment_amount,
        status=requested_status,
        transaction_reference=payment_data.transaction_reference,
        paid_at=None,
    )

    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return payment

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment record",
        )