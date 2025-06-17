# Nginx 反向代理配置

反向代理是 Nginx 的核心功能之一，广泛用于负载均衡、API 网关、微服务架构等场景。本章将详细介绍反向代理的配置和优化。

## 🎯 基础反向代理

### 简单代理配置

```nginx
server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 路径代理

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 静态文件
    location / {
        root /var/www/html;
        index index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 管理后台代理
    location /admin/ {
        proxy_pass http://localhost:8080/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # WebSocket 代理
    location /ws/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 🔧 代理参数配置

### 基础代理参数

```nginx
server {
    listen 80;
    server_name example.com;
    
    location /api/ {
        proxy_pass http://backend;
        
        # 基础头部设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # 临时文件设置
        proxy_temp_file_write_size 8k;
        proxy_max_temp_file_size 1024m;
    }
}
```

### 高级代理参数

```nginx
server {
    listen 80;
    server_name example.com;
    
    location /api/ {
        proxy_pass http://backend;
        
        # HTTP 版本
        proxy_http_version 1.1;
        
        # 连接保持
        proxy_set_header Connection "";
        
        # 请求体处理
        proxy_request_buffering on;
        client_max_body_size 100m;
        client_body_buffer_size 128k;
        
        # 响应处理
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 32 8k;
        proxy_busy_buffers_size 16k;
        
        # 错误处理
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
        
        # SSL 设置（代理到 HTTPS 后端）
        # proxy_ssl_verify off;
        # proxy_ssl_session_reuse on;
    }
}
```

## 🌐 Upstream 配置

### 基础 Upstream

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
    }
}
```

### 加权负载均衡

```nginx
upstream backend {
    server 192.168.1.10:8080 weight=3;  # 高性能服务器
    server 192.168.1.11:8080 weight=2;  # 中等性能服务器
    server 192.168.1.12:8080 weight=1;  # 低性能服务器
}
```

### 负载均衡算法

```nginx
# 轮询（默认）
upstream backend_round_robin {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# IP 哈希
upstream backend_ip_hash {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# 最少连接
upstream backend_least_conn {
    least_conn;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

# 随机（Nginx Plus）
upstream backend_random {
    random;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
```

### 服务器状态控制

```nginx
upstream backend {
    server 192.168.1.10:8080 weight=3 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:8080 weight=2 max_fails=2 fail_timeout=20s;
    server 192.168.1.12:8080 weight=1 backup;  # 备用服务器
    server 192.168.1.13:8080 down;             # 临时下线
}
```

## 🏥 健康检查

### 被动健康检查

```nginx
upstream backend {
    server 192.168.1.10:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.12:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
}
```

### 主动健康检查（Nginx Plus）

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
        health_check uri=/health interval=10s fails=3 passes=2;
    }
}
```

### 自定义健康检查

```nginx
# 使用第三方模块或脚本
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
    
    # 使用 nginx-upstream-check-module
    check interval=3000 rise=2 fall=5 timeout=1000 type=http;
    check_http_send "HEAD /health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}
```

## 🔄 会话保持

### IP 哈希会话保持

```nginx
upstream backend {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}
```

### Cookie 会话保持（Nginx Plus）

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
map $cookie_server_id $backend_pool {
    ~server1 backend1;
    ~server2 backend2;
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
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://$backend_pool;
        proxy_set_header Host $host;
    }
}
```

## 🚀 微服务架构

### API 网关配置

```nginx
# 用户服务
upstream user_service {
    server user-service-1:8080;
    server user-service-2:8080;
}

# 订单服务
upstream order_service {
    server order-service-1:8080;
    server order-service-2:8080;
}

# 支付服务
upstream payment_service {
    server payment-service:8080;
}

server {
    listen 80;
    server_name api.example.com;
    
    # 全局设置
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 用户服务
    location /api/users/ {
        proxy_pass http://user_service/;
        proxy_read_timeout 30s;
    }
    
    # 订单服务
    location /api/orders/ {
        proxy_pass http://order_service/;
        proxy_read_timeout 60s;  # 订单处理可能较慢
    }
    
    # 支付服务
    location /api/payments/ {
        proxy_pass http://payment_service/;
        proxy_read_timeout 120s;  # 支付处理时间较长
        
        # 支付服务需要更严格的安全设置
        proxy_ssl_verify on;
        proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
    }
    
    # 健康检查端点
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 服务发现集成

```nginx
# 使用 consul-template 动态生成配置
upstream user_service {
    {{range service "user-service"}}
    server {{.Address}}:{{.Port}};
    {{end}}
}

upstream order_service {
    {{range service "order-service"}}
    server {{.Address}}:{{.Port}};
    {{end}}
}

# 或使用 nginx-upsync-module
upstream backend {
    server 127.0.0.1:11111;  # 占位符
    upsync 127.0.0.1:8500/v1/kv/upstreams/backend upsync_timeout=6m upsync_interval=500ms upsync_type=consul strong_dependency=off;
    upsync_dump_path /usr/local/nginx/conf/servers/servers_test.conf;
}
```

## 🔒 安全配置

### 基础安全设置

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 隐藏代理信息
    proxy_hide_header X-Powered-By;
    proxy_hide_header Server;
    
    # 添加安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location /api/ {
        # 限制请求方法
        limit_except GET POST PUT DELETE {
            deny all;
        }
        
        # 限制请求大小
        client_max_body_size 10m;
        
        # 代理设置
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # 移除敏感头部
        proxy_set_header Authorization "";
        proxy_set_header Cookie "";
    }
}
```

### SSL 终止

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 缓存代理

### 基础缓存配置

```nginx
# 缓存路径配置
proxy_cache_path /var/cache/nginx/proxy levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

server {
    listen 80;
    server_name example.com;
    
    location /api/ {
        proxy_cache my_cache;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        
        # 缓存键
        proxy_cache_key "$scheme$request_method$host$request_uri";
        
        # 缓存头
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://backend;
    }
}
```

### 条件缓存

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 定义不缓存的条件
    set $no_cache 0;
    
    # POST 请求不缓存
    if ($request_method = POST) {
        set $no_cache 1;
    }
    
    # 带认证的请求不缓存
    if ($http_authorization != "") {
        set $no_cache 1;
    }
    
    # 特定路径不缓存
    if ($request_uri ~* "/(admin|login|logout)") {
        set $no_cache 1;
    }
    
    location /api/ {
        proxy_cache my_cache;
        proxy_cache_bypass $no_cache;
        proxy_no_cache $no_cache;
        
        proxy_cache_valid 200 10m;
        proxy_cache_valid 404 1m;
        
        proxy_pass http://backend;
    }
}
```

## 📈 监控和调试

### 状态监控

```nginx
# 启用状态页面
server {
    listen 80;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 192.168.1.0/24;
        deny all;
    }
    
    # Upstream 状态（Nginx Plus）
    location /upstream_status {
        status;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

### 调试配置

```nginx
server {
    listen 80;
    server_name example.com;
    
    location /api/ {
        # 添加调试头
        add_header X-Upstream-Addr $upstream_addr;
        add_header X-Upstream-Status $upstream_status;
        add_header X-Upstream-Response-Time $upstream_response_time;
        add_header X-Request-Time $request_time;
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

通过这些反向代理配置，您可以构建强大的负载均衡和 API 网关系统。接下来我们将学习负载均衡的高级配置。 🚀
