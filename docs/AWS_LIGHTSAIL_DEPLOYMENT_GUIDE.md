# AWS Lightsail Backend Deployment Guide

This guide explains how to deploy the NestJS backend to AWS Lightsail with Docker, Nginx, and SSL certificates.

## Architecture Overview

- **Backend**: NestJS API running in Docker container
- **Database**: PostgreSQL running in Docker container  
- **Cache**: Redis running in Docker container
- **Reverse Proxy**: Nginx with SSL termination
- **File Storage**: AWS S3 or Azure Blob Storage
- **SSL**: Let's Encrypt certificates with auto-renewal

## Prerequisites

1. **AWS Lightsail Instance**: Ubuntu 20.04+ with at least 1GB RAM
2. **Domain Name**: Pointed to your Lightsail static IP
3. **GitHub Repository**: With backend code
4. **GitHub Secrets**: Configured with required variables

## Required GitHub Secrets

### AWS Lightsail Configuration
- `LIGHTSAIL_HOST`: IP address of your Lightsail instance
- `LIGHTSAIL_USER`: SSH username (usually `ubuntu`)
- `LIGHTSAIL_SSH_KEY`: Private SSH key for Lightsail instance
- `EMAIL`: Email for SSL certificate notifications

### Application Configuration
- `APP_NAME`: Application name

### Database Configuration
- `DATABASE_USERNAME`: PostgreSQL username
- `DATABASE_PASSWORD`: PostgreSQL password
- `DATABASE_NAME`: PostgreSQL database name

### File Storage Configuration
- `FILE_DRIVER`: Storage driver (`s3`, `s3-presigned`, `azure-blob-sas`, or `local`)
- `ACCESS_KEY_ID`: AWS access key ID
- `SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_S3_REGION`: AWS region (e.g., `us-east-1`)
- `AWS_DEFAULT_S3_BUCKET`: S3 bucket name

### Azure Blob Storage (if using azure-blob-sas)
- `AZURE_STORAGE_ACCOUNT_NAME`: Azure storage account name
- `AZURE_STORAGE_ACCOUNT_KEY`: Azure storage account key
- `AZURE_CONTAINER_NAME`: Azure container name
- `AZURE_BLOB_SAS_EXPIRY_SECONDS`: SAS expiry in seconds
- `AZURE_BLOB_PUBLIC_BASE_URL`: Public base URL

### Social Authentication (Optional)
- `FACEBOOK_APP_ID`: Facebook app ID
- `FACEBOOK_APP_SECRET`: Facebook app secret
- `GOOGLE_CLIENT_ID`: Google client ID
- `GOOGLE_CLIENT_SECRET`: Google client secret

### Zoom OAuth (Optional)
- `ZOOM_OAUTH_CLIENT_ID`: Zoom OAuth client ID
- `ZOOM_OAUTH_CLIENT_SECRET`: Zoom OAuth client secret
- `ZOOM_OAUTH_REDIRECT_URI`: Zoom OAuth redirect URI

### Redis Configuration
- `REDIS_PASSWORD`: Redis password

## Deployment Workflows

### 1. Initial Deployment

**Trigger**: Manual workflow dispatch
**File**: `.github/workflows/deploy-initial.yml`

**Steps**:
1. Go to GitHub Actions tab
2. Select "Initial AWS Lightsail Deployment"
3. Click "Run workflow"
4. Enter your backend domain (e.g., `api.yourdomain.com`)
5. Enter your frontend domain (e.g., `yourdomain.com`)
6. Click "Run workflow"

**What it does**:
- Installs Docker, Docker Compose, Nginx, and Certbot
- Creates application directory structure
- Sets up environment configuration
- Creates Docker Compose configuration
- Builds and starts all services
- Generates SSL certificates for both domain and static IP
- Sets up automatic certificate renewal

### 2. Update Deployment

**Trigger**: Manual workflow dispatch
**File**: `.github/workflows/deploy-update.yml`

**Update Types**:
- **Code**: Updates application code and rebuilds containers
- **Config**: Updates environment configuration
- **SSL**: Renews SSL certificates

**Steps**:
1. Go to GitHub Actions tab
2. Select "Update AWS Lightsail Deployment"
3. Click "Run workflow"
4. Select update type
5. Click "Run workflow"

## Environment Variables

### Hardcoded Values
```bash
NODE_ENV=production
APP_PORT=3000
API_PREFIX=api
APP_FALLBACK_LANGUAGE=en
APP_HEADER_LANGUAGE=x-custom-lang
DATABASE_TYPE=postgres
DATABASE_PORT=5432
DATABASE_SYNCHRONIZE=false
DATABASE_MAX_CONNECTIONS=100
DATABASE_SSL_ENABLED=false
DATABASE_REJECT_UNAUTHORIZED=false
AUTH_JWT_SECRET=secret
AUTH_JWT_TOKEN_EXPIRES_IN=15m
AUTH_REFRESH_SECRET=secret_for_refresh
AUTH_REFRESH_TOKEN_EXPIRES_IN=3650d
AUTH_FORGOT_SECRET=secret_for_forgot
AUTH_FORGOT_TOKEN_EXPIRES_IN=30m
AUTH_CONFIRM_EMAIL_SECRET=secret_for_confirm_email
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d
APPLE_APP_AUDIENCE=[]
WORKER_HOST=redis://redis:6379/1
REDIS_ENABLED=false
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_TTL=3600
```

