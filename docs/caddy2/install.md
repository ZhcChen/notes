# Caddy2 安装与环境配置

本章将详细介绍如何在不同操作系统上安装 Caddy2，以及基本的环境配置。

## 🖥️ 系统要求

### 最低要求
- **操作系统**：Linux、macOS、Windows、FreeBSD
- **内存**：512MB RAM（推荐 1GB+）
- **存储**：50MB 可用空间
- **网络**：互联网连接（用于证书获取）

### 推荐配置
- **CPU**：2核心以上
- **内存**：2GB+ RAM
- **存储**：SSD 存储
- **网络**：稳定的互联网连接

## 📦 安装方式

### 方式一：官方安装脚本（推荐）

#### Linux/macOS
```bash
# 使用官方安装脚本
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# 或者使用一键安装脚本
curl -fsSL https://getcaddy.com | bash
```

#### 验证安装
```bash
caddy version
# 输出示例：v2.7.6 h1:w0NymbG2m9PcvKWsrXO6EEkY9Ru4FJK8uQbYcev1p3A=
```

### 方式二：包管理器安装

#### Ubuntu/Debian
```bash
# 添加官方仓库
echo "deb [trusted=yes] https://apt.fury.io/caddy/ /" | sudo tee -a /etc/apt/sources.list.d/caddy-fury.list
sudo apt update
sudo apt install caddy
```

#### CentOS/RHEL/Fedora
```bash
# 使用 dnf/yum
sudo dnf copr enable @caddy/caddy
sudo dnf install caddy

# 或使用 yum
sudo yum install yum-plugin-copr
sudo yum copr enable @caddy/caddy
sudo yum install caddy
```

#### macOS
```bash
# 使用 Homebrew
brew install caddy

# 使用 MacPorts
sudo port install caddy
```

#### Windows
```powershell
# 使用 Chocolatey
choco install caddy

# 使用 Scoop
scoop install caddy

# 使用 Winget
winget install Caddy.Caddy
```

### 方式三：二进制文件安装

#### 下载预编译二进制
```bash
# 下载最新版本（以 Linux amd64 为例）
wget https://github.com/caddyserver/caddy/releases/latest/download/caddy_linux_amd64.tar.gz

# 解压
tar -xzf caddy_linux_amd64.tar.gz

# 移动到系统路径
sudo mv caddy /usr/local/bin/

# 设置执行权限
sudo chmod +x /usr/local/bin/caddy
```

#### 其他架构下载
```bash
# ARM64
wget https://github.com/caddyserver/caddy/releases/latest/download/caddy_linux_arm64.tar.gz

# Windows
wget https://github.com/caddyserver/caddy/releases/latest/download/caddy_windows_amd64.zip

# macOS
wget https://github.com/caddyserver/caddy/releases/latest/download/caddy_darwin_amd64.tar.gz
```

### 方式四：Docker 安装

#### 基础 Docker 运行
```bash
# 拉取官方镜像
docker pull caddy:latest

# 运行容器
docker run -d \
  --name caddy \
  -p 80:80 \
  -p 443:443 \
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:latest
```

#### Docker Compose 配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  caddy:
    image: caddy:latest
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./site:/srv
      - caddy_data:/data
      - caddy_config:/config
    environment:
      - CADDY_INGRESS_NETWORKS=caddy

volumes:
  caddy_data:
    external: true
  caddy_config:
```

### 方式五：源码编译

#### 安装 Go 环境
```bash
# 安装 Go（需要 1.19+）
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

#### 编译 Caddy
```bash
# 克隆源码
git clone https://github.com/caddyserver/caddy.git
cd caddy

# 编译
go build -o caddy cmd/caddy/main.go

# 安装
sudo mv caddy /usr/local/bin/
```

## ⚙️ 基础配置

### 创建配置目录
```bash
# 创建配置目录
sudo mkdir -p /etc/caddy
sudo mkdir -p /var/lib/caddy
sudo mkdir -p /var/log/caddy

# 设置权限
sudo chown -R caddy:caddy /etc/caddy
sudo chown -R caddy:caddy /var/lib/caddy
sudo chown -R caddy:caddy /var/log/caddy
```

### 创建系统用户
```bash
# 创建 caddy 用户
sudo useradd --system --home /var/lib/caddy --shell /bin/false caddy
```

### 基础 Caddyfile
```bash
# 创建基础配置文件
sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
# 全局配置
{
    # 管理员邮箱（用于 Let's Encrypt）
    email your-email@example.com
    
    # 日志配置
    log {
        output file /var/log/caddy/access.log
        format json
    }
}

# 站点配置
localhost {
    respond "Hello, Caddy!"
}
EOF
```

## 🔧 系统服务配置

### systemd 服务（Linux）

#### 创建服务文件
```bash
sudo tee /etc/systemd/system/caddy.service > /dev/null <<EOF
[Unit]
Description=Caddy
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=1048576
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF
```

#### 启动服务
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用开机自启
sudo systemctl enable caddy

# 启动服务
sudo systemctl start caddy

# 查看状态
sudo systemctl status caddy
```

### Windows 服务

#### 使用 NSSM 创建服务
```powershell
# 下载 NSSM
# 从 https://nssm.cc/download 下载

# 安装服务
nssm install Caddy "C:\caddy\caddy.exe"
nssm set Caddy Parameters "run --config C:\caddy\Caddyfile"
nssm set Caddy DisplayName "Caddy Web Server"
nssm set Caddy Description "Caddy HTTP/2 web server with automatic HTTPS"

# 启动服务
nssm start Caddy
```

### macOS LaunchDaemon

#### 创建 plist 文件
```xml
<!-- /Library/LaunchDaemons/com.caddyserver.caddy.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.caddyserver.caddy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/caddy</string>
        <string>run</string>
        <string>--config</string>
        <string>/usr/local/etc/Caddyfile</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

#### 加载服务
```bash
sudo launchctl load /Library/LaunchDaemons/com.caddyserver.caddy.plist
sudo launchctl start com.caddyserver.caddy
```

## 🔍 验证安装

### 检查版本
```bash
caddy version
```

### 测试配置
```bash
# 验证配置文件
caddy validate --config /etc/caddy/Caddyfile

# 测试运行
caddy run --config /etc/caddy/Caddyfile
```

### 检查端口监听
```bash
# 检查端口占用
sudo netstat -tlnp | grep caddy
# 或
sudo ss -tlnp | grep caddy
```

### 访问测试
```bash
# 测试本地访问
curl http://localhost
# 应该返回 "Hello, Caddy!"
```

## 🚨 常见问题

### 权限问题
```bash
# 如果遇到权限问题，检查文件所有者
sudo chown -R caddy:caddy /etc/caddy
sudo chown -R caddy:caddy /var/lib/caddy

# 检查 SELinux（CentOS/RHEL）
sudo setsebool -P httpd_can_network_connect 1
```

### 端口占用
```bash
# 检查 80/443 端口是否被占用
sudo lsof -i :80
sudo lsof -i :443

# 停止其他 Web 服务器
sudo systemctl stop apache2  # Ubuntu/Debian
sudo systemctl stop httpd    # CentOS/RHEL
sudo systemctl stop nginx
```

### 防火墙配置
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 80
sudo ufw allow 443

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 📚 下一步

安装完成后，您可以：
1. 学习 [Caddyfile 配置语法](./config.md)
2. 配置 [静态文件服务](./static-files.md)
3. 设置 [自动 HTTPS](./https.md)

---

恭喜！您已经成功安装了 Caddy2。现在让我们开始配置您的第一个网站吧！ 🎉
