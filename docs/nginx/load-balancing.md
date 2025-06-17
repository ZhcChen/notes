# Nginx 负载均衡

Nginx 提供了强大的负载均衡功能，支持多种算法和高级特性。本章将详细介绍如何配置和优化 Nginx 负载均衡。

## ⚖️ 基础负载均衡

### 简单轮询

```nginx
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 加权轮询

```nginx
upstream backend {
    server 192.168.1.10:8080 weight=3;  # 处理 3/6 的请求
    server 192.168.1.11:8080 weight=2;  # 处理 2/6 的请求
    server 192.168.1.12:8080 weight=1;  # 处理 1/6 的请求
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🎯 负载均衡算法

### IP 哈希

```nginx
upstream backend {
    ip_hash;  # 基于客户端 IP 的哈希
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 最少连接

```nginx
upstream backend {
    least_conn;  # 连接数最少的服务器优先
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 随机算法（Nginx Plus）

```nginx
upstream backend {
    random;  # 随机选择服务器
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# 带权重的随机
upstream backend_weighted_random {
    random two least_time=last_byte;
    server 192.168.1.10:8080 weight=3;
    server 192.168.1.11:8080 weight=2;
    server 192.168.1.12:8080 weight=1;
}
```

### 哈希算法

```nginx
upstream backend {
    hash $request_uri consistent;  # 基于请求 URI 的一致性哈希
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# 基于自定义键的哈希
upstream backend_custom_hash {
    hash $remote_addr$request_uri consistent;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
```

## 🏥 健康检查和故障处理

### 被动健康检查

```nginx
upstream backend {
    server 192.168.1.10:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.12:8080 max_fails=2 fail_timeout=20s;
    server 192.168.1.13:8080 backup;  # 备用服务器
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 主动健康检查（Nginx Plus）

```nginx
upstream backend {
    zone backend 64k;  # 共享内存区域
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        
        # 主动健康检查
        health_check uri=/health 
                    interval=10s 
                    fails=3 
                    passes=2 
                    match=server_ok;
    }
}

# 健康检查匹配条件
match server_ok {
    status 200;
    header Content-Type ~ "application/json";
    body ~ "\"status\":\"ok\"";
}
```

### 自定义健康检查

```nginx
# 使用第三方模块 nginx_upstream_check_module
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
    
    check interval=3000 rise=2 fall=5 timeout=1000 type=http;
    check_keepalive_requests 100;
    check_http_send "HEAD /health HTTP/1.1\r\nConnection: keep-alive\r\nHost: example.com\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
    }
    
    # 健康检查状态页面
    location /status {
        check_status;
        access_log off;
        allow 192.168.1.0/24;
        deny all;
    }
}
```

## 🔄 会话保持

### 基于 IP 的会话保持

```nginx
upstream backend {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
```

### 基于 Cookie 的会话保持（Nginx Plus）

```nginx
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
    
    sticky cookie srv_id expires=1h domain=.example.com path=/;
}
```

### 自定义会话保持

```nginx
# 基于自定义头部的会话保持
map $http_x_session_id $backend_pool {
    ~^session1 backend1;
    ~^session2 backend2;
    default backend;
}

upstream backend1 {
    server 192.168.1.10:8080;
}

upstream backend2 {
    server 192.168.1.11:8080;
}

upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://$backend_pool;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🌐 多层负载均衡

### 地理位置负载均衡

```nginx
# 根据地理位置分发流量
geo $geo {
    default us;
    192.168.1.0/24 local;
    10.0.0.0/8 internal;
    203.0.113.0/24 eu;
    198.51.100.0/24 asia;
}

map $geo $backend_pool {
    local local_backend;
    internal internal_backend;
    eu eu_backend;
    asia asia_backend;
    default us_backend;
}

upstream local_backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}

upstream eu_backend {
    server eu-server1.example.com:8080;
    server eu-server2.example.com:8080;
}

upstream asia_backend {
    server asia-server1.example.com:8080;
    server asia-server2.example.com:8080;
}

upstream us_backend {
    server us-server1.example.com:8080;
    server us-server2.example.com:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://$backend_pool;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Geo-Location $geo;
    }
}
```

### 基于内容的负载均衡

