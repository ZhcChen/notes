# Redis 有序集合（Sorted Set）

有序集合是 Redis 中的有序字符串集合，每个元素都关联一个分数，元素按分数排序，是实现排行榜、优先队列等功能的理想选择。

## 🎯 基本概念

### 什么是 Redis 有序集合？
- 有序集合中的每个元素都关联一个分数（score），元素按分数排序
- 元素是唯一的，但分数可以重复
- 支持 O(log N) 时间复杂度的插入、删除和查找
- 可以存储多达 2^32 - 1 个元素（超过40亿个）
- 支持按分数范围和排名范围查询
- 分数支持双精度浮点数

### 内部编码
Redis 会根据有序集合的大小选择编码：
- **ziplist**：当元素较少且较小时使用，内存效率高
- **skiplist**：当元素较多时使用，查询效率高

## 📝 基本操作

### 添加和删除
```bash
# 添加元素
ZADD key score1 member1 score2 member2
ZADD leaderboard 100 "player1" 200 "player2" 150 "player3"
# 返回：添加成功的元素数量

# 删除元素
ZREM key member1 member2
ZREM leaderboard "player1"
# 返回：删除成功的元素数量

# 获取集合大小
ZCARD key
ZCARD leaderboard
# 返回：元素数量

# 检查元素是否存在
# Redis 没有直接命令，可以使用 ZSCORE
ZSCORE leaderboard "player2"
# 返回：分数值或 nil（不存在）
```

### 分数操作
```bash
# 获取元素的分数
ZSCORE key member
ZSCORE leaderboard "player2"
# 返回：200

# 增加元素的分数
ZINCRBY key increment member
ZINCRBY leaderboard 50 "player2"
# 返回：250（新分数）

# 如果元素不存在，ZINCRBY 会创建它
ZINCRBY leaderboard 100 "new_player"
```

### 排名查询
```bash
# 获取元素的排名（升序，从0开始）
ZRANK key member
ZRANK leaderboard "player2"
# 返回：排名（0表示第一名）

# 获取元素的排名（降序，从0开始）
ZREVRANK key member
ZREVRANK leaderboard "player2"
# 返回：排名（0表示第一名）
```

## 🔍 范围查询

### 按排名范围查询
```bash
# 获取指定排名范围的元素（升序）
ZRANGE key start stop [WITHSCORES]
ZRANGE leaderboard 0 2 WITHSCORES
# 返回：前3名及其分数

# 获取指定排名范围的元素（降序）
ZREVRANGE key start stop [WITHSCORES]
ZREVRANGE leaderboard 0 2 WITHSCORES
# 返回：前3名及其分数（按分数降序）

# 获取所有元素
ZRANGE leaderboard 0 -1 WITHSCORES
ZREVRANGE leaderboard 0 -1 WITHSCORES
```

### 按分数范围查询
```bash
# 按分数范围获取元素（升序）
ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
ZRANGEBYSCORE leaderboard 100 200 WITHSCORES
ZRANGEBYSCORE leaderboard 100 200 LIMIT 0 10

# 按分数范围获取元素（降序）
ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
ZREVRANGEBYSCORE leaderboard 200 100 WITHSCORES

# 开区间查询
ZRANGEBYSCORE leaderboard (100 200    # 不包含100
ZRANGEBYSCORE leaderboard 100 (200    # 不包含200
ZRANGEBYSCORE leaderboard (100 (200   # 都不包含

# 无穷大查询
ZRANGEBYSCORE leaderboard 100 +inf    # 100到正无穷
ZRANGEBYSCORE leaderboard -inf 200    # 负无穷到200
```

### 计数查询
```bash
# 获取指定分数范围内的元素数量
ZCOUNT key min max
ZCOUNT leaderboard 100 200
# 返回：分数在100-200之间的元素数量

# 获取指定排名范围内的元素数量
# 使用 ZCARD 和范围计算
```

