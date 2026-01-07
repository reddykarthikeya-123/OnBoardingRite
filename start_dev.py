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

# Ports used by the dev servers
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

def kill_process_on_port(port):
    """Kill any process using the specified port (Windows only)"""
    if sys.platform != "win32":
        return
    
    try:
        # Find process using the port
        result = subprocess.run(
            ["netstat", "-ano", "-p", "TCP"],
            capture_output=True,
            text=True,
            shell=True
        )
        
        for line in result.stdout.split('\n'):
            if f":{port}" in line and "LISTENING" in line:
                parts = line.split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    if pid.isdigit():
                        print(f"⚠️  Killing process {pid} on port {port}...")
                        subprocess.run(
                            ["taskkill", "/F", "/PID", pid],
                            capture_output=True,
                            shell=True
                        )
                        time.sleep(0.5)
    except Exception as e:
        print(f"Warning: Could not check port {port}: {e}")

def cleanup_ports():
    """Kill any processes using the required ports"""
    print("🔍 Checking for processes on required ports...")
    kill_process_on_port(BACKEND_PORT)
    kill_process_on_port(FRONTEND_PORT)
    print("✅ Ports cleared")

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
    
    # Kill any existing processes on required ports
    cleanup_ports()
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
