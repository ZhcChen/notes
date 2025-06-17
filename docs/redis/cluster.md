# Redis 集群模式

Redis 集群（Cluster）是 Redis 的分布式解决方案，提供数据分片、高可用性和水平扩展能力，适用于大规模数据存储和高并发场景。

## 🎯 集群概述

### 什么是 Redis 集群？
Redis 集群是一个分布式的 Redis 实现，通过数据分片将数据分布在多个节点上，同时提供高可用性和故障转移功能。

### 核心特性
- **数据分片**：自动将数据分布到多个节点
- **高可用性**：节点故障时自动故障转移
- **水平扩展**：支持动态添加和删除节点
- **无中心架构**：所有节点地位平等，无单点故障
- **客户端路由**：客户端直接连接到正确的节点

### 架构优势
- **线性扩展**：可以扩展到1000个节点
- **高性能**：数据分片提高并发处理能力
- **高可用**：部分节点故障不影响整体服务
- **运维简单**：自动化的集群管理

## 🏗️ 集群架构

### 基本架构
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Master1   │    │   Master2   │    │   Master3   │
│   :7001     │    │   :7002     │    │   :7003     │
│ Slots:0-5460│    │Slots:5461-  │    │Slots:10923- │
│             │    │    10922    │    │    16383    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Slave1    │    │   Slave2    │    │   Slave3    │
│   :7004     │    │   :7005     │    │   :7006     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 数据分片原理
```bash
# Redis 集群使用 16384 个哈希槽（slots）
# 每个键通过 CRC16 算法计算槽位
slot = CRC16(key) % 16384

# 槽位分配示例：
# 节点1：0-5460     (5461个槽)
# 节点2：5461-10922 (5462个槽)
# 节点3：10923-16383(5461个槽)
```

### 节点角色
- **主节点（Master）**：处理读写请求，负责特定槽位
- **从节点（Slave）**：主节点的副本，提供读服务和故障转移
- **故障转移**：主节点故障时，从节点自动提升为主节点

## ⚙️ 集群配置

### 节点配置文件
```bash
# redis-7001.conf (主节点1)
port 7001
bind 0.0.0.0

# 启用集群模式
cluster-enabled yes

# 集群配置文件
cluster-config-file nodes-7001.conf

# 节点超时时间
cluster-node-timeout 15000

# 集群要求至少3个主节点
cluster-require-full-coverage yes

# 数据目录
dir /var/lib/redis/7001

# 持久化配置
appendonly yes
appendfilename "appendonly-7001.aof"

# 日志配置
logfile /var/log/redis/redis-7001.log
loglevel notice

# 密码配置
requirepass redis_password
masterauth redis_password
```

### 完整集群配置
```bash
# 创建6个节点的配置文件
for port in 7001 7002 7003 7004 7005 7006; do
cat > redis-${port}.conf << EOF
port ${port}
bind 0.0.0.0
cluster-enabled yes
cluster-config-file nodes-${port}.conf
cluster-node-timeout 15000
cluster-require-full-coverage yes
dir /var/lib/redis/${port}
appendonly yes
appendfilename "appendonly-${port}.aof"
logfile /var/log/redis/redis-${port}.log
loglevel notice
requirepass redis_password
masterauth redis_password
EOF
done
```

## 🚀 集群部署

### Docker Compose 部署
```yaml
# docker-compose.yml
version: '3.8'

services:
  redis-7001:
    image: redis:7-alpine
    container_name: redis-7001
    ports:
      - "7001:7001"
      - "17001:17001"
    volumes:
      - ./config/redis-7001.conf:/usr/local/etc/redis/redis.conf
      - redis-7001-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - redis-cluster

  redis-7002:
    image: redis:7-alpine
    container_name: redis-7002
    ports:
      - "7002:7002"
      - "17002:17002"
    volumes:
      - ./config/redis-7002.conf:/usr/local/etc/redis/redis.conf
      - redis-7002-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - redis-cluster

  redis-7003:
    image: redis:7-alpine
    container_name: redis-7003
    ports:
      - "7003:7003"
      - "17003:17003"
    volumes:
      - ./config/redis-7003.conf:/usr/local/etc/redis/redis.conf
      - redis-7003-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - redis-cluster

  redis-7004:
    image: redis:7-alpine
    container_name: redis-7004
    ports:
      - "7004:7004"
      - "17004:17004"
    volumes:
      - ./config/redis-7004.conf:/usr/local/etc/redis/redis.conf
      - redis-7004-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - redis-cluster

  redis-7005:
    image: redis:7-alpine
    container_name: redis-7005
    ports:
      - "7005:7005"
      - "17005:17005"
    volumes:
      - ./config/redis-7005.conf:/usr/local/etc/redis/redis.conf
      - redis-7005-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - redis-cluster

  redis-7006:
    image: redis:7-alpine
    container_name: redis-7006
    ports:
      - "7006:7006"
      - "17006:17006"
    volumes:
      - ./config/redis-7006.conf:/usr/local/etc/redis/redis.conf
      - redis-7006-data:/data
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - redis-cluster

volumes:
  redis-7001-data:
  redis-7002-data:
  redis-7003-data:
  redis-7004-data:
  redis-7005-data:
  redis-7006-data:

networks:
  redis-cluster:
    driver: bridge
```

