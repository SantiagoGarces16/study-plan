# Career Study Plan

This is a simple web application for creating and managing a career study plan. It allows you to add study topics and organize them into milestones. The application features a frontend built with vanilla JavaScript, HTML, and CSS, and a backend powered by Node.js and Express.

## Features

- **Topics Management:** Add, edit, and delete study topics.
- **Milestones:** Group topics into milestones to structure your study plan.
- **Calendar View:** Visualize your topics and milestones on a calendar.
- **AI-Powered Suggestions:** Get study topic suggestions for your milestones using the Gemini API.
- **Simple Data Persistence:** Data is stored in a `db.json` file on the server.

## Project Structure

The project is divided into two main parts:

- `client/`: Contains the frontend files (HTML, CSS, and JavaScript).
- `server/`: Contains the backend server files (Node.js, Express).

## Technologies Used

### Frontend

- HTML
- CSS
- JavaScript
- [FullCalendar](https://fullcalendar.io/)

### Backend

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [axios](https://axios-http.com/)
- [cors](https://www.npmjs.com/package/cors)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- A Gemini API key. You can get one from [Google AI Studio](https://aistudio.google.com/).

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

    The server will be running on `http://localhost:3000`.

5.  **Open the frontend:**

    Open the `client/index.html` file in your web browser.

## API Endpoints

The backend provides the following API endpoints:

### Topics

- `GET /api/topics`: Get all topics.
- `POST /api/topics`: Create a new topic.
- `PUT /api/topics/:id`: Update a topic.
- `DELETE /api/topics/:id`: Delete a topic.

### Milestones

- `GET /api/milestones`: Get all milestones.
- `POST /api/milestones`: Create a new milestone.
- `PUT /api/milestones/:id`: Update a milestone.
- `DELETE /api/milestones/:id`: Delete a milestone.

### Suggestions

- `POST /api/suggestions`: Get study topic suggestions for a milestone.
