"""
OnBoardingRite Production Build Script
Reads BACKEND_URL from root .env and builds frontend with it.
Backend reads from root .env directly (no generation needed).
"""

import os
import subprocess
import sys
import shutil
from pathlib import Path

# Get project directories
PROJECT_ROOT = Path(__file__).parent.absolute()
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

def build_frontend(env_vars):
    """Build frontend with correct API URL from .env"""
    api_url = env_vars.get('BACKEND_URL', 'http://localhost:9000/api/v1')
    
    # Clean old dist folder
    dist_path = FRONTEND_DIR / "dist"
    if dist_path.exists():
        print("🧹 Cleaning old dist folder...")
        shutil.rmtree(dist_path)
    
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
        print(f"   Output: {dist_path}")
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
    
    # Build frontend
    build_frontend(env_vars)
    
    print()
    print("=" * 50)
    print("  ✅ Build Complete!")
    print()
    print("  To run:")
    print("  1. cd backend && uvicorn app.main:app --host 0.0.0.0 --port 9000")
    print("  2. cd frontend && npx serve -s dist -l 9009")
    print("=" * 50)

if __name__ == "__main__":
    main()
