from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.app.database.connection import get_db
from backend.app.models.user import User

from backend.app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    ProfileUpdateRequest,
    ProfileResponse,
    RegisterRequest,
)

from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
    require_admin,
)


# ==================================================
# ROUTER
# ==================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ==================================================
# CUSTOMER REGISTRATION
# ==================================================

@router.post(
    "/register",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_customer(
    register_data: RegisterRequest,
    db: Session = Depends(get_db),
):
    username = register_data.username.strip()
    email = str(register_data.email).strip().lower()

    if len(username) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must contain at least 3 characters",
        )

    if not username:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username cannot be empty",
        )

    # Check for duplicate username.
    existing_username = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already in use",
        )

    # Check for duplicate email.
    existing_email = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered",
        )

    # Public registration always creates a customer.
    new_user = User(
        username=username,
        email=email,
        password_hash=hash_password(register_data.password),
        role="customer",
        is_active=True,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email address is already in use",
        )

    return new_user


# ==================================================
# LOGIN
# ==================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.username == login_data.username)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if not verify_password(
        login_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    access_token_expires = timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
    )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role,
        },
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ==================================================
# GET CURRENT USER PROFILE
# ==================================================

@router.get(
    "/me",
    response_model=ProfileResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ==================================================
# UPDATE CURRENT USER PROFILE
# ==================================================

@router.put(
    "/me",
    response_model=ProfileResponse,
)
def update_my_profile(
    profile_data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_user = (
        db.query(User)
        .filter(User.id == current_user.id)
        .first()
    )

    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    username = profile_data.username.strip()
    email = str(profile_data.email).strip().lower()

    if len(username) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must contain at least 3 characters",
        )

    existing_username = (
        db.query(User)
        .filter(
            User.username == username,
            User.id != db_user.id,
        )
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already in use",
        )

    existing_email = (
        db.query(User)
        .filter(
            User.email == email,
            User.id != db_user.id,
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already in use",
        )

    db_user.username = username
    db_user.email = email

    try:
        db.commit()
        db.refresh(db_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email address is already in use",
        )

    return db_user


# ==================================================
# ADMIN TEST ENDPOINT
# ==================================================

@router.get(
    "/admin-test",
)
def admin_test(
    current_user: User = Depends(require_admin),
):
    return {
        "message": "Admin access granted",
        "user": current_user.username,
        "role": current_user.role,
    }