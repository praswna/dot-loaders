@echo off
rem Serve the gallery (index.html) on localhost and open it in the browser.
rem Usage: dev.bat [port]   (default 5173)
rem ES modules do not load from file://, so a local HTTP server is required.
setlocal
cd /d "%~dp0"

set "PORT=5173"
if not "%~1"=="" set "PORT=%~1"
set "URL=http://localhost:%PORT%"

rem Open the browser after a short delay so the server is up first.
start "" /b cmd /c "ping -n 2 127.0.0.1 >nul & start "" %URL%"

echo dot-loaders gallery: %URL%
echo Press Ctrl+C to stop.
echo.

rem 1) Node.js (correct MIME types for ES modules, no caching)
where node >nul 2>nul && (
  node tools\serve.mjs %PORT%
  goto :end
)

rem 2) Python launcher (python.org installs)
where py >nul 2>nul && (
  py -3 -m http.server %PORT%
  goto :end
)

rem 3) python on PATH (the Microsoft Store alias stub fails this check and is skipped)
python -c "pass" >nul 2>nul && (
  python -m http.server %PORT%
  goto :end
)

echo Neither Python nor Node.js was found.
echo Install one of them and run again:
echo   https://www.python.org/downloads/
echo   https://nodejs.org/
pause
exit /b 1

:end
endlocal
