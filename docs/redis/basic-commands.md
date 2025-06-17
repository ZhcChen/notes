# Redis 基础命令

本文档介绍 Redis 的基础命令和常用操作，帮助您快速上手 Redis。

## 🔗 连接和基础操作

### 连接 Redis
```bash
# 连接本地 Redis（默认端口 6379）
redis-cli

# 连接指定主机和端口
redis-cli -h 192.168.1.100 -p 6379

# 使用密码连接
redis-cli -h 127.0.0.1 -p 6379 -a your_password

# 连接后认证
redis-cli
127.0.0.1:6379> AUTH your_password

# 选择数据库（默认有 16 个数据库，编号 0-15）
127.0.0.1:6379> SELECT 1
```

### 基础信息命令
```bash
# 测试连接
PING
# 返回：PONG

# 查看服务器信息
INFO
INFO server
INFO memory
INFO stats

# 查看配置
CONFIG GET *
CONFIG GET maxmemory
CONFIG SET maxmemory 1gb

# 查看数据库大小
DBSIZE

# 查看最后保存时间
LASTSAVE
```

## 📝 字符串（String）操作

字符串是 Redis 最基本的数据类型，可以存储文本、数字、二进制数据。

### 基本操作
```bash
# 设置键值
SET key value
SET name "张三"
SET age 25

# 获取值
GET key
GET name
# 返回："张三"

# 检查键是否存在
EXISTS key
EXISTS name
# 返回：1（存在）或 0（不存在）

# 删除键
DEL key
DEL name age

# 获取值的长度
STRLEN key
STRLEN name
```

### 批量操作
```bash
# 批量设置
MSET key1 value1 key2 value2 key3 value3
MSET user:1:name "张三" user:1:age 25 user:1:city "北京"

# 批量获取
MGET key1 key2 key3
MGET user:1:name user:1:age user:1:city

# 仅在键不存在时设置
SETNX key value
SETNX user:2:name "李四"

# 批量设置（仅在所有键都不存在时）
MSETNX key1 value1 key2 value2
```

### 数值操作
```bash
# 设置数值
SET counter 10

# 自增 1
INCR counter
# 返回：11

# 自减 1
DECR counter
# 返回：10

# 增加指定值
INCRBY counter 5
# 返回：15

# 减少指定值
DECRBY counter 3
# 返回：12

# 浮点数增加
INCRBYFLOAT price 1.5
```

### 过期时间
```bash
# 设置键值并指定过期时间（秒）
SETEX key seconds value
SETEX session:abc123 3600 "user_data"

# 设置键值并指定过期时间（毫秒）
PSETEX key milliseconds value
PSETEX temp:data 5000 "temporary"

# 为已存在的键设置过期时间
EXPIRE key seconds
EXPIRE user:1:name 300

# 设置过期时间（毫秒）
PEXPIRE key milliseconds

# 设置过期时间戳
EXPIREAT key timestamp
EXPIREAT user:1:name 1640995200

# 查看剩余过期时间（秒）
TTL key
TTL user:1:name

# 查看剩余过期时间（毫秒）
PTTL key

# 移除过期时间
PERSIST key
```

## 📋 哈希（Hash）操作

哈希适合存储对象，如用户信息、配置等。

### 基本操作
```bash
# 设置哈希字段
HSET key field value
HSET user:1001 name "张三"
HSET user:1001 age 25
HSET user:1001 city "北京"

# 获取哈希字段值
HGET key field
HGET user:1001 name
# 返回："张三"

# 批量设置哈希字段
HMSET key field1 value1 field2 value2
HMSET user:1002 name "李四" age 30 city "上海"

# 批量获取哈希字段值
HMGET key field1 field2
HMGET user:1001 name age

# 获取所有字段和值
HGETALL key
HGETALL user:1001

# 获取所有字段名
HKEYS key
HKEYS user:1001

# 获取所有值
HVALS key
HVALS user:1001

# 获取字段数量
HLEN key
HLEN user:1001
```

