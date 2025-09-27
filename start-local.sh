#!/bin/bash

# Career Study Plan - Simple Local Startup Script (Linux/Mac)
# This script starts both servers for local development

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# Cleanup function
cleanup() {
    print_status "Stopping servers..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        print_status "Backend server stopped (PID: $SERVER_PID)"
    fi
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null || true
        print_status "Frontend server stopped (PID: $CLIENT_PID)"
    fi
    print_status "Development session ended."
}

# Set up signal handlers
trap cleanup EXIT INT TERM

print_header "Career Study Plan - Local Development"
print_header "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "server/server.js" ] || [ ! -f "client/index.html" ]; then
    print_error "Please run this script from the project root directory."
    print_error "Expected: server/server.js and client/index.html"
    exit 1
fi

print_status "Project structure verified."

# Check Node.js installation
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    print_error "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check npm installation
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "npm version: $NPM_VERSION"

# Check Python installation
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PYTHON_VERSION=$(python3 --version)
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PYTHON_VERSION=$(python --version)
else
    print_error "Python is not installed. Please install Python first."
    print_error "Visit: https://python.org/"
    exit 1
fi

print_status "Python version: $PYTHON_VERSION"

# Install dependencies if needed
if [ ! -d "server/node_modules" ]; then
    print_status "Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

# Check .env file and Gemini API key
if [ ! -f "server/.env" ]; then
    print_warning "No .env file found."
    echo ""
    read -p "Do you want to create a .env file with Gemini API key? (Y/n): " CREATE_ENV
    
    if [[ ! $CREATE_ENV =~ ^[Nn]$ ]]; then
        read -p "Enter your Gemini API key (or press Enter to skip): " GEMINI_KEY
        
        if [ ! -z "$GEMINI_KEY" ]; then
            echo "GEMINI_API_KEY=$GEMINI_KEY" > server/.env
            print_status ".env file created with Gemini API key."
        else
            echo "GEMINI_API_KEY=your_api_key_here" > server/.env
            print_warning ".env file created with placeholder. AI suggestions will not work."
        fi
    else
        echo "GEMINI_API_KEY=your_api_key_here" > server/.env
        print_warning ".env file created with placeholder. AI suggestions will not work."
    fi
else
    # Check if .env has a valid Gemini API key
    if grep -q "GEMINI_API_KEY=" server/.env; then
        if grep -q "GEMINI_API_KEY=$" server/.env || grep -q "GEMINI_API_KEY=your_api_key_here" server/.env || grep -q "GEMINI_API_KEY=Your API Key" server/.env; then
            print_warning "Gemini API key appears to be empty or placeholder."
            echo ""
            read -p "Do you want to update your Gemini API key? (y/N): " UPDATE_KEY
            
            if [[ $UPDATE_KEY =~ ^[Yy]$ ]]; then
                read -p "Enter your Gemini API key: " GEMINI_KEY
                if [ ! -z "$GEMINI_KEY" ]; then
                    # Update the key in .env file
                    sed -i.bak "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$GEMINI_KEY/" server/.env
                    rm -f server/.env.bak
                    print_status "Gemini API key updated in .env file."
                else
                    print_warning "No key provided. AI suggestions will not work."
                fi
            else
                print_warning "Using placeholder key. AI suggestions will not work."
            fi
        else
            print_status "Gemini API key found in .env file."
        fi
    else
        print_warning "No Gemini API key found in .env file."
        echo ""
        read -p "Do you want to add a Gemini API key? (y/N): " ADD_KEY
        
        if [[ $ADD_KEY =~ ^[Yy]$ ]]; then
            read -p "Enter your Gemini API key: " GEMINI_KEY
            if [ ! -z "$GEMINI_KEY" ]; then
                echo "" >> server/.env
                echo "GEMINI_API_KEY=$GEMINI_KEY" >> server/.env
                print_status "Gemini API key added to .env file."
            else
                print_warning "No key provided. AI suggestions will not work."
            fi
        else
            print_warning "No Gemini API key configured. AI suggestions will not work."
        fi
    fi
fi

# Check if db.json exists, create if not
if [ ! -f "server/db.json" ]; then
    print_status "Creating initial database file..."
    cat > server/db.json << 'EOF'
{
  "plans": []
}
EOF
    print_status "Initial db.json created."
fi

# Start the backend server
print_status "Starting backend server on http://localhost:3000..."
cd server
node server.js &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    print_error "Failed to start backend server!"
    exit 1
fi

# Test server connection
print_status "Testing backend server connection..."
if curl -s --connect-timeout 5 "http://localhost:3000/api/plans" > /dev/null; then
    print_status "✓ Backend server is responding correctly"
else
    print_warning "Backend server may still be starting up..."
fi

# Start the frontend server
print_status "Starting frontend server on http://localhost:8000..."
cd client
$PYTHON_CMD -m http.server 8000 &
CLIENT_PID=$!
cd ..

# Wait a moment for client server to start
sleep 2

# Check if client server is running
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    print_error "Failed to start frontend server!"
    exit 1
fi

# Test frontend connection
print_status "Testing frontend server connection..."
if curl -s --connect-timeout 5 "http://localhost:8000" > /dev/null; then
    print_status "✓ Frontend server is responding correctly"
else
    print_warning "Frontend server may still be starting up..."
fi

# Display information
echo ""
print_header "🚀 Career Study Plan - Ready for Development!"
print_header "============================================="
echo ""
echo -e "${GREEN}Application URLs:${NC}"
echo "  📱 Frontend: http://localhost:8000"
echo "  🔧 Backend:  http://localhost:3000/api/"
echo ""
echo -e "${GREEN}Server Information:${NC}"
echo "  🖥️  Backend PID: $SERVER_PID"
echo "  🌐 Frontend PID: $CLIENT_PID"
echo ""
echo -e "${GREEN}Development Commands:${NC}"
echo "  🔄 Restart backend: kill $SERVER_PID && cd server && node server.js &"
echo "  🛑 Stop servers: Press Ctrl+C"
echo ""

# Try to open browser (works on most Linux distributions and macOS)
if command -v xdg-open &> /dev/null; then
    print_status "Opening application in browser..."
    xdg-open "http://localhost:8000" 2>/dev/null &
elif command -v open &> /dev/null; then
    print_status "Opening application in browser..."
    open "http://localhost:8000" 2>/dev/null &
else
    print_status "Please open http://localhost:8000 in your browser"
fi

echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers and exit${NC}"
echo ""

# Keep the script running and monitor servers
print_status "Monitoring servers... Press Ctrl+C to stop."

while true; do
    # Check if servers are still running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        print_error "Backend server stopped unexpectedly!"
        break
    fi
    
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        print_error "Frontend server stopped unexpectedly!"
        break
    fi
    
    sleep 5
done