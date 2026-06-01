@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0upload.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [X] Er is een fout opgetreden tijdens de uitvoering!
    echo Druk op een toets om dit venster te sluiten...
    pause > nul
)
