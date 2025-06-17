# Docker 健康检查

健康检查是确保容器正常运行的重要机制。本文档介绍 Docker 健康检查的配置、最佳实践和故障排除。

## 🏥 健康检查概述

### 什么是健康检查

健康检查是一种机制，用于：
- **监控容器状态**：定期检查容器是否正常运行
- **自动恢复**：发现问题时自动重启容器
- **负载均衡**：从负载均衡器中移除不健康的容器
- **服务发现**：确保只有健康的服务被发现

### 健康状态

Docker 容器有三种健康状态：
- **healthy**：健康检查通过
- **unhealthy**：健康检查失败
- **starting**：容器启动中，还未开始健康检查

## 🔧 基础健康检查

### Dockerfile 中定义健康检查

```dockerfile
# 基础 HTTP 健康检查
FROM nginx:alpine
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Node.js 应用健康检查
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node healthcheck.js || exit 1
EXPOSE 3000
CMD ["npm", "start"]

# 数据库健康检查
FROM postgres:15
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD pg_isready -U postgres || exit 1

# 自定义脚本健康检查
FROM alpine:latest
RUN apk add --no-cache curl
COPY health-check.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/health-check.sh
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD /usr/local/bin/health-check.sh
```

### 运行时健康检查

```bash
# 运行容器时添加健康检查
docker run -d --name web \
  --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=60s \
  nginx

# 禁用健康检查
docker run -d --name app --no-healthcheck my-app

# 查看容器健康状态
docker ps
docker inspect web | grep -A 10 Health
```

## 📋 Docker Compose 健康检查

### 基础配置

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    ports:
      - "80:80"
    
  api:
    image: my-api:latest
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
    ports:
      - "3000:3000"
    
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 30s
    
  redis:
    image: redis:alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3
```

### 依赖健康检查

```yaml
services:
  web:
    image: nginx:alpine
    depends_on:
      api:
        condition: service_healthy
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
    
  api:
    image: my-api:latest
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 5s
      retries: 5
    
  redis:
    image: redis:alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3
```

## 🏗️ 应用级健康检查

### HTTP 健康检查端点

```javascript
// Node.js Express 健康检查
const express = require('express');
const app = express();

// 基础健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 详细健康检查
app.get('/health/detailed', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    external_api: await checkExternalAPI()
  };
  
  const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
});

