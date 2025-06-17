# Redis 安装与配置

本文档将指导您在不同操作系统上安装和配置 Redis。

## 🐧 Linux 安装

### Ubuntu/Debian 系统

#### 方法一：使用包管理器（推荐）
```bash
# 更新包列表
sudo apt update

# 安装 Redis
sudo apt install redis-server

# 启动 Redis 服务
sudo systemctl start redis-server

# 设置开机自启
sudo systemctl enable redis-server

# 检查服务状态
sudo systemctl status redis-server
```

#### 方法二：编译安装
```bash
# 安装编译依赖
sudo apt install build-essential tcl

# 下载 Redis 源码
wget http://download.redis.io/redis-stable.tar.gz
tar xzf redis-stable.tar.gz
cd redis-stable

# 编译安装
make
sudo make install

# 创建配置目录
sudo mkdir /etc/redis
sudo cp redis.conf /etc/redis/

# 创建 Redis 用户
sudo adduser --system --group --no-create-home redis

# 创建数据目录
sudo mkdir /var/lib/redis
sudo chown redis:redis /var/lib/redis
sudo chmod 770 /var/lib/redis
```

### CentOS/RHEL 系统

#### 使用 EPEL 仓库
```bash
# 安装 EPEL 仓库
sudo yum install epel-release

# 安装 Redis
sudo yum install redis

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis

# 检查状态
sudo systemctl status redis
```

#### 编译安装
```bash
# 安装编译工具
sudo yum groupinstall "Development Tools"
sudo yum install tcl

# 下载并编译（同 Ubuntu 步骤）
wget http://download.redis.io/redis-stable.tar.gz
tar xzf redis-stable.tar.gz
cd redis-stable
make
sudo make install
```

## 🍎 macOS 安装

### 使用 Homebrew（推荐）
```bash
# 安装 Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Redis
brew install redis

# 启动 Redis 服务
brew services start redis

# 停止 Redis 服务
brew services stop redis

# 重启 Redis 服务
brew services restart redis
```

### 手动启动
```bash
# 前台启动（用于开发测试）
redis-server

# 指定配置文件启动
redis-server /usr/local/etc/redis.conf
```

## 🪟 Windows 安装

### 使用 WSL（推荐）
```bash
# 在 WSL 中按照 Linux 安装步骤进行
# 启用 WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 安装 Ubuntu WSL
# 然后按照 Ubuntu 安装步骤操作
```

### 使用 Docker（跨平台推荐）
```bash
# 拉取 Redis 镜像
docker pull redis:latest

# 运行 Redis 容器
docker run --name my-redis -p 6379:6379 -d redis:latest

# 运行带持久化的 Redis
docker run --name my-redis-persistent \
  -p 6379:6379 \
  -v redis-data:/data \
  -d redis:latest redis-server --appendonly yes

# 连接到 Redis 容器
docker exec -it my-redis redis-cli
```

## 🐳 Docker 部署

### 基础部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped

volumes:
  redis-data:
```

### 生产环境部署
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: redis-prod
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - ./data:/data
      - ./config/redis.conf:/usr/local/etc/redis/redis.conf
      - ./logs:/var/log/redis
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: always
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    networks:
      - redis-network
    ulimits:
      memlock:
        soft: -1
        hard: -1

networks:
  redis-network:
    driver: bridge
```

## ⚙️ 基础配置

### 配置文件位置
```bash
# Linux 系统
/etc/redis/redis.conf

# macOS (Homebrew)
/usr/local/etc/redis.conf

# 编译安装
/path/to/redis/redis.conf
```

### 重要配置项

#### 网络配置
```bash
# 绑定地址（默认只允许本地连接）
bind 127.0.0.1

# 允许所有地址连接（生产环境需谨慎）
bind 0.0.0.0

# 端口配置
port 6379

# 禁用保护模式（仅在安全网络环境下）
protected-mode no
```

