#!/bin/bash

# WordPress Database Migration Script for WSL
# Migrates WordPress data from MySQL to Aurora PostgreSQL

set -e  # Exit on any error

echo "🗄️  WordPress Database Migration Script (WSL)"
echo "============================================="

# Configuration
SOURCE_DB_HOST="api.cowboykimono.com"
SOURCE_DB_USER="${WORDPRESS_DB_USER:-wordpress_user}"
SOURCE_DB_PASSWORD="${WORDPRESS_DB_PASSWORD:-your_password}"
SOURCE_DB_NAME="${WORDPRESS_DB_NAME:-wordpress_db}"

TARGET_DB_HOST="wordpressblogstack-wordpressauroracaf35a28-oxcsc1phacte.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com"
TARGET_DB_USER="${AURORA_DB_USER:-postgres}"
TARGET_DB_PASSWORD="${AURORA_DB_PASSWORD:-your_aurora_password}"
TARGET_DB_NAME="${AURORA_DB_NAME:-wordpress}"
TARGET_DB_PORT="5432"

BACKUP_DIR="./database-backups"
LOG_FILE="./migration.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v mysqldump &> /dev/null; then
        echo "❌ mysqldump not found. Please install mysql-client:"
        echo "   sudo apt install mysql-client"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        echo "❌ psql not found. Please install postgresql-client:"
        echo "   sudo apt install postgresql-client"
        exit 1
    fi
    
    if ! command -v pgloader &> /dev/null; then
        echo "❌ pgloader not found. Please install pgloader:"
        echo "   sudo apt install pgloader"
        exit 1
    fi
    
    log "✅ All prerequisites found"
}

# Create backup
create_backup() {
    log "Creating MySQL backup..."
    
    BACKUP_FILE="$BACKUP_DIR/wordpress_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mysqldump \
        -h "$SOURCE_DB_HOST" \
        -u "$SOURCE_DB_USER" \
        -p"$SOURCE_DB_PASSWORD" \
        "$SOURCE_DB_NAME" \
        --single-transaction \
        --routines \
        --triggers \
        > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "✅ Backup created: $BACKUP_FILE"
        echo "$BACKUP_FILE"
    else
        log "❌ Backup failed"
        exit 1
    fi
}

# Migrate data using pgloader
migrate_data() {
    local backup_file="$1"
    log "Starting data migration with pgloader..."
    
    # Create pgloader configuration file
    cat > pgloader.conf << EOF
LOAD DATABASE
    FROM mysql://$SOURCE_DB_USER:$SOURCE_DB_PASSWORD@$SOURCE_DB_HOST/$SOURCE_DB_NAME
    INTO postgresql://$TARGET_DB_USER:$TARGET_DB_PASSWORD@$TARGET_DB_HOST:$TARGET_DB_PORT/$TARGET_DB_NAME

WITH include drop, create tables, create indexes, reset sequences,
     workers = 8, concurrency = 1,
     multiple readers per thread, rows per range = 50000

SET PostgreSQL PARAMETERS
    maintenance_work_mem to '128 MB',
    work_mem to '12 MB',
    search_path to '$TARGET_DB_NAME, "$TARGET_DB_USER", public'

SET MySQL PARAMETERS
    net_read_timeout = '600',
    net_write_timeout = '600'

CAST
    type datetime to timestamptz
        using zero-dates-to-null,
    type date drop not null using zero-dates-to-null,
    type time to time using zero-dates-to-null,
    type timestamp to timestamptz
        using zero-dates-to-null,
    type year to integer using zero-dates-to-null,
    type longtext to text,
    type longblob to bytea using hex-encode;
EOF

    # Run pgloader
    pgloader pgloader.conf
    
    if [ $? -eq 0 ]; then
        log "✅ Data migration completed successfully"
    else
        log "❌ Data migration failed"
        exit 1
    fi
    
    # Clean up
    rm -f pgloader.conf
}

# Verify migration
verify_migration() {
    log "Verifying migration..."
    
    # Test connection to Aurora
    if psql "postgresql://$TARGET_DB_USER:$TARGET_DB_PASSWORD@$TARGET_DB_HOST:$TARGET_DB_PORT/$TARGET_DB_NAME" -c "SELECT COUNT(*) FROM wp_posts;" &> /dev/null; then
        log "✅ Aurora connection successful"
        
        # Get post count
        POST_COUNT=$(psql "postgresql://$TARGET_DB_USER:$TARGET_DB_PASSWORD@$TARGET_DB_HOST:$TARGET_DB_PORT/$TARGET_DB_NAME" -t -c "SELECT COUNT(*) FROM wp_posts;" | tr -d ' ')
        log "📊 Found $POST_COUNT posts in Aurora database"
        
        if [ "$POST_COUNT" -gt 0 ]; then
            log "✅ Migration verification successful"
        else
            log "⚠️  Warning: No posts found in Aurora database"
        fi
    else
        log "❌ Aurora connection failed"
        exit 1
    fi
}

# Test Lambda connection
test_lambda_connection() {
    log "Testing Lambda GraphQL connection..."
    
    # Test GraphQL endpoint
    RESPONSE=$(curl -s -X POST "https://org9qz2q03.execute-api.us-east-1.amazonaws.com/prod/graphql" \
        -H "Content-Type: application/json" \
        -d '{"query": "{ posts { nodes { id title } } }"}')
    
    if echo "$RESPONSE" | grep -q "posts"; then
        log "✅ Lambda GraphQL endpoint responding"
        log "📊 Response: $RESPONSE"
    else
        log "❌ Lambda GraphQL endpoint not responding correctly"
        log "📊 Response: $RESPONSE"
    fi
}

# Main execution
main() {
    log "Starting WordPress database migration"
    
    check_prerequisites
    BACKUP_FILE=$(create_backup)
    migrate_data "$BACKUP_FILE"
    verify_migration
    test_lambda_connection
    
    log "🎉 Migration completed successfully!"
    log "Next steps:"
    log "1. Update your .env.local with AWS GraphQL URL"
    log "2. Set NEXT_PUBLIC_USE_AWS_GRAPHQL=true"
    log "3. Restart your Next.js development server"
    log "4. Test your blog at http://localhost:3001/blog"
}

# Run main function
main "$@" 