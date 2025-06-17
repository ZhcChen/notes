# 反向代理配置

反向代理是 Caddy 的核心功能之一，可以将客户端请求转发到后端服务器，常用于负载均衡、API 网关、微服务架构等场景。

## 🎯 基础反向代理

### 简单代理

```caddyfile
api.example.com {
    reverse_proxy localhost:3000
}
```

这个配置会将所有请求转发到本地的 3000 端口。

### 带路径的代理

```caddyfile
example.com {
    # API 请求代理到后端
    handle /api/* {
        reverse_proxy localhost:3000
    }
    
    # 静态文件
    handle {
        root * /var/www/html
        file_server
    }
}
```

### 多个后端服务

```caddyfile
app.example.com {
    # 用户服务
    handle /api/users/* {
        reverse_proxy localhost:3001
    }
    
    # 订单服务
    handle /api/orders/* {
        reverse_proxy localhost:3002
    }
    
    # 支付服务
    handle /api/payments/* {
        reverse_proxy localhost:3003
    }
    
    # 前端应用
    handle {
        reverse_proxy localhost:3000
    }
}
```

## ⚖️ 负载均衡

### 基本负载均衡

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002
}
```

默认使用轮询（round_robin）策略。

### 负载均衡策略

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 轮询（默认）
        lb_policy round_robin
        
        # 最少连接
        # lb_policy least_conn
        
        # IP 哈希
        # lb_policy ip_hash
        
        # 第一个可用
        # lb_policy first
        
        # URI 哈希
        # lb_policy uri_hash
        
        # 随机选择
        # lb_policy random
        
        # 加权轮询
        # lb_policy weighted_round_robin
    }
}
```

### 加权负载均衡

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
        
        # 失败阈值
        fail_duration 30s
        max_fails 3
        
        # 健康检查头
        health_headers {
            User-Agent "Caddy Health Check"
            Authorization "Bearer {$HEALTH_TOKEN}"
        }
    }
}
```

### 被动健康检查

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 localhost:3001 localhost:3002 {
        # 被动健康检查
        fail_duration 30s
        max_fails 3
        unhealthy_status 5xx
        unhealthy_latency 10s
    }
}
```

## 🔧 请求和响应处理

### 请求头修改

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 {
        # 添加请求头
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Port {server_port}
        
        # 删除请求头
        header_up -X-Custom-Header
        
        # 条件添加头
        header_up X-Environment "production"
        header_up X-Request-ID {uuid}
    }
}
```

### 响应头修改

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 {
        # 添加响应头
        header_down X-Served-By "Caddy"
        header_down X-Cache-Status "MISS"
        
        # 删除响应头
        header_down -Server
        header_down -X-Powered-By
        
        # 安全头
        header_down X-Content-Type-Options nosniff
        header_down X-Frame-Options DENY
    }
}
```

### 请求体处理

```caddyfile
api.example.com {
    # 限制请求体大小
    request_body {
        max_size 10MB
    }
    
    reverse_proxy localhost:3000 {
        # 缓冲请求体
        flush_interval -1
    }
}
```

## 🌐 高级代理配置