async function checkDatabase() {
  try {
    await db.query('SELECT 1');
    return { status: 'healthy', message: 'Database connection OK' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

async function checkRedis() {
  try {
    await redis.ping();
    return { status: 'healthy', message: 'Redis connection OK' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}
```

### Python Flask 健康检查

```python
from flask import Flask, jsonify
import psycopg2
import redis
import requests
from datetime import datetime

app = Flask(__name__)

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'my-api'
    })

@app.route('/health/detailed')
def detailed_health_check():
    checks = {
        'database': check_database(),
        'redis': check_redis(),
        'external_service': check_external_service()
    }
    
    is_healthy = all(check['status'] == 'healthy' for check in checks.values())
    
    return jsonify({
        'status': 'healthy' if is_healthy else 'unhealthy',
        'checks': checks,
        'timestamp': datetime.utcnow().isoformat()
    }), 200 if is_healthy else 503

def check_database():
    try:
        conn = psycopg2.connect(
            host="db",
            database="myapp",
            user="postgres",
            password="password"
        )
        conn.close()
        return {'status': 'healthy', 'message': 'Database connection OK'}
    except Exception as e:
        return {'status': 'unhealthy', 'message': str(e)}

def check_redis():
    try:
        r = redis.Redis(host='redis', port=6379, db=0)
        r.ping()
        return {'status': 'healthy', 'message': 'Redis connection OK'}
    except Exception as e:
        return {'status': 'unhealthy', 'message': str(e)}
```

### Go 健康检查

```go
package main

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "time"
    
    _ "github.com/lib/pq"
    "github.com/go-redis/redis/v8"
)

type HealthCheck struct {
    Status    string            `json:"status"`
    Timestamp time.Time         `json:"timestamp"`
    Checks    map[string]Check  `json:"checks,omitempty"`
}

type Check struct {
    Status  string `json:"status"`
    Message string `json:"message"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    health := HealthCheck{
        Status:    "healthy",
        Timestamp: time.Now(),
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(health)
}

func detailedHealthHandler(db *sql.DB, rdb *redis.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        checks := map[string]Check{
            "database": checkDatabase(db),
            "redis":    checkRedis(rdb),
        }
        
        isHealthy := true
        for _, check := range checks {
            if check.Status != "healthy" {
                isHealthy = false
                break
            }
        }
        
        status := "healthy"
        statusCode := http.StatusOK
        if !isHealthy {
            status = "unhealthy"
            statusCode = http.StatusServiceUnavailable
        }
        
        health := HealthCheck{
            Status:    status,
            Timestamp: time.Now(),
            Checks:    checks,
        }
        
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(statusCode)
        json.NewEncoder(w).Encode(health)
    }
}

func checkDatabase(db *sql.DB) Check {
    if err := db.Ping(); err != nil {
        return Check{Status: "unhealthy", Message: err.Error()}
    }
    return Check{Status: "healthy", Message: "Database connection OK"}
}

func checkRedis(rdb *redis.Client) Check {
    if err := rdb.Ping(context.Background()).Err(); err != nil {
        return Check{Status: "unhealthy", Message: err.Error()}
    }
    return Check{Status: "healthy", Message: "Redis connection OK"}
}
```

## 🔍 健康检查脚本

### Shell 脚本健康检查

```bash
#!/bin/bash
# health-check.sh

set -e

# 配置
SERVICE_URL="http://localhost:3000"
DB_HOST="db"
DB_USER="postgres"
REDIS_HOST="redis"

# 检查 HTTP 服务
check_http() {
    if curl -f -s --max-time 10 "$SERVICE_URL/health" > /dev/null; then
        echo "✅ HTTP service is healthy"
        return 0
    else
        echo "❌ HTTP service is unhealthy"
        return 1
    fi
}

# 检查数据库
check_database() {
    if pg_isready -h "$DB_HOST" -U "$DB_USER" > /dev/null 2>&1; then
        echo "✅ Database is healthy"
        return 0
    else
        echo "❌ Database is unhealthy"
        return 1
    fi
}

# 检查 Redis
check_redis() {
    if redis-cli -h "$REDIS_HOST" ping > /dev/null 2>&1; then
        echo "✅ Redis is healthy"
        return 0
    else
        echo "❌ Redis is unhealthy"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -lt 90 ]; then
        echo "✅ Disk space is healthy ($usage%)"
        return 0
    else
        echo "❌ Disk space is critical ($usage%)"
        return 1
    fi
}

# 执行所有检查
main() {
    local failed=0
    
    check_http || failed=1
    check_database || failed=1
    check_redis || failed=1
    check_disk_space || failed=1
    
    if [ $failed -eq 0 ]; then
        echo "🎉 All health checks passed"
        exit 0
    else
        echo "💥 Some health checks failed"
        exit 1
    fi
}

main "$@"
```

## 📊 监控集成

### Prometheus 健康检查指标

```javascript
// Node.js Prometheus 集成
const client = require('prom-client');

// 健康检查指标
const healthCheckGauge = new client.Gauge({
  name: 'health_check_status',
  help: 'Health check status (1 = healthy, 0 = unhealthy)',
  labelNames: ['service', 'check_type']
});

const healthCheckDuration = new client.Histogram({
  name: 'health_check_duration_seconds',
  help: 'Health check duration in seconds',
  labelNames: ['service', 'check_type']
});

// 健康检查函数
async function performHealthCheck(checkName, checkFunction) {
  const start = Date.now();
  
  try {
    await checkFunction();
    healthCheckGauge.labels('my-service', checkName).set(1);
    return { status: 'healthy' };
  } catch (error) {
    healthCheckGauge.labels('my-service', checkName).set(0);
    return { status: 'unhealthy', error: error.message };
  } finally {
    const duration = (Date.now() - start) / 1000;
    healthCheckDuration.labels('my-service', checkName).observe(duration);
  }
}

// 健康检查端点
app.get('/health', async (req, res) => {
  const checks = {
    database: await performHealthCheck('database', checkDatabase),
    redis: await performHealthCheck('redis', checkRedis)
  };
  
  const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks
  });
});
```

## 🚨 故障处理

### 自动重启策略

```yaml
services:
  api:
    image: my-api:latest
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
```

### 健康检查失败处理

```bash
#!/bin/bash
# health-monitor.sh

CONTAINER_NAME="my-app"
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

while true; do
    # 检查容器健康状态
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null)
    
    if [ "$HEALTH_STATUS" = "unhealthy" ]; then
        echo "Container $CONTAINER_NAME is unhealthy, attempting restart..."
        
        # 发送告警
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Container $CONTAINER_NAME is unhealthy and being restarted\"}" \
            $WEBHOOK_URL
        
        # 重启容器
        docker restart $CONTAINER_NAME
        
        # 等待重启完成
        sleep 60
    fi
    
    sleep 30
done
```

## 🚀 最佳实践

### 1. 健康检查设计原则

```dockerfile
# 轻量级检查
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost/ping || exit 1

# 避免复杂检查
# ❌ 不好的例子
HEALTHCHECK CMD complex-database-migration-check.sh

# ✅ 好的例子
HEALTHCHECK CMD curl -f http://localhost/health || exit 1
```

### 2. 分层健康检查

```yaml
services:
  app:
    healthcheck:
      # 基础检查：服务是否响应
      test: ["CMD", "curl", "-f", "http://localhost:3000/ping"]
      interval: 10s
      timeout: 3s
      retries: 3
  
  # 详细检查通过监控系统进行
  monitoring:
    image: my-monitoring
    command: ["monitor", "--detailed-checks"]
```

### 3. 渐进式健康检查

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s  # 给应用足够的启动时间
```

### 4. 环境特定配置

```yaml
# 开发环境 - 宽松的健康检查
services:
  app:
    healthcheck:
      interval: 60s
      timeout: 30s
      retries: 5

# 生产环境 - 严格的健康检查
services:
  app:
    healthcheck:
      interval: 15s
      timeout: 5s
      retries: 2
```

通过合理的健康检查配置，您可以确保容器化应用的高可用性和自动恢复能力。
