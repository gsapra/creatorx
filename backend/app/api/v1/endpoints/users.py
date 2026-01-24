from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, UserUpdate
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users (for discovery/marketplace)"""
    users = db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user profile"""
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/creators/search", response_model=List[UserResponse])
async def search_creators(
    niche: str = None,
    min_subscribers: int = 0,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search for creators (for brand discovery)"""
    query = db.query(User).filter(User.role == "creator", User.is_active == True)
    
    if niche:
        query = query.filter(User.niche.ilike(f"%{niche}%"))
    
    if min_subscribers > 0:
        query = query.filter(User.subscriber_count >= min_subscribers)
    
    creators = query.offset(skip).limit(limit).all()
    return creators
