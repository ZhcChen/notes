# Redis 列表（List）

列表是 Redis 中的有序字符串集合，支持在两端进行高效的插入和删除操作，是实现队列、栈等数据结构的理想选择。

## 🎯 基本概念

### 什么是 Redis 列表？
- 列表是有序的字符串集合，按插入顺序排列
- 支持在头部和尾部进行 O(1) 时间复杂度的插入和删除
- 可以存储多达 2^32 - 1 个元素（超过40亿个）
- 允许重复元素
- 支持按索引访问和范围操作

### 内部编码
Redis 会根据列表的大小和元素特征选择编码：
- **quicklist**：Redis 3.2+ 默认编码，结合了 ziplist 和 linkedlist 的优势
- **ziplist**：当元素较少且较小时使用（旧版本）
- **linkedlist**：当元素较多时使用（旧版本）

## 📝 基本操作

### 插入操作
```bash
# 从左侧（头部）插入
LPUSH key value1 value2 value3
LPUSH tasks "task3" "task2" "task1"
# 结果：["task1", "task2", "task3"]

# 从右侧（尾部）插入
RPUSH key value1 value2 value3
RPUSH logs "log1" "log2" "log3"
# 结果：["log1", "log2", "log3"]

# 在指定元素前/后插入
LINSERT key BEFORE|AFTER pivot value
LINSERT tasks BEFORE "task2" "urgent_task"
LINSERT tasks AFTER "task3" "follow_up"

# 仅在列表存在时插入
LPUSHX key value
RPUSHX key value
```

### 删除操作
```bash
# 从左侧（头部）弹出
LPOP key
LPOP tasks
# 返回并删除第一个元素

# 从右侧（尾部）弹出
RPOP key
RPOP logs
# 返回并删除最后一个元素

# 删除指定值的元素
LREM key count value
LREM tasks 1 "task1"     # 从头部删除1个"task1"
LREM tasks -2 "task2"    # 从尾部删除2个"task2"
LREM tasks 0 "task3"     # 删除所有"task3"

# 保留指定范围的元素
LTRIM key start stop
LTRIM logs 0 99          # 只保留前100个元素
LTRIM recent_items -10 -1 # 只保留最后10个元素
```

### 查询操作
```bash
# 获取列表长度
LLEN key
LLEN tasks
# 返回：元素数量

# 获取指定索引的元素
LINDEX key index
LINDEX tasks 0           # 获取第一个元素
LINDEX tasks -1          # 获取最后一个元素
LINDEX tasks 2           # 获取第三个元素

# 获取指定范围的元素
LRANGE key start stop
LRANGE tasks 0 -1        # 获取所有元素
LRANGE tasks 0 2         # 获取前3个元素
LRANGE tasks -3 -1       # 获取最后3个元素
LRANGE logs 10 20        # 获取第11到21个元素

# 设置指定索引的元素
LSET key index value
LSET tasks 0 "updated_task"
```

## 🔄 阻塞操作

### 阻塞式弹出
```bash
# 阻塞式左弹出
BLPOP key1 key2 ... timeout
BLPOP task_queue 10      # 10秒内等待元素
BLPOP urgent_queue normal_queue 0  # 无限等待

# 阻塞式右弹出
BRPOP key1 key2 ... timeout
BRPOP log_queue 5        # 5秒内等待元素

# 阻塞式右弹出并左插入（原子操作）
BRPOPLPUSH source destination timeout
BRPOPLPUSH todo_queue doing_queue 30
```

### 非阻塞式移动
```bash
# 右弹出并左插入
RPOPLPUSH source destination
RPOPLPUSH pending_tasks processing_tasks
# 从 pending_tasks 右端取出元素，插入到 processing_tasks 左端
```

## 🎯 应用场景

### 1. 消息队列
```bash
# 生产者推送消息
LPUSH message_queue '{"type":"email","to":"user@example.com","subject":"Welcome"}'
LPUSH message_queue '{"type":"sms","to":"13800138000","content":"验证码：123456"}'

# 消费者获取消息
BRPOP message_queue 10
# 返回：["message_queue", "{\"type\":\"email\",\"to\":\"user@example.com\",\"subject\":\"Welcome\"}"]

# 可靠消息队列（使用 BRPOPLPUSH）
BRPOPLPUSH message_queue processing_queue 30
# 消息从待处理队列移到处理中队列
```

### 2. 任务队列
```bash
# 添加任务
LPUSH task_queue "process_image:12345"
LPUSH task_queue "send_email:user@example.com"
LPUSH task_queue "generate_report:2024-01"

# 工作进程获取任务
BRPOP task_queue 0
# 阻塞等待任务

# 优先级任务队列
LPUSH high_priority_queue "urgent_task"
LPUSH normal_priority_queue "normal_task"
BRPOP high_priority_queue normal_priority_queue 10
# 优先处理高优先级任务
```

