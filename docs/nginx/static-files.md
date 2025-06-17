# Nginx 静态文件服务

Nginx 以其出色的静态文件服务性能而闻名。本章将详细介绍如何配置 Nginx 来高效地服务静态文件。

## 🎯 基础静态文件配置

### 简单静态网站

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    
    # 网站根目录
    root /var/www/example.com;
    
    # 默认索引文件
    index index.html index.htm;
    
    # 主要位置块
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 访问和错误日志
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
}
```

### 多目录配置

```nginx
server {
    listen 80;
    server_name files.example.com;
    
    # 主目录
    location / {
        root /var/www/html;
        index index.html;
    }
    
    # 图片目录
    location /images/ {
        root /var/www;
        # 实际路径：/var/www/images/
    }
    
    # 下载目录（使用 alias）
    location /downloads/ {
        alias /var/www/files/;
        # 实际路径：/var/www/files/
    }
    
    # 文档目录
    location /docs/ {
        root /var/www;
        autoindex on;  # 启用目录浏览
    }
}
```

## 📁 目录浏览配置

### 启用目录浏览

```nginx
server {
    listen 80;
    server_name files.example.com;
    root /var/www/files;
    
    location / {
        autoindex on;                # 启用目录浏览
        autoindex_exact_size off;    # 显示文件大小（KB、MB）
        autoindex_localtime on;      # 显示本地时间
        autoindex_format html;       # 输出格式：html、xml、json、jsonp
    }
}
```

### 自定义目录浏览样式

```nginx
server {
    listen 80;
    server_name files.example.com;
    root /var/www/files;
    
    location / {
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
        
        # 自定义 CSS 样式
        add_before_body /autoindex/header.html;
        add_after_body /autoindex/footer.html;
    }
    
    # 样式文件位置
    location /autoindex/ {
        alias /var/www/autoindex/;
    }
}
```

```html
<!-- /var/www/autoindex/header.html -->
<style>
body {
    font-family: Arial, sans-serif;
    margin: 40px;
    background-color: #f5f5f5;
}
h1 {
    color: #333;
    border-bottom: 2px solid #007acc;
    padding-bottom: 10px;
}
a {
    color: #007acc;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
pre {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
</style>
```

## 🗜️ 压缩配置

### 基础压缩设置

```nginx
http {
    # 启用压缩
    gzip on;
    
    # 压缩级别（1-9）
    gzip_comp_level 6;
    
    # 最小压缩文件大小
    gzip_min_length 1024;
    
    # 压缩类型
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # 为代理请求启用压缩
    gzip_proxied any;
    
    # 添加 Vary 头
    gzip_vary on;
    
    # 禁用对旧版 IE 的压缩
    gzip_disable "msie6";
}
```

### 高级压缩配置

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # 预压缩文件支持
    location ~* \.(css|js)$ {
        gzip_static on;  # 查找 .gz 预压缩文件
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Brotli 压缩（需要模块）
    location ~* \.(html|css|js|xml|json)$ {
        brotli on;
        brotli_comp_level 6;
        brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }
}
```

## 💾 缓存控制

### 基础缓存配置

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # 静态资源长期缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
    
    # HTML 文件短期缓存
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
    
    # 动态内容不缓存
    location ~* \.(php|cgi|pl|py)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

### 条件缓存

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # 根据文件类型设置缓存
    location / {
        # 图片文件
        location ~* \.(png|jpg|jpeg|gif|webp)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
        
        # 字体文件
        location ~* \.(woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Access-Control-Allow-Origin "*";
        }
        
        # CSS 和 JS 文件
        location ~* \.(css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            
            # 支持版本控制
            location ~* \.(css|js)\?v=(.+)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
        
        # 默认处理
        try_files $uri $uri/ =404;
    }
}
```

## 🔒 访问控制

### IP 访问限制

```nginx
server {
    listen 80;
    server_name private.example.com;
    root /var/www/private;
    
    # 允许特定 IP 访问
    location / {
        allow 192.168.1.0/24;
        allow 10.0.0.0/8;
        deny all;
        
        try_files $uri $uri/ =404;
    }
    
    # 管理员目录更严格的限制
    location /admin/ {
        allow 192.168.1.100;
        deny all;
        
        try_files $uri $uri/ =404;
    }
}
```

### 基本认证

```nginx
server {
    listen 80;
    server_name secure.example.com;
    root /var/www/secure;
    
    # 全站认证
    auth_basic "Restricted Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 公开目录（无需认证）
    location /public/ {
        auth_basic off;
        try_files $uri $uri/ =404;
    }
}
```

```bash
# 创建密码文件
sudo htpasswd -c /etc/nginx/.htpasswd username
sudo htpasswd /etc/nginx/.htpasswd another_user

# 或使用 openssl
echo -n 'username:' | sudo tee /etc/nginx/.htpasswd
openssl passwd -apr1 | sudo tee -a /etc/nginx/.htpasswd
```

### 文件类型限制

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # 禁止访问特定文件类型
    location ~* \.(htaccess|htpasswd|ini|log|sh|sql|conf)$ {
        deny all;
        return 404;
    }
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 禁止访问备份文件
    location ~* ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 只允许特定文件类型
    location /uploads/ {
        location ~* \.(jpg|jpeg|png|gif|pdf|doc|docx)$ {
            try_files $uri =404;
        }
        
        # 拒绝其他文件类型
        location ~* \.(php|pl|py|jsp|asp|sh)$ {
            deny all;
        }
    }
}
```

## 📱 移动端优化

### 响应式图片服务

```nginx
server {
    listen 80;
    server_name img.example.com;
    root /var/www/images;
    
    # 根据设备类型提供不同尺寸的图片
    location ~* \.(jpg|jpeg|png)$ {
        set $mobile "";
        if ($http_user_agent ~* "(mobile|iphone|android|blackberry)") {
            set $mobile "_mobile";
        }
        
        try_files $uri$mobile $uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### WebP 图片支持

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # WebP 图片支持
    location ~* \.(png|jpg|jpeg)$ {
        set $webp_suffix "";
        if ($http_accept ~* "webp") {
            set $webp_suffix ".webp";
        }
        
        try_files $uri$webp_suffix $uri =404;
        expires 30d;
        add_header Vary Accept;
    }
}
```

## 🚀 性能优化

### 高效文件传输

```nginx
http {
    # 启用高效文件传输
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # 文件缓存
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}

server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # 大文件优化
    location /downloads/ {
        # 限制下载速度
        limit_rate 1m;
        
        # 延迟限速（前 10MB 不限速）
        limit_rate_after 10m;
        
        # 支持断点续传
        add_header Accept-Ranges bytes;
    }
}
```

### 并发连接优化

```nginx
http {
    # 连接优化
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # 客户端缓冲区
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
}
```

## 🔧 单页应用 (SPA) 支持

### React/Vue/Angular 应用

```nginx
server {
    listen 80;
    server_name app.example.com;
    root /var/www/spa;
    index index.html;
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 静态资源缓存
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Service Worker 特殊处理
    location /sw.js {
        add_header Cache-Control "no-cache";
        proxy_cache_bypass $http_pragma;
        proxy_cache_revalidate on;
        expires off;
        access_log off;
    }
}
```

### PWA 支持

```nginx
server {
    listen 80;
    server_name pwa.example.com;
    root /var/www/pwa;
    
    # Manifest 文件
    location /manifest.json {
        add_header Content-Type application/manifest+json;
        add_header Cache-Control "public, max-age=86400";
    }
    
    # Service Worker
    location /sw.js {
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }
    
    # 离线页面
    location /offline.html {
        add_header Cache-Control "no-cache";
        internal;
    }
    
    # 主应用
    location / {
        try_files $uri $uri/ /index.html;
        
        # PWA 相关头
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
    }
}
```

## 📊 监控和日志

### 访问统计

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # 详细的访问日志
    log_format detailed '$remote_addr - $remote_user [$time_local] '
                       '"$request" $status $body_bytes_sent '
                       '"$http_referer" "$http_user_agent" '
                       '$request_time $upstream_response_time';
    
    access_log /var/log/nginx/detailed.log detailed;
    
    # 静态文件不记录日志
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        access_log off;
        expires 30d;
    }
    
    # 特殊文件记录日志
    location /important/ {
        access_log /var/log/nginx/important.log detailed;
        try_files $uri $uri/ =404;
    }
}
```

### 错误页面

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    # 自定义错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /404.html {
        internal;
    }
    
    location = /50x.html {
        internal;
    }
    
    # 错误页面样式
    location /error-assets/ {
        alias /var/www/error-pages/;
        expires 1d;
    }
}
```

---

通过这些配置，您可以构建高性能、安全的静态文件服务。接下来我们将学习反向代理配置。 🚀
