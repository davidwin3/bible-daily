#!/bin/bash

# Bible Daily Deployment Script
# Usage: ./deploy.sh [environment] [component]
# Example: ./deploy.sh production backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-development}
COMPONENT=${2:-all}
NAMESPACE=$ENVIRONMENT

# Configuration
KUBECTL_TIMEOUT=300s
ROLLOUT_TIMEOUT=600s

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Label namespace for network policies
    kubectl label namespace $NAMESPACE name=$NAMESPACE --overwrite
    
    log_success "Namespace $NAMESPACE is ready"
}

deploy_secrets() {
    log_info "Deploying secrets for $ENVIRONMENT environment..."
    
    # Check if secrets file exists
    if [[ ! -f "deployment/secrets/$ENVIRONMENT-secrets.yml" ]]; then
        log_warning "Secrets file not found: deployment/secrets/$ENVIRONMENT-secrets.yml"
        log_warning "Please create the secrets file manually"
        return 0
    fi
    
    kubectl apply -f "deployment/secrets/$ENVIRONMENT-secrets.yml" -n $NAMESPACE
    
    log_success "Secrets deployed successfully"
}

deploy_database() {
    log_info "Deploying database for $ENVIRONMENT environment..."
    
    # Deploy MySQL
    helm upgrade --install mysql-$ENVIRONMENT \
        --namespace $NAMESPACE \
        --set auth.rootPassword="$(kubectl get secret bible-daily-$ENVIRONMENT-secrets -n $NAMESPACE -o jsonpath='{.data.DB_ROOT_PASSWORD}' | base64 -d)" \
        --set auth.database="bible_daily_$ENVIRONMENT" \
        --set auth.username="$(kubectl get secret bible-daily-$ENVIRONMENT-secrets -n $NAMESPACE -o jsonpath='{.data.DB_USERNAME}' | base64 -d)" \
        --set auth.password="$(kubectl get secret bible-daily-$ENVIRONMENT-secrets -n $NAMESPACE -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)" \
        --set primary.persistence.size=20Gi \
        --timeout $KUBECTL_TIMEOUT \
        bitnami/mysql
    
    # Deploy Redis
    helm upgrade --install redis-$ENVIRONMENT \
        --namespace $NAMESPACE \
        --set auth.password="$(kubectl get secret bible-daily-$ENVIRONMENT-secrets -n $NAMESPACE -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d)" \
        --set master.persistence.size=8Gi \
        --timeout $KUBECTL_TIMEOUT \
        bitnami/redis
    
    log_success "Database deployed successfully"
}

deploy_backend() {
    log_info "Deploying backend for $ENVIRONMENT environment..."
    
    kubectl apply -f "deployment/environments/$ENVIRONMENT.yml" -n $NAMESPACE
    
    # Wait for deployment to be ready
    kubectl rollout status deployment/bible-daily-backend-$ENVIRONMENT -n $NAMESPACE --timeout=$ROLLOUT_TIMEOUT
    
    log_success "Backend deployed successfully"
}

deploy_frontend() {
    log_info "Deploying frontend for $ENVIRONMENT environment..."
    
    # Frontend is typically deployed via Vercel/Netlify in CI/CD
    # This is a placeholder for Kubernetes deployment if needed
    
    log_info "Frontend deployment is handled by CI/CD pipeline"
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Get backend pod name
    BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=bible-daily-backend,environment=$ENVIRONMENT -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -z "$BACKEND_POD" ]]; then
        log_error "No backend pod found"
        exit 1
    fi
    
    # Run migrations
    kubectl exec -n $NAMESPACE $BACKEND_POD -- npm run migration:run
    
    log_success "Database migrations completed"
}

health_check() {
    log_info "Performing health check..."
    
    # Get service URL
    if [[ "$ENVIRONMENT" == "production" ]]; then
        SERVICE_URL="https://api.bible-daily.com"
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        SERVICE_URL="https://api-staging.bible-daily.com"
    else
        SERVICE_URL="https://api-dev.bible-daily.com"
    fi
    
    # Wait for service to be ready
    for i in {1..30}; do
        if curl -f "$SERVICE_URL/health" &> /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        log_info "Waiting for service to be ready... ($i/30)"
        sleep 10
    done
    
    log_error "Health check failed"
    exit 1
}

rollback() {
    log_warning "Rolling back deployment..."
    
    kubectl rollout undo deployment/bible-daily-backend-$ENVIRONMENT -n $NAMESPACE
    kubectl rollout status deployment/bible-daily-backend-$ENVIRONMENT -n $NAMESPACE --timeout=$ROLLOUT_TIMEOUT
    
    log_success "Rollback completed"
}

cleanup() {
    log_info "Cleaning up old resources..."
    
    # Clean up old ReplicaSets
    kubectl delete replicaset -n $NAMESPACE -l app=bible-daily-backend --cascade=orphan
    
    # Clean up completed jobs
    kubectl delete job -n $NAMESPACE --field-selector=status.successful=1
    
    log_success "Cleanup completed"
}

main() {
    log_info "Starting deployment for environment: $ENVIRONMENT, component: $COMPONENT"
    
    check_prerequisites
    create_namespace
    
    case $COMPONENT in
        "all")
            deploy_secrets
            deploy_database
            deploy_backend
            deploy_frontend
            run_migrations
            health_check
            cleanup
            ;;
        "backend")
            deploy_secrets
            deploy_backend
            run_migrations
            health_check
            ;;
        "frontend")
            deploy_frontend
            ;;
        "database")
            deploy_secrets
            deploy_database
            ;;
        "secrets")
            deploy_secrets
            ;;
        "rollback")
            rollback
            ;;
        *)
            log_error "Unknown component: $COMPONENT"
            log_info "Available components: all, backend, frontend, database, secrets, rollback"
            exit 1
            ;;
    esac
    
    log_success "Deployment completed successfully!"
}

# Trap errors and perform rollback
trap 'log_error "Deployment failed! Check the logs above."; exit 1' ERR

# Run main function
main "$@"
