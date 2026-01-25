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


@router.get("/stats")
async def get_content_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get aggregated content statistics for current user"""
    from sqlalchemy import func

    # Count by content type
    stats_query = db.query(
        Content.type,
        func.count(Content.id).label('count')
    ).filter(
        Content.user_id == current_user.id
    ).group_by(Content.type).all()

    # Convert to dictionary
    stats = {stat.type.value: stat.count for stat in stats_query}

    # Count active personas
    persona_count = db.query(Persona).filter(Persona.user_id == current_user.id).count()

    # Count collaborations (brand connections) if user is creator
    from app.models.models import Collaboration
    collab_count = 0
    if current_user.role.value == "creator":
        collab_count = db.query(Collaboration).filter(
            Collaboration.creator_id == current_user.id
        ).count()
    elif current_user.role.value == "brand":
        collab_count = db.query(Collaboration).filter(
            Collaboration.brand_id == current_user.id
        ).count()

    return {
        "scripts_generated": stats.get("script", 0),
        "titles_created": stats.get("title", 0),
        "thumbnails_generated": stats.get("thumbnail_idea", 0),
        "social_captions_created": stats.get("social_caption", 0),
        "seo_optimizations": stats.get("seo_content", 0),
        "active_personas": persona_count,
        "brand_connections": collab_count,
        "total_content": sum(stats.values())
    }


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
