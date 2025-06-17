# Nginx 配置文件详解

Nginx 的配置文件采用简洁的指令式语法，具有清晰的层次结构。本章将详细介绍配置文件的语法、结构和常用指令。

## 📝 配置文件语法

### 基本语法规则

```nginx
# 注释以 # 开头
# 指令以分号结尾
directive_name parameter1 parameter2;

# 块指令使用大括号
block_directive {
    directive_name parameter;
    nested_block {
        directive_name parameter;
    }
}

# 字符串可以用引号包围（可选）
directive_name "parameter with spaces";
directive_name 'single quotes';
directive_name parameter_without_quotes;
```

### 配置文件结构

```nginx
# 全局块
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# events 块
events {
    worker_connections 1024;
}

# http 块
http {
    # http 全局块
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # server 块
    server {
        # server 全局块
        listen 80;
        server_name example.com;
        
        # location 块
        location / {
            root /var/www/html;
            index index.html;
        }
        
        location /api/ {
            proxy_pass http://backend;
        }
    }
    
    # upstream 块
    upstream backend {
        server 192.168.1.10:8080;
        server 192.168.1.11:8080;
    }
}

# mail 块（可选）
mail {
    server_name mail.example.com;
    auth_http localhost:9000/cgi-bin/auth;
    
    server {
        listen 993;
        protocol imap;
        ssl on;
    }
}

# stream 块（可选）
stream {
    upstream backend {
        server backend1.example.com:12345;
        server backend2.example.com:12345;
    }
    
    server {
        listen 12345;
        proxy_pass backend;
    }
}
```

## 🌍 全局配置

### 用户和进程配置

```nginx
# 运行 Nginx 的用户和组
user nginx nginx;

# 工作进程数
worker_processes auto;          # 自动检测 CPU 核心数
# worker_processes 4;           # 手动指定进程数

# 工作进程优先级（-20 到 20，数值越小优先级越高）
worker_priority -10;

# 工作进程 CPU 亲和性
worker_cpu_affinity auto;
# worker_cpu_affinity 0001 0010 0100 1000;  # 手动绑定

# 每个工作进程的最大文件描述符数
worker_rlimit_nofile 65535;

# 主进程 PID 文件
pid /var/run/nginx.pid;

# 错误日志
error_log /var/log/nginx/error.log warn;
# 日志级别：debug, info, notice, warn, error, crit, alert, emerg
```

### 模块加载

```nginx
# 动态加载模块
load_module modules/ngx_http_image_filter_module.so;
load_module modules/ngx_http_geoip_module.so;

# 包含其他配置文件
include /etc/nginx/mime.types;
include /etc/nginx/conf.d/*.conf;
```

## ⚡ Events 配置

```nginx
events {
    # 每个工作进程的最大连接数
    worker_connections 1024;
    
    # 事件模型（Linux 推荐 epoll）
    use epoll;
    
    # 允许一个工作进程同时接受多个连接
    multi_accept on;
    
    # 接受连接的负载均衡方法
    accept_mutex on;
    accept_mutex_delay 500ms;
}
```

## 🌐 HTTP 配置

### 基础 HTTP 设置

```nginx
http {
    # MIME 类型
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 字符集
    charset utf-8;
    
    # 服务器标识
    server_tokens off;  # 隐藏 Nginx 版本号
    
    # 文件传输优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # 连接超时
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # 客户端请求限制
    client_max_body_size 100m;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # 发送超时
    send_timeout 60s;
    
    # 哈希表大小
    server_names_hash_bucket_size 128;
    server_names_hash_max_size 512;
}
```

### 日志配置

```nginx
http {
    # 日志格式定义
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    # 详细日志格式
    log_format detailed '$remote_addr - $remote_user [$time_local] '
                        '"$request" $status $body_bytes_sent '
                        '"$http_referer" "$http_user_agent" '
                        '$request_time $upstream_response_time '
                        '$upstream_addr $upstream_status';
    
    # JSON 格式日志
    log_format json escape=json '{'
                    '"time":"$time_iso8601",'
                    '"remote_addr":"$remote_addr",'
                    '"request":"$request",'
                    '"status":$status,'
                    '"body_bytes_sent":$body_bytes_sent,'
                    '"http_referer":"$http_referer",'
                    '"http_user_agent":"$http_user_agent",'
                    '"request_time":$request_time'
                    '}';
    
    # 访问日志
    access_log /var/log/nginx/access.log main;
    
    # 错误日志
    error_log /var/log/nginx/error.log warn;
}
```

### 压缩配置

```nginx
http {
    # 启用压缩
    gzip on;
    
    # 压缩级别（1-9，9 为最高压缩比）
    gzip_comp_level 6;
    
    # 最小压缩文件大小
    gzip_min_length 1024;
    
    # 压缩缓冲区
    gzip_buffers 16 8k;
    
    # HTTP 版本
    gzip_http_version 1.1;
    
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
    
    # 禁用对 IE6 的压缩
    gzip_disable "msie6";
}
```

