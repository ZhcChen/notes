# Redis Lua 脚本

Redis 支持在服务端执行 Lua 脚本，提供了原子性操作、减少网络往返、实现复杂逻辑等强大功能。

## 🎯 Lua 脚本概述

### 什么是 Redis Lua 脚本？
Redis 内嵌了 Lua 解释器，允许在 Redis 服务器端执行 Lua 脚本。脚本在执行期间，Redis 服务器不会执行其他命令，保证了脚本的原子性。

### 核心优势
- **原子性**：脚本执行期间不会被其他命令中断
- **减少网络往返**：多个操作在服务端完成，减少网络延迟
- **复杂逻辑**：支持条件判断、循环等复杂逻辑
- **性能优化**：避免客户端与服务器间的多次交互
- **数据一致性**：确保多个操作的一致性

### 使用场景
- 原子性的复合操作
- 复杂的业务逻辑
- 性能敏感的操作
- 需要条件判断的操作
- 分布式锁实现

## 📝 基本语法

### 执行 Lua 脚本
```bash
# EVAL 命令执行脚本
EVAL script numkeys key1 key2 ... arg1 arg2 ...

# 参数说明：
# script: Lua 脚本代码
# numkeys: 键的数量
# key1, key2, ...: 键名列表
# arg1, arg2, ...: 参数列表
```

### 简单示例
```bash
# 设置键值并返回旧值
EVAL "local old = redis.call('GET', KEYS[1]); redis.call('SET', KEYS[1], ARGV[1]); return old" 1 mykey newvalue

# 原子性增加并获取值
EVAL "redis.call('INCR', KEYS[1]); return redis.call('GET', KEYS[1])" 1 counter

# 条件设置
EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('SET', KEYS[1], ARGV[2]) else return nil end" 1 mykey oldvalue newvalue
```

### 脚本缓存和 EVALSHA
```bash
# 加载脚本到缓存
SCRIPT LOAD "return redis.call('GET', KEYS[1])"
# 返回：SHA1 哈希值

# 使用 SHA1 执行脚本
EVALSHA sha1 numkeys key1 key2 ... arg1 arg2 ...

# 检查脚本是否存在
SCRIPT EXISTS sha1 sha2 ...

# 清空脚本缓存
SCRIPT FLUSH

# 杀死正在执行的脚本
SCRIPT KILL
```

## 🔧 Lua 脚本编程

### Redis API 调用
```lua
-- 调用 Redis 命令
redis.call('SET', 'key', 'value')
redis.pcall('SET', 'key', 'value')  -- 安全调用，不会抛出异常

-- 获取返回值
local value = redis.call('GET', 'key')
local result = redis.pcall('INCR', 'counter')

-- 处理错误
local result = redis.pcall('INCR', 'string_key')
if result.err then
    return {err = "操作失败: " .. result.err}
end
```

### 访问键和参数
```lua
-- 访问键（KEYS 数组，从1开始）
local key1 = KEYS[1]
local key2 = KEYS[2]

-- 访问参数（ARGV 数组，从1开始）
local arg1 = ARGV[1]
local arg2 = ARGV[2]

-- 获取数组长度
local key_count = #KEYS
local arg_count = #ARGV
```

### 数据类型转换
```lua
-- 字符串转数字
local num = tonumber(ARGV[1])

-- 数字转字符串
local str = tostring(123)

-- 类型检查
if type(value) == "string" then
    -- 处理字符串
elseif type(value) == "number" then
    -- 处理数字
end
```

### 控制结构
```lua
-- 条件判断
if condition then
    -- 执行代码
elseif other_condition then
    -- 执行其他代码
else
    -- 默认代码
end

-- 循环
for i = 1, 10 do
    redis.call('INCR', 'counter:' .. i)
end

-- 遍历数组
for i = 1, #KEYS do
    redis.call('DEL', KEYS[i])
end
```

## 🎯 实际应用示例

