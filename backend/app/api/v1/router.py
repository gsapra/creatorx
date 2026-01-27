from fastapi import APIRouter

api_router = APIRouter()

# Import and include sub-routers
from app.api.v1.endpoints import auth, users, personas, content, creator_tools, collaborations, courses, image_upload, wallet

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(personas.router, prefix="/personas", tags=["Personas"])
api_router.include_router(content.router, prefix="/content", tags=["Content"])
api_router.include_router(creator_tools.router, prefix="/creator-tools", tags=["Creator Tools"])
api_router.include_router(image_upload.router, prefix="/images", tags=["Image Upload"])
api_router.include_router(collaborations.router, prefix="/collaborations", tags=["Collaborations"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
