from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
from datetime import datetime
from app.models.models import UserRole, PersonaType, ContentType, FeedbackType, CollaborationStatus


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.CREATOR


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    niche: Optional[str] = None
    company_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    niche: Optional[str] = None
    platform_links: Optional[Dict] = None
    subscriber_count: Optional[int] = None
    engagement_rate: Optional[float] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str]
    bio: Optional[str]
    niche: Optional[str]
    platform_links: Optional[Dict]
    subscriber_count: Optional[int]
    company_name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Persona Schemas
class PersonaBase(BaseModel):
    name: str
    type: PersonaType
    description: Optional[str] = None
    attributes: Optional[Dict] = None


class PersonaCreate(PersonaBase):
    is_default: bool = False


class PersonaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    attributes: Optional[Dict] = None
    is_default: Optional[bool] = None


class PersonaResponse(PersonaBase):
    id: int
    user_id: int
    is_default: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Content Schemas
class ContentBase(BaseModel):
    type: ContentType
    title: Optional[str] = None


class ContentCreate(ContentBase):
    persona_id: Optional[int] = None
    prompt: str
    ai_model: str = "openai"  # openai, vertex, groq


class ContentResponse(ContentBase):
    id: int
    user_id: int
    persona_id: Optional[int]
    content_text: str
    meta_data: Optional[Dict]
    ai_model: str
    is_favorite: bool
    is_public: bool = False
    share_token: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Script Generation Schemas
class ScriptGenerationRequest(BaseModel):
    topic: str
    duration_minutes: int = Field(10, ge=1, le=60)
    persona_id: Optional[int] = None
    tone: str = "engaging"
    target_audience: Optional[str] = None
    key_points: Optional[List[str]] = None
    script_flow: Optional[str] = None  # e.g., "Hook → Problem → Solution → How it works → Results → CTA"
    style: Optional[str] = None  # e.g., "educational", "storytelling", "tutorial", "vlog-style"
    ai_model: str = "openai"


# Title Generation Schemas
class TitleGenerationRequest(BaseModel):
    video_topic: str
    keywords: Optional[List[str]] = None
    persona_id: Optional[int] = None
    count: int = Field(5, ge=1, le=20)
    optimize_ctr: bool = True
    ai_model: str = "openai"


# Thumbnail Idea Schemas
class ThumbnailIdeaRequest(BaseModel):
    video_title: str
    video_topic: str
    persona_id: Optional[int] = None
    count: int = Field(3, ge=1, le=10)
    ai_model: str = "openai"


# Social Caption Schemas
class SocialCaptionRequest(BaseModel):
    content_description: str
    platform: str = Field(..., description="youtube, instagram, twitter, tiktok, linkedin")
    persona_id: Optional[int] = None
    include_hashtags: bool = True
    include_emojis: bool = True
    ai_model: str = "openai"


# SEO Optimization Schemas
class SEOOptimizationRequest(BaseModel):
    content: str
    target_keywords: List[str]
    persona_id: Optional[int] = None
    ai_model: str = "openai"


class SEOOptimizationResponse(BaseModel):
    optimized_content: str
    meta_title: str
    meta_description: str
    suggested_keywords: List[str]
    seo_score: float


# Feedback Schemas
class FeedbackCreate(BaseModel):
    content_id: int
    type: FeedbackType
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    content_id: int
    type: FeedbackType
    rating: Optional[int]
    comment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Collaboration Schemas
class CollaborationBase(BaseModel):
    title: str
    description: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[datetime] = None
    requirements: Optional[Dict] = None


class CollaborationCreate(CollaborationBase):
    creator_id: int


class CollaborationUpdate(BaseModel):
    status: Optional[CollaborationStatus] = None
    deliverables: Optional[Dict] = None


class CollaborationResponse(CollaborationBase):
    id: int
    creator_id: int
    brand_id: int
    status: CollaborationStatus
    deliverables: Optional[Dict]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty_level: str
    category: str


class CourseCreate(CourseBase):
    content: Dict
    duration_minutes: int


class CourseResponse(CourseBase):
    id: int
    content: Dict
    duration_minutes: int
    is_published: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Generic Response
class MessageResponse(BaseModel):
    message: str
    data: Optional[Dict] = None