### 集群初始化
```bash
# 启动所有节点
docker-compose up -d

# 创建集群
redis-cli --cluster create \
  192.168.1.100:7001 \
  192.168.1.100:7002 \
  192.168.1.100:7003 \
  192.168.1.100:7004 \
  192.168.1.100:7005 \
  192.168.1.100:7006 \
  --cluster-replicas 1 \
  -a redis_password

# 验证集群状态
redis-cli -c -h 192.168.1.100 -p 7001 -a redis_password cluster nodes
redis-cli -c -h 192.168.1.100 -p 7001 -a redis_password cluster info
```

## 🔧 集群管理

### 集群信息查看
```bash
# 连接到集群（-c 参数启用集群模式）
redis-cli -c -h 192.168.1.100 -p 7001 -a redis_password

# 查看集群信息
CLUSTER INFO

# 查看集群节点
CLUSTER NODES

# 查看槽位分配
CLUSTER SLOTS

# 查看特定节点信息
CLUSTER NODES | grep master
CLUSTER NODES | grep slave
```

### 槽位管理
```bash
# 查看键所在的槽位
CLUSTER KEYSLOT mykey

# 查看槽位对应的节点
CLUSTER SLOTS

# 手动分配槽位
CLUSTER ADDSLOTS 0 1 2 3 4 5

# 移动槽位
CLUSTER SETSLOT 100 MIGRATING target_node_id
CLUSTER SETSLOT 100 IMPORTING source_node_id
```

### 节点管理
```bash
# 添加新节点
redis-cli --cluster add-node new_node_ip:port existing_node_ip:port -a password

# 添加从节点
redis-cli --cluster add-node new_slave_ip:port existing_node_ip:port \
  --cluster-slave --cluster-master-id master_node_id -a password

# 删除节点
redis-cli --cluster del-node node_ip:port node_id -a password

# 重新分片
redis-cli --cluster reshard node_ip:port -a password
```

## 🔧 客户端使用

### Python 客户端
```python
import redis
from rediscluster import RedisCluster

class RedisClusterClient:
    def __init__(self, startup_nodes, password=None):
        self.client = RedisCluster(
            startup_nodes=startup_nodes,
            password=password,
            decode_responses=True,
            skip_full_coverage_check=True,
            health_check_interval=30
        )
    
    def set(self, key, value, ex=None):
        """设置键值"""
        return self.client.set(key, value, ex=ex)
    
    def get(self, key):
        """获取值"""
        return self.client.get(key)
    
    def mset(self, mapping):
        """批量设置（注意：键可能分布在不同节点）"""
        return self.client.mset(mapping)
    
    def mget(self, keys):
        """批量获取"""
        return self.client.mget(keys)
    
    def hash_tag_operation(self, user_id):
        """使用哈希标签确保相关数据在同一节点"""
        # 使用 {user_id} 作为哈希标签
        profile_key = f"user:{{{user_id}}}:profile"
        settings_key = f"user:{{{user_id}}}:settings"
        
        # 这些键会被分配到同一个槽位
        self.client.hset(profile_key, "name", "张三")
        self.client.hset(settings_key, "theme", "dark")
        
        return {
            "profile": self.client.hgetall(profile_key),
            "settings": self.client.hgetall(settings_key)
        }
    
    def get_cluster_info(self):
        """获取集群信息"""
        return {
            "nodes": len(self.client.get_nodes()),
            "cluster_info": self.client.cluster_info()
        }

# 使用示例
startup_nodes = [
    {"host": "192.168.1.100", "port": "7001"},
    {"host": "192.168.1.100", "port": "7002"},
    {"host": "192.168.1.100", "port": "7003"}
]

cluster_client = RedisClusterClient(startup_nodes, "redis_password")

# 基本操作
cluster_client.set("user:1001", "张三")
user = cluster_client.get("user:1001")

# 哈希标签操作
user_data = cluster_client.hash_tag_operation(1001)
print(user_data)
```

