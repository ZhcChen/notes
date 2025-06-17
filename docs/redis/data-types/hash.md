# Redis 哈希（Hash）

哈希是 Redis 中用于存储键值对集合的数据结构，非常适合存储对象信息，如用户资料、商品信息等。

## 🎯 基本概念

### 什么是 Redis 哈希？
- 哈希是一个键值对的集合，类似于编程语言中的字典或映射
- 每个哈希可以存储多达 2^32 - 1 个字段值对（超过40亿个）
- 字段名和值都是字符串类型
- 非常适合存储对象数据

### 内部编码
Redis 会根据哈希的大小自动选择编码方式：
- **ziplist**：当字段数量较少且值较小时使用，内存效率高
- **hashtable**：当字段数量较多或值较大时使用，查询效率高

## 📝 基本操作

### 设置和获取
```bash
# 设置单个字段
HSET key field value
HSET user:1001 name "张三"
HSET user:1001 age 25
HSET user:1001 city "北京"

# 获取单个字段值
HGET key field
HGET user:1001 name
# 返回："张三"

# 批量设置字段
HMSET key field1 value1 field2 value2 field3 value3
HMSET user:1002 name "李四" age 30 city "上海" email "lisi@example.com"

# 批量获取字段值
HMGET key field1 field2 field3
HMGET user:1001 name age city
# 返回：["张三", "25", "北京"]

# 获取所有字段和值
HGETALL key
HGETALL user:1001
# 返回：["name", "张三", "age", "25", "city", "北京"]
```

### 字段管理
```bash
# 获取所有字段名
HKEYS key
HKEYS user:1001
# 返回：["name", "age", "city"]

# 获取所有值
HVALS key
HVALS user:1001
# 返回：["张三", "25", "北京"]

# 获取字段数量
HLEN key
HLEN user:1001
# 返回：3

# 检查字段是否存在
HEXISTS key field
HEXISTS user:1001 email
# 返回：0（不存在）

# 删除字段
HDEL key field1 field2 field3
HDEL user:1001 city
# 返回：1（删除的字段数量）
```

### 条件操作
```bash
# 仅在字段不存在时设置
HSETNX key field value
HSETNX user:1001 email "zhangsan@example.com"
# 返回：1（设置成功）或 0（字段已存在）

# 示例：初始化用户默认设置
HSETNX user:1001:settings theme "light"
HSETNX user:1001:settings language "zh-CN"
HSETNX user:1001:settings notifications "enabled"
```

## 🔢 数值操作

### 整数字段操作
```bash
# 设置数值字段
HSET user:1001 login_count 0
HSET user:1001 score 100

# 字段值自增
HINCRBY key field increment
HINCRBY user:1001 login_count 1
# 返回：1

HINCRBY user:1001 score 50
# 返回：150

# 示例：统计用户行为
HINCRBY user:1001:stats page_views 1
HINCRBY user:1001:stats button_clicks 1
HINCRBY user:1001:stats time_spent 30
```

### 浮点数字段操作
```bash
# 设置浮点数字段
HSET user:1001 balance 100.50
HSET user:1001 rating 4.5

# 浮点数字段自增
HINCRBYFLOAT key field increment
HINCRBYFLOAT user:1001 balance 25.75
# 返回：126.25

HINCRBYFLOAT user:1001 rating 0.3
# 返回：4.8

# 示例：用户账户操作
HINCRBYFLOAT user:1001:account balance 100.00    # 充值
HINCRBYFLOAT user:1001:account balance -29.99    # 消费
```

## 🎯 应用场景

### 1. 用户信息存储
```bash
# 存储用户基本信息
HMSET user:1001:profile \
  name "张三" \
  email "zhangsan@example.com" \
  phone "13800138000" \
  age 25 \
  city "北京" \
  created_at "2024-01-01T10:00:00Z"

# 存储用户设置
HMSET user:1001:settings \
  theme "dark" \
  language "zh-CN" \
  timezone "Asia/Shanghai" \
  notifications "enabled" \
  privacy_level "public"

# 存储用户统计
HMSET user:1001:stats \
  login_count 156 \
  last_login "2024-01-15T09:30:00Z" \
  total_posts 23 \
  followers 89 \
  following 156
```

