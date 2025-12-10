#!/bin/bash
set -e

# PostgreSQL data directory - use subdirectory to avoid lost+found issue
# The mount point is /var/lib/postgresql/data, but we use a subdirectory for the actual cluster
PGDATA_MOUNT=${PGDATA_MOUNT:-/var/lib/postgresql/data}
PGDATA="${PGDATA_MOUNT}/pgdata"
PGUSER=${DATABASE_USERNAME:-postgres}
PGPASSWORD=${DATABASE_PASSWORD:-postgres}
PGDB=${DATABASE_NAME:-lms}

echo "Initializing PostgreSQL..."
echo "Mount point: $PGDATA_MOUNT"
echo "PostgreSQL data directory: $PGDATA"

# Ensure mount directory exists
mkdir -p "$PGDATA_MOUNT"

# Remove lost+found if it's the only thing there (filesystem creates this automatically)
if [ -d "$PGDATA_MOUNT/lost+found" ] && [ "$(ls -A "$PGDATA_MOUNT" | grep -v lost+found | wc -l)" -eq 0 ]; then
    echo "Removing lost+found directory from mount point..."
    rm -rf "$PGDATA_MOUNT/lost+found"
fi

# Ensure PostgreSQL data subdirectory exists and has correct permissions
mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA_MOUNT"

# Check if data directory is empty (first run)
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "First run: Initializing PostgreSQL data directory..."
    
    # Use trust authentication for local connections (same container) and password auth for network
    # This is simpler for demo and avoids the initdb password requirement
    sudo -u postgres /usr/lib/postgresql/15/bin/initdb -D "$PGDATA" --auth-host=scram-sha-256 --auth-local=trust
    
    # Start PostgreSQL temporarily to create database and user
    echo "Starting PostgreSQL for initialization..."
    sudo -u postgres /usr/lib/postgresql/15/bin/pg_ctl -D "$PGDATA" -o "-c listen_addresses='localhost' -c config_file=/etc/postgresql/15/main/postgresql.conf" -w start
    
    # Wait for PostgreSQL to be ready
    MAX_WAIT=30
    WAIT_COUNT=0
    until sudo -u postgres /usr/bin/pg_isready -h localhost; do
        WAIT_COUNT=$((WAIT_COUNT + 1))
        if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
            echo "ERROR: PostgreSQL failed to start during initialization"
            exit 1
        fi
        echo "Waiting for PostgreSQL to start..."
        sleep 1
    done
    
    # Set password for postgres superuser (using DATABASE_PASSWORD from Fly.io secrets)
    echo "Setting postgres superuser password..."
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$PGPASSWORD';" postgres 2>/dev/null || true
    
    # Create database and user
    echo "Creating database and user..."
    # Create user (ignore error if already exists)
    # If DATABASE_USERNAME is 'postgres', we don't need to create a new user
    if [ "$PGUSER" != "postgres" ]; then
        sudo -u postgres psql -c "CREATE USER $PGUSER WITH PASSWORD '$PGPASSWORD';" postgres 2>/dev/null || \
            sudo -u postgres psql -c "ALTER USER $PGUSER WITH PASSWORD '$PGPASSWORD';" postgres 2>/dev/null || true
    fi
    
    # Create database (ignore error if already exists)
    sudo -u postgres psql -c "CREATE DATABASE $PGDB OWNER $PGUSER;" postgres 2>/dev/null || true
    
    # Grant privileges
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $PGDB TO $PGUSER;" postgres 2>/dev/null || true
    
    # Stop PostgreSQL (will be started by main startup script)
    sudo -u postgres /usr/lib/postgresql/15/bin/pg_ctl -D "$PGDATA" -m fast stop
    
    echo "PostgreSQL initialization complete!"
else
    echo "PostgreSQL data directory already exists, skipping initialization."
fi