### 3. 最近访问记录
```bash
# 记录用户最近访问的页面
LPUSH user:1001:recent_pages "/product/123"
LPUSH user:1001:recent_pages "/category/electronics"
LPUSH user:1001:recent_pages "/search?q=phone"

# 保持最近10条记录
LTRIM user:1001:recent_pages 0 9

# 获取最近访问记录
LRANGE user:1001:recent_pages 0 -1
```

### 4. 活动日志
```bash
# 记录用户活动
LPUSH user:1001:activity_log "login:2024-01-15T09:00:00Z"
LPUSH user:1001:activity_log "view_product:12345:2024-01-15T09:05:00Z"
LPUSH user:1001:activity_log "add_to_cart:12345:2024-01-15T09:10:00Z"

# 保持最近100条活动记录
LTRIM user:1001:activity_log 0 99

# 获取最近活动
LRANGE user:1001:activity_log 0 9
```

### 5. 评论系统
```bash
# 添加评论
LPUSH post:123:comments '{"user":"张三","content":"很好的文章","time":"2024-01-15T10:00:00Z"}'
LPUSH post:123:comments '{"user":"李四","content":"学到了很多","time":"2024-01-15T10:05:00Z"}'

# 获取最新评论
LRANGE post:123:comments 0 9

# 获取评论总数
LLEN post:123:comments
```

### 6. 实时通知
```bash
# 推送通知
LPUSH user:1001:notifications '{"type":"like","message":"张三点赞了您的文章","time":"2024-01-15T10:00:00Z"}'
LPUSH user:1001:notifications '{"type":"comment","message":"李四评论了您的文章","time":"2024-01-15T10:05:00Z"}'

# 获取未读通知
LRANGE user:1001:notifications 0 -1

# 标记已读（删除通知）
LTRIM user:1001:notifications 1 -1  # 删除第一条
```

## 📊 性能特性

### 时间复杂度
```bash
# O(1) 操作
LPUSH, RPUSH, LPOP, RPOP, LLEN

# O(N) 操作
LRANGE, LREM, LINSERT, LTRIM

# O(N) 其中 N 是索引值
LINDEX, LSET
```

### 内存使用
```bash
# 查看列表内存使用
MEMORY USAGE task_queue

# 查看编码方式
OBJECT ENCODING task_queue
# 返回：quicklist

# 相关配置（redis.conf）
# list-max-ziplist-size -2      # quicklist 节点大小
# list-compress-depth 0         # 压缩深度
```

### 性能基准
```bash
# 列表操作性能（参考值）
# LPUSH: ~110,000 ops/sec
# RPUSH: ~110,000 ops/sec
# LPOP: ~110,000 ops/sec
# RPOP: ~110,000 ops/sec
# LRANGE(100): ~35,000 ops/sec
```

## 🛡️ 最佳实践

### 1. 选择合适的操作端
```bash
# 队列：LPUSH + RPOP 或 RPUSH + LPOP
LPUSH queue "item1"
RPOP queue

# 栈：LPUSH + LPOP 或 RPUSH + RPOP
LPUSH stack "item1"
LPOP stack
```

### 2. 控制列表大小
```bash
# 限制列表长度，避免内存过度使用
LPUSH recent_items "new_item"
LTRIM recent_items 0 999  # 保持最多1000个元素

# 或者使用 Lua 脚本原子操作
EVAL "redis.call('LPUSH', KEYS[1], ARGV[1]); redis.call('LTRIM', KEYS[1], 0, 999)" 1 recent_items "new_item"
```

### 3. 批量操作优化
```bash
# 批量插入
LPUSH batch_queue "item1" "item2" "item3" "item4" "item5"

# 批量获取
LRANGE batch_queue 0 99

# 避免循环中的单个操作
# 不好：
# for item in items:
#     redis.lpush("queue", item)

# 好：
# redis.lpush("queue", *items)
```

### 4. 可靠消息处理
```bash
# 使用 BRPOPLPUSH 实现可靠队列
BRPOPLPUSH message_queue processing_queue 30

# 处理完成后从处理队列中删除
LREM processing_queue 1 "processed_message"

# 或者使用 Lua 脚本确保原子性
```

## 🔍 监控和调试

### 查看列表信息
```bash
# 基本信息
TYPE task_queue         # 返回：list
LLEN task_queue         # 元素数量
TTL task_queue          # 过期时间
MEMORY USAGE task_queue # 内存使用

# 编码信息
OBJECT ENCODING task_queue    # 编码方式
OBJECT IDLETIME task_queue    # 空闲时间
```

### 调试命令
```bash
# 查看列表内容
LRANGE task_queue 0 -1      # 所有元素
LRANGE task_queue 0 9       # 前10个元素

# 检查特定位置
LINDEX task_queue 0         # 第一个元素
LINDEX task_queue -1        # 最后一个元素

# 查找元素（需要遍历）
# Redis 没有直接的查找命令，需要使用 LRANGE 然后在客户端查找
```

### 性能监控
```bash
# 监控慢查询
SLOWLOG GET 10

# 查看命令统计
INFO commandstats | grep list

# 内存使用分析
INFO memory
```

---

*列表是实现队列、栈和时间序列数据的完美选择，掌握好列表操作是 Redis 应用的重要基础！*
