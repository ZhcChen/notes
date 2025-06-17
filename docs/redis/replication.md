# Redis 主从复制

Redis 主从复制是实现数据冗余、读写分离和高可用性的重要机制。本文档详细介绍主从复制的原理、配置和最佳实践。

## 🎯 主从复制概述

### 什么是主从复制？
主从复制是指将一个 Redis 服务器的数据复制到其他 Redis 服务器。前者称为主节点（Master），后者称为从节点（Slave/Replica）。

### 主要特点
- **数据冗余**：从节点是主节点的完整副本
- **读写分离**：主节点处理写操作，从节点处理读操作
- **故障恢复**：主节点故障时可以快速切换到从节点
- **负载分担**：多个从节点分担读请求压力

## 🏗️ 复制原理

### 复制过程
```
1. 从节点连接主节点
2. 从节点发送 PSYNC 命令
3. 主节点执行 BGSAVE 生成 RDB 文件
4. 主节点将 RDB 文件发送给从节点
5. 从节点加载 RDB 文件
6. 主节点将缓冲区的写命令发送给从节点
7. 进入增量同步阶段
```

### 同步类型

#### 全量同步（Full Resynchronization）
```bash
# 触发条件：
# 1. 从节点首次连接主节点
# 2. 主从断线后无法进行部分同步
# 3. 从节点执行 SLAVEOF 命令

# 过程：
Master: BGSAVE -> RDB文件
Master: 发送RDB文件到Slave
Slave:  清空数据库
Slave:  加载RDB文件
Master: 发送复制缓冲区命令
```

#### 部分同步（Partial Resynchronization）
```bash
# 触发条件：
# 主从断线重连，且满足部分同步条件

# 过程：
Slave:  发送 PSYNC runid offset
Master: 检查复制积压缓冲区
Master: 发送缺失的命令
```

## ⚙️ 配置主从复制

### 主节点配置

#### redis.conf 配置
```bash
# /etc/redis/redis-master.conf

# 绑定地址
bind 0.0.0.0

# 端口
port 6379

# 设置密码
requirepass master_password

# 从节点连接密码
masterauth master_password

# 数据目录
dir /var/lib/redis/master

# 日志文件
logfile /var/log/redis/redis-master.log

# RDB 配置
save 900 1
save 300 10
save 60 10000
dbfilename dump-master.rdb

# AOF 配置
appendonly yes
appendfilename "appendonly-master.aof"

# 复制相关配置
repl-diskless-sync no
repl-diskless-sync-delay 5
repl-ping-slave-period 10
repl-timeout 60
repl-disable-tcp-nodelay no
repl-backlog-size 1mb
repl-backlog-ttl 3600

# 最小从节点配置
min-slaves-to-write 1
min-slaves-max-lag 10
```

### 从节点配置

#### 方法一：配置文件
```bash
# /etc/redis/redis-slave.conf

# 绑定地址
bind 0.0.0.0

# 端口
port 6380

# 主节点信息
slaveof 192.168.1.100 6379
# 或使用新语法
replicaof 192.168.1.100 6379

# 主节点密码
masterauth master_password

# 从节点密码
requirepass slave_password

# 数据目录
dir /var/lib/redis/slave

# 日志文件
logfile /var/log/redis/redis-slave.log

# RDB 配置
dbfilename dump-slave.rdb

# AOF 配置
appendonly yes
appendfilename "appendonly-slave.aof"

# 从节点只读（默认）
slave-read-only yes

# 从节点优先级（用于故障转移）
slave-priority 100

# 复制相关配置
slave-serve-stale-data yes
slave-announce-ip 192.168.1.101
slave-announce-port 6380
```

#### 方法二：运行时配置
```bash
# 连接到从节点
redis-cli -h 192.168.1.101 -p 6380

# 设置主从关系
127.0.0.1:6380> SLAVEOF 192.168.1.100 6379
OK

# 或使用新命令
127.0.0.1:6380> REPLICAOF 192.168.1.100 6379
OK

# 取消主从关系
127.0.0.1:6380> SLAVEOF NO ONE
OK
```

