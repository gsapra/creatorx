from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    CREATOR = "creator"
    BRAND = "brand"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.CREATOR)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String)
    bio = Column(Text)
    
    # Creator-specific fields
    niche = Column(String)  # Gaming, Tech, Lifestyle, etc.
    platform_links = Column(JSON)  # {"youtube": "url", "instagram": "url"}
    subscriber_count = Column(Integer, default=0)
    engagement_rate = Column(Float)
    
    # Brand-specific fields
    company_name = Column(String)
    industry = Column(String)
    budget_range = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    personas = relationship("Persona", back_populates="user", cascade="all, delete-orphan")
    content = relationship("Content", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    collaborations = relationship("Collaboration", foreign_keys="Collaboration.creator_id", back_populates="creator")
    brand_collaborations = relationship("Collaboration", foreign_keys="Collaboration.brand_id", back_populates="brand")
    wallet = relationship("Wallet", back_populates="user", uselist=False)


class PersonaType(str, enum.Enum):
    AUDIENCE = "audience"
    SCRIPT = "script"
    BRAND_VOICE = "brand_voice"
    CHARACTER = "character"


class Persona(Base):
    __tablename__ = "personas"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(Enum(PersonaType), nullable=False)
    description = Column(Text)
    
    # Persona attributes (stored as JSON for flexibility)
    attributes = Column(JSON)  # Age, interests, tone, style, etc.
    
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="personas")
    content = relationship("Content", back_populates="persona")


class ContentType(str, enum.Enum):
    SCRIPT = "script"
    TITLE = "title"
    THUMBNAIL_IDEA = "thumbnail_idea"
    SOCIAL_CAPTION = "social_caption"
    SEO_CONTENT = "seo_content"
    COURSE_CONTENT = "course_content"


class Content(Base):
    __tablename__ = "content"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    persona_id = Column(Integer, ForeignKey("personas.id"))
    type = Column(Enum(ContentType), nullable=False)
    title = Column(String)
    content_text = Column(Text, nullable=False)
    meta_data = Column(JSON)  # CTR score, SEO keywords, platform, etc.
    
    # AI generation details
    ai_model = Column(String)  # openai, vertex, groq
    prompt_used = Column(Text)
    generation_time = Column(Float)
    
    is_favorite = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)  # For sharing
    share_token = Column(String, unique=True, index=True)  # Unique share link token
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="content")
    persona = relationship("Persona", back_populates="content")
    feedback = relationship("Feedback", back_populates="content", cascade="all, delete-orphan")


class FeedbackType(str, enum.Enum):
    LIKE = "like"
    DISLIKE = "dislike"
    RATING = "rating"
    COMMENT = "comment"


class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("content.id"), nullable=False)
    type = Column(Enum(FeedbackType), nullable=False)
    rating = Column(Integer)  # 1-5 for rating type
    comment = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="feedback")
    content = relationship("Content", back_populates="feedback")


class CollaborationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"


class Collaboration(Base):
    __tablename__ = "collaborations"
    
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text)
    budget = Column(Float)
    deadline = Column(DateTime(timezone=True))
    status = Column(Enum(CollaborationStatus), default=CollaborationStatus.PENDING)
    
    requirements = Column(JSON)  # Deliverables, platforms, etc.
    deliverables = Column(JSON)  # Links to completed content
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[creator_id], back_populates="collaborations")
    brand = relationship("User", foreign_keys=[brand_id], back_populates="brand_collaborations")


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    difficulty_level = Column(String)  # Beginner, Intermediate, Advanced
    category = Column(String)  # Video editing, Scripting, SEO, etc.
    
    content = Column(JSON)  # Array of lessons with text, videos, quizzes
    duration_minutes = Column(Integer)
    
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CourseProgress(Base):
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    completed_lessons = Column(JSON)  # Array of lesson IDs
    progress_percentage = Column(Float, default=0.0)

    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_accessed = Column(DateTime(timezone=True), onupdate=func.now())


class TransactionType(str, enum.Enum):
    TOPUP = "topup"
    PAYOUT = "payout"
    COLLABORATION_PAYMENT = "collaboration_payment"
    COLLABORATION_EARNING = "collaboration_earning"
    REFUND = "refund"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PayoutStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REJECTED = "rejected"


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    balance = Column(Float, default=0.0, nullable=False)
    currency = Column(String, default="INR", nullable=False)

    # Lock version for optimistic locking
    version = Column(Integer, default=1, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    currency = Column(String, default="INR")

    # Razorpay specific fields
    razorpay_order_id = Column(String, unique=True, index=True)
    razorpay_payment_id = Column(String, unique=True, index=True)
    razorpay_signature = Column(String)

    # For payout transactions
    razorpay_payout_id = Column(String, unique=True, index=True)

    # Additional metadata
    description = Column(Text)
    meta_data = Column(JSON)  # Store additional context (platform, device, etc.)

    # Related entities
    collaboration_id = Column(Integer, ForeignKey("collaborations.id"))
    payout_request_id = Column(Integer, ForeignKey("payout_requests.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")
    collaboration = relationship("Collaboration")
    payout_request = relationship("PayoutRequest", back_populates="transaction")


class PayoutRequest(Base):
    __tablename__ = "payout_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING)

    # Bank account details (encrypted in production)
    bank_account_number = Column(String, nullable=False)
    bank_ifsc_code = Column(String, nullable=False)
    bank_account_name = Column(String, nullable=False)
    bank_name = Column(String)

    # Admin review
    admin_notes = Column(Text)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))

    # Processing details
    processing_fee = Column(Float, default=0.0)
    net_amount = Column(Float)  # Amount after fees

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    transaction = relationship("Transaction", back_populates="payout_request", uselist=False)
