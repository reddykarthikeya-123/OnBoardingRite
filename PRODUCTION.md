# Production Deployment Guide - Multi-Platform Onboarding App

This guide details how to deploy the application from the provided codebase to a production environment. The application consists of a **Python FastAPI Backend** and a **React (Vite) Frontend**.

## 1. Prerequisites

Ensure the production server has the following installed:
- **Python 3.10+** (for Backend)
- **Node.js 18+ & npm** (for Frontend)
- **PostgreSQL 14+** (if not using a managed database service)

## 2. Directory Structure Setup

Extract the provided zip file. The structure should look like this:
```
/root-dir
  ├── backend/          # FastAPI application
  ├── src/              # React frontend source
  ├── package.json      # Frontend dependencies
  ├── vite.config.ts    # Frontend build config
  ├── schema_ddl.sql    # Database Schema
  └── ...
```

---

## 3. Database Setup

The application requires a PostgreSQL database.

1.  **Create a Database & User**:
    Ensure you have a database (e.g., `riteonboard`) and a user with **ownership privileges**.

2.  **Configure Connection**:
    Navigate to the `backend/` directory and create/edit the `.env` file:
    ```bash
    cd backend
    nano .env
    ```
    Populate it with your production credentials:
    ```env
    APP_NAME=OnBoarding App
    DEBUG=False
    
    # Database Configuration
    POSTGRES_HOST=129.213.36.70
    POSTGRES_PORT=5432
    POSTGRES_DB=postgres
    POSTGRES_USER=riteonboard
    POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD

    # Security (Generate a strong random string)
    JWT_SECRET=CHANGE_THIS_TO_A_VERY_LONG_RANDOM_STRING
    ```

3.  **Initialize Schema**:
    Run the included setup script to create tables and indices.
    ```bash
    # From the backend/ directory
    python scripts/setup_remote_db.py
    ```
    *Note: This script will DROP existing tables to ensure a clean slate. Run only on initial deployment.*

    If you need to patch an existing schema without dropping data, use:
    ```bash
    python scripts/patch_schema.py
    ```

---

## 4. Backend Setup (API)

1.  **Install Dependencies**:
    It is recommended to use a virtual environment.
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

    2.  **Run the Server**:
    Use `uvicorn` to run the production server. The `--port` flag allows you to configure the listening port.
    ```bash
    # Run on port 8000 (default)
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    
    # Run on custom port (e.g., 9000)
    uvicorn app.main:app --host 0.0.0.0 --port 9000
    ```
    *Recommendation: Use a process manager like **PM2** or **Systemd** to keep the backend running.*

---

## 5. Frontend Setup (UI)

1.  **Install Dependencies**:
    ```bash
    # From the root directory (where package.json is)
    npm install
    ```
    *Note: This also installs 'serve', a static file server.*

2.  **Build the Application**:
    This compiles the React code into static HTML/CSS/JS.
    ```bash
    npm run build
    ```
    The output will be created in the `dist/` directory.

3.  **Serve the Application**:
    You can serve the `dist/` folder using `npx serve`. The `-l` (listen) flag allows you to configure the port.
    
    **Option A: Using `serve` (Single Command)**
    ```bash
    # Serve on port 80 (default HTTP)
    npx serve -s dist -l 80

    # Serve on custom port (e.g., 5173 or 3000)
    npx serve -s dist -l 3000
    ```

    **Option B: Nginx (Recommended)**
    Configure Nginx to point to the `dist` folder and proxy `/api` requests to the backend.

    ```nginx
    server {
        listen 80;
        server_name your-domain.com;

        location / {
            root /path/to/app/dist;
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```

---

## 6. Linking Custom Ports (Important)

If you run services on custom ports (e.g., Backend on 9000, Frontend on 3000), you must configure them to talk to each other.

### 1- Configure Frontend to find Backend
**When building the frontend**, specify the Backend URL if it's not the default (localhost:8000).
```bash
# Example: Backend is running on port 9000
# Windows (PowerShell)
$env:VITE_API_URL="http://localhost:9000/api/v1"; npm run build

# Linux/Mac
VITE_API_URL=http://localhost:9000/api/v1 npm run build
```

### 2- Configure Backend to allow Frontend (CORS)
**Update `backend/.env`** to allow the frontend's custom port.
```env
# Add the URL where your frontend is running
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000,http://your-production-domain.com
```

---

## 7. Accessing the Application
- **Frontend**: `http://<your-server-ip>:<frontend-port>`
- **Backend API Docs**: `http://<your-server-ip>:<backend-port>/docs`

## Troubleshooting

- **Database Connection Failures**: Check `backend/.env` credentials and ensure the firewall allows traffic on port 5432.
- **Login Issues**: Ensure `JWT_SECRET` matches in `backend/.env`.
