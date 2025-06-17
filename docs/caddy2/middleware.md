# 中间件使用指南

Caddy 的中间件系统是其强大功能的核心，提供了模块化的请求处理能力。中间件按照特定顺序执行，每个中间件都可以修改请求或响应。

## 🔄 中间件执行顺序

Caddy 中间件有固定的执行顺序，了解这个顺序对于正确配置非常重要：

```
1. map                    # 变量映射
2. root                   # 设置根目录
3. header                 # 请求头处理
4. rewrite                # URL 重写
5. try_files              # 文件尝试
6. basicauth              # 基本认证
7. request_body           # 请求体处理
8. ratelimit              # 限流
9. reverse_proxy          # 反向代理
10. file_server           # 文件服务器
11. respond               # 直接响应
```

## 🗺️ 变量映射 (map)

### 基本映射

```caddyfile
{
    map {remote_host} {backend} {
        ~^192\.168\.1\. localhost:3001    # 内网用户
        ~^10\.0\.0\.    localhost:3002    # VPN 用户
        default         localhost:3000    # 默认后端
    }
}

example.com {
    reverse_proxy {backend}
}
```

### 复杂映射

```caddyfile
{
    # 根据 User-Agent 映射后端
    map {header.user-agent} {mobile_backend} {
        ~*mobile|android|iphone localhost:3001
        default                  localhost:3000
    }
    
    # 根据时间映射缓存策略
    map {time.now.hour} {cache_duration} {
        ~^(0[0-6]|2[2-3])$ 3600    # 夜间长缓存
        default            1800     # 白天短缓存
    }
}

example.com {
    header Cache-Control "max-age={cache_duration}"
    reverse_proxy {mobile_backend}
}
```

## 📁 根目录设置 (root)

### 动态根目录

```caddyfile
example.com {
    # 根据子域名设置不同根目录
    @subdomain header Host ~^([^.]+)\.example\.com$
    root @subdomain /var/www/{re.subdomain.1}
    
    # 默认根目录
    root * /var/www/default
    
    file_server
}
```

### 条件根目录

```caddyfile
example.com {
    # 移动端使用不同目录
    @mobile header User-Agent *Mobile*
    root @mobile /var/www/mobile
    
    # 默认目录
    root * /var/www/desktop
    
    file_server
}
```

## 🏷️ 请求头处理 (header)

### 请求头修改

```caddyfile
example.com {
    # 添加请求头
    header {
        X-Forwarded-Proto {scheme}
        X-Real-IP {remote_host}
        X-Request-ID {uuid}
        
        # 删除敏感头
        -Authorization
        -Cookie
        
        # 条件添加头
        ?X-Debug-Mode "on"  # 仅在不存在时添加
    }
    
    reverse_proxy localhost:3000
}
```

### 响应头修改

```caddyfile
example.com {
    # 安全头
    header {
        # HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        
        # 内容安全策略
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'"
        
        # 其他安全头
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        
        # 隐藏服务器信息
        -Server
        -X-Powered-By
    }
    
    root * /var/www/html
    file_server
}
```

### 条件头处理

```caddyfile
example.com {
    # 根据文件类型设置缓存头
    @static path *.css *.js *.png *.jpg *.gif
    header @static Cache-Control "public, max-age=31536000"
    
    @html path *.html
    header @html Cache-Control "public, max-age=3600"
    
    @api path /api/*
    header @api {
        Cache-Control "no-cache, no-store, must-revalidate"
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE"
    }
    
    root * /var/www/html
    file_server
}
```

## 🔄 URL 重写 (rewrite)

### 基本重写

```caddyfile
example.com {
    # 移除 .html 扩展名
    rewrite /about /about.html
    rewrite /contact /contact.html
    
    # 使用正则表达式
    rewrite ^/blog/([0-9]+)$ /blog.php?id=$1
    
    # 条件重写
    @old_api path /api/v1/*
    rewrite @old_api /api/v2{path}
    
    root * /var/www/html
    file_server
}
```

### 高级重写

```caddyfile
example.com {
    # 多语言重写
    @chinese header Accept-Language *zh*
    rewrite @chinese /zh{path}
    
    @english header Accept-Language *en*
    rewrite @english /en{path}
    
    # 移动端重写
    @mobile header User-Agent *Mobile*
    rewrite @mobile /mobile{path}
    
    # SEO 友好 URL
    rewrite ^/product/([^/]+)/?$ /product.php?slug=$1
    rewrite ^/category/([^/]+)/page/([0-9]+)/?$ /category.php?name=$1&page=$2
    
    root * /var/www/html
    file_server
}
```

## 📂 文件尝试 (try_files)

### SPA 应用

```caddyfile
spa.example.com {
    root * /var/www/spa
    
    # 尝试文件，如果不存在则返回 index.html
    try_files {path} {path}/ /index.html
    
    file_server
}
```

### 复杂文件尝试

```caddyfile
example.com {
    root * /var/www/html
    
    # 多级文件尝试
    try_files {path} {path}.html {path}/index.html /404.html
    
    # 条件文件尝试
    @api path /api/*
    try_files @api {path} /api/index.php
    
    file_server
}
```

## 🔐 基本认证 (basicauth)

### 简单认证

```caddyfile
admin.example.com {
    basicauth {
        admin $2a$14$hgl486...  # bcrypt 哈希密码
        user  $2a$14$xyz123...
    }
    
    root * /var/www/admin
    file_server
}
```

