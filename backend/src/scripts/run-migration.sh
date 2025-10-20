#!/bin/bash

# Ensure we're in the backend directory
cd "$(dirname "$0")/.."

# Compile TypeScript files
echo "Compiling TypeScript..."
npx tsc

# Run the migration script
echo "Running migration script..."
node dist/scripts/migrate-appointments.js

echo "Migration completed!"
