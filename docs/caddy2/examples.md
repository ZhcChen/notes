# 实战案例集合

本章提供了各种实际应用场景的完整配置示例，帮助您快速上手 Caddy 的实际部署。

## 🌐 静态网站托管

### 个人博客网站

```caddyfile
# 个人博客配置
blog.example.com {
    # 安全头
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
    }
    
    # 压缩
    encode gzip zstd
    
    # 缓存策略
    @static path *.css *.js *.png *.jpg *.gif *.ico *.woff *.woff2
    header @static Cache-Control "public, max-age=31536000, immutable"
    
    @html path *.html
    header @html Cache-Control "public, max-age=3600"
    
    # 根目录
    root * /var/www/blog
    
    # 文件服务器
    file_server {
        precompressed gzip br
        hide .htaccess .env
    }
    
    # 自定义错误页面
    handle_errors {
        @404 expression {http.error.status_code} == 404
        handle @404 {
            rewrite * /404.html
            file_server
        }
    }
}

# 重定向 www 到非 www
www.blog.example.com {
    redir https://blog.example.com{uri} permanent
}
```

### 多语言静态站点

```caddyfile
example.com {
    # 根据 Accept-Language 头重定向
    @chinese header Accept-Language *zh*
    redir @chinese /zh{uri} 302
    
    @english header Accept-Language *en*
    redir @english /en{uri} 302
    
    # 语言特定路径
    handle /zh/* {
        root * /var/www/site/zh
        rewrite * {path}
        try_files {path} {path}/ {path}/index.html /zh/index.html
        file_server
    }
    
    handle /en/* {
        root * /var/www/site/en
        rewrite * {path}
        try_files {path} {path}/ {path}/index.html /en/index.html
        file_server
    }
    
    # 默认语言（英文）
    handle {
        root * /var/www/site/en
        try_files {path} {path}/ {path}/index.html /index.html
        file_server
    }
}
```

## 🚀 单页应用 (SPA)

### React/Vue/Angular 应用

```caddyfile
app.example.com {
    # API 代理
    handle /api/* {
        reverse_proxy localhost:3000 {
            header_up Host {upstream_hostport}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
    
    # 静态资源
    handle /static/* {
        root * /var/www/app
        file_server {
            precompressed gzip br
        }
        
        # 长期缓存
        header Cache-Control "public, max-age=31536000, immutable"
    }
    
    # SPA 路由处理
    handle {
        root * /var/www/app
        
        # 尝试文件，如果不存在则返回 index.html
        try_files {path} {path}/ /index.html
        
        file_server
        
        # HTML 文件短期缓存
        @html path *.html
        header @html Cache-Control "public, max-age=300"
    }
    
    # 压缩
    encode gzip zstd
    
    # 安全头
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
    }
}
```

### PWA 应用

```caddyfile
pwa.example.com {
    # Service Worker 特殊处理
    @sw path /sw.js /service-worker.js
    header @sw {
        Cache-Control "no-cache, no-store, must-revalidate"
        Service-Worker-Allowed "/"
    }
    
    # Manifest 文件
    @manifest path /manifest.json
    header @manifest {
        Content-Type "application/manifest+json"
        Cache-Control "public, max-age=86400"
    }
    
    # 静态资源缓存
    @static path *.css *.js *.png *.jpg *.gif *.ico *.woff *.woff2
    header @static Cache-Control "public, max-age=31536000, immutable"
    
    # 压缩
    encode gzip zstd
    
    # 根目录
    root * /var/www/pwa
    
    # SPA 路由
    try_files {path} {path}/ /index.html
    
    file_server {
        precompressed gzip br
    }
}
```

## 🔄 反向代理场景

### 微服务架构

