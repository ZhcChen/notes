# 负载均衡配置

Caddy 提供了强大的负载均衡功能，支持多种负载均衡算法、健康检查、故障转移等企业级特性。

## ⚖️ 基础负载均衡

### 简单负载均衡

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002
}
```

默认使用轮询（round_robin）算法，将请求依次分发到三个后端服务器。

### 带权重的负载均衡

```caddyfile
api.example.com {
    reverse_proxy {
        to localhost:3000 weight 3
        to localhost:3001 weight 2
        to localhost:3002 weight 1
        
        lb_policy weighted_round_robin
    }
}
```

## 🎯 负载均衡算法

### 轮询（Round Robin）

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        lb_policy round_robin
    }
}
```

**特点：**
- 请求按顺序分发到每个服务器
- 适用于服务器性能相近的场景
- 简单高效，默认算法

### 加权轮询（Weighted Round Robin）

```caddyfile
api.example.com {
    reverse_proxy {
        to localhost:3000 weight 5  # 高性能服务器
        to localhost:3001 weight 3  # 中等性能服务器
        to localhost:3002 weight 2  # 低性能服务器
        
        lb_policy weighted_round_robin
    }
}
```

**特点：**
- 根据权重分配请求
- 适用于服务器性能不同的场景
- 权重越高，分配的请求越多

### 最少连接（Least Connections）

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        lb_policy least_conn
    }
}
```

**特点：**
- 将请求分发到当前连接数最少的服务器
- 适用于请求处理时间差异较大的场景
- 能更好地平衡服务器负载

### IP 哈希（IP Hash）

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        lb_policy ip_hash
    }
}
```

**特点：**
- 根据客户端 IP 计算哈希值选择服务器
- 同一 IP 的请求总是分发到同一服务器
- 适用于需要会话保持的应用

### URI 哈希（URI Hash）

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        lb_policy uri_hash
    }
}
```

**特点：**
- 根据请求 URI 计算哈希值选择服务器
- 相同 URI 的请求总是分发到同一服务器
- 适用于缓存优化场景

### 随机选择（Random）

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        lb_policy random
    }
}
```

**特点：**
- 随机选择后端服务器
- 简单快速，适用于无状态应用
- 长期来看分布相对均匀

### 第一个可用（First Available）

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        lb_policy first
    }
}
```

**特点：**
- 总是选择第一个可用的服务器
- 适用于主备模式
- 只有主服务器不可用时才使用备用服务器

## 🏥 健康检查

### 主动健康检查

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 健康检查配置
        health_uri /health
        health_interval 30s
        health_timeout 5s
        health_status 200
        
        # 健康检查请求头
        health_headers {
            User-Agent "Caddy Health Check"
            Authorization "Bearer {$HEALTH_TOKEN}"
        }
        
        # 健康检查请求体
        health_body "ping"
        
        # 期望的响应体内容
        health_follow_redirects
    }
}
```

### 被动健康检查

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 失败阈值配置
        fail_duration 30s      # 标记为不健康的持续时间
        max_fails 3           # 最大失败次数
        
        # 不健康状态码
        unhealthy_status 5xx 429
        
        # 不健康延迟阈值
        unhealthy_latency 10s
        
        # 不健康请求数阈值
        unhealthy_request_count 10
    }
}
```

### 组合健康检查

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 主动健康检查
        health_uri /health
        health_interval 15s
        health_timeout 3s
        
        # 被动健康检查
        fail_duration 60s
        max_fails 5
        unhealthy_status 5xx
        unhealthy_latency 5s
        
        # 负载均衡策略
        lb_policy least_conn
    }
}
```

## 🔄 故障转移

### 基本故障转移

```caddyfile
api.example.com {
    reverse_proxy {
        # 主服务器
        to localhost:3000
        
        # 备用服务器（仅在主服务器不可用时使用）
        to localhost:3001 {
            fail_duration 30s
        }
        
        # 第二备用服务器
        to localhost:3002 {
            fail_duration 30s
        }
        
        lb_policy first
    }
}
```

### 多级故障转移

```caddyfile
api.example.com {
    reverse_proxy {
        # 主数据中心
        to primary-dc-1:8080 weight 10
        to primary-dc-2:8080 weight 10
        
        # 备用数据中心（延迟更高，权重更低）
        to backup-dc-1:8080 weight 1 {
            fail_duration 60s
        }
        to backup-dc-2:8080 weight 1 {
            fail_duration 60s
        }
        
        lb_policy weighted_round_robin
        
        # 健康检查
        health_uri /health
        health_interval 10s
        max_fails 2
        fail_duration 30s
    }
}
```

