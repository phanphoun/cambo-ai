"""Authentication routes for Sastra AI."""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from services.auth_service import (
    user_repo,
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

logger = logging.getLogger("cambo.routes.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    email: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=60)
    avatar: Optional[str] = Field(None, max_length=1500000)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar: Optional[str] = None
    created_at: float


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserResponse


def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Dependency to retrieve the authenticated user from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    user = user_repo.find_by_id(payload["sub"])
    return user


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Register a new user account."""
    existing = user_repo.find_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    try:
        user = user_repo.create_user(
            email=req.email,
            name=req.name,
            password=req.password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    })

    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            avatar=user.get("avatar"),
            created_at=user["created_at"],
        ),
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Log in with existing credentials."""
    user = user_repo.find_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.get("status") == "locked":
        raise HTTPException(
            status_code=403,
            detail="Your account has been locked by an administrator. Please contact support.",
        )

    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    })

    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            avatar=user.get("avatar"),
            created_at=user["created_at"],
        ),
    )


@router.post("/guest", response_model=AuthResponse)
async def guest_login():
    """Create or authenticate as an instant guest user."""
    demo_user = user_repo.find_by_email("demo@sastra.ai")
    if not demo_user:
        demo_user = user_repo.create_user(
            email="demo@sastra.ai",
            name="Sokha Pich (Demo)",
            password="password123",
        )

    token = create_access_token({
        "sub": demo_user["id"],
        "email": demo_user["email"],
        "name": demo_user["name"],
        "role": "guest",
    })

    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=demo_user["id"],
            email=demo_user["email"],
            name=demo_user["name"],
            role="guest",
            avatar=demo_user.get("avatar"),
            created_at=demo_user["created_at"],
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: Optional[dict] = Depends(get_current_user)):
    """Fetch profile of the current authenticated user."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated or token expired.")
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user.get("role", "member"),
        avatar=user.get("avatar"),
        created_at=user["created_at"],
    )


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    req: UpdateProfileRequest,
    user: Optional[dict] = Depends(get_current_user),
):
    """Update profile details (name, avatar/profile picture)."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated or token expired.")

    updates = {}
    if req.name is not None:
        updates["name"] = req.name.strip()
    if req.avatar is not None:
        updates["avatar"] = req.avatar

    updated = user_repo.update_user(user["id"], updates)
    if not updated:
        raise HTTPException(status_code=404, detail="User account not found.")

    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        name=updated["name"],
        role=updated.get("role", "member"),
        avatar=updated.get("avatar"),
        created_at=updated["created_at"],
    )


@router.post("/logout")
async def logout():
    """Logout endpoint."""
    return {"status": "ok", "message": "Successfully logged out."}
