# Redis 事务处理

Redis 事务提供了一种将多个命令打包执行的机制，虽然不支持传统数据库的完整 ACID 特性，但在特定场景下仍然非常有用。

## 🎯 事务概述

### 什么是 Redis 事务？
Redis 事务是一组命令的集合，这些命令会被顺序执行，在执行过程中不会被其他客户端的命令插入。

### Redis 事务特性
- **原子性**：事务中的命令要么全部执行，要么全部不执行
- **隔离性**：事务执行期间不会被其他命令干扰
- **一致性**：事务执行前后数据保持一致
- **不支持回滚**：命令执行失败不会回滚已执行的命令

### 事务 vs 传统数据库事务
| 特性 | Redis 事务 | 传统数据库事务 |
|------|-----------|---------------|
| 原子性 | 部分支持 | 完全支持 |
| 一致性 | 支持 | 支持 |
| 隔离性 | 支持 | 支持 |
| 持久性 | 依赖持久化配置 | 支持 |
| 回滚 | 不支持 | 支持 |

## 📝 基本事务操作

### 事务命令
```bash
# 开始事务
MULTI

# 添加命令到事务队列
SET key1 value1
SET key2 value2
INCR counter

# 执行事务
EXEC

# 取消事务
DISCARD
```

### 完整事务示例
```bash
# 转账操作示例
redis-cli
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379> DECRBY account:1001 100
QUEUED
127.0.0.1:6379> INCRBY account:1002 100
QUEUED
127.0.0.1:6379> EXEC
1) (integer) 900
2) (integer) 1100
```

### 取消事务示例
```bash
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379> SET key1 value1
QUEUED
127.0.0.1:6379> SET key2 value2
QUEUED
127.0.0.1:6379> DISCARD
OK
# 事务被取消，所有命令都不会执行
```

## 🔍 监视机制（WATCH）

### WATCH 命令作用
WATCH 命令用于监视一个或多个键，如果在事务执行前这些键被修改，事务将被取消。

### 基本用法
```bash
# 监视键
WATCH key1 key2

# 开始事务
MULTI
SET key1 new_value
INCR counter
EXEC

# 如果 key1 或 key2 在 WATCH 后被其他客户端修改，
# EXEC 将返回 nil，事务不会执行
```

### 乐观锁示例
```bash
# 实现乐观锁的库存扣减
WATCH product:123:stock

# 检查库存
stock = GET product:123:stock
if stock > 0:
    MULTI
    DECR product:123:stock
    INCR product:123:sold
    result = EXEC
    
    if result is None:
        # 事务失败，重试
        retry()
    else:
        # 事务成功
        success()
else:
    # 库存不足
    insufficient_stock()
```

### 取消监视
```bash
# 取消对所有键的监视
UNWATCH

# WATCH 命令会自动在以下情况取消：
# 1. EXEC 命令执行后
# 2. DISCARD 命令执行后
# 3. 客户端连接断开
```

## 🚫 事务错误处理

### 语法错误
```bash
# 语法错误会导致整个事务被拒绝
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379> SET key1 value1
QUEUED
127.0.0.1:6379> INVALID_COMMAND
(error) ERR unknown command 'INVALID_COMMAND'
127.0.0.1:6379> EXEC
(error) EXECABORT Transaction discarded because of previous errors.
# 整个事务被取消，包括正确的命令也不会执行
```

### 运行时错误
```bash
# 运行时错误不会影响其他命令的执行
127.0.0.1:6379> SET key1 "string_value"
OK
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379> SET key2 value2
QUEUED
127.0.0.1:6379> INCR key1  # 对字符串执行 INCR 会出错
QUEUED
127.0.0.1:6379> SET key3 value3
QUEUED
127.0.0.1:6379> EXEC
1) OK
2) (error) ERR value is not an integer or out of range
3) OK
# key2 和 key3 正常设置，只有 INCR key1 失败
```

## 🎯 应用场景

### 1. 原子性操作
```bash
# 用户注册：同时创建用户信息和初始化数据
MULTI
HSET user:1001 name "张三" email "zhangsan@example.com"
SET user:1001:created_at "2024-01-15T10:00:00Z"
SADD users:active 1001
INCR stats:total_users
EXEC
```

### 2. 计数器操作
```bash
# 文章点赞：同时增加点赞数和记录用户行为
MULTI
INCR article:123:likes
SADD article:123:liked_by 1001
HSET user:1001:activity last_like "article:123"
EXEC
```

### 3. 购物车操作
```bash
# 添加商品到购物车：更新购物车和库存
WATCH product:456:stock

stock = GET product:456:stock
if stock > 0:
    MULTI
    HSET cart:user:1001 product:456 2
    DECRBY product:456:stock 2
    INCR product:456:reserved
    EXEC
```

