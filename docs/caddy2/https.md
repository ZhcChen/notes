# 自动 HTTPS 配置

Caddy 的自动 HTTPS 是其最著名的特性之一，可以自动获取、安装和续期 SSL/TLS 证书，让 HTTPS 配置变得极其简单。

## 🔒 自动 HTTPS 基础

### 零配置 HTTPS

```caddyfile
example.com {
    respond "Hello, HTTPS World!"
}
```

就这么简单！Caddy 会自动：
1. 从 Let's Encrypt 获取证书
2. 配置 HTTPS 监听器
3. 设置 HTTP 到 HTTPS 的重定向
4. 定期续期证书

### 工作原理

```
1. 客户端访问 http://example.com
2. Caddy 重定向到 https://example.com
3. 如果没有证书，Caddy 自动获取
4. 使用 ACME 协议与 Let's Encrypt 通信
5. 完成域名验证（HTTP-01 或 TLS-ALPN-01）
6. 获取并安装证书
7. 提供 HTTPS 服务
```

## ⚙️ 全局 HTTPS 配置

### 基本全局配置

```caddyfile
{
    # 管理员邮箱（必需）
    email admin@example.com
    
    # 默认 ACME CA
    acme_ca https://acme-v02.api.letsencrypt.org/directory
    
    # 备用 CA
    acme_ca_root /path/to/ca-cert.pem
}

example.com {
    respond "Secure site"
}
```

### ACME 服务器配置

```caddyfile
{
    email admin@example.com
    
    # Let's Encrypt 生产环境（默认）
    acme_ca https://acme-v02.api.letsencrypt.org/directory
    
    # Let's Encrypt 测试环境
    # acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
    
    # ZeroSSL
    # acme_ca https://acme.zerossl.com/v2/DV90
    
    # 自定义 ACME 服务器
    # acme_ca https://your-acme-server.com/directory
}
```

### 证书存储配置

```caddyfile
{
    email admin@example.com
    
    # 文件系统存储（默认）
    storage file_system {
        root /var/lib/caddy
    }
    
    # Redis 存储
    # storage redis {
    #     host localhost:6379
    #     password {$REDIS_PASSWORD}
    #     db 0
    # }
    
    # Consul 存储
    # storage consul {
    #     address localhost:8500
    #     prefix "caddy"
    # }
}
```

## 🎯 域名验证方式

### HTTP-01 验证（默认）

```caddyfile
example.com {
    # HTTP-01 验证通过 /.well-known/acme-challenge/ 路径
    # 需要端口 80 可访问
    respond "Hello World"
}
```

### TLS-ALPN-01 验证

```caddyfile
{
    email admin@example.com
    
    # 首选 TLS-ALPN-01 验证
    acme_ca https://acme-v02.api.letsencrypt.org/directory {
        challenges tls-alpn-01
    }
}

example.com {
    respond "Hello World"
}
```

### DNS-01 验证

```caddyfile
{
    email admin@example.com
    
    # DNS-01 验证（需要 DNS 插件）
    acme_ca https://acme-v02.api.letsencrypt.org/directory {
        challenges dns-01
        dns cloudflare {$CLOUDFLARE_API_TOKEN}
    }
}

# 支持通配符证书
*.example.com {
    respond "Wildcard certificate"
}
```

## 🌟 高级 HTTPS 配置

### 自定义 TLS 配置

```caddyfile
example.com {
    tls {
        # 自定义证书和密钥
        # cert /path/to/cert.pem
        # key /path/to/key.pem
        
        # 协议版本
        protocols tls1.2 tls1.3
        
        # 密码套件
        ciphers TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
        
        # 曲线
        curves x25519 secp384r1 secp256r1
        
        # ALPN 协议
        alpn h2 http/1.1
    }
    
    respond "Custom TLS config"
}
```

### 客户端证书认证

```caddyfile
secure.example.com {
    tls {
        client_auth {
            # 验证模式
            mode require_and_verify
            # mode request
            # mode require
            
            # 受信任的 CA 证书
            trusted_ca_cert_file /etc/ssl/client-ca.pem
            
            # 证书撤销列表
            # trusted_leaf_cert_file /etc/ssl/client-cert.pem
        }
    }
    
    respond "Client certificate required"
}
```

### OCSP Stapling

```caddyfile
example.com {
    tls {
        # 启用 OCSP Stapling（默认启用）
        ocsp_stapling on
        
        # 自定义 OCSP 响应器
        # ocsp_stapling_responder https://ocsp.example.com
    }
    
    respond "OCSP Stapling enabled"
}
```

