# Production Deployment Guide

Server deployment instructions for the OnBoardingRite application.

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+ & npm**
- **PostgreSQL 14+**

---

## Quick Start (Single Configuration File)

### Step 1: Configure Environment

Copy `.env.example` to `.env` at the project root and fill in your values:

```env
# Database
POSTGRES_HOST=your-database-host
POSTGRES_PORT=5432
POSTGRES_DB=your-database-name
POSTGRES_USER=your-database-user
POSTGRES_PASSWORD=your-password

# Security (generate with: openssl rand -hex 32)
JWT_SECRET=your-secure-random-string

# URLs (only change if not using defaults)
BACKEND_URL=http://localhost:9000/api/v1
FRONTEND_URL=http://localhost:9009
```

> **Note:** For same-server deployment with default ports, you only need to set the database credentials and JWT_SECRET. The URL defaults will work.

### Step 2: Build

```bash
python build_production.py
```

This script:
- Reads your root `.env` file
- Auto-generates `backend/.env`
- Builds the frontend with correct API URL

### Step 3: Run

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/setup_remote_db.py  # First-time only
uvicorn app.main:app --host 0.0.0.0 --port 9000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npx serve -s dist -l 9009
```

---

## Alternative: Nginx Configuration

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

## Verification

- **Frontend**: `http://<server-ip>:9009`
- **Backend API Docs**: `http://<server-ip>:9000/docs`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection fails | Verify `.env` credentials and firewall allows port 5432 |
| CORS errors | Add frontend URL to `FRONTEND_URL` in `.env` and rebuild |
| Login fails | Ensure `JWT_SECRET` is set and consistent |