## 🗑️ 删除操作

### 按排名删除
```bash
# 删除指定排名范围的元素
ZREMRANGEBYRANK key start stop
ZREMRANGEBYRANK leaderboard 0 2    # 删除前3名
ZREMRANGEBYRANK leaderboard -3 -1  # 删除最后3名
```

### 按分数删除
```bash
# 删除指定分数范围的元素
ZREMRANGEBYSCORE key min max
ZREMRANGEBYSCORE leaderboard 0 100     # 删除分数0-100的元素
ZREMRANGEBYSCORE leaderboard (100 200  # 删除分数100-200的元素（不包含100）
```

## 🎯 应用场景

### 1. 排行榜系统
```bash
# 游戏排行榜
ZADD game:leaderboard 1500 "player1" 2000 "player2" 1800 "player3"

# 更新玩家分数
ZINCRBY game:leaderboard 100 "player1"

# 获取前10名
ZREVRANGE game:leaderboard 0 9 WITHSCORES

# 获取玩家排名
ZREVRANK game:leaderboard "player1"

# 获取玩家周围的排名
ZREVRANK game:leaderboard "player1"  # 获取排名
# 然后获取前后几名
ZREVRANGE game:leaderboard rank-2 rank+2 WITHSCORES
```

### 2. 热门内容排序
```bash
# 文章热度排行
ZADD articles:hot 156 "article:123" 89 "article:456" 234 "article:789"

# 用户点赞文章，增加热度
ZINCRBY articles:hot 1 "article:123"

# 获取热门文章
ZREVRANGE articles:hot 0 9

# 获取特定热度范围的文章
ZRANGEBYSCORE articles:hot 100 500 WITHSCORES
```

### 3. 时间线排序
```bash
# 微博时间线（按时间戳排序）
ZADD user:1001:timeline 1642291200 "post:123" 1642294800 "post:456"

# 添加新微博
ZADD user:1001:timeline 1642298400 "post:789"

# 获取最新微博
ZREVRANGE user:1001:timeline 0 9

# 获取特定时间范围的微博
ZRANGEBYSCORE user:1001:timeline 1642291200 1642298400
```

### 4. 优先队列
```bash
# 任务优先队列（分数越高优先级越高）
ZADD task:queue 1 "low_priority_task" 5 "normal_task" 10 "high_priority_task"

# 获取最高优先级任务
ZREVRANGE task:queue 0 0
# 或者
ZPOPMAX task:queue 1  # Redis 5.0+

# 添加紧急任务
ZADD task:queue 15 "urgent_task"
```

### 5. 延时队列
```bash
# 延时任务（使用时间戳作为分数）
ZADD delay:queue 1642298400 "task:send_email:123"
ZADD delay:queue 1642302000 "task:cleanup:456"

# 获取到期的任务
ZRANGEBYSCORE delay:queue -inf $(date +%s) LIMIT 0 10

# 处理完成后删除任务
ZREM delay:queue "task:send_email:123"
```

### 6. 地理位置排序
```bash
# 按距离排序（使用距离作为分数）
ZADD nearby:restaurants 0.5 "restaurant:123" 1.2 "restaurant:456" 0.8 "restaurant:789"

# 获取最近的餐厅
ZRANGE nearby:restaurants 0 4

# 获取指定距离范围内的餐厅
ZRANGEBYSCORE nearby:restaurants 0 2.0 WITHSCORES
```

### 7. 商品销量排行
```bash
# 商品销量排行
ZADD products:sales 156 "product:123" 89 "product:456" 234 "product:789"

# 商品售出，更新销量
ZINCRBY products:sales 1 "product:123"

# 获取销量前10的商品
ZREVRANGE products:sales 0 9 WITHSCORES

# 获取特定销量范围的商品
ZRANGEBYSCORE products:sales 100 500
```

## 📊 性能特性

