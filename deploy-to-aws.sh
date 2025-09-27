#!/bin/bash

# Career Study Plan - AWS Deployment Script
# This script helps deploy the application to AWS EC2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="career-study-plan"
TEMPLATE_FILE="cloudformation-template.yaml"

echo -e "${BLUE}Career Study Plan - AWS Deployment Script${NC}"
echo "=========================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "AWS CLI is configured and ready."

# Get parameters from user
echo ""
echo "Please provide the following information:"

read -p "Enter your EC2 Key Pair name: " KEY_PAIR_NAME
if [ -z "$KEY_PAIR_NAME" ]; then
    print_error "Key pair name is required."
    exit 1
fi

read -p "Enter your Gemini API key (optional, press Enter to skip): " GEMINI_API_KEY

read -p "Enter instance type (default: t3.micro): " INSTANCE_TYPE
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.micro}

# Check if CloudFormation template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    print_error "CloudFormation template '$TEMPLATE_FILE' not found."
    exit 1
fi

# Deploy CloudFormation stack
echo ""
print_status "Deploying CloudFormation stack..."

PARAMETERS="ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR_NAME"
PARAMETERS="$PARAMETERS ParameterKey=InstanceType,ParameterValue=$INSTANCE_TYPE"

if [ ! -z "$GEMINI_API_KEY" ]; then
    PARAMETERS="$PARAMETERS ParameterKey=GeminiApiKey,ParameterValue=$GEMINI_API_KEY"
fi

# Check if stack already exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME &> /dev/null; then
    print_warning "Stack '$STACK_NAME' already exists. Updating..."
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters $PARAMETERS \
        --capabilities CAPABILITY_IAM
    
    print_status "Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete --stack-name $STACK_NAME
else
    print_status "Creating new stack '$STACK_NAME'..."
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters $PARAMETERS \
        --capabilities CAPABILITY_IAM
    
    print_status "Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME
fi

# Get stack outputs
print_status "Getting stack information..."
PUBLIC_IP=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
    --output text)

PUBLIC_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`PublicDNS`].OutputValue' \
    --output text)

if [ -z "$PUBLIC_IP" ]; then
    print_error "Failed to get public IP from stack outputs."
    exit 1
fi

print_status "Stack deployed successfully!"
echo ""
echo "Instance Information:"
echo "  Public IP: $PUBLIC_IP"
echo "  Public DNS: $PUBLIC_DNS"
echo "  SSH Command: ssh -i $KEY_PAIR_NAME.pem ec2-user@$PUBLIC_IP"
echo ""

print_status "Application deployment is automated via GitHub!"
echo ""
echo "The CloudFormation template automatically:"
echo "  ✓ Clones repository: https://github.com/SantiagoGarces16/study-plan"
echo "  ✓ Installs Node.js dependencies"
echo "  ✓ Configures environment variables"
echo "  ✓ Starts application with PM2"
echo "  ✓ Sets up Nginx reverse proxy"
echo ""

# Wait for deployment to complete
print_status "Waiting for application deployment to complete..."
echo "This may take 2-3 minutes..."

# Wait for the instance to be ready and application to start
sleep 180

# Check if application is running
print_status "Verifying deployment..."
if curl -s --connect-timeout 10 "http://$PUBLIC_IP/" > /dev/null; then
    echo -e "${GREEN}🎉 Deployment successful! Your application is live!${NC}"
else
    print_warning "Application may still be starting up. Please wait a few more minutes."
fi

echo ""
echo -e "${GREEN}🚀 Your Career Study Plan application is ready!${NC}"
echo "  Application URL: http://$PUBLIC_IP/"
echo "  API URL: http://$PUBLIC_IP/api/"
echo "  Repository: https://github.com/SantiagoGarces16/study-plan"
echo ""
echo "You can now:"
echo "  1. Visit your application at http://$PUBLIC_IP/"
echo "  2. SSH to your server: ssh -i $KEY_PAIR_NAME.pem ec2-user@$PUBLIC_IP"
echo "  3. Monitor logs: ssh to server and run 'pm2 logs career-plan-server'"
echo "  4. Update app: ssh to server, 'cd /opt/career-study-plan && sudo git pull'"

echo ""
print_status "Deployment script completed!"