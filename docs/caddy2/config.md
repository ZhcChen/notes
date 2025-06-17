# Caddy2 配置详解

Caddy 提供了两种主要的配置方式：Caddyfile（简单易读）和 JSON（功能完整）。本章将详细介绍这两种配置方式的语法和使用方法。

## 📝 Caddyfile 基础

### 基本语法

Caddyfile 使用简洁的语法，每个站点配置以域名或地址开头：

```caddyfile
# 基本站点配置
example.com {
    root * /var/www/html
    file_server
}

# 多个域名指向同一配置
example.com, www.example.com {
    root * /var/www/html
    file_server
}

# 本地开发
localhost:8080 {
    respond "Hello, World!"
}
```

### 全局配置块

全局配置使用花括号包围，放在文件开头：

```caddyfile
{
    # 管理员邮箱（Let's Encrypt）
    email admin@example.com

    # 默认 SNI
    default_sni example.com

    # 管理端点
    admin localhost:2019

    # 日志配置
    log {
        output file /var/log/caddy/caddy.log
        format json
        level INFO
    }

    # 存储配置
    storage file_system {
        root /var/lib/caddy
    }

    # ACME CA 配置
    acme_ca https://acme-v02.api.letsencrypt.org/directory
    acme_ca_root /path/to/ca.pem

    # 本地 CA（开发环境）
    local_certs

    # 自动 HTTPS 配置
    auto_https off
    # auto_https disable_redirects
    # auto_https ignore_loaded_certs
}
```

### 站点地址格式

```caddyfile
# 域名
example.com

# 带端口的域名
example.com:8080

# IP 地址
192.168.1.100

# IP 地址带端口
192.168.1.100:8080

# 通配符域名
*.example.com

# 多个地址
example.com, www.example.com, api.example.com

# 协议指定
http://example.com
https://example.com

# 路径匹配
example.com/api/*
```

## 🎯 常用指令

### 静态文件服务

```caddyfile
example.com {
    # 设置根目录
    root * /var/www/html

    # 启用文件服务器
    file_server

    # 带选项的文件服务器
    file_server {
        hide .htaccess
        index index.html index.htm
        browse  # 启用目录浏览
    }

    # 压缩
    encode gzip zstd

    # 缓存头
    header {
        Cache-Control "public, max-age=3600"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
    }
}
```

### 反向代理

```caddyfile
api.example.com {
    # 基本反向代理
    reverse_proxy localhost:3000

    # 多个后端（负载均衡）
    reverse_proxy localhost:3000 localhost:3001 localhost:3002

    # 带选项的反向代理
    reverse_proxy localhost:3000 {
        # 健康检查
        health_uri /health
        health_interval 30s
        health_timeout 5s

        # 负载均衡策略
        lb_policy round_robin
        # lb_policy least_conn
        # lb_policy ip_hash
        # lb_policy first
        # lb_policy uri_hash

        # 请求头修改
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}

        # 响应头修改
        header_down -Server

        # 超时设置
        transport http {
            dial_timeout 5s
            response_header_timeout 10s
        }
    }
}
```

### 路径匹配和重写

```caddyfile
example.com {
    # 路径匹配
    handle /api/* {
        reverse_proxy localhost:3000
    }

    handle /static/* {
        root * /var/www/static
        file_server
    }

    # URL 重写
    rewrite /old-path /new-path
    rewrite /blog/* /posts/{path}

    # 重定向
    redir /old-page /new-page 301
    redir /temp-page /new-page 302

    # 条件重写
    @api path /api/v1/*
    rewrite @api /api/v2{path}

    # 默认处理
    handle {
        root * /var/www/html
        file_server
    }
}
```

### 认证和授权

```caddyfile
admin.example.com {
    # 基本认证
    basicauth {
        admin $2a$14$hgl486...  # bcrypt 哈希
        user $2a$14$xyz123...
    }

    # 或者使用明文密码（不推荐生产环境）
    basicauth {
        admin JDJhJDE0JEhHTDQ4Ni...
    }

    root * /var/www/admin
    file_server
}

# JWT 认证（需要插件）
api.example.com {
    jwt {
        primary yes
        path /api
        redirect /login
        allow sub admin
        allow aud api
    }

    reverse_proxy localhost:3000
}
```

### 日志配置

```caddyfile
example.com {
    # 访问日志
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
        level INFO
    }

    # 错误日志
    log {
        output file /var/log/caddy/error.log
        format console
        level ERROR
    }

    root * /var/www/html
    file_server
}
```

