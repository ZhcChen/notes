# Nginx 安装与配置

本章将详细介绍如何在不同操作系统上安装 Nginx，以及基本的环境配置。

## 🖥️ 系统要求

### 最低要求
- **操作系统**：Linux、macOS、Windows、FreeBSD
- **内存**：512MB RAM（推荐 1GB+）
- **存储**：100MB 可用空间
- **网络**：稳定的网络连接

### 推荐配置
- **CPU**：2核心以上
- **内存**：4GB+ RAM
- **存储**：SSD 存储
- **网络**：千兆网络

## 📦 安装方式

### 方式一：包管理器安装（推荐）

#### Ubuntu/Debian
```bash
# 更新包列表
sudo apt update

# 安装 Nginx
sudo apt install nginx

# 启动 Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

#### CentOS/RHEL/Fedora
```bash
# CentOS/RHEL 8+
sudo dnf install nginx

# CentOS/RHEL 7
sudo yum install nginx

# 启动 Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

#### macOS
```bash
# 使用 Homebrew
brew install nginx

# 启动 Nginx
brew services start nginx

# 或手动启动
nginx
```

#### Windows
```powershell
# 使用 Chocolatey
choco install nginx

# 或使用 Scoop
scoop install nginx
```

### 方式二：官方仓库安装

#### 添加官方 APT 仓库（Ubuntu/Debian）
```bash
# 安装依赖
sudo apt install curl gnupg2 ca-certificates lsb-release

# 添加 Nginx 签名密钥
curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo apt-key add -

# 添加仓库
echo "deb http://nginx.org/packages/ubuntu `lsb_release -cs` nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list

# 更新包列表
sudo apt update

# 安装 Nginx
sudo apt install nginx
```

#### 添加官方 YUM 仓库（CentOS/RHEL）
```bash
# 创建仓库文件
sudo tee /etc/yum.repos.d/nginx.repo > /dev/null <<EOF
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/\$releasever/\$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
module_hotfixes=true
EOF

# 安装 Nginx
sudo yum install nginx
```

### 方式三：源码编译安装

#### 下载源码
```bash
# 下载最新稳定版
wget http://nginx.org/download/nginx-1.24.0.tar.gz
tar -xzf nginx-1.24.0.tar.gz
cd nginx-1.24.0
```

#### 安装编译依赖
```bash
# Ubuntu/Debian
sudo apt install build-essential libpcre3-dev libssl-dev zlib1g-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install pcre-devel openssl-devel zlib-devel
```

#### 配置编译选项
```bash
./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --http-client-body-temp-path=/var/cache/nginx/client_temp \
    --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
    --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
    --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
    --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
    --with-perl_modules_path=/usr/lib/perl5/vendor_perl \
    --user=nginx \
    --group=nginx \
    --with-compat \
    --with-file-aio \
    --with-threads \
    --with-http_addition_module \
    --with-http_auth_request_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_mp4_module \
    --with-http_random_index_module \
    --with-http_realip_module \
    --with-http_secure_link_module \
    --with-http_slice_module \
    --with-http_ssl_module \
    --with-http_stub_status_module \
    --with-http_sub_module \
    --with-http_v2_module \
    --with-mail \
    --with-mail_ssl_module \
    --with-stream \
    --with-stream_realip_module \
    --with-stream_ssl_module \
    --with-stream_ssl_preread_module
```

#### 编译和安装
```bash
# 编译
make

# 安装
sudo make install

# 创建用户
sudo useradd --system --home /var/cache/nginx --shell /sbin/nologin nginx

# 创建目录
sudo mkdir -p /var/cache/nginx
sudo chown nginx:nginx /var/cache/nginx
```

## ⚙️ 基础配置

### 目录结构

#### 标准目录布局
```
/etc/nginx/                 # 主配置目录
├── nginx.conf              # 主配置文件
├── conf.d/                 # 额外配置目录
│   └── default.conf        # 默认站点配置
├── sites-available/        # 可用站点配置
├── sites-enabled/          # 启用站点配置
├── snippets/               # 配置片段
├── mime.types              # MIME 类型定义
├── fastcgi_params          # FastCGI 参数
├── scgi_params             # SCGI 参数
└── uwsgi_params            # uWSGI 参数

/var/log/nginx/             # 日志目录
├── access.log              # 访问日志
└── error.log               # 错误日志

/var/www/html/              # 默认网站根目录
└── index.html              # 默认首页

/var/cache/nginx/           # 缓存目录
```