### 高级操作
```bash
# 检查字段是否存在
HEXISTS key field
HEXISTS user:1001 email

# 删除字段
HDEL key field1 field2
HDEL user:1001 city

# 仅在字段不存在时设置
HSETNX key field value
HSETNX user:1001 email "zhangsan@example.com"

# 数值字段自增
HINCRBY key field increment
HINCRBY user:1001 age 1
HINCRBY user:1001 login_count 1

# 浮点数字段自增
HINCRBYFLOAT key field increment
HINCRBYFLOAT user:1001 balance 10.5
```

## 📜 列表（List）操作

列表是有序的字符串集合，支持在两端进行插入和删除操作。

### 基本操作
```bash
# 从左侧插入
LPUSH key value1 value2 value3
LPUSH tasks "task1" "task2" "task3"

# 从右侧插入
RPUSH key value1 value2 value3
RPUSH logs "log1" "log2"

# 从左侧弹出
LPOP key
LPOP tasks

# 从右侧弹出
RPOP key
RPOP logs

# 获取列表长度
LLEN key
LLEN tasks

# 获取指定范围的元素
LRANGE key start stop
LRANGE tasks 0 -1    # 获取所有元素
LRANGE tasks 0 2     # 获取前3个元素
LRANGE tasks -3 -1   # 获取最后3个元素
```

### 高级操作
```bash
# 获取指定索引的元素
LINDEX key index
LINDEX tasks 0    # 获取第一个元素
LINDEX tasks -1   # 获取最后一个元素

# 设置指定索引的元素
LSET key index value
LSET tasks 0 "new_task"

# 在指定元素前/后插入
LINSERT key BEFORE|AFTER pivot value
LINSERT tasks BEFORE "task2" "new_task"

# 删除指定值的元素
LREM key count value
LREM tasks 1 "task1"     # 删除1个"task1"
LREM tasks -2 "task2"    # 从尾部删除2个"task2"
LREM tasks 0 "task3"     # 删除所有"task3"

# 保留指定范围的元素
LTRIM key start stop
LTRIM tasks 0 99    # 只保留前100个元素

# 阻塞式弹出（用于消息队列）
BLPOP key1 key2 timeout
BLPOP tasks 10    # 10秒内等待元素

BRPOP key1 key2 timeout
BRPOP tasks 0     # 无限等待
```

## 🎯 集合（Set）操作

集合是无序的字符串集合，不允许重复元素。

### 基本操作
```bash
# 添加元素
SADD key member1 member2 member3
SADD tags "redis" "database" "cache"

# 获取所有元素
SMEMBERS key
SMEMBERS tags

# 检查元素是否存在
SISMEMBER key member
SISMEMBER tags "redis"

# 获取集合大小
SCARD key
SCARD tags

# 删除元素
SREM key member1 member2
SREM tags "cache"

# 随机获取元素
SRANDMEMBER key count
SRANDMEMBER tags 2

# 随机弹出元素
SPOP key count
SPOP tags 1
```

### 集合运算
```bash
# 创建测试集合
SADD set1 "a" "b" "c" "d"
SADD set2 "c" "d" "e" "f"

# 交集
SINTER set1 set2
# 返回：{"c", "d"}

# 并集
SUNION set1 set2
# 返回：{"a", "b", "c", "d", "e", "f"}

# 差集
SDIFF set1 set2
# 返回：{"a", "b"}

# 将交集结果存储到新集合
SINTERSTORE result set1 set2

# 将并集结果存储到新集合
SUNIONSTORE result set1 set2

# 将差集结果存储到新集合
SDIFFSTORE result set1 set2
```

## 🏆 有序集合（Sorted Set）操作

有序集合中的每个元素都关联一个分数，元素按分数排序。

### 基本操作
```bash
# 添加元素
ZADD key score1 member1 score2 member2
ZADD leaderboard 100 "player1" 200 "player2" 150 "player3"

# 获取指定范围的元素（按分数升序）
ZRANGE key start stop [WITHSCORES]
ZRANGE leaderboard 0 -1 WITHSCORES

# 获取指定范围的元素（按分数降序）
ZREVRANGE key start stop [WITHSCORES]
ZREVRANGE leaderboard 0 2 WITHSCORES

# 获取元素的分数
ZSCORE key member
ZSCORE leaderboard "player1"

# 获取元素的排名（升序，从0开始）
ZRANK key member
ZRANK leaderboard "player1"

# 获取元素的排名（降序，从0开始）
ZREVRANK key member
ZREVRANK leaderboard "player1"

# 获取集合大小
ZCARD key
ZCARD leaderboard

# 删除元素
ZREM key member1 member2
ZREM leaderboard "player1"
```

