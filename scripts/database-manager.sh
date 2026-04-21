#!/bin/bash

# NCRemedies Database Management Script
# Enhanced version with comprehensive testing and validation capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_DIR="$PROJECT_DIR/supabase"
MIGRATIONS_DIR="$SUPABASE_DIR/migrations"
SEED_DIR="$SUPABASE_DIR/seed"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  NCRemedies Database Manager${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    # Check if project is initialized
    if [ ! -f "$SUPABASE_DIR/config.toml" ]; then
        print_error "Supabase project not initialized. Run 'supabase init' first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

start_local_db() {
    print_info "Starting local Supabase instance..."
    cd "$PROJECT_DIR"
    supabase start
    print_success "Local database started"
}

stop_local_db() {
    print_info "Stopping local Supabase instance..."
    cd "$PROJECT_DIR"
    supabase stop
    print_success "Local database stopped"
}

reset_database() {
    print_info "Resetting database with fresh schema and seed data..."
    cd "$PROJECT_DIR"
    supabase db reset
    print_success "Database reset completed"
}

run_migrations() {
    print_info "Running database migrations..."
    cd "$PROJECT_DIR"
    supabase db push
    print_success "Migrations applied successfully"
}

seed_database() {
    print_info "Seeding database from local-only CSV and image sources..."
    
    cd "$PROJECT_DIR"
    if [ -n "${LOCAL_SEED_PRODUCTS_CSV:-}" ]; then
        npm run seed:local
        print_success "Database seeding completed"
    else
        print_warning "LOCAL_SEED_PRODUCTS_CSV is not set. Skipping seed import."
    fi
}

validate_schema() {
    print_info "Validating database schema..."
    
    # Run schema validation queries
    cd "$PROJECT_DIR"
    
    # Check if all required tables exist
    TABLES=("categories" "products" "product_variants" "product_images" "orders" "order_items" "inventory_logs")
    
    for table in "${TABLES[@]}"; do
        if supabase db shell --command "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" | grep -q "1"; then
            print_success "Table '$table' exists"
        else
            print_error "Table '$table' missing"
            return 1
        fi
    done
    
    print_success "Schema validation passed"
}

run_tests() {
    print_info "Running database tests..."
    cd "$PROJECT_DIR"
    
    # Run database-specific tests
    if [ -f "package.json" ]; then
        npm run test -- tests/database/
        print_success "Database tests completed"
    else
        print_warning "No package.json found, skipping automated tests"
    fi
}

backup_database() {
    print_info "Creating database backup..."
    cd "$PROJECT_DIR"
    
    BACKUP_DIR="$PROJECT_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
    
    # Create backup using pg_dump equivalent
    supabase db dump --local > "$BACKUP_FILE"
    
    print_success "Backup created: $BACKUP_FILE"
}

check_health() {
    print_info "Performing health check..."
    cd "$PROJECT_DIR"
    
    # Check if database is accessible
    if supabase db shell --command "SELECT version();" > /dev/null 2>&1; then
        print_success "Database connection: OK"
    else
        print_error "Database connection: FAILED"
        return 1
    fi
    
    # Check basic queries
    if supabase db shell --command "SELECT COUNT(*) FROM categories;" > /dev/null 2>&1; then
        print_success "Basic queries: OK"
    else
        print_error "Basic queries: FAILED"
        return 1
    fi
    
    print_success "Health check passed"
}

generate_types() {
    print_info "Generating TypeScript types..."
    cd "$PROJECT_DIR"
    supabase gen types typescript --local > src/types/supabase.types.ts
    print_success "TypeScript types generated"
}

show_status() {
    print_info "Database Status:"
    cd "$PROJECT_DIR"
    supabase status
}

show_help() {
    print_header
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start         Start local Supabase instance"
    echo "  stop          Stop local Supabase instance"
    echo "  reset         Reset database with fresh schema"
    echo "  migrate       Run database migrations"
    echo "  seed          Seed database from local-only CSV/image sources"
    echo "  validate      Validate database schema"
    echo "  test          Run database tests"
    echo "  backup        Create database backup"
    echo "  health        Perform health check"
    echo "  types         Generate TypeScript types"
    echo "  status        Show database status"
    echo "  dev-setup     Complete development setup (start + reset + seed)"
    echo "  ci-test       Run CI testing suite"
    echo "  help          Show this help message"
    echo ""
}

dev_setup() {
    print_info "Running complete development setup..."
    check_prerequisites
    start_local_db
    reset_database
    seed_database
    generate_types
    validate_schema
    print_success "Development setup completed!"
}

ci_test() {
    print_info "Running CI testing suite..."
    check_prerequisites
    start_local_db
    reset_database
    validate_schema
    run_tests
    check_health
    stop_local_db
    print_success "CI testing completed!"
}

# Main script logic
case "${1:-help}" in
    start)
        check_prerequisites
        start_local_db
        ;;
    stop)
        stop_local_db
        ;;
    reset)
        check_prerequisites
        reset_database
        ;;
    migrate)
        check_prerequisites
        run_migrations
        ;;
    seed)
        check_prerequisites
        seed_database
        ;;
    validate)
        check_prerequisites
        validate_schema
        ;;
    test)
        check_prerequisites
        run_tests
        ;;
    backup)
        check_prerequisites
        backup_database
        ;;
    health)
        check_prerequisites
        check_health
        ;;
    types)
        check_prerequisites
        generate_types
        ;;
    status)
        show_status
        ;;
    dev-setup)
        dev_setup
        ;;
    ci-test)
        ci_test
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
