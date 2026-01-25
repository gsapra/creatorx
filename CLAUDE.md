# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CreatorX is a comprehensive platform for content creators with AI-powered content generation tools and brand collaboration features. The system uses a FastAPI backend with PostgreSQL database and a React 18 TypeScript frontend with TailwindCSS.

## Development Commands

### Backend (FastAPI)

```bash
# Start backend development server
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run backend tests
cd backend
pytest

# Run tests with coverage
pytest --cov=app tests/

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Frontend (React + Vite)

```bash
# Start frontend development server
cd frontend
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Docker

```bash
# Start all services (recommended for development)
docker-compose up -d

# Start with logs
docker-compose up

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Architecture

### Backend Structure

**API Routing**: FastAPI uses a versioned API structure at `/api/v1/` with the following endpoints:
- `/auth` - Authentication (login, signup, token refresh)
- `/users` - User management
- `/personas` - Persona CRUD operations
- `/content` - Content retrieval and management
- `/creator-tools` - AI content generation endpoints (scripts, titles, thumbnails, social captions, SEO)
- `/collaborations` - Brand-creator collaboration management
- `/courses` - Learning courses system

All routes are registered in `backend/app/api/v1/router.py` and included in `main.py` with the `/api/v1` prefix.

**AI Service Layer**: The `AIService` class in `backend/app/services/ai_service.py` provides a unified interface for multiple AI providers:
- **OpenAI GPT-4**: Primary model using `gpt-4-turbo-preview`
- **Google Vertex AI**: Enterprise AI using `gemini-pro`
- **Groq**: Fast open-source LLM inference using `mixtral-8x7b-32768`

The service supports model switching via the `model` parameter ("openai", "vertex", or "groq") and provides persona context injection to customize AI outputs based on user-defined personas.

**Creator Tools Service**: Located in `backend/app/services/creator_tools_service.py`, this handles all AI content generation logic:
- Script generation with duration awareness and regeneration support
- Title generation with CTR optimization
- Thumbnail idea generation
- Multi-platform social media caption generation
- SEO content optimization

Each tool supports persona injection to customize outputs for specific audience types or brand voices.

**Database Models**: SQLAlchemy models in `backend/app/models/models.py` include:
- `User`: Supports both creator and brand roles with role-specific fields (niche, subscriber_count, company_name, industry)
- `Persona`: Flexible persona system using JSON attributes for audience, script, brand_voice, and character types
- `Content`: Stores generated content with metadata, AI model tracking, and prompt history
- `Feedback`: User feedback for reinforcement learning
- `Collaboration`: Creator-brand partnership management
- `Course`: Learning content system

**Authentication**: JWT-based authentication using `python-jose` in `backend/app/core/security.py`. Access tokens expire in 30 minutes by default.

**Configuration**: All settings centralized in `backend/app/core/config.py` using Pydantic settings. Environment variables loaded from `.env` file.

### Frontend Structure

**State Management**:
- **React Query** (`@tanstack/react-query`): Server state management for API data fetching, caching, and synchronization
- **Zustand**: Global client state management
- **Context API**: `PersonaContext` provides persona selection across the application

**Routing**: React Router v6 with route structure:
- `/` - Landing page
- `/login`, `/signup` - Authentication
- `/dashboard` - Main creator dashboard
- `/dashboard/script` - Script generator
- `/dashboard/titles` - Title generator
- `/dashboard/thumbnails` - Thumbnail ideas
- `/dashboard/social` - Social media captions
- `/dashboard/seo` - SEO optimizer
- `/dashboard/personas` - Persona management
- `/dashboard/marketplace` - Brand connections
- `/dashboard/courses` - Learning courses
- `/shared/:shareToken` - Public script sharing

**Form Handling**: React Hook Form with Zod validation for type-safe form schemas.

**Styling**: TailwindCSS utility-first styling with Lucide React icons.

**PWA Support**: Progressive Web App capabilities via `vite-plugin-pwa` with service worker for offline support.

### Database Architecture

**PostgreSQL** (port 5433 in development): Primary relational database storing users, personas, content, collaborations, courses, and feedback.

**ClickHouse** (ports 8123, 9000): Commented out in docker-compose but designed for vector embeddings storage and reinforcement learning data. When enabled, used for AI/ML optimization.

**Redis** (port 6379): Commented out but designed for caching and session management. Also serves as Celery broker for async task processing.

## AI Pipeline Flow

1. User creates or selects a persona (audience/script/brand_voice/character type)
2. User initiates content generation via creator tools endpoint
3. Persona context is injected into the AI prompt via `AIService.inject_persona_context()`
4. Content is generated using the selected AI model (default: Vertex AI)
5. Generated content is saved to database with metadata tracking (model used, prompt, generation time)
6. User can provide feedback for regeneration, which is passed back to the AI
7. Feedback data is stored for future reinforcement learning

## Environment Variables

### Backend `.env` (required)

```
DATABASE_URL=postgresql://creatorx:creatorx_password@postgres:5432/creatorx
CLICKHOUSE_URL=http://localhost:8123
REDIS_URL=redis://localhost:6379

OPENAI_API_KEY=your_openai_key
GOOGLE_VERTEX_PROJECT_ID=your_project_id
GOOGLE_VERTEX_LOCATION=us-central1
GROQ_API_KEY=your_groq_key

JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend `.env`

```
VITE_API_BASE_URL=http://localhost:8000
```

## Important Development Notes

- PostgreSQL runs on port **5433** (not standard 5432) to avoid conflicts
- Frontend production build serves on ports 80 and 443 with SSL certificate support via Let's Encrypt volume mount
- CORS is configured for multiple origins including localhost and production domains (minimalthreads.in)
- Database tables are auto-created on startup via SQLAlchemy `Base.metadata.create_all()` in `main.py`
- The codebase includes commented-out Celery worker, Redis, and ClickHouse services in docker-compose for future async processing and vector storage capabilities
- API documentation available at `http://localhost:8000/docs` (Swagger) and `/redoc` (ReDoc)

## Content Generation Features

All creator tools support:
- **Persona injection**: Customize outputs based on selected persona
- **Model selection**: Choose between OpenAI, Vertex AI, or Groq
- **Regeneration**: Provide feedback to refine outputs
- **Version tracking**: Metadata includes generation timestamps and model used
- **Content history**: All generated content saved with prompts for analysis

## Testing

Backend uses pytest with async support (`pytest-asyncio`) and coverage reporting (`pytest-cov`). Test files should be placed in `backend/tests/`.

Frontend testing infrastructure is set up but specific test commands depend on the test runner configuration.
