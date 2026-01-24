from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User, Persona
from app.schemas.schemas import PersonaCreate, PersonaUpdate, PersonaResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=PersonaResponse, status_code=status.HTTP_201_CREATED)
async def create_persona(
    persona_data: PersonaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new persona"""
    # If setting as default, unset other defaults
    if persona_data.is_default:
        db.query(Persona).filter(
            Persona.user_id == current_user.id,
            Persona.type == persona_data.type
        ).update({"is_default": False})
    
    persona = Persona(
        user_id=current_user.id,
        name=persona_data.name,
        type=persona_data.type,
        description=persona_data.description,
        attributes=persona_data.attributes,
        is_default=persona_data.is_default
    )
    
    db.add(persona)
    db.commit()
    db.refresh(persona)
    
    return persona


@router.get("/", response_model=List[PersonaResponse])
async def get_personas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all personas for current user"""
    personas = db.query(Persona).filter(Persona.user_id == current_user.id).all()
    return personas


@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific persona"""
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.user_id == current_user.id
    ).first()
    
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    return persona


@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: int,
    persona_update: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update persona"""
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.user_id == current_user.id
    ).first()
    
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    # If setting as default, unset other defaults
    if persona_update.is_default:
        db.query(Persona).filter(
            Persona.user_id == current_user.id,
            Persona.type == persona.type,
            Persona.id != persona_id
        ).update({"is_default": False})
    
    for field, value in persona_update.dict(exclude_unset=True).items():
        setattr(persona, field, value)
    
    db.commit()
    db.refresh(persona)
    
    return persona


@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete persona"""
    persona = db.query(Persona).filter(
        Persona.id == persona_id,
        Persona.user_id == current_user.id
    ).first()
    
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    db.delete(persona)
    db.commit()
    
    return None