```nginx
# 根据请求内容分发到不同后端
map $request_uri $backend_pool {
    ~^/api/v1/ api_v1_backend;
    ~^/api/v2/ api_v2_backend;
    ~^/static/ static_backend;
    ~^/upload/ upload_backend;
    default main_backend;
}

upstream api_v1_backend {
    server api-v1-1.example.com:8080;
    server api-v1-2.example.com:8080;
}

upstream api_v2_backend {
    server api-v2-1.example.com:8080;
    server api-v2-2.example.com:8080;
}

upstream static_backend {
    server static-1.example.com:8080;
    server static-2.example.com:8080;
}

upstream upload_backend {
    server upload-1.example.com:8080;
    server upload-2.example.com:8080;
}

upstream main_backend {
    server main-1.example.com:8080;
    server main-2.example.com:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://$backend_pool;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🚀 高级负载均衡特性

### 动态负载均衡（Nginx Plus）

```nginx
upstream backend {
    zone backend 64k;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
    }
    
    # API 端点用于动态配置
    location /api {
        api write=on;
        allow 192.168.1.0/24;
        deny all;
    }
}
```

### 慢启动（Nginx Plus）

```nginx
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080 slow_start=30s;  # 30秒慢启动
}
```

### 连接限制

```nginx
upstream backend {
    server 192.168.1.10:8080 max_conns=100;  # 最大连接数
    server 192.168.1.11:8080 max_conns=150;
    server 192.168.1.12:8080 max_conns=200;
}
```

## 📊 监控和调试

### 状态监控

```nginx
server {
    listen 80;
    server_name monitor.example.com;
    
    # 基础状态
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 192.168.1.0/24;
        deny all;
    }
    
    # Upstream 状态（Nginx Plus）
    location /upstream_status {
        status;
        status_format json;
        access_log off;
        allow 192.168.1.0/24;
        deny all;
    }
    
    # 健康检查状态
    location /health_status {
        check_status;
        access_log off;
        allow 192.168.1.0/24;
        deny all;
    }
}
```

### 日志分析

```nginx
# 详细的负载均衡日志
log_format upstream '$remote_addr - $remote_user [$time_local] '
                   '"$request" $status $body_bytes_sent '
                   '"$http_referer" "$http_user_agent" '
                   'upstream_addr=$upstream_addr '
                   'upstream_status=$upstream_status '
                   'upstream_response_time=$upstream_response_time '
                   'request_time=$request_time';

server {
    listen 80;
    server_name example.com;
    
    access_log /var/log/nginx/upstream.log upstream;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 性能监控脚本

```bash
#!/bin/bash
# upstream_monitor.sh

NGINX_STATUS_URL="http://localhost/nginx_status"
UPSTREAM_STATUS_URL="http://localhost/upstream_status"

# 获取基础状态
echo "=== Nginx Status ==="
curl -s $NGINX_STATUS_URL

echo -e "\n=== Upstream Status ==="
curl -s $UPSTREAM_STATUS_URL | jq '.'

# 分析日志
echo -e "\n=== Top 10 Upstream Servers ==="
tail -1000 /var/log/nginx/upstream.log | \
awk '{print $12}' | \
sed 's/upstream_addr=//' | \
sort | uniq -c | sort -nr | head -10

echo -e "\n=== Average Response Time ==="
tail -1000 /var/log/nginx/upstream.log | \
awk '{print $14}' | \
sed 's/upstream_response_time=//' | \
awk '{sum+=$1; count++} END {print "Average:", sum/count "s"}'
```

## 🔧 故障排除

### 常见问题诊断

```bash
# 检查 upstream 配置
nginx -T | grep -A 10 "upstream"

# 检查后端服务器连通性
for server in 192.168.1.10 192.168.1.11 192.168.1.12; do
    echo "Testing $server:8080"
    nc -zv $server 8080
done

# 检查负载均衡状态
curl -s http://localhost/nginx_status

# 分析错误日志
tail -f /var/log/nginx/error.log | grep upstream
```

### 调试配置

```nginx
server {
    listen 80;
    server_name debug.example.com;
    
    location / {
        # 添加调试头
        add_header X-Upstream-Addr $upstream_addr always;
        add_header X-Upstream-Status $upstream_status always;
        add_header X-Upstream-Response-Time $upstream_response_time always;
        add_header X-Request-Time $request_time always;
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🎯 最佳实践

### 配置优化

```nginx
upstream backend {
    # 使用 keepalive 连接池
    keepalive 32;
    keepalive_requests 100;
    keepalive_timeout 60s;
    
    server 192.168.1.10:8080 weight=3 max_fails=2 fail_timeout=30s;
    server 192.168.1.11:8080 weight=2 max_fails=2 fail_timeout=30s;
    server 192.168.1.12:8080 weight=1 max_fails=2 fail_timeout=30s;
    server 192.168.1.13:8080 backup;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        
        # 连接优化
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # 缓冲优化
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 32 8k;
        proxy_busy_buffers_size 16k;
        
        # 超时优化
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        
        # 头部设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

通过这些负载均衡配置，您可以构建高可用、高性能的分布式系统。接下来我们将学习 SSL/HTTPS 配置。 ⚖️
