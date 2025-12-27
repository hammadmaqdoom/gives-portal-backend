# Fly.io Deployment Guide

This guide covers deploying the LMS Backend to Fly.io with PostgreSQL running in the same container, optimized for a low-resource demo deployment (1 shared CPU, 1GB RAM).

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io) (free tier available)
2. **Fly.io CLI**: Install the Fly.io CLI
   ```bash
   # macOS
   curl -L https://fly.io/install.sh | sh
   
   # Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows (using PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

3. **Verify Installation**:
   ```bash
   fly version
   ```

## Step-by-Step Deployment

### 1. Login to Fly.io

```bash
fly auth login
```

This will open a browser window for authentication.

### 2. Navigate to Backend Directory

```bash
cd lms-portal-backend
```

### 3. Initialize Fly.io App (First Time Only)

If you haven't created the app yet:

```bash
fly launch
```

This will:
- Detect the `fly.toml` file
- Ask you to confirm the app name (or create a new one)
- Ask about regions (choose one close to your users)
- Ask about PostgreSQL (select "No" since we're using self-hosted)
- Ask about Redis (select "No" since we're not using it)

**Note**: You can also manually create the app:
```bash
fly apps create lms-backend-demo
```

### 4. Create Persistent Volume for PostgreSQL

PostgreSQL data needs to persist across deployments. Create a volume:

```bash
fly volumes create postgres_data --size 3 --region iad
```

Replace `iad` with your chosen region. The `--size 3` creates a 3GB volume (adjust as needed).

### 5. Set Environment Variables (Secrets)

Set sensitive environment variables using Fly.io secrets:

```bash
# Database credentials
fly secrets set DATABASE_PASSWORD="your-secure-password-here"
fly secrets set DATABASE_USERNAME="postgres"
fly secrets set DATABASE_NAME="lms"

# JWT secrets (IMPORTANT: Use strong, random values)
fly secrets set AUTH_JWT_SECRET="your-super-secret-jwt-key-change-this"
fly secrets set AUTH_REFRESH_SECRET="your-super-secret-refresh-key-change-this"
fly secrets set AUTH_FORGOT_SECRET="your-super-secret-forgot-key-change-this"
fly secrets set AUTH_CONFIRM_EMAIL_SECRET="your-super-secret-confirm-email-key-change-this"

# Encryption key (32+ characters)
fly secrets set ENCRYPTION_KEY="your-super-secret-encryption-key-32-chars-minimum"

# Application URLs (update with your actual domains)
fly secrets set FRONTEND_DOMAIN="https://your-frontend-domain.com"
fly secrets set BACKEND_DOMAIN="https://lms-backend-demo.fly.dev"

# Optional: Mail configuration (if needed)
fly secrets set MAIL_USER="your-mail-user"
fly secrets set MAIL_PASSWORD="your-mail-password"
```

**View all secrets**:
```bash
fly secrets list
```

**Note**: See `env-fly.example` for all available environment variables.

### 6. Deploy the Application

```bash
fly deploy
```

This will:
- Build the Docker image using `Dockerfile.fly`
- Push it to Fly.io
- Deploy it to your app
- Start the application

### 7. Verify Deployment

Check the app status:

```bash
fly status
```

View logs:

```bash
fly logs
```

Open the app in browser:

```bash
fly open
```

Or visit: `https://lms-backend-demo.fly.dev/api/v1`

### 8. Verify Database Migrations

Check if migrations ran successfully:

```bash
fly ssh console
# Inside the container:
npm run migration:run
# Or check the logs:
fly logs | grep -i migration
```

## Post-Deployment

### View Application Logs

```bash
# All logs
fly logs

# Follow logs in real-time
fly logs -a lms-backend-demo

# Filter logs
fly logs | grep ERROR
```

### SSH into Container

```bash
fly ssh console
```

