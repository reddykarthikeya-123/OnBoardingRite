@echo off
echo ============================================
echo Starting OnBoardingRite Development Servers
echo ============================================
echo.

:: Start Backend (FastAPI) in new window
echo Starting Backend on http://localhost:9000...
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 9000"

:: Wait for backend to start
timeout /t 3 /nobreak > nul

:: Start Frontend (Vite) in new window
echo Starting Frontend on http://localhost:9009...
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait for frontend to start
timeout /t 3 /nobreak > nul

echo.
echo ============================================
echo Both servers are starting!
echo.
echo   Backend:  http://localhost:9000
echo   Frontend: http://localhost:9009
echo   API Docs: http://localhost:9000/docs
echo   API Test: http://localhost:9009/api-test
echo.
echo Press any key to open the frontend in your browser...
echo ============================================
pause > nul

:: Open browser
start http://localhost:9009

echo.
echo Servers are running in separate windows.
echo Close this window when done.
