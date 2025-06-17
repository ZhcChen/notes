# Docker 性能优化

容器性能优化是确保应用高效运行的关键。本文档介绍 Docker 性能调优的方法、工具和最佳实践。

## 📊 性能监控基础

### 关键性能指标

| 指标类型 | 具体指标 | 监控工具 |
|---------|---------|----------|
| CPU | 使用率、负载、上下文切换 | docker stats, htop |
| 内存 | 使用量、缓存、交换 | docker stats, free |
| 磁盘 | I/O 吞吐量、延迟、使用率 | iostat, iotop |
| 网络 | 带宽、延迟、丢包率 | iftop, netstat |
| 容器 | 启动时间、重启次数 | docker events |

### 性能监控命令

```bash
# 实时监控容器资源使用
docker stats

# 查看容器详细信息
docker inspect container-name

# 监控容器进程
docker exec container-name top

# 查看容器网络统计
docker exec container-name netstat -i

# 监控磁盘 I/O
docker exec container-name iostat -x 1

# 查看内存使用详情
docker exec container-name cat /proc/meminfo
```

## 🏗️ 镜像优化

### 镜像大小优化

```dockerfile
# ❌ 未优化的 Dockerfile
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN pip3 install flask
COPY . /app
WORKDIR /app
CMD ["python3", "app.py"]

# ✅ 优化后的 Dockerfile
FROM python:3.9-alpine AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.9-alpine
RUN adduser -D -s /bin/sh appuser
WORKDIR /app
COPY --from=builder /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .
USER appuser
ENV PATH=/home/appuser/.local/bin:$PATH
CMD ["python", "app.py"]
```

### 多阶段构建优化

```dockerfile
# 构建阶段 - 包含完整开发环境
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

# 运行阶段 - 最小化镜像
FROM node:16-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### 层缓存优化

```dockerfile
# ✅ 优化缓存利用
FROM node:16-alpine
WORKDIR /app

# 先复制依赖文件，利用缓存
COPY package*.json ./
RUN npm ci --only=production

# 再复制源代码
COPY . .
RUN npm run build

# ❌ 缓存利用不佳
FROM node:16-alpine
WORKDIR /app
COPY . .  # 任何文件变化都会使后续层失效
RUN npm ci --only=production
RUN npm run build
```

## 🚀 容器运行时优化

### 资源限制配置

```yaml
services:
  web:
    image: nginx:alpine
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    
  api:
    image: my-api
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '1.0'
          memory: 512M
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
      nproc: 4096
```

### CPU 优化

```bash
# CPU 亲和性设置
docker run -d --cpuset-cpus="0,1" --name cpu-bound-app my-app

# CPU 权重设置
docker run -d --cpu-shares=1024 --name high-priority-app my-app
docker run -d --cpu-shares=512 --name low-priority-app my-app

# CPU 配额设置
docker run -d --cpu-period=100000 --cpu-quota=50000 my-app  # 50% CPU
```

### 内存优化

```yaml
services:
  app:
    image: my-app
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    # 禁用 swap
    mem_swappiness: 0
    # 内存回收策略
    oom_kill_disable: false
```

```bash
# 内存使用监控
docker exec container-name cat /sys/fs/cgroup/memory/memory.usage_in_bytes
docker exec container-name cat /sys/fs/cgroup/memory/memory.limit_in_bytes

# 内存压力测试
docker run --rm -it --memory=100m progrium/stress --vm 1 --vm-bytes 150M
```

## 💾 存储性能优化

### 存储驱动选择

```json
{
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true",
    "overlay2.size=20G"
  ]
}
```

### 数据卷优化

```yaml
services:
  db:
    image: postgres:15
    volumes:
      # 使用命名卷提高性能
      - postgres-data:/var/lib/postgresql/data
      # 临时文件使用 tmpfs
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 1G
    
  app:
    image: my-app
    volumes:
      # 绑定挂载使用 cached 模式（macOS）
      - type: bind
        source: ./app
        target: /app
        consistency: cached

volumes:
  postgres-data:
    driver: local
    driver_opts:
      type: ext4
      device: /dev/nvme0n1p1  # 使用 SSD
```

### I/O 优化

```bash
# 设置 I/O 权重
docker run -d --blkio-weight=600 high-io-app
docker run -d --blkio-weight=300 low-io-app

# 限制读写速度
docker run -d \
  --device-read-bps /dev/sda:1mb \
  --device-write-bps /dev/sda:1mb \
  my-app

# 监控 I/O 性能
docker exec container-name iostat -x 1
```

## 🌐 网络性能优化

### 网络驱动选择

```yaml
services:
  web:
    image: nginx
    networks:
      - frontend
    
  api:
    image: my-api
    networks:
      - frontend
      - backend

