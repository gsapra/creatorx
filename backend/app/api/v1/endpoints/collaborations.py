from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User, Collaboration
from app.schemas.schemas import CollaborationCreate, CollaborationUpdate, CollaborationResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=CollaborationResponse, status_code=status.HTTP_201_CREATED)
async def create_collaboration(
    collab_data: CollaborationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new collaboration request (by brand)"""
    if current_user.role != "brand":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only brands can create collaboration requests"
        )
    
    # Verify creator exists
    creator = db.query(User).filter(User.id == collab_data.creator_id).first()
    if not creator or creator.role != "creator":
        raise HTTPException(status_code=404, detail="Creator not found")
    
    collaboration = Collaboration(
        creator_id=collab_data.creator_id,
        brand_id=current_user.id,
        title=collab_data.title,
        description=collab_data.description,
        budget=collab_data.budget,
        deadline=collab_data.deadline,
        requirements=collab_data.requirements
    )
    
    db.add(collaboration)
    db.commit()
    db.refresh(collaboration)
    
    return collaboration


@router.get("/", response_model=List[CollaborationResponse])
async def get_collaborations(
    status_filter: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all collaborations for current user"""
    if current_user.role == "creator":
        query = db.query(Collaboration).filter(Collaboration.creator_id == current_user.id)
    else:
        query = db.query(Collaboration).filter(Collaboration.brand_id == current_user.id)
    
    if status_filter:
        query = query.filter(Collaboration.status == status_filter)
    
    collaborations = query.order_by(Collaboration.created_at.desc()).all()
    return collaborations


@router.get("/{collab_id}", response_model=CollaborationResponse)
async def get_collaboration(
    collab_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific collaboration"""
    collaboration = db.query(Collaboration).filter(Collaboration.id == collab_id).first()
    
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    
    # Verify user has access
    if current_user.id not in [collaboration.creator_id, collaboration.brand_id]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return collaboration


@router.put("/{collab_id}", response_model=CollaborationResponse)
async def update_collaboration(
    collab_id: int,
    collab_update: CollaborationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update collaboration status"""
    collaboration = db.query(Collaboration).filter(Collaboration.id == collab_id).first()
    
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    
    # Verify user has access
    if current_user.id not in [collaboration.creator_id, collaboration.brand_id]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    for field, value in collab_update.dict(exclude_unset=True).items():
        setattr(collaboration, field, value)
    
    db.commit()
    db.refresh(collaboration)
    
    return collaboration
