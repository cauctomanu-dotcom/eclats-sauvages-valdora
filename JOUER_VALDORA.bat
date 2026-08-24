@echo off
setlocal
set "GAME=%~dp0game\index.html"
if not exist "%GAME%" (
  echo Fichier du jeu introuvable : %GAME%
  pause
  exit /b 1
)
start "" "%GAME%"
exit /b 0
