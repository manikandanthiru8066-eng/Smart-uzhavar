@echo off
echo Starting subsidyservice on http://localhost:8080 ...
cd /d "%~dp0backend\subsidyservice"
.\mvnw.cmd spring-boot:run