#### 内存配置
```bash
# 最大内存限制
maxmemory 2gb

# 内存淘汰策略
maxmemory-policy allkeys-lru

# 内存使用报告
maxmemory-samples 5
```

#### 持久化配置
```bash
# RDB 快照配置
save 900 1      # 900秒内至少1个key变化时保存
save 300 10     # 300秒内至少10个key变化时保存
save 60 10000   # 60秒内至少10000个key变化时保存

# RDB 文件名和路径
dbfilename dump.rdb
dir /var/lib/redis

# AOF 持久化
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
```

#### 安全配置
```bash
# 设置密码
requirepass your_strong_password

# 重命名危险命令
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_9a8b7c6d"

# 禁用某些命令
rename-command DEBUG ""
rename-command EVAL ""
```

#### 日志配置
```bash
# 日志级别
loglevel notice

# 日志文件
logfile /var/log/redis/redis-server.log

# 系统日志
syslog-enabled yes
syslog-ident redis
```

## 🔧 性能优化配置

### 系统级优化
```bash
# 修改系统限制
echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
echo 'vm.swappiness = 1' >> /etc/sysctl.conf

# 应用配置
sysctl -p

# 禁用透明大页
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
```

### Redis 性能配置
```bash
# TCP 连接配置
tcp-keepalive 300
tcp-backlog 511

# 客户端连接
maxclients 10000
timeout 0

# 慢查询日志
slowlog-log-slower-than 10000
slowlog-max-len 128

# 数据库数量
databases 16
```

## 🚀 启动和管理

### 服务管理命令
```bash
# 启动 Redis
sudo systemctl start redis

# 停止 Redis
sudo systemctl stop redis

# 重启 Redis
sudo systemctl restart redis

# 查看状态
sudo systemctl status redis

# 查看日志
sudo journalctl -u redis -f
```

### 手动启动
```bash
# 前台启动
redis-server

# 后台启动
redis-server --daemonize yes

# 指定配置文件
redis-server /path/to/redis.conf

# 指定端口
redis-server --port 6380
```

## 🔍 验证安装

### 连接测试
```bash
# 连接到 Redis
redis-cli

# 测试连接
127.0.0.1:6379> ping
PONG

# 设置和获取值
127.0.0.1:6379> set test "Hello Redis"
OK
127.0.0.1:6379> get test
"Hello Redis"

# 查看服务器信息
127.0.0.1:6379> info server
```

### 性能测试
```bash
# 基准测试
redis-benchmark -h 127.0.0.1 -p 6379 -n 100000 -c 50

# 测试特定命令
redis-benchmark -h 127.0.0.1 -p 6379 -t set,get -n 100000 -q

# 测试管道性能
redis-benchmark -h 127.0.0.1 -p 6379 -n 1000000 -t set,get -P 16 -q
```

## 🛠️ 常见问题

### 1. 连接被拒绝
```bash
# 检查服务状态
sudo systemctl status redis

# 检查端口监听
sudo netstat -tlnp | grep 6379

# 检查防火墙
sudo ufw status
sudo firewall-cmd --list-all
```

### 2. 内存不足
```bash
# 检查内存使用
redis-cli info memory

# 设置内存限制
redis-cli config set maxmemory 1gb
redis-cli config set maxmemory-policy allkeys-lru
```

### 3. 权限问题
```bash
# 检查文件权限
ls -la /var/lib/redis/
ls -la /var/log/redis/

# 修复权限
sudo chown -R redis:redis /var/lib/redis/
sudo chown -R redis:redis /var/log/redis/
```

## 📋 安装检查清单

- [ ] Redis 服务正常启动
- [ ] 可以通过 redis-cli 连接
- [ ] 基本命令测试通过
- [ ] 配置文件路径正确
- [ ] 日志文件可写
- [ ] 数据目录权限正确
- [ ] 防火墙规则配置
- [ ] 开机自启设置
- [ ] 性能基准测试
- [ ] 安全配置检查

---

*Redis 安装完成，开始您的高性能数据存储之旅！*