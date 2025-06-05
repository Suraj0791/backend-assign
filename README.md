# Chapter Performance Dashboard API

## Live API Endpoints

- Base URL: `http://13.60.65.158`
- API Documentation: `http://13.60.65.158/api/docs`
- AWS EC2: `http://13.60.65.158`
- Render: `https://backend-assign-inoj.onrender.com`

## Deployment Information

### EC2 Instance Details

- **Instance IP**: 13.60.65.158
- **Region**: eu-north-1 (Stockholm)
- **Instance Type**: t3.micro
- **OS**: Ubuntu 24.04.2 LTS
- **Architecture**: x86_64

### Port Configuration

- Port 80: HTTP (Nginx reverse proxy)
- Port 443: HTTPS (Not configured yet)
- Port 3000: Node.js application
- Port 22: SSH access

### Infrastructure Setup

- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: PM2 (running in cluster mode)
- **Database**: MongoDB
- **Caching**: Redis
- **Node.js Version**: 18.x

## API Documentation

### Root Endpoint

- **URL**: `/`
- **Method**: `GET`
- **Description**: Get API information and available endpoints
- **Response Example**:
  ```json
  {
    "status": "success",
    "message": "Chapter Performance Dashboard API",
    "version": "1.0.0",
    "endpoints": {
      "chapters": "/api/v1/chapters",
      "auth": "/api/v1/auth"
    }
  }
  ```

### Authentication Endpoints

#### Get Auth Information

- **URL**: `/api/v1/auth`
- **Method**: `GET`
- **Description**: Get information about authentication endpoints
- **Response**: List of available auth endpoints and their requirements

#### Register User

- **URL**: `/api/v1/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: User registration confirmation

#### Login

- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: JWT token for authentication

#### Setup Admin

- **URL**: `/api/v1/auth/setup-admin`
- **Method**: `POST`
- **Headers**:
  - `x-admin-setup-key`: Admin setup key
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: Admin user creation confirmation

### Chapter Endpoints

#### Get All Chapters

- **URL**: `/api/v1/chapters`
- **Method**: `GET`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sort`: Sort field
  - `order`: Sort order (asc/desc)
- **Response**: List of chapters with pagination

#### Upload Chapters

- **URL**: `/api/v1/chapters/upload`
- **Method**: `POST`
- **Headers**:
  - `x-api-key`: Admin API key
- **Body**: Form data with JSON file
- **Response**: Upload confirmation

## Environment Variables

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
MONGODB_URI=your_mongodb_uri
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
ADMIN_API_KEY=your_admin_key
ADMIN_SETUP_KEY=your_setup_key
```

## Deployment Instructions

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Redis
sudo apt install redis-server

# Install Nginx
sudo apt install nginx
```

### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url>
cd mathongo-backend

# Install dependencies
npm install

# Start application with PM2
pm2 start ecosystem.config.js --env production
pm2 startup systemd
```

### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name 13.60.65.158;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### AWS EC2 Deployment

### Render Deployment

1. **Connect to GitHub**:

   - Fork/push this repository to your GitHub account
   - Sign up for Render (https://render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository

2. **Configure Web Service**:

   - Name: `mathongo-backend` (or your preferred name)
   - Environment: `Node`
   - Region: Choose nearest to your users
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Individual (Free)

3. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=your_mongodb_uri
   REDIS_URL=your_redis_url
   JWT_SECRET=your_jwt_secret
   ADMIN_API_KEY=your_admin_key
   ADMIN_SETUP_KEY=your_setup_key
   ```

### Environment Variables Guide

#### Required Variables (Both EC2 and Render)

- `NODE_ENV`: Set to 'production'
- `PORT`: Default 3000 (Render will override this)
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `ADMIN_API_KEY`: API key for admin operations
- `ADMIN_SETUP_KEY`: Key for initial admin setup

#### Optional Variables

- `REDIS_URL`: Redis connection string (optional for Render free tier)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

## GitHub Actions CI/CD

### EC2 Deployment Workflow

Create `.github/workflows/ec2-deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install Dependencies
        run: npm install

      - name: Run Tests
        run: npm test

      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_PRIVATE_KEY }}
          script: |
            cd ~/mathongo-backend
            git pull origin main
            npm install
            pm2 restart all
```

### Render Auto-Deploy

Render automatically deploys when you push to your GitHub repository. No additional configuration needed.

## GitHub Repository Setup

1. **Add GitHub Secrets**:

   - Go to Repository Settings > Secrets and Variables > Actions
   - Add the following secrets:
     ```
     EC2_HOST=13.60.65.158
     EC2_USERNAME=ubuntu
     EC2_PRIVATE_KEY=your_private_key_content
     ```

2. **Branch Protection Rules**:
   - Go to Repository Settings > Branches
   - Add rule for `main` branch
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators in restrictions

## Deployment Comparison

### EC2 vs Render

#### EC2 Advantages

- Full control over infrastructure
- Better performance
- Cost-effective for high traffic
- Redis support included
- Custom domain and SSL setup
- No cold starts

#### Render Advantages

- Zero infrastructure management
- Automatic HTTPS
- Built-in CI/CD
- Easy scaling
- Free tier available
- Automatic deployments

## Monitoring and Logs

### EC2 Monitoring

### Render Monitoring

- View logs in Render Dashboard
- Set up log drain (paid feature)
- Configure alerts and notifications
- Monitor resource usage

