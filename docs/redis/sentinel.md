# Redis 哨兵模式

Redis 哨兵（Sentinel）是 Redis 的高可用性解决方案，提供自动故障检测、故障转移和配置管理功能，确保 Redis 服务的持续可用性。

## 🎯 哨兵模式概述

### 什么是 Redis 哨兵？
Redis 哨兵是一个分布式系统，用于监控 Redis 主从实例，在主节点故障时自动进行故障转移，将从节点提升为新的主节点。

### 核心功能
- **监控（Monitoring）**：持续监控主从节点的健康状态
- **通知（Notification）**：当实例出现问题时发送通知
- **自动故障转移（Automatic Failover）**：主节点故障时自动切换
- **配置提供（Configuration Provider）**：为客户端提供当前主节点信息

### 架构优势
- **高可用性**：自动故障检测和恢复
- **无单点故障**：多个哨兵节点协同工作
- **自动化运维**：减少人工干预
- **客户端透明**：客户端自动连接到新的主节点

## 🏗️ 哨兵架构

### 基本架构
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Sentinel1  │    │  Sentinel2  │    │  Sentinel3  │
│   :26379    │    │   :26379    │    │   :26379    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
    ┌─────────────────────────────────────────────┐
    │                                             │
    ▼                                             ▼
┌─────────────┐                        ┌─────────────┐
│   Master    │ ────────────────────── │   Slave1    │
│   :6379     │                        │   :6380     │
└─────────────┘                        └─────────────┘
                                                │
                                                │
                                       ┌─────────────┐
                                       │   Slave2    │
                                       │   :6381     │
                                       └─────────────┘
```

### 工作原理
1. **监控阶段**：哨兵定期向主从节点发送 PING 命令
2. **主观下线**：单个哨兵认为主节点不可达
3. **客观下线**：多数哨兵确认主节点不可达
4. **选举领导者**：哨兵之间选举出领导者执行故障转移
5. **故障转移**：选择新的主节点，更新配置
6. **通知客户端**：通知客户端新的主节点信息

## ⚙️ 哨兵配置

### 哨兵配置文件
```bash
# sentinel.conf
# 哨兵端口
port 26379

# 哨兵工作目录
dir /var/lib/redis-sentinel

# 监控主节点配置
# sentinel monitor <master-name> <ip> <port> <quorum>
sentinel monitor mymaster 192.168.1.100 6379 2

# 主节点密码
sentinel auth-pass mymaster redis_password

# 主节点下线判断时间（毫秒）
sentinel down-after-milliseconds mymaster 30000

# 故障转移超时时间（毫秒）
sentinel failover-timeout mymaster 180000

# 同时进行复制的从节点数量
sentinel parallel-syncs mymaster 1

# 哨兵日志文件
logfile /var/log/redis/sentinel.log

# 哨兵日志级别
loglevel notice

# 禁用保护模式（仅在安全网络环境下）
protected-mode no

# 哨兵通知脚本
sentinel notification-script mymaster /scripts/notify.sh

# 客户端重新配置脚本
sentinel client-reconfig-script mymaster /scripts/reconfig.sh
```

### 主节点配置
```bash
# redis-master.conf
port 6379
bind 0.0.0.0
requirepass redis_password
masterauth redis_password

# 数据目录
dir /var/lib/redis/master

# 持久化配置
save 900 1
save 300 10
save 60 10000
appendonly yes

# 复制配置
repl-diskless-sync no
repl-backlog-size 1mb
min-slaves-to-write 1
min-slaves-max-lag 10

# 日志配置
logfile /var/log/redis/redis-master.log
loglevel notice
```

### 从节点配置
```bash
# redis-slave.conf
port 6380
bind 0.0.0.0
replicaof 192.168.1.100 6379
masterauth redis_password
requirepass redis_password

# 数据目录
dir /var/lib/redis/slave

# 从节点只读
replica-read-only yes

# 从节点优先级
replica-priority 100

