#!/bin/bash
set -e

# PostgreSQL configuration
PGDATA=${PGDATA:-/var/lib/postgresql/data}
PGUSER=${DATABASE_USERNAME:-postgres}
PGPASSWORD=${DATABASE_PASSWORD:-postgres}
PGDB=${DATABASE_NAME:-lms}

# Function to stop PostgreSQL
stop_postgres() {
    echo "Stopping PostgreSQL..."
    if [ -f "$PGDATA/postmaster.pid" ]; then
        sudo -u postgres /usr/lib/postgresql/15/bin/pg_ctl -D "$PGDATA" -m fast stop || true
    fi
}

# Function to stop Node.js app
stop_app() {
    if [ ! -z "$APP_PID" ]; then
        echo "Stopping NestJS application..."
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
    fi
}

# Trap signals for graceful shutdown
trap 'stop_app; stop_postgres; exit 0' SIGTERM SIGINT

# Initialize PostgreSQL if needed
echo "Checking PostgreSQL initialization..."
/usr/local/bin/init-postgres-fly.sh

# Start PostgreSQL
echo "Starting PostgreSQL..."
sudo -u postgres /usr/lib/postgresql/15/bin/postgres -D "$PGDATA" -c config_file=/etc/postgresql/15/main/postgresql.conf > /var/log/postgresql.log 2>&1 &
POSTGRES_PID=$!

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until sudo -u postgres /usr/bin/pg_isready -h localhost -U "$PGUSER" -d "$PGDB" >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "ERROR: PostgreSQL failed to start after $MAX_RETRIES attempts"
        echo "PostgreSQL logs:"
        tail -n 50 /var/log/postgresql.log || true
        exit 1
    fi
    # Check if PostgreSQL process is still running
    if ! kill -0 $POSTGRES_PID 2>/dev/null; then
        echo "ERROR: PostgreSQL process died"
        echo "PostgreSQL logs:"
        tail -n 50 /var/log/postgresql.log || true
        exit 1
    fi
    echo "Waiting for PostgreSQL... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
npm run migration:run || {
    echo "WARNING: Migration failed, but continuing..."
}

# Start NestJS application
echo "Starting NestJS application..."
# Run as nestjs user for security, but ensure we're in the right directory
cd /app
su nestjs -s /bin/bash -c "cd /app && node start.js" &
APP_PID=$!

# Wait for application to start
sleep 5

# Check if app is still running
if ! kill -0 $APP_PID 2>/dev/null; then
    echo "ERROR: NestJS application failed to start"
    stop_postgres
    exit 1
fi

echo "Application started successfully!"
echo "PostgreSQL PID: $POSTGRES_PID"
echo "NestJS PID: $APP_PID"

# Wait for either process to exit
wait $APP_PID
EXIT_CODE=$?

# Cleanup
stop_app
stop_postgres

exit $EXIT_CODE