### 1. 分布式锁
```lua
-- 获取分布式锁
local lock_key = KEYS[1]
local identifier = ARGV[1]
local expire_time = ARGV[2]

-- 尝试获取锁
local result = redis.call('SET', lock_key, identifier, 'NX', 'EX', expire_time)
if result then
    return {ok = "锁获取成功"}
else
    return {err = "锁获取失败"}
end
```

```lua
-- 释放分布式锁
local lock_key = KEYS[1]
local identifier = ARGV[1]

-- 检查锁的所有者
local current_identifier = redis.call('GET', lock_key)
if current_identifier == identifier then
    redis.call('DEL', lock_key)
    return {ok = "锁释放成功"}
else
    return {err = "锁释放失败，不是锁的所有者"}
end
```

### 2. 限流算法
```lua
-- 滑动窗口限流
local key = KEYS[1]
local window_size = tonumber(ARGV[1])  -- 窗口大小（秒）
local limit = tonumber(ARGV[2])        -- 限制次数
local current_time = tonumber(ARGV[3]) -- 当前时间戳

-- 清理过期记录
redis.call('ZREMRANGEBYSCORE', key, 0, current_time - window_size)

-- 获取当前窗口内的请求数
local current_count = redis.call('ZCARD', key)

if current_count < limit then
    -- 允许请求，记录当前请求
    redis.call('ZADD', key, current_time, current_time)
    redis.call('EXPIRE', key, window_size)
    return {ok = "请求允许", remaining = limit - current_count - 1}
else
    -- 拒绝请求
    return {err = "请求过于频繁", remaining = 0}
end
```

### 3. 原子性库存扣减
```lua
-- 库存扣减脚本
local stock_key = KEYS[1]
local quantity = tonumber(ARGV[1])
local user_id = ARGV[2]

-- 检查库存
local current_stock = redis.call('GET', stock_key)
if not current_stock then
    return {err = "商品不存在"}
end

current_stock = tonumber(current_stock)
if current_stock < quantity then
    return {err = "库存不足", available = current_stock}
end

-- 扣减库存
redis.call('DECRBY', stock_key, quantity)

-- 记录购买记录
local purchase_key = 'purchases:' .. user_id
redis.call('LPUSH', purchase_key, stock_key .. ':' .. quantity)
redis.call('EXPIRE', purchase_key, 86400)  -- 24小时过期

return {ok = "购买成功", remaining = current_stock - quantity}
```

### 4. 计数器和统计
```lua
-- 多维度计数器
local base_key = KEYS[1]
local increment = tonumber(ARGV[1])
local dimensions = {}

-- 解析维度参数
for i = 2, #ARGV do
    table.insert(dimensions, ARGV[i])
end

local results = {}

-- 更新各个维度的计数器
for _, dimension in ipairs(dimensions) do
    local counter_key = base_key .. ':' .. dimension
    local new_value = redis.call('INCRBY', counter_key, increment)
    results[dimension] = new_value
    
    -- 设置过期时间（24小时）
    redis.call('EXPIRE', counter_key, 86400)
end

return results
```

### 5. 缓存更新策略
```lua
-- 缓存穿透保护
local cache_key = KEYS[1]
local lock_key = KEYS[2]
local data_source = ARGV[1]
local expire_time = tonumber(ARGV[2])

-- 检查缓存
local cached_value = redis.call('GET', cache_key)
if cached_value then
    return {ok = "缓存命中", data = cached_value}
end

-- 尝试获取锁
local lock_acquired = redis.call('SET', lock_key, '1', 'NX', 'EX', 10)
if not lock_acquired then
    -- 锁获取失败，返回空值或默认值
    return {err = "缓存未命中，正在加载"}
end

-- 模拟从数据源加载数据（实际应用中需要在应用层处理）
-- 这里只是设置一个标记，表示需要加载数据
redis.call('SET', cache_key, 'loading', 'EX', expire_time)
redis.call('DEL', lock_key)

return {ok = "开始加载数据"}
```

