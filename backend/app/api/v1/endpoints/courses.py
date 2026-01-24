from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User, Course, CourseProgress
from app.schemas.schemas import CourseResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    category: str = None,
    difficulty: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all published courses"""
    query = db.query(Course).filter(Course.is_published == True)
    
    if category:
        query = query.filter(Course.category == category)
    
    if difficulty:
        query = query.filter(Course.difficulty_level == difficulty)
    
    courses = query.offset(skip).limit(limit).all()
    return courses


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    """Get specific course"""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.is_published == True
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course


@router.post("/{course_id}/enroll")
async def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enroll in a course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already enrolled
    existing = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id
    ).first()
    
    if existing:
        return {"message": "Already enrolled", "progress": existing.progress_percentage}
    
    # Create progress record
    progress = CourseProgress(
        user_id=current_user.id,
        course_id=course_id,
        completed_lessons=[],
        progress_percentage=0.0
    )
    
    db.add(progress)
    db.commit()
    
    return {"message": "Successfully enrolled", "course_id": course_id}


@router.get("/{course_id}/progress")
async def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's progress for a course"""
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="Not enrolled in this course")
    
    return {
        "course_id": course_id,
        "completed_lessons": progress.completed_lessons,
        "progress_percentage": progress.progress_percentage,
        "started_at": progress.started_at,
        "last_accessed": progress.last_accessed
    }
