@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado.
  echo Instale a versao LTS em https://nodejs.org e tente novamente.
  pause
  exit /b 1
)
start "" http://localhost:4173
node server.mjs
pause
