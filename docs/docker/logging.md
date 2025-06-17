# Docker 日志管理

容器日志管理是运维监控的重要组成部分。本文档介绍 Docker 日志的收集、存储、分析和最佳实践。

## 📝 日志基础概念

### Docker 日志驱动

Docker 支持多种日志驱动：

| 驱动 | 描述 | 使用场景 |
|------|------|----------|
| json-file | 默认驱动，JSON 格式 | 开发和小型部署 |
| syslog | 系统日志 | 集成现有日志系统 |
| journald | systemd 日志 | systemd 系统 |
| fluentd | Fluentd 日志收集 | 大规模日志收集 |
| awslogs | AWS CloudWatch | AWS 环境 |
| gcplogs | Google Cloud Logging | GCP 环境 |
| none | 禁用日志 | 不需要日志的容器 |

### 查看当前日志配置

```bash
# 查看 Docker 守护进程日志配置
docker info | grep -A 10 "Logging Driver"

# 查看容器日志配置
docker inspect container-name | grep -A 10 "LogConfig"
```

## 📊 基础日志操作

### 查看容器日志

```bash
# 查看容器日志
docker logs container-name

# 实时查看日志
docker logs -f container-name

# 查看最近的日志
docker logs --tail 100 container-name

# 查看指定时间范围的日志
docker logs --since "2024-01-01T00:00:00" container-name
docker logs --until "2024-01-01T23:59:59" container-name

# 显示时间戳
docker logs -t container-name

# 组合使用
docker logs -f --tail 50 --since "1h" container-name
```

### 日志格式化

```bash
# 查看 JSON 格式日志
docker logs --details container-name

# 使用 jq 格式化日志
docker logs container-name 2>&1 | jq '.'

# 提取特定字段
docker logs container-name 2>&1 | jq '.log'
```

## 🔧 日志驱动配置

### 全局日志配置

```json
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3",
    "labels": "production_status",
    "env": "os,customer"
  }
}
```

```bash
# 重启 Docker 服务使配置生效
sudo systemctl restart docker
```

### 容器级别日志配置

```bash
# 运行时指定日志驱动
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  --name web nginx

# 使用 syslog 驱动
docker run -d \
  --log-driver syslog \
  --log-opt syslog-address=tcp://192.168.1.100:514 \
  --log-opt tag="{{.Name}}/{{.FullID}}" \
  --name app my-app
```

### Docker Compose 日志配置

```yaml
services:
  web:
    image: nginx
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=web,environment=production"
    
  api:
    image: my-api
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://log-server:514"
        tag: "api-{{.Name}}"
    
  db:
    image: postgres:15
    logging:
      driver: "fluentd"
      options:
        fluentd-address: "fluentd:24224"
        tag: "database.{{.Name}}"
```

## 🏗️ 集中化日志收集

### ELK Stack 部署

```yaml
# docker-compose.elk.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    ports:
      - "5044:5044"
      - "9600:9600"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    depends_on:
      - elasticsearch
    
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    container_name: filebeat
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - elasticsearch
      - logstash

volumes:
  elasticsearch-data:
```

### Filebeat 配置

```yaml
# filebeat/filebeat.yml
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
    - add_docker_metadata:
        host: "unix:///var/run/docker.sock"

output.logstash:
  hosts: ["logstash:5044"]

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

### Logstash 配置

```ruby
# logstash/pipeline/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [container][name] {
    mutate {
      add_field => { "service_name" => "%{[container][name]}" }
    }
  }
  
  # 解析 JSON 日志
  if [message] =~ /^\{.*\}$/ {
    json {
      source => "message"
    }
  }
  
  # 添加时间戳
  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "docker-logs-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
```

## 📈 Fluentd 日志收集

### Fluentd 部署

```yaml
# docker-compose.fluentd.yml
services:
  fluentd:
    image: fluent/fluentd:v1.16-debian-1
    container_name: fluentd
    ports:
      - "24224:24224"
      - "24224:24224/udp"
    volumes:
      - ./fluentd/conf:/fluentd/etc
      - ./fluentd/logs:/var/log/fluentd
    
  app:
    image: my-app
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: "app.{{.Name}}"
```

### Fluentd 配置

```xml
<!-- fluentd/conf/fluent.conf -->
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<filter app.**>
  @type parser
  key_name log
  <parse>
    @type json
  </parse>