## 🚀 部署示例

### Docker Compose 部署
```yaml
# docker-compose.yml
version: '3.8'

services:
  redis-master:
    image: redis:7-alpine
    container_name: redis-master
    ports:
      - "6379:6379"
    volumes:
      - ./config/master.conf:/usr/local/etc/redis/redis.conf
      - redis-master-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - redis-network

  redis-slave1:
    image: redis:7-alpine
    container_name: redis-slave1
    ports:
      - "6380:6379"
    volumes:
      - ./config/slave1.conf:/usr/local/etc/redis/redis.conf
      - redis-slave1-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    depends_on:
      - redis-master
    networks:
      - redis-network

  redis-slave2:
    image: redis:7-alpine
    container_name: redis-slave2
    ports:
      - "6381:6379"
    volumes:
      - ./config/slave2.conf:/usr/local/etc/redis/redis.conf
      - redis-slave2-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    depends_on:
      - redis-master
    networks:
      - redis-network

volumes:
  redis-master-data:
  redis-slave1-data:
  redis-slave2-data:

networks:
  redis-network:
    driver: bridge
```

### 配置文件示例

#### 主节点配置
```bash
# config/master.conf
port 6379
bind 0.0.0.0
requirepass redis123
dir /data
dbfilename dump.rdb
appendonly yes
appendfilename appendonly.aof
save 900 1
save 300 10
save 60 10000
```

#### 从节点配置
```bash
# config/slave1.conf
port 6379
bind 0.0.0.0
replicaof redis-master 6379
masterauth redis123
requirepass redis123
slave-read-only yes
dir /data
dbfilename dump.rdb
appendonly yes
appendfilename appendonly.aof
```

## 📊 监控和管理

### 查看复制状态
```bash
# 在主节点查看
redis-cli -h 192.168.1.100 -p 6379 -a master_password
127.0.0.1:6379> INFO replication
# Replication
role:master
connected_slaves:2
slave0:ip=192.168.1.101,port=6380,state=online,offset=1234,lag=0
slave1:ip=192.168.1.102,port=6380,state=online,offset=1234,lag=1
master_replid:b8c99c5e5f5d5c5e5f5d5c5e5f5d5c5e5f5d5c5e
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:1234
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:1234

# 在从节点查看
redis-cli -h 192.168.1.101 -p 6380 -a slave_password
127.0.0.1:6380> INFO replication
# Replication
role:slave
master_host:192.168.1.100
master_port:6379
master_link_status:up
master_last_io_seconds_ago:1
master_sync_in_progress:0
slave_repl_offset:1234
slave_priority:100
slave_read_only:1
connected_slaves:0
```

### 监控脚本
```bash
#!/bin/bash
# monitor_replication.sh

MASTER_HOST="192.168.1.100"
MASTER_PORT="6379"
MASTER_PASSWORD="master_password"

SLAVES=("192.168.1.101:6380" "192.168.1.102:6380")
SLAVE_PASSWORD="slave_password"

echo "=== Redis 主从复制状态监控 ==="
echo "时间: $(date)"
echo

# 检查主节点状态
echo "主节点状态:"
redis-cli -h $MASTER_HOST -p $MASTER_PORT -a $MASTER_PASSWORD INFO replication | grep -E "(role|connected_slaves|master_repl_offset)"
echo

# 检查从节点状态
for slave in "${SLAVES[@]}"; do
    IFS=':' read -r host port <<< "$slave"
    echo "从节点 $host:$port 状态:"
    redis-cli -h $host -p $port -a $SLAVE_PASSWORD INFO replication | grep -E "(role|master_link_status|slave_repl_offset)"
    echo
done
```

## 🔧 故障处理

### 常见问题

#### 1. 主从同步失败
```bash
# 检查网络连接
telnet 192.168.1.100 6379

# 检查密码配置
redis-cli -h 192.168.1.100 -p 6379 -a master_password ping

# 检查防火墙
sudo ufw status
sudo firewall-cmd --list-all

# 查看错误日志
tail -f /var/log/redis/redis-slave.log
```