## 🔧 高级配置

### 条件匹配器

```caddyfile
example.com {
    # 路径匹配器
    @api path /api/*
    @static path /static/* /assets/*
    @images path *.jpg *.png *.gif

    # 方法匹配器
    @post method POST
    @get method GET

    # 头部匹配器
    @mobile header User-Agent *Mobile*
    @json header Content-Type application/json

    # 查询参数匹配器
    @debug query debug=true

    # 远程 IP 匹配器
    @internal remote_ip 192.168.0.0/16 10.0.0.0/8

    # 组合匹配器
    @api_post {
        path /api/*
        method POST
    }

    # 使用匹配器
    handle @api {
        reverse_proxy localhost:3000
    }

    handle @static {
        root * /var/www/static
        file_server
    }

    respond @mobile "Mobile version"
    respond @debug "Debug mode enabled"
}
```

### 中间件链

```caddyfile
example.com {
    # 中间件按顺序执行

    # 1. 限流
    rate_limit {
        zone static {
            key {remote_host}
            events 100
            window 1m
        }
    }

    # 2. 安全头
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
    }

    # 3. 压缩
    encode gzip zstd

    # 4. 缓存
    cache {
        ttl 1h
        stale 5m
    }

    # 5. 文件服务
    root * /var/www/html
    file_server
}
```

### 模板引擎

```caddyfile
example.com {
    root * /var/www/templates

    templates {
        mime text/html
        between {{ }}
        root /var/www/templates
    }

    file_server
}
```

模板文件示例：
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{.Req.Host}}</title>
</head>
<body>
    <h1>Welcome to {{.Req.Host}}</h1>
    <p>Current time: {{now | date "2006-01-02 15:04:05"}}</p>
    <p>Your IP: {{.Req.RemoteAddr}}</p>
    <p>User Agent: {{.Req.Header.Get "User-Agent"}}</p>

    {{range .Req.URL.Query}}
        <p>{{.}}</p>
    {{end}}
</body>
</html>
```

## 🔄 JSON 配置

### 基本结构

JSON 配置提供了更精细的控制：

```json
{
  "admin": {
    "listen": "localhost:2019"
  },
  "logging": {
    "logs": {
      "default": {
        "writer": {
          "output": "file",
          "filename": "/var/log/caddy/caddy.log"
        },
        "level": "INFO"
      }
    }
  },
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "listen": [":443"],
          "routes": [
            {
              "match": [
                {
                  "host": ["example.com"]
                }
              ],
              "handle": [
                {
                  "handler": "file_server",
                  "root": "/var/www/html"
                }
              ]
            }
          ]
        }
      }
    },
    "tls": {
      "automation": {
        "policies": [
          {
            "subjects": ["example.com"],
            "issuers": [
              {
                "module": "acme",
                "email": "admin@example.com"
              }
            ]
          }
        ]
      }
    }
  }
}
```

### 复杂路由配置

```json
{
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "listen": [":80", ":443"],
          "routes": [
            {
              "match": [
                {
                  "host": ["api.example.com"],
                  "path": ["/v1/*"]
                }
              ],
              "handle": [
                {
                  "handler": "reverse_proxy",
                  "upstreams": [
                    {"dial": "localhost:3000"},
                    {"dial": "localhost:3001"},
                    {"dial": "localhost:3002"}
                  ],
                  "load_balancing": {
                    "selection_policy": {
                      "policy": "round_robin"
                    }
                  },
                  "health_checks": {
                    "active": {
                      "uri": "/health",
                      "interval": "30s",
                      "timeout": "5s"
                    }
                  }
                }
              ]
            },
            {
              "match": [
                {
                  "host": ["example.com"]
                }
              ],
              "handle": [
                {
                  "handler": "file_server",
                  "root": "/var/www/html",
                  "index_names": ["index.html", "index.htm"]
                }
              ]
            }
          ]
        }
      }
    }
  }
}
```

## 🛠️ 配置管理

### 配置验证

```bash
# 验证 Caddyfile
caddy validate --config /etc/caddy/Caddyfile

# 验证 JSON 配置
caddy validate --config /etc/caddy/caddy.json

# 格式化 Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile
```

### 配置转换

```bash
# Caddyfile 转 JSON
caddy adapt --config /etc/caddy/Caddyfile --pretty

