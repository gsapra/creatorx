# CreatorX - The Ultimate Creator Platform

A comprehensive platform for content creators to manage their entire content creation journey with AI-powered tools and brand collaboration features.

## 🚀 Features

### For Creators
- **AI-Powered Script Writing** - Generate scripts with customizable personas
- **Thumbnail Generation** - AI-assisted thumbnail ideas and design
- **Title Optimization** - CTR-optimized title generation
- **SEO Optimization** - Content optimization for search engines
- **Social Media Captions** - Multi-platform caption generation
- **Persona Management** - Create and reuse audience/script personas
- **Learning Courses** - AI-powered courses for new creators
- **Brand Connections** - Connect with brands and agencies

### For Brands/Agencies
- **Creator Discovery** - Find creators matching your criteria
- **Data-Driven Matching** - AI-powered creator recommendations
- **Campaign Management** - Manage influencer campaigns
- **Analytics Dashboard** - Track campaign performance

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **PostgreSQL** - Primary relational database
- **ClickHouse** - Vector database for AI/ML optimization
- **Redis** - Caching and session management
- **Celery** - Asynchronous task processing

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **React Query** - Data fetching and state management
- **Zustand** - Global state management

### AI/ML
- **OpenAI GPT-4** - Advanced language models
- **Google Vertex AI** - Enterprise AI capabilities
- **Groq** - Fast open-source LLM inference
- **Vector Storage** - ClickHouse for embeddings and RL

## 📁 Project Structure

```
CreatorX/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── core/      # Core configurations
│   │   ├── models/    # Database models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── utils/     # Utility functions
│   ├── tests/         # Backend tests
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
└── docker-compose.yml # Docker orchestration
```

## 🚦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- ClickHouse 23+
- Docker & Docker Compose

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd CreatorX
```

2. **Set up environment variables**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your configuration
```

3. **Start with Docker (Recommended)**
```bash
docker-compose up -d
```

4. **Or run manually**

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🔑 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/creatorx
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

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
```

## 🏗️ Architecture

### System Design
- **Microservices-ready** - Modular architecture for easy scaling
- **Event-driven** - Async processing for heavy AI operations
- **Caching layer** - Redis for performance optimization
- **Vector storage** - ClickHouse for embeddings and RL data

### AI Pipeline
1. User creates/selects persona
2. Persona context injected into prompts
3. Multi-model AI generation (OpenAI/Vertex/Groq)
4. Result generated and shown to user
5. User feedback collected
6. Embeddings stored in ClickHouse
7. RL system learns from feedback

## 📊 Database Schema

### Core Tables
- `users` - User accounts (creators/brands)
- `personas` - Creator personas (audience/script)
- `content` - Generated content (scripts, titles, etc.)
- `brands` - Brand/agency profiles
- `collaborations` - Creator-brand connections
- `courses` - Learning content
- `feedback` - User feedback for RL
- `vectors` - Embeddings in ClickHouse

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Docker Production Build
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 📈 Roadmap

- [ ] Core creator tools (MVP)
- [ ] Brand marketplace
- [ ] Learning courses system
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Plugin marketplace
- [ ] API for third-party integrations

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 📧 Contact

For questions or support, contact us at support@creatorx.com
