@echo off
echo ========================================
echo Starting VisualArt Application
echo ========================================

echo.
echo [1/3] Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js is installed

echo.
echo [2/3] Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"

echo.
echo [3/3] Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Starting frontend server...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173 (or another port)
echo.
echo If you see errors, make sure MongoDB is running!
echo ========================================
pause
