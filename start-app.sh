#!/bin/bash

# Function to display help message
show_help() {
    echo "Usage: ./start-app.sh [options]"
    echo ""
    echo "Options:"
    echo "  -d, --docker     Start the application using Docker Compose"
    echo "  -l, --local      Start the application locally"
    echo "  -h, --help       Display this help message"
    exit 0
}

# Function to start with Docker Compose
start_with_docker() {
    echo "Starting the application with Docker Compose..."
    docker-compose up -d
}

# Function to start locally
start_locally() {
    echo "Starting MongoDB in Docker..."
    ./start-mongodb-docker.sh
    
    echo "Starting the backend server..."
    cd backend && npm start &
    BACKEND_PID=$!
    
    echo "Starting the frontend server..."
    cd frontend && npm start &
    FRONTEND_PID=$!
    
    echo "Application started. Press Ctrl+C to stop."
    
    # Set up trap to kill all processes on exit
    trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose -f docker-compose.mongodb.yml down; exit" INT TERM
    
    # Wait for any process to exit
    wait
}

# Default to showing help if no arguments provided
if [ $# -eq 0 ]; then
    show_help
fi

# Process command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -d|--docker)
            start_with_docker
            shift
            ;;
        -l|--local)
            start_locally
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            ;;
    esac
done
