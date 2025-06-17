# Redis 实际应用场景与设计模式

Redis 因其高性能、多样化的数据结构和丰富的功能，在许多实际应用场景中发挥着关键作用。本节将介绍一些常见的 Redis 应用场景和相应的设计模式。

## 1. 缓存 (Caching)

**场景**: 减轻数据库负载，提高数据访问速度。
**设计模式**:
*   **Cache-Aside (旁路缓存)**: 应用程序首先查询缓存，如果未命中则从数据库读取，并将数据写入缓存。
*   **Read-Through (读穿)**: 应用程序只与缓存交互，缓存负责从底层数据源加载数据。
*   **Write-Through (写穿)**: 应用程序写入缓存，缓存负责将数据同步写入底层数据源。
*   **Write-Back (回写)**: 应用程序写入缓存，缓存异步地将数据写入底层数据源。
*   **过期策略**: 使用 Redis 的 `EXPIRE` 或 `TTL` 命令为缓存项设置过期时间。
*   **缓存淘汰策略**: 配置 `maxmemory-policy` (如 LRU, LFU) 来自动淘汰不常用的键。

**示例**: 存储热门商品信息

```python
# Python 示例 (Cache-Aside)
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

def get_product_from_db(product_id):
    # 模拟从数据库获取数据
    print(f"Fetching product {product_id} from DB...")
    return {"id": product_id, "name": f"Product {product_id}", "price": 99.99}

def get_product(product_id):
    cache_key = f"product:{product_id}"
    product_data = r.get(cache_key)

    if product_data:
        print("Cache hit!")
        return json.loads(product_data)
    else:
        print("Cache miss. Fetching from DB...")
        product = get_product_from_db(product_id)
        if product:
            r.setex(cache_key, 3600, json.dumps(product)) # 缓存1小时
        return product

# 第一次访问，从数据库获取并缓存
product_1 = get_product(1)
print(product_1)

# 第二次访问，从缓存获取
product_2 = get_product(1)
print(product_2)
```

## 2. 会话管理 (Session Management)

**场景**: 存储用户会话信息，实现分布式会话。
**设计模式**:
*   将用户会话数据（如用户 ID、登录状态、购物车内容）存储在 Redis 哈希中，并设置过期时间。
*   使用会话 ID 作为 Redis 键。

**示例**:

```
HSET session:user:123 user_id 123 username "Alice" login_time "..."
EXPIRE session:user:123 3600 # 会话过期时间1小时
```

## 3. 消息队列 (Message Queue)

**场景**: 实现异步任务处理、解耦服务。
**设计模式**:
*   **List 作为队列**: 使用 `LPUSH`/`RPUSH` 和 `RPOP`/`LPOP` (或 `BRPOP`/`BLPOP` 进行阻塞读取) 实现简单的队列。
*   **Streams 作为持久化队列**: 提供更强大的功能，如多消费者组、消息持久化、消息确认等。

**示例 (List 作为队列)**:

```
LPUSH task_queue "process_order:1001"
BRPOP task_queue 0 # 阻塞读取
```

## 4. 排行榜/计数器 (Leaderboards/Counters)

**场景**: 实时更新和查询排名、统计数据。
**设计模式**:
*   **有序集合 (Sorted Set)**: 存储用户分数和排名。
*   **字符串/哈希作为计数器**: 使用 `INCR`, `INCRBY`, `HINCRBY` 实现原子计数。

**示例 (排行榜)**:

```
ZADD game:scores 100 "player:Alice" 150 "player:Bob" 80 "player:Charlie"
ZREVRANGE game:scores 0 1 WITHSCORES # 获取前两名
# 输出:
# 1) "player:Bob"
# 2) "150"
# 3) "player:Alice"
# 4) "100"
```

## 5. 分布式锁 (Distributed Locks)

**场景**: 在分布式系统中协调对共享资源的访问。
**设计模式**:
*   **SETNX (SET if Not eXists)**: 使用 `SET key value NX EX seconds` 命令实现带过期时间的原子性加锁。
*   **Redlock 算法**: 更复杂的分布式锁算法，用于高可用和高可靠性场景。

**示例 (SETNX)**:

```
SET my_resource_lock "locked" NX EX 10 # 尝试获取锁，10秒后自动释放
# 如果返回 OK，表示获取成功
# 如果返回 nil，表示获取失败
```

## 6. 发布/订阅 (Pub/Sub)

**场景**: 实时消息通知、事件驱动架构。
**设计模式**:
*   发布者将消息发送到频道，订阅者接收频道上的消息。

**示例**:

```
# 订阅者
SUBSCRIBE news_channel

# 发布者
PUBLISH news_channel "Breaking News: Redis is awesome!"
```

## 7. 实时分析 (Real-time Analytics)

**场景**: 实时统计用户行为、流量数据等。
**设计模式**:
*   **HyperLogLog**: 统计独立访客。
*   **Bitmaps**: 统计用户活跃度、签到。
*   **Sorted Set**: 实时排行榜。
*   **Streams**: 实时事件流处理。

## 8. 社交网络 (Social Networking)

**场景**: 关注/粉丝关系、新鲜事、共同好友。
**设计模式**:
*   **集合 (Set)**: 存储关注列表、粉丝列表、共同好友。
*   **有序集合 (Sorted Set)**: 存储时间线（新鲜事）。

**示例 (关注/粉丝)**:

```
SADD user:1:following user:2 user:3 # 用户1关注用户2和用户3
SADD user:2:followers user:1
SISMEMBER user:1:following user:2 # 检查用户1是否关注用户2
# 输出: 1