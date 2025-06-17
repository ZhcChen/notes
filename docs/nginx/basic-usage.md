# Nginx 基础使用

本章将介绍 Nginx 的基本操作命令、常用功能和日常管理任务。

## 🎯 基本命令

### 启动和停止

```bash
# 启动 Nginx
sudo nginx

# 或使用 systemd
sudo systemctl start nginx

# 停止 Nginx
sudo nginx -s quit          # 优雅停止
sudo nginx -s stop          # 立即停止

# 或使用 systemd
sudo systemctl stop nginx

# 重启 Nginx
sudo systemctl restart nginx
```

### 重新加载配置

```bash
# 重新加载配置（推荐）
sudo nginx -s reload

# 或使用 systemd
sudo systemctl reload nginx

# 重新打开日志文件
sudo nginx -s reopen
```

### 测试配置

```bash
# 测试配置文件语法
sudo nginx -t

# 测试配置并显示详细信息
sudo nginx -T

# 测试特定配置文件
sudo nginx -t -c /path/to/nginx.conf
```

### 查看信息

```bash
# 查看版本信息
nginx -v

# 查看详细版本和编译信息
nginx -V

# 查看帮助信息
nginx -h

# 查看进程状态
ps aux | grep nginx

# 查看端口监听
sudo netstat -tlnp | grep nginx
sudo ss -tlnp | grep nginx
```

## 📁 目录和文件管理

### 重要目录

```bash
# 主配置目录
/etc/nginx/

# 网站根目录
/var/www/html/

# 日志目录
/var/log/nginx/

# 缓存目录
/var/cache/nginx/

# 运行时目录
/var/run/nginx/
```

### 配置文件管理

```bash
# 备份配置文件
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 创建站点配置
sudo nano /etc/nginx/sites-available/example.com

# 启用站点
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/

# 禁用站点
sudo rm /etc/nginx/sites-enabled/example.com

# 列出可用站点
ls -la /etc/nginx/sites-available/

# 列出启用站点
ls -la /etc/nginx/sites-enabled/
```

## 🌐 基础网站配置

### 简单静态网站

```nginx
# /etc/nginx/sites-available/static-site
server {
    listen 80;
    server_name example.com www.example.com;
    
    root /var/www/example.com;
    index index.html index.htm;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 日志配置
    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
}
```

### 多站点配置

```nginx
# 主站点
server {
    listen 80;
    server_name example.com www.example.com;
    root /var/www/example.com;
    index index.html;
}

# 博客站点
server {
    listen 80;
    server_name blog.example.com;
    root /var/www/blog;
    index index.html;
}

# 测试站点
server {
    listen 80;
    server_name test.example.com;
    root /var/www/test;
    index index.html;
    
    # 限制访问
    allow 192.168.1.0/24;
    deny all;
}
```

### PHP 网站配置

```nginx
server {
    listen 80;
    server_name php-site.com;
    root /var/www/php-site;
    index index.php index.html;
    
    # PHP 处理
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
```

## 🔄 反向代理基础

### 简单反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 路径代理

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 静态文件
    location / {
        root /var/www/html;
        index index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 管理后台代理
    location /admin/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 日志管理

### 查看日志
```bash
# 查看访问和错误日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 日志分析
```bash
# 统计访问最多的 IP
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# 统计状态码分布
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
```

### 日志轮转
```bash
# 手动轮转日志
sudo nginx -s reopen

# 配置自动轮转 /etc/logrotate.d/nginx
/var/log/nginx/*.log {
    daily
    rotate 30
    compress
    notifempty
    create 644 nginx adm
    postrotate
        nginx -s reopen
    endscript
}
```

## 🔧 常用维护任务

### 检查配置

```bash
# 检查配置语法
sudo nginx -t

# 检查特定配置文件
sudo nginx -t -c /etc/nginx/sites-available/example.com

# 显示完整配置
sudo nginx -T
```

### 性能监控

```bash
# 查看连接状态（需要 stub_status 模块）
curl http://localhost/nginx_status

# 查看进程状态
ps aux | grep nginx

# 查看内存使用
sudo pmap $(pgrep nginx)

# 查看文件描述符使用
sudo lsof -p $(pgrep nginx)
```

### 安全检查

```bash
# 检查监听端口
sudo netstat -tlnp | grep nginx

# 检查文件权限
ls -la /etc/nginx/
ls -la /var/www/

# 检查用户和组
id nginx

# 检查 SELinux 状态（CentOS/RHEL）
sestatus
getsebool -a | grep httpd
```

## 🚨 故障排除

### 常见错误

**配置语法错误**
```bash
# 错误信息示例
nginx: [emerg] unexpected "}" in /etc/nginx/nginx.conf:25

# 解决方法
sudo nginx -t  # 查看详细错误信息
```

**端口占用**
```bash
# 检查端口占用
sudo lsof -i :80

# 停止占用进程
sudo systemctl stop apache2
```

**权限问题**
```bash
# 检查文件权限
ls -la /var/www/html/

# 修复权限
sudo chown -R nginx:nginx /var/www/html/
sudo chmod -R 755 /var/www/html/
```

**内存不足**
```bash
# 检查内存使用
free -h

# 检查 Nginx 内存使用
ps aux | grep nginx
```

### 调试技巧

```nginx
# 启用调试日志
error_log /var/log/nginx/debug.log debug;

# 添加调试信息到响应头
add_header X-Debug-Info "Server: $hostname, Time: $time_local";

# 记录变量值
error_log /var/log/nginx/debug.log notice;
# 在配置中使用 error_log 记录变量
```

## 📈 性能监控

### 基础监控

```nginx
# 启用状态页面
server {
    listen 80;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 192.168.1.0/24;
        deny all;
    }
}
```

### 监控脚本

```bash
#!/bin/bash
# nginx_monitor.sh

# 检查 Nginx 是否运行
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running!"
    exit 1
fi

# 检查配置文件
if ! nginx -t > /dev/null 2>&1; then
    echo "Nginx configuration error!"
    exit 1
fi

# 检查磁盘空间
DISK_USAGE=$(df /var/log/nginx | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "Disk usage is high: ${DISK_USAGE}%"
fi

echo "Nginx is running normally"
```

## 📚 下一步

掌握了基础使用后，您可以：
1. 学习 [静态文件服务](./static-files.md)
2. 配置 [反向代理](./reverse-proxy.md)
3. 设置 [SSL/HTTPS](./ssl-https.md)

---

通过这些基础操作，您已经可以管理和维护 Nginx 服务器了！ 🚀
