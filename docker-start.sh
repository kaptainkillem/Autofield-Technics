#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Mechanic Website - Docker Quick Start             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local from .env.example...${NC}"
    cp .env.example .env.local 2>/dev/null || cp env.example .env.local 2>/dev/null
    echo -e "${YELLOW}⚠️  Please edit .env.local with your actual credentials:${NC}"
    echo -e "${YELLOW}   - NEXT_PUBLIC_SUPABASE_URL${NC}"
    echo -e "${YELLOW}   - NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
    echo -e "${YELLOW}   - SUPABASE_SERVICE_ROLE_KEY${NC}"
    echo -e "${YELLOW}   - RESEND_API_KEY${NC}"
    echo -e "${YELLOW}   - NEXT_PUBLIC_WHATSAPP_NUMBER${NC}"
    echo -e "${YELLOW}   - NEXT_PUBLIC_MECHANIC_USER_ID${NC}"
    read -p "Press Enter to continue after updating .env.local..."
fi

# Menu
echo -e "\n${YELLOW}Select an option:${NC}"
echo "1) Start development environment"
echo "2) Build Docker image"
echo "3) Stop all containers"
echo "4) View logs"
echo "5) SSH into app container"
echo "6) Run database migrations"
echo "7) Clean up (delete volumes)"
echo "8) Exit"
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        echo -e "${GREEN}Starting development environment...${NC}"
        docker compose up -d
        echo -e "${GREEN}✓ Services started!${NC}"
        echo -e "${GREEN}App: http://localhost:3000${NC}"
        echo -e "${GREEN}Admin: http://localhost:3000/admin${NC}"
        echo -e "${GREEN}Database: localhost:5432${NC}"
        echo -e "${YELLOW}View logs with: docker compose logs -f${NC}"
        ;;
    2)
        echo -e "${GREEN}Building Docker image...${NC}"
        docker compose build
        echo -e "${GREEN}✓ Build complete!${NC}"
        ;;
    3)
        echo -e "${YELLOW}Stopping containers...${NC}"
        docker compose down
        echo -e "${GREEN}✓ Containers stopped${NC}"
        ;;
    4)
        echo -e "${YELLOW}Displaying logs (press Ctrl+C to exit)...${NC}"
        docker compose logs -f
        ;;
    5)
        echo -e "${GREEN}Connecting to app container...${NC}"
        docker compose exec app sh
        ;;
    6)
        echo -e "${YELLOW}This project uses Supabase. Apply migrations manually in the Supabase SQL Editor:${NC}"
        echo -e "${YELLOW}  - migrations/*.sql${NC}"
        echo -e "${YELLOW}Or run schema.sql as a single source of truth.${NC}"
        ;;
    7)
        echo -e "${RED}⚠️  This will delete all volumes and data!${NC}"
        read -p "Are you sure? (type 'yes' to confirm): " confirm
        if [ "$confirm" = "yes" ]; then
            docker compose down -v
            echo -e "${GREEN}✓ Cleanup complete${NC}"
        fi
        ;;
    8)
        echo -e "${GREEN}Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
