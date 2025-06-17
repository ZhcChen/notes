# Docker Compose 进阶

Docker Compose 是定义和运行多容器 Docker 应用程序的工具。本文档介绍 Docker Compose 的高级特性和最佳实践。

## 🎯 Compose 进阶概念

### Compose 文件版本

```yaml
# 推荐使用最新版本
version: '3.8'

# 或者省略版本（使用最新版本）
services:
  web:
    image: nginx
```

### 服务依赖管理

```yaml
services:
  web:
    image: nginx
    depends_on:
      - api
      - db
    
  api:
    image: my-api
    depends_on:
      - db
      - redis
    
  db:
    image: postgres:15
    
  redis:
    image: redis:alpine
```

### 健康检查依赖

```yaml
services:
  web:
    image: nginx
    depends_on:
      db:
        condition: service_healthy
    
  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

## 🔧 高级配置

### 环境变量管理

```yaml
# .env 文件
POSTGRES_VERSION=15
POSTGRES_PASSWORD=secret123
API_PORT=3000
NODE_ENV=production

# docker-compose.yml
services:
  db:
    image: postgres:${POSTGRES_VERSION}
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    
  api:
    build: .
    ports:
      - "${API_PORT}:3000"
    environment:
      - NODE_ENV=${NODE_ENV}
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/myapp
```

### 多环境配置

```yaml
# docker-compose.yml (基础配置)
services:
  web:
    image: nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    
  api:
    build: .
    environment:
      - NODE_ENV=development

# docker-compose.prod.yml (生产环境覆盖)
services:
  web:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    
  api:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
```

```bash
# 使用多个 compose 文件
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 扩展和继承

```yaml
# docker-compose.base.yml
x-common-variables: &common-variables
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: password

x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

services:
  db:
    image: postgres:15
    environment:
      <<: *common-variables
      POSTGRES_DB: myapp
    logging: *default-logging
    
  api:
    build: .
    environment:
      <<: *common-variables
      DATABASE_URL: postgresql://postgres:password@db:5432/myapp
    logging: *default-logging
```

## 🌐 网络配置

### 自定义网络

```yaml
services:
  web:
    image: nginx
    networks:
      - frontend
      - backend
    
  api:
    image: my-api
    networks:
      - backend
      - database
    
  db:
    image: postgres:15
    networks:
      - database

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
  database:
    driver: bridge
    internal: true  # 内部网络，无法访问外网
```

### 网络别名

```yaml
services:
  api:
    image: my-api
    networks:
      backend:
        aliases:
          - api-server
          - backend-api
    
  worker:
    image: my-worker
    networks:
      - backend
    # worker 可以通过 api-server 或 backend-api 访问 api 服务

networks:
  backend:
```

### 外部网络

```yaml
services:
  web:
    image: nginx
    networks:
      - default
      - external-network

networks:
  external-network:
    external: true
    name: my-existing-network
```

## 💾 存储管理

### 命名卷

```yaml
services:
  db:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - postgres-config:/etc/postgresql
    
  backup:
    image: my-backup-tool
    volumes:
      - postgres-data:/backup/source:ro
      - backup-storage:/backup/destination

volumes:
  postgres-data:
    driver: local
    driver_opts:
      type: ext4
      device: /dev/sdb1
  postgres-config:
  backup-storage:
    external: true
```

### 绑定挂载

```yaml
services:
  web:
    image: nginx
    volumes:
      - type: bind
        source: ./nginx.conf
        target: /etc/nginx/nginx.conf
        read_only: true
      - type: bind
        source: ./logs
        target: /var/log/nginx
        bind:
          propagation: shared
```

### tmpfs 挂载

```yaml
services:
  cache:
    image: redis:alpine
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=100m
      - /var/cache/redis:rw,size=50m
```

## 🔒 安全配置

### 用户和权限

```yaml
services:
  app:
    image: my-app
    user: "1000:1000"  # 非 root 用户
    
  db:
    image: postgres:15
    user: postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 资源限制

```yaml
services:
  api:
    image: my-api
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    
  db:
    image: postgres:15
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### 安全选项

```yaml
services:
  app:
    image: my-app
    security_opt:
      - no-new-privileges:true
      - apparmor:my-profile
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid
```

## 📊 监控和日志

### 健康检查

```yaml
services:
  web:
    image: nginx
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    
  api:
    image: my-api
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### 日志配置

```yaml
services:
  web:
    image: nginx
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=web"
    
  api:
    image: my-api
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://192.168.1.100:514"
        tag: "api-service"
```

## 🚀 部署策略

### 滚动更新

```yaml
services:
  api:
    image: my-api:${VERSION}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 5s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

### 蓝绿部署

```bash
#!/bin/bash
# blue-green-deploy.sh

# 部署绿色环境
docker-compose -f docker-compose.yml -f docker-compose.green.yml up -d

# 健康检查
./health-check.sh green

# 切换流量
./switch-traffic.sh green

# 停止蓝色环境
docker-compose -f docker-compose.yml -f docker-compose.blue.yml down
```

## 🔧 开发工具集成

### 开发环境配置

```yaml
# docker-compose.dev.yml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - ./src:/app/src:cached
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=*
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js 调试端口
    
  db:
    image: postgres:15
    ports:
      - "5432:5432"  # 暴露端口用于开发调试
```

### 测试环境

```yaml
# docker-compose.test.yml
services:
  api:
    build: .
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://postgres:password@test-db:5432/test
    depends_on:
      - test-db
    
  test-db:
    image: postgres:15
    environment:
      POSTGRES_DB: test
      POSTGRES_PASSWORD: password
    tmpfs:
      - /var/lib/postgresql/data  # 使用内存存储提高测试速度
```

## 📈 性能优化

### 构建优化

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      cache_from:
        - my-api:latest
      args:
        - NODE_ENV=production
        - BUILD_DATE=${BUILD_DATE}
```

### 资源优化

```yaml
services:
  web:
    image: nginx:alpine  # 使用轻量级镜像
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    
  cache:
    image: redis:alpine
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
```

## 🛠️ 实用脚本

### 管理脚本

```bash
#!/bin/bash
# manage.sh

case "$1" in
  start)
    docker-compose up -d
    ;;
  stop)
    docker-compose down
    ;;
  restart)
    docker-compose restart
    ;;
  logs)
    docker-compose logs -f ${2:-}
    ;;
  scale)
    docker-compose up -d --scale ${2}=${3}
    ;;
  backup)
    docker-compose exec db pg_dump -U postgres myapp > backup.sql
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|scale|backup}"
    exit 1
    ;;
esac
```

### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

services=("web" "api" "db")

for service in "${services[@]}"; do
  if docker-compose ps $service | grep -q "Up (healthy)"; then
    echo "✅ $service is healthy"
  else
    echo "❌ $service is not healthy"
    exit 1
  fi
done

echo "🎉 All services are healthy"
```

通过这些高级特性和最佳实践，您可以构建更加健壮、可维护和可扩展的多容器应用程序。