```caddyfile
{
    email admin@example.com
}

# API 网关
api.example.com {
    # 用户服务
    handle /users/* {
        reverse_proxy user-service-1:8080 user-service-2:8080 {
            lb_policy round_robin
            health_uri /health
            health_interval 30s
        }
    }
    
    # 订单服务
    handle /orders/* {
        reverse_proxy order-service-1:8080 order-service-2:8080 {
            lb_policy least_conn
            health_uri /health
            health_interval 30s
        }
    }
    
    # 支付服务
    handle /payments/* {
        reverse_proxy payment-service:8080 {
            health_uri /health
            health_interval 15s
        }
    }
    
    # 认证服务
    handle /auth/* {
        reverse_proxy auth-service:8080
    }
    
    # 全局中间件
    header {
        X-API-Gateway "Caddy"
        X-Request-ID {uuid}
        Access-Control-Allow-Origin "https://app.example.com"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
    
    # 限流
    rate_limit {
        zone api {
            key {header.authorization}
            events 1000
            window 1h
        }
    }
    
    # 默认响应
    respond "API Gateway" 200
}

# 前端应用
app.example.com {
    reverse_proxy frontend:3000
}

# 管理后台
admin.example.com {
    basicauth {
        admin $2a$14$hgl486...
    }
    
    reverse_proxy admin-panel:8080
}
```

### WordPress 多站点

```caddyfile
# 主站点
example.com {
    reverse_proxy wordpress:80 {
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}

# 子站点
blog.example.com {
    reverse_proxy wordpress-blog:80 {
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}

# 商店站点
shop.example.com {
    reverse_proxy wordpress-shop:80 {
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}

# 静态资源 CDN
cdn.example.com {
    root * /var/www/cdn
    
    # 长期缓存
    header Cache-Control "public, max-age=31536000, immutable"
    
    # 压缩
    encode gzip zstd
    
    file_server {
        precompressed gzip br
    }
}
```

## 🔐 企业级应用

### 内网应用代理

```caddyfile
{
    email admin@company.com
    
    # 内网 CA 证书
    local_certs
}

# 内网应用门户
portal.company.local {
    # 基于 IP 的访问控制
    @internal remote_ip 192.168.0.0/16 10.0.0.0/8
    @external not remote_ip 192.168.0.0/16 10.0.0.0/8
    
    # 外网用户需要 VPN 认证
    handle @external {
        respond "Access denied. VPN required." 403
    }
    
    # 内网用户正常访问
    handle @internal {
        root * /var/www/portal
        file_server
    }
}

# ERP 系统
erp.company.local {
    @internal remote_ip 192.168.0.0/16
    
    handle @internal {
        # LDAP 认证（需要插件）
        auth_portal {
            backends {
                ldap_backend {
                    method ldap
                    realm local
                    servers {
                        ldap://ldap.company.local:389
                    }
                    attributes {
                        name givenName
                        surname sn
                        username sAMAccountName
                        member_of memberOf
                    }
                    username "CN=caddy,OU=Service Accounts,DC=company,DC=local"
                    password "service_password"
                    search_base_dn "DC=company,DC=local"
                    search_filter "(&(|(sAMAccountName=%s)(mail=%s))(objectclass=person))"
                }
            }
        }
        
        reverse_proxy erp-server:8080
    }
    
    respond @external "Access denied" 403
}

# 监控系统
monitoring.company.local {
    @admin remote_ip 192.168.1.0/24  # 管理员网段
    @user remote_ip 192.168.0.0/16   # 普通用户网段
    
    # 管理员全权限
    handle @admin {
        reverse_proxy grafana:3000
    }
    
    # 普通用户只读权限
    handle @user {
        reverse_proxy grafana:3000 {
            header_up X-WEBAUTH-USER "readonly"
        }
    }
    
    respond "Access denied" 403
}
```

### 多租户 SaaS 应用

```caddyfile
{
    email admin@saas-platform.com
}

# 主平台
saas-platform.com {
    reverse_proxy platform:3000
}

# 租户子域名
*.saas-platform.com {
    @tenant header Host ~^([^.]+)\.saas-platform\.com$
    
    # 提取租户 ID
    vars tenant_id {re.tenant.1}
    
    # 路由到租户特定的后端
    reverse_proxy tenant-app:8080 {
        header_up X-Tenant-ID {vars.tenant_id}
        header_up Host saas-platform.com
    }
}

# 自定义域名支持
{$CUSTOM_DOMAIN} {
    # 从数据库查询租户信息（需要自定义插件）
    @valid_domain {
        # 这里需要自定义逻辑验证域名
    }
    
    handle @valid_domain {
        reverse_proxy tenant-app:8080 {
            header_up X-Custom-Domain {host}
        }
    }
    
    respond "Domain not configured" 404
}
```

## 🛡️ 安全加固案例