### 高级操作
```bash
# 增加元素的分数
ZINCRBY key increment member
ZINCRBY leaderboard 50 "player2"

# 按分数范围获取元素
ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
ZRANGEBYSCORE leaderboard 100 200 WITHSCORES
ZRANGEBYSCORE leaderboard (100 200    # 不包含100
ZRANGEBYSCORE leaderboard 100 +inf    # 100到正无穷

# 按分数范围获取元素数量
ZCOUNT key min max
ZCOUNT leaderboard 100 200

# 删除指定排名范围的元素
ZREMRANGEBYRANK key start stop
ZREMRANGEBYRANK leaderboard 0 2

# 删除指定分数范围的元素
ZREMRANGEBYSCORE key min max
ZREMRANGEBYSCORE leaderboard 0 100
```

## 🔧 通用命令

### 键管理
```bash
# 查找键（支持通配符）
KEYS pattern
KEYS user:*
KEYS *name*
KEYS user:???:name

# 扫描键（推荐用于生产环境）
SCAN cursor [MATCH pattern] [COUNT count]
SCAN 0 MATCH user:* COUNT 10

# 获取键的类型
TYPE key
TYPE user:1001

# 重命名键
RENAME key newkey
RENAME old_name new_name

# 仅在新键不存在时重命名
RENAMENX key newkey

# 移动键到其他数据库
MOVE key db
MOVE user:1001 1

# 随机获取一个键
RANDOMKEY
```

### 数据库操作
```bash
# 选择数据库
SELECT index
SELECT 1

# 清空当前数据库
FLUSHDB

# 清空所有数据库
FLUSHALL

# 获取当前数据库键的数量
DBSIZE

# 保存数据到磁盘
SAVE

# 后台保存数据到磁盘
BGSAVE
```

### 事务
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

# 监视键（用于乐观锁）
WATCH key1 key2
```

## 📊 监控和调试

### 性能监控
```bash
# 实时监控命令
MONITOR

# 查看慢查询日志
SLOWLOG GET 10
SLOWLOG LEN
SLOWLOG RESET

# 查看客户端连接
CLIENT LIST
CLIENT KILL ip:port

# 查看内存使用情况
MEMORY USAGE key
MEMORY STATS
```

### 调试命令
```bash
# 调试对象
DEBUG OBJECT key

# 获取键的内部编码
OBJECT ENCODING key

# 获取键的空闲时间
OBJECT IDLETIME key

# 获取键的引用计数
OBJECT REFCOUNT key
```

## 💡 最佳实践

### 1. 键命名规范
```bash
# 使用冒号分隔的层次结构
user:1001:profile
user:1001:settings
order:2023:001:details

# 使用有意义的前缀
cache:user:1001
session:abc123
counter:page:views
```

### 2. 避免大键
```bash
# 不好的做法
HSET big_hash field1 value1 field2 value2 ... field10000 value10000

# 好的做法
HSET user:1001:basic name "张三" age 25
HSET user:1001:contact email "zhangsan@example.com" phone "13800138000"
```

### 3. 合理使用过期时间
```bash
# 缓存数据设置过期时间
SETEX cache:user:1001 3600 "user_data"

# 会话数据设置过期时间
SETEX session:abc123 1800 "session_data"

# 临时数据设置过期时间
SETEX temp:verification:13800138000 300 "123456"
```

### 4. 批量操作
```bash
# 使用批量命令提高性能
MGET user:1001:name user:1002:name user:1003:name
MSET user:1001:status "online" user:1002:status "offline"

# 使用管道减少网络往返
redis-cli --pipe < commands.txt
```

---

*掌握这些基础命令，您就可以开始使用 Redis 了！*