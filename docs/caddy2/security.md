# 安全配置指南

安全是 Web 服务的重中之重。Caddy 提供了丰富的安全特性，本章将详细介绍如何配置各种安全措施。

## 🔒 HTTPS 安全

### 强制 HTTPS

```caddyfile
example.com {
    # Caddy 默认强制 HTTPS，无需额外配置
    respond "Secure connection established"
}

# 如果需要禁用自动重定向
http://insecure.example.com {
    respond "HTTP only site"
}
```

### HSTS 配置

```caddyfile
example.com {
    header {
        # HTTP 严格传输安全
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
    
    root * /var/www/html
    file_server
}
```

### TLS 配置强化

```caddyfile
example.com {
    tls {
        # 仅允许 TLS 1.2 和 1.3
        protocols tls1.2 tls1.3
        
        # 强密码套件
        ciphers TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305 TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
        
        # 椭圆曲线
        curves x25519 secp384r1 secp256r1
        
        # ALPN 协议
        alpn h2 http/1.1
    }
    
    respond "Secure TLS configuration"
}
```

## 🛡️ 安全头配置

### 基础安全头

```caddyfile
example.com {
    header {
        # 防止点击劫持
        X-Frame-Options DENY
        
        # 防止 MIME 类型嗅探
        X-Content-Type-Options nosniff
        
        # XSS 保护
        X-XSS-Protection "1; mode=block"
        
        # 引用策略
        Referrer-Policy strict-origin-when-cross-origin
        
        # 隐藏服务器信息
        -Server
        -X-Powered-By
    }
    
    root * /var/www/html
    file_server
}
```

### 内容安全策略 (CSP)

```caddyfile
example.com {
    header {
        # 基础 CSP
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self'; frame-ancestors 'none'"
        
        # 严格的 CSP
        # Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'"
        
        # CSP 报告
        # Content-Security-Policy-Report-Only "default-src 'self'; report-uri /csp-report"
    }
    
    root * /var/www/html
    file_server
}
```

### 权限策略 (Permissions Policy)

```caddyfile
example.com {
    header {
        # 权限策略（原 Feature Policy）
        Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
        
        # 或者允许特定功能
        # Permissions-Policy "camera=(self), microphone=(self), geolocation=(self 'https://maps.example.com')"
    }
    
    root * /var/www/html
    file_server
}
```

## 🔐 认证和授权

### 基本认证

```caddyfile
admin.example.com {
    basicauth {
        # 使用 bcrypt 哈希密码
        admin $2a$14$hgl486...
        user  $2a$14$xyz123...
        
        # 生成哈希密码的命令：
        # caddy hash-password --plaintext "your-password"
    }
    
    root * /var/www/admin
    file_server
}
```

### 条件认证

```caddyfile
example.com {
    # 内网用户免认证
    @internal remote_ip 192.168.0.0/16 10.0.0.0/8
    
    # 管理路径需要认证
    @admin path /admin/*
    basicauth @admin {
        skip @internal
        admin $2a$14$hgl486...
    }
    
    root * /var/www/html
    file_server
}
```

### JWT 认证（需要插件）

```caddyfile
api.example.com {
    jwt {
        primary yes
        path /api
        redirect /login
        allow sub admin
        allow aud api
        secret {$JWT_SECRET}
    }
    
    reverse_proxy localhost:3000
}
```

## 🚫 访问控制

### IP 白名单

```caddyfile
admin.example.com {
    # 只允许特定 IP 访问
    @allowed remote_ip 192.168.1.100 10.0.0.0/8 203.0.113.0/24
    respond @allowed {
        root * /var/www/admin
        file_server
    }
    
    respond "Access denied" 403
}
```

### IP 黑名单

```caddyfile
example.com {
    # 阻止特定 IP
    @blocked remote_ip 192.168.1.100 203.0.113.50
    respond @blocked "Access denied" 403
    
    root * /var/www/html
    file_server
}
```

### 地理位置限制

```caddyfile
example.com {
    # 基于国家代码限制（需要 GeoIP 数据）
    @blocked_countries header CF-IPCountry CN RU KP
    respond @blocked_countries "Service not available in your region" 403
    
    # 只允许特定国家
    @allowed_countries header CF-IPCountry US CA GB DE FR
    respond @allowed_countries {
        root * /var/www/html
        file_server
    }
    
    respond "Service not available" 403
}
```

## 🚦 限流和防护

### 基础限流

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

### 分层限流

