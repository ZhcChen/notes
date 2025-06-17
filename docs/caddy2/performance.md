# 性能优化指南

本章将介绍如何优化 Caddy 的性能，包括配置调优、缓存策略、压缩设置等方面。

## ⚡ 基础性能优化

### HTTP/2 和 HTTP/3 配置

```caddyfile
{
    # 启用 HTTP/3（实验性）
    servers {
        protocol {
            experimental_http3
            strict_sni_host
        }
    }
}

example.com {
    # HTTP/2 服务器推送
    push /css/style.css
    push /js/app.js
    push /images/logo.png
    
    root * /var/www/html
    file_server
}
```

### 连接优化

```caddyfile
{
    # 全局服务器配置
    servers {
        timeouts {
            read_timeout 30s
            read_header_timeout 10s
            write_timeout 30s
            idle_timeout 120s
        }
        
        max_header_size 1MB
        protocol {
            allow_h2c
        }
    }
}

example.com {
    reverse_proxy localhost:3000 {
        transport http {
            # 连接池配置
            max_idle_conns 100
            max_idle_conns_per_host 20
            idle_conn_timeout 90s
            
            # 连接超时
            dial_timeout 5s
            keep_alive 30s
            
            # 响应超时
            response_header_timeout 10s
            expect_continue_timeout 1s
        }
    }
}
```

## 🗜️ 压缩优化

### 智能压缩配置

```caddyfile
example.com {
    encode {
        # 压缩算法优先级
        zstd
        gzip 6
        
        # 最小压缩大小
        minimum_length 1024
        
        # 压缩类型匹配
        match {
            header Content-Type text/*
            header Content-Type application/json*
            header Content-Type application/javascript*
            header Content-Type application/xml*
            header Content-Type application/rss+xml*
            header Content-Type application/atom+xml*
            header Content-Type image/svg+xml*
        }
    }
    
    root * /var/www/html
    file_server
}
```

### 预压缩文件

```caddyfile
example.com {
    root * /var/www/html
    
    file_server {
        # 使用预压缩文件
        precompressed gzip br zstd
    }
    
    # 为预压缩文件设置正确的头
    @precompressed path *.gz *.br *.zst
    header @precompressed {
        # 根据文件扩展名设置编码
        Content-Encoding gzip
        Vary Accept-Encoding
    }
}
```

### 动态压缩优化

```bash
# 生成预压缩文件的脚本
#!/bin/bash

WEBROOT="/var/www/html"

find $WEBROOT -type f \( -name "*.css" -o -name "*.js" -o -name "*.html" -o -name "*.svg" \) | while read file; do
    # Gzip 压缩
    gzip -9 -c "$file" > "$file.gz"
    
    # Brotli 压缩
    brotli -9 -c "$file" > "$file.br"
    
    # Zstandard 压缩
    zstd -19 -c "$file" > "$file.zst"
    
    echo "Compressed: $file"
done
```

## 💾 缓存策略

### 静态资源缓存

```caddyfile
example.com {
    # 长期缓存的静态资源
    @immutable path *.css *.js *.woff *.woff2 *.ttf *.eot
    header @immutable {
        Cache-Control "public, max-age=31536000, immutable"
        Expires "Thu, 31 Dec 2037 23:55:55 GMT"
    }
    
    # 图片资源
    @images path *.png *.jpg *.jpeg *.gif *.webp *.svg *.ico
    header @images {
        Cache-Control "public, max-age=2592000"  # 30 天
        Vary Accept
    }
    
    # HTML 文件
    @html path *.html
    header @html {
        Cache-Control "public, max-age=3600"  # 1 小时
        Vary Accept-Encoding
    }
    
    # API 响应
    @api path /api/*
    header @api {
        Cache-Control "private, max-age=300"  # 5 分钟
        Vary Authorization
    }
    
    encode gzip zstd
    root * /var/www/html
    file_server
}
```

### 条件缓存

```caddyfile
example.com {
    # 根据用户类型设置不同缓存
    @logged_in header Cookie *session*
    @guest not header Cookie *session*
    
    handle @logged_in {
        header Cache-Control "private, max-age=300"
        root * /var/www/html
        file_server
    }
    
    handle @guest {
        header Cache-Control "public, max-age=3600"
        root * /var/www/html
        file_server
    }
}
```

### CDN 集成

```caddyfile
example.com {
    # CDN 友好的头设置
    header {
        # 缓存控制
        Cache-Control "public, max-age=3600, s-maxage=86400"
        
        # 变化标识
        Vary "Accept-Encoding, Accept, User-Agent"
        
        # CDN 缓存标签
        Cache-Tag "static-content"
        
        # 源服务器标识
        X-Served-By "origin-server"
    }
    
    # 静态资源
    @static path /static/*
    handle @static {
        header Cache-Control "public, max-age=31536000, immutable"
        root * /var/www/static
        file_server {
            precompressed gzip br
        }
    }
    
    # 动态内容
    handle {
        reverse_proxy localhost:3000 {
            header_down Cache-Control "public, max-age=300, s-maxage=3600"
        }
    }
}
```

## 🔧 文件服务器优化

### 高性能文件服务