# 日志配置
logfile /var/log/redis/redis-slave.log
loglevel notice
```

## 🚀 部署实践

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
      - ./config/redis-master.conf:/usr/local/etc/redis/redis.conf
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
      - ./config/redis-slave1.conf:/usr/local/etc/redis/redis.conf
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
      - ./config/redis-slave2.conf:/usr/local/etc/redis/redis.conf
      - redis-slave2-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    depends_on:
      - redis-master
    networks:
      - redis-network

  sentinel1:
    image: redis:7-alpine
    container_name: sentinel1
    ports:
      - "26379:26379"
    volumes:
      - ./config/sentinel1.conf:/usr/local/etc/redis/sentinel.conf
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    depends_on:
      - redis-master
      - redis-slave1
      - redis-slave2
    networks:
      - redis-network

  sentinel2:
    image: redis:7-alpine
    container_name: sentinel2
    ports:
      - "26380:26379"
    volumes:
      - ./config/sentinel2.conf:/usr/local/etc/redis/sentinel.conf
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    depends_on:
      - redis-master
      - redis-slave1
      - redis-slave2
    networks:
      - redis-network

  sentinel3:
    image: redis:7-alpine
    container_name: sentinel3
    ports:
      - "26381:26379"
    volumes:
      - ./config/sentinel3.conf:/usr/local/etc/redis/sentinel.conf
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    depends_on:
      - redis-master
      - redis-slave1
      - redis-slave2
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

### 启动和验证
```bash
# 启动服务
docker-compose up -d

# 验证主从复制
redis-cli -h 192.168.1.100 -p 6379 -a redis_password INFO replication

# 验证哨兵状态
redis-cli -h 192.168.1.100 -p 26379 SENTINEL masters
redis-cli -h 192.168.1.100 -p 26379 SENTINEL slaves mymaster
redis-cli -h 192.168.1.100 -p 26379 SENTINEL sentinels mymaster
```

## 🔧 客户端集成

### Python 客户端
```python
import redis
from redis.sentinel import Sentinel

class RedisSentinelClient:
    def __init__(self, sentinels, master_name, password=None):
        self.sentinel = Sentinel(sentinels, socket_timeout=0.1)
        self.master_name = master_name
        self.password = password
        
        # 获取主从连接
        self.master = self.sentinel.master_for(
            master_name, 
            socket_timeout=0.1,
            password=password,
            retry_on_timeout=True
        )
        
        self.slave = self.sentinel.slave_for(
            master_name,
            socket_timeout=0.1,
            password=password,
            retry_on_timeout=True
        )
    
    def write(self, key, value):
        """写操作使用主节点"""
        return self.master.set(key, value)
    
    def read(self, key):
        """读操作使用从节点"""
        try:
            return self.slave.get(key)
        except redis.ConnectionError:
            # 从节点不可用时使用主节点
            return self.master.get(key)
    
    def get_master_info(self):
        """获取当前主节点信息"""
        return self.sentinel.discover_master(self.master_name)
    
    def get_slaves_info(self):
        """获取从节点信息"""
        return self.sentinel.discover_slaves(self.master_name)

# 使用示例
sentinels = [
    ('192.168.1.100', 26379),
    ('192.168.1.101', 26379),
    ('192.168.1.102', 26379)
]

client = RedisSentinelClient(sentinels, 'mymaster', 'redis_password')

# 写操作
client.write('user:1001', 'John Doe')

# 读操作
user = client.read('user:1001')
print(f"User: {user}")

# 获取集群信息
master_info = client.get_master_info()
print(f"Current master: {master_info}")
```

### Java 客户端
```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisSentinelPool;
import java.util.HashSet;
import java.util.Set;

public class RedisSentinelClient {
    private JedisSentinelPool sentinelPool;
    
    public RedisSentinelClient() {
        Set<String> sentinels = new HashSet<>();
        sentinels.add("192.168.1.100:26379");
        sentinels.add("192.168.1.101:26379");
        sentinels.add("192.168.1.102:26379");
        
        this.sentinelPool = new JedisSentinelPool(
            "mymaster",     // master name
            sentinels,      // sentinel addresses
            "redis_password" // password
        );
    }
    
    public void write(String key, String value) {
        try (Jedis jedis = sentinelPool.getResource()) {
            jedis.set(key, value);
        }
    }
    
