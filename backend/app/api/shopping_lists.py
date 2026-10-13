from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from backend.app.database.connection import get_db
from backend.app.core.security import get_current_user
from backend.app.models.customer import Customer
from backend.app.models.product import Product
from backend.app.models.shopping_list import ShoppingList, ShoppingListItem
from backend.app.models.user import User
from backend.app.schemas.shopping_list import (
    ShoppingListCreate,
    ShoppingListUpdate,
    ShoppingListItemCreate,
    ShoppingListItemUpdate,
    ShoppingListResponse,
)


router = APIRouter(
    prefix="/api/shopping-lists",
    tags=["Shopping Lists"],
)


# =========================================================
# CUSTOMER ACCOUNT LINKAGE
# =========================================================

def get_customer_for_user(
    user: User,
    db: Session,
) -> Customer:
    """
    Find the customer associated with the logged-in user.

    If a customer account has no matching Customer record,
    create one automatically.
    """

    if user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shopping lists are available only to customers.",
        )

    customer = (
        db.query(Customer)
        .filter(Customer.email.ilike(user.email))
        .first()
    )

    if customer is not None:
        if not customer.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your customer account is inactive.",
            )

        return customer

    # Create a Customer record for an existing customer User.
    customer = Customer(
        customer_code=f"CUST-{user.id:06d}",
        name=user.username,
        email=user.email,
        is_active=True,
        loyalty_member=False,
    )

    db.add(customer)

    try:
        db.commit()
        db.refresh(customer)
        return customer

    except IntegrityError:
        db.rollback()

        # Handle the possibility that a matching customer was
        # created by another request at the same time.
        customer = (
            db.query(Customer)
            .filter(Customer.email.ilike(user.email))
            .first()
        )

        if customer is not None and customer.is_active:
            return customer

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Could not create your customer profile. "
                "Please contact the store administrator."
            ),
        )


# =========================================================
# SHOPPING LIST HELPERS
# =========================================================

def get_owned_list(
    list_id: int,
    customer_id: int,
    db: Session,
) -> ShoppingList:
    """
    Return a shopping list only when it belongs to the
    currently authenticated customer.
    """

    shopping_list = (
        db.query(ShoppingList)
        .options(
            joinedload(ShoppingList.items).joinedload(
                ShoppingListItem.product
            )
        )
        .filter(
            ShoppingList.id == list_id,
            ShoppingList.customer_id == customer_id,
        )
        .first()
    )

    if shopping_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found.",
        )

    return shopping_list


# =========================================================
# GET ALL SHOPPING LISTS
# =========================================================

@router.get(
    "",
    response_model=list[ShoppingListResponse],
)
def get_my_shopping_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_for_user(current_user, db)

    return (
        db.query(ShoppingList)
        .options(
            joinedload(ShoppingList.items).joinedload(
                ShoppingListItem.product
            )
        )
        .filter(
            ShoppingList.customer_id == customer.id
        )
        .order_by(ShoppingList.updated_at.desc())
        .all()
    )


# =========================================================
# CREATE A SHOPPING LIST
# =========================================================

@router.post(
    "",
    response_model=ShoppingListResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shopping_list(
    payload: ShoppingListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_for_user(current_user, db)

    shopping_list = ShoppingList(
        customer_id=customer.id,
        name=payload.name,
    )

    db.add(shopping_list)
    db.commit()
    db.refresh(shopping_list)

    return get_owned_list(
        shopping_list.id,
        customer.id,
        db,
    )


# =========================================================
# RENAME A SHOPPING LIST
# =========================================================

@router.patch(
    "/{list_id}",
    response_model=ShoppingListResponse,
)
def rename_shopping_list(
    list_id: int,
    payload: ShoppingListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_for_user(current_user, db)

    shopping_list = get_owned_list(
        list_id,
        customer.id,
        db,
    )

    shopping_list.name = payload.name

    db.commit()

    return get_owned_list(
        list_id,
        customer.id,
        db,
    )


# =========================================================
# DELETE A SHOPPING LIST
# =========================================================

@router.delete(
    "/{list_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_shopping_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_for_user(current_user, db)

    shopping_list = (
        db.query(ShoppingList)
        .filter(
            ShoppingList.id == list_id,
            ShoppingList.customer_id == customer.id,
        )
        .first()
    )

    if shopping_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found.",
        )

    db.delete(shopping_list)
    db.commit()

    return None


# =========================================================
# ADD A PRODUCT TO A SHOPPING LIST
# =========================================================

@router.post(
    "/{list_id}/items",
    response_model=ShoppingListResponse,
)
def add_product_to_list(
    list_id: int,
    payload: ShoppingListItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_for_user(current_user, db)

    shopping_list = get_owned_list(
        list_id,
        customer.id,
        db,
    )

    product = (
        db.query(Product)
        .filter(
            Product.id == payload.product_id,
            Product.is_active.is_(True),
        )
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active product not found.",
        )

    item = (
        db.query(ShoppingListItem)
        .filter(
            ShoppingListItem.shopping_list_id == shopping_list.id,
            ShoppingListItem.product_id == product.id,
        )
        .first()
    )

    if item is not None:
        new_quantity = item.quantity + payload.quantity

        if new_quantity > 10000:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Combined quantity cannot exceed 10000.",
            )

        item.quantity = new_quantity
        item.is_purchased = False

    else:
        item = ShoppingListItem(
            shopping_list_id=shopping_list.id,
            product_id=product.id,
            quantity=payload.quantity,
            is_purchased=False,
        )

        db.add(item)

    db.commit()

    return get_owned_list(
        list_id,
        customer.id,
        db,
    )


# =========================================================
# UPDATE A SHOPPING LIST ITEM
# =========================================================

@router.patch(
    "/{list_id}/items/{item_id}",
    response_model=ShoppingListResponse,
)
def update_shopping_list_item(
    list_id: int,
    item_id: int,
    payload: ShoppingListItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_for_user(current_user, db)

    shopping_list = get_owned_list(
        list_id,
        customer.id,
        db,
    )

    item = (
        db.query(ShoppingListItem)
        .filter(
            ShoppingListItem.id == item_id,
            ShoppingListItem.shopping_list_id == shopping_list.id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list item not found.",
        )

    item.quantity = payload.quantity

    if payload.is_purchased is not None:
        item.is_purchased = payload.is_purchased

    db.commit()

    return get_owned_list(
        list_id,
        customer.id,
        db,
    )


# =========================================================
# REMOVE A PRODUCT FROM A SHOPPING LIST
# =========================================================

@router.delete(
    "/{list_id}/items/{item_id}",
    response_model=ShoppingListResponse,
)
def remove_product_from_list(
    list_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_for_user(current_user, db)

    shopping_list = get_owned_list(
        list_id,
        customer.id,
        db,
    )

    item = (
        db.query(ShoppingListItem)
        .filter(
            ShoppingListItem.id == item_id,
            ShoppingListItem.shopping_list_id == shopping_list.id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list item not found.",
        )

    db.delete(item)
    db.commit()

    return get_owned_list(
        list_id,
        customer.id,
        db,
    )