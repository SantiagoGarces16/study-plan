# Career Study Plan

A dynamic, multi-plan web application for creating and managing career study plans. This tool allows you to organize study topics into milestones, visualize your progress on a calendar, and get AI-powered suggestions for new topics. The application features a reactive frontend built with Vue.js, a modern and user-friendly interface, and a lightweight backend powered by Node.js and Express with JSON file storage.

> **For AI Agents:** Check out [AGENTS.md](AGENTS.md) for comprehensive project documentation, development guidelines, and setup instructions.

## Features

-   **Multi-Plan Management:** Create, select, and delete multiple career plans from a central main menu.
-   **User Authentication:** Simple username/password authentication with local storage.
-   **Vue.js Frontend:** A modern, responsive, and component-based interface built with Vue.js 3 Composition API.
-   **Interactive UI:** A clean, hover-based interface for all actions, including editing and deleting items.
-   **Topics & Milestones:** Add, edit, and delete study topics and group them into milestones.
-   **Color Customization:** Assign custom colors to milestones and topics for better visual organization.
-   **Calendar View:** Visualize your topics and milestones on a calendar with color-coded events using FullCalendar.
-   **AI-Powered Suggestions:** Get study topic suggestions for your milestones using the Gemini API.
-   **Progress Tracking:** Visual progress bars and circles show completion status for topics and milestones.
-   **Theme Support:** Switch between light and dark themes with persistent settings.
-   **Notepad:** Built-in notepad for each plan to store additional notes and information.
-   **Lightweight Storage:** Data is stored in a simple `db.json` file on the server - no database setup required.

## Project Structure

```
career-study-plan/
├── client/                 # Frontend application
│   ├── app.js             # Main Vue.js application
│   ├── index.html         # HTML entry point
│   ├── styles.css         # Application styles
│   └── package.json       # Client dependencies (CDN-based)
├── server/                # Backend application
│   ├── server.js          # Express server
│   ├── db.json           # JSON file database
│   ├── .env              # Environment variables
│   └── package.json      # Server dependencies
├── Assets/               # Static assets
│   └── Default profile picture.jpg
├── .gitignore           # Git ignore rules
└── README.md           # This file
```

## Technologies Used

### Frontend
-   **HTML5** - Semantic markup
-   **CSS3** - Modern styling with custom properties and flexbox/grid
-   **[Vue.js 3](https://vuejs.org/)** - Progressive JavaScript framework with Composition API
-   **[FullCalendar](https://fullcalendar.io/)** - Interactive calendar component
-   **[Sortable.js](https://sortablejs.github.io/Sortable/)** - Drag and drop functionality

### Backend
-   **[Node.js](https://nodejs.org/)** - JavaScript runtime
-   **[Express](https://expressjs.com/)** - Web application framework
-   **[axios](https://axios-http.com/)** - HTTP client for API requests
-   **[cors](https://www.npmjs.com/package/cors)** - Cross-origin resource sharing
-   **[dotenv](https://www.npmjs.com/package/dotenv)** - Environment variable management

### Data Storage
-   **JSON File Storage** - Simple file-based database using `db.json`
-   **Local Storage** - Client-side storage for user preferences and authentication

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) installed on your machine.
-   A Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd career-study-plan
    ```

2.  **Install backend dependencies:**
    ```bash
    cd server
    npm install
    ```

3.  **Set up your Gemini API key (optional):**
    Create or update the `.env` file in the `server` directory:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
    Note: The app works without the API key, but AI suggestions won't be available.

4.  **Start the backend server:**
    ```bash
    npm start
    ```
    The server will run on `http://localhost:3000`.

5.  **Start the frontend:**
    ```bash
    cd ../client
    npm start
    ```
    Or simply open `client/index.html` in your web browser.
    The frontend will be available at `http://localhost:8000`.

### Quick Start Scripts

For convenience, you can use the provided batch files (Windows):
- `start-app.bat` - Starts both server and client
- `start-frontend-server.bat` - Starts only the frontend server

## API Endpoints

The backend provides a RESTful API for managing plans, topics, and milestones. All endpoints return JSON data.

### Plans
- `GET /api/plans` - Get all plans
- `POST /api/plans` - Create a new plan
- `GET /api/plans/:planId` - Get a specific plan
- `PUT /api/plans/:planId` - Update a plan (name, notes, userId)
- `DELETE /api/plans/:planId` - Delete a plan

### Topics (scoped to plans)
- `GET /api/plans/:planId/topics` - Get all topics for a plan
- `POST /api/plans/:planId/topics` - Create a new topic
- `PUT /api/plans/:planId/topics/:topicId` - Update a topic
- `DELETE /api/plans/:planId/topics/:topicId` - Delete a topic

### Milestones (scoped to plans)
- `GET /api/plans/:planId/milestones` - Get all milestones for a plan
- `POST /api/plans/:planId/milestones` - Create a new milestone
- `PUT /api/plans/:planId/milestones/:milestoneId` - Update a milestone
- `DELETE /api/plans/:planId/milestones/:milestoneId` - Delete a milestone

### AI Suggestions
- `POST /api/suggestions` - Get AI-powered topic suggestions for a milestone

### Utility
- `GET /api/session` - Get server session token

## Troubleshooting

### Common Issues

- **CORS errors**: Ensure the backend server is running on `http://localhost:3000` and the frontend is served from `http://localhost:8000`
- **API connection failed**: Check that the backend server is running and accessible
- **Calendar not loading**: Ensure you have internet connection for CDN resources (FullCalendar, Vue.js)
- **Data not persisting**: Verify file permissions on `server/db.json`
- **AI suggestions not working**: Check that your `GEMINI_API_KEY` is set correctly in `server/.env`
- **Authentication issues**: User data is stored in browser localStorage - clearing browser data will reset users

### Getting Help

If you encounter issues not covered here, please check the browser console for frontend errors or server logs for backend errors.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.