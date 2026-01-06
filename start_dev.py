"""
OnBoardingRite Development Server Launcher
Runs both Frontend (Vite) and Backend (FastAPI) servers simultaneously
"""

import subprocess
import os
import sys
import time
import webbrowser
from pathlib import Path

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT

def start_backend():
    """Start FastAPI backend server"""
    print("🚀 Starting Backend (FastAPI) on http://localhost:8000...")
    
    if sys.platform == "win32":
        return subprocess.Popen(
            ["python", "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            cwd=str(BACKEND_DIR),
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        return subprocess.Popen(
            ["python", "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            cwd=str(BACKEND_DIR)
        )

def start_frontend():
    """Start Vite frontend dev server"""
    print("🚀 Starting Frontend (Vite) on http://localhost:5173...")
    
    if sys.platform == "win32":
        return subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(FRONTEND_DIR),
            creationflags=subprocess.CREATE_NEW_CONSOLE,
            shell=True
        )
    else:
        return subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(FRONTEND_DIR)
        )

def main():
    print("=" * 50)
    print("  OnBoardingRite Development Servers")
    print("=" * 50)
    print()
    
    # Start both servers
    backend_process = start_backend()
    time.sleep(2)  # Wait for backend to initialize
    frontend_process = start_frontend()
    time.sleep(3)  # Wait for frontend to initialize
    
    print()
    print("=" * 50)
    print("  ✅ Servers Started Successfully!")
    print()
    print("  Backend:   http://localhost:8000")
    print("  Frontend:  http://localhost:5173")
    print("  API Docs:  http://localhost:8000/docs")
    print("  API Test:  http://localhost:5173/api-test")
    print()
    print("  Press Ctrl+C to stop all servers")
    print("=" * 50)
    
    # Open browser
    webbrowser.open("http://localhost:5173")
    
    try:
        # Keep running until interrupted
        while True:
            time.sleep(1)
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("⚠️  Backend server stopped")
                break
            if frontend_process.poll() is not None:
                print("⚠️  Frontend server stopped")
                break
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("✅ Servers stopped")

if __name__ == "__main__":
    main()
