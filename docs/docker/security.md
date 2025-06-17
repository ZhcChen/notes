# Docker 安全实践

容器安全是现代应用部署的重要组成部分。本文档介绍 Docker 安全的最佳实践、漏洞防护和安全配置。

## 🔒 安全基础概念

### 容器安全威胁

| 威胁类型 | 描述 | 影响 |
|---------|------|------|
| 镜像漏洞 | 基础镜像包含已知漏洞 | 系统被攻击 |
| 权限提升 | 容器获得主机 root 权限 | 主机被控制 |
| 资源滥用 | 容器消耗过多系统资源 | 服务拒绝 |
| 数据泄露 | 敏感数据暴露 | 信息安全 |
| 网络攻击 | 容器间恶意通信 | 横向渗透 |

### 安全原则

- **最小权限原则**：只给予必要的权限
- **深度防御**：多层安全防护
- **零信任模型**：不信任任何组件
- **持续监控**：实时安全监控

## 🏗️ 镜像安全

### 选择安全的基础镜像

```dockerfile
# ✅ 使用官方镜像
FROM node:16-alpine

# ✅ 使用特定版本标签
FROM nginx:1.24.0-alpine

# ❌ 避免使用 latest 标签
FROM ubuntu:latest

# ✅ 使用最小化镜像
FROM alpine:3.18
FROM scratch  # 对于静态编译的应用

# ✅ 使用 distroless 镜像
FROM gcr.io/distroless/java:11
```

### 镜像漏洞扫描

```bash
# 使用 Docker Scout 扫描
docker scout cves my-app:latest

# 使用 Trivy 扫描
trivy image my-app:latest

# 使用 Clair 扫描
clairctl analyze my-app:latest

# 使用 Snyk 扫描
snyk container test my-app:latest
```

### 安全的 Dockerfile 编写

```dockerfile
# 多阶段构建减少攻击面
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# 运行阶段使用最小镜像
FROM node:16-alpine
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制文件并设置权限
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# 切换到非 root 用户
USER nextjs

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

## 👤 用户和权限管理

### 非 root 用户运行

```dockerfile
# 创建专用用户
FROM alpine:3.18
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# 设置文件权限
COPY --chown=appuser:appgroup app /app
WORKDIR /app

# 切换用户
USER appuser
CMD ["./app"]
```

```yaml
# Docker Compose 中指定用户
services:
  app:
    image: my-app
    user: "1001:1001"
    
  db:
    image: postgres:15
    user: postgres
    environment:
      POSTGRES_USER: postgres
```

### 文件系统权限

```dockerfile
# 只读文件系统
FROM alpine:3.18
RUN adduser -D -s /bin/sh appuser
USER appuser
WORKDIR /app
COPY --chown=appuser:appuser app .
# 运行时使用 --read-only 标志
```

```bash
# 运行只读容器
docker run -d --read-only --tmpfs /tmp --tmpfs /var/run my-app
```

## 🔐 密钥和配置管理

### Docker Secrets

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: my-app
    secrets:
      - db_password
      - api_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - API_KEY_FILE=/run/secrets/api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    external: true
```

### 环境变量安全

```dockerfile
# ❌ 避免在 Dockerfile 中硬编码密钥
ENV API_KEY=secret123

# ✅ 使用构建参数和运行时环境变量
ARG BUILD_ENV
ENV NODE_ENV=${BUILD_ENV}
```

```yaml
# 使用外部配置文件
services:
  app:
    image: my-app
    env_file:
      - .env.production
    environment:
      - DATABASE_URL_FILE=/run/secrets/db_url
    secrets:
      - db_url
```

### 配置加密

```bash
# 使用 sops 加密配置文件
sops -e -i secrets.yaml

# 在容器中解密
docker run -v $(pwd)/secrets.yaml:/secrets.yaml \
  -e SOPS_AGE_KEY_FILE=/keys/age.key \
  my-app sops -d /secrets.yaml
```

## 🌐 网络安全

### 网络隔离

```yaml
services:
  web:
    image: nginx
    networks:
      - frontend
    ports:
      - "80:80"
  
  api:
    image: my-api
    networks:
      - frontend
      - backend
    # 不暴露端口到主机
  
  db:
    image: postgres:15
    networks:
      - backend
    # 完全隔离，只能通过 API 访问

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 内部网络，无法访问外网
```

