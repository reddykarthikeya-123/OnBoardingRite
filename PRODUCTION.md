# Production Deployment Guide

Server deployment instructions for the OnBoardingRite application.

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+ & npm**
- **PostgreSQL 14+**

---

## Configuration (Single .env File)

All configuration is in **one file** at the project root: `.env`

Copy `.env.example` to `.env` and fill in your values:

```env
# Application
APP_NAME=OnBoarding App
DEBUG=False

# Database
POSTGRES_HOST=your-database-host
POSTGRES_PORT=5432
POSTGRES_DB=your-database-name
POSTGRES_USER=your-database-user
POSTGRES_PASSWORD=your-password

# Security (generate with: openssl rand -hex 32)
JWT_SECRET=your-secure-random-string

# URLs
BACKEND_URL=https://api.yourdomain.com/api/v1
FRONTEND_ORIGINS=https://yourdomain.com
```

| Variable | Used By | Purpose |
|----------|---------|---------|
| `POSTGRES_*` | Backend | Database connection |
| `JWT_SECRET` | Backend | Authentication tokens |
| `FRONTEND_ORIGINS` | Backend | CORS - which domains can call the API |
| `BACKEND_URL` | Frontend | Where to send API requests |

---

## Build & Run

### Option 1: Using Build Script

```bash
# Build frontend with correct API URL
python build_production.py

# Run backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 9000

# Run frontend (in another terminal)
cd frontend
npx serve -s dist -l 9009
```

### Option 2: Manual

```bash
# Backend
cd backend
pip install -r requirements.txt
python scripts/setup_remote_db.py  # First-time only
uvicorn app.main:app --host 0.0.0.0 --port 9000

# Frontend (set BACKEND_URL before build)
cd frontend
npm install
VITE_API_URL=https://api.yourdomain.com/api/v1 npm run build
npx serve -s dist -l 9009
```

---

## Verification

- **Frontend**: `http://<server-ip>:9009`
- **Backend API Docs**: `http://<server-ip>:9000/docs`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection fails | Verify `.env` credentials |
| CORS errors | Add frontend URL to `FRONTEND_ORIGINS` |
| API calls fail | Verify `BACKEND_URL` was set correctly during build |