### 条件认证

```caddyfile
example.com {
    # 仅对管理路径要求认证
    @admin path /admin/*
    basicauth @admin {
        admin $2a$14$hgl486...
    }
    
    # 内网用户免认证
    @internal remote_ip 192.168.0.0/16
    basicauth @admin {
        skip @internal
        admin $2a$14$hgl486...
    }
    
    root * /var/www/html
    file_server
}
```

## 📦 请求体处理 (request_body)

### 请求体限制

```caddyfile
api.example.com {
    # 限制请求体大小
    request_body {
        max_size 10MB
    }
    
    # 不同路径不同限制
    @upload path /upload/*
    request_body @upload {
        max_size 100MB
    }
    
    @api path /api/*
    request_body @api {
        max_size 1MB
    }
    
    reverse_proxy localhost:3000
}
```

## 🚦 限流 (rate_limit)

### 基本限流

```caddyfile
api.example.com {
    rate_limit {
        zone api {
            key {remote_host}
            events 100
            window 1m
        }
    }
    
    reverse_proxy localhost:3000
}
```

### 复杂限流策略

```caddyfile
api.example.com {
    # 不同路径不同限流策略
    @public path /api/public/*
    rate_limit @public {
        zone public {
            key {remote_host}
            events 1000
            window 1h
        }
    }
    
    @private path /api/private/*
    rate_limit @private {
        zone private {
            key {header.authorization}
            events 100
            window 1m
        }
    }
    
    # 上传接口特殊限制
    @upload path /api/upload/*
    rate_limit @upload {
        zone upload {
            key {remote_host}
            events 10
            window 1m
        }
    }
    
    reverse_proxy localhost:3000
}
```

## 🔧 自定义中间件链

### 完整的中间件链

```caddyfile
example.com {
    # 1. 变量映射
    map {header.user-agent} {device_type} {
        ~*mobile mobile
        ~*tablet tablet
        default  desktop
    }
    
    # 2. 根目录设置
    root * /var/www/{device_type}
    
    # 3. 请求头处理
    header {
        X-Device-Type {device_type}
        X-Request-ID {uuid}
        -Server
    }
    
    # 4. URL 重写
    @api path /api/*
    rewrite @api /api/v2{path}
    
    # 5. 文件尝试
    try_files {path} {path}.html {path}/index.html
    
    # 6. 基本认证
    @admin path /admin/*
    basicauth @admin {
        admin $2a$14$hgl486...
    }
    
    # 7. 请求体限制
    @upload path /upload/*
    request_body @upload {
        max_size 50MB
    }
    
    # 8. 限流
    rate_limit {
        zone main {
            key {remote_host}
            events 500
            window 1m
        }
    }
    
    # 9. 文件服务器
    file_server {
        hide .htaccess .env
        browse
    }
}
```

## 📊 中间件监控

### 日志记录

```caddyfile
example.com {
    # 详细的访问日志
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 10
        }
        format json {
            time_format "2006-01-02T15:04:05.000Z07:00"
            message_key "msg"
            level_key "level"
            time_key "ts"
        }
        include http.request.headers
        include http.response.headers
    }
    
    # 添加追踪头
    header X-Request-ID {uuid}
    header X-Processing-Time {time.now.unix_nano}
    
    reverse_proxy localhost:3000 {
        header_down X-Response-Time {time.now.unix_nano}
    }
}
```

### 指标收集

```caddyfile
example.com {
    # 启用指标端点
    metrics /metrics {
        disable_openmetrics
    }
    
    # 添加自定义标签
    header X-Server-Instance "server-1"
    header X-Version "v1.2.3"
    
    reverse_proxy localhost:3000
}
```

## 🎯 实际应用场景

### API 网关中间件链

```caddyfile
gateway.example.com {
    # 1. 限流
    rate_limit {
        zone gateway {
            key {header.x-api-key}
            events 1000
            window 1h
        }
    }
    
    # 2. 认证
    @authenticated header X-API-Key *
    respond @authenticated "API Key required" 401
    
    # 3. 请求头处理
    header {
        X-Gateway "Caddy"
        X-Request-ID {uuid}
        X-Forwarded-For {remote_host}
    }
    
    # 4. 路由重写
    @v1 path /v1/*
    rewrite @v1 /api/v1{path}
    
    @v2 path /v2/*
    rewrite @v2 /api/v2{path}
    
    # 5. 反向代理
    reverse_proxy localhost:3000 {
        header_up X-Original-URI {uri}
        header_down X-Response-Time {time.now.unix_nano}
    }
}
```

### 静态站点中间件链

```caddyfile
blog.example.com {
    # 1. 压缩
    encode gzip zstd
    
    # 2. 安全头
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
    }
    
    # 3. 缓存控制
    @static path *.css *.js *.png *.jpg *.gif *.woff *.woff2
    header @static Cache-Control "public, max-age=31536000, immutable"
    
    @html path *.html
    header @html Cache-Control "public, max-age=3600"
    
    # 4. URL 重写（移除 .html）
    @html_ext path *.html
    rewrite @html_ext {path_regexp ^(.*)\.html$ $1}
    
    # 5. 文件尝试
    try_files {path} {path}.html {path}/index.html
    
    # 6. 文件服务器
    root * /var/www/blog
    file_server {
        precompressed gzip br
    }
}
```

---

通过合理配置中间件链，您可以构建功能强大、性能优异的 Web 服务。接下来我们将学习安全配置。 🔧
