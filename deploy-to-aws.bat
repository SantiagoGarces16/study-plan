@echo off
setlocal enabledelayedexpansion

REM Career Study Plan - AWS Deployment Script (Windows)
REM This script helps deploy the application to AWS EC2

echo Career Study Plan - AWS Deployment Script
echo ==========================================
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

echo [INFO] AWS CLI is configured and ready.
echo.

REM Get parameters from user
set /p KEY_PAIR_NAME="Enter your EC2 Key Pair name: "
if "!KEY_PAIR_NAME!"=="" (
    echo [ERROR] Key pair name is required.
    pause
    exit /b 1
)

set /p GEMINI_API_KEY="Enter your Gemini API key (optional, press Enter to skip): "

set /p INSTANCE_TYPE="Enter instance type (default: t3.micro): "
if "!INSTANCE_TYPE!"=="" set INSTANCE_TYPE=t3.micro

REM Check if CloudFormation template exists
if not exist "cloudformation-template.yaml" (
    echo [ERROR] CloudFormation template 'cloudformation-template.yaml' not found.
    pause
    exit /b 1
)

echo.
echo [INFO] Deploying CloudFormation stack...

REM Build parameters
set PARAMETERS=ParameterKey=KeyPairName,ParameterValue=!KEY_PAIR_NAME! ParameterKey=InstanceType,ParameterValue=!INSTANCE_TYPE!
if not "!GEMINI_API_KEY!"=="" (
    set PARAMETERS=!PARAMETERS! ParameterKey=GeminiApiKey,ParameterValue=!GEMINI_API_KEY!
)

REM Check if stack exists
aws cloudformation describe-stacks --stack-name career-study-plan >nul 2>&1
if errorlevel 1 (
    echo [INFO] Creating new stack 'career-study-plan'...
    aws cloudformation create-stack --stack-name career-study-plan --template-body file://cloudformation-template.yaml --parameters !PARAMETERS! --capabilities CAPABILITY_IAM
    if errorlevel 1 (
        echo [ERROR] Failed to create stack.
        pause
        exit /b 1
    )
    echo [INFO] Waiting for stack creation to complete...
    aws cloudformation wait stack-create-complete --stack-name career-study-plan
) else (
    echo [WARNING] Stack 'career-study-plan' already exists. Updating...
    aws cloudformation update-stack --stack-name career-study-plan --template-body file://cloudformation-template.yaml --parameters !PARAMETERS! --capabilities CAPABILITY_IAM
    if errorlevel 1 (
        echo [WARNING] No updates to perform or update failed.
    ) else (
        echo [INFO] Waiting for stack update to complete...
        aws cloudformation wait stack-update-complete --stack-name career-study-plan
    )
)

REM Get stack outputs
echo [INFO] Getting stack information...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name career-study-plan --query "Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue" --output text') do set PUBLIC_IP=%%i
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name career-study-plan --query "Stacks[0].Outputs[?OutputKey==`PublicDNS`].OutputValue" --output text') do set PUBLIC_DNS=%%i

if "!PUBLIC_IP!"=="" (
    echo [ERROR] Failed to get public IP from stack outputs.
    pause
    exit /b 1
)

echo [INFO] Stack deployed successfully!
echo.
echo Instance Information:
echo   Public IP: !PUBLIC_IP!
echo   Public DNS: !PUBLIC_DNS!
echo   SSH Command: ssh -i !KEY_PAIR_NAME!.pem ec2-user@!PUBLIC_IP!
echo.

echo [INFO] Application deployment is automated via GitHub!
echo.
echo The CloudFormation template automatically:
echo   * Clones repository: https://github.com/SantiagoGarces16/study-plan
echo   * Installs Node.js dependencies
echo   * Configures environment variables
echo   * Starts application with PM2
echo   * Sets up Nginx reverse proxy
echo.

echo [INFO] Waiting for application deployment to complete...
echo This may take 2-3 minutes...
timeout /t 180 /nobreak >nul

echo [INFO] Verifying deployment...
curl -s --connect-timeout 10 "http://!PUBLIC_IP!/" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Application may still be starting up. Please wait a few more minutes.
) else (
    echo [SUCCESS] Deployment successful! Your application is live!
)

echo.
echo ========================================
echo YOUR APPLICATION IS READY!
echo ========================================
echo.
echo   Application URL: http://!PUBLIC_IP!/
echo   API URL: http://!PUBLIC_IP!/api/
echo   Repository: https://github.com/SantiagoGarces16/study-plan
echo.
echo You can now:
echo   1. Visit your application at http://!PUBLIC_IP!/
echo   2. SSH to your server: ssh -i !KEY_PAIR_NAME!.pem ec2-user@!PUBLIC_IP!
echo   3. Monitor logs: ssh to server and run 'pm2 logs career-plan-server'
echo   4. Update app: ssh to server, 'cd /opt/career-study-plan && sudo git pull'
echo.

:end

echo.
echo [INFO] Deployment script completed!
echo.
pause