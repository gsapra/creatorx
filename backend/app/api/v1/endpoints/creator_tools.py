from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
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
    ContentResponse,
    ThumbnailTemplate,
    ThumbnailLayer
)
from app.api.v1.endpoints.auth import get_current_user
from app.services.creator_tools_service import creator_tools_service
import time
import json
import asyncio

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


@router.post("/generate-script-stream")
async def generate_script_stream(
    request: ScriptGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate video script with real-time streaming"""

    async def event_generator():
        try:
            start_time = time.time()

            # Send initial progress
            yield f"data: {json.dumps({'type': 'progress', 'message': 'Initializing...'})}\n\n"
            await asyncio.sleep(0.1)

            # Get persona if provided
            yield f"data: {json.dumps({'type': 'progress', 'message': 'Loading persona...'})}\n\n"
            persona = await get_persona_dict(db, request.persona_id, current_user.id)
            await asyncio.sleep(0.1)

            # Start generation
            yield f"data: {json.dumps({'type': 'progress', 'message': 'Generating your script...'})}\n\n"
            await asyncio.sleep(0.2)

            # Generate script (non-streaming for now, but we'll simulate chunking)
            script = await creator_tools_service.generate_script(request, persona)

            # Simulate streaming by sending script in chunks
            # Split script into sentences for smoother streaming effect
            sentences = script.split('. ')
            accumulated_script = ''

            for i, sentence in enumerate(sentences):
                if sentence.strip():
                    # Add period back if not last sentence
                    chunk = sentence + ('. ' if i < len(sentences) - 1 else '')
                    accumulated_script += chunk

                    # Send chunk
                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

                    # Small delay to make streaming visible (adjust for production)
                    await asyncio.sleep(0.05)

            generation_time = time.time() - start_time

            # Prepare metadata
            persona_id_to_save = request.persona_id if persona else None
            meta_data = {
                "topic": request.topic,
                "duration_minutes": request.duration_minutes,
                "tone": request.tone,
                "target_audience": request.target_audience,
                "ai_model": request.ai_model
            }

            # Add version tracking
            if request.parent_content_id:
                meta_data['parent_content_id'] = str(request.parent_content_id)
                meta_data['version_number'] = request.version_number or 2
                if request.regenerate_feedback:
                    meta_data['regeneration_feedback'] = request.regenerate_feedback
            else:
                meta_data['version_number'] = 1

            # Save to database
            yield f"data: {json.dumps({'type': 'progress', 'message': 'Saving to database...'})}\n\n"

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

            # Send completion event with content ID
            yield f"data: {json.dumps({'type': 'complete', 'id': content.id, 'script': script, 'generation_time': generation_time})}\n\n"

        except Exception as e:
            # Send error event
            error_msg = str(e)
            yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


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

    # Only save persona_id if persona was actually found
    persona_id_to_save = request.persona_id if persona else None

    # Save to database
    content = save_content(db, current_user.id, {
        "user_id": current_user.id,
        "persona_id": persona_id_to_save,
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
    """Generate thumbnail templates with editable layers"""
    start_time = time.time()

    try:
        # Get persona if provided
        persona = await get_persona_dict(db, request.persona_id, current_user.id)

        # Generate thumbnail templates (now returns layer-based templates)
        print(f"[Thumbnail API] Generating templates for user {current_user.id}")
        templates = await creator_tools_service.generate_thumbnail_ideas(request, persona)
        print(f"[Thumbnail API] Generated {len(templates)} templates")

        if not templates or len(templates) == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate thumbnail templates. Please try again."
            )

        generation_time = time.time() - start_time

        # Only save persona_id if persona was actually found
        persona_id_to_save = request.persona_id if persona else None

        # Validate templates have required structure (support both old layer-based and new image-based formats)
        for i, template in enumerate(templates):
            if not isinstance(template, dict):
                print(f"[Thumbnail API] Template {i} is not a dict: {type(template)}")
                raise HTTPException(status_code=500, detail="Invalid template format generated")

            # Check if it's the new image-based format or old layer-based format
            is_image_based = 'image_url' in template or 'base64_data' in template
            is_layer_based = 'layers' in template

            if not is_image_based and not is_layer_based:
                print(f"[Thumbnail API] Template {i} missing both image_url and layers")
                raise HTTPException(status_code=500, detail="Template missing required data (image_url or layers)")

        # Save to database with templates
        content = save_content(db, current_user.id, {
            "user_id": current_user.id,
            "persona_id": persona_id_to_save,
            "type": "thumbnail_idea",
            "title": f"Thumbnail Templates: {request.video_title}",
            "content_text": f"{len(templates)} thumbnail templates generated",
            "meta_data": {
                "video_title": request.video_title,
                "video_topic": request.video_topic,
                "templates": templates,  # Layer-based templates
                "count": len(templates)
            },
            "ai_model": request.ai_model,
            "prompt_used": str(request.dict()),
            "generation_time": generation_time
        })

        print(f"[Thumbnail API] Saved content with ID: {content.id}")
        return content

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Thumbnail API] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate thumbnails: {str(e)}"
        )


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

    # Only save persona_id if persona was actually found
    persona_id_to_save = request.persona_id if persona else None

    # Save to database
    content = save_content(db, current_user.id, {
        "user_id": current_user.id,
        "persona_id": persona_id_to_save,
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

    # Only save persona_id if persona was actually found
    persona_id_to_save = request.persona_id if persona else None

    # Save to database
    content = save_content(db, current_user.id, {
        "user_id": current_user.id,
        "persona_id": persona_id_to_save,
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
