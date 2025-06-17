# 静态文件服务

Caddy 提供了强大而灵活的静态文件服务功能，适用于托管网站、单页应用、文档站点等各种场景。

## 🎯 基础配置

### 最简单的静态站点

```caddyfile
example.com {
    root * /var/www/html
    file_server
}
```

这个配置会：
- 将 `/var/www/html` 设为网站根目录
- 启用文件服务器功能
- 自动获取 HTTPS 证书

### 本地开发服务器

```caddyfile
localhost:8080 {
    root * ./public
    file_server browse
}
```

添加 `browse` 选项可以启用目录浏览功能，方便开发调试。

## 📁 目录和文件配置

### 设置根目录

```caddyfile
example.com {
    # 绝对路径
    root * /var/www/html
    
    # 相对路径（相对于 Caddy 工作目录）
    root * ./public
    
    # 环境变量
    root * {$SITE_ROOT}
    
    file_server
}
```

### 多目录配置

```caddyfile
example.com {
    # 不同路径使用不同目录
    handle /static/* {
        root * /var/www/static
        file_server
    }
    
    handle /uploads/* {
        root * /var/www/uploads
        file_server
    }
    
    # 默认目录
    handle {
        root * /var/www/html
        file_server
    }
}
```

### 索引文件配置

```caddyfile
example.com {
    root * /var/www/html
    
    file_server {
        # 自定义索引文件
        index index.html index.htm default.html
        
        # 禁用索引文件（总是显示目录列表）
        # index off
    }
}
```

## 🔍 目录浏览

### 启用目录浏览

```caddyfile
files.example.com {
    root * /var/www/files
    
    file_server {
        browse
        # 或者自定义模板
        browse /path/to/browse.html
    }
}
```

### 自定义浏览模板

```html
<!-- browse.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{{.Name}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .file { margin: 5px 0; }
        .dir { font-weight: bold; color: #0066cc; }
        .size { color: #666; margin-left: 20px; }
    </style>
</head>
<body>
    <h1>Index of {{.Path}}</h1>
    
    {{if .CanGoUp}}
        <div class="file">
            <a href="../" class="dir">../</a>
        </div>
    {{end}}
    
    {{range .Items}}
        <div class="file">
            {{if .IsDir}}
                <a href="{{.Name}}/" class="dir">{{.Name}}/</a>
            {{else}}
                <a href="{{.Name}}">{{.Name}}</a>
                <span class="size">({{.Size}})</span>
            {{end}}
        </div>
    {{end}}
</body>
</html>
```

## 🚫 访问控制

### 隐藏文件和目录

```caddyfile
example.com {
    root * /var/www/html
    
    file_server {
        # 隐藏特定文件
        hide .htaccess .env *.log
        
        # 隐藏目录
        hide .git .svn node_modules
        
        # 使用通配符
        hide .*  # 隐藏所有隐藏文件
    }
}
```

### 路径重写和重定向

```caddyfile
example.com {
    # 移除 .html 扩展名
    @html path *.html
    rewrite @html {path_regexp ^(.*)\.html$ $1}
    
    # 尝试文件，然后添加 .html
    try_files {path} {path}.html {path}/index.html
    
    root * /var/www/html
    file_server
}
```

## 🗜️ 压缩和缓存

### 启用压缩

```caddyfile
example.com {
    # 启用压缩
    encode gzip zstd
    
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
        precompressed gzip br
    }
    
    # 如果存在 .gz 或 .br 文件，会自动使用
    # 例如：style.css.gz, script.js.br
}
```

### 缓存控制

