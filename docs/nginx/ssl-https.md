# Nginx SSL/HTTPS 配置

HTTPS 已成为现代 Web 应用的标准配置。本章将详细介绍如何在 Nginx 中配置 SSL/TLS 证书和 HTTPS。

## 🔒 基础 SSL 配置

### 简单 HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    # SSL 证书配置
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    
    # 网站根目录
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

### 多域名 SSL 配置

```nginx
# 主域名
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    
    root /var/www/example.com;
    index index.html;
}

# 子域名
server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /etc/ssl/certs/api.example.com.crt;
    ssl_certificate_key /etc/ssl/private/api.example.com.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

# 通配符证书
server {
    listen 443 ssl http2;
    server_name *.example.com;
    
    ssl_certificate /etc/ssl/certs/wildcard.example.com.crt;
    ssl_certificate_key /etc/ssl/private/wildcard.example.com.key;
    
    # 根据子域名路由
    set $subdomain "";
    if ($host ~* "^(.+)\.example\.com$") {
        set $subdomain $1;
    }
    
    root /var/www/subdomains/$subdomain;
    index index.html;
}
```

## 🛡️ SSL 安全配置

### 现代 SSL 配置

```nginx
# SSL 全局配置
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# SSL 会话配置
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # 其他安全头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    root /var/www/html;
    index index.html;
}
```

### 高安全性配置

```nginx
# 极高安全性配置
ssl_protocols TLSv1.3;
ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256;
ssl_ecdh_curve secp384r1;
ssl_prefer_server_ciphers on;

# 禁用不安全的功能
ssl_session_tickets off;
ssl_buffer_size 4k;

server {
    listen 443 ssl http2;
    server_name secure.example.com;
    
    ssl_certificate /etc/ssl/certs/secure.example.com.crt;
    ssl_certificate_key /etc/ssl/private/secure.example.com.key;
    
    # 严格的 HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # 内容安全策略
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;
    
    # 其他安全头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    
    root /var/www/secure;
    index index.html;
}
```

## 📜 证书管理

### Let's Encrypt 证书

#### 使用 Certbot 获取证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d example.com -d www.example.com

# 仅获取证书（不自动配置）
sudo certbot certonly --webroot -w /var/www/html -d example.com

# 通配符证书（需要 DNS 验证）
sudo certbot certonly --manual --preferred-challenges dns -d "*.example.com" -d example.com
```

#### 手动配置 Let's Encrypt

```nginx
# 临时配置用于证书验证
server {
    listen 80;
    server_name example.com www.example.com;
    
    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    root /var/www/html;
    index index.html;
}
```

#### 自动续期配置

```bash
# 添加 cron 任务
sudo crontab -e

# 每天检查并续期证书
0 12 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"

# 或使用 systemd timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 自签名证书

#### 生成自签名证书

```bash
# 生成私钥
sudo openssl genrsa -out /etc/ssl/private/example.com.key 2048

# 生成证书签名请求
sudo openssl req -new -key /etc/ssl/private/example.com.key -out /etc/ssl/certs/example.com.csr

# 生成自签名证书
sudo openssl x509 -req -days 365 -in /etc/ssl/certs/example.com.csr -signkey /etc/ssl/private/example.com.key -out /etc/ssl/certs/example.com.crt

# 一步生成（用于测试）
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/example.com.key -out /etc/ssl/certs/example.com.crt -subj "/C=US/ST=State/L=City/O=Organization/CN=example.com"
```

#### 生成通配符自签名证书

```bash
# 创建配置文件
sudo tee /etc/ssl/openssl.cnf > /dev/null <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
CN = *.example.com

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.example.com
DNS.2 = example.com
EOF

# 生成证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/wildcard.example.com.key -out /etc/ssl/certs/wildcard.example.com.crt -config /etc/ssl/openssl.cnf -extensions v3_req
```

## 🔧 高级 SSL 配置

### 客户端证书认证

```nginx
server {
    listen 443 ssl http2;
    server_name secure.example.com;
    
    ssl_certificate /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/private/server.key;
    
    # 客户端证书配置
    ssl_client_certificate /etc/ssl/certs/ca.crt;
    ssl_verify_client on;  # 或 optional, optional_no_ca
    ssl_verify_depth 2;
    
    # 传递客户端证书信息
    proxy_set_header X-SSL-Client-Cert $ssl_client_cert;
    proxy_set_header X-SSL-Client-DN $ssl_client_s_dn;
    proxy_set_header X-SSL-Client-Serial $ssl_client_serial;
    proxy_set_header X-SSL-Client-Verify $ssl_client_verify;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL 代理配置

```nginx
# 代理到 HTTPS 后端
upstream backend_ssl {
    server backend1.example.com:443;
    server backend2.example.com:443;
}

