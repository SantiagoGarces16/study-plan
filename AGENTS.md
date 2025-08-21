# AGENTS.md

## Project Overview

This is a **Career Study Plan** application - a Vue.js + Node.js web application for managing career development plans, milestones, and study topics.

### Architecture
- **Frontend**: Vue.js 3 single-page application with Composition API
- **Backend**: Node.js/Express REST API
- **Database**: JSON file storage (server/db.json)
- **Styling**: Cloudscape Design System with light/dark theme support

### Key Features
- Career plan management with milestones and topics
- Interactive calendar view with FullCalendar integration
- Progress tracking with visual progress bars and circles
- Notepad functionality for notes
- AI-powered topic suggestions using Gemini API
- Responsive design with theme switching

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

# Install dependencies (if needed)
# Note: Client dependencies are loaded via CDN

# Start local development server
# Open client/index.html in browser
# Or use a simple HTTP server:
python -m http.server 8000
# Then visit http://localhost:8000/client/index.html
```

### Full Application
```bash
# Terminal 1: Start backend server
cd server && npm start

# Terminal 2: Serve frontend (from project root)
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
1. **Plan Management**:
   - Create new plans
   - Edit plan names
   - Delete plans
   - Verify plan data persistence

2. **Milestone Management**:
   - Add milestones with dates and colors
   - Edit milestone details
   - Delete milestones
   - Expand/collapse milestone topics

3. **Topic Management**:
   - Add topics to milestones or as unassigned
   - Mark topics as completed
   - Edit topic details
   - Delete topics

4. **Calendar Integration**:
   - Verify milestones and topics appear on calendar
   - Test calendar navigation
   - Check color-coding and styling

5. **Progress Tracking**:
   - Verify progress bars update correctly
   - Test progress circle calculations
   - Check completion status updates

6. **Theme Switching**:
   - Test light/dark theme switching
   - Verify theme persistence
   - Check all UI elements adapt correctly

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
3. Start the server: `npm start`
4. Serve the frontend: `python -m http.server 8000`
5. Access the application at `http://localhost:8000/client/index.html`

### Production Deployment
1. Set up Node.js environment
2. Configure environment variables
3. Build and optimize frontend assets
4. Set up reverse proxy (nginx/Apache)
5. Configure SSL certificate
6. Set up process manager (PM2)

## Troubleshooting

### Common Issues
- **CORS errors**: Check server CORS configuration
- **API connection failed**: Ensure server is running on port 3000
- **Calendar not loading**: Check FullCalendar CDN availability
- **Data not persisting**: Verify file permissions on db.json

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