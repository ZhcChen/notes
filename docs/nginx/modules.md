# Nginx 模块系统

Nginx 采用模块化架构，通过各种模块提供丰富的功能。本章将介绍 Nginx 的模块系统、常用模块和第三方扩展。

## 🧩 模块架构

### 模块类型

```
Nginx 模块分类：
├── 核心模块 (Core Modules)
│   ├── ngx_core_module
│   ├── ngx_errlog_module
│   └── ngx_conf_module
├── 事件模块 (Event Modules)
│   ├── ngx_events_module
│   ├── ngx_epoll_module
│   └── ngx_kqueue_module
├── HTTP 模块 (HTTP Modules)
│   ├── ngx_http_core_module
│   ├── ngx_http_access_module
│   ├── ngx_http_auth_basic_module
│   └── ...
├── 邮件模块 (Mail Modules)
│   ├── ngx_mail_core_module
│   ├── ngx_mail_pop3_module
│   └── ngx_mail_imap_module
└── 流模块 (Stream Modules)
    ├── ngx_stream_core_module
    ├── ngx_stream_proxy_module
    └── ngx_stream_upstream_module
```

### 查看已安装模块

```bash
# 查看编译时包含的模块
nginx -V

# 查看动态模块
ls /usr/lib/nginx/modules/

# 查看模块配置
nginx -T | grep -E "(load_module|--with-|--add-)"
```

## 🔧 核心 HTTP 模块

### ngx_http_core_module

```nginx
# 核心 HTTP 配置
http {
    # 服务器名称哈希
    server_names_hash_bucket_size 128;
    server_names_hash_max_size 512;
    
    # 变量哈希
    variables_hash_bucket_size 128;
    variables_hash_max_size 512;
    
    # 类型哈希
    types_hash_bucket_size 64;
    types_hash_max_size 1024;
    
    # 连接处理
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # 客户端配置
    client_max_body_size 100m;
    client_body_timeout 60s;
    client_header_timeout 60s;
}
```

### ngx_http_access_module

```nginx
server {
    listen 80;
    server_name example.com;
    
    # IP 访问控制
    location /admin/ {
        allow 192.168.1.0/24;
        allow 10.0.0.0/8;
        deny all;
    }
    
    # 特定文件访问控制
    location ~ \.(htaccess|htpasswd|ini|log)$ {
        deny all;
    }
    
    # 组合访问控制
    location /api/ {
        allow 192.168.1.100;
        allow 203.0.113.0/24;
        deny all;
        
        proxy_pass http://backend;
    }
}
```

### ngx_http_auth_basic_module

```nginx
server {
    listen 80;
    server_name secure.example.com;
    
    # 全站认证
    auth_basic "Restricted Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        root /var/www/secure;
        index index.html;
    }
    
    # 特定目录认证
    location /admin/ {
        auth_basic "Admin Area";
        auth_basic_user_file /etc/nginx/.htpasswd_admin;
        
        root /var/www/admin;
    }
    
    # 禁用认证
    location /public/ {
        auth_basic off;
        root /var/www/public;
    }
}
```

### ngx_http_rewrite_module

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 基本重写
    rewrite ^/old-page$ /new-page permanent;
    rewrite ^/blog/(.*)$ /posts/$1 redirect;
    
    # 条件重写
    if ($host ~* "^www\.(.+)$") {
        return 301 https://$1$request_uri;
    }
    
    # 复杂重写规则
    location / {
        # 移除 .html 扩展名
        if ($request_uri ~ ^/(.*)\.html$) {
            return 301 /$1;
        }
        
        # 尝试文件，然后添加 .html
        try_files $uri $uri.html $uri/ =404;
    }
    
    # 使用 map 进行重写
    map $request_uri $new_uri {
        ~^/old/(.*)$ /new/$1;
        ~^/legacy/(.*)$ /modern/$1;
        default "";
    }
    
    if ($new_uri != "") {
        return 301 $new_uri;
    }
}
```

## 📊 监控和状态模块

### ngx_http_stub_status_module

```nginx
server {
    listen 80;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        
        # 访问控制
        allow 127.0.0.1;
        allow 192.168.1.0/24;
        deny all;
    }
}
```

状态页面输出：
```
Active connections: 291
server accepts handled requests
 16630948 16630948 31070465