### 高安全性网站

```caddyfile
secure.example.com {
    # 强制 TLS 1.3
    tls {
        protocols tls1.3
        ciphers TLS_AES_256_GCM_SHA384 TLS_CHACHA20_POLY1305_SHA256
        curves x25519
    }
    
    # 严格的安全头
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'"
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        X-XSS-Protection "1; mode=block"
        Referrer-Policy no-referrer
        Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
        -Server
        -X-Powered-By
    }
    
    # 严格的访问控制
    @admin path /admin/*
    handle @admin {
        # 双因素认证（需要插件）
        basicauth {
            admin $2a$14$hgl486...
        }
        
        # IP 白名单
        @allowed_admin remote_ip 203.0.113.0/24
        respond @allowed_admin {
            root * /var/www/admin
            file_server
        }
        
        respond "Access denied" 403
    }
    
    # 输入验证
    @suspicious {
        query *<script* *javascript:* *vbscript:*
        query *union+select* *1=1* *'or'1'='1*
        path */etc/passwd* */proc/self/environ*
        header User-Agent *sqlmap* *nikto* *w3af*
    }
    
    handle @suspicious {
        respond "Invalid request" 400
    }
    
    # 限流
    rate_limit {
        zone secure {
            key {remote_host}
            events 50
            window 1m
        }
    }
    
    # 正常内容
    handle {
        root * /var/www/secure
        file_server {
            hide .* *.bak *.config *.log
        }
    }
}
```

### API 安全网关

```caddyfile
api-secure.example.com {
    # CORS 预检请求
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header {
            Access-Control-Allow-Origin "https://trusted-app.example.com"
            Access-Control-Allow-Methods "GET, POST, PUT, DELETE"
            Access-Control-Allow-Headers "Content-Type, Authorization, X-API-Key"
            Access-Control-Max-Age "86400"
        }
        respond "" 204
    }
    
    # API 密钥验证
    @no_api_key not header X-API-Key *
    respond @no_api_key "API key required" 401
    
    # 速率限制（基于 API 密钥）
    rate_limit {
        zone api_key {
            key {header.x-api-key}
            events 1000
            window 1h
        }
    }
    
    # 请求大小限制
    request_body {
        max_size 1MB
    }
    
    # 内容类型验证
    @invalid_content_type {
        method POST PUT PATCH
        not header Content-Type application/json*
    }
    respond @invalid_content_type "Invalid Content-Type" 400
    
    # 安全头
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Cache-Control "no-cache, no-store, must-revalidate"
        Access-Control-Allow-Origin "https://trusted-app.example.com"
        -Server
    }
    
    # 代理到后端
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-For {remote_host}
        header_up X-Real-IP {remote_host}
        header_up X-API-Gateway "Caddy-Secure"
    }
}
```

## 🔧 开发环境配置

### 本地开发代理

```caddyfile
{
    local_certs
    admin localhost:2019
}

# 前端开发服务器
app.localhost {
    reverse_proxy localhost:3000
}

# 后端 API
api.localhost {
    reverse_proxy localhost:8080
}

# 数据库管理工具
db.localhost {
    reverse_proxy localhost:8081
}

# 文档站点
docs.localhost {
    root * ./docs
    file_server browse
}

# 静态文件服务
static.localhost {
    root * ./public
    file_server browse
}

# 测试环境
test.localhost {
    reverse_proxy localhost:3001
}
```

### 多项目开发环境

```caddyfile
{
    local_certs
}

# 项目 A
project-a.localhost {
    handle /api/* {
        reverse_proxy localhost:3000
    }
    
    handle {
        reverse_proxy localhost:8080  # 前端开发服务器
    }
}

# 项目 B
project-b.localhost {
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    handle {
        reverse_proxy localhost:8081
    }
}

# 共享服务
services.localhost {
    handle /redis/* {
        reverse_proxy localhost:8082  # Redis 管理界面
    }
    
    handle /mongo/* {
        reverse_proxy localhost:8083  # MongoDB 管理界面
    }
    
    handle /mail/* {
        reverse_proxy localhost:8084  # 邮件测试工具
    }
}
```

---

这些实战案例涵盖了 Caddy 的主要应用场景。您可以根据自己的需求调整和组合这些配置。 🎯