### 2. 商品信息管理
```bash
# 商品基本信息
HMSET product:12345 \
  name "iPhone 15 Pro" \
  brand "Apple" \
  category "smartphone" \
  price 7999.00 \
  stock 50 \
  description "最新款iPhone" \
  created_at "2024-01-01T00:00:00Z"

# 商品统计信息
HMSET product:12345:stats \
  views 1250 \
  purchases 23 \
  rating 4.8 \
  reviews_count 156 \
  wishlist_count 89
```

### 3. 会话管理
```bash
# 用户会话信息
HMSET session:abc123def456 \
  user_id 1001 \
  username "zhangsan" \
  login_time "2024-01-15T09:00:00Z" \
  last_activity "2024-01-15T10:30:00Z" \
  ip_address "192.168.1.100" \
  user_agent "Mozilla/5.0..."

# 设置会话过期时间
EXPIRE session:abc123def456 7200  # 2小时后过期
```

### 4. 配置管理
```bash
# 应用配置
HMSET config:app \
  max_connections 1000 \
  timeout 30 \
  debug_mode false \
  log_level "info" \
  cache_ttl 3600

# 功能开关
HMSET config:features \
  new_ui enabled \
  beta_search disabled \
  payment_v2 enabled \
  analytics enabled
```

### 5. 缓存对象数据
```bash
# 缓存数据库查询结果
HMSET cache:user:1001 \
  name "张三" \
  email "zhangsan@example.com" \
  department "技术部" \
  position "高级工程师" \
  salary 15000

# 设置缓存过期时间
EXPIRE cache:user:1001 3600  # 1小时后过期
```

## 📊 性能特性

### 内存使用
```bash
# 查看哈希的内存使用
MEMORY USAGE user:1001
# 返回：字节数

# 查看编码方式
OBJECT ENCODING user:1001
# 可能返回：ziplist 或 hashtable

# 内存优化配置
# redis.conf 中的相关配置：
# hash-max-ziplist-entries 512    # ziplist 最大字段数
# hash-max-ziplist-value 64       # ziplist 最大值长度
```

### 性能基准
```bash
# 哈希操作性能（参考值）
# HSET: ~85,000 ops/sec
# HGET: ~85,000 ops/sec
# HMSET: ~60,000 ops/sec
# HMGET: ~55,000 ops/sec
# HGETALL: ~45,000 ops/sec
```

## 🛡️ 最佳实践

### 1. 合理的字段设计
```bash
# 好的设计：按功能分组
HMSET user:1001:basic name "张三" age 25 city "北京"
HMSET user:1001:contact email "zhangsan@example.com" phone "13800138000"
HMSET user:1001:stats login_count 156 last_login "2024-01-15T09:30:00Z"

# 避免：所有信息放在一个哈希中
# HMSET user:1001 name "张三" age 25 ... (50个字段)
```

### 2. 字段命名规范
```bash
# 使用清晰的字段名
HMSET user:1001 \
  first_name "三" \
  last_name "张" \
  email_address "zhangsan@example.com" \
  phone_number "13800138000" \
  birth_date "1999-01-01"

# 避免缩写和模糊命名
# HMSET user:1001 fn "三" ln "张" em "zhangsan@example.com"
```

### 3. 适当的数据分片
```bash
# 当字段过多时，考虑分片
HMSET user:1001:profile name "张三" age 25
HMSET user:1001:settings theme "dark" language "zh-CN"
HMSET user:1001:stats login_count 156 posts_count 23

# 而不是把所有字段放在一个哈希中
```

### 4. 批量操作优化
```bash
# 使用 HMSET 批量设置
HMSET user:1001 name "张三" age 25 city "北京" email "zhangsan@example.com"

# 使用 HMGET 批量获取
HMGET user:1001 name age city email

# 避免多次单独操作
# HSET user:1001 name "张三"
# HSET user:1001 age 25
# HSET user:1001 city "北京"
```

## 🔍 监控和调试

### 查看哈希信息
```bash
# 基本信息
TYPE user:1001          # 返回：hash
HLEN user:1001          # 字段数量
TTL user:1001           # 过期时间
MEMORY USAGE user:1001  # 内存使用

# 编码信息
OBJECT ENCODING user:1001    # 编码方式
OBJECT IDLETIME user:1001    # 空闲时间
```

### 调试命令
```bash
# 查看所有字段和值
HGETALL user:1001

# 检查特定字段
HEXISTS user:1001 email
HGET user:1001 name

# 扫描字段（Redis 2.8+）
HSCAN user:1001 0 MATCH "*name*" COUNT 10
```

---

*哈希是存储结构化数据的理想选择，合理使用可以大大提高开发效率！*
