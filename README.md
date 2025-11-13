# F28WP Project - PERN Stack

A full-stack web project using the PERN stack (PostgreSQL, Express, React, Node.js) with Docker.

The aim of this project is to build a full stack "clone" of airbnb.

## Features

- Log in/Sign up (User accounts)
- View and Post rental listings
- Filter and sort listings by location, price, bedrooms, etc
- ...

## Design choices

Here we should discuss why we went with different programming choices to help us plan, develop, and present our project.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git (for version control)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Nhogg/F28WP-Project.git
cd F28WP-Project
```

### 2. Set up environment variables

Copy the example environment file and update it with your settings:

```bash
cp .env.example .env
```

Edit `.env` and update the values as needed (especially the database password for production).

### 3. Start the application

Run the entire stack with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **Backend API** on `http://localhost:3000`
- **Frontend** on `http://localhost:5173`

### 4. Access the application

Open your browser and navigate to:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Development

### Running in development mode

The Docker setup includes hot-reloading for both frontend and backend:

```bash
docker-compose up
```

### Stopping the application

```bash
docker-compose down
```

### Stopping and removing volumes (clears database)

```bash
docker-compose down -v
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Project Structure

```
F28WP-Project/
├── backend/              # Express.js API
│   ├── data/            # JSON data files
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── server.js        # Main server file
│   ├── Dockerfile       # Backend Docker configuration
│   └── package.json     # Backend dependencies
├── frontend/            # React application
│   ├── src/             # Source files
│   │   ├── utils/       # API utilities
│   │   ├── App.jsx      # Main App component
│   │   └── main.jsx     # Entry point
│   ├── Dockerfile       # Frontend Docker configuration
│   ├── vite.config.js   # Vite configuration
│   └── package.json     # Frontend dependencies
├── docker-compose.yml   # Docker Compose configuration
├── .env                 # Environment variables (not in git)
└── .env.example         # Example environment variables
```

## Environment Variables

### Backend (.env or docker-compose.yml)

- `NODE_ENV` - Environment (development/production)
- `PORT` - Backend server port
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

### Frontend

- `VITE_API_URL` - Backend API URL

## Database

The PostgreSQL database runs in a Docker container with persistent storage using Docker volumes.

### Connecting to the database

```bash
docker-compose exec postgres psql -U postgres -d rentals
```

## Troubleshooting

### Port already in use

If you get port conflicts, stop the conflicting service or change the port mappings in `docker-compose.yml`.

### Database connection issues

Make sure the PostgreSQL container is healthy before the backend starts:

```bash
docker-compose ps
```

### Frontend can't connect to backend

Check that the `VITE_API_URL` in the frontend `.env` file matches your backend URL.