## Troubleshooting

### Common EC2 Issues

1. Connection timeout
   - Check security group settings
   - Verify instance status
   - Check Nginx configuration

### Common Render Issues

1. Build failures
   - Check build logs
   - Verify dependencies
   - Check environment variables
2. Cold starts
   - Use paid tier to avoid
   - Implement keep-alive ping

## Support

For support, please contact the development team or create an issue in the repository.

## License

MIT License

## Deployment Guide

### GitHub Actions Deployment (EC2)

The application is automatically deployed to EC2 when changes are pushed to the main branch. The workflow:

1. Triggers on push to main branch
2. Sets up Node.js 18.17.0
3. Deploys to EC2 via SSH
4. Restarts the application using PM2

#### Required GitHub Secrets

Set these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

- `EC2_HOST`: Your EC2 instance IP/hostname
- `EC2_USERNAME`: SSH username (usually 'ubuntu')
- `EC2_PRIVATE_KEY`: The content of your EC2 SSH private key file

#### Manual EC2 Setup

1. Install Node.js 18.x and PM2 on your EC2 instance
2. Clone the repository to `~/mathongo-backend`
3. Install dependencies: `npm install`
4. Start the application: `pm2 start npm --name "mathongo-api" -- start`

### Render Deployment

#### Setup Instructions

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - **Environment**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### Environment Variables

Set these in Render dashboard (Dashboard > Your Service > Environment):

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# Add any other environment variables your app needs
```

#### Features

- Automatic HTTPS/SSL
- Automatic deployments on push to main branch
- Zero-downtime deployments
- Built-in logging and monitoring

#### Limitations (Free Tier)

- Spins down after 15 minutes of inactivity
- 512 MB RAM limit
- Shared CPU
- 750 hours/month included

### PM2 Commands Reference

```bash
# List all processes
pm2 list

# Restart all applications
pm2 restart all

# View logs
pm2 logs

# Monitor processes
pm2 monit

# Stop all applications
pm2 stop all
```

## Health Check

The API includes a health check endpoint at `/health` that returns server status.

## Postman Collection Setup

### Quick Start

1. Import the collection file: `mathongo-chapter-dashboard.postman_collection.json`
2. Start using it immediately - collection defaults to localhost (http://localhost:3000)

### Why Default to Localhost?

#### Render Free Tier Limitations

1. **Cold Starts**:

   - Free tier services spin down after 15 minutes of inactivity
   - First request after inactivity takes 30-45 seconds to "wake up" the service
   - This makes testing and development slow and frustrating

2. **Development Workflow**:
   - Using localhost during development gives instant responses
   - No cold start delays
   - Faster feedback loop while coding
   - Easier to debug and test changes

#### When to Use Render URL

Use the Render URL (`https://mathongo-backend.onrender.com`) when:

- Sharing the API with others
- Testing production environment
- Final verification before sharing
- Demo purposes

To switch to Render URL, be aware:

- First request might take 30-45 seconds (cold start)
- Subsequent requests will be faster until the service goes inactive
- Service sleeps after 15 minutes of no activity

### Environment Variables (Optional)

The collection includes default values for all variables. You only need to create an environment if you want to override these defaults.

Default values in collection:

```
base_url: http://localhost:3000
admin_api_key: mathongo_admin_2024_secure_key
admin_setup_key: suraj123
jwt_token: (auto-populated after login)
```

### Switching Between Local and Deployed API

To switch between local and deployed versions, simply change the `base_url` variable:

- For local testing: `http://localhost:3000` (recommended during development)
- For deployed version: `https://mathongo-backend.onrender.com` (expect cold start delay)

You can change this in two ways:

1. Edit the collection variable directly:

   - Click "..." next to collection name
   - Choose "Edit"
   - Go to "Variables" tab
   - Change base_url value

2. Create an environment and override the base_url:
   - Click the gear icon (⚙️)
   - Create new environment
   - Add base_url variable
   - Set desired value

### Testing Flow

1. Start with "Setup Admin" request
2. Use "Login" request to get JWT token (automatically saved)
3. All other requests will use the saved JWT token
4. For file upload endpoints, use the provided mock-chapters.json file

### Available Endpoints

- Authentication

  - POST /api/v1/auth/register
  - POST /api/v1/auth/setup-admin
  - POST /api/v1/auth/login

- Chapters
  - GET /api/v1/chapters
  - GET /api/v1/chapters/:id
  - POST /api/v1/chapters
  - PUT /api/v1/chapters/:id
  - DELETE /api/v1/chapters/:id
  - POST /api/v1/chapters/upload (bulk upload)

## File Upload Instructions

To successfully upload chapters using the Postman collection, follow these steps:

1. **Select the Sample Chapter File**:

   - Navigate to the `3 - Upload Chapters (Bulk)` request in the Postman collection.
   - In the request body, ensure the `form-data` option is selected.
   - Attach the `sample-chapters.json` file to the `file` key.

   **Note:** The file variable name is hardcoded in the collection file, which is why manual selection is necessary.

2. **Save the Request**:

   - After attaching the file, make sure to save the request to retain the changes.

3. **Run the Collection**:
   - Once the file is attached and the request is saved, you can run the collection.
   - The upload will only work if the file is correctly attached before running the collection.

By following these steps, you ensure that the file upload process is correctly configured and will execute successfully during the collection run.
