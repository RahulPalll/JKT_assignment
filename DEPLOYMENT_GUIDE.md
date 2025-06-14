# Deployment Guide

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker 20.0+
- Docker Compose 2.0+
- Git

### Quick Start
```bash
# Clone repository
git clone https://github.com/RahulPalll/JKT_assignment.git
cd JKT_assignment

# Copy environment configuration
cp .env.example .env

# Start all services with Docker Compose
docker-compose up -d

# Check service status
docker-compose ps

# View application logs
docker-compose logs -f api

# Access application
# API: http://localhost:3000
# Swagger Documentation: http://localhost:3000/api/docs
```

### Environment Configuration
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=jktech_assignment

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000,http://localhost:4200

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Docker Services
```yaml
services:
  # NestJS API Application
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: jktech_assignment
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

## 🔧 Local Development Setup

### Without Docker
```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (macOS with Homebrew)
brew services start postgresql
createdb jktech_assignment

# 3. Start Redis
brew services start redis

# 4. Copy environment file
cp .env.example .env

# 5. Run database migrations
npm run migration:run

# 6. Seed database with sample data
npm run seed

# 7. Start development server
npm run start:dev

# Application will be available at:
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

### Development Scripts
```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debug mode

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Database
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed               # Seed database with sample data

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
npm run type-check         # TypeScript type checking
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Option 1: ECS with Fargate
```bash
# 1. Build and push Docker image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t jktech-api .
docker tag jktech-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/jktech-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/jktech-api:latest

# 2. Create ECS cluster
aws ecs create-cluster --cluster-name jktech-cluster

# 3. Create task definition
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json

# 4. Create ECS service
aws ecs create-service \
  --cluster jktech-cluster \
  --service-name jktech-api \
  --task-definition jktech-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"

# 5. Setup RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier jktech-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password yourpassword \
  --allocated-storage 20

# 6. Setup ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id jktech-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

#### Option 2: EC2 with Auto Scaling
```bash
# 1. Create EC2 instances with user data script
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --count 2 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-12345678 \
  --user-data file://ec2-user-data.sh

# 2. Setup Application Load Balancer
aws elbv2 create-load-balancer \
  --name jktech-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345678

# 3. Create target group
aws elbv2 create-target-group \
  --name jktech-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345678 \
  --health-check-path /api/v1/health
```

### Azure Deployment

#### Container Instances
```bash
# 1. Create resource group
az group create --name jktech-rg --location eastus

# 2. Create Azure Container Registry
az acr create --resource-group jktech-rg --name jktechacr --sku Basic
az acr login --name jktechacr

# 3. Build and push image
docker build -t jktech-api .
docker tag jktech-api jktechacr.azurecr.io/jktech-api:latest
docker push jktechacr.azurecr.io/jktech-api:latest

# 4. Create container instance
az container create \
  --resource-group jktech-rg \
  --name jktech-api \
  --image jktechacr.azurecr.io/jktech-api:latest \
  --cpu 1 \
  --memory 2 \
  --registry-login-server jktechacr.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  --ports 3000 \
  --environment-variables NODE_ENV=production

# 5. Create Azure Database for PostgreSQL
az postgres server create \
  --resource-group jktech-rg \
  --name jktech-db \
  --location eastus \
  --admin-user postgres \
  --admin-password YourPassword123! \
  --sku-name B_Gen5_1

# 6. Create Azure Cache for Redis
az redis create \
  --resource-group jktech-rg \
  --name jktech-cache \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

### Google Cloud Platform (GCP) Deployment

#### Cloud Run
```bash
# 1. Build and push to Container Registry
gcloud builds submit --tag gcr.io/your-project-id/jktech-api

# 2. Deploy to Cloud Run
gcloud run deploy jktech-api \
  --image gcr.io/your-project-id/jktech-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

# 3. Create Cloud SQL PostgreSQL instance
gcloud sql instances create jktech-db \
  --database-version POSTGRES_13 \
  --tier db-f1-micro \
  --region us-central1

# 4. Create Memorystore Redis instance
gcloud redis instances create jktech-cache \
  --size=1 \
  --region=us-central1
```

## 🔄 CI/CD Pipeline Setup

### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:cov
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USERNAME: postgres
          DB_PASSWORD: postgres
          DB_NAME: test
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Run e2e tests
        run: npm run test:e2e
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USERNAME: postgres
          DB_PASSWORD: postgres
          DB_NAME: test
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            jktech/api:latest
            jktech/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          echo "Deploy to production server"
          # Add your deployment commands here
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
```bash
# Application health
curl http://localhost:3000/api/v1/health

# Database connectivity
curl http://localhost:3000/api/v1/health/detailed

# Readiness probe
curl http://localhost:3000/api/v1/health/ready

# Liveness probe
curl http://localhost:3000/api/v1/health/live
```

### Metrics Collection
```bash
# Prometheus metrics
curl http://localhost:3000/api/v1/metrics

# Application metrics
curl http://localhost:3000/api/v1/metrics/summary
```

### Log Aggregation
```bash
# View application logs
docker-compose logs -f api

# View database logs
docker-compose logs -f postgres

# View Redis logs
docker-compose logs -f redis
```

## 🔐 Security Checklist

### Pre-deployment Security
- [ ] Environment variables are properly configured
- [ ] JWT secrets are cryptographically secure (256-bit minimum)
- [ ] Database credentials are not hardcoded
- [ ] CORS is properly configured for production domains
- [ ] File upload limits are set and enforced
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced in production
- [ ] Security headers are configured
- [ ] Input validation is comprehensive
- [ ] SQL injection protection is enabled

### Production Security
```bash
# Enable firewall rules
# Allow only necessary ports (80, 443, 22)

# Setup SSL/TLS certificates
# Use Let's Encrypt or commercial certificates

# Configure reverse proxy (Nginx)
# Handle SSL termination and security headers

# Enable monitoring and alerting
# Setup log aggregation and anomaly detection
```

## 🚀 Performance Optimization

### Database Optimization
```sql
-- Create necessary indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_documents_status ON documents(status);
CREATE INDEX CONCURRENTLY idx_documents_created_at ON documents(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM documents WHERE status = 'published';
```

### Application Optimization
```bash
# Enable compression
# Configure Gzip compression in reverse proxy

# Optimize Docker image
# Use multi-stage builds and Alpine images

# Configure connection pooling
# Set appropriate database connection limits

# Enable caching
# Configure Redis for session and data caching
```

## 📞 Support and Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
docker-compose exec postgres pg_isready -U postgres

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Application Issues
```bash
# Check application logs
docker-compose logs api

# Restart application
docker-compose restart api

# Debug mode
docker-compose exec api npm run start:debug
```

#### Redis Issues
```bash
# Check Redis connectivity
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

### Getting Help
- Check application logs for error details
- Verify environment configuration
- Ensure all services are running and healthy
- Review database connectivity and permissions
- Check firewall and network configuration

This deployment guide provides comprehensive instructions for running the JK Tech Assignment application in various environments, from local development to production cloud deployments.
