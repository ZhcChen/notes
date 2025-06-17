# Redis 故障排除

在使用 Redis 过程中，可能会遇到各种问题。本节将提供一些常见的故障排除步骤和技巧。

## 1. 检查 Redis 服务状态

首先，确认 Redis 服务是否正在运行。

**Linux/macOS:**

```bash
sudo systemctl status redis # 对于 systemd 系统
sudo service redis status   # 对于 SysVinit 系统
redis-cli ping              # 检查 Redis 是否响应
```

如果 `redis-cli ping` 返回 `PONG`，则表示 Redis 服务正在运行并响应。

## 2. 检查 Redis 日志

Redis 日志是诊断问题最重要的信息来源。默认情况下，日志文件路径在 `redis.conf` 中配置。

```conf
logfile "/var/log/redis/redis-server.log"
```

查看日志文件以获取错误信息、警告或异常活动：

```bash
tail -f /var/log/redis/redis-server.log
```

## 3. 检查内存使用

内存是 Redis 最关键的资源。内存不足可能导致性能下降、数据丢失甚至服务崩溃。

使用 `INFO memory` 命令查看内存使用情况：

```
INFO memory
```

关注以下指标：
*   `used_memory`: Redis 占用的内存总量。
*   `used_memory_rss`: 操作系统报告的 Redis 进程占用的物理内存。
*   `mem_fragmentation_ratio`: 内存碎片率。如果远大于 1，表示存在严重的内存碎片。

**可能的问题:**
*   **OOM (Out Of Memory)**: Redis 进程被操作系统杀死。
*   **内存碎片**: 导致实际内存使用高于 `used_memory`。

**解决方案:**
*   增加服务器内存。
*   优化数据结构，减少内存占用。
*   配置 `maxmemory` 和 `maxmemory-policy`。
*   在内存碎片严重时重启 Redis (如果可以接受短暂的服务中断)。

## 4. 检查连接问题

客户端无法连接到 Redis，或者连接频繁断开。

**可能的问题:**
*   **防火墙**: 阻止了客户端到 Redis 端口的连接。
*   **`bind` 配置**: Redis 绑定了错误的 IP 地址或只绑定了 `127.0.0.1`。
*   **`maxclients` 限制**: 达到最大客户端连接数。
*   **网络问题**: 客户端和服务器之间的网络不稳定。

**解决方案:**
*   检查防火墙规则，确保 Redis 端口 (默认 6379) 可访问。
*   检查 `redis.conf` 中的 `bind` 配置。
*   使用 `INFO clients` 查看 `connected_clients` 和 `maxclients`。
*   使用 `netstat` 或 `ss` 命令检查端口监听情况。

## 5. 检查 CPU 使用率

Redis 进程的 CPU 使用率过高可能表明存在性能瓶颈。

**可能的问题:**
*   **高并发请求**: 大量客户端同时发送请求。
*   **复杂命令**: 执行了大量计算密集型命令（如 `SORT`, `LREM` 大列表）。
*   **持久化操作**: RDB 快照或 AOF 重写正在进行。
*   **Lua 脚本**: 运行了耗时的 Lua 脚本。

**解决方案:**
*   优化应用程序代码，减少不必要的 Redis 操作。
*   避免在生产环境中使用 `KEYS` 等 O(N) 命令。
*   考虑读写分离，使用 Redis 集群或主从复制分担负载。
*   调整持久化策略。

## 6. 检查持久化问题

RDB 文件未生成，或 AOF 文件过大/重写失败。

**可能的问题:**
*   **磁盘空间不足**: 没有足够的空间来写入 RDB 或 AOF 文件。
*   **权限问题**: Redis 进程没有写入持久化目录的权限。
*   **配置错误**: `save` 或 AOF 相关配置不正确。

**解决方案:**
*   检查磁盘空间。
*   检查 Redis 数据目录的权限。
*   查看 `INFO persistence` 命令的输出。
*   检查 `redis.conf` 中的持久化配置。

## 7. 慢查询日志

Redis 提供了慢查询日志功能，可以记录执行时间超过指定阈值的命令。

在 `redis.conf` 中配置：
*   `slowlog-log-slower-than`: 阈值（微秒），超过此值的命令会被记录。
*   `slowlog-max-len`: 慢查询日志的最大长度。

```conf
slowlog-log-slower-than 10000 # 10 毫秒
slowlog-max-len 128
```

使用 `SLOWLOG GET` 命令查看慢查询日志：

```
SLOWLOG GET 10 # 获取最近 10 条慢查询
```

通过分析慢查询日志，可以找出导致性能问题的命令。