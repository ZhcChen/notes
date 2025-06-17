# Redis 配置文件详解

Redis 的配置文件 `redis.conf` 是 Redis 服务器的核心配置文件，包含了所有可调整的参数。本文将详细解析常用配置项及其作用。

## 📁 配置文件位置

- 默认位置：`/etc/redis/redis.conf` (Linux)
- 启动时指定：`redis-server /path/to/redis.conf`

## 🔧 常用配置项解析

### 网络相关配置
```nginx
# 绑定 IP 地址 (默认只监听本地)
bind 127.0.0.1

# 监听端口 (默认 6379)
port 6379

# TCP 连接积压队列长度
tcp-backlog 511

# 客户端空闲超时 (秒)
timeout 0
```

### 通用配置
```nginx
# 以守护进程运行 (后台运行)
daemonize yes

# PID 文件位置
pidfile /var/run/redis.pid

# 日志级别 (debug/verbose/notice/warning)
loglevel notice

# 日志文件路径
logfile /var/log/redis.log

# 数据库数量 (默认 16 个)
databases 16
```

### 持久化配置
```nginx
# RDB 持久化 - 保存条件
save 900 1      # 900 秒内至少 1 个键被修改
save 300 10     # 300 秒内至少 10 个键被修改
save 60 10000   # 60 秒内至少 10000 个键被修改

# RDB 文件名
dbfilename dump.rdb

# RDB 文件存储目录
dir /var/lib/redis

# AOF 持久化开关
appendonly yes

# AOF 文件名
appendfilename "appendonly.aof"

# AOF 重写策略
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

### 内存管理
```nginx
# 最大内存限制
maxmemory 2gb

# 内存淘汰策略
maxmemory-policy volatile-lru
```

### 安全配置
```nginx
# 访问密码
requirepass your_strong_password

# 危险命令重命名
rename-command FLUSHDB ""          # 禁用命令
rename-command CONFIG "HIDDEN-CONFIG" # 重命名命令
```

### 高级配置
```nginx
# 慢查询日志阈值 (微秒)
slowlog-log-slower-than 10000

# 最大客户端连接数
maxclients 10000

# 后台任务频率
hz 10
```

## ⚙️ 配置最佳实践

1. **生产环境调整**：
   ```nginx
   daemonize yes
   protected-mode yes
   requirepass strong_password
   ```

2. **内存优化**：
   ```nginx
   maxmemory 16gb
   maxmemory-policy allkeys-lru
   ```

3. **持久化策略**：
   ```nginx
   appendonly yes
   appendfsync everysec
   auto-aof-rewrite-percentage 100
   auto-aof-rewrite-min-size 1gb
   ```

4. **安全加固**：
   ```nginx
   rename-command FLUSHALL ""
   rename-command FLUSHDB ""
   rename-command CONFIG "RESTRICTED_CONFIG"
   ```

## 🛠️ 配置验证与重载

1. 检查配置文件语法：
   ```bash
   redis-check-config /path/to/redis.conf
   ```

2. 运行时重载配置（不重启）：
   ```bash
   redis-cli CONFIG RELOAD
   ```

## 📝 配置文件模板

完整配置文件模板可参考：
[Redis 官方配置模板](https://raw.githubusercontent.com/redis/redis/6.0/redis.conf)

> 提示：修改配置后，建议使用 `CONFIG REWRITE` 命令将运行时修改持久化到配置文件。