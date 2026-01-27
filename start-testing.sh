#!/bin/bash

echo "🚀 CreatorX Razorpay Testing Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null
then
    echo -e "${RED}❌ ngrok is not installed${NC}"
    echo ""
    echo "Install ngrok:"
    echo "  macOS:  brew install ngrok"
    echo "  Linux:  snap install ngrok"
    echo "  Or visit: https://ngrok.com/download"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ ngrok is installed${NC}"
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Virtual environment exists${NC}"
fi
echo ""

# Check if razorpay is installed
cd backend
source venv/bin/activate
if ! python -c "import razorpay" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Installing razorpay...${NC}"
    pip install razorpay==1.4.1
    echo -e "${GREEN}✅ razorpay installed${NC}"
else
    echo -e "${GREEN}✅ razorpay is installed${NC}"
fi
cd ..
echo ""

# Check if database migrations are done
if [ ! -f "backend/alembic/versions/*.py" ]; then
    echo -e "${YELLOW}⚠️  Running database migrations...${NC}"
    cd backend
    source venv/bin/activate
    alembic revision --autogenerate -m "Add wallet and payment models"
    alembic upgrade head
    cd ..
    echo -e "${GREEN}✅ Database migrations complete${NC}"
fi
echo ""

echo -e "${GREEN}=================================="
echo "✅ Setup Complete!"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1️⃣  Start Backend (in this terminal):"
echo "   cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "2️⃣  Start ngrok (in new terminal):"
echo "   ngrok http 8000"
echo ""
echo "3️⃣  Copy the ngrok HTTPS URL and update frontend/.env.local:"
echo "   VITE_API_BASE_URL=https://YOUR-NGROK-URL.ngrok-free.app"
echo ""
echo "4️⃣  Start Frontend (in new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "5️⃣  Configure Razorpay webhook:"
echo "   - Go to: https://dashboard.razorpay.com/app/webhooks"
echo "   - Add URL: https://YOUR-NGROK-URL.ngrok-free.app/api/v1/wallet/webhook"
echo "   - Copy webhook secret to backend/.env"
echo ""
echo "6️⃣  Open http://localhost:5173/dashboard/wallet and test!"
echo ""
echo -e "${GREEN}📖 Full guide: TEST_RAZORPAY.md${NC}"
echo ""
