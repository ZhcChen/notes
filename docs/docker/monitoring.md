# Docker 监控告警

容器监控是确保应用稳定运行的关键。本文档介绍 Docker 容器的监控指标、工具和告警配置。

## 📊 监控指标概述

### 核心监控指标

| 指标类型 | 具体指标 | 描述 |
|---------|---------|------|
| 资源使用 | CPU、内存、磁盘、网络 | 容器资源消耗 |
| 容器状态 | 运行状态、重启次数 | 容器健康状况 |
| 应用指标 | 响应时间、错误率、吞吐量 | 应用性能指标 |
| 系统指标 | 负载、文件描述符 | 系统级别指标 |

### Docker 原生监控命令

```bash
# 查看容器资源使用情况
docker stats

# 查看特定容器统计信息
docker stats container-name

# 查看所有容器（包括停止的）
docker stats --all

# 不持续更新，只显示一次
docker stats --no-stream

# 格式化输出
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

## 🔧 Prometheus 监控

### Prometheus 部署

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules:/etc/prometheus/rules
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg

volumes:
  prometheus-data:
```

### Prometheus 配置

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
  
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
  
  - job_name: 'docker-containers'
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: [__meta_docker_container_name]
        target_label: container_name
      - source_labels: [__meta_docker_container_label_monitoring]
        regex: "true"
        action: keep

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 告警规则

```yaml
# prometheus/rules/docker-alerts.yml
groups:
- name: docker-alerts
  rules:
  - alert: ContainerDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Container {{ $labels.instance }} is down"
      description: "Container {{ $labels.instance }} has been down for more than 1 minute."
  
  - alert: HighCPUUsage
    expr: rate(container_cpu_usage_seconds_total[5m]) * 100 > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage on {{ $labels.name }}"
      description: "Container {{ $labels.name }} CPU usage is above 80% for more than 2 minutes."
  
  - alert: HighMemoryUsage
    expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100 > 90
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High memory usage on {{ $labels.name }}"
      description: "Container {{ $labels.name }} memory usage is above 90% for more than 2 minutes."
  
  - alert: ContainerRestartTooOften
    expr: increase(container_start_time_seconds[1h]) > 5
    for: 0m
    labels:
      severity: warning
    annotations:
      summary: "Container restarting too often"
      description: "Container {{ $labels.name }} has restarted {{ $value }} times in the last hour."
```

## 📈 Grafana 可视化

### Grafana 部署

```yaml
# 添加到 docker-compose.monitoring.yml
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    depends_on:
      - prometheus

volumes:
  grafana-data:
```

### Grafana 数据源配置

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

### Docker 监控仪表板

```json
{
  "dashboard": {
    "id": null,
    "title": "Docker Container Monitoring",
    "tags": ["docker"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Container CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{name!=\"\"}[5m]) * 100",
            "legendFormat": "{{ name }}"
          }
        ],
        "yAxes": [
          {
            "label": "CPU %",
            "max": 100,
            "min": 0
          }
        ]
      },
      {
        "id": 2,
        "title": "Container Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes{name!=\"\"}",
            "legendFormat": "{{ name }}"
          }
        ],
        "yAxes": [
          {
            "label": "Bytes"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

## 🚨 AlertManager 告警

### AlertManager 部署

```yaml
# 添加到 docker-compose.monitoring.yml
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'

volumes:
  alertmanager-data:
```

### AlertManager 配置

```yaml
# alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@example.com'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: 'your-app-password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      severity: warning
    receiver: 'warning-alerts'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://webhook-server:5000/alerts'

- name: 'critical-alerts'
  email_configs:
  - to: 'admin@example.com'
    subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#critical-alerts'
    title: 'Critical Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

- name: 'warning-alerts'
  email_configs:
  - to: 'team@example.com'
    subject: 'WARNING: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