#### 2. 复制延迟过高
```bash
# 检查网络延迟
ping 192.168.1.100

# 检查主节点负载
redis-cli -h 192.168.1.100 -p 6379 -a master_password INFO stats

# 调整复制参数
CONFIG SET repl-ping-slave-period 5
CONFIG SET repl-timeout 30
```

#### 3. 从节点数据不一致
```bash
# 强制全量同步
redis-cli -h 192.168.1.101 -p 6380 -a slave_password
127.0.0.1:6380> SLAVEOF NO ONE
127.0.0.1:6380> SLAVEOF 192.168.1.100 6379

# 检查复制偏移量
INFO replication | grep offset
```

### 故障转移

#### 手动故障转移
```bash
# 1. 停止主节点写入
redis-cli -h 192.168.1.100 -p 6379 -a master_password
127.0.0.1:6379> CONFIG SET min-slaves-to-write 999

# 2. 等待从节点同步完成
redis-cli -h 192.168.1.101 -p 6380 -a slave_password INFO replication

# 3. 提升从节点为主节点
127.0.0.1:6380> SLAVEOF NO ONE

# 4. 更新应用程序连接
# 修改应用配置，将写操作指向新的主节点

# 5. 配置其他从节点
redis-cli -h 192.168.1.102 -p 6380 -a slave_password
127.0.0.1:6380> SLAVEOF 192.168.1.101 6380
```

## 📈 性能优化

### 复制性能调优
```bash
# 主节点配置
repl-diskless-sync yes          # 无盘复制
repl-diskless-sync-delay 5      # 延迟时间
repl-ping-slave-period 10       # ping 间隔
repl-timeout 60                 # 超时时间
repl-backlog-size 16mb          # 复制积压缓冲区大小
repl-backlog-ttl 3600           # 缓冲区保留时间

# 网络优化
tcp-keepalive 300               # TCP keepalive
tcp-backlog 511                 # TCP 监听队列长度

# 内存优化
maxmemory-policy allkeys-lru    # 内存淘汰策略
```

### 读写分离配置
```python
# Python 示例
import redis
from redis.sentinel import Sentinel

# 配置哨兵
sentinels = [('192.168.1.100', 26379), ('192.168.1.101', 26379)]
sentinel = Sentinel(sentinels)

# 获取主从连接
master = sentinel.master_for('mymaster', socket_timeout=0.1)
slave = sentinel.slave_for('mymaster', socket_timeout=0.1)

# 写操作使用主节点
master.set('key', 'value')

# 读操作使用从节点
value = slave.get('key')
```

## 🛡️ 安全配置

### 访问控制
```bash
# 主节点配置
requirepass strong_master_password
masterauth strong_master_password

# 从节点配置
requirepass strong_slave_password
masterauth strong_master_password

# 网络安全
bind 192.168.1.100              # 绑定内网地址
protected-mode yes              # 启用保护模式

# 命令重命名
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_abc123"
```

### SSL/TLS 加密
```bash
# 生成证书
openssl req -x509 -nodes -newkey rsa:4096 -keyout redis.key -out redis.crt -days 365

# 配置 SSL
port 0
tls-port 6379
tls-cert-file /etc/redis/tls/redis.crt
tls-key-file /etc/redis/tls/redis.key
tls-protocols "TLSv1.2 TLSv1.3"
```

## 📋 最佳实践

### 1. 架构设计
- 使用奇数个节点避免脑裂
- 主从节点部署在不同机器/机架
- 配置合适的复制积压缓冲区大小
- 使用哨兵模式实现自动故障转移

### 2. 监控告警
- 监控主从延迟
- 监控复制连接状态
- 设置复制中断告警
- 监控内存使用情况

### 3. 运维管理
- 定期备份数据
- 测试故障转移流程
- 监控网络质量
- 优化复制参数

### 4. 容量规划
- 评估读写比例
- 计算从节点数量
- 规划网络带宽
- 预留扩容空间

---

*通过主从复制，Redis 可以实现数据冗余和读写分离，为高可用架构奠定基础！*