This allows you to:
- Check PostgreSQL status: `sudo -u postgres pg_isready`
- Run database commands: `sudo -u postgres psql -d lms`
- Check application files
- Debug issues

### Scale the Application

For demo purposes, the default configuration is sufficient. If needed:

```bash
# Scale to multiple instances (not recommended for demo due to shared DB)
fly scale count 1

# Change VM size (if needed)
fly scale vm shared-cpu-1x --memory 1024
```

### Update Environment Variables

```bash
# Set new secret
fly secrets set KEY=value

# Remove secret
fly secrets unset KEY

# After changing secrets, restart the app
fly apps restart lms-backend-demo
```

## Troubleshooting

### Application Won't Start

1. **Check logs**:
   ```bash
   fly logs
   ```

2. **Common issues**:
   - PostgreSQL not starting: Check if volume is mounted correctly
   - Migration failures: Check database connection settings
   - Out of memory: Check resource usage with `fly status`

### Database Connection Issues

1. **Verify PostgreSQL is running**:
   ```bash
   fly ssh console
   sudo -u postgres pg_isready
   ```

2. **Check database exists**:
   ```bash
   fly ssh console
   sudo -u postgres psql -l
   ```

3. **Verify environment variables**:
   ```bash
   fly ssh console
   env | grep DATABASE
   ```

### Out of Memory (OOM) Kills

If the app is being killed due to memory issues:

1. **Check memory usage**:
   ```bash
   fly status
   ```

2. **Reduce PostgreSQL memory**:
   - Edit `postgresql-fly.conf`
   - Reduce `shared_buffers` (e.g., to 200MB)
   - Reduce `effective_cache_size` (e.g., to 400MB)
   - Redeploy

3. **Monitor resource usage**:
   ```bash
   fly metrics
   ```

### Health Check Failures

The health check uses `/api/v1` endpoint. If it fails:

1. **Check if app is responding**:
   ```bash
   curl https://lms-backend-demo.fly.dev/api/v1
   ```

2. **Verify port configuration**:
   - Fly.io sets `PORT` environment variable automatically
   - App should listen on that port (handled in `app.config.ts`)

### Volume Issues

If PostgreSQL data is lost:

1. **Check volume status**:
   ```bash
   fly volumes list
   ```

2. **Verify volume is attached**:
   ```bash
   fly status
   # Should show volume mounted at /var/lib/postgresql/data
   ```

3. **Recreate volume if needed** (WARNING: This deletes data):
   ```bash
   fly volumes destroy postgres_data
   fly volumes create postgres_data --size 3 --region iad
   ```

## Cost Breakdown

For a demo deployment with 1 shared CPU and 1GB RAM:

- **Fly.io App**: Free tier available (shared-cpu-1x, 256MB RAM) or paid plans
  - 1GB RAM instance: ~$1.94/month (pay-as-you-go)
- **PostgreSQL**: Included (self-hosted in same VM)
- **Storage Volume**: ~$0.15/GB/month
  - 3GB volume: ~$0.45/month
- **Total**: ~$2-3/month for demo deployment

**Note**: Fly.io offers free tier with limited resources. Check current pricing at [fly.io/pricing](https://fly.io/pricing).

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Deploy new version
fly deploy
```

### Backup Database

```bash
# SSH into container
fly ssh console

# Create backup
sudo -u postgres pg_dump -Fc lms > /tmp/backup.dump

# Download backup
fly sftp get /tmp/backup.dump ./backup.dump
```

### Restore Database

```bash
# Upload backup
fly sftp put ./backup.dump /tmp/backup.dump

# SSH into container
fly ssh console

# Restore backup
sudo -u postgres pg_restore -d lms -c /tmp/backup.dump
```

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io CLI Reference](https://fly.io/docs/flyctl/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues specific to this deployment:
1. Check logs: `fly logs`
2. Review this guide's troubleshooting section
3. Check Fly.io status: [status.fly.io](https://status.fly.io)

