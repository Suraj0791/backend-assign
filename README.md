# Chapter Performance Dashboard API

## Live API Endpoints

- Base URL: `http://13.60.65.158`
- API Documentation: `http://13.60.65.158/api/docs`
- AWS EC2: `http://13.60.65.158`
- Render: `https://mathongo-backend.onrender.com` (Add your Render URL after deployment)

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
