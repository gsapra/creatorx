from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from app.core.database import get_db
from app.models.models import User, Persona, Content
from app.schemas.schemas import (
    ScriptGenerationRequest,
    TitleGenerationRequest,
    ThumbnailIdeaRequest,
    SocialCaptionRequest,
    SEOOptimizationRequest,
    SEOOptimizationResponse,
    ContentResponse
)
from app.api.v1.endpoints.auth import get_current_user
from app.services.creator_tools_service import creator_tools_service
import time

router = APIRouter()


async def get_persona_dict(db: Session, persona_id: int, user_id: int) -> Dict:
    """Helper to get persona as dict"""
    if not persona_id:
        return None
    
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.user_id == user_id
    ).first()
    
    if not persona:
        return None
    
    return {
        "name": persona.name,
        "type": persona.type.value,
        "description": persona.description,
        "attributes": persona.attributes
    }


def save_content(db: Session, user_id: int, content_data: dict) -> Content:
    """Helper to save generated content"""
    content = Content(**content_data)
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


@router.post("/generate-script", response_model=ContentResponse)
async def generate_script(
    request: ScriptGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate video script"""
    start_time = time.time()
    
    # Log regeneration requests for debugging
    if request.regenerate_feedback:
        print(f"[Script Regeneration] User: {current_user.id}, Feedback: {request.regenerate_feedback[:100]}...")
        print(f"[Script Regeneration] Has previous script: {bool(request.previous_script)}, Length: {len(request.previous_script) if request.previous_script else 0}")
    
    # Get persona if provided and it exists
    persona = await get_persona_dict(db, request.persona_id, current_user.id)
    
    # Generate script
    script = await creator_tools_service.generate_script(request, persona)
    
    generation_time = time.time() - start_time
    
    # Only include persona_id if it's valid (persona was found)
    persona_id_to_save = request.persona_id if persona else None
    
    # Prepare metadata with version tracking
    meta_data = {
        "topic": request.topic,
        "duration_minutes": request.duration_minutes,
        "tone": request.tone,
        "target_audience": request.target_audience
    }
    
    # Add version tracking if this is a regeneration
    if request.parent_content_id:
        meta_data['parent_content_id'] = str(request.parent_content_id)
        meta_data['version_number'] = request.version_number or 2
        if request.regenerate_feedback:
            meta_data['regeneration_feedback'] = request.regenerate_feedback
    else:
        meta_data['version_number'] = 1
    
    # Save to database
    content = save_content(db, current_user.id, {
        "user_id": current_user.id,
        "persona_id": persona_id_to_save,
        "type": "script",
        "title": f"Script: {request.topic}",
        "content_text": script,
        "meta_data": meta_data,
        "ai_model": request.ai_model,
        "prompt_used": str(request.dict()),
        "generation_time": generation_time
    })
    
    return content


@router.post("/generate-titles", response_model=ContentResponse)
async def generate_titles(
    request: TitleGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate video titles"""
    start_time = time.time()
    
    # Get persona if provided
    persona = await get_persona_dict(db, request.persona_id, current_user.id)
    
    # Generate titles
    titles = await creator_tools_service.generate_titles(request, persona)
    
    generation_time = time.time() - start_time
    
    # Save to database
    content = save_content(db, current_user.id, {
        "user_id": current_user.id,
        "persona_id": request.persona_id,
        "type": "title",
        "title": f"Titles for: {request.video_topic}",
        "content_text": "\n".join(titles),
        "meta_data": {
            "topic": request.video_topic,
            "keywords": request.keywords,
            "titles": titles,
            "count": len(titles)
        },
        "ai_model": request.ai_model,
        "prompt_used": str(request.dict()),
        "generation_time": generation_time
    })
    
    return content


@router.post("/generate-thumbnail-ideas", response_model=ContentResponse)
async def generate_thumbnail_ideas(
    request: ThumbnailIdeaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate thumbnail design ideas"""
    start_time = time.time()
    
    # Get persona if provided
    persona = await get_persona_dict(db, request.persona_id, current_user.id)
    
    # Generate ideas
    ideas = await creator_tools_service.generate_thumbnail_ideas(request, persona)
    
    generation_time = time.time() - start_time
    
    # Save to database
    content = save_content(db, current_user.id, {
        "user_id": current_user.id,
        "persona_id": request.persona_id,
        "type": "thumbnail_idea",
        "title": f"Thumbnail Ideas: {request.video_title}",
        "content_text": str(ideas),
        "meta_data": {
            "video_title": request.video_title,
            "video_topic": request.video_topic,
            "ideas": ideas,
            "count": len(ideas)
        },
        "ai_model": request.ai_model,
        "prompt_used": str(request.dict()),
        "generation_time": generation_time
    })
    
    return content


@router.post("/generate-social-caption", response_model=ContentResponse)
async def generate_social_caption(
    request: SocialCaptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate social media caption"""
    start_time = time.time()
    
    # Get persona if provided
    persona = await get_persona_dict(db, request.persona_id, current_user.id)
    
    # Generate caption
    caption = await creator_tools_service.generate_social_caption(request, persona)
    
    generation_time = time.time() - start_time
    
    # Save to database
    content = save_content(db, current_user.id, {
        "user_id": current_user.id,
        "persona_id": request.persona_id,
        "type": "social_caption",
        "title": f"{request.platform.title()} Caption",
        "content_text": caption,
        "meta_data": {
            "platform": request.platform,
            "include_hashtags": request.include_hashtags,
            "include_emojis": request.include_emojis
        },
        "ai_model": request.ai_model,
        "prompt_used": str(request.dict()),
        "generation_time": generation_time
    })
    
    return content


@router.post("/optimize-seo", response_model=Dict)
async def optimize_seo(
    request: SEOOptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Optimize content for SEO"""
    start_time = time.time()
    
    # Get persona if provided
    persona = await get_persona_dict(db, request.persona_id, current_user.id)
    
    # Optimize content
    result = await creator_tools_service.optimize_seo(request, persona)
    
    generation_time = time.time() - start_time
    
    # Save to database
    content = save_content(db, current_user.id, {
        "user_id": current_user.id,
        "persona_id": request.persona_id,
        "type": "seo_content",
        "title": "SEO Optimized Content",
        "content_text": result.optimized_content,
        "meta_data": {
            "meta_title": result.meta_title,
            "meta_description": result.meta_description,
            "suggested_keywords": result.suggested_keywords,
            "seo_score": result.seo_score,
            "target_keywords": request.target_keywords
        },
        "ai_model": request.ai_model,
        "prompt_used": str(request.dict()),
        "generation_time": generation_time
    })
    
    return {
        "content_id": content.id,
        **result.dict()
    }