```caddyfile
api.example.com {
    # 全局限流
    rate_limit {
        zone global {
            key {remote_host}
            events 1000
            window 1h
        }
    }
    
    # API 限流
    @api path /api/*
    rate_limit @api {
        zone api {
            key {header.x-api-key}
            events 100
            window 1m
        }
    }
    
    # 上传限流
    @upload path /upload/*
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

### DDoS 防护

```caddyfile
example.com {
    # 连接限制
    rate_limit {
        zone ddos {
            key {remote_host}
            events 50
            window 10s
        }
    }
    
    # 请求大小限制
    request_body {
        max_size 1MB
    }
    
    # 超时设置
    timeouts {
        read_timeout 10s
        read_header_timeout 5s
        write_timeout 10s
        idle_timeout 120s
    }
    
    root * /var/www/html
    file_server
}
```

## 🔍 输入验证和过滤

### 路径验证

```caddyfile
example.com {
    # 阻止路径遍历攻击
    @path_traversal path *..* */.* */.*/*
    respond @path_traversal "Invalid path" 400
    
    # 阻止敏感文件访问
    @sensitive path *.env *.config *.log *.bak *~
    respond @sensitive "File not found" 404
    
    # 阻止脚本文件直接访问
    @scripts path *.php *.asp *.jsp *.cgi
    respond @scripts "Access denied" 403
    
    root * /var/www/html
    file_server
}
```

### 请求头验证

```caddyfile
api.example.com {
    # 验证 Content-Type
    @invalid_content_type {
        method POST PUT PATCH
        not header Content-Type application/json*
    }
    respond @invalid_content_type "Invalid Content-Type" 400
    
    # 验证 User-Agent
    @no_user_agent not header User-Agent *
    respond @no_user_agent "User-Agent required" 400
    
    # 阻止恶意 User-Agent
    @malicious_ua header User-Agent *sqlmap* *nikto* *nmap* *masscan*
    respond @malicious_ua "Access denied" 403
    
    reverse_proxy localhost:3000
}
```

### SQL 注入防护

```caddyfile
api.example.com {
    # 检测 SQL 注入模式
    @sql_injection {
        query *union* *select* *insert* *update* *delete* *drop* *exec* *script*
        query *'* *"* *;* *--* */**/
    }
    respond @sql_injection "Invalid request" 400
    
    reverse_proxy localhost:3000
}
```

## 🔒 客户端证书认证

### 基础客户端证书

```caddyfile
secure.example.com {
    tls {
        client_auth {
            mode require_and_verify
            trusted_ca_cert_file /etc/ssl/client-ca.pem
        }
    }
    
    # 传递客户端证书信息
    header {
        X-Client-Cert {tls_client_certificate}
        X-Client-Subject {tls_client_subject}
        X-Client-Issuer {tls_client_issuer}
    }
    
    reverse_proxy localhost:3000
}
```

### 可选客户端证书

```caddyfile
api.example.com {
    tls {
        client_auth {
            mode request
            trusted_ca_cert_file /etc/ssl/client-ca.pem
        }
    }
    
    # 根据证书状态路由
    @authenticated header X-Client-Cert *
    handle @authenticated {
        header X-Auth-Method "certificate"
        reverse_proxy localhost:3001  # 高权限 API
    }
    
    handle {
        header X-Auth-Method "none"
        reverse_proxy localhost:3000  # 公开 API
    }
}
```

## 🛡️ 安全监控

### 安全日志

```caddyfile
example.com {
    # 安全日志配置
    log {
        output file /var/log/caddy/security.log {
            roll_size 50mb
            roll_keep 10
        }
        format json
    }

    # 记录可疑活动
    @suspicious path *..* *.php *.asp
    handle @suspicious {
        respond "Not found" 404
    }

    file_server
}
```

### 入侵检测

```caddyfile
example.com {
    # 检测常见攻击模式
    @attack_patterns {
        query *<script* *javascript:* *vbscript:*
        query *union+select* *1=1* *'or'1'='1*
        path */etc/passwd* */proc/self/environ*
        header User-Agent *sqlmap* *nikto* *w3af*
    }
    
    handle @attack_patterns {
        # 记录攻击尝试
        header X-Attack-Detected "true"
        header X-Attack-Type "pattern-match"
        header X-Client-IP {remote_host}
        
        # 返回假的 404 页面
        respond "Page not found" 404
    }
    
    root * /var/www/html
    file_server
}
```

## 🔧 安全配置模板

### 高安全性网站

```caddyfile
secure.example.com {
    # TLS 配置
    tls {
        protocols tls1.3
        ciphers TLS_AES_256_GCM_SHA384 TLS_CHACHA20_POLY1305_SHA256
        curves x25519
    }
    
    # 安全头
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
    
    # 访问控制
    @admin path /admin/*
    basicauth @admin {
        admin $2a$14$hgl486...
    }
    
    # 限流
    rate_limit {
        zone secure {
            key {remote_host}
            events 50
            window 1m
        }
    }
    
    # 输入验证
    @invalid_paths path *..* *.php *.asp *.jsp
    respond @invalid_paths "Not found" 404
    
    root * /var/www/secure
    file_server {
        hide .* *.bak *.config
    }
}
```

### API 安全配置

```caddyfile
api.example.com {
    # CORS 配置
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header {
            Access-Control-Allow-Origin "https://app.example.com"
            Access-Control-Allow-Methods "GET, POST, PUT, DELETE"
            Access-Control-Allow-Headers "Content-Type, Authorization"
            Access-Control-Max-Age "86400"
        }
        respond "" 204
    }
    
    # API 安全头
    header {
        Access-Control-Allow-Origin "https://app.example.com"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Cache-Control "no-cache, no-store, must-revalidate"
        -Server
    }
    
    # API 密钥验证
    @no_api_key not header X-API-Key *
    respond @no_api_key "API key required" 401
    
    # 限流
    rate_limit {
        zone api {
            key {header.x-api-key}
            events 1000
            window 1h
        }
    }
    
    # 请求验证
    @invalid_json {
        method POST PUT PATCH
        not header Content-Type application/json*
    }
    respond @invalid_json "Invalid Content-Type" 400
    
    # 请求大小限制
    request_body {
        max_size 1MB
    }
    
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-For {remote_host}
        header_up X-Real-IP {remote_host}
    }
}
```

---

通过这些安全配置，您可以构建一个安全可靠的 Web 服务。安全是一个持续的过程，需要定期更新和监控。 🛡️
