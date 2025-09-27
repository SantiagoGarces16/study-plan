@echo off
setlocal enabledelayedexpansion

REM Career Study Plan - Application Update Script (Windows)
REM This script updates the deployed application to the latest version from GitHub

echo Career Study Plan - Application Update Script
echo ==============================================
echo.

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] AWS CLI is not installed. Please install it first.
    pause
    exit /b 1
)

REM Check if AWS CLI is configured
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo [ERROR] AWS CLI is not configured. Please run 'aws configure' first.
    pause
    exit /b 1
)

REM Get stack information
set STACK_NAME=career-study-plan

echo [INFO] Getting EC2 instance information...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name !STACK_NAME! --query "Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue" --output text 2^>nul') do set PUBLIC_IP=%%i

if "!PUBLIC_IP!"=="" (
    echo [ERROR] Could not find stack '!STACK_NAME!' or get public IP.
    echo [ERROR] Make sure the stack is deployed and you have the correct permissions.
    pause
    exit /b 1
)

echo [INFO] Found instance with IP: !PUBLIC_IP!
echo.

REM Get key pair name from user
set /p KEY_PAIR_NAME="Enter your EC2 Key Pair name: "
if "!KEY_PAIR_NAME!"=="" (
    echo [ERROR] Key pair name is required.
    pause
    exit /b 1
)

REM Check if key file exists
if not exist "!KEY_PAIR_NAME!.pem" (
    echo [WARNING] Key file '!KEY_PAIR_NAME!.pem' not found in current directory.
    set /p KEY_FILE_PATH="Enter full path to your key file: "
    if not exist "!KEY_FILE_PATH!" (
        echo [ERROR] Key file not found: !KEY_FILE_PATH!
        pause
        exit /b 1
    )
    set KEY_PAIR_NAME=!KEY_FILE_PATH!
) else (
    set KEY_PAIR_NAME=!KEY_PAIR_NAME!.pem
)

echo [INFO] Updating application on EC2 instance...
echo.

REM Create temporary script for remote execution
echo echo "Starting application update..." > temp_update.sh
echo cd /opt/career-study-plan >> temp_update.sh
echo echo "Current git status:" >> temp_update.sh
echo git status --porcelain >> temp_update.sh
echo BACKUP_DIR="/tmp/career-study-plan-backup-$(date +%%Y%%m%%d-%%H%%M%%S)" >> temp_update.sh
echo echo "Creating backup at: $BACKUP_DIR" >> temp_update.sh
echo cp -r /opt/career-study-plan "$BACKUP_DIR" >> temp_update.sh
echo echo "Pulling latest changes from GitHub..." >> temp_update.sh
echo sudo git fetch origin >> temp_update.sh
echo sudo git reset --hard origin/main >> temp_update.sh
echo cd server >> temp_update.sh
echo echo "Checking for dependency updates..." >> temp_update.sh
echo if sudo npm outdated; then >> temp_update.sh
echo     echo "Updating dependencies..." >> temp_update.sh
echo     sudo npm install >> temp_update.sh
echo else >> temp_update.sh
echo     echo "Dependencies are up to date." >> temp_update.sh
echo fi >> temp_update.sh
echo echo "Restarting application..." >> temp_update.sh
echo pm2 restart career-plan-server >> temp_update.sh
echo sleep 5 >> temp_update.sh
echo echo "Application status:" >> temp_update.sh
echo pm2 status career-plan-server >> temp_update.sh
echo echo "Update completed successfully!" >> temp_update.sh
echo echo "Backup created at: $BACKUP_DIR" >> temp_update.sh

REM Upload and execute the script
scp -i "!KEY_PAIR_NAME!" -o StrictHostKeyChecking=no temp_update.sh ec2-user@!PUBLIC_IP!:/tmp/
ssh -i "!KEY_PAIR_NAME!" -o StrictHostKeyChecking=no ec2-user@!PUBLIC_IP! "chmod +x /tmp/temp_update.sh && /tmp/temp_update.sh && rm /tmp/temp_update.sh"

if errorlevel 1 (
    echo.
    echo [ERROR] Update failed. Please check the error messages above.
    echo.
    echo To troubleshoot:
    echo   1. SSH to your server: ssh -i !KEY_PAIR_NAME! ec2-user@!PUBLIC_IP!
    echo   2. Check application status: pm2 status
    echo   3. Check logs: pm2 logs career-plan-server
    echo   4. Manual update: cd /opt/career-study-plan ^&^& sudo git pull
) else (
    echo.
    echo [INFO] Application updated successfully!
    echo.
    echo Your application is now running the latest version from GitHub.
    echo   Application URL: http://!PUBLIC_IP!/
    echo   API URL: http://!PUBLIC_IP!/api/
    echo.
    echo To verify the update:
    echo   1. Visit your application at http://!PUBLIC_IP!/
    echo   2. Check logs: ssh -i !KEY_PAIR_NAME! ec2-user@!PUBLIC_IP! 'pm2 logs career-plan-server'
)

REM Cleanup
del temp_update.sh 2>nul

echo.
echo [INFO] Update script completed!
echo.
pause