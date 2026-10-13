import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from dotenv import load_dotenv

from pathlib import Path
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# ==================================================
# LOAD ENVIRONMENT VARIABLES
# ==================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]

load_dotenv(PROJECT_ROOT / ".env")


# ==================================================
# JWT SETTINGS
# ==================================================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError(
        "SECRET_KEY is missing or too short. "
        "Set a strong SECRET_KEY in the project .env file."
    )

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ==================================================
# HTTP BEARER AUTHENTICATION
# ==================================================

security = HTTPBearer()


# ==================================================
# PASSWORD HASHING
# ==================================================

def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""

    password_bytes = password.encode("utf-8")

    hashed_password = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed_password.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """Verify a plain-text password against a bcrypt hash."""

    plain_password_bytes = plain_password.encode("utf-8")
    hashed_password_bytes = hashed_password.encode("utf-8")

    return bcrypt.checkpw(
        plain_password_bytes,
        hashed_password_bytes
    )


# ==================================================
# CREATE JWT ACCESS TOKEN
# ==================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
) -> str:
    """Create a JWT access token."""

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# ==================================================
# DECODE JWT ACCESS TOKEN
# ==================================================

def decode_access_token(token: str) -> dict | None:
    """Return the decoded payload, or None if invalid/expired."""

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        return None


# ==================================================
# GET CURRENT USER
# ==================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get the authenticated user from the JWT Bearer token."""

    from backend.app.database.connection import SessionLocal
    from backend.app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    token = credentials.credentials

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")

    if user_id is None:
        raise credentials_exception

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise credentials_exception

    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

        if user is None:
            raise credentials_exception

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        return user

    finally:
        db.close()


# ==================================================
# ROLE CHECKING
# ==================================================

def require_role(required_role: str):
    """Create a dependency that checks a user's role."""

    def role_checker(
        current_user=Depends(get_current_user)
    ):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )

        return current_user

    return role_checker


# ==================================================
# ADMIN ROLE
# ==================================================

def require_admin(
    current_user=Depends(get_current_user)
):
    """Allow only admin users."""

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


# ==================================================
# STAFF ROLE
# ==================================================

def require_staff(
    current_user=Depends(get_current_user)
):
    """Allow staff and admin users."""

    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )

    return current_user


# ==================================================
# CUSTOMER ROLE
# ==================================================

def require_customer(
    current_user=Depends(get_current_user)
):
    """Allow customer users."""

    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required"
        )

    return current_user