    public String read(String key) {
        try (Jedis jedis = sentinelPool.getResource()) {
            return jedis.get(key);
        }
    }
    
    public void close() {
        if (sentinelPool != null) {
            sentinelPool.close();
        }
    }
}
```

## 📊 监控和管理

### 哨兵命令
```bash
# 连接到哨兵
redis-cli -h 192.168.1.100 -p 26379

# 查看监控的主节点
SENTINEL masters

# 查看指定主节点的从节点
SENTINEL slaves mymaster

# 查看其他哨兵节点
SENTINEL sentinels mymaster

# 获取主节点地址
SENTINEL get-master-addr-by-name mymaster

# 手动故障转移
SENTINEL failover mymaster

# 重置哨兵状态
SENTINEL reset mymaster

# 检查主节点状态
SENTINEL ckquorum mymaster
```

### 监控脚本
```bash
#!/bin/bash
# sentinel_monitor.sh

SENTINELS=("192.168.1.100:26379" "192.168.1.101:26379" "192.168.1.102:26379")
MASTER_NAME="mymaster"

echo "=== Redis 哨兵监控报告 ==="
echo "时间: $(date)"
echo

for sentinel in "${SENTINELS[@]}"; do
    IFS=':' read -r host port <<< "$sentinel"
    echo "哨兵节点: $host:$port"
    
    # 检查哨兵状态
    if redis-cli -h $host -p $port ping > /dev/null 2>&1; then
        echo "  状态: 在线"
        
        # 获取主节点信息
        master_info=$(redis-cli -h $host -p $port SENTINEL get-master-addr-by-name $MASTER_NAME 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "  主节点: $master_info"
        else
            echo "  主节点: 获取失败"
        fi
        
        # 获取从节点数量
        slave_count=$(redis-cli -h $host -p $port SENTINEL slaves $MASTER_NAME 2>/dev/null | grep -c "name")
        echo "  从节点数量: $slave_count"
    else
        echo "  状态: 离线"
    fi
    echo
done
```

## ⚠️ 故障处理

### 常见故障场景

#### 1. 主节点故障
```bash
# 模拟主节点故障
docker stop redis-master

# 观察哨兵日志
docker logs sentinel1

# 验证故障转移
redis-cli -h 192.168.1.100 -p 26379 SENTINEL get-master-addr-by-name mymaster
```

#### 2. 网络分区
```bash
# 模拟网络分区
iptables -A INPUT -s 192.168.1.100 -j DROP

# 检查哨兵状态
SENTINEL masters
SENTINEL ckquorum mymaster
```

#### 3. 哨兵节点故障
```bash
# 停止哨兵节点
docker stop sentinel1

# 检查剩余哨兵状态
redis-cli -h 192.168.1.101 -p 26379 SENTINEL sentinels mymaster
```

### 故障恢复
```bash
# 恢复故障节点
docker start redis-master
docker start sentinel1

# 检查恢复状态
redis-cli -h 192.168.1.100 -p 6379 -a redis_password INFO replication
redis-cli -h 192.168.1.100 -p 26379 SENTINEL masters
```

## 🛡️ 最佳实践

### 1. 哨兵部署
- **奇数个哨兵**：推荐部署 3 个或 5 个哨兵节点
- **分布式部署**：哨兵节点部署在不同的物理机器上
- **网络隔离**：避免所有哨兵节点在同一网络段
- **资源独立**：哨兵节点使用独立的资源

### 2. 配置优化
```bash
# 合理设置超时时间
sentinel down-after-milliseconds mymaster 30000  # 30秒
sentinel failover-timeout mymaster 180000         # 3分钟

# 控制并发复制
sentinel parallel-syncs mymaster 1

# 设置合适的 quorum
# quorum = (哨兵总数 / 2) + 1
```

### 3. 监控告警
- 监控哨兵节点状态
- 监控主从切换事件
- 监控网络连接状态
- 设置故障转移告警

### 4. 运维管理
- 定期备份配置文件
- 测试故障转移流程
- 监控性能指标
- 制定应急预案

---

*Redis 哨兵模式是实现高可用性的重要方案，通过自动故障检测和转移，大大提高了 Redis 服务的可靠性！*
