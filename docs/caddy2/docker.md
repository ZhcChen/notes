# Docker 部署指南

本章将详细介绍如何使用 Docker 部署 Caddy，包括单容器部署、Docker Compose 编排、集群部署等场景。

## 🐳 基础 Docker 部署

### 官方镜像

```bash
# 拉取官方镜像
docker pull caddy:latest

# 查看可用标签
docker pull caddy:2-alpine
docker pull caddy:2-builder
```

### 简单运行

```bash
# 基础运行
docker run -d \
  --name caddy \
  -p 80:80 \
  -p 443:443 \
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
  -v $PWD/site:/srv \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:latest
```

### 自定义 Dockerfile

```dockerfile
# Dockerfile
FROM caddy:2-alpine

# 安装额外工具
RUN apk add --no-cache curl jq

# 复制配置文件
COPY Caddyfile /etc/caddy/Caddyfile

# 复制网站文件
COPY --chown=caddy:caddy ./site /srv

# 设置工作目录
WORKDIR /srv

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:2019/config/ || exit 1

# 暴露端口
EXPOSE 80 443 2019

# 启动命令
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
```

## 📋 Docker Compose 配置

### 基础 Compose 文件

```yaml
# docker-compose.yml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    
    ports:
      - "80:80"
      - "443:443"
      - "2019:2019"  # 管理端口
    
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./site:/srv
      - caddy_data:/data
      - caddy_config:/config
    
    environment:
      - CADDY_ADMIN=localhost:2019
    
    networks:
      - caddy

volumes:
  caddy_data:
    external: true
  caddy_config:

networks:
  caddy:
    external: true
```

### 完整的 Web 应用栈

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Caddy 反向代理
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./site:/srv
      - caddy_data:/data
      - caddy_config:/config
    
    environment:
      - CADDY_ADMIN=localhost:2019
      - DOMAIN=${DOMAIN:-localhost}
    
    depends_on:
      - app
      - api
    
    networks:
      - frontend
      - backend
  
  # 前端应用
  app:
    image: nginx:alpine
    container_name: app
    restart: unless-stopped
    
    volumes:
      - ./frontend:/usr/share/nginx/html
    
    networks:
      - frontend
  
  # 后端 API
  api:
    image: node:18-alpine
    container_name: api
    restart: unless-stopped
    
    working_dir: /app
    command: npm start
    
    volumes:
      - ./backend:/app
    
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    
    depends_on:
      - db
    
    networks:
      - backend
  
  # 数据库
  db:
    image: postgres:15-alpine
    container_name: db
    restart: unless-stopped
    
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
    networks:
      - backend

volumes:
  caddy_data:
  caddy_config:
  postgres_data:

networks:
  frontend:
  backend:
```

### 对应的 Caddyfile

```caddyfile
{
    email admin@{$DOMAIN}
    admin localhost:2019
}

# 主站点
{$DOMAIN:localhost} {
    reverse_proxy app:80
}

# API 服务
api.{$DOMAIN:localhost} {
    reverse_proxy api:3000
}

# 管理面板
admin.{$DOMAIN:localhost} {
    basicauth {
        admin $2a$14$hgl486...
    }
    
    reverse_proxy caddy:2019
}
```

## 🔧 高级 Docker 配置

### 多阶段构建

```dockerfile
# 多阶段 Dockerfile
# 构建阶段
FROM caddy:2-builder AS builder

# 安装插件
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare \
    --with github.com/greenpau/caddy-security \
    --with github.com/mholt/caddy-ratelimit

# 运行阶段
FROM caddy:2-alpine

# 复制自定义构建的 Caddy
COPY --from=builder /usr/bin/caddy /usr/bin/caddy

# 复制配置
COPY Caddyfile /etc/caddy/Caddyfile
COPY --chown=caddy:caddy ./site /srv

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD caddy validate --config /etc/caddy/Caddyfile || exit 1

EXPOSE 80 443
```

### 环境配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy-prod
    restart: unless-stopped
    
    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    
    # 网络优化
    sysctls:
      - net.core.somaxconn=65535
      - net.ipv4.tcp_keepalive_time=1200
    
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      - ./Caddyfile.prod:/etc/caddy/Caddyfile
      - ./site:/srv
      - caddy_data:/data
      - caddy_config:/config
      - /var/log/caddy:/var/log/caddy
    
    environment:
      - CADDY_ADMIN=off  # 生产环境关闭管理接口
      - DOMAIN=example.com
      - EMAIL=admin@example.com
    
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
    
    networks:
      - web

volumes:
  caddy_data:
    external: true
  caddy_config:

networks:
  web:
    external: true
```

