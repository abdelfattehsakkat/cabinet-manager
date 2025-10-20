#!/bin/bash

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "MongoDB is not installed. Please install it first."
    echo "You can install it using brew: brew install mongodb-community"
    exit 1
fi

# Create data directory if it doesn't exist
MONGO_DATA_DIR="$HOME/data/db"
mkdir -p "$MONGO_DATA_DIR"

# Start MongoDB
echo "Starting MongoDB..."
mongod --dbpath "$MONGO_DATA_DIR"
