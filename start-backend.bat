@echo off
REM Navigate to backend directory
cd /d "%~dp0backend"

REM Start the backend server
echo Starting backend server...
npm start

REM If the server fails to start, show an error
if errorlevel 1 (
    echo Failed to start backend server
    pause
)
