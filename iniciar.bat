@echo off
chcp 65001 >nul
title RedTec - Sistema de Gestion de Inventario y Prestamos
color 0B

:: Posicionarse siempre en la carpeta del proyecto
cd /d "%~dp0"

echo =====================================================================
echo           BIENVENIDO A REDTEC - SISTEMA COMUNITARIO
echo =====================================================================
echo.

:: 1. Verificar si existe el archivo .env
if not exist ".env" (
    echo [!] No se encontro el archivo .env.
    echo [*] Creando .env a partir de .env.example...
    copy .env.example .env >nul
    echo [OK] Archivo .env generado exitosamente.
) else (
    echo [OK] Archivo de configuracion .env detectado.
)

:: 2. Verificar dependencias node_modules
if not exist "node_modules" (
    echo.
    echo [*] Instalando dependencias necesarias (npm install)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Fallo al instalar dependencias. Revisa tu conexion o Node.js.
        pause
        exit /b 1
    )
)

echo.
echo =====================================================================
echo   SELECCIONA UNA OPCION:
echo =====================================================================
echo   [1] Iniciar Servidor y Abrir Web en el Navegador (Recomendado)
echo   [2] Reiniciar Base de Datos (Migraciones + Datos de Prueba)
echo   [3] Ejecutar Pruebas Automatizadas de Integracion (Tests)
echo   [4] Solo Iniciar Servidor (Modo Desarrollo)
echo   [0] Salir
echo =====================================================================
echo.
set /p opcion="Ingresa tu opcion (por defecto 1): "

if "%opcion%"=="" set opcion=1

if "%opcion%"=="1" goto start_and_open
if "%opcion%"=="2" goto reset_db
if "%opcion%"=="3" goto run_tests
if "%opcion%"=="4" goto start_only
if "%opcion%"=="0" exit /b 0

echo Opcion no valida. Iniciando por defecto...
goto start_and_open

:start_and_open
echo.
echo [*] Abriendo la aplicacion en tu navegador...
start http://localhost:3000/index.html
echo [*] Iniciando el servidor RedTec con nodemon (Ctrl+C para detener)...
echo.
call npm run dev
pause
exit /b 0

:reset_db
echo.
echo [*] Ejecutando reinicio de Base de Datos (db:reset)...
call npm run db:reset
echo.
echo [OK] Base de datos migrada y poblada con exito.
echo.
pause
goto start_and_open

:run_tests
echo.
echo [*] Ejecutando suite de pruebas de integracion...
call npm test
echo.
pause
exit /b 0

:start_only
echo.
echo [*] Iniciando servidor sin abrir navegador...
call npm run dev
pause
exit /b 0
