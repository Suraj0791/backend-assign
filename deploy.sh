#!/bin/bash

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Node.js and npm if not installed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Install Redis if not installed
if ! command -v redis-cli &> /dev/null; then
    sudo apt install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
fi

# Install application dependencies
npm install

# Build the application (if needed)
# npm run build

# Start the application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list and configure startup boot
pm2 save
sudo pm2 startup 