### 时间复杂度
```bash
# O(log N) 操作
ZADD, ZREM, ZSCORE, ZRANK, ZREVRANK

# O(log N + M) 操作（M 是返回元素数量）
ZRANGE, ZREVRANGE, ZRANGEBYSCORE, ZREVRANGEBYSCORE

# O(log N) 操作
ZCOUNT, ZREMRANGEBYRANK, ZREMRANGEBYSCORE
```

### 内存使用
```bash
# 查看有序集合内存使用
MEMORY USAGE leaderboard

# 查看编码方式
OBJECT ENCODING leaderboard
# 可能返回：ziplist 或 skiplist

# 相关配置（redis.conf）
# zset-max-ziplist-entries 128    # ziplist 最大元素数
# zset-max-ziplist-value 64       # ziplist 最大值长度
```

### 性能基准
```bash
# 有序集合操作性能（参考值）
# ZADD: ~75,000 ops/sec
# ZREM: ~75,000 ops/sec
# ZSCORE: ~75,000 ops/sec
# ZRANGE(100): ~30,000 ops/sec
# ZRANGEBYSCORE(100): ~25,000 ops/sec
```

## 🛡️ 最佳实践

### 1. 合理设计分数
```bash
# 使用有意义的分数
ZADD user:scores 95.5 "user:1001"     # 考试分数
ZADD articles:timestamp 1642298400 "article:123"  # 时间戳
ZADD products:price 99.99 "product:456"  # 价格

# 避免分数冲突导致的排序问题
# 可以使用组合分数：主分数 * 1000000 + 次分数
```

### 2. 控制集合大小
```bash
# 定期清理过期数据
ZREMRANGEBYRANK leaderboard 1000 -1  # 只保留前1000名

# 按时间清理
ZREMRANGEBYSCORE timeline -inf $(date -d '30 days ago' +%s)
```

### 3. 批量操作优化
```bash
# 批量添加
ZADD leaderboard 100 "player1" 200 "player2" 150 "player3"

# 使用管道进行批量操作
# pipeline = redis.pipeline()
# for score, member in data:
#     pipeline.zadd("leaderboard", {member: score})
# pipeline.execute()
```

### 4. 分页查询
```bash
# 实现分页
page_size = 10
page = 2  # 第2页（从0开始）
start = page * page_size
stop = start + page_size - 1
ZREVRANGE leaderboard $start $stop WITHSCORES
```

## 🔍 监控和调试

### 查看有序集合信息
```bash
# 基本信息
TYPE leaderboard         # 返回：zset
ZCARD leaderboard        # 元素数量
TTL leaderboard          # 过期时间
MEMORY USAGE leaderboard # 内存使用

# 编码信息
OBJECT ENCODING leaderboard  # 编码方式
OBJECT IDLETIME leaderboard  # 空闲时间
```

### 调试命令
```bash
# 查看集合内容
ZRANGE leaderboard 0 -1 WITHSCORES    # 所有元素（升序）
ZREVRANGE leaderboard 0 -1 WITHSCORES # 所有元素（降序）

# 检查特定元素
ZSCORE leaderboard "player1"
ZRANK leaderboard "player1"
ZREVRANK leaderboard "player1"

# 分析分数分布
ZCOUNT leaderboard -inf +inf  # 总数
ZCOUNT leaderboard 0 100      # 0-100分的数量
ZCOUNT leaderboard 100 200    # 100-200分的数量
```

### Redis 5.0+ 新命令
```bash
# 弹出最高分数的元素
ZPOPMAX key [count]
ZPOPMAX leaderboard 1

# 弹出最低分数的元素
ZPOPMIN key [count]
ZPOPMIN leaderboard 1

# 阻塞式弹出
BZPOPMAX key [key ...] timeout
BZPOPMIN key [key ...] timeout
```

---

*有序集合是实现排行榜、优先队列和时间序列数据的完美选择，其强大的排序和范围查询能力使其在很多场景中不可替代！*
