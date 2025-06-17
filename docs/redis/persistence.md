# Redis 持久化机制

Redis 提供了多种持久化机制来保证数据的持久性，即使在服务器重启后也能恢复数据。本文详细介绍 RDB、AOF 和混合持久化的原理、配置和最佳实践。

## 🎯 持久化概述

### 为什么需要持久化？
- **数据安全**：防止因服务器故障导致的数据丢失
- **快速恢复**：服务器重启后能快速恢复数据
- **备份需求**：定期备份数据用于灾难恢复
- **数据迁移**：在不同环境间迁移数据

### 持久化方式对比
| 特性 | RDB | AOF | 混合持久化 |
|------|-----|-----|-----------|
| 文件大小 | 小 | 大 | 中等 |
| 恢复速度 | 快 | 慢 | 中等 |
| 数据完整性 | 可能丢失 | 更完整 | 最佳 |
| 性能影响 | 小 | 中等 | 中等 |
| 适用场景 | 备份、迁移 | 数据安全要求高 | 生产环境推荐 |

## 📸 RDB 持久化

### RDB 工作原理
RDB（Redis Database）是 Redis 的默认持久化方式，通过创建数据快照来保存数据。

```bash
# RDB 持久化过程：
1. Redis 主进程 fork 出子进程
2. 子进程将内存中的数据写入临时 RDB 文件
3. 写入完成后，用临时文件替换旧的 RDB 文件
4. 子进程退出，主进程继续处理客户端请求
```

### RDB 配置
```bash
# redis.conf 配置
# 自动保存条件（时间 变化的键数量）
save 900 1      # 900秒内至少1个键变化
save 300 10     # 300秒内至少10个键变化
save 60 10000   # 60秒内至少10000个键变化

# 禁用自动保存
# save ""

# RDB 文件名
dbfilename dump.rdb

# RDB 文件存储目录
dir /var/lib/redis

# 保存失败时停止写入
stop-writes-on-bgsave-error yes

# 压缩 RDB 文件
rdbcompression yes

# RDB 文件校验
rdbchecksum yes
```

### 手动触发 RDB
```bash
# 阻塞式保存（会阻塞所有客户端）
SAVE

# 非阻塞式保存（推荐）
BGSAVE

# 查看最后保存时间
LASTSAVE

# 查看保存状态
INFO persistence
```

### RDB 优缺点

#### 优点
- **文件紧凑**：RDB 文件是压缩的二进制文件，体积小
- **恢复快速**：加载 RDB 文件比重放 AOF 日志快
- **性能影响小**：使用子进程保存，不影响主进程性能
- **适合备份**：单个文件便于备份和传输

#### 缺点
- **数据丢失风险**：两次保存之间的数据可能丢失
- **fork 开销**：大数据集时 fork 子进程可能耗时较长
- **不适合实时性要求高的场景**

## 📝 AOF 持久化

### AOF 工作原理
AOF（Append Only File）通过记录每个写操作来保证数据持久性。

```bash
# AOF 持久化过程：
1. 客户端发送写命令
2. Redis 执行写命令
3. 将命令追加到 AOF 缓冲区
4. 根据策略将缓冲区内容写入 AOF 文件
5. 定期重写 AOF 文件以减小文件大小
```

### AOF 配置
```bash
# redis.conf 配置
# 启用 AOF
appendonly yes

# AOF 文件名
appendfilename "appendonly.aof"

# 同步策略
appendfsync everysec    # 每秒同步（推荐）
# appendfsync always    # 每个写命令都同步（最安全但最慢）
# appendfsync no        # 由操作系统决定（最快但最不安全）

# AOF 重写配置
auto-aof-rewrite-percentage 100    # 文件大小增长100%时重写
auto-aof-rewrite-min-size 64mb     # 最小重写文件大小

# 重写期间的处理
no-appendfsync-on-rewrite no       # 重写时是否停止同步
```

### 手动触发 AOF 重写
```bash
# 手动重写 AOF 文件
BGREWRITEAOF

# 查看重写状态
INFO persistence
```

### AOF 同步策略详解

#### always（总是同步）
```bash
appendfsync always
# 优点：数据最安全，每个写命令都会立即同步到磁盘
# 缺点：性能最差，每次写操作都要等待磁盘 I/O
# 适用：对数据安全要求极高的场景
```

#### everysec（每秒同步）
```bash
appendfsync everysec
# 优点：性能和安全性的平衡，最多丢失1秒数据
# 缺点：仍可能丢失最后1秒的数据
# 适用：大多数生产环境（推荐）
```

#### no（不主动同步）
```bash
appendfsync no
# 优点：性能最好，由操作系统决定何时同步
# 缺点：可能丢失较多数据（通常几十秒）
# 适用：对性能要求极高，可以容忍数据丢失的场景
```

### AOF 重写机制
```bash
# AOF 重写的作用：
# 1. 减小 AOF 文件大小
# 2. 提高数据恢复速度
# 3. 清理冗余命令

# 重写前：
SET key1 value1
SET key1 value2
SET key1 value3
DEL key2
SET key2 newvalue

# 重写后：
SET key1 value3
SET key2 newvalue
```

