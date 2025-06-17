# Redis 字符串（String）

字符串是 Redis 最基本的数据类型，可以存储任何类型的数据，包括文本、数字、二进制数据等。

## 🎯 基本概念

### 什么是 Redis 字符串？
- Redis 字符串是二进制安全的，可以存储任何数据
- 最大长度为 512MB
- 可以存储文本、数字、JSON、图片等任何格式的数据
- 支持原子性的数值操作

### 内部编码
Redis 会根据存储的内容自动选择最优的编码方式：
- **int**：存储整数时使用
- **embstr**：存储短字符串时使用（≤44字节）
- **raw**：存储长字符串时使用（>44字节）

## 📝 基本操作

### 设置和获取
```bash
# 设置键值
SET key value
SET name "张三"
SET age 25
SET score 98.5

# 获取值
GET key
GET name
# 返回："张三"

# 检查键是否存在
EXISTS key
EXISTS name
# 返回：1（存在）或 0（不存在）

# 获取值的类型
TYPE key
TYPE name
# 返回：string

# 获取值的长度
STRLEN key
STRLEN name
# 返回：6（UTF-8编码下"张三"占6字节）
```

### 条件设置
```bash
# 仅在键不存在时设置
SETNX key value
SETNX user:1001 "张三"
# 返回：1（设置成功）或 0（键已存在）

# 仅在键存在时设置
SET key value XX
SET name "李四" XX

# 仅在键不存在时设置
SET key value NX
SET email "user@example.com" NX
```

### 批量操作
```bash
# 批量设置
MSET key1 value1 key2 value2 key3 value3
MSET user:1:name "张三" user:1:age 25 user:1:city "北京"

# 批量获取
MGET key1 key2 key3
MGET user:1:name user:1:age user:1:city
# 返回：["张三", "25", "北京"]

# 批量设置（仅在所有键都不存在时）
MSETNX key1 value1 key2 value2
MSETNX user:2:name "李四" user:2:age 30
```

## 🔢 数值操作

### 整数操作
```bash
# 设置数值
SET counter 10
SET views 0

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

# 示例：页面访问计数
INCR page:home:views
INCRBY page:about:views 5
```

### 浮点数操作
```bash
# 设置浮点数
SET price 99.99
SET temperature 25.5

# 浮点数增加
INCRBYFLOAT price 10.01
# 返回：110.00

INCRBYFLOAT temperature -2.5
# 返回：23.00

# 示例：用户余额操作
INCRBYFLOAT user:1001:balance 100.50
INCRBYFLOAT user:1001:balance -25.99
```

## ⏰ 过期时间

### 设置过期时间
```bash
# 设置键值并指定过期时间（秒）
SETEX key seconds value
SETEX session:abc123 3600 "user_session_data"

# 设置键值并指定过期时间（毫秒）
PSETEX key milliseconds value
PSETEX temp:code 300000 "verification_code"

# 为已存在的键设置过期时间
EXPIRE key seconds
EXPIRE user:token 1800

# 设置过期时间（毫秒）
PEXPIRE key milliseconds
PEXPIRE cache:data 5000

# 设置过期时间戳
EXPIREAT key timestamp
EXPIREAT user:session 1640995200
```

### 查看过期时间
```bash
# 查看剩余过期时间（秒）
TTL key
TTL session:abc123
# 返回：剩余秒数，-1表示永不过期，-2表示键不存在

# 查看剩余过期时间（毫秒）
PTTL key
PTTL temp:code

# 移除过期时间
PERSIST key
PERSIST user:token
```

## 🔧 高级操作

### 字符串操作
```bash
# 追加字符串
APPEND key value
SET message "Hello"
APPEND message " World"
GET message
# 返回："Hello World"

# 获取子字符串
GETRANGE key start end
SET text "Hello Redis"
GETRANGE text 0 4
# 返回："Hello"

GETRANGE text -5 -1
# 返回："Redis"

# 设置子字符串
SETRANGE key offset value
SETRANGE text 6 "World"
GET text
# 返回："Hello World"
```

### 位操作
```bash
# 设置位
SETBIT key offset value
SETBIT bitmap 0 1
SETBIT bitmap 2 1
SETBIT bitmap 4 1

# 获取位
GETBIT key offset
GETBIT bitmap 0
# 返回：1

# 统计位数
BITCOUNT key [start end]
BITCOUNT bitmap
# 返回：3

# 位运算
BITOP operation destkey key1 key2
BITOP AND result bitmap1 bitmap2
BITOP OR result bitmap1 bitmap2
BITOP XOR result bitmap1 bitmap2
BITOP NOT result bitmap1
```

