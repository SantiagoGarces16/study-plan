# AGENTS.md

## Project Overview

This is a **Career Study Plan** application - a Vue.js + Node.js web application for managing career development plans, milestones, and study topics.

### Architecture
- **Frontend**: Vue.js 3 single-page application with Composition API
- **Backend**: Node.js/Express REST API
- **Database**: JSON file storage (server/db.json) - no external database required
- **Authentication**: Local storage-based user system
- **Styling**: Custom CSS with Cloudscape Design System inspiration and light/dark theme support

### Key Features
- Multi-plan career management with user authentication
- Milestone and topic organization with drag-and-drop support
- Interactive calendar view with FullCalendar integration
- Progress tracking with visual progress bars and circles
- Notepad functionality for plan notes
- AI-powered topic suggestions using Gemini API (optional)
- Responsive design with persistent theme switching
- Color-coded organization for better visual management

## Build and Test Commands

### Server (Backend)
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start development server
npm start
# or
node server.js

# Server runs on http://localhost:3000
```

### Client (Frontend)
```bash
# Navigate to client directory
cd client

# No dependencies to install - all loaded via CDN
# (Vue.js, FullCalendar, Sortable.js)

# Start local development server using npm script
npm start
# This runs: python -m http.server 8000

# Or manually start HTTP server:
python -m http.server 8000
# Then visit http://localhost:8000

# Or simply open client/index.html in browser for basic testing
```

### Full Application
```bash
# Option 1: Use provided batch files (Windows)
start-app.bat                    # Starts both server and client
start-frontend-server.bat        # Starts only frontend

# Option 2: Manual startup
# Terminal 1: Start backend server
cd server && npm start

# Terminal 2: Start frontend server
cd client && npm start
# Visit http://localhost:8000

# Option 3: Development mode
# Terminal 1: Backend
cd server && npm start

# Terminal 2: Frontend (from project root)
python -m http.server 8000
# Visit http://localhost:8000/client/index.html
```

## Code Style Guidelines

### JavaScript/Vue.js
- Use modern ES6+ syntax
- Follow Vue 3 Composition API patterns
- Use `const` and `let` instead of `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Follow camelCase for variables and functions
- Use PascalCase for component names

### CSS
- Follow BEM methodology where applicable
- Use CSS custom properties for theming
- Maintain consistent spacing and indentation
- Use semantic class names
- Follow Cloudscape Design System patterns

### API Design
- RESTful endpoint naming conventions
- JSON request/response format
- Proper HTTP status codes
- Consistent error handling
- Use plural nouns for resource endpoints

## Testing Instructions

### Manual Testing
1. **User Authentication**:
   - Register new users
   - Login with existing credentials
   - Test user session persistence
   - Verify user data isolation

2. **Plan Management**:
   - Create new plans
   - Edit plan names (click to edit)
   - Delete plans
   - Verify plan data persistence per user
   - Test plan switching

3. **Milestone Management**:
   - Add milestones with dates and colors
   - Edit milestone details via modal
   - Delete milestones
   - Expand/collapse milestone topics
   - Test milestone progress bars

4. **Topic Management**:
   - Add topics to milestones or as unassigned
   - Mark topics as completed/uncompleted
   - Edit topic details via modal
   - Delete topics
   - Test drag-and-drop functionality

5. **Calendar Integration**:
   - Verify milestones and topics appear on calendar
   - Test calendar navigation (month/week/day views)
   - Check color-coding matches milestone/topic colors
   - Test calendar event interactions

6. **Progress Tracking**:
   - Verify progress bars update when topics completed
   - Test progress circle calculations
   - Check upcoming/completed topic lists
   - Verify progress persistence

7. **AI Suggestions** (if API key configured):
   - Test suggestion generation for milestones
   - Verify suggestion modal functionality
   - Test adding suggested topics

8. **Theme and Settings**:
   - Test light/dark theme switching
   - Verify theme persistence across sessions
   - Test profile picture upload/reset
   - Test settings modal functionality

9. **Notepad**:
   - Test notepad functionality per plan
   - Verify notes persistence
   - Test notes auto-save on blur

### API Testing
```bash
# Test API endpoints with curl
curl http://localhost:3000/api/plans
curl -X POST http://localhost:3000/api/plans -H "Content-Type: application/json" -d '{"name": "Test Plan"}'
```

## Security Considerations

### Environment Variables
- Store sensitive data in `.env` files
- Never commit `.env` files to version control
- Use `.env.example` as template for required variables

### API Security
- Implement proper CORS configuration
- Validate input data on all endpoints
- Use proper error handling to avoid information leakage
- Consider rate limiting for API endpoints

### Frontend Security
- Sanitize user inputs
- Use HTTPS in production
- Implement proper authentication if needed
- Validate data before sending to API

## Development Workflow

### Git Workflow
- Use feature branches for development
- Follow conventional commit messages
- Test changes before committing
- Use descriptive branch names

### Code Review
- Ensure code follows established patterns
- Test functionality thoroughly
- Check for security vulnerabilities
- Verify responsive design works

## Deployment Instructions

### Local Development
1. Clone the repository
2. Install server dependencies: `cd server && npm install`
3. Configure environment: Create `server/.env` with `GEMINI_API_KEY=your_key` (optional)
4. Start the server: `cd server && npm start`
5. Start the frontend: `cd client && npm start` or use `start-app.bat`
6. Access the application at `http://localhost:8000`

### Environment Setup
```bash
# server/.env file (optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Production Deployment
1. Set up Node.js environment
2. Configure environment variables
3. Build and optimize frontend assets
4. Set up reverse proxy (nginx/Apache)
5. Configure SSL certificate
6. Set up process manager (PM2)

## Troubleshooting

### Common Issues
- **CORS errors**: Check server CORS configuration and ensure server is running
- **API connection failed**: Ensure server is running on port 3000
- **Calendar not loading**: Check FullCalendar CDN availability and internet connection
- **Data not persisting**: Verify file permissions on `server/db.json`
- **User authentication not working**: Check browser localStorage - clearing browser data resets users
- **AI suggestions failing**: Verify `GEMINI_API_KEY` is set in `server/.env`
- **Theme not persisting**: Check localStorage functionality in browser
- **Frontend not loading**: Ensure frontend server is running on port 8000

### Debug Mode
- Check browser console for frontend errors
- Check server logs for backend errors
- Verify API endpoints are responding correctly
- Test database file permissions

## Additional Resources

- Vue.js 3 Documentation: https://vuejs.org/
- Express.js Documentation: https://expressjs.com/
- FullCalendar Documentation: https://fullcalendar.io/
- Cloudscape Design System: https://cloudscape.design/