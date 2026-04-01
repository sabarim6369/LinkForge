# Docker Build & Deploy Instructions

## Prerequisites
- Docker installed
- Docker Compose installed
- Environment variables configured

## Using Docker Compose (Recommended)

### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Build and Start
```bash
# Build image and start containers
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 3. Verify Services
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f linkforge-backend

# Test health
curl http://localhost:5000/health
```

### 4. Stop Services
```bash
docker-compose down

# Also remove volumes
docker-compose down -v
```

## Using Docker Only

### 1. Build Image
```bash
docker build -t linkforge-backend:latest .
```

### 2. Create MongoDB Container
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  mongo:6
```

### 3. Start Backend
```bash
docker run -d \
  --name linkforge \
  -p 5000:5000 \
  --link mongodb:mongodb \
  -e MONGODB_URI=mongodb://mongodb:27017/linkforge \
  -e GROQ_API_KEY=your_key \
  -e EMAIL_SENDER=your_email \
  -e EMAIL_PASSWORD=your_password \
  linkforge-backend:latest
```

## Environment Variables in Docker

Pass via:
```bash
# docker-compose.yml
environment:
  - GROQ_API_KEY=xxx
  - EMAIL_SENDER=xxx

# Or .env file (docker-compose reads automatically)

# Or command line
docker run -e GROQ_API_KEY=xxx ...
```

## Troubleshooting

### Container won't start
```bash
docker logs linkforge-backend
```

### MongoDB connection refused
```bash
docker-compose down -v  # Remove volumes
docker-compose up      # Fresh start
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Host:Container
```

## Production Deployment

### Best Practices
1. Use specific image tags: `node:18-alpine`
2. Don't run as root
3. Use multi-stage builds to reduce image size
4. Scan images for vulnerabilities
5. Use secrets management (not env vars)
6. Setup proper logging/monitoring

### Example Production docker-compose.yml
```yaml
services:
  linkforge-backend:
    image: linkforge-backend:1.0.0
    restart: always
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      # Use secrets instead of env vars
    secrets:
      - groq_api_key
      - email_password
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    depends_on:
      mongodb:
        condition: service_healthy

secrets:
  groq_api_key:
    external: true
  email_password:
    external: true
```

## Deploy to Cloud

### Heroku
```bash
heroku container:push web
heroku container:release web
```

### AWS ECS
```bash
aws ecr get-login-password | docker login --username AWS ...
docker build -t linkforge:latest .
docker tag linkforge:latest <account>.dkr.ecr.<region>.amazonaws.com/linkforge:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/linkforge:latest
```

### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT/linkforge
gcloud run deploy linkforge --image gcr.io/PROJECT/linkforge
```

### DigitalOcean App Platform
```bash
# Push to Docker Hub
docker build -t yourusername/linkforge .
docker push yourusername/linkforge

# Create app.yaml
# Deploy via DigitalOcean CLI
doctl apps create --spec app.yaml
```

## Monitoring in Docker

### View logs
```bash
docker-compose logs -f linkforge-backend
docker logs -f linkforge-backend
```

### Resource usage
```bash
docker stats
docker stats linkforge-backend
```

### Enter container shell
```bash
docker exec -it linkforge-backend /bin/sh
```

## Cleanup

```bash
# Remove containers
docker-compose down

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune
```

---

For more info: See README.md and QUICKSTART.md
