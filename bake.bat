@echo off
rem Bake sprite sheets (PNG + manifest json) without a browser. Needs Node.js only.
rem
rem   bake.bat                         -> every variant, enter/loop/exit, into dist\
rem   bake.bat claude-code             -> one variant
rem   bake.bat all --frame 64 --fps 30 --contact
rem
rem All arguments are passed to tools\bake.mjs as-is. Options:
rem   --phase loop^|enter^|exit^|all  --frame 48  --fps 30  --color #d97757
rem   --bg none^|#1f1e1d  --out dist  --contact
setlocal
cd /d "%~dp0"

where node >nul 2>nul || (
  echo Node.js is required: https://nodejs.org/
  if "%~1"=="" pause
  exit /b 1
)

if "%~1"=="" (
  node tools\bake.mjs all --out dist
) else (
  node tools\bake.mjs %*
)
set "RC=%ERRORLEVEL%"

if "%RC%"=="0" (
  echo.
  echo Done. Sheets are in: %CD%\dist  ^(or the --out folder you gave^)
) else (
  echo.
  echo bake failed with exit code %RC%.
)

rem Keep the window open when started by double-click (no arguments).
if "%~1"=="" pause
endlocal & exit /b %RC%
