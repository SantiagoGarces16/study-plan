#!/bin/bash

# Career Study Plan - Application Update Script
# This script updates the deployed application to the latest version from GitHub

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}Career Study Plan - Application Update Script${NC}"
echo "=============================================="

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

# Get stack information
STACK_NAME="career-study-plan"

print_status "Getting EC2 instance information..."
PUBLIC_IP=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
    --output text 2>/dev/null)

if [ -z "$PUBLIC_IP" ]; then
    print_error "Could not find stack '$STACK_NAME' or get public IP."
    print_error "Make sure the stack is deployed and you have the correct permissions."
    exit 1
fi

print_status "Found instance with IP: $PUBLIC_IP"

# Get key pair name from user
read -p "Enter your EC2 Key Pair name: " KEY_PAIR_NAME
if [ -z "$KEY_PAIR_NAME" ]; then
    print_error "Key pair name is required."
    exit 1
fi

# Check if key file exists
if [ ! -f "$KEY_PAIR_NAME.pem" ]; then
    print_warning "Key file '$KEY_PAIR_NAME.pem' not found in current directory."
    read -p "Enter full path to your key file: " KEY_FILE_PATH
    if [ ! -f "$KEY_FILE_PATH" ]; then
        print_error "Key file not found: $KEY_FILE_PATH"
        exit 1
    fi
    KEY_PAIR_NAME="$KEY_FILE_PATH"
else
    KEY_PAIR_NAME="$KEY_PAIR_NAME.pem"
fi

print_status "Updating application on EC2 instance..."

# Update application on server
ssh -i "$KEY_PAIR_NAME" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP << 'EOF'
    echo "Starting application update..."
    
    # Navigate to application directory
    cd /opt/career-study-plan
    
    # Check current status
    echo "Current git status:"
    git status --porcelain
    
    # Backup current version (just in case)
    BACKUP_DIR="/tmp/career-study-plan-backup-$(date +%Y%m%d-%H%M%S)"
    echo "Creating backup at: $BACKUP_DIR"
    cp -r /opt/career-study-plan "$BACKUP_DIR"
    
    # Pull latest changes
    echo "Pulling latest changes from GitHub..."
    sudo git fetch origin
    sudo git reset --hard origin/main
    
    # Check if server dependencies need updating
    cd server
    echo "Checking for dependency updates..."
    if sudo npm outdated; then
        echo "Updating dependencies..."
        sudo npm install
    else
        echo "Dependencies are up to date."
    fi
    
    # Restart the application
    echo "Restarting application..."
    pm2 restart career-plan-server
    
    # Wait a moment for restart
    sleep 5
    
    # Check application status
    echo "Application status:"
    pm2 status career-plan-server
    
    echo "Update completed successfully!"
    echo "Backup created at: $BACKUP_DIR"
EOF

if [ $? -eq 0 ]; then
    print_status "Application updated successfully!"
    echo ""
    echo "Your application is now running the latest version from GitHub."
    echo "  Application URL: http://$PUBLIC_IP/"
    echo "  API URL: http://$PUBLIC_IP/api/"
    echo ""
    echo "To verify the update:"
    echo "  1. Visit your application at http://$PUBLIC_IP/"
    echo "  2. Check logs: ssh -i $KEY_PAIR_NAME ec2-user@$PUBLIC_IP 'pm2 logs career-plan-server'"
else
    print_error "Update failed. Please check the error messages above."
    echo ""
    echo "To troubleshoot:"
    echo "  1. SSH to your server: ssh -i $KEY_PAIR_NAME ec2-user@$PUBLIC_IP"
    echo "  2. Check application status: pm2 status"
    echo "  3. Check logs: pm2 logs career-plan-server"
    echo "  4. Manual update: cd /opt/career-study-plan && sudo git pull"
fi

echo ""
print_status "Update script completed!"