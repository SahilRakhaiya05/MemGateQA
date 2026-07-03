# MemGateQA — start frontend + Cognee bridge together
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Creating Python venv and installing bridge deps..." -ForegroundColor Yellow
    python -m venv .venv
    .\.venv\Scripts\pip install -r server\requirements.txt
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}

# Kill stale bridge on port 8788 (old v1 server causes "Method Not Allowed")
$listening = netstat -ano | Select-String ":8788.*LISTENING"
if ($listening) {
    $procId = ($listening.ToString() -split '\s+')[-1]
    Write-Host "Stopping old bridge (PID $procId)..." -ForegroundColor Yellow
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "  MemGateQA v2" -ForegroundColor Cyan
Write-Host "  Bridge:   http://localhost:8788" -ForegroundColor Gray
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host ""

npm run dev:all