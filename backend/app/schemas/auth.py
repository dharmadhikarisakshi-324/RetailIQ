from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ==================================================
# LOGIN
# ==================================================

class LoginRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ==================================================
# CUSTOMER REGISTRATION
# ==================================================

class RegisterRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
    )
    email: EmailStr
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
    )


# ==================================================
# PROFILE UPDATE
# ==================================================

class ProfileUpdateRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
    )
    email: EmailStr


# ==================================================
# PROFILE RESPONSE
# ==================================================

class ProfileResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)