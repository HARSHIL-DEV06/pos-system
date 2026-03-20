@echo off
title Smart Predict POS Server Engine
echo ==========================================
echo    SMART PREDICT POS - V3 INTELLIGENCE
echo ==========================================
echo.
echo Initializing Local Host environment...
echo Starting Python Flask Server Engine...
echo.
cd /d "%~dp0"
echo.
echo Please wait a moment for the system to boot...
echo.

:: Start the Python server in the same window
start /B python app.py

:: Wait exactly 3 seconds to ensure Flask is running
timeout /t 3 /nobreak > nul

:: Automatically launch the default web browser to the POS
echo All servers are starting!
echo Opening Smart Predict POS in your browser...
echo.
start http://localhost:5000

echo WARNING: Do not close this CMD window while using the POS!
echo To stop the system safely, press CTRL + C or close this window.
pause