Reading: 6 Writing: 179 Waiting: 106
```

### ngx_http_realip_module

```nginx
# 获取真实客户端 IP
server {
    listen 80;
    server_name example.com;
    
    # 设置可信代理
    set_real_ip_from 192.168.1.0/24;
    set_real_ip_from 10.0.0.0/8;
    set_real_ip_from 172.16.0.0/12;
    
    # 从哪个头部获取真实 IP
    real_ip_header X-Forwarded-For;
    # real_ip_header X-Real-IP;
    # real_ip_header proxy_protocol;
    
    # 递归查找
    real_ip_recursive on;
    
    location / {
        # 记录真实 IP
        access_log /var/log/nginx/realip.log;
        proxy_pass http://backend;
    }
}
```

## 🗜️ 压缩和缓存模块

### ngx_http_gzip_module

```nginx
http {
    # 基础压缩配置
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
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
    
    # 代理压缩
    gzip_proxied any;
    
    # 禁用压缩的条件
    gzip_disable "msie6";
}
```

### ngx_http_gzip_static_module

```nginx
server {
    listen 80;
    server_name example.com;
    
    location ~* \.(css|js)$ {
        # 查找预压缩文件
        gzip_static on;
        
        # 缓存配置
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
}
```

### ngx_http_headers_module

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 添加安全头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 条件添加头
    location ~* \.(css|js|png|jpg|gif)$ {
        add_header Cache-Control "public, max-age=31536000";
        add_header Vary Accept-Encoding;
        expires 1y;
    }
    
    # 移除头部
    location /api/ {
        proxy_pass http://backend;
        proxy_hide_header X-Powered-By;
        proxy_hide_header Server;
    }
}
```

## 🔒 安全模块

### ngx_http_limit_req_module

```nginx
http {
    # 定义限流区域
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $server_name zone=perserver:10m rate=100r/s;
    
    server {
        listen 80;
        server_name example.com;
        
        # 登录接口限流
        location /login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
        }
        
        # API 接口限流
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            limit_req zone=perserver burst=200 nodelay;
            proxy_pass http://backend;
        }
        
        # 自定义错误页面
        error_page 429 /rate_limit.html;
        location = /rate_limit.html {
            root /var/www/error;
            internal;
        }
    }
}
```

### ngx_http_limit_conn_module

```nginx
http {
    # 定义连接限制区域
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    limit_conn_zone $server_name zone=perserver:10m;
    
    server {
        listen 80;
        server_name example.com;
        
        # 限制每个 IP 的连接数
        limit_conn addr 10;
        
        # 限制服务器总连接数
        limit_conn perserver 1000;
        
        # 限制连接速度
        location /downloads/ {
            limit_conn addr 1;
            limit_rate 1m;  # 1MB/s
            limit_rate_after 10m;  # 前 10MB 不限速
        }
    }
}
```

## 🌐 第三方模块

### nginx-module-vts (流量统计)

```bash
# 编译安装
./configure --add-module=/path/to/nginx-module-vts
make && make install
```

```nginx
http {
    vhost_traffic_status_zone;
    
    server {
        listen 80;
        server_name example.com;
        
        location /status {
            vhost_traffic_status_display;
            vhost_traffic_status_display_format html;
            access_log off;
        }
    }
}
```

### nginx-upload-module (文件上传)

```nginx
server {
    listen 80;
    server_name upload.example.com;
    
    location /upload {
        upload_pass /upload_handler;
        upload_store /tmp/nginx_upload;
        upload_store_access user:rw group:rw all:r;
        
        upload_set_form_field $upload_field_name.name "$upload_file_name";
        upload_set_form_field $upload_field_name.content_type "$upload_content_type";
        upload_set_form_field $upload_field_name.path "$upload_tmp_path";
        
        upload_aggregate_form_field "$upload_field_name.md5" "$upload_file_md5";
        upload_aggregate_form_field "$upload_field_name.size" "$upload_file_size";
        
        upload_cleanup 400 404 499 500-505;
    }
    
    location /upload_handler {
        proxy_pass http://backend;
    }
}
```

### lua-resty-core (Lua 脚本)

```nginx
# 需要 OpenResty 或编译 lua 模块
server {
    listen 80;
    server_name lua.example.com;
    
    location /lua {
        content_by_lua_block {
            ngx.say("Hello from Lua!")
            ngx.say("Request method: ", ngx.var.request_method)
            ngx.say("Request URI: ", ngx.var.request_uri)
        }
    }
    
    location /api/ {
        access_by_lua_block {
            -- 自定义认证逻辑
            local auth_header = ngx.var.http_authorization
            if not auth_header then
                ngx.status = 401
                ngx.say("Unauthorized")
                ngx.exit(401)
            end
        }
        
        proxy_pass http://backend;
    }
}
```

## 🔧 动态模块

### 加载动态模块

```nginx
# 在主配置文件顶部加载模块
load_module modules/ngx_http_image_filter_module.so;
load_module modules/ngx_http_geoip_module.so;
load_module modules/ngx_stream_module.so;

http {
    # 使用加载的模块
    server {
        listen 80;
        server_name example.com;
        
        location /resize/ {
            image_filter resize 300 200;
            image_filter_jpeg_quality 95;
        }
    }
}
```

### 编译动态模块

```bash
# 编译第三方动态模块
./configure --with-compat --add-dynamic-module=/path/to/module
make modules

# 复制模块文件
cp objs/*.so /usr/lib/nginx/modules/
```

## 📊 模块开发

### 简单模块示例

```c
// ngx_http_hello_module.c
#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_http.h>

static char *ngx_http_hello(ngx_conf_t *cf, ngx_command_t *cmd, void *conf);
static ngx_int_t ngx_http_hello_handler(ngx_http_request_t *r);

static ngx_command_t ngx_http_hello_commands[] = {
    {
        ngx_string("hello"),
        NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS,
        ngx_http_hello,
        0,
        0,
        NULL
    },
    ngx_null_command
};

static ngx_http_module_t ngx_http_hello_module_ctx = {
    NULL,                          /* preconfiguration */
    NULL,                          /* postconfiguration */
    NULL,                          /* create main configuration */
    NULL,                          /* init main configuration */
    NULL,                          /* create server configuration */
    NULL,                          /* merge server configuration */
    NULL,                          /* create location configuration */
    NULL                           /* merge location configuration */
};

ngx_module_t ngx_http_hello_module = {
    NGX_MODULE_V1,
    &ngx_http_hello_module_ctx,    /* module context */
    ngx_http_hello_commands,       /* module directives */
    NGX_HTTP_MODULE,               /* module type */
    NULL,                          /* init master */
    NULL,                          /* init module */
    NULL,                          /* init process */
    NULL,                          /* init thread */
    NULL,                          /* exit thread */
    NULL,                          /* exit process */
    NULL,                          /* exit master */
    NGX_MODULE_V1_PADDING
};

static ngx_int_t
ngx_http_hello_handler(ngx_http_request_t *r)
{
    ngx_buf_t    *b;
    ngx_chain_t   out;
    ngx_str_t     response = ngx_string("Hello, Nginx Module!");

    r->headers_out.content_type_len = sizeof("text/plain") - 1;
    r->headers_out.content_type.data = (u_char *) "text/plain";
    r->headers_out.status = NGX_HTTP_OK;
    r->headers_out.content_length_n = response.len;

    if (r->method == NGX_HTTP_HEAD) {
        return ngx_http_send_header(r);
    }

    b = ngx_pcalloc(r->pool, sizeof(ngx_buf_t));
    if (b == NULL) {
        return NGX_HTTP_INTERNAL_SERVER_ERROR;
    }

    out.buf = b;
    out.next = NULL;

    b->pos = response.data;
    b->last = response.data + response.len;
    b->memory = 1;
    b->last_buf = 1;

    ngx_http_send_header(r);
    return ngx_http_output_filter(r, &out);
}

static char *
ngx_http_hello(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)
{
    ngx_http_core_loc_conf_t *clcf;

    clcf = ngx_http_conf_get_module_loc_conf(cf, ngx_http_core_module);
    clcf->handler = ngx_http_hello_handler;

    return NGX_CONF_OK;
}
```

### 使用自定义模块

```nginx
server {
    listen 80;
    server_name example.com;
    
    location /hello {
        hello;
    }
}
```

---

通过了解和使用这些模块，您可以大大扩展 Nginx 的功能。接下来我们将学习安全配置的详细内容。 🧩
