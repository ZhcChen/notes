# Redis 集合（Set）

集合是 Redis 中的无序字符串集合，不允许重复元素，支持高效的成员检测和集合运算操作。

## 🎯 基本概念

### 什么是 Redis 集合？
- 集合是无序的字符串集合，不允许重复元素
- 支持 O(1) 时间复杂度的添加、删除和成员检测
- 可以存储多达 2^32 - 1 个元素（超过40亿个）
- 支持集合间的交集、并集、差集运算
- 适合存储标签、权限、关注关系等数据

### 内部编码
Redis 会根据集合的大小和元素特征选择编码：
- **intset**：当所有元素都是整数且数量较少时使用
- **hashtable**：当元素较多或包含非整数时使用

## 📝 基本操作

### 添加和删除
```bash
# 添加元素
SADD key member1 member2 member3
SADD tags "redis" "database" "cache" "nosql"
# 返回：添加成功的元素数量

# 删除元素
SREM key member1 member2
SREM tags "cache"
# 返回：删除成功的元素数量

# 检查元素是否存在
SISMEMBER key member
SISMEMBER tags "redis"
# 返回：1（存在）或 0（不存在）

# 获取集合大小
SCARD key
SCARD tags
# 返回：元素数量

# 获取所有元素
SMEMBERS key
SMEMBERS tags
# 返回：["redis", "database", "nosql"]
```

### 随机操作
```bash
# 随机获取元素（不删除）
SRANDMEMBER key [count]
SRANDMEMBER tags        # 随机获取1个元素
SRANDMEMBER tags 3      # 随机获取3个元素
SRANDMEMBER tags -3     # 随机获取3个元素（可能重复）

# 随机弹出元素（删除）
SPOP key [count]
SPOP tags               # 随机弹出1个元素
SPOP tags 2             # 随机弹出2个元素
```

### 移动操作
```bash
# 将元素从一个集合移动到另一个集合
SMOVE source destination member
SMOVE old_tags new_tags "redis"
# 返回：1（移动成功）或 0（元素不存在）
```

## 🔄 集合运算

### 交集运算
```bash
# 创建测试集合
SADD set1 "a" "b" "c" "d"
SADD set2 "c" "d" "e" "f"
SADD set3 "d" "e" "f" "g"

# 计算交集
SINTER set1 set2
# 返回：["c", "d"]

SINTER set1 set2 set3
# 返回：["d"]

# 将交集结果存储到新集合
SINTERSTORE result set1 set2
SCARD result
# 返回：2
```

### 并集运算
```bash
# 计算并集
SUNION set1 set2
# 返回：["a", "b", "c", "d", "e", "f"]

SUNION set1 set2 set3
# 返回：["a", "b", "c", "d", "e", "f", "g"]

# 将并集结果存储到新集合
SUNIONSTORE result set1 set2 set3
SCARD result
# 返回：7
```

### 差集运算
```bash
# 计算差集（在 set1 中但不在 set2 中）
SDIFF set1 set2
# 返回：["a", "b"]

# 多个集合的差集
SDIFF set1 set2 set3
# 返回：["a", "b"]

# 将差集结果存储到新集合
SDIFFSTORE result set1 set2
SCARD result
# 返回：2
```

## 🎯 应用场景

### 1. 标签系统
```bash
# 为文章添加标签
SADD article:123:tags "redis" "database" "tutorial" "nosql"
SADD article:456:tags "python" "programming" "tutorial"
SADD article:789:tags "redis" "performance" "optimization"

# 查找包含特定标签的文章
SISMEMBER article:123:tags "redis"  # 检查文章是否有redis标签

# 查找同时包含多个标签的文章（需要应用层逻辑）
# 或使用 SINTER 找到共同标签
SINTER article:123:tags article:789:tags
# 返回：["redis"]

# 获取文章的所有标签
SMEMBERS article:123:tags
```

### 2. 用户关注系统
```bash
# 用户关注
SADD user:1001:following 1002 1003 1004 1005
SADD user:1002:followers 1001 1006 1007

# 检查关注关系
SISMEMBER user:1001:following 1002  # 用户1001是否关注1002

# 获取关注数和粉丝数
SCARD user:1001:following  # 关注数
SCARD user:1002:followers  # 粉丝数

# 查找共同关注
SINTER user:1001:following user:1003:following

# 推荐关注（朋友的朋友）
SUNION user:1002:following user:1003:following
SDIFF user:1002:following user:1001:following  # 排除已关注的
```

