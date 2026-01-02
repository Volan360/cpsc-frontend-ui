# CPSC Frontend - Local Development Script
# This script helps you quickly start the frontend development server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CPSC Frontend - Local Development" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 20.x or higher from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green

# Check if npm is installed
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm is not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm installed: v$npmVersion" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Dependencies not installed. Installing now..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
    Write-Host ""
}

# Display backend connection info
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend API Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "The frontend expects the backend API at:" -ForegroundColor White
Write-Host "  http://localhost:8080/api" -ForegroundColor Yellow
Write-Host ""
Write-Host "Make sure the backend is running before testing authentication!" -ForegroundColor Yellow
Write-Host "To start the backend, run:" -ForegroundColor White
Write-Host "  cd ..\cpsc-backend-api" -ForegroundColor Cyan
Write-Host "  .\gradlew.bat bootRun" -ForegroundColor Cyan
Write-Host ""

# Start the development server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "The application will be available at:" -ForegroundColor White
Write-Host "  http://localhost:4200" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm start
