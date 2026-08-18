@echo off
REM ============================================
REM Smart Uzhavar - Start All Services
REM ============================================

echo Starting subsidy-service (port 8080)...
start "Subsidy Service" cmd /k "cd backend\subsidyservice && mvnw.cmd spring-boot:run"

timeout /t 5 /nobreak >nul

echo Starting insurance-service (port 8081)...
start "Insurance Service" cmd /k "cd backend\insurance-service && mvnw.cmd spring-boot:run"

timeout /t 5 /nobreak >nul

echo Starting frontend (port 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo All three services are starting in separate windows.
echo Wait ~30-60 seconds, then open:
echo   http://localhost:5173
echo.
echo To stop everything, close each of the 3 windows
echo or press Ctrl+C inside each one.
echo ============================================
pause
