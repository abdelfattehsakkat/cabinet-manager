# CabinetAI Developer Quick Start

## Start MongoDB with Docker
```bash
# Start MongoDB container
./start-mongodb-docker.sh
```

## Start Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Build TypeScript
npm run build

# Start server
npm start
```

## Start Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start Angular dev server
npm start
```

## Access Application
- Frontend:     
- Backend API: http://localhost:3000/api

## Common Commands

### Run Database Migration
```bash
cd backend
npm run migrate
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Start Everything at Once
```bash
./start-app.sh
```

## Troubleshooting
- If MongoDB fails to connect, check if Docker container is running with `docker ps`
- If you see "undefined undefined" as patient name, run the migration script
- If port is already in use, try specifying a different port: `npm start -- --port 4201`
