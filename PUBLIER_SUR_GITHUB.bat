@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Publication GitHub - Eclats Sauvages Valdora
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0PUBLIER_SUR_GITHUB.ps1"
echo.
pause
