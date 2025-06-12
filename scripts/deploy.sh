#!/bin/bash

# NestJS Application Deployment Script
# This script handles deployment to different environments

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
BUILD_DOCKER="true"
RUN_TESTS="true"
DEPLOY_K8S="false"
SKIP_MIGRATIONS="false"

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Target environment (development|staging|production)"
    echo "  -d, --docker         Build Docker image (true|false)"
    echo "  -t, --tests          Run tests before deployment (true|false)"
    echo "  -k, --kubernetes     Deploy to Kubernetes (true|false)"
    echo "  -m, --skip-migrations Skip database migrations (true|false)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e production -k true"
    echo "  $0 --environment staging --docker true --tests true"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--docker)
            BUILD_DOCKER="$2"
            shift 2
            ;;
        -t|--tests)
            RUN_TESTS="$2"
            shift 2
            ;;
        -k|--kubernetes)
            DEPLOY_K8S="$2"
            shift 2
            ;;
        -m|--skip-migrations)
            SKIP_MIGRATIONS="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate environment
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        error "Invalid environment: $ENVIRONMENT"
        error "Allowed values: development, staging, production"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    local commands=("node" "npm" "docker")
    
    if [[ "$DEPLOY_K8S" == "true" ]]; then
        commands+=("kubectl" "helm")
    fi
    
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="16.0.0"
    
    if [[ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]]; then
        error "Node.js version $node_version is too old. Required: $required_version or higher"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    success "Dependencies installed"
}

# Run tests
run_tests() {
    if [[ "$RUN_TESTS" == "true" ]]; then
        log "Running tests..."
        
        # Set test environment
        export NODE_ENV=test
        
        # Run linting
        npm run lint
        
        # Run unit tests
        npm run test:cov
        
        # Run E2E tests
        npm run test:e2e
        
        success "All tests passed"
    else
        warning "Skipping tests"
    fi
}

# Build application
build_application() {
    log "Building application..."
    
    # Clean previous build
    rm -rf dist/
    
    # Build the application
    npm run build
    
    success "Application built successfully"
}

# Build Docker image
build_docker_image() {
    if [[ "$BUILD_DOCKER" == "true" ]]; then
        log "Building Docker image..."
        
        local image_tag="nestjs-app:$ENVIRONMENT-$(git rev-parse --short HEAD)"
        
        # Build Docker image
        docker build -t "$image_tag" .
        docker tag "$image_tag" "nestjs-app:$ENVIRONMENT-latest"
        
        # Push to registry if in production/staging
        if [[ "$ENVIRONMENT" != "development" ]]; then
            if [[ -n "$DOCKER_REGISTRY" ]]; then
                docker tag "$image_tag" "$DOCKER_REGISTRY/nestjs-app:$image_tag"
                docker push "$DOCKER_REGISTRY/nestjs-app:$image_tag"
                docker tag "$image_tag" "$DOCKER_REGISTRY/nestjs-app:$ENVIRONMENT-latest"
                docker push "$DOCKER_REGISTRY/nestjs-app:$ENVIRONMENT-latest"
            else
                warning "DOCKER_REGISTRY not set, skipping push to registry"
            fi
        fi
        
        success "Docker image built: $image_tag"
    else
        warning "Skipping Docker build"
    fi
}

# Run database migrations
run_migrations() {
    if [[ "$SKIP_MIGRATIONS" == "false" ]]; then
        log "Running database migrations..."
        
        # Set environment variables
        export NODE_ENV="$ENVIRONMENT"
        
        # Run migrations
        npm run migration:run
        
        success "Database migrations completed"
    else
        warning "Skipping database migrations"
    fi
}

# Deploy to Docker Compose
deploy_docker_compose() {
    log "Deploying with Docker Compose..."
    
    local compose_file="docker-compose.yml"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        compose_file="docker-compose.prod.yml"
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        compose_file="docker-compose.staging.yml"
    fi
    
    if [[ -f "$compose_file" ]]; then
        docker-compose -f "$compose_file" down
        docker-compose -f "$compose_file" up -d
        
        # Wait for health check
        log "Waiting for application to be healthy..."
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -s http://localhost:3000/health > /dev/null; then
                success "Application is healthy"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                error "Application failed to become healthy after $max_attempts attempts"
                exit 1
            fi
            
            log "Attempt $attempt/$max_attempts: Application not ready yet..."
            sleep 10
            ((attempt++))
        done
    else
        error "Docker Compose file not found: $compose_file"
        exit 1
    fi
}

# Deploy to Kubernetes
deploy_kubernetes() {
    if [[ "$DEPLOY_K8S" == "true" ]]; then
        log "Deploying to Kubernetes..."
        
        # Apply namespace
        kubectl apply -f k8s/
        
        # Wait for deployment
        kubectl rollout status deployment/nestjs-app -n nestjs-app --timeout=300s
        
        # Verify deployment
        local pods_ready=$(kubectl get pods -n nestjs-app -l app=nestjs-app --field-selector=status.phase=Running --no-headers | wc -l)
        
        if [[ $pods_ready -gt 0 ]]; then
            success "Kubernetes deployment successful"
            kubectl get pods -n nestjs-app -l app=nestjs-app
        else
            error "Kubernetes deployment failed"
            kubectl describe pods -n nestjs-app -l app=nestjs-app
            exit 1
        fi
    else
        log "Deploying with Docker Compose..."
        deploy_docker_compose
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Remove temporary files
    rm -f .env.temp
    
    # Clean npm cache if needed
    if [[ "$ENVIRONMENT" == "production" ]]; then
        npm cache clean --force
    fi
}

# Main deployment process
main() {
    log "Starting deployment process..."
    log "Environment: $ENVIRONMENT"
    log "Build Docker: $BUILD_DOCKER"
    log "Run Tests: $RUN_TESTS"
    log "Deploy to Kubernetes: $DEPLOY_K8S"
    log "Skip Migrations: $SKIP_MIGRATIONS"
    
    # Validate inputs
    validate_environment
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    install_dependencies
    
    # Run tests
    run_tests
    
    # Build application
    build_application
    
    # Build Docker image
    build_docker_image
    
    # Run migrations
    run_migrations
    
    # Deploy application
    deploy_kubernetes
    
    # Cleanup
    cleanup
    
    success "Deployment completed successfully!"
    
    if [[ "$DEPLOY_K8S" == "true" ]]; then
        log "Application is available at:"
        kubectl get ingress -n nestjs-app
    else
        log "Application is available at: http://localhost:3000"
        log "API Documentation: http://localhost:3000/api"
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