### 6. 排行榜操作
```lua
-- 更新排行榜并获取排名
local leaderboard_key = KEYS[1]
local user_id = ARGV[1]
local score = tonumber(ARGV[2])

-- 更新分数
redis.call('ZADD', leaderboard_key, score, user_id)

-- 获取排名（从1开始）
local rank = redis.call('ZREVRANK', leaderboard_key, user_id)
if rank then
    rank = rank + 1  -- Redis 排名从0开始，转换为从1开始
end

-- 获取总人数
local total = redis.call('ZCARD', leaderboard_key)

-- 获取前后几名
local context = {}
if rank then
    local start_rank = math.max(0, rank - 3)
    local end_rank = math.min(rank + 1, total - 1)
    context = redis.call('ZREVRANGE', leaderboard_key, start_rank, end_rank, 'WITHSCORES')
end

return {
    rank = rank,
    total = total,
    score = score,
    context = context
}
```

## 📊 性能优化

### 脚本缓存
```bash
# 预加载常用脚本
SCRIPT LOAD "return redis.call('GET', KEYS[1])"

# 使用 EVALSHA 执行缓存的脚本
EVALSHA sha1 1 mykey
```

### 批量操作
```lua
-- 批量删除键
local deleted = 0
for i = 1, #KEYS do
    if redis.call('DEL', KEYS[i]) == 1 then
        deleted = deleted + 1
    end
end
return deleted
```

### 避免长时间运行
```lua
-- 分批处理大量数据
local batch_size = 1000
local processed = 0

for i = 1, #KEYS, batch_size do
    local batch_end = math.min(i + batch_size - 1, #KEYS)
    for j = i, batch_end do
        redis.call('DEL', KEYS[j])
        processed = processed + 1
    end
    
    -- 可以在这里添加进度检查
    if processed % 10000 == 0 then
        -- 记录进度
        redis.call('SET', 'progress:delete', processed)
    end
end

return processed
```

## 🛡️ 最佳实践

### 1. 错误处理
```lua
-- 使用 pcall 进行安全调用
local result = redis.pcall('INCR', KEYS[1])
if result.err then
    return {err = "操作失败: " .. result.err}
end

-- 参数验证
if #KEYS < 1 then
    return {err = "至少需要一个键"}
end

if not ARGV[1] or ARGV[1] == "" then
    return {err = "参数不能为空"}
end
```

### 2. 脚本组织
```lua
-- 将复杂脚本分解为函数
local function validate_params()
    if #KEYS < 1 then
        return false, "至少需要一个键"
    end
    return true, nil
end

local function process_data()
    -- 处理逻辑
    return redis.call('GET', KEYS[1])
end

-- 主逻辑
local valid, err = validate_params()
if not valid then
    return {err = err}
end

local result = process_data()
return {ok = "成功", data = result}
```

### 3. 调试技巧
```lua
-- 使用日志记录调试信息
redis.call('LPUSH', 'debug:log', 'Script started at ' .. ARGV[1])

-- 返回调试信息
local debug_info = {
    keys_count = #KEYS,
    args_count = #ARGV,
    timestamp = ARGV[1]
}

return {
    result = "success",
    debug = debug_info
}
```

### 4. 版本管理
```bash
# 为脚本添加版本标识
local script_version = "1.0.0"
redis.call('SET', 'script:version:' .. KEYS[1], script_version)
```

## ⚠️ 注意事项

### 脚本限制
- 脚本执行时间不能过长，避免阻塞 Redis
- 不支持全局变量，只能使用局部变量
- 不能调用会阻塞的函数
- 脚本中的随机数生成需要特殊处理

### 安全考虑
- 验证输入参数，防止注入攻击
- 限制脚本的复杂度和执行时间
- 不要在脚本中包含敏感信息

### 调试方法
```bash
# 查看脚本执行统计
INFO commandstats | grep eval

# 监控脚本执行
MONITOR

# 检查脚本缓存
SCRIPT EXISTS sha1
```

---

*Lua 脚本是 Redis 的强大功能，能够实现复杂的原子性操作，但需要合理使用以避免性能问题！*