### 4. 排行榜更新
```bash
# 游戏分数更新：同时更新多个排行榜
MULTI
ZADD leaderboard:global 1500 "player:1001"
ZADD leaderboard:daily 1500 "player:1001"
HSET player:1001:stats last_score 1500
INCR player:1001:games_played
EXEC
```

### 5. 缓存一致性
```bash
# 更新数据时同时清理相关缓存
MULTI
HSET user:1001 name "新名字"
DEL cache:user:1001:profile
DEL cache:user:1001:summary
EXEC
```

## 🔧 Lua 脚本替代方案

### 为什么使用 Lua 脚本？
- **真正的原子性**：Lua 脚本在 Redis 中原子执行
- **更好的性能**：减少网络往返次数
- **更复杂的逻辑**：支持条件判断和循环
- **错误处理**：可以在脚本中处理错误

### Lua 脚本示例
```lua
-- 安全的库存扣减脚本
local stock_key = KEYS[1]
local quantity = tonumber(ARGV[1])

local current_stock = redis.call('GET', stock_key)
if not current_stock then
    return {err = "Product not found"}
end

current_stock = tonumber(current_stock)
if current_stock < quantity then
    return {err = "Insufficient stock"}
end

redis.call('DECRBY', stock_key, quantity)
return {ok = "Stock updated"}
```

```bash
# 执行 Lua 脚本
EVAL "local stock_key = KEYS[1]; local quantity = tonumber(ARGV[1]); local current_stock = redis.call('GET', stock_key); if not current_stock then return {err = 'Product not found'} end; current_stock = tonumber(current_stock); if current_stock < quantity then return {err = 'Insufficient stock'} end; redis.call('DECRBY', stock_key, quantity); return {ok = 'Stock updated'}" 1 product:123:stock 5
```

## 📊 性能考虑

### 事务性能特点
```bash
# 事务的性能影响：
# 1. 命令排队：MULTI 后的命令不会立即执行
# 2. 批量执行：EXEC 时批量执行所有命令
# 3. 网络优化：减少客户端与服务器的交互次数
# 4. 内存占用：事务队列会占用额外内存
```

### 性能优化建议
```bash
# 1. 避免长事务
# 不好：在事务中包含大量命令
MULTI
# ... 100 个命令
EXEC

# 好：将大事务拆分为多个小事务
MULTI
# ... 10 个相关命令
EXEC

# 2. 合理使用 WATCH
# 只监视真正需要的键
WATCH critical_key
# 不要监视过多的键

# 3. 考虑使用 Lua 脚本
# 对于复杂逻辑，Lua 脚本通常比事务更高效
```

## 🛡️ 最佳实践

### 1. 事务设计原则
```bash
# 保持事务简短
MULTI
SET key1 value1
INCR counter
EXEC

# 避免在事务中执行耗时操作
# 不要在事务中包含：
# - 复杂的计算
# - 大量的数据操作
# - 可能阻塞的命令
```

### 2. 错误处理策略
```python
# Python 示例：处理事务失败
import redis

r = redis.Redis()

def transfer_money(from_account, to_account, amount):
    with r.pipeline() as pipe:
        while True:
            try:
                # 监视账户余额
                pipe.watch(from_account)
                
                # 检查余额
                balance = pipe.get(from_account)
                if balance is None or int(balance) < amount:
                    pipe.unwatch()
                    return False, "Insufficient funds"
                
                # 执行转账
                pipe.multi()
                pipe.decrby(from_account, amount)
                pipe.incrby(to_account, amount)
                pipe.execute()
                
                return True, "Transfer successful"
                
            except redis.WatchError:
                # 重试
                continue
```

### 3. 监控和调试
```bash
# 监控事务执行情况
INFO commandstats | grep -E "(multi|exec|discard|watch)"

# 查看事务相关的慢查询
SLOWLOG GET 10

# 监控事务失败率
# 通过应用程序日志统计 EXEC 返回 nil 的次数
```

### 4. 替代方案选择
```bash
# 选择合适的解决方案：
# 1. 简单原子操作：使用事务
# 2. 复杂逻辑：使用 Lua 脚本
# 3. 跨多个 Redis 实例：考虑分布式事务方案
# 4. 强一致性要求：考虑使用传统数据库
```

## 🔍 调试和故障排除

### 常见问题
```bash
# 1. 事务被意外取消
# 检查是否有其他客户端修改了 WATCH 的键

# 2. 事务执行失败
# 检查命令语法是否正确
# 检查数据类型是否匹配

# 3. 性能问题
# 检查事务是否过长
# 检查是否有不必要的 WATCH
```

### 调试技巧
```bash
# 使用 MONITOR 命令观察事务执行
MONITOR

# 在另一个客户端执行事务，观察命令序列
# 检查 MULTI、QUEUED、EXEC 的执行顺序
```

---

*Redis 事务虽然功能有限，但在特定场景下仍然是保证操作原子性的有效工具。对于更复杂的需求，建议考虑使用 Lua 脚本！*