## 🌐 集群部署

### Docker Swarm 配置

```yaml
# docker-stack.yml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.role == worker
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
    
    ports:
      - target: 80
        published: 80
        protocol: tcp
        mode: ingress
      - target: 443
        published: 443
        protocol: tcp
        mode: ingress
    
    volumes:
      - type: bind
        source: ./Caddyfile
        target: /etc/caddy/Caddyfile
        read_only: true
      - type: volume
        source: caddy_data
        target: /data
      - type: volume
        source: caddy_config
        target: /config
    
    environment:
      - CADDY_ADMIN=off
    
    networks:
      - web
      - backend

volumes:
  caddy_data:
    driver: local
  caddy_config:
    driver: local

networks:
  web:
    external: true
  backend:
    external: true
```

### Kubernetes 部署

```yaml
# caddy-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: caddy
  labels:
    app: caddy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: caddy
  template:
    metadata:
      labels:
        app: caddy
    spec:
      containers:
      - name: caddy
        image: caddy:2-alpine
        ports:
        - containerPort: 80
        - containerPort: 443
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        volumeMounts:
        - name: caddyfile
          mountPath: /etc/caddy/Caddyfile
          subPath: Caddyfile
        - name: caddy-data
          mountPath: /data
        - name: caddy-config
          mountPath: /config
        
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
      
      volumes:
      - name: caddyfile
        configMap:
          name: caddy-config
      - name: caddy-data
        persistentVolumeClaim:
          claimName: caddy-data-pvc
      - name: caddy-config
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: caddy-service
spec:
  selector:
    app: caddy
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: https
    port: 443
    targetPort: 443
  type: LoadBalancer

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: caddy-config
data:
  Caddyfile: |
    {
        email admin@example.com
        admin off
    }
    
    example.com {
        reverse_proxy backend-service:8080
    }

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: caddy-data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

## 🔄 CI/CD 集成

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Caddy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          myapp/caddy:latest
          myapp/caddy:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/myapp
          docker-compose pull
          docker-compose up -d
          docker system prune -f
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE/caddy
  DOCKER_TAG: $CI_COMMIT_SHA

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $DOCKER_IMAGE:$DOCKER_TAG .
    - docker push $DOCKER_IMAGE:$DOCKER_TAG
  only:
    - main

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
        cd /opt/myapp &&
        docker-compose pull &&
        docker-compose up -d &&
        docker system prune -f"
  only:
    - main
```

## 📊 监控和日志

### 日志收集

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./site:/srv
      - caddy_data:/data
      - caddy_config:/config
    
    logging:
      driver: "fluentd"
      options:
        fluentd-address: localhost:24224
        tag: caddy.access
    
    networks:
      - web
  
  # Fluentd 日志收集
  fluentd:
    image: fluent/fluentd:v1.14-debian-1
    container_name: fluentd
    restart: unless-stopped
    
    ports:
      - "24224:24224"
      - "24224:24224/udp"
    
    volumes:
      - ./fluentd/conf:/fluentd/etc
      - ./logs:/var/log/fluentd
    
    networks:
      - web
  
  # Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    container_name: elasticsearch
    restart: unless-stopped
    
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    
    volumes:
      - es_data:/usr/share/elasticsearch/data
    
    networks:
      - web

volumes:
  caddy_data:
  caddy_config:
  es_data:

networks:
  web:
```

### Prometheus 监控

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    
    ports:
      - "80:80"
      - "443:443"
      - "2019:2019"
    
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./site:/srv
      - caddy_data:/data
      - caddy_config:/config
    
    networks:
      - web
      - monitoring
  
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    
    ports:
      - "9090:9090"
    
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    
    networks:
      - monitoring
  
  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    
    ports:
      - "3000:3000"
    
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    
    volumes:
      - grafana_data:/var/lib/grafana
    
    networks:
      - monitoring

volumes:
  caddy_data:
  caddy_config:
  prometheus_data:
  grafana_data:

networks:
  web:
  monitoring:
```

---

通过 Docker 部署 Caddy 可以实现快速、可扩展的容器化部署。选择合适的部署方式取决于您的具体需求和基础设施。 🐳