## 🔧 证书管理

### 手动证书管理

```bash
# 查看证书信息
curl -s https://localhost:2019/config/apps/tls/certificates | jq

# 手动获取证书
caddy trust
caddy untrust

# 清理过期证书
caddy cleanup
```

### 证书自动续期

```caddyfile
{
    email admin@example.com
    
    # 续期配置
    cert_lifetime 90d  # 证书有效期
    renew_ahead 30d    # 提前续期时间
}
```

### 证书备份和恢复

```bash
# 备份证书存储
tar -czf caddy-certs-backup.tar.gz /var/lib/caddy

# 恢复证书存储
tar -xzf caddy-certs-backup.tar.gz -C /
```

## 🌐 多域名和通配符

### 多域名证书

```caddyfile
example.com, www.example.com, api.example.com {
    respond "Multi-domain certificate"
}
```

### 通配符证书

```caddyfile
{
    email admin@example.com
    
    # 需要 DNS-01 验证
    acme_ca https://acme-v02.api.letsencrypt.org/directory {
        challenges dns-01
        dns cloudflare {$CLOUDFLARE_API_TOKEN}
    }
}

*.example.com {
    respond "Wildcard certificate for {host}"
}

# 同时支持根域名
example.com {
    respond "Root domain"
}
```

### 子域名配置

```caddyfile
# 不同子域名不同配置
api.example.com {
    reverse_proxy localhost:3000
}

blog.example.com {
    root * /var/www/blog
    file_server
}

*.dev.example.com {
    reverse_proxy localhost:8080
}
```

## 🔐 安全最佳实践

### HSTS 配置

```caddyfile
example.com {
    header {
        # HTTP 严格传输安全
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
    
    respond "HSTS enabled"
}
```

### 安全头配置

```caddyfile
example.com {
    header {
        # HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        
        # 内容安全策略
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        # 其他安全头
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
        
        # 隐藏服务器信息
        -Server
    }
    
    respond "Security headers configured"
}
```

### 证书透明度日志

```caddyfile
{
    email admin@example.com
    
    # 启用证书透明度日志监控
    cert_transparency_logs [
        "https://ct.googleapis.com/logs/argon2024/",
        "https://ct.cloudflare.com/logs/nimbus2024/"
    ]
}
```

## 🚨 故障排除

### 常见问题诊断

```bash
# 检查证书状态
curl -I https://example.com

# 查看证书详情
openssl s_client -connect example.com:443 -servername example.com

# 检查 ACME 挑战
curl http://example.com/.well-known/acme-challenge/test

# 查看 Caddy 日志
journalctl -u caddy -f
```

### 调试配置

```caddyfile
{
    debug
    email admin@example.com
    
    # 详细日志
    log {
        level DEBUG
        output file /var/log/caddy/debug.log
    }
}

example.com {
    log {
        output file /var/log/caddy/example.com.log
        format json
    }
    
    respond "Debug mode enabled"
}
```

### 测试环境配置

```caddyfile
{
    email admin@example.com
    
    # 使用 Let's Encrypt 测试环境
    acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
    
    # 或使用本地 CA
    # local_certs
}

test.example.com {
    respond "Test environment"
}
```

## 🔄 证书迁移

### 从其他服务器迁移

```bash
# 导入现有证书
sudo cp existing-cert.pem /var/lib/caddy/certificates/
sudo cp existing-key.pem /var/lib/caddy/certificates/
sudo chown -R caddy:caddy /var/lib/caddy/certificates/
```

```caddyfile
example.com {
    tls /var/lib/caddy/certificates/existing-cert.pem /var/lib/caddy/certificates/existing-key.pem
    respond "Using existing certificate"
}
```

### 证书格式转换

```bash
# PFX 转 PEM
openssl pkcs12 -in certificate.pfx -out certificate.pem -nodes

# DER 转 PEM
openssl x509 -inform DER -in certificate.der -out certificate.pem
```

## 📊 监控和告警

### 证书过期监控

```bash
#!/bin/bash
# cert-monitor.sh

DOMAIN="example.com"
DAYS_BEFORE_EXPIRY=30

EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt $DAYS_BEFORE_EXPIRY ]; then
    echo "Certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days!"
    # 发送告警
fi
```

### Prometheus 监控

```caddyfile
example.com {
    # 启用指标收集（需要插件）
    metrics /metrics {
        disable_openmetrics
    }
    
    respond "Metrics enabled"
}
```

---

通过自动 HTTPS，您可以轻松为网站启用安全连接。接下来我们将学习负载均衡的高级配置。 🔒