# 保存转换结果
caddy adapt --config /etc/caddy/Caddyfile > /etc/caddy/caddy.json
```

### 热重载

```bash
# 重载配置（无中断）
caddy reload --config /etc/caddy/Caddyfile

# 使用 systemd
sudo systemctl reload caddy

# 通过 API 重载
curl -X POST "http://localhost:2019/load" \
  -H "Content-Type: application/json" \
  -d @/etc/caddy/caddy.json
```

### 配置文件分割

```caddyfile
# 主配置文件 /etc/caddy/Caddyfile
{
    email admin@example.com
}

# 导入其他配置文件
import /etc/caddy/sites/*.caddy
import /etc/caddy/snippets/*.caddy
```

```caddyfile
# /etc/caddy/sites/example.com.caddy
example.com {
    import common_headers
    root * /var/www/example.com
    file_server
}
```

```caddyfile
# /etc/caddy/snippets/common_headers.caddy
header {
    X-Content-Type-Options nosniff
    X-Frame-Options DENY
    X-XSS-Protection "1; mode=block"
}
```

## 🔐 环境变量

### 在配置中使用环境变量

```caddyfile
{
    email {$CADDY_EMAIL}
}

{$DOMAIN:localhost} {
    root * {$SITE_ROOT:/var/www/html}

    reverse_proxy {$BACKEND_HOST:localhost}:{$BACKEND_PORT:3000}

    basicauth {
        {$ADMIN_USER:admin} {$ADMIN_PASS_HASH}
    }
}
```

### 设置环境变量

```bash
# 在 systemd 服务中
sudo systemctl edit caddy

# 添加环境变量
[Service]
Environment="CADDY_EMAIL=admin@example.com"
Environment="DOMAIN=example.com"
Environment="SITE_ROOT=/var/www/html"
Environment="BACKEND_HOST=localhost"
Environment="BACKEND_PORT=3000"
```

## 📊 配置最佳实践

### 安全配置

```caddyfile
{
    # 安全的全局配置
    email {$CADDY_EMAIL}

    # 禁用管理 API（生产环境）
    admin off

    # 或限制管理 API 访问
    admin localhost:2019 {
        origins localhost:2019 127.0.0.1:2019
    }
}

example.com {
    # 安全头
    header {
        # HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

        # 内容类型嗅探保护
        X-Content-Type-Options nosniff

        # 点击劫持保护
        X-Frame-Options DENY

        # XSS 保护
        X-XSS-Protection "1; mode=block"

        # 引用策略
        Referrer-Policy strict-origin-when-cross-origin

        # 内容安全策略
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"

        # 隐藏服务器信息
        -Server
    }

    # 限制请求大小
    request_body {
        max_size 10MB
    }

    root * /var/www/html
    file_server
}
```

### 性能优化配置

```caddyfile
{
    # 全局性能配置
    servers {
        protocol {
            experimental_http3
        }
    }
}

example.com {
    # 压缩
    encode {
        gzip 6
        zstd
        minimum_length 1024
        match {
            header Content-Type text/*
            header Content-Type application/json*
            header Content-Type application/javascript*
            header Content-Type application/xml*
        }
    }

    # 缓存头
    @static path *.css *.js *.png *.jpg *.gif *.ico *.woff *.woff2
    header @static {
        Cache-Control "public, max-age=31536000, immutable"
    }

    @html path *.html
    header @html {
        Cache-Control "public, max-age=3600"
    }

    # 预压缩文件
    file_server {
        precompressed gzip br
    }
}
```

### 开发环境配置

```caddyfile
{
    # 开发环境全局配置
    local_certs
    log {
        level DEBUG
    }
}

localhost, *.localhost {
    tls internal

    @api path /api/*
    handle @api {
        reverse_proxy localhost:3000
    }

    handle {
        root * ./public
        file_server browse
    }
}
```

## 🔧 配置调试

### 查看当前配置

```bash
# 查看当前运行的配置
curl http://localhost:2019/config/ | jq

# 查看特定部分
curl http://localhost:2019/config/apps/http | jq
```

### 配置测试

```bash
# 测试配置文件
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile

# 干运行（不实际启动）
caddy validate --config /etc/caddy/Caddyfile
```

### 日志调试

```caddyfile
{
    debug
    log {
        level DEBUG
        output file /var/log/caddy/debug.log
    }
}
```

---

掌握了这些配置技巧，您就可以灵活地配置 Caddy 来满足各种需求了！接下来让我们学习具体的应用场景。 🚀