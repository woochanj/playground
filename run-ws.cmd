@echo off
cd /d "%~dp0"
echo WebSocket server starting on port 3101...
call npm run ws
echo.
echo WebSocket server stopped.
pause