```caddyfile
example.com {
    # 静态资源长期缓存
    @static path *.css *.js *.png *.jpg *.gif *.ico *.woff *.woff2 *.svg
    header @static {
        Cache-Control "public, max-age=31536000, immutable"
        Expires "Thu, 31 Dec 2037 23:55:55 GMT"
    }
    
    # HTML 文件短期缓存
    @html path *.html
    header @html {
        Cache-Control "public, max-age=3600"
    }
    
    # API 响应不缓存
    @api path /api/*
    header @api {
        Cache-Control "no-cache, no-store, must-revalidate"
        Pragma "no-cache"
        Expires "0"
    }
    
    encode gzip
    root * /var/www/html
    file_server
}
```

## 🔒 安全配置

### 安全头设置

```caddyfile
example.com {
    # 安全头
    header {
        # 防止点击劫持
        X-Frame-Options DENY
        
        # 防止 MIME 类型嗅探
        X-Content-Type-Options nosniff
        
        # XSS 保护
        X-XSS-Protection "1; mode=block"
        
        # HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        
        # 引用策略
        Referrer-Policy strict-origin-when-cross-origin
        
        # 内容安全策略
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        # 隐藏服务器信息
        -Server
    }
    
    root * /var/www/html
    file_server
}
```

### IP 访问限制

```caddyfile
example.com {
    # 限制特定 IP 访问
    @blocked remote_ip 192.168.1.100 10.0.0.0/8
    respond @blocked "Access denied" 403
    
    # 只允许特定 IP 访问
    @allowed remote_ip 192.168.1.0/24
    respond @allowed {
        root * /var/www/html
        file_server
    }
    
    respond "Access denied" 403
}
```

## 📱 单页应用 (SPA) 配置

### React/Vue/Angular 应用

```caddyfile
spa.example.com {
    root * /var/www/spa
    
    # 尝试文件，如果不存在则返回 index.html
    try_files {path} /index.html
    
    file_server
}
```

### 带 API 的 SPA

```caddyfile
app.example.com {
    # API 请求代理到后端
    handle /api/* {
        reverse_proxy localhost:3000
    }
    
    # 静态资源
    handle /static/* {
        root * /var/www/app
        file_server
    }
    
    # SPA 路由
    handle {
        root * /var/www/app
        try_files {path} /index.html
        file_server
    }
}
```

## 🎨 自定义错误页面

### 错误页面配置

```caddyfile
example.com {
    root * /var/www/html
    
    # 自定义错误页面
    handle_errors {
        @404 expression {http.error.status_code} == 404
        handle @404 {
            rewrite * /404.html
            file_server
        }
        
        @5xx expression {http.error.status_code} >= 500
        handle @5xx {
            rewrite * /500.html
            file_server
        }
    }
    
    file_server
}
```

### 错误页面模板

```html
<!-- 404.html -->
<!DOCTYPE html>
<html>
<head>
    <title>页面未找到</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            margin-top: 100px; 
        }
        .error-code { 
            font-size: 72px; 
            color: #ccc; 
            margin-bottom: 20px; 
        }
    </style>
</head>
<body>
    <div class="error-code">404</div>
    <h1>页面未找到</h1>
    <p>抱歉，您访问的页面不存在。</p>
    <a href="/">返回首页</a>
</body>
</html>
```

## 📊 性能优化

### 文件服务器优化

```caddyfile
example.com {
    # 启用 HTTP/2 推送
    push /css/style.css
    push /js/app.js
    
    # 压缩配置
    encode {
        gzip 6
        zstd
        minimum_length 1024
    }
    
    # 预压缩文件
    file_server {
        precompressed gzip br
        # 禁用 ETag（如果使用 CDN）
        # disable_canonical_uris
    }
    
    root * /var/www/html
}
```

### 大文件处理

```caddyfile
files.example.com {
    # 大文件下载配置
    @large path *.zip *.tar.gz *.iso *.dmg
    header @large {
        # 支持断点续传
        Accept-Ranges bytes
        
        # 缓存控制
        Cache-Control "public, max-age=86400"
    }
    
    root * /var/www/files
    file_server
}
```

---

通过这些配置，您可以构建高性能、安全的静态文件服务。接下来我们将学习反向代理配置。 🚀
