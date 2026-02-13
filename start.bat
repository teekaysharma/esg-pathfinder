@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo.
echo ==================================================
echo ESG Pathfinder Windows Starter (No Docker)
echo ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not available in PATH.
  echo Install Node.js 18+ and rerun this script.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not available in PATH.
  echo Install npm and rerun this script.
  exit /b 1
)

where psql >nul 2>nul
if errorlevel 1 (
  echo [ERROR] PostgreSQL CLI (psql) is not installed or not available in PATH.
  echo Install PostgreSQL and ensure psql is on PATH.
  exit /b 1
)

echo [INFO] Detected tools:
for /f "delims=" %%i in ('node --version') do echo   Node: %%i
for /f "delims=" %%i in ('npm --version') do echo   npm: %%i
for /f "delims=" %%i in ('psql --version') do echo   psql: %%i

echo.
echo [INFO] Starting full bootstrap (env + DB provision + npm install + prisma + seed + dev server)...

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\bootstrap-local.ps1"
if errorlevel 1 (
  echo.
  echo [ERROR] Bootstrap failed. Please review errors above.
  exit /b 1
)

echo.
echo [INFO] Completed.
exit /b 0