### TLS 加密

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    environment:
      - SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
      - SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🛡️ 容器运行时安全

### 安全选项配置

```yaml
services:
  app:
    image: my-app
    security_opt:
      - no-new-privileges:true  # 禁止权限提升
      - apparmor:my-profile     # 使用 AppArmor 配置文件
    cap_drop:
      - ALL                     # 删除所有 capabilities
    cap_add:
      - NET_BIND_SERVICE        # 只添加必要的 capabilities
    read_only: true             # 只读文件系统
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=100m
```

### 资源限制

```yaml
services:
  app:
    image: my-app
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
          pids: 100           # 限制进程数
        reservations:
          cpus: '0.5'
          memory: 512M
    ulimits:
      nofile:
        soft: 1024
        hard: 2048
      nproc: 64
```

### 系统调用限制

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": ["read", "write", "open", "close", "stat", "fstat"],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

```bash
# 使用 seccomp 配置文件
docker run --security-opt seccomp=seccomp-profile.json my-app
```

## 🔍 安全监控

### 容器行为监控

```yaml
# Falco 安全监控
services:
  falco:
    image: falcosecurity/falco:latest
    privileged: true
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - /dev:/host/dev
      - /proc:/host/proc:ro
      - /boot:/host/boot:ro
      - /lib/modules:/host/lib/modules:ro
      - /usr:/host/usr:ro
      - /etc:/host/etc:ro
    environment:
      - FALCO_GRPC_ENABLED=true
```

### 日志安全分析

```yaml
# ELK Stack 安全日志分析
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=changeme
    
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/security-pipeline.conf:/usr/share/logstash/pipeline/logstash.conf
    
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_USERNAME=elastic
      - ELASTICSEARCH_PASSWORD=changeme
```

## 🚨 漏洞管理

### 定期安全扫描

```bash
#!/bin/bash
# security-scan.sh

IMAGES=("my-app:latest" "nginx:alpine" "postgres:15")
REPORT_DIR="./security-reports"

mkdir -p $REPORT_DIR

for image in "${IMAGES[@]}"; do
    echo "Scanning $image..."
    
    # Trivy 扫描
    trivy image --format json --output "$REPORT_DIR/${image//[:\/]/_}_trivy.json" $image
    
    # Docker Scout 扫描
    docker scout cves --format json --output "$REPORT_DIR/${image//[:\/]/_}_scout.json" $image
    
    # 检查高危漏洞
    high_vulns=$(trivy image --severity HIGH,CRITICAL --format json $image | jq '.Results[].Vulnerabilities | length')
    
    if [ "$high_vulns" -gt 0 ]; then
        echo "⚠️  Found $high_vulns high/critical vulnerabilities in $image"
        # 发送告警
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Security Alert: $high_vulns high/critical vulnerabilities found in $image\"}" \
            $WEBHOOK_URL
    fi
done
```

### 自动化安全更新

```yaml
# Watchtower 自动更新
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_SCHEDULE=0 0 4 * * *  # 每天凌晨4点检查更新
      - WATCHTOWER_NOTIFICATIONS=slack
      - WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## 🔧 安全工具集成

### 安全扫描 CI/CD 集成

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t my-app:${{ github.sha }} .
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'my-app:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Fail on high vulnerabilities
        run: |
          trivy image --exit-code 1 --severity HIGH,CRITICAL my-app:${{ github.sha }}
```

## 🚀 最佳实践总结

### 1. 镜像安全

```dockerfile
# 安全的 Dockerfile 模板
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM node:16-alpine
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
USER nextjs
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### 2. 运行时安全

```yaml
services:
  app:
    image: my-app
    user: "1001:1001"
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    tmpfs:
      - /tmp:rw,noexec,nosuid
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### 3. 网络安全

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### 4. 密钥管理

```yaml
secrets:
  db_password:
    external: true
  api_key:
    file: ./secrets/api_key.txt
```

### 5. 持续监控

```bash
# 定期安全检查
0 2 * * * /usr/local/bin/security-scan.sh
0 4 * * * docker system prune -f
```

通过实施这些安全实践，您可以显著提高容器化应用的安全性，保护系统免受各种威胁。