### AOF 优缺点

#### 优点
- **数据安全**：根据同步策略，最多丢失1秒数据
- **文件可读**：AOF 文件是文本格式，可以直接查看和编辑
- **自动修复**：redis-check-aof 工具可以修复损坏的 AOF 文件
- **灵活的同步策略**：可以根据需求选择不同的同步频率

#### 缺点
- **文件较大**：AOF 文件通常比 RDB 文件大
- **恢复较慢**：重放命令比加载 RDB 文件慢
- **性能影响**：写操作需要额外的磁盘 I/O

## 🔄 混合持久化

### 混合持久化原理
Redis 4.0+ 引入了混合持久化，结合了 RDB 和 AOF 的优势。

```bash
# 混合持久化过程：
1. AOF 重写时，先将当前数据以 RDB 格式写入 AOF 文件
2. 然后将重写期间的增量命令以 AOF 格式追加
3. 恢复时先加载 RDB 部分，再重放 AOF 部分
```

### 混合持久化配置
```bash
# redis.conf 配置
# 启用混合持久化
aof-use-rdb-preamble yes

# 同时需要启用 AOF
appendonly yes
```

### 混合持久化优势
- **文件较小**：主体部分使用 RDB 格式，文件相对较小
- **恢复较快**：先快速加载 RDB 部分，再重放少量 AOF 命令
- **数据安全**：保持 AOF 的数据安全特性

## ⚙️ 持久化配置示例

### 开发环境配置
```bash
# 开发环境：性能优先，可以容忍少量数据丢失
save 900 1
save 300 10
save 60 10000

appendonly no
```

### 生产环境配置
```bash
# 生产环境：数据安全和性能平衡
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes

auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

### 高安全要求配置
```bash
# 高安全要求：数据安全优先
save 300 1
save 60 10
save 10 1000

appendonly yes
appendfsync always
aof-use-rdb-preamble yes
```

## 🛠️ 持久化管理

### 备份策略
```bash
# 定期备份 RDB 文件
#!/bin/bash
BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# 触发 RDB 保存
redis-cli BGSAVE

# 等待保存完成
while [ $(redis-cli LASTSAVE) -eq $LAST_SAVE ]; do
    sleep 1
done

# 复制 RDB 文件
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# 压缩备份文件
gzip $BACKUP_DIR/dump_$DATE.rdb

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "dump_*.rdb.gz" -mtime +7 -delete
```

### 数据恢复
```bash
# 从 RDB 文件恢复
1. 停止 Redis 服务
2. 将 RDB 文件复制到 Redis 数据目录
3. 确保文件名为 dump.rdb
4. 启动 Redis 服务

# 从 AOF 文件恢复
1. 停止 Redis 服务
2. 将 AOF 文件复制到 Redis 数据目录
3. 确保文件名为 appendonly.aof
4. 启动 Redis 服务
```

### 文件检查和修复
```bash
# 检查 RDB 文件
redis-check-rdb /path/to/dump.rdb

# 检查和修复 AOF 文件
redis-check-aof /path/to/appendonly.aof
redis-check-aof --fix /path/to/appendonly.aof
```

## 📊 性能监控

### 持久化状态监控
```bash
# 查看持久化信息
redis-cli INFO persistence

# 关键指标：
# rdb_last_save_time: 最后一次 RDB 保存时间
# rdb_last_bgsave_status: 最后一次后台保存状态
# aof_enabled: AOF 是否启用
# aof_last_rewrite_time_sec: 最后一次 AOF 重写耗时
# aof_current_size: 当前 AOF 文件大小
```

### 性能影响分析
```bash
# 监控 fork 时间
INFO stats | grep latest_fork_usec

# 监控磁盘 I/O
iostat -x 1

# 监控内存使用
INFO memory
```

## 🛡️ 最佳实践

### 1. 选择合适的持久化策略
```bash
# 根据业务需求选择：
# - 缓存场景：可以只使用 RDB 或关闭持久化
# - 数据库场景：推荐使用混合持久化
# - 高可用场景：结合主从复制和持久化
```

### 2. 优化配置参数
```bash
# 根据硬件和业务特点调整：
# - SSD 硬盘：可以使用 appendfsync always
# - 大内存服务器：适当增加 save 间隔
# - 高并发场景：使用 appendfsync everysec
```

### 3. 监控和告警
```bash
# 设置监控指标：
# - RDB 保存失败告警
# - AOF 重写失败告警
# - 磁盘空间不足告警
# - fork 时间过长告警
```

### 4. 定期维护
```bash
# 定期执行：
# - 备份文件清理
# - AOF 文件重写
# - 持久化文件检查
# - 性能指标分析
```

---

*合理配置持久化机制是保证 Redis 数据安全的重要基础，需要根据具体业务需求在性能和安全性之间找到平衡！*
