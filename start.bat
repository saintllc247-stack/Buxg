@echo off
chcp 65001 >nul
title Бухгалтерия - Онлайн учёт
echo ============================================
echo   Бухгалтерия - Онлайн учёт
echo ============================================
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не найден!
    echo Установите Python 3.9+ с https://www.python.org/downloads/
    echo Не забудьте отметить "Add Python to PATH" при установке.
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден!
    echo Установите Node.js 18+ с https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Устанавливаем зависимости Python...
cd /d "%~dp0backend"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Ошибка при установке Python зависимостей
    pause
    exit /b %errorlevel%
)

echo [2/3] Устанавливаем зависимости Node.js...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo Ошибка при установке Node.js зависимостей
    pause
    exit /b %errorlevel%
)

echo [3/3] Запуск серверов...
echo.

start "Backend" cmd /c "cd /d "%~dp0backend" && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo   Бэкенд:       http://localhost:8000
echo   Фронтенд:     http://localhost:5173
echo   API док-ция:  http://localhost:8000/docs
echo ============================================
echo   Нажмите любую клавишу для остановки...
echo ============================================
pause >nul

echo Останавливаем серверы...
taskkill /f /fi "windowtitle eq Backend*" >nul 2>&1
taskkill /f /fi "windowtitle eq Frontend*" >nul 2>&1
echo Готово.