## 🎛️ 高级配置

### 会话保持

```caddyfile
app.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 基于 Cookie 的会话保持
        lb_policy cookie {
            name "session_id"
            secret "your-secret-key"
        }
        
        # 或基于 IP 的会话保持
        # lb_policy ip_hash
    }
}
```

### 连接池配置

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        transport http {
            # 连接池配置
            max_idle_conns 100
            max_idle_conns_per_host 10
            idle_conn_timeout 90s
            
            # 连接超时
            dial_timeout 5s
            keep_alive 30s
            
            # 响应超时
            response_header_timeout 10s
            expect_continue_timeout 1s
        }
    }
}
```

### 重试机制

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 重试配置
        lb_try_duration 5s     # 总重试时间
        lb_try_interval 250ms  # 重试间隔
        
        # 健康检查
        health_uri /health
        health_interval 30s
        max_fails 2
        fail_duration 30s
    }
}
```

## 📊 监控和指标

### 负载均衡指标

```caddyfile
api.example.com {
    # 启用指标收集
    metrics /metrics
    
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 添加追踪头
        header_up X-Load-Balancer "Caddy"
        header_up X-Backend-Server {upstream_hostport}
        header_up X-Request-ID {uuid}
        
        lb_policy round_robin
        
        health_uri /health
        health_interval 30s
    }
}
```

### 访问日志

```caddyfile
api.example.com {
    log {
        output file /var/log/caddy/api-access.log {
            roll_size 100mb
            roll_keep 10
        }
        format json {
            time_format "2006-01-02T15:04:05.000Z07:00"
            message_key "msg"
            level_key "level"
            time_key "ts"
            caller_key "caller"
            stacktrace_key "stacktrace"
        }
    }
    
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        header_up X-Request-Start {time.now.unix_nano}
        header_down X-Response-Time {time.now.unix_nano}
    }
}
```

## 🌐 实际应用场景

### 微服务负载均衡

```caddyfile
# 用户服务
users.api.example.com {
    reverse_proxy {
        to user-service-1:8080 weight 3
        to user-service-2:8080 weight 3
        to user-service-3:8080 weight 2
        
        lb_policy weighted_round_robin
        
        health_uri /health
        health_interval 15s
        max_fails 2
        fail_duration 30s
    }
}

# 订单服务
orders.api.example.com {
    reverse_proxy {
        to order-service-1:8080
        to order-service-2:8080
        
        lb_policy least_conn
        
        health_uri /health
        health_interval 10s
    }
}
```

### 地理位置负载均衡

```caddyfile
global.example.com {
    # 根据地理位置路由
    @asia header CF-IPCountry CN JP KR
    @europe header CF-IPCountry DE FR GB
    @america header CF-IPCountry US CA
    
    handle @asia {
        reverse_proxy asia-server-1:8080 asia-server-2:8080 {
            lb_policy round_robin
            health_uri /health
        }
    }
    
    handle @europe {
        reverse_proxy eu-server-1:8080 eu-server-2:8080 {
            lb_policy round_robin
            health_uri /health
        }
    }
    
    handle @america {
        reverse_proxy us-server-1:8080 us-server-2:8080 {
            lb_policy round_robin
            health_uri /health
        }
    }
    
    # 默认路由
    handle {
        reverse_proxy global-server-1:8080 global-server-2:8080
    }
}
```

### 蓝绿部署

```caddyfile
app.example.com {
    # 使用环境变量控制流量分配
    @canary header X-Canary-User true
    @beta query beta=true
    
    # 金丝雀发布（5% 流量到新版本）
    @canary_traffic {
        remote_ip 192.168.1.0/24  # 内部用户
        header X-Canary-Percent <= 5
    }
    
    handle @canary {
        reverse_proxy green-app-1:8080 green-app-2:8080 {
            lb_policy round_robin
        }
    }
    
    handle @beta {
        reverse_proxy beta-app:8080
    }
    
    handle @canary_traffic {
        reverse_proxy green-app-1:8080 green-app-2:8080
    }
    
    # 默认流量到稳定版本
    handle {
        reverse_proxy blue-app-1:8080 blue-app-2:8080 blue-app-3:8080 {
            lb_policy round_robin
            health_uri /health
            health_interval 30s
        }
    }
}
```

---

通过这些负载均衡配置，您可以构建高可用、高性能的分布式系统。接下来我们将学习中间件的使用。 ⚖️
