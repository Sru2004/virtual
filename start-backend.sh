#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit

# Check if MongoDB is running (optional - depends on your setup)
# For local MongoDB, you might need to start it separately

# Start the backend server
echo "Starting backend server..."
npm start