### 原子操作
```bash
# 获取并设置
GETSET key value
SET counter 10
GETSET counter 20
# 返回：10（旧值）

# 获取并删除
# Redis 6.2+ 支持
GETDEL key
SET temp "temporary_data"
GETDEL temp
# 返回："temporary_data"，键被删除

# 获取并设置过期时间
# Redis 6.2+ 支持
GETEX key [EX seconds|PX milliseconds|EXAT timestamp|PXAT milliseconds-timestamp|PERSIST]
GETEX session:abc123 EX 3600
```

## 🎯 应用场景

### 1. 缓存
```bash
# 缓存用户信息
SET cache:user:1001 '{"id":1001,"name":"张三","email":"zhangsan@example.com"}' EX 3600

# 缓存计算结果
SET cache:calculation:md5hash "complex_result" EX 1800

# 缓存页面内容
SET cache:page:home "<html>...</html>" EX 600
```

### 2. 会话存储
```bash
# 存储用户会话
SET session:abc123def456 '{"user_id":1001,"login_time":"2024-01-01T10:00:00Z"}' EX 7200

# 存储购物车
SET cart:user:1001 '{"items":[{"id":1,"qty":2},{"id":2,"qty":1}]}' EX 86400
```

### 3. 计数器
```bash
# 页面访问计数
INCR page:views:home
INCR page:views:about

# 用户操作计数
INCR user:1001:login_count
INCR api:calls:today

# 限流计数
INCR rate_limit:user:1001:minute EX 60
```

### 4. 分布式锁
```bash
# 获取锁
SET lock:resource:123 "unique_identifier" NX EX 30
# 返回：OK（获取成功）或 nil（获取失败）

# 释放锁（使用 Lua 脚本保证原子性）
EVAL "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end" 1 lock:resource:123 unique_identifier
```

### 5. 配置存储
```bash
# 应用配置
SET config:app:max_connections "1000"
SET config:app:timeout "30"
SET config:app:debug_mode "false"

# 功能开关
SET feature:new_ui "enabled"
SET feature:beta_feature "disabled"
```

## 📊 性能特性

### 内存使用
```bash
# 查看键的内存使用
MEMORY USAGE key
MEMORY USAGE user:1001

# 不同类型的内存占用示例：
# 空字符串：~96 字节
# "hello"：~101 字节
# 整数 123：~96 字节
# 长字符串：基础开销 + 字符串长度
```

### 性能基准
```bash
# 字符串操作性能（参考值）
# SET: ~110,000 ops/sec
# GET: ~81,000 ops/sec
# INCR: ~110,000 ops/sec
# MSET: ~70,000 ops/sec
# MGET: ~60,000 ops/sec
```

## 🛡️ 最佳实践

### 1. 键命名规范
```bash
# 使用有意义的命名
SET user:1001:profile "user_data"
SET cache:product:123 "product_info"
SET session:abc123 "session_data"

# 避免过长的键名
# 不好：SET very_long_key_name_that_takes_too_much_memory "value"
# 好：SET user:1001:name "张三"
```

### 2. 合理使用过期时间
```bash
# 缓存数据设置合理的过期时间
SETEX cache:user:1001 3600 "user_data"    # 1小时
SETEX session:token 1800 "session_data"   # 30分钟
SETEX temp:code 300 "verification_code"   # 5分钟
```

### 3. 批量操作优化
```bash
# 使用批量操作减少网络往返
MSET user:1:name "张三" user:1:age "25" user:1:city "北京"
MGET user:1:name user:1:age user:1:city

# 避免在循环中执行单个操作
# 不好：
# for i in range(1000):
#     redis.set(f"key:{i}", f"value:{i}")

# 好：
# pipeline = redis.pipeline()
# for i in range(1000):
#     pipeline.set(f"key:{i}", f"value:{i}")
# pipeline.execute()
```

### 4. 数据类型选择
```bash
# 根据数据特点选择合适的操作
# 数值计算使用 INCR/INCRBY
INCR counter
INCRBY score 10

# 字符串拼接使用 APPEND
APPEND log "new_entry\n"

# 条件设置使用 SETNX
SETNX lock:resource "owner_id"
```

## 🔍 监控和调试

### 查看字符串信息
```bash
# 查看键的详细信息
TYPE key
STRLEN key
TTL key
MEMORY USAGE key

# 查看编码方式
OBJECT ENCODING key
# 可能返回：int, embstr, raw

# 查看空闲时间
OBJECT IDLETIME key
```

### 性能监控
```bash
# 监控慢查询
SLOWLOG GET 10

# 查看命令统计
INFO commandstats

# 内存使用分析
INFO memory
MEMORY STATS
```

---

*字符串是 Redis 的基础，掌握好字符串操作是使用 Redis 的第一步！*