## 🖥️ Server 配置

### 基础 Server 块

```nginx
server {
    # 监听端口和地址
    listen 80;
    listen [::]:80;  # IPv6
    listen 443 ssl http2;  # HTTPS with HTTP/2
    
    # 服务器名称
    server_name example.com www.example.com;
    
    # 网站根目录
    root /var/www/example.com;
    
    # 索引文件
    index index.html index.htm index.php;
    
    # 字符集
    charset utf-8;
    
    # 访问日志
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
}
```

### 虚拟主机配置

```nginx
# 主站点
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com;
    index index.html;
}

# 子域名站点
server {
    listen 80;
    server_name blog.example.com;
    root /var/www/blog;
    index index.html;
}

# 通配符域名
server {
    listen 80;
    server_name *.example.com;
    root /var/www/subdomains;
    
    # 使用变量设置根目录
    set $subdomain "";
    if ($host ~* "^(.+)\.example\.com$") {
        set $subdomain $1;
    }
    root /var/www/subdomains/$subdomain;
}

# 默认服务器（处理未匹配的请求）
server {
    listen 80 default_server;
    server_name _;
    return 444;  # 关闭连接
}
```

## 📍 Location 配置

### Location 匹配规则

```nginx
server {
    # 精确匹配
    location = /exact {
        return 200 "Exact match";
    }
    
    # 前缀匹配（优先级高）
    location ^~ /priority {
        return 200 "Priority prefix match";
    }
    
    # 正则匹配（区分大小写）
    location ~ \.(jpg|jpeg|png|gif)$ {
        expires 30d;
    }
    
    # 正则匹配（不区分大小写）
    location ~* \.(css|js)$ {
        expires 1y;
    }
    
    # 前缀匹配（默认）
    location /api/ {
        proxy_pass http://backend;
    }
    
    # 通用匹配
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 常用 Location 配置

```nginx
server {
    # 静态文件处理
    location /static/ {
        root /var/www;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PHP 处理
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 禁止访问备份文件
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 文件下载
    location /downloads/ {
        internal;  # 只能通过内部重定向访问
        alias /var/www/protected/;
    }
    
    # 限制访问
    location /admin/ {
        allow 192.168.1.0/24;
        allow 10.0.0.0/8;
        deny all;
        
        auth_basic "Admin Area";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
```

## 🔄 变量和条件

### 内置变量

```nginx
server {
    location /info {
        return 200 "
            Host: $host
            Server Name: $server_name
            Request URI: $request_uri
            Request Method: $request_method
            Remote Address: $remote_addr
            User Agent: $http_user_agent
            Request Time: $request_time
            Time: $time_local
        ";
        add_header Content-Type text/plain;
    }
}
```

### 自定义变量

```nginx
server {
    # 设置变量
    set $mobile_request 0;
    
    # 条件判断
    if ($http_user_agent ~* "(mobile|iphone|android)") {
        set $mobile_request 1;
    }
    
    location / {
        if ($mobile_request = 1) {
            rewrite ^(.*)$ /mobile$1 last;
        }
        
        root /var/www/html;
        index index.html;
    }
    
    location /mobile/ {
        root /var/www;
        index mobile.html;
    }
}
```

### Map 指令

```nginx
http {
    # 根据 User-Agent 设置变量
    map $http_user_agent $mobile {
        default 0;
        ~*mobile 1;
        ~*android 1;
        ~*iphone 1;
    }
    
    # 根据文件扩展名设置过期时间
    map $sent_http_content_type $expires {
        default off;
        text/html epoch;
        text/css max;
        application/javascript max;
        ~image/ max;
    }
    
    server {
        expires $expires;
        
        location / {
            if ($mobile) {
                rewrite ^(.*)$ /mobile$1 last;
            }
            root /var/www/html;
        }
    }
}
```

## 🔧 配置优化

### 性能优化配置

```nginx
http {
    # 开启文件缓存
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # 连接池优化
    upstream_keepalive_connections 32;
    upstream_keepalive_requests 100;
    upstream_keepalive_timeout 60s;
    
    # 代理缓冲区
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;
    
    # FastCGI 缓冲区
    fastcgi_buffering on;
    fastcgi_buffer_size 4k;
    fastcgi_buffers 8 4k;
    fastcgi_busy_buffers_size 8k;
}
```

### 安全配置

```nginx
http {
    # 隐藏版本信息
    server_tokens off;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # 限制请求方法
    if ($request_method !~ ^(GET|HEAD|POST)$ ) {
        return 405;
    }
    
    # 限制请求大小
    client_max_body_size 10m;
    
    # 限制缓冲区大小
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
}
```

---

掌握了这些配置语法和技巧，您就可以灵活地配置 Nginx 来满足各种需求了！接下来让我们学习具体的应用场景。 🚀
