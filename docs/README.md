# Cabinet Manager

A medical office management application with patient management, appointment scheduling, and calendar view.

## Recent Updates

### Docker Integration for MongoDB

The application now includes Docker Compose configuration for MongoDB, making it easier to set up and run without requiring a local MongoDB installation.

### Appointment System Improvements

- Fixed issue with "undefined undefined" being shown as patient names in the appointment dialog
- Enhanced appointment data model to store patient first and last name directly in appointment documents
- Added migration script to update existing appointments with patient names

For more details on these changes, see the [Migration README](./MIGRATION-README.md).

## Project Structure

- **Frontend**: Angular application
- **Backend**: Node.js with Express and TypeScript
- **Database**: MongoDB

## Setup and Installation

### Prerequisites

- Node.js (v16+)
- MongoDB
- Docker and Docker Compose (optional)

### Running with Docker Compose

1. Clone the repository
2. Run the application:

```bash
./start-app.sh --docker
```

This will start:
- MongoDB on port 27017
- Backend server on port 3000
- Frontend application on port 4200

### Running Locally

1. Clone the repository
2. Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

3. Start the application:

```bash
./start-app.sh --local
```

This will:
- Start MongoDB in a Docker container
- Start the backend server
- Start the frontend development server

Alternatively, you can start each component manually:

#### Start MongoDB in Docker
```bash
./start-mongodb-docker.sh
```

#### Start the Backend
```bash
cd backend
npm install
npm run build
npm start
```

#### Start the Frontend
```bash
cd frontend
npm install
npm start
```

## Accessing the Application

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- MongoDB: mongodb://localhost:27017/cabinetdb

## Troubleshooting

### Connection Refused Error

If you see a connection refused error when trying to access the API:

1. Check if MongoDB Docker container is running:
   ```bash
   docker ps | grep cabinet-mongodb
   ```

2. Verify that the backend server is running:
   ```bash
   ps aux | grep node
   ```

3. Check the MongoDB connection in your backend/.env file:
   ```
   MONGODB_URI=mongodb://root:password@localhost:27017/cabinetdb?authSource=admin
   ```

4. Check Docker container logs:
   ```bash
   docker logs cabinet-mongodb
   ```

## API Documentation

The API provides endpoints for:

- User authentication
- Patient management
- Appointment scheduling

Base URL: http://localhost:3000/api
