# Redis 监控与告警

有效的监控和告警是确保 Redis 实例稳定、高性能运行的关键。本节将介绍如何监控 Redis 的关键指标以及设置告警。

## 1. 监控指标

Redis 提供了 `INFO` 命令，可以获取关于服务器的各种信息和统计数据。这些信息可以用于监控 Redis 的健康状况和性能。

```
INFO
```

`INFO` 命令的输出包含多个部分，例如：

*   **Server**: Redis 服务器的一般信息。
*   **Clients**: 客户端连接信息。
*   **Memory**: 内存使用情况。
*   **Persistence**: RDB 和 AOF 持久化信息。
*   **Stats**: 一般统计信息，如连接数、命令处理数等。
*   **Replication**: 主从复制信息。
*   **CPU**: CPU 使用统计。
*   **Keyspace**: 数据库键空间统计。

**关键监控指标:**

*   **内存使用**: `used_memory`, `used_memory_rss`
*   **连接数**: `connected_clients`
*   **命中率**: `keyspace_hits`, `keyspace_misses` (计算命中率: `keyspace_hits / (keyspace_hits + keyspace_misses)`)
*   **命令处理数**: `total_commands_processed`
*   **阻塞的客户端**: `blocked_clients`
*   **持久化状态**: `rdb_last_save_time`, `aof_last_rewrite_time_sec`
*   **复制延迟**: `master_repl_offset` (主从模式下)

## 2. 监控工具

有多种工具可以帮助您收集、存储和可视化 Redis 监控数据：

*   **Redis CLI**: 直接使用 `INFO` 命令。
*   **RedisStat**: 一个简单的 Ruby 工具，用于实时监控 Redis。
*   **Prometheus + Grafana**: 强大的组合，Prometheus 用于数据采集和存储，Grafana 用于数据可视化。
    *   **Redis Exporter**: Prometheus 的一个 exporter，用于从 Redis 收集指标。
*   **Datadog, New Relic, Zabbix**: 商业或开源的综合监控解决方案，通常提供 Redis 集成。
*   **RedisInsight**: Redis 官方提供的 GUI 工具，包含监控功能。

## 3. 设置告警

基于关键监控指标，您可以设置告警规则，以便在 Redis 出现异常时及时收到通知。

**常见的告警场景:**

*   **内存使用过高**: 当 `used_memory` 达到预设阈值（例如，总内存的 80%）时。
*   **连接数过多**: 当 `connected_clients` 超过最大连接数限制时。
*   **命中率下降**: 当 `keyspace_hits / (keyspace_hits + keyspace_misses)` 低于某个百分比时。
*   **AOF/RDB 持久化失败或长时间未执行**: 确保数据持久化正常。
*   **主从复制延迟过大**: 在主从架构中，确保数据同步及时。
*   **CPU 使用率过高**: 表明 Redis 实例可能负载过重。

**告警集成:**

*   **Prometheus Alertmanager**: 与 Prometheus 配合使用，可以将告警发送到 Slack, PagerDuty, Email 等。
*   **各种监控平台的告警功能**: 大多数监控工具都内置了告警功能。

## 4. 最佳实践

*   **定期检查**: 不仅仅依赖告警，定期查看 Redis 监控面板。
*   **基线建立**: 了解正常情况下的 Redis 性能指标，以便识别异常。
*   **日志分析**: 结合 Redis 日志文件进行问题诊断。
*   **自动化**: 尽可能自动化监控和告警的部署和管理。