### 基础配置文件

#### 主配置文件 (/etc/nginx/nginx.conf)
```nginx
# 用户和组
user nginx;

# 工作进程数（通常等于 CPU 核心数）
worker_processes auto;

# 错误日志
error_log /var/log/nginx/error.log warn;

# PID 文件
pid /var/run/nginx.pid;

# 事件模块
events {
    # 每个工作进程的最大连接数
    worker_connections 1024;
    
    # 使用 epoll 事件模型（Linux）
    use epoll;
    
    # 允许一个工作进程同时接受多个连接
    multi_accept on;
}

# HTTP 模块
http {
    # 包含 MIME 类型定义
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    # 访问日志
    access_log /var/log/nginx/access.log main;
    
    # 高效文件传输
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # 连接超时
    keepalive_timeout 65;
    
    # 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 包含其他配置文件
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

#### 默认站点配置 (/etc/nginx/conf.d/default.conf)
```nginx
server {
    # 监听端口
    listen 80;
    listen [::]:80;
    
    # 服务器名称
    server_name localhost;
    
    # 网站根目录
    root /var/www/html;
    
    # 索引文件
    index index.html index.htm;
    
    # 主要位置块
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /var/www/html;
    }
    
    # 访问日志
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
```

## 🔧 系统服务配置

### systemd 服务文件

#### 创建服务文件 (/etc/systemd/system/nginx.service)
```ini
[Unit]
Description=The nginx HTTP and reverse proxy server
Documentation=http://nginx.org/en/docs/
After=network-online.target remote-fs.target nss-lookup.target
Wants=network-online.target

[Service]
Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
KillMode=mixed
TimeoutStopSec=5
KillSignal=SIGQUIT
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

#### 服务管理命令
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动 Nginx
sudo systemctl start nginx

# 停止 Nginx
sudo systemctl stop nginx

# 重启 Nginx
sudo systemctl restart nginx

# 重新加载配置
sudo systemctl reload nginx

# 查看状态
sudo systemctl status nginx

# 设置开机自启
sudo systemctl enable nginx

# 禁用开机自启
sudo systemctl disable nginx
```

## 🔍 验证安装

### 检查 Nginx 版本
```bash
# 查看版本信息
nginx -v

# 查看详细版本和编译信息
nginx -V
```

### 测试配置文件
```bash
# 测试配置文件语法
sudo nginx -t

# 测试配置文件并显示详细信息
sudo nginx -T
```

### 检查端口监听
```bash
# 检查端口占用
sudo netstat -tlnp | grep nginx
# 或
sudo ss -tlnp | grep nginx
```

### 访问测试
```bash
# 本地访问测试
curl http://localhost

# 检查响应头
curl -I http://localhost
```

## 🚨 常见问题

### 权限问题
```bash
# 检查 Nginx 用户权限
sudo chown -R nginx:nginx /var/www/html
sudo chmod -R 755 /var/www/html

# 检查 SELinux（CentOS/RHEL）
sudo setsebool -P httpd_can_network_connect 1
sudo setsebool -P httpd_can_network_relay 1
```

### 端口占用
```bash
# 检查 80 端口占用
sudo lsof -i :80

# 停止其他 Web 服务器
sudo systemctl stop apache2  # Ubuntu/Debian
sudo systemctl stop httpd    # CentOS/RHEL
```

### 防火墙配置
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# 或者开放特定端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 配置文件错误
```bash
# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 检查配置语法
sudo nginx -t

# 重新加载配置
sudo nginx -s reload
```

## 📚 下一步

安装完成后，您可以：
1. 学习 [配置文件详解](./config.md)
2. 配置 [静态文件服务](./static-files.md)
3. 设置 [反向代理](./reverse-proxy.md)

---

恭喜！您已经成功安装了 Nginx。现在让我们开始配置您的第一个网站吧！ 🎉
