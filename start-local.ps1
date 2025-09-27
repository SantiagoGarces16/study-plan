# Career Study Plan - Simple Local Startup Script
# This script starts both servers for local development

Write-Host "Career Study Plan - Local Development" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "server\server.js") -or !(Test-Path "client\index.html")) {
    Write-Host "[ERROR] Please run this script from the project root directory." -ForegroundColor Red
    Write-Host "[ERROR] Expected: server\server.js and client\index.html" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Project structure verified." -ForegroundColor Green

# Install dependencies if needed
if (!(Test-Path "server\node_modules")) {
    Write-Host "[INFO] Installing server dependencies..." -ForegroundColor Green
    Push-Location "server"
    npm install
    Pop-Location
}

# Check .env file and Gemini API key
if (!(Test-Path "server\.env")) {
    Write-Host "[WARNING] No .env file found." -ForegroundColor Yellow
    Write-Host ""
    $createEnv = Read-Host "Do you want to create a .env file with Gemini API key? (Y/n)"
    
    if ($createEnv -ne "n" -and $createEnv -ne "N") {
        $geminiKey = Read-Host "Enter your Gemini API key (or press Enter to skip)"
        
        if ($geminiKey) {
            "GEMINI_API_KEY=$geminiKey" | Out-File -FilePath "server\.env" -Encoding UTF8
            Write-Host "[INFO] .env file created with Gemini API key." -ForegroundColor Green
        } else {
            "GEMINI_API_KEY=your_api_key_here" | Out-File -FilePath "server\.env" -Encoding UTF8
            Write-Host "[INFO] .env file created with placeholder. AI suggestions will not work." -ForegroundColor Yellow
        }
    } else {
        "GEMINI_API_KEY=your_api_key_here" | Out-File -FilePath "server\.env" -Encoding UTF8
        Write-Host "[WARNING] .env file created with placeholder. AI suggestions will not work." -ForegroundColor Yellow
    }
} else {
    # Check if .env has a valid Gemini API key
    $envContent = Get-Content "server\.env" -Raw -ErrorAction SilentlyContinue
    if ($envContent -match "GEMINI_API_KEY=") {
        if ($envContent -match "GEMINI_API_KEY=\s*$" -or $envContent -match "GEMINI_API_KEY=your_api_key_here" -or $envContent -match "GEMINI_API_KEY=Your API Key") {
            Write-Host "[WARNING] Gemini API key appears to be empty or placeholder." -ForegroundColor Yellow
            Write-Host ""
            $updateKey = Read-Host "Do you want to update your Gemini API key? (y/N)"
            
            if ($updateKey -eq "y" -or $updateKey -eq "Y") {
                $geminiKey = Read-Host "Enter your Gemini API key"
                if ($geminiKey) {
                    $envContent = $envContent -replace "GEMINI_API_KEY=.*", "GEMINI_API_KEY=$geminiKey"
                    $envContent | Out-File -FilePath "server\.env" -Encoding UTF8 -NoNewline
                    Write-Host "[INFO] Gemini API key updated in .env file." -ForegroundColor Green
                } else {
                    Write-Host "[WARNING] No key provided. AI suggestions will not work." -ForegroundColor Yellow
                }
            } else {
                Write-Host "[WARNING] Using placeholder key. AI suggestions will not work." -ForegroundColor Yellow
            }
        } else {
            Write-Host "[INFO] Gemini API key found in .env file." -ForegroundColor Green
        }
    } else {
        Write-Host "[WARNING] No Gemini API key found in .env file." -ForegroundColor Yellow
        Write-Host ""
        $addKey = Read-Host "Do you want to add a Gemini API key? (y/N)"
        
        if ($addKey -eq "y" -or $addKey -eq "Y") {
            $geminiKey = Read-Host "Enter your Gemini API key"
            if ($geminiKey) {
                "`nGEMINI_API_KEY=$geminiKey" | Add-Content -Path "server\.env"
                Write-Host "[INFO] Gemini API key added to .env file." -ForegroundColor Green
            } else {
                Write-Host "[WARNING] No key provided. AI suggestions will not work." -ForegroundColor Yellow
            }
        } else {
            Write-Host "[WARNING] No Gemini API key configured. AI suggestions will not work." -ForegroundColor Yellow
        }
    }
}

# Start backend server
Write-Host "[INFO] Starting backend server on http://localhost:3000..." -ForegroundColor Green
Push-Location "server"
$serverJob = Start-Job -ScriptBlock { node server.js }
Pop-Location

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "[INFO] Starting frontend server on http://localhost:8000..." -ForegroundColor Green
Push-Location "client"
$clientJob = Start-Job -ScriptBlock { python -m http.server 8000 }
Pop-Location

# Wait a moment for client server to start
Start-Sleep -Seconds 2

# Test connections
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/plans" -TimeoutSec 5 -UseBasicParsing
    Write-Host "[SUCCESS] Backend server is responding!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Backend server may still be starting..." -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "[SUCCESS] Frontend server is responding!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Frontend server may still be starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Career Study Plan - Ready for Development!" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend: http://localhost:8000" -ForegroundColor White
Write-Host "🔧 Backend:  http://localhost:3000/api/" -ForegroundColor White
Write-Host ""
Write-Host "Opening application in browser..." -ForegroundColor Green
Start-Process "http://localhost:8000"

Write-Host ""
Write-Host "To stop the servers:" -ForegroundColor Yellow
Write-Host "  Get-Job | Stop-Job" -ForegroundColor White
Write-Host "  Get-Job | Remove-Job" -ForegroundColor White
Write-Host ""
Write-Host "To view server logs:" -ForegroundColor Yellow
Write-Host "  Receive-Job -Id $($serverJob.Id) -Keep  # Backend logs" -ForegroundColor White
Write-Host "  Receive-Job -Id $($clientJob.Id) -Keep  # Frontend logs" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to stop servers and exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
Write-Host ""
Write-Host "[INFO] Stopping servers..." -ForegroundColor Green
Get-Job | Stop-Job
Get-Job | Remove-Job

Write-Host "[INFO] Development session ended." -ForegroundColor Green