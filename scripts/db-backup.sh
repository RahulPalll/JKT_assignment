#!/bin/bash

# Database Backup and Restore Script
# Supports PostgreSQL database backup and restore operations

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ACTION="backup"
ENVIRONMENT="development"
BACKUP_DIR="./backups"
RETENTION_DAYS=30
COMPRESS="true"

# Database configuration
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-nestjs_app}"
DB_USER="${DATABASE_USERNAME:-postgres}"
DB_PASSWORD="${DATABASE_PASSWORD:-password}"

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -a, --action         Action to perform (backup|restore|list)"
    echo "  -e, --environment    Environment (development|staging|production)"
    echo "  -d, --directory      Backup directory (default: ./backups)"
    echo "  -f, --file           Backup file for restore operation"
    echo "  -r, --retention      Backup retention in days (default: 30)"
    echo "  -c, --compress       Compress backups (true|false, default: true)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -a backup -e production"
    echo "  $0 -a restore -f backup_20231201_120000.sql.gz"
    echo "  $0 -a list"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--action)
            ACTION="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--directory)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -f|--file)
            RESTORE_FILE="$2"
            shift 2
            ;;
        -r|--retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -c|--compress)
            COMPRESS="$2"
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

# Logging functions
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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if pg_dump and pg_restore are available
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump is required but not installed"
        exit 1
    fi
    
    if ! command -v pg_restore &> /dev/null; then
        error "pg_restore is required but not installed"
        exit 1
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    success "Prerequisites check passed"
}

# Test database connection
test_connection() {
    log "Testing database connection..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        success "Database connection successful"
    else
        error "Failed to connect to database"
        error "Host: $DB_HOST, Port: $DB_PORT, Database: $DB_NAME, User: $DB_USER"
        exit 1
    fi
}

# Create database backup
create_backup() {
    log "Creating database backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_filename="backup_${ENVIRONMENT}_${timestamp}.sql"
    local backup_path="$BACKUP_DIR/$backup_filename"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create backup
    log "Backing up database to: $backup_path"
    
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=custom \
        --no-owner \
        --no-privileges \
        --exclude-table-data=public.sessions \
        --file="$backup_path"
    
    if [[ $? -eq 0 ]]; then
        success "Database backup created: $backup_path"
        
        # Compress backup if requested
        if [[ "$COMPRESS" == "true" ]]; then
            log "Compressing backup..."
            gzip "$backup_path"
            backup_path="${backup_path}.gz"
            success "Backup compressed: $backup_path"
        fi
        
        # Calculate backup size
        local backup_size=$(du -h "$backup_path" | cut -f1)
        log "Backup size: $backup_size"
        
        # Add metadata
        create_backup_metadata "$backup_path" "$backup_size"
        
    else
        error "Database backup failed"
        exit 1
    fi
}

# Create backup metadata
create_backup_metadata() {
    local backup_path="$1"
    local backup_size="$2"
    local metadata_file="${backup_path}.meta"
    
    cat > "$metadata_file" << EOF
{
    "backup_file": "$(basename "$backup_path")",
    "environment": "$ENVIRONMENT",
    "database": "$DB_NAME",
    "host": "$DB_HOST",
    "port": "$DB_PORT",
    "user": "$DB_USER",
    "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "size": "$backup_size",
    "compressed": $COMPRESS,
    "version": "$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" | xargs)"
}
EOF
    
    log "Backup metadata created: $metadata_file"
}

# Restore database from backup
restore_backup() {
    if [[ -z "$RESTORE_FILE" ]]; then
        error "Restore file not specified. Use -f option to specify backup file."
        exit 1
    fi
    
    local restore_path="$BACKUP_DIR/$RESTORE_FILE"
    
    if [[ ! -f "$restore_path" ]]; then
        restore_path="$RESTORE_FILE"
        
        if [[ ! -f "$restore_path" ]]; then
            error "Backup file not found: $RESTORE_FILE"
            exit 1
        fi
    fi
    
    log "Restoring database from: $restore_path"
    
    # Check if file is compressed
    local temp_file="$restore_path"
    if [[ "$restore_path" == *.gz ]]; then
        log "Decompressing backup file..."
        temp_file="${restore_path%.gz}"
        gunzip -c "$restore_path" > "$temp_file"
    fi
    
    # Confirm restore operation
    warning "This will restore the database and may overwrite existing data."
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Restore operation cancelled"
        
        # Clean up temporary file if created
        if [[ "$temp_file" != "$restore_path" ]]; then
            rm -f "$temp_file"
        fi
        
        exit 0
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Drop existing connections (be careful in production!)
    if [[ "$ENVIRONMENT" != "production" ]]; then
        log "Terminating existing connections..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid != pg_backend_pid();" \
            &> /dev/null || true
    fi
    
    # Restore database
    log "Restoring database..."
    
    pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-password \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        "$temp_file"
    
    if [[ $? -eq 0 ]]; then
        success "Database restore completed successfully"
    else
        error "Database restore failed"
        exit 1
    fi
    
    # Clean up temporary file if created
    if [[ "$temp_file" != "$restore_path" ]]; then
        rm -f "$temp_file"
    fi
}

# List available backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        warning "Backup directory does not exist: $BACKUP_DIR"
        return
    fi
    
    echo ""
    printf "%-30s %-15s %-10s %-20s\n" "FILENAME" "ENVIRONMENT" "SIZE" "CREATED"
    printf "%-30s %-15s %-10s %-20s\n" "--------" "-----------" "----" "-------"
    
    for backup in "$BACKUP_DIR"/backup_*.sql* "$BACKUP_DIR"/backup_*.dump*; do
        if [[ -f "$backup" ]]; then
            local filename=$(basename "$backup")
            local size=$(du -h "$backup" | cut -f1)
            local created=$(stat -c %y "$backup" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1 || stat -f %Sm "$backup" 2>/dev/null)
            local env="unknown"
            
            # Extract environment from filename
            if [[ "$filename" =~ backup_([^_]+)_ ]]; then
                env="${BASH_REMATCH[1]}"
            fi
            
            printf "%-30s %-15s %-10s %-20s\n" "$filename" "$env" "$size" "$created"
        fi
    done
    
    echo ""
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    while IFS= read -r -d '' file; do
        rm -f "$file"
        rm -f "${file}.meta"
        ((deleted_count++))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "backup_*.sql*" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [[ $deleted_count -gt 0 ]]; then
        success "Deleted $deleted_count old backup(s)"
    else
        log "No old backups to delete"
    fi
}

# Main function
main() {
    log "Starting database $ACTION operation..."
    log "Environment: $ENVIRONMENT"
    log "Backup directory: $BACKUP_DIR"
    
    check_prerequisites
    
    case "$ACTION" in
        backup)
            test_connection
            create_backup
            cleanup_old_backups
            ;;
        restore)
            test_connection
            restore_backup
            ;;
        list)
            list_backups
            ;;
        *)
            error "Invalid action: $ACTION"
            error "Allowed actions: backup, restore, list"
            exit 1
            ;;
    esac
    
    success "$ACTION operation completed successfully!"
}

# Run main function
main "$@"
