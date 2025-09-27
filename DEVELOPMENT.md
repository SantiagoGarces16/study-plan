# Development Guide

This guide helps you set up and test the Career Study Plan application locally on your development machine.

## 🚀 Quick Start

### Automated Setup (Recommended)

**Linux/Mac:**
```bash
chmod +x start-local.sh
./start-local.sh
```

**Windows:**
```powershell
.\start-local.ps1
```

### Manual Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

2. **Configure Environment**
   ```bash
   cd server
   # Create .env file with your Gemini API key
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   cd ..
   ```

3. **Start Backend Server**
   ```bash
   cd server
   node server.js
   # Server runs on http://localhost:3000
   ```

4. **Start Frontend Server** (in new terminal)
   ```bash
   cd client
   python -m http.server 8000
   # or: npm start
   # Frontend runs on http://localhost:8000
   ```

## 📋 Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.6 or higher) - [Download](https://python.org/)
- **Git** - [Download](https://git-scm.com/)
- **Gemini API Key** (optional) - [Get one here](https://aistudio.google.com/)

## 🔧 Development Environment

### Project Structure
```
career-study-plan/
├── client/                 # Frontend application
│   ├── app.js             # Main Vue.js application
│   ├── index.html         # HTML entry point
│   ├── styles.css         # Application styles
│   └── package.json       # Client configuration
├── server/                # Backend application
│   ├── server.js          # Express server
│   ├── db.json           # JSON database
│   ├── .env              # Environment variables
│   └── package.json      # Server dependencies
├── start-local.sh        # Linux/Mac development script
├── start-local.ps1       # Windows development script
└── DEVELOPMENT.md        # This file
```

### Environment Variables

Create `server/.env` with:
```bash
# Required for AI suggestions (optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Database

The application uses a simple JSON file (`server/db.json`) for data storage:
```json
{
  "plans": [
    {
      "id": 1234567890,
      "name": "My Career Plan",
      "userId": "username",
      "topics": [],
      "milestones": [],
      "notes": ""
    }
  ]
}
```

## 🧪 Testing Features

### Manual Testing Checklist

1. **User Authentication**
   - [ ] Register new user
   - [ ] Login with existing user
   - [ ] User session persistence
   - [ ] Logout functionality

2. **Plan Management**
   - [ ] Create new plan
   - [ ] Edit plan name (click to edit)
   - [ ] Delete plan
   - [ ] Switch between plans

3. **Milestone Management**
   - [ ] Add milestone with date and color
   - [ ] Edit milestone details
   - [ ] Delete milestone
   - [ ] Expand/collapse milestone

4. **Topic Management**
   - [ ] Add topic to milestone
   - [ ] Add unassigned topic
   - [ ] Mark topic as completed
   - [ ] Edit topic details
   - [ ] Delete topic

5. **Calendar Integration**
   - [ ] View milestones on calendar
   - [ ] View topics on calendar
   - [ ] Navigate calendar months
   - [ ] Color coding works

6. **Progress Tracking**
   - [ ] Progress bars update
   - [ ] Progress circle updates
   - [ ] Upcoming topics list
   - [ ] Completed topics list

7. **AI Suggestions** (if API key configured)
   - [ ] Generate suggestions for milestone
   - [ ] Add suggested topics
   - [ ] Handle API errors gracefully

8. **Theme and Settings**
   - [ ] Switch between light/dark theme
   - [ ] Theme persistence
   - [ ] Profile picture upload
   - [ ] Settings modal

9. **Notepad**
   - [ ] Add notes to plan
   - [ ] Notes auto-save
   - [ ] Notes persistence

### API Testing

Test API endpoints directly:
```bash
# Get all plans
curl http://localhost:3000/api/plans

# Create a plan
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Plan", "userId": "testuser"}'

# Get plan topics
curl http://localhost:3000/api/plans/1234567890/topics

# Test AI suggestions (if API key configured)
curl -X POST http://localhost:3000/api/suggestions \
  -H "Content-Type: application/json" \
  -d '{"milestone": "Learn JavaScript"}'
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports 3000 and 8000
   # Linux/Mac:
   lsof -ti:3000 | xargs kill -9
   lsof -ti:8000 | xargs kill -9
   
   # Windows:
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Node Modules Issues**
   ```bash
   cd server
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Database Issues**
   ```bash
   # Reset database
   cd server
   rm db.json
   # Restart server to create new db.json
   ```

4. **Environment Variables**
   ```bash
   # Check .env file exists and has correct format
   cd server
   cat .env
   # Should show: GEMINI_API_KEY=your_key_here
   ```

### Debug Mode

Enable debug logging by modifying `server/server.js`:
```javascript
// Add at the top
const debug = true;

// Add logging middleware
app.use((req, res, next) => {
    if (debug) console.log(`${req.method} ${req.path}`);
    next();
});
```

### Browser Developer Tools

1. Open browser DevTools (F12)
2. Check Console for JavaScript errors
3. Check Network tab for API request failures
4. Check Application tab for localStorage data

## 🔄 Development Workflow

### Making Changes

1. **Frontend Changes**
   - Edit files in `client/`
   - Refresh browser to see changes
   - No build step required

2. **Backend Changes**
   - Edit files in `server/`
   - Restart server: `Ctrl+C` then `node server.js`
   - Test API endpoints

3. **Database Changes**
   - Edit `server/db.json` directly
   - Or use API endpoints to modify data
   - Restart server if structure changes

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test locally
./test-local.sh

# Commit changes
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Deploy to AWS (after merge)
./deploy-to-aws.sh
```

## 📚 Additional Resources

- [Vue.js 3 Documentation](https://vuejs.org/)
- [Express.js Documentation](https://expressjs.com/)
- [FullCalendar Documentation](https://fullcalendar.io/)
- [Gemini API Documentation](https://ai.google.dev/)

## 🆘 Getting Help

If you encounter issues:

1. Check this development guide
2. Review browser console for errors
3. Check server logs for backend issues
4. Verify all prerequisites are installed
5. Try the automated testing scripts first