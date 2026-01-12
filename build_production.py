"""
OnBoardingRite Production Build Script
Reads from root .env and builds both frontend and backend
"""

import os
import subprocess
import sys
from pathlib import Path

# Get project directories
PROJECT_ROOT = Path(__file__).parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
ROOT_ENV = PROJECT_ROOT / ".env"

def load_env():
    """Load environment variables from root .env file"""
    env_vars = {}
    if ROOT_ENV.exists():
        with open(ROOT_ENV) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

def create_backend_env(env_vars):
    """Create backend/.env from root .env"""
    backend_env = BACKEND_DIR / ".env"
    
    # Map root env vars to backend format
    backend_content = f"""APP_NAME={env_vars.get('APP_NAME', 'OnBoarding App')}
DEBUG={env_vars.get('DEBUG', 'False')}

POSTGRES_HOST={env_vars.get('POSTGRES_HOST', 'localhost')}
POSTGRES_PORT={env_vars.get('POSTGRES_PORT', '5432')}
POSTGRES_DB={env_vars.get('POSTGRES_DB', 'postgres')}
POSTGRES_USER={env_vars.get('POSTGRES_USER', 'postgres')}
POSTGRES_PASSWORD={env_vars.get('POSTGRES_PASSWORD', '')}

JWT_SECRET={env_vars.get('JWT_SECRET', 'change-me')}

FRONTEND_ORIGINS={env_vars.get('FRONTEND_URL', 'http://localhost:9009')}
"""
    
    with open(backend_env, 'w') as f:
        f.write(backend_content)
    
    print(f"✅ Created {backend_env}")

def build_frontend(env_vars):
    """Build frontend with correct API URL"""
    api_url = env_vars.get('BACKEND_URL', 'http://localhost:9000/api/v1')
    
    print(f"🔨 Building frontend (API URL: {api_url})...")
    
    # Set VITE_API_URL and run build
    build_env = os.environ.copy()
    build_env['VITE_API_URL'] = api_url
    
    result = subprocess.run(
        ['npm', 'run', 'build'],
        cwd=str(FRONTEND_DIR),
        env=build_env,
        shell=True
    )
    
    if result.returncode == 0:
        print("✅ Frontend build complete")
    else:
        print("❌ Frontend build failed")
        sys.exit(1)

def main():
    print("=" * 50)
    print("  OnBoardingRite Production Build")
    print("=" * 50)
    print()
    
    # Check for root .env
    if not ROOT_ENV.exists():
        print(f"❌ Error: {ROOT_ENV} not found")
        print("   Copy .env.example to .env and configure it first")
        sys.exit(1)
    
    # Load environment
    print("📖 Loading configuration from .env...")
    env_vars = load_env()
    
    # Create backend .env
    print("📝 Generating backend/.env...")
    create_backend_env(env_vars)
    
    # Build frontend
    build_frontend(env_vars)
    
    print()
    print("=" * 50)
    print("  ✅ Build Complete!")
    print()
    print("  Next steps:")
    print("  1. cd backend && uvicorn app.main:app --host 0.0.0.0 --port 9000")
    print("  2. cd frontend && npx serve -s dist -l 9009")
    print("=" * 50)

if __name__ == "__main__":
    main()
