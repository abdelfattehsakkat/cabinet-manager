#!/bin/bash

echo "🔧 Creating test users for Cabinet AI..."

cd "$(dirname "$0")/backend"

echo "📦 Installing dependencies if needed..."
npm install

echo "👥 Creating test users..."
node src/scripts/create-users.js

echo "✅ Done! You can now use these credentials to log in:"
echo ""
echo "🔐 Login Credentials:"
echo "Admin: admin@cabinet.com / admin123"
echo "Doctor: marie.dubois@cabinet.com / doctor123"
echo "Secretary: sophie.martin@cabinet.com / secretary123"