```caddyfile
files.example.com {
    root * /var/www/files
    
    file_server {
        # 隐藏不必要的文件
        hide .htaccess .env *.log *.bak
        
        # 禁用目录浏览（提高性能）
        # browse
        
        # 预压缩文件
        precompressed gzip br
        
        # 索引文件
        index index.html index.htm
    }
    
    # 大文件优化
    @large_files path *.zip *.tar.gz *.iso *.dmg *.mp4 *.mkv
    header @large_files {
        # 支持断点续传
        Accept-Ranges bytes
        
        # 长期缓存
        Cache-Control "public, max-age=2592000"
        
        # 避免压缩大文件
        Content-Encoding identity
    }
    
    # 小文件压缩
    @small_files not path *.zip *.tar.gz *.iso *.dmg *.mp4 *.mkv *.png *.jpg *.jpeg *.gif
    encode @small_files gzip zstd
}
```

### 目录浏览优化

```caddyfile
browse.example.com {
    root * /var/www/files
    
    file_server {
        browse {
            # 自定义模板（更轻量）
            template browse_optimized.html
        }
    }
    
    # 缓存目录列表
    @directory_listing path */
    header @directory_listing {
        Cache-Control "public, max-age=300"
    }
}
```

## 🚀 反向代理优化

### 连接池优化

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 负载均衡策略
        lb_policy least_conn
        
        # 健康检查优化
        health_uri /health
        health_interval 30s
        health_timeout 3s
        
        # 连接池配置
        transport http {
            # 最大空闲连接
            max_idle_conns 200
            max_idle_conns_per_host 50
            
            # 连接超时
            dial_timeout 3s
            idle_conn_timeout 90s
            
            # 保持连接
            keep_alive 30s
            
            # 响应超时
            response_header_timeout 5s
            expect_continue_timeout 1s
            
            # 禁用压缩（如果后端已压缩）
            disable_compression
        }
        
        # 请求头优化
        header_up Connection "keep-alive"
        header_up Keep-Alive "timeout=30, max=1000"
    }
}
```

### 缓存代理

```caddyfile
api.example.com {
    # 缓存 GET 请求
    @cacheable {
        method GET
        not path /api/user/* /api/auth/*
    }
    
    handle @cacheable {
        # 添加缓存头
        header Cache-Control "public, max-age=300"
        
        reverse_proxy localhost:3000 {
            # 缓存相关头
            header_up Cache-Control "max-age=300"
            header_down Vary "Accept-Encoding"
        }
    }
    
    # 不缓存的请求
    handle {
        header Cache-Control "no-cache, no-store, must-revalidate"
        reverse_proxy localhost:3000
    }
}
```

## 📊 监控和调优

### 性能指标收集

```caddyfile
example.com {
    # 启用指标
    metrics /metrics {
        disable_openmetrics
    }
    
    # 性能追踪头
    header {
        X-Request-ID {uuid}
        X-Server-Instance "server-1"
        X-Processing-Start {time.now.unix_nano}
    }
    
    reverse_proxy localhost:3000 {
        header_up X-Request-Start {time.now.unix_nano}
        header_down X-Processing-End {time.now.unix_nano}
        header_down X-Response-Time {time.now.unix_nano}
    }
}
```

### 日志优化

```caddyfile
example.com {
    # 精简日志配置
    log {
        output file /var/log/caddy/access.log {
            roll_size 50mb
            roll_keep 5
        }
        format json {
            time_format "unix"
        }
    }

    reverse_proxy localhost:3000
}
```

## 🔧 系统级优化

### 操作系统调优

```bash
# /etc/sysctl.conf 优化
# 网络优化
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000

# 文件描述符限制
fs.file-max = 2097152

# 应用到系统
sudo sysctl -p
```

### Systemd 服务优化

```ini
# /etc/systemd/system/caddy.service
[Unit]
Description=Caddy
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s

# 性能优化
LimitNOFILE=1048576
LimitNPROC=1048576
LimitCORE=infinity

# 安全设置
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE

# 内存和 CPU 限制
MemoryMax=2G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
```

### Docker 优化

```dockerfile
# 优化的 Dockerfile
FROM caddy:2-alpine

# 安装性能工具
RUN apk add --no-cache curl htop

# 复制配置
COPY Caddyfile /etc/caddy/Caddyfile
COPY --chown=caddy:caddy ./site /srv

# 性能优化
ENV CADDY_ADMIN=localhost:2019
ENV GOMAXPROCS=4

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:2019/config/ || exit 1

EXPOSE 80 443 2019
```

```yaml
# docker-compose.yml 优化
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    
    # 性能配置
    cpus: '2.0'
    mem_limit: 1g
    mem_reservation: 512m
    
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
      - "2019:2019"
    
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./site:/srv
      - caddy_data:/data
      - caddy_config:/config
    
    environment:
      - CADDY_ADMIN=localhost:2019
      - GOMAXPROCS=2

volumes:
  caddy_data:
    external: true
  caddy_config:
```

## 📈 性能测试

### 基准测试脚本

```bash
#!/bin/bash
# benchmark.sh

URL="https://example.com"
CONCURRENT=100
REQUESTS=10000

echo "开始性能测试..."

# Apache Bench 测试
ab -n $REQUESTS -c $CONCURRENT -H "Accept-Encoding: gzip" $URL

# wrk 测试
wrk -t12 -c400 -d30s --latency $URL

# 自定义测试
curl -w "@curl-format.txt" -o /dev/null -s $URL
```

```
# curl-format.txt
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

---

通过这些优化措施，您可以显著提升 Caddy 的性能。记住，性能优化是一个持续的过程，需要根据实际负载情况进行调整。 ⚡
