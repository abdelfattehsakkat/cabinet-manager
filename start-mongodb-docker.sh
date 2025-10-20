#!/bin/bash

# Start MongoDB in Docker
echo "Starting MongoDB in Docker container..."
docker-compose -f docker-compose.mongodb.yml up -d

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
attempt=0
max_attempts=30
until docker exec cabinet-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1
do
    attempt=$((attempt+1))
    if [ $attempt -ge $max_attempts ]; then
        echo "MongoDB did not become ready in time"
        exit 1
    fi
    echo "Waiting for MongoDB to be ready... ($attempt/$max_attempts)"
    sleep 1
done

echo "MongoDB is now running on localhost:27017"
echo "Connection string: mongodb://root:password@localhost:27017/cabinetdb?authSource=admin"
echo ""
echo "To stop MongoDB container, run: docker-compose -f docker-compose.mongodb.yml down"
