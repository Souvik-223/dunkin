# Start Spotter Full-Stack Development Environment
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Starting Spotter Full-Stack App...   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Start Backend with Uvicorn in a background process
$BackendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; uvicorn config.asgi:application --host 127.0.0.1 --port 8000 --reload" -PassThru

Write-Host "Backend starting on http://127.0.0.1:8000 (PID: $($BackendProcess.Id))" -ForegroundColor Green

# Start Frontend with Vite in a background process
$FrontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -PassThru

Write-Host "Frontend starting on http://localhost:5173 (PID: $($FrontendProcess.Id))" -ForegroundColor Green

Write-Host "`nApp is launching! Visit http://localhost:5173/ in your browser." -ForegroundColor Yellow
