# Build submission zip (includes server/, excludes secrets and deps)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Out = Join-Path $Root "MemGateQA-submission.zip"

if (Test-Path $Out) { Remove-Item $Out -Force }

$includes = @(
    "src",
    "server",
    "docs",
    "public",
    "scripts",
    "README.md",
    ".env.example",
    ".gitignore",
    "package.json",
    "package-lock.json",
    "index.html",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "start.ps1"
)

$staging = Join-Path $env:TEMP "memgateqa-submission-$(Get-Random)"
New-Item -ItemType Directory -Path $staging | Out-Null

foreach ($item in $includes) {
    $src = Join-Path $Root $item
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $staging $item) -Recurse -Force
    }
}

# Strip caches from copy
Get-ChildItem -Path $staging -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $Out -Force
Remove-Item $staging -Recurse -Force

Write-Host "Created $Out" -ForegroundColor Green
Write-Host "Includes: server/, src/, docs/ - NO .env, node_modules, or .git" -ForegroundColor Cyan