### 传输层配置

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 {
        transport http {
            # 连接超时
            dial_timeout 5s
            
            # 响应头超时
            response_header_timeout 10s
            
            # 期望继续超时
            expect_continue_timeout 1s
            
            # 空闲连接超时
            idle_conn_timeout 90s
            
            # 保持连接
            keep_alive 30s
            
            # 最大空闲连接
            max_idle_conns 100
            max_idle_conns_per_host 10
            
            # TLS 配置
            tls_insecure_skip_verify
            tls_timeout 10s
            tls_trusted_ca_certs /path/to/ca.pem
        }
    }
}
```

### WebSocket 代理

```caddyfile
ws.example.com {
    reverse_proxy localhost:3000 {
        # WebSocket 支持（自动检测）
        # 或者显式配置
        transport http {
            # 启用 WebSocket
            # websocket
        }
    }
}
```

### gRPC 代理

```caddyfile
grpc.example.com {
    reverse_proxy h2c://localhost:9000 {
        transport http {
            # HTTP/2 配置
            versions h2c
        }
    }
}
```

## 🔄 故障转移和重试

### 故障转移配置

```caddyfile
api.example.com {
    reverse_proxy {
        # 主服务器
        to localhost:3000
        
        # 备用服务器
        to localhost:3001 {
            # 仅在主服务器不可用时使用
            fail_duration 30s
        }
        
        # 重试配置
        lb_try_duration 5s
        lb_try_interval 250ms
    }
}
```

### 断路器模式

```caddyfile
api.example.com {
    reverse_proxy localhost:3000 {
        # 快速失败配置
        fail_duration 10s
        max_fails 5
        
        # 超时配置
        transport http {
            dial_timeout 3s
            response_header_timeout 5s
        }
    }
}
```

## 🔐 安全配置

### HTTPS 后端

```caddyfile
secure-api.example.com {
    reverse_proxy https://backend.internal:8443 {
        transport http {
            # TLS 配置
            tls_server_name backend.internal
            tls_trusted_ca_certs /etc/ssl/ca.pem
            
            # 或跳过证书验证（不推荐生产环境）
            # tls_insecure_skip_verify
        }
    }
}
```

### 客户端证书认证

```caddyfile
api.example.com {
    # 客户端证书验证
    tls {
        client_auth {
            mode require_and_verify
            trusted_ca_cert_file /etc/ssl/client-ca.pem
        }
    }
    
    reverse_proxy localhost:3000 {
        # 传递客户端证书信息
        header_up X-Client-Cert {tls_client_certificate}
        header_up X-Client-Subject {tls_client_subject}
    }
}
```

## 📊 监控和日志

### 访问日志

```caddyfile
api.example.com {
    log {
        output file /var/log/caddy/api-access.log {
            roll_size 100mb
            roll_keep 10
        }
        format json
        level INFO
    }
    
    reverse_proxy localhost:3000
}
```

### 自定义日志格式

```caddyfile
api.example.com {
    log {
        format filter {
            wrap console
            fields {
                request>headers>authorization delete
                request>headers>cookie delete
            }
        }
    }
    
    reverse_proxy localhost:3000
}
```

### 指标收集

```caddyfile
api.example.com {
    # Prometheus 指标（需要插件）
    metrics /metrics
    
    reverse_proxy localhost:3000 {
        # 添加追踪头
        header_up X-Trace-ID {uuid}
        header_up X-Request-Start {time.now.unix_nano}
    }
}
```

## 🎯 实际应用场景

### API 网关

```caddyfile
{
    # 全局配置
    email admin@example.com
}

# API 网关
gateway.example.com {
    # 认证服务
    handle /auth/* {
        reverse_proxy auth-service:8080
    }
    
    # 用户服务
    handle /api/users/* {
        # 需要认证
        forward_auth auth-service:8080 {
            uri /verify
            copy_headers X-User-ID X-User-Role
        }
        
        reverse_proxy user-service:8080
    }
    
    # 公开 API
    handle /api/public/* {
        reverse_proxy public-service:8080
    }
    
    # 限流
    rate_limit {
        zone api {
            key {remote_host}
            events 1000
            window 1h
        }
    }
    
    # 默认响应
    respond "API Gateway" 200
}
```

### 微服务架构

```caddyfile
# 服务发现配置
services.example.com {
    # 服务 A
    handle /service-a/* {
        reverse_proxy {
            dynamic srv _service-a._tcp.consul.service.consul
            health_uri /health
        }
    }
    
    # 服务 B
    handle /service-b/* {
        reverse_proxy {
            dynamic srv _service-b._tcp.consul.service.consul
            health_uri /health
        }
    }
}
```

### 蓝绿部署

```caddyfile
app.example.com {
    # 使用环境变量控制流量分配
    @blue header X-Version blue
    @green header X-Version green
    
    handle @blue {
        reverse_proxy blue-app:8080
    }
    
    handle @green {
        reverse_proxy green-app:8080
    }
    
    # 默认流量（可通过配置调整）
    reverse_proxy {$ACTIVE_VERSION:blue-app}:8080
}
```

---

通过这些配置，您可以构建强大的反向代理系统。接下来我们将学习自动 HTTPS 配置。 🚀
