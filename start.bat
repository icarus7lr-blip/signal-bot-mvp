@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
    echo Docker no esta instalado o no esta en PATH.
    echo Instala Docker Desktop y vuelve a ejecutar este archivo.
    pause
    exit /b 1
)

call :RunDockerUp

where npm >nul 2>nul
if errorlevel 1 (
    echo Node.js / npm no esta instalado o no esta en PATH.
    echo Instala Node.js LTS y vuelve a ejecutar este archivo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

start "Signal Bot" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ==============================================
echo  Signal Bot levantado.
echo  Abre: http://localhost:5173
 echo  API: http://localhost:3001/api/health
 echo  Si quieres apagar los servicios, usa Ctrl+C en la terminal del proyecto.
echo ==============================================
echo.
pause
exit /b 0

:RunDockerUp
where docker-compose >nul 2>nul
if not errorlevel 1 (
    echo Levantando PostgreSQL y Redis con docker-compose...
    docker-compose up -d postgres redis
    exit /b 0
)

docker compose version >nul 2>nul
if not errorlevel 1 (
    echo Levantando PostgreSQL y Redis con docker compose...
    docker compose up -d postgres redis
    exit /b 0
)

echo Docker Compose no esta disponible.
echo Asegurate de que Docker Desktop est^e funcionando y que el plugin compose este instalado.
pause
exit /b 1
