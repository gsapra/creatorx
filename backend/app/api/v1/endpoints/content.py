from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User, Content, Persona
from app.schemas.schemas import ContentResponse, ContentCreate
from app.api.v1.endpoints.auth import get_current_user
import time
import secrets

router = APIRouter()


@router.get("/", response_model=List[ContentResponse])
async def get_content(
    content_type: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all content for current user"""
    query = db.query(Content).filter(Content.user_id == current_user.id)
    
    if content_type:
        query = query.filter(Content.type == content_type)
    
    content = query.order_by(Content.created_at.desc()).offset(skip).limit(limit).all()
    return content


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content_item(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific content item"""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return content


@router.post("/{content_id}/favorite", response_model=ContentResponse)
async def toggle_favorite(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle content favorite status"""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.is_favorite = not content.is_favorite
    db.commit()
    db.refresh(content)
    
    return content


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete content"""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    db.delete(content)
    db.commit()
    
    return None


@router.post("/{content_id}/share", response_model=ContentResponse)
async def create_share_link(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a public share link for content"""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Generate share token if doesn't exist
    if not content.share_token:
        content.share_token = secrets.token_urlsafe(32)
    
    content.is_public = True
    db.commit()
    db.refresh(content)
    
    return content


@router.delete("/{content_id}/share", response_model=ContentResponse)
async def remove_share_link(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove public share link for content"""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.is_public = False
    db.commit()
    db.refresh(content)
    
    return content


@router.get("/shared/{share_token}", response_model=ContentResponse)
async def get_shared_content(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Get publicly shared content (no auth required)"""
    content = db.query(Content).filter(
        Content.share_token == share_token,
        Content.is_public == True
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Shared content not found or no longer available")
    
    return content
