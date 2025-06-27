#!/usr/bin/env fish

# LoudTV Environment Setup Script

echo "🏗️  LoudTV Environment Setup"

# Check Docker and Docker Compose
echo ""
echo "🐳 Checking Docker installation..."

if command -v docker >/dev/null 2>&1
    set -l docker_version (docker --version)
    echo "  ✅ Docker: $docker_version"
else
    echo "  ❌ Docker not found - please install Docker"
    exit 1
end

if command -v docker-compose >/dev/null 2>&1
    set -l compose_version (docker-compose --version)
    echo "  ✅ Docker Compose: $compose_version"
else if docker compose version >/dev/null 2>&1
    set -l compose_version (docker compose version)
    echo "  ✅ Docker Compose: $compose_version"
else
    echo "  ❌ Docker Compose not found - please install Docker Compose"
    exit 1
end

# Check if Docker daemon is running
if docker info >/dev/null 2>&1
    echo "  ✅ Docker daemon is running"
else
    echo "  ❌ Docker daemon is not running - please start Docker"
    exit 1
end

# Create docker network if it doesn't exist
echo ""
echo "🌐 Setting up Docker network..."
if not docker network ls | grep -q loudtv-network
    docker network create loudtv-network --driver bridge
    echo "  ✅ loudtv-network created"
else
    echo "  ✅ loudtv-network already exists"
end