server {
    listen 443 ssl http2;
    server_name proxy.example.com;
    
    ssl_certificate /etc/ssl/certs/proxy.example.com.crt;
    ssl_certificate_key /etc/ssl/private/proxy.example.com.key;
    
    location / {
        proxy_pass https://backend_ssl;
        
        # 后端 SSL 配置
        proxy_ssl_verify on;
        proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
        proxy_ssl_protocols TLSv1.2 TLSv1.3;
        proxy_ssl_ciphers HIGH:!aNULL:!MD5;
        proxy_ssl_session_reuse on;
        
        # 头部设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### SNI 配置

```nginx
# 多个 SSL 证书配置
server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    
    root /var/www/example.com;
}

server {
    listen 443 ssl http2;
    server_name test.com;
    
    ssl_certificate /etc/ssl/certs/test.com.crt;
    ssl_certificate_key /etc/ssl/private/test.com.key;
    
    root /var/www/test.com;
}

# 默认 SSL 服务器
server {
    listen 443 ssl http2 default_server;
    server_name _;
    
    ssl_certificate /etc/ssl/certs/default.crt;
    ssl_certificate_key /etc/ssl/private/default.key;
    
    return 444;  # 关闭连接
}
```

## 📊 SSL 监控和调试

### SSL 状态检查

```bash
# 检查证书信息
openssl x509 -in /etc/ssl/certs/example.com.crt -text -noout

# 检查证书有效期
openssl x509 -in /etc/ssl/certs/example.com.crt -noout -dates

# 检查私钥
openssl rsa -in /etc/ssl/private/example.com.key -check

# 验证证书和私钥匹配
openssl x509 -noout -modulus -in /etc/ssl/certs/example.com.crt | openssl md5
openssl rsa -noout -modulus -in /etc/ssl/private/example.com.key | openssl md5

# 测试 SSL 连接
openssl s_client -connect example.com:443 -servername example.com

# 检查 SSL 配置
curl -I https://example.com
```

### SSL 监控脚本

```bash
#!/bin/bash
# ssl_monitor.sh

DOMAIN="example.com"
CERT_FILE="/etc/ssl/certs/example.com.crt"
DAYS_BEFORE_EXPIRY=30

# 检查证书过期时间
EXPIRY_DATE=$(openssl x509 -in $CERT_FILE -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

echo "Certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days"

if [ $DAYS_UNTIL_EXPIRY -lt $DAYS_BEFORE_EXPIRY ]; then
    echo "WARNING: Certificate expires soon!"
    # 发送告警
    # mail -s "SSL Certificate Warning" admin@example.com < /dev/null
fi

# 检查 SSL 配置
echo "Testing SSL configuration..."
curl -I https://$DOMAIN > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "SSL connection successful"
else
    echo "ERROR: SSL connection failed"
fi

# 检查 HSTS
HSTS=$(curl -I https://$DOMAIN 2>/dev/null | grep -i strict-transport-security)
if [ -n "$HSTS" ]; then
    echo "HSTS enabled: $HSTS"
else
    echo "WARNING: HSTS not enabled"
fi
```

### SSL 性能监控

```nginx
# SSL 性能日志
log_format ssl_performance '$remote_addr - $remote_user [$time_local] '
                          '"$request" $status $body_bytes_sent '
                          '"$http_referer" "$http_user_agent" '
                          'ssl_protocol=$ssl_protocol '
                          'ssl_cipher=$ssl_cipher '
                          'ssl_session_reused=$ssl_session_reused '
                          'request_time=$request_time';

server {
    listen 443 ssl http2;
    server_name example.com;
    
    access_log /var/log/nginx/ssl_performance.log ssl_performance;
    
    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    
    root /var/www/html;
}
```

## 🔧 故障排除

### 常见 SSL 错误

```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查证书文件权限
ls -la /etc/ssl/certs/example.com.crt
ls -la /etc/ssl/private/example.com.key

# 修复权限
sudo chmod 644 /etc/ssl/certs/example.com.crt
sudo chmod 600 /etc/ssl/private/example.com.key
sudo chown root:root /etc/ssl/certs/example.com.crt
sudo chown root:root /etc/ssl/private/example.com.key

# 检查证书链
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/example.com.crt

# 测试 SSL 握手
openssl s_client -connect example.com:443 -servername example.com -verify_return_error
```

### SSL 调试配置

```nginx
# 启用 SSL 调试日志
error_log /var/log/nginx/ssl_debug.log debug;

server {
    listen 443 ssl http2;
    server_name debug.example.com;
    
    ssl_certificate /etc/ssl/certs/debug.example.com.crt;
    ssl_certificate_key /etc/ssl/private/debug.example.com.key;
    
    # 添加调试头
    add_header X-SSL-Protocol $ssl_protocol always;
    add_header X-SSL-Cipher $ssl_cipher always;
    add_header X-SSL-Session-Reused $ssl_session_reused always;
    
    location / {
        return 200 "SSL Debug Info:
Protocol: $ssl_protocol
Cipher: $ssl_cipher
Session Reused: $ssl_session_reused
Client Cert: $ssl_client_verify
";
        add_header Content-Type text/plain;
    }
}
```

---

通过这些 SSL/HTTPS 配置，您可以为网站提供安全可靠的加密连接。接下来我们将学习 Nginx 模块系统。 🔒
