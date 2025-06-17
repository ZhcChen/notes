# Docker 生产环境部署

生产环境部署需要考虑高可用性、安全性、监控和维护等多个方面。本文档提供完整的生产环境部署指南。

## 🎯 生产环境准备

### 环境规划

| 环境 | 用途 | 配置要求 |
|------|------|----------|
| 开发环境 | 日常开发测试 | 基础配置 |
| 测试环境 | 集成测试 | 接近生产配置 |
| 预生产环境 | 上线前验证 | 生产配置 |
| 生产环境 | 正式服务 | 高可用配置 |

### 基础设施要求

```yaml
# 生产环境最低要求
hardware:
  cpu: 4 cores
  memory: 8GB
  storage: 100GB SSD
  network: 1Gbps

software:
  os: Ubuntu 20.04 LTS / CentOS 8
  docker: 24.0+
  docker-compose: 2.0+
  
monitoring:
  - Prometheus
  - Grafana
  - AlertManager
  
logging:
  - ELK Stack / Loki
  - Log rotation
  
backup:
  - Database backup
  - Volume backup
  - Configuration backup
```

## 🏗️ 生产环境配置

### Docker 守护进程配置

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "live-restore": true,
  "userland-proxy": false,
  "experimental": false,
  "metrics-addr": "127.0.0.1:9323",
  "default-ulimits": {
    "nofile": {
      "Hard": 64000,
      "Name": "nofile",
      "Soft": 64000
    }
  }
}
```

### 系统优化配置

```bash
# /etc/sysctl.conf
# 网络优化
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 3

# 文件描述符限制
fs.file-max = 2097152

# 内存管理
vm.swappiness = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# 应用配置
sysctl -p
```

```bash
# /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
```

## 📦 生产环境 Docker Compose

### 主应用栈

```yaml
# docker-compose.prod.yml
version: '3.8'

x-common-variables: &common-variables
  TZ: Asia/Shanghai
  NODE_ENV: production

x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service,environment"

x-restart-policy: &restart-policy
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
    window: 120s

services:
  nginx:
    image: nginx:1.24-alpine
    container_name: nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx-logs:/var/log/nginx
    environment:
      <<: *common-variables
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
      <<: *restart-policy
    networks:
      - frontend
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    
  api:
    image: my-api:${VERSION:-latest}
    container_name: api-prod
    restart: unless-stopped
    environment:
      <<: *common-variables
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      JWT_SECRET_FILE: /run/secrets/jwt_secret
    volumes:
      - api-uploads:/app/uploads
    logging: *default-logging
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '1.0'
          memory: 512M
      <<: *restart-policy
    networks:
      - frontend
      - backend
    secrets:
      - jwt_secret
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    
  db:
    image: postgres:15-alpine
    container_name: postgres-prod
    restart: unless-stopped
    environment:
      <<: *common-variables
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - postgres-backups:/backups
      - ./postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
      <<: *restart-policy
    networks:
      - backend
    secrets:
      - db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 30s
    
  redis:
    image: redis:7-alpine
    container_name: redis-prod
    restart: unless-stopped
    command: redis-server /etc/redis/redis.conf
    volumes:
      - redis-data:/data
      - ./redis/redis.conf:/etc/redis/redis.conf:ro
    environment:
      <<: *common-variables
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
      <<: *restart-policy
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  postgres-data:
    driver: local
    driver_opts:
      type: ext4
      device: /dev/disk/by-label/postgres-data
  postgres-backups:
    driver: local
  redis-data:
    driver: local
  api-uploads:
    driver: local
  nginx-logs:
    driver: local

networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  backend:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.21.0.0/16

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

### 监控栈

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/rules:/etc/prometheus/rules:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--storage.tsdb.retention.size=10GB'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    networks:
      - monitoring
    
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD_FILE=/run/secrets/grafana_password
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    networks:
      - monitoring
    secrets:
      - grafana_password
    
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager-data:/alertmanager
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:

