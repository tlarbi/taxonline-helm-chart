from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import (
    verify_password, create_access_token, create_refresh_token,
    get_current_user, get_password_hash, require_admin
)
from app.core.database import get_db
from app.models.user import User, UserRole

router = APIRouter()


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str = ""
    role: UserRole = UserRole.viewer


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.username == form_data.username, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    user.last_login = datetime.utcnow()
    await db.commit()

    return LoginResponse(
        access_token=create_access_token({"sub": str(user.id)}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "last_login": current_user.last_login,
    }


@router.post("/users", dependencies=[Depends(require_admin)])
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    return {"id": user.id, "username": user.username}


@router.get("/users", dependencies=[Depends(require_admin)])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.is_active == True))
    users = result.scalars().all()
    return [
        {"id": u.id, "username": u.username, "email": u.email, "role": u.role}
        for u in users
    ]
