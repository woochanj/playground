@echo off
cd /d "%~dp0"

echo.
echo === community dev server ===
echo.

echo [1/4] kill old processes on 3100, 3101...
taskkill /FI "WINDOWTITLE eq community-ws*" /T /F >nul 2>&1
call :kill_port 3100
call :kill_port 3101
timeout /t 1 /nobreak >nul

echo [2/4] PostgreSQL via Docker...
docker compose up -d
if errorlevel 1 (
  echo.
  echo Docker failed. Is Docker Desktop running?
  pause
  exit /b 1
)

echo [3/4] WebSocket server in new window...
start "community-ws" /D "%~dp0" cmd /k call "%~dp0run-ws.cmd"
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":3101 " | findstr "LISTENING" >nul
if errorlevel 1 (
  echo WARNING: port 3101 not ready. Check the community-ws window.
) else (
  echo OK: WebSocket server on port 3101
)

echo [4/4] Next.js on http://localhost:3100
echo.
echo Stop: Ctrl+C in this window, then close the WS window.
echo.

call npm run dev
goto :eof

:kill_port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%~1 " ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)
goto :eof
