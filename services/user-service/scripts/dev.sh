#!/bin/bash

# Development scripts for User Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

start_services() {
    echo_info "Starting User Service and dependencies..."
    docker compose up -d
    echo_info "Services started. Use 'docker-compose logs -f' to view logs."
}

stop_services() {
    echo_info "Stopping User Service and dependencies..."
    docker compose down
    echo_info "Services stopped."
}

restart_services() {
    echo_info "Restarting User Service..."
    docker compose restart user-service
}

build_services() {
    echo_info "Building User Service..."
    docker compose build --no-cache
}

reset_data() {
    echo_warn "This will remove all data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo_info "Resetting data..."
        docker compose down -v
        docker compose up -d
        echo_info "Data reset complete."
    else
        echo_info "Reset cancelled."
    fi
}

check_health() {
    echo_info "Checking service health..."
    curl -f http://localhost:3001/health || echo_error "Health check failed"
}

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    build)
        build_services
        ;;
    reset)
        reset_data
        ;;
    health)
        check_health
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|build|reset|health}"
        echo ""
        echo "Commands:"
        echo "  start               Start all services"
        echo "  stop                Stop all services"
        echo "  restart             Restart services"
        echo "  build               Build services"
        echo "  reset               Reset all data (destructive)"
        echo "  health              Check service health"
        exit 1
        ;;
esac