```

## 📱 应用性能监控 (APM)

### Jaeger 分布式追踪

```yaml
# docker-compose.apm.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  app:
    image: my-app
    environment:
      - JAEGER_AGENT_HOST=jaeger
      - JAEGER_AGENT_PORT=6831
    depends_on:
      - jaeger
```

### 应用指标收集

```javascript
// Node.js 应用集成 Prometheus 指标
const client = require('prom-client');
const express = require('express');

// 创建指标
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// 中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });
  
  next();
});

// 指标端点
app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
});
```

## 🔍 日志监控集成

### Loki + Promtail

```yaml
# docker-compose.logging.yml
services:
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./loki/loki-config.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml
    
  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - ./promtail/promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
```

### Promtail 配置

```yaml
# promtail/promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
- job_name: containers
  static_configs:
  - targets:
      - localhost
    labels:
      job: containerlogs
      __path__: /var/lib/docker/containers/*/*log
  
  pipeline_stages:
  - json:
      expressions:
        output: log
        stream: stream
        attrs:
  - json:
      source: attrs
      expressions:
        tag:
  - regex:
      source: tag
      expression: (?P<container_name>(?:[^|]*))\|(?P<image_name>(?:[^|]*))\|(?P<image_id>(?:[^|]*))\|(?P<container_id>(?:[^|]*))
  - timestamp:
      format: RFC3339Nano
      source: time
  - labels:
      stream:
      container_name:
      image_name:
  - output:
      source: output
```

## 🛠️ 监控脚本和工具

### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

CONTAINERS=("web" "api" "db" "redis")
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

for container in "${CONTAINERS[@]}"; do
  if ! docker ps | grep -q "$container"; then
    echo "❌ Container $container is not running"
    
    # 发送告警
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"🚨 Container $container is down!\"}" \
      $WEBHOOK_URL
    
    # 尝试重启
    docker-compose restart $container
  else
    echo "✅ Container $container is healthy"
  fi
done
```

### 资源监控脚本

```bash
#!/bin/bash
# resource-monitor.sh

# 设置阈值
CPU_THRESHOLD=80
MEMORY_THRESHOLD=90
DISK_THRESHOLD=85

# 检查 CPU 使用率
check_cpu() {
  local container=$1
  local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" $container | sed 's/%//')
  
  if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
    echo "⚠️  High CPU usage: $container ($cpu_usage%)"
    return 1
  fi
  return 0
}

# 检查内存使用率
check_memory() {
  local container=$1
  local mem_usage=$(docker stats --no-stream --format "{{.MemPerc}}" $container | sed 's/%//')
  
  if (( $(echo "$mem_usage > $MEMORY_THRESHOLD" | bc -l) )); then
    echo "⚠️  High memory usage: $container ($mem_usage%)"
    return 1
  fi
  return 0
}

# 检查所有运行的容器
for container in $(docker ps --format "{{.Names}}"); do
  check_cpu $container
  check_memory $container
done
```

## 🚀 最佳实践

### 1. 监控指标选择

```yaml
# 关键指标监控
services:
  app:
    image: my-app
    labels:
      - "monitoring=true"
      - "metrics.port=3000"
      - "metrics.path=/metrics"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2. 告警分级

```yaml
# 告警严重级别
- alert: ServiceDown
  expr: up == 0
  labels:
    severity: critical
    
- alert: HighLatency
  expr: http_request_duration_seconds > 1
  labels:
    severity: warning
    
- alert: DiskSpaceLow
  expr: disk_free_percent < 10
  labels:
    severity: critical
```

### 3. 监控数据保留

```yaml
# Prometheus 数据保留策略
command:
  - '--storage.tsdb.retention.time=30d'
  - '--storage.tsdb.retention.size=10GB'
```

### 4. 性能优化

```yaml
# 监控组件资源限制
services:
  prometheus:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

通过完善的监控告警体系，您可以及时发现和解决容器化应用的问题，确保系统稳定运行。
