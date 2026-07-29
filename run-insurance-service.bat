@echo off
echo Starting insurance-service on http://localhost:8081 ...
cd /d "%~dp0backend\insurance-service"
.\mvnw.cmd spring-boot:run
