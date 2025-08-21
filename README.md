# Career Study Plan

A dynamic, multi-plan web application for creating and managing career study plans. This tool allows you to organize study topics into milestones, visualize your progress on a calendar, and get AI-powered suggestions for new topics. The application features a reactive frontend built with Vue.js, a modern and user-friendly interface inspired by the Cloudscape Design System, and a backend powered by Node.js and Express.

> **For AI Agents:** Check out [AGENTS.md](AGENTS.md) for comprehensive project documentation, development guidelines, and setup instructions.

## Features

-   **Multi-Plan Management:** Create, select, and delete multiple career plans from a central main menu.
-   **Vue.js Frontend:** A modern, responsive, and component-based interface built with the Vue.js framework.
-   **Interactive UI:** A clean, hover-based interface for all actions, including editing and deleting items.
-   **Topics & Milestones:** Add, edit, and delete study topics and group them into milestones.
-   **Color Customization:** Assign custom colors to milestones and topics for better visual organization in the calendar.
-   **Calendar View:** Visualize your topics and milestones on a calendar with color-coded events.
-   **AI-Powered Suggestions:** Get study topic suggestions for your milestones using the Gemini API.
-   **Customizable Title & Themes:** Edit the title of your plan and switch between light and dark themes.
-   **Progress Tracking:** Visual progress bars and circles show completion status.
-   **Simple Data Persistence:** Data is stored in a `db.json` file on the server.

## Project Structure

-   `client/`: Contains the frontend files (HTML, CSS, and Vue.js).
-   `server/`: Contains the backend server files (Node.js, Express).

## Technologies Used

### Frontend

-   HTML
-   CSS
-   [Vue.js](https://vuejs.org/)
-   [FullCalendar](https://fullcalendar.io/)

### Backend

-   [Node.js](https://nodejs.org/)
-   [Express](https://expressjs.com/)
-   [axios](https://axios-http.com/)
-   [cors](https://www.npmjs.com/package/cors)
-   [dotenv](https://www.npmjs.com/package/dotenv)

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

3.  **Set up your Gemini API key:**
    Create a `.env` file in the `server` directory and add your API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Start the backend server:**
    ```bash
    npm start
    ```
    The server will run on `http://localhost:3000`.

5.  **Open the frontend:**
    Open the `client/index.html` file in your web browser.

## API Endpoints

The backend provides a RESTful API for managing plans, topics, and milestones. All endpoints are scoped to a specific plan.

-   **Plans:** `GET /api/plans`, `POST /api/plans`, `GET /api/plans/:planId`, `DELETE /api/plans/:planId`
-   **Topics:** `GET /api/plans/:planId/topics`, `POST /api/plans/:planId/topics`, `PUT /api/plans/:planId/topics/:topicId`, `DELETE /api/plans/:planId/topics/:topicId`
-   **Milestones:** `GET /api/plans/:planId/milestones`, `POST /api/plans/:planId/milestones`, `PUT /api/plans/:planId/milestones/:milestoneId`, `DELETE /api/plans/:planId/milestones/:milestoneId`
-   **Suggestions:** `POST /api/suggestions`

## Troubleshooting

### Common Issues

- **CORS errors**: Ensure the backend server is running on `http://localhost:3000` and the frontend is served from `http://localhost:8000`
- **API connection failed**: Check that the backend server is running and accessible
- **Calendar not loading**: Ensure you have internet connection for CDN resources (FullCalendar, Vue.js)
- **Data not persisting**: Verify file permissions on `server/db.json`

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