### Java 客户端
```java
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisCluster;
import java.util.HashSet;
import java.util.Set;

public class RedisClusterClient {
    private JedisCluster jedisCluster;
    
    public RedisClusterClient() {
        Set<HostAndPort> nodes = new HashSet<>();
        nodes.add(new HostAndPort("192.168.1.100", 7001));
        nodes.add(new HostAndPort("192.168.1.100", 7002));
        nodes.add(new HostAndPort("192.168.1.100", 7003));
        
        this.jedisCluster = new JedisCluster(nodes, 2000, 2000, 5, "redis_password", null);
    }
    
    public void set(String key, String value) {
        jedisCluster.set(key, value);
    }
    
    public String get(String key) {
        return jedisCluster.get(key);
    }
    
    public void hashTagExample(String userId) {
        // 使用哈希标签
        String profileKey = "user:{" + userId + "}:profile";
        String settingsKey = "user:{" + userId + "}:settings";
        
        jedisCluster.hset(profileKey, "name", "张三");
        jedisCluster.hset(settingsKey, "theme", "dark");
    }
    
    public void close() {
        if (jedisCluster != null) {
            jedisCluster.close();
        }
    }
}
```

## 📊 监控和维护

### 集群状态监控
```bash
#!/bin/bash
# cluster_monitor.sh

NODES=("192.168.1.100:7001" "192.168.1.100:7002" "192.168.1.100:7003")
PASSWORD="redis_password"

echo "=== Redis 集群监控报告 ==="
echo "时间: $(date)"
echo

for node in "${NODES[@]}"; do
    IFS=':' read -r host port <<< "$node"
    echo "节点: $host:$port"
    
    if redis-cli -h $host -p $port -a $PASSWORD ping > /dev/null 2>&1; then
        echo "  状态: 在线"
        
        # 获取节点角色
        role=$(redis-cli -h $host -p $port -a $PASSWORD INFO replication | grep "role:" | cut -d: -f2 | tr -d '\r')
        echo "  角色: $role"
        
        # 获取槽位信息
        if [ "$role" = "master" ]; then
            slots=$(redis-cli -h $host -p $port -a $PASSWORD CLUSTER NODES | grep "myself" | awk '{print $9}')
            echo "  槽位: $slots"
        fi
        
        # 获取内存使用
        memory=$(redis-cli -h $host -p $port -a $PASSWORD INFO memory | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r')
        echo "  内存使用: $memory"
    else
        echo "  状态: 离线"
    fi
    echo
done

# 集群整体状态
echo "=== 集群整体状态 ==="
redis-cli -c -h ${NODES[0]%:*} -p ${NODES[0]#*:} -a $PASSWORD CLUSTER INFO
```

### 性能监控
```python
def monitor_cluster_performance():
    """监控集群性能"""
    cluster_client = RedisClusterClient(startup_nodes, "redis_password")
    
    # 获取所有节点信息
    nodes = cluster_client.client.get_nodes()
    
    performance_data = {}
    
    for node in nodes:
        node_info = {
            "host": node.host,
            "port": node.port,
            "role": "master" if node.server_type == "master" else "slave"
        }
        
        # 获取节点统计信息
        try:
            info = node.redis_connection.info()
            node_info.update({
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory_human", "0B"),
                "ops_per_sec": info.get("instantaneous_ops_per_sec", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0)
            })
        except Exception as e:
            node_info["error"] = str(e)
        
        performance_data[f"{node.host}:{node.port}"] = node_info
    
    return performance_data
```

## ⚠️ 故障处理

### 常见故障场景

#### 1. 主节点故障
```bash
# 模拟主节点故障
docker stop redis-7001

# 观察故障转移
redis-cli -c -h 192.168.1.100 -p 7002 -a redis_password CLUSTER NODES

# 验证数据访问
redis-cli -c -h 192.168.1.100 -p 7002 -a redis_password GET test_key
```

#### 2. 网络分区
```bash
# 检查集群状态
redis-cli -c -h 192.168.1.100 -p 7001 -a redis_password CLUSTER INFO

# 查看故障节点
redis-cli -c -h 192.168.1.100 -p 7001 -a redis_password CLUSTER NODES | grep fail
```

#### 3. 槽位迁移失败
```bash
# 检查槽位状态
redis-cli -c -h 192.168.1.100 -p 7001 -a redis_password CLUSTER SLOTS

# 修复槽位分配
redis-cli --cluster fix 192.168.1.100:7001 -a redis_password
```

## 🛡️ 最佳实践

### 1. 集群规划
- **节点数量**：至少3个主节点，推荐奇数个
- **副本配置**：每个主节点至少1个从节点
- **硬件分布**：节点分布在不同的物理机器上
- **网络规划**：确保节点间网络稳定

### 2. 数据设计
```bash
# 使用哈希标签确保相关数据在同一节点
user:{1001}:profile
user:{1001}:settings
user:{1001}:preferences

# 避免热点键
# 不好：所有用户的计数器使用同一个键
# 好：按用户ID分片计数器
counter:user:1001
counter:user:1002
```

### 3. 运维管理
- 定期备份集群配置
- 监控集群健康状态
- 测试故障转移流程
- 制定扩容缩容计划

### 4. 性能优化
- 合理设置超时参数
- 监控槽位分布均匀性
- 优化客户端连接池
- 定期清理过期数据

---

*Redis 集群模式提供了强大的分布式能力，通过合理的规划和配置，可以构建高性能、高可用的大规模 Redis 服务！*
