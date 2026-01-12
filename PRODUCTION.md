# Production Deployment Guide

Server deployment instructions for the OnBoardingRite application (FastAPI Backend + React Frontend).

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+ & npm**
- **PostgreSQL 14+**

---

## 1. Backend Deployment

### 1.1 Configure Environment

Create `backend/.env`:
```env
APP_NAME=OnBoarding App
DEBUG=False

# Database
POSTGRES_HOST=YOUR_DATABASE_HOST
POSTGRES_PORT=5432
POSTGRES_DB=YOUR_DATABASE_NAME
POSTGRES_USER=YOUR_DATABASE_USER
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD

# Security (generate with: openssl rand -hex 32)
JWT_SECRET=YOUR_SECURE_RANDOM_STRING

# CORS - Add your production frontend URL
FRONTEND_ORIGINS=https://YOUR_PRODUCTION_DOMAIN.com
```

### 1.2 Install & Run

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Initialize database (first-time only - DROPS existing tables)
python scripts/setup_remote_db.py

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 9000
```

**Recommendation:** Use PM2 or Systemd to keep the backend running.

---

## 2. Frontend Deployment

### 2.1 Build

```bash
cd frontend
npm install

# If backend is NOT on localhost:9000, set the API URL:
# VITE_API_URL=https://api.yourdomain.com/api/v1 npm run build

npm run build
```

### 2.2 Serve

**Option A: Using serve**
```bash
npx serve -s dist -l 9009
```

**Option B: Nginx (Recommended)**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 3. Verification

- **Frontend**: `http://<server-ip>:9009` (or port 80 with Nginx)
- **Backend API Docs**: `http://<server-ip>:9000/docs`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection fails | Verify `.env` credentials and firewall allows port 5432 |
| CORS errors | Add frontend URL to `FRONTEND_ORIGINS` in `.env` |
| Login fails | Ensure `JWT_SECRET` is set and consistent |