</filter>

<match app.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name docker-logs
  type_name _doc
  <buffer>
    @type file
    path /var/log/fluentd/buffer
    flush_mode interval
    flush_interval 10s
  </buffer>
</match>

<match **>
  @type stdout
</match>
```

## 🔍 日志分析和查询

### Elasticsearch 查询

```bash
# 基础查询
curl -X GET "localhost:9200/docker-logs-*/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "service_name": "web"
      }
    }
  }'

# 时间范围查询
curl -X GET "localhost:9200/docker-logs-*/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "bool": {
        "must": [
          {"match": {"service_name": "api"}},
          {"range": {"@timestamp": {"gte": "now-1h"}}}
        ]
      }
    }
  }'
```

### Kibana 仪表板

```json
{
  "version": "8.11.0",
  "objects": [
    {
      "id": "docker-logs-dashboard",
      "type": "dashboard",
      "attributes": {
        "title": "Docker Logs Dashboard",
        "hits": 0,
        "description": "Docker container logs monitoring",
        "panelsJSON": "[{\"version\":\"8.11.0\",\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15,\"i\":\"1\"},\"panelIndex\":\"1\",\"embeddableConfig\":{},\"panelRefName\":\"panel_1\"}]"
      }
    }
  ]
}
```

## 🚨 日志告警

### Elastalert 配置

```yaml
# elastalert/rules/error_alert.yml
name: Docker Error Alert
type: frequency
index: docker-logs-*
num_events: 5
timeframe:
  minutes: 5

filter:
- terms:
    level: ["error", "ERROR", "Error"]

alert:
- "email"
- "slack"

email:
- "admin@example.com"

slack:
webhook_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
slack_channel_override: "#alerts"
slack_username_override: "ElastAlert"
```

### Prometheus + Grafana 监控

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    
  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
    
  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro

volumes:
  grafana-data:
```

## 🛠️ 日志管理工具

### 日志轮转脚本

```bash
#!/bin/bash
# log-rotation.sh

# 压缩旧日志
find /var/lib/docker/containers -name "*.log" -size +100M -exec gzip {} \;

# 删除超过 30 天的日志
find /var/lib/docker/containers -name "*.log.gz" -mtime +30 -delete

# 清理 Docker 日志
docker system prune -f --filter "until=720h"
```

### 日志备份脚本

```bash
#!/bin/bash
# backup-logs.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/docker-logs"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份容器日志
for container in $(docker ps -q); do
  container_name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
  docker logs $container > $BACKUP_DIR/${container_name}_${DATE}.log
done

# 压缩备份
tar -czf $BACKUP_DIR/docker-logs-${DATE}.tar.gz $BACKUP_DIR/*.log
rm $BACKUP_DIR/*.log
```

## 🚀 最佳实践

### 1. 结构化日志

```javascript
// 应用程序中使用结构化日志
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('User login', {
  userId: '12345',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
});
```

### 2. 日志级别管理

```yaml
services:
  app:
    image: my-app
    environment:
      - LOG_LEVEL=info
      - DEBUG=app:*
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 敏感信息过滤

```ruby
# logstash 过滤敏感信息
filter {
  mutate {
    gsub => [
      "message", "password=[^&\s]*", "password=***",
      "message", "token=[^&\s]*", "token=***"
    ]
  }
}
```

### 4. 性能优化

```yaml
services:
  app:
    image: my-app
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"  # 压缩日志文件
```

### 5. 监控日志存储

```bash
# 监控日志磁盘使用
df -h /var/lib/docker

# 清理日志
docker system prune --volumes -f
```

通过合理的日志管理策略，您可以有效监控容器化应用的运行状态，快速定位和解决问题。