### 3. 权限管理
```bash
# 用户权限
SADD user:1001:permissions "read_posts" "write_posts" "delete_own_posts"
SADD user:1002:permissions "read_posts" "write_posts" "delete_any_posts" "admin"

# 角色权限
SADD role:editor:permissions "read_posts" "write_posts" "edit_posts"
SADD role:admin:permissions "read_posts" "write_posts" "edit_posts" "delete_posts" "manage_users"

# 检查用户是否有特定权限
SISMEMBER user:1001:permissions "delete_any_posts"

# 获取用户所有权限
SMEMBERS user:1001:permissions

# 权限继承（用户权限 + 角色权限）
SUNION user:1001:permissions role:editor:permissions
```

### 4. 在线用户统计
```bash
# 记录在线用户
SADD online_users 1001 1002 1003 1004

# 用户上线
SADD online_users 1005

# 用户下线
SREM online_users 1002

# 获取在线用户数
SCARD online_users

# 检查用户是否在线
SISMEMBER online_users 1001

# 获取所有在线用户
SMEMBERS online_users
```

### 5. 去重和唯一性
```bash
# 记录访问过的用户（自动去重）
SADD page:home:visitors 1001 1002 1003 1001 1002
# 实际只存储：{1001, 1002, 1003}

# 获取独立访客数
SCARD page:home:visitors

# 记录用户的唯一行为
SADD user:1001:viewed_products 123 456 789 123
# 自动去重，避免重复统计
```

### 6. 抽奖系统
```bash
# 参与抽奖的用户
SADD lottery:2024:participants 1001 1002 1003 1004 1005 1006

# 随机抽取中奖者
SRANDMEMBER lottery:2024:participants 3  # 抽取3个中奖者（不删除）
SPOP lottery:2024:participants 1         # 抽取1个大奖得主（删除，避免重复中奖）

# 检查用户是否参与
SISMEMBER lottery:2024:participants 1001

# 获取参与人数
SCARD lottery:2024:participants
```

## 📊 性能特性

### 时间复杂度
```bash
# O(1) 操作
SADD, SREM, SISMEMBER, SCARD, SPOP, SRANDMEMBER

# O(N) 操作（N 是集合大小）
SMEMBERS, SINTER, SUNION, SDIFF

# O(N*M) 操作（N 是第一个集合大小，M 是集合数量）
SINTER, SUNION, SDIFF（多个集合）
```

### 内存使用
```bash
# 查看集合内存使用
MEMORY USAGE tags

# 查看编码方式
OBJECT ENCODING tags
# 可能返回：intset 或 hashtable

# 相关配置（redis.conf）
# set-max-intset-entries 512  # intset 最大元素数
```

### 性能基准
```bash
# 集合操作性能（参考值）
# SADD: ~85,000 ops/sec
# SREM: ~85,000 ops/sec
# SISMEMBER: ~85,000 ops/sec
# SCARD: ~85,000 ops/sec
# SMEMBERS: ~45,000 ops/sec
```

## 🛡️ 最佳实践

### 1. 合理使用集合运算
```bash
# 对于大集合，考虑使用 SINTERSTORE 等存储结果
SINTERSTORE temp_result large_set1 large_set2
SMEMBERS temp_result
DEL temp_result

# 避免频繁的大集合运算
```

### 2. 控制集合大小
```bash
# 监控集合大小，避免过大的集合
SCARD large_set

# 对于可能无限增长的集合，考虑定期清理
# 例如：定期清理过期的在线用户
```

### 3. 选择合适的数据结构
```bash
# 如果需要排序，考虑使用有序集合
# 如果需要存储额外信息，考虑使用哈希

# 集合适用于：
# - 标签系统
# - 权限管理
# - 去重统计
# - 关系管理
```

### 4. 批量操作优化
```bash
# 批量添加
SADD tags "tag1" "tag2" "tag3" "tag4" "tag5"

# 避免循环中的单个操作
# 不好：
# for tag in tags:
#     redis.sadd("article:tags", tag)

# 好：
# redis.sadd("article:tags", *tags)
```

## 🔍 监控和调试

### 查看集合信息
```bash
# 基本信息
TYPE tags              # 返回：set
SCARD tags             # 元素数量
TTL tags               # 过期时间
MEMORY USAGE tags      # 内存使用

# 编码信息
OBJECT ENCODING tags   # 编码方式
OBJECT IDLETIME tags   # 空闲时间
```

### 调试命令
```bash
# 查看集合内容
SMEMBERS tags          # 所有元素

# 随机采样
SRANDMEMBER tags 10    # 随机获取10个元素

# 检查特定元素
SISMEMBER tags "redis"
```

### 集合分析
```bash
# 分析集合关系
SINTER set1 set2       # 交集
SUNION set1 set2       # 并集
SDIFF set1 set2        # 差集

# 计算相似度（Jaccard 系数）
# |A ∩ B| / |A ∪ B|
# 需要在应用层计算
```

---

*集合是处理唯一性数据和集合运算的强大工具，在标签系统、权限管理等场景中发挥重要作用！*
