from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
from datetime import datetime
from app.models.models import UserRole, PersonaType, ContentType, FeedbackType, CollaborationStatus, TransactionType, TransactionStatus, PayoutStatus


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


class RefreshTokenRequest(BaseModel):
    refresh_token: str


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
    # Regeneration fields
    regenerate_feedback: Optional[str] = None
    previous_script: Optional[str] = None
    parent_content_id: Optional[str] = None
    version_number: Optional[int] = None


# Title Generation Schemas
class TitleGenerationRequest(BaseModel):
    video_topic: str
    keywords: Optional[List[str]] = None
    persona_id: Optional[int] = None
    count: int = Field(5, ge=1, le=20)
    optimize_ctr: bool = True
    ai_model: str = "openai"


# Thumbnail Generation Schemas
class ThumbnailLayer(BaseModel):
    """Individual layer in a thumbnail (text, image, shape, etc.)"""
    id: str
    type: str  # 'text', 'image', 'shape', 'background'
    x: float
    y: float
    width: float
    height: float
    rotation: Optional[float] = 0
    opacity: Optional[float] = 1.0
    z_index: Optional[int] = 0

    # Text-specific properties
    text: Optional[str] = None
    font_family: Optional[str] = None
    font_size: Optional[int] = None
    font_weight: Optional[str] = None
    color: Optional[str] = None
    text_align: Optional[str] = None
    stroke_color: Optional[str] = None
    stroke_width: Optional[int] = None
    shadow_color: Optional[str] = None
    shadow_blur: Optional[int] = None
    shadow_offset_x: Optional[int] = None
    shadow_offset_y: Optional[int] = None

    # Image-specific properties
    image_url: Optional[str] = None
    image_data: Optional[str] = None  # base64 encoded
    fit: Optional[str] = None  # 'cover', 'contain', 'fill'

    # Shape-specific properties
    shape_type: Optional[str] = None  # 'rectangle', 'circle', 'arrow', 'highlight'
    fill_color: Optional[str] = None
    border_color: Optional[str] = None
    border_width: Optional[int] = None
    border_radius: Optional[int] = None

    class Config:
        extra = "allow"  # Allow extra fields from AI


class ThumbnailTemplate(BaseModel):
    """Complete thumbnail template with all layers"""
    id: str
    name: str
    description: str
    style: str  # 'modern', 'bold', 'minimalist', 'dramatic', 'gaming', 'vlog'
    canvas_width: Optional[int] = 1280
    canvas_height: Optional[int] = 720
    layers: List[ThumbnailLayer]
    psychology_notes: Optional[str] = None
    tags: Optional[List[str]] = None

    # Advanced Analytics
    ctr_score: Optional[float] = None  # Predicted CTR score 0-100
    ctr_factors: Optional[Dict] = None  # Breakdown of what affects CTR
    emotion_target: Optional[str] = None  # Target emotion for this design
    mobile_optimized: Optional[bool] = True  # Whether design is mobile-friendly

    class Config:
        extra = "allow"  # Allow extra fields from AI


class ThumbnailIdeaRequest(BaseModel):
    thumbnail_prompt: str  # Combined field for thumbnail description
    persona_id: Optional[int] = None
    count: int = Field(3, ge=1, le=10)
    ai_model: str = "openai"
    image_model: str = "gpt-image-1.5"  # Image generation model: 'gpt-image-1.5', 'dall-e-3', 'imagen-3.0-generate-001'

    # Style & Mood
    style: Optional[str] = None  # 'modern', 'bold', 'minimalist', 'dramatic', 'gaming', 'vlog'
    emotion: Optional[str] = None  # 'shocking', 'curious', 'exciting', 'inspiring', 'educational', 'entertaining'

    # Visual Elements
    include_face: Optional[bool] = True  # Whether to include face/person placeholder
    face_expression: Optional[str] = None  # 'shocked', 'happy', 'serious', 'curious', 'excited'
    color_scheme: Optional[str] = None  # 'vibrant', 'pastel', 'dark', 'neon', 'monochrome', 'complementary'
    use_gradient: Optional[bool] = False  # Use gradient backgrounds

    # Text Options
    font_style: Optional[str] = None  # 'bold', 'clean', 'handwritten', 'modern', 'retro'
    text_emphasis: Optional[str] = None  # 'number', 'question', 'statement', 'call-to-action'
    include_emoji: Optional[bool] = False  # Include emoji in text

    # Composition
    layout_preference: Optional[str] = None  # 'centered', 'split', 'rule-of-thirds', 'asymmetric'
    text_position: Optional[str] = None  # 'top', 'center', 'bottom', 'side'

    # Advanced
    target_platform: Optional[str] = 'youtube'  # 'youtube', 'instagram', 'tiktok', 'twitter'
    optimize_for_mobile: Optional[bool] = True  # Ensure mobile readability
    include_arrow: Optional[bool] = False  # Include pointing arrow
    include_circle: Optional[bool] = False  # Include attention circle

    # User Assets (for GPT-Image 1.5 only)
    custom_image_url: Optional[str] = None  # User-uploaded image URL
    custom_images: Optional[List[Dict]] = None  # Multiple uploaded images with base64 data: [{"id": str, "base64_data": str}]
    reference_images: Optional[List[Dict]] = None  # Reference images for AI to analyze style
    brand_colors: Optional[List[str]] = None  # Array of hex colors for brand consistency
    use_uploaded_image: Optional[bool] = False  # Use uploaded image as background/element

    # Refinement
    refinement_feedback: Optional[str] = None  # User feedback for refining existing thumbnail
    previous_prompt: Optional[str] = None  # Previous DALL-E prompt for reference


class ThumbnailGenerationResponse(BaseModel):
    """Response containing generated thumbnail templates"""
    templates: List[ThumbnailTemplate]


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


# Wallet Schemas
class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: float
    currency: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TopupRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR")
    currency: str = "INR"


class TopupOrderResponse(BaseModel):
    order_id: str
    amount: float
    currency: str
    razorpay_key_id: str


class PaymentVerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class TransactionResponse(BaseModel):
    id: int
    wallet_id: int
    type: str
    amount: float
    status: str
    currency: str
    description: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    meta_data: Optional[Dict] = None

    class Config:
        from_attributes = True


class PayoutRequestSchema(BaseModel):
    amount: float = Field(..., gt=0, description="Withdrawal amount")
    bank_account_number: str = Field(..., min_length=9, max_length=18)
    bank_ifsc_code: str = Field(..., pattern=r'^[A-Z]{4}0[A-Z0-9]{6}$')
    bank_account_name: str
    bank_name: Optional[str] = None


class PayoutRequestResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    currency: str
    status: str
    bank_account_number: str  # Masked in response
    bank_ifsc_code: str
    bank_account_name: str
    processing_fee: float
    net_amount: float
    created_at: datetime

    class Config:
        from_attributes = True


# Generic Response
class MessageResponse(BaseModel):
    message: str
    data: Optional[Dict] = None
