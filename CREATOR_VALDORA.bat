@echo off
setlocal
set "GAME=%~dp0game\CREATEUR.html"
if not exist "%GAME%" (
  echo Fichier createur introuvable : %GAME%
  pause
  exit /b 1
)
start "" "%GAME%"
exit /b 0