networks:
  monitoring:
    external: true

secrets:
  grafana_password:
    file: ./secrets/grafana_password.txt
```

## 🔄 CI/CD 集成

### GitHub Actions 部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Registry
        uses: docker/login-action@v2
        with:
          registry: registry.example.com
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            registry.example.com/my-app:${{ github.ref_name }}
            registry.example.com/my-app:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/myapp
            export VERSION=${{ github.ref_name }}
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
      
      - name: Health check
        run: |
          sleep 30
          curl -f https://api.example.com/health || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 蓝绿部署脚本

```bash
#!/bin/bash
# blue-green-deploy.sh

set -e

VERSION=${1:-latest}
CURRENT_ENV=$(docker-compose -f docker-compose.prod.yml ps --services | head -1 | grep -o 'blue\|green' || echo 'blue')
NEW_ENV=$([ "$CURRENT_ENV" = "blue" ] && echo "green" || echo "blue")

echo "Current environment: $CURRENT_ENV"
echo "Deploying to: $NEW_ENV"
echo "Version: $VERSION"

# 部署新环境
export DEPLOY_ENV=$NEW_ENV
export VERSION=$VERSION
docker-compose -f docker-compose.prod.yml -f docker-compose.$NEW_ENV.yml up -d

# 健康检查
echo "Waiting for health check..."
for i in {1..30}; do
  if curl -f http://localhost:8080/health; then
    echo "Health check passed"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Health check failed"
    exit 1
  fi
  sleep 10
done

# 切换流量
echo "Switching traffic to $NEW_ENV"
./switch-traffic.sh $NEW_ENV

# 停止旧环境
echo "Stopping $CURRENT_ENV environment"
export DEPLOY_ENV=$CURRENT_ENV
docker-compose -f docker-compose.prod.yml -f docker-compose.$CURRENT_ENV.yml down

echo "Deployment completed successfully"
```

## 📊 监控和告警

### Prometheus 告警规则

```yaml
# prometheus/rules/production-alerts.yml
groups:
- name: production-alerts
  rules:
  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.instance }} is down"
      description: "{{ $labels.instance }} has been down for more than 1 minute."
  
  - alert: HighCPUUsage
    expr: rate(container_cpu_usage_seconds_total[5m]) * 100 > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage on {{ $labels.name }}"
      description: "Container {{ $labels.name }} CPU usage is above 80% for more than 5 minutes."
  
  - alert: HighMemoryUsage
    expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100 > 90
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High memory usage on {{ $labels.name }}"
      description: "Container {{ $labels.name }} memory usage is above 90%."
  
  - alert: DiskSpaceLow
    expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Low disk space on {{ $labels.instance }}"
      description: "Disk space is below 10% on {{ $labels.instance }}."
```

## 🔐 安全配置

### SSL/TLS 配置

```nginx
# nginx/nginx.conf
server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    location / {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 💾 备份策略

### 数据库备份

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="postgres-prod"

mkdir -p $BACKUP_DIR

# 创建备份
docker exec $CONTAINER_NAME pg_dump -U postgres -d myapp | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 保留最近30天的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# 上传到云存储
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://my-backups/postgres/

echo "Backup completed: backup_$DATE.sql.gz"
```

### 自动化备份

```yaml
# 添加到 crontab
0 2 * * * /opt/scripts/backup-database.sh
0 3 * * * /opt/scripts/backup-volumes.sh
0 4 * * * docker system prune -f
```

## 🚀 最佳实践

### 1. 环境隔离

```bash
# 使用不同的 compose 文件
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. 资源监控

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
    reservations:
      cpus: '1.0'
      memory: 512M
```

### 3. 健康检查

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 4. 日志管理

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 5. 安全配置

```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
read_only: true
```

通过遵循这些生产环境部署最佳实践，您可以构建稳定、安全、高性能的容器化应用系统。