networks:
  frontend:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: frontend-br
      com.docker.network.bridge.enable_ip_masquerade: "true"
  
  backend:
    driver: overlay
    driver_opts:
      encrypted: "true"
```

### 高性能网络配置

```bash
# 使用 host 网络模式（最高性能）
docker run -d --network host high-performance-app

# 优化网络参数
docker run -d \
  --sysctl net.core.somaxconn=65535 \
  --sysctl net.ipv4.tcp_keepalive_time=1200 \
  --ulimit nofile=65536:65536 \
  web-server
```

### 负载均衡优化

```yaml
# HAProxy 负载均衡
services:
  haproxy:
    image: haproxy:alpine
    ports:
      - "80:80"
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    sysctls:
      - net.ipv4.ip_unprivileged_port_start=0
    
  app:
    image: my-app
    deploy:
      replicas: 3
    networks:
      - backend
```

```
# haproxy.cfg
global
    maxconn 4096
    tune.ssl.default-dh-param 2048

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog

frontend web_frontend
    bind *:80
    default_backend web_servers

backend web_servers
    balance roundrobin
    option httpchk GET /health
    server app1 app_1:3000 check
    server app2 app_2:3000 check
    server app3 app_3:3000 check
```

## 📈 应用层优化

### 应用启动优化

```dockerfile
# Java 应用 JVM 优化
FROM openjdk:11-jre-slim
ENV JAVA_OPTS="-Xms512m -Xmx1g -XX:+UseG1GC -XX:+UseContainerSupport"
COPY app.jar /app.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app.jar"]

# Node.js 应用优化
FROM node:16-alpine
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "--max-old-space-size=1024", "server.js"]
```

### 连接池优化

```javascript
// Node.js 数据库连接池
const { Pool } = require('pg');

const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
  max: 20,                    // 最大连接数
  idleTimeoutMillis: 30000,   // 空闲超时
  connectionTimeoutMillis: 2000, // 连接超时
});

// Redis 连接池
const redis = require('redis');
const client = redis.createClient({
  host: 'redis',
  port: 6379,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});
```

## 🔧 性能测试和基准测试

### 容器性能测试

```bash
#!/bin/bash
# performance-test.sh

CONTAINER_NAME="my-app"
TEST_DURATION=60

echo "Starting performance test for $CONTAINER_NAME"

# CPU 压力测试
docker exec $CONTAINER_NAME stress --cpu 2 --timeout ${TEST_DURATION}s &

# 内存压力测试
docker exec $CONTAINER_NAME stress --vm 1 --vm-bytes 512M --timeout ${TEST_DURATION}s &

# I/O 压力测试
docker exec $CONTAINER_NAME stress --io 4 --timeout ${TEST_DURATION}s &

# 监控资源使用
for i in $(seq 1 $TEST_DURATION); do
  docker stats --no-stream $CONTAINER_NAME >> performance-log.txt
  sleep 1
done

echo "Performance test completed"
```

### 基准测试脚本

```bash
#!/bin/bash
# benchmark.sh

# HTTP 性能测试
echo "HTTP Performance Test"
ab -n 10000 -c 100 http://localhost:8080/

# 数据库性能测试
echo "Database Performance Test"
docker exec db pgbench -i -s 10 myapp
docker exec db pgbench -c 10 -j 2 -t 1000 myapp

# Redis 性能测试
echo "Redis Performance Test"
docker exec redis redis-benchmark -h localhost -p 6379 -n 100000
```

## 📊 性能监控和分析

### Prometheus 性能指标

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    
  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 性能分析工具

```bash
# 使用 perf 分析容器性能
docker exec -it --privileged container-name perf top

# 使用 strace 跟踪系统调用
docker exec -it container-name strace -p 1

# 使用 tcpdump 分析网络流量
docker exec -it container-name tcpdump -i eth0

# 内存泄漏检测
docker exec -it container-name valgrind --tool=memcheck --leak-check=full ./app
```

## 🚀 最佳实践

### 1. 镜像优化

```dockerfile
# 使用多阶段构建
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

### 2. 资源配置

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '1.0'
          memory: 512M
    ulimits:
      nofile: 65536
      nproc: 4096
```

### 3. 存储优化

```yaml
volumes:
  app-data:
    driver: local
    driver_opts:
      type: ext4
      device: /dev/nvme0n1p1
```

### 4. 网络优化

```yaml
networks:
  app-network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.enable_ip_masquerade: "true"
```

### 5. 监控配置

```bash
# 定期性能检查
*/5 * * * * docker stats --no-stream >> /var/log/docker-performance.log
```

通过系统性的性能优化，您可以显著提升容器化应用的运行效率和用户体验。