### Dynamic Values (from GitHub Secrets)
```bash
APP_NAME={var}
FRONTEND_DOMAIN={var}
BACKEND_DOMAIN={var}
DATABASE_HOST={var}
DATABASE_USERNAME={var}
DATABASE_PASSWORD={var}
DATABASE_NAME={var}
FILE_DRIVER={var}
ACCESS_KEY_ID={var}
SECRET_ACCESS_KEY={var}
AWS_S3_REGION={var}
AWS_DEFAULT_S3_BUCKET={var}
AZURE_STORAGE_ACCOUNT_NAME={var}
AZURE_STORAGE_ACCOUNT_KEY={var}
AZURE_CONTAINER_NAME={var}
AZURE_BLOB_SAS_EXPIRY_SECONDS={var}
AZURE_BLOB_PUBLIC_BASE_URL={var}
FACEBOOK_APP_ID={var}
FACEBOOK_APP_SECRET={var}
GOOGLE_CLIENT_ID={var}
GOOGLE_CLIENT_SECRET={var}
ZOOM_OAUTH_CLIENT_ID={var}
ZOOM_OAUTH_CLIENT_SECRET={var}
ZOOM_OAUTH_REDIRECT_URI={var}
REDIS_PASSWORD={var}
```

## File Structure

After deployment, the following structure is created on your Lightsail instance:

```
/opt/backend/
├── .env                    # Environment configuration
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile.prod         # Production Dockerfile
├── wait-for-it.sh         # Service readiness script
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── nest-cli.json          # NestJS CLI configuration
├── src/                   # Application source code
│   ├── main.ts
│   ├── app.module.ts
│   └── health.controller.ts
├── nginx/                 # Nginx configuration
│   ├── nginx.conf
│   └── conf.d/
│       └── backend.conf
└── uploads/               # File uploads directory
```

## Services

The deployment creates the following Docker services:

- **backend_app**: NestJS application (port 3000)
- **backend_postgres**: PostgreSQL database (internal port 5432)
- **backend_redis**: Redis cache (internal port 6379)
- **backend_nginx**: Nginx reverse proxy (ports 80, 443)

## SSL Certificates

- **Domain**: `https://yourdomain.com`
- **Static IP**: `https://your-static-ip`
- **Auto-renewal**: Certificates are automatically renewed via cron job
- **Provider**: Let's Encrypt

## Health Checks

- **Application**: `https://yourdomain.com/health`
- **Database**: Built-in PostgreSQL health check
- **Redis**: Built-in Redis health check
- **Nginx**: Built-in Nginx health check

## Monitoring and Logs

### View all logs:
```bash
cd /opt/backend
docker-compose logs -f
```

### View specific service logs:
```bash
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f nginx
```

### Check service status:
```bash
docker-compose ps
```

## Manual Commands

### SSH into Lightsail instance:
```bash
ssh -i your-key.pem ubuntu@your-lightsail-ip
```

### Navigate to application directory:
```bash
cd /opt/backend
```

### Restart services:
```bash
docker-compose restart
```

### Rebuild and restart:
```bash
docker-compose down
docker-compose up -d --build
```

### Check SSL certificate status:
```bash
sudo certbot certificates
```

### Renew SSL certificates manually:
```bash
sudo certbot renew
docker-compose restart nginx
```

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Ensure ports 80, 443, 3000, 5432, and 6379 are not in use
2. **Permission issues**: Check file permissions in `/opt/backend`
3. **Environment variables**: Verify all required secrets are set in GitHub
4. **Docker issues**: Check Docker daemon status with `sudo systemctl status docker`
5. **SSL issues**: Check certificate status with `sudo certbot certificates`

### Debug Commands:

```bash
# Check Docker status
sudo systemctl status docker

# Check container logs
docker-compose logs app

# Check environment variables
cat /opt/backend/.env

# Check Nginx configuration
docker-compose exec nginx nginx -t

# Check SSL certificate
sudo certbot certificates

# Check cron jobs
crontab -l
```

### Health Check Commands:

```bash
# Application health
curl -f https://yourdomain.com/health

# Database connectivity
docker-compose exec app npm run typeorm:run

# Redis connectivity
docker-compose exec redis redis-cli ping
```

## Security Considerations

1. **Firewall**: Configure Lightsail firewall to only allow ports 22, 80, 443
2. **SSH Keys**: Use SSH keys instead of passwords
3. **Environment Variables**: Never commit sensitive data to version control
4. **Database**: Use strong passwords and consider SSL connections
5. **S3/Azure**: Configure proper bucket policies and IAM permissions
6. **SSL**: Certificates are automatically renewed
7. **Updates**: Keep system packages updated

## Scaling

For production scaling, consider:

1. **Load Balancer**: Use AWS Application Load Balancer
2. **Database**: Use AWS RDS for PostgreSQL
3. **Cache**: Use AWS ElastiCache for Redis
4. **CDN**: Use AWS CloudFront for static assets
5. **Monitoring**: Use AWS CloudWatch for monitoring
6. **Backup**: Implement automated database backups

## Backup

### Database Backup:
```bash
docker exec backend_postgres pg_dump -U your_user your_db > backup.sql
```

### Application Backup:
```bash
tar -czf backend-backup.tar.gz /opt/backend
```

### SSL Certificate Backup:
```bash
sudo tar -czf ssl-backup.tar.gz /etc/letsencrypt
```

## Support

For issues and questions:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `cat /opt/backend/.env`
3. Check service status: `docker-compose ps`
4. Review this documentation
5. Check GitHub Issues for known problems
