# Docker 网络配置

Docker 网络是容器化应用程序通信的基础。本文档详细介绍 Docker 网络的原理、类型、配置和最佳实践。

## 🌐 网络基础概念

### Docker 网络架构

Docker 使用 Linux 网络命名空间来实现容器间的网络隔离。每个容器都有自己的网络栈，包括：
- 网络接口
- 路由表
- iptables 规则
- DNS 配置

### 网络驱动类型

Docker 支持多种网络驱动：

| 驱动类型 | 描述 | 使用场景 |
|---------|------|----------|
| bridge | 默认网络驱动 | 单主机容器通信 |
| host | 使用主机网络 | 高性能网络需求 |
| overlay | 跨主机网络 | Docker Swarm 集群 |
| macvlan | MAC 地址网络 | 需要直接连接物理网络 |
| none | 禁用网络 | 完全隔离的容器 |

## 🔧 网络管理命令

### 基础网络操作

```bash
# 列出所有网络
docker network ls

# 查看网络详细信息
docker network inspect bridge

# 创建自定义网络
docker network create my-network

# 创建指定驱动的网络
docker network create --driver bridge my-bridge

# 删除网络
docker network rm my-network

# 清理未使用的网络
docker network prune
```

### 容器网络连接

```bash
# 运行容器时指定网络
docker run --network my-network nginx

# 将运行中的容器连接到网络
docker network connect my-network container-name

# 断开容器网络连接
docker network disconnect my-network container-name

# 查看容器网络配置
docker inspect container-name | grep -A 20 NetworkSettings
```

## 🌉 Bridge 网络

### 默认 Bridge 网络

```bash
# 查看默认 bridge 网络
docker network inspect bridge

# 运行容器（使用默认网络）
docker run -d --name web nginx
docker run -d --name db mysql:8.0

# 容器间通信（通过 IP 地址）
docker exec web ping 172.17.0.3
```

### 自定义 Bridge 网络

```bash
# 创建自定义 bridge 网络
docker network create --driver bridge \
  --subnet=192.168.1.0/24 \
  --ip-range=192.168.1.128/25 \
  --gateway=192.168.1.1 \
  my-bridge

# 使用自定义网络
docker run -d --name web --network my-bridge nginx
docker run -d --name db --network my-bridge mysql:8.0

# 容器间通信（通过容器名）
docker exec web ping db
```

### Bridge 网络配置

```bash
# 创建带有自定义配置的网络
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.240.0/20 \
  --gateway=172.20.0.1 \
  --opt com.docker.network.bridge.name=my-bridge \
  --opt com.docker.network.bridge.enable_ip_masquerade=true \
  --opt com.docker.network.bridge.enable_icc=true \
  --opt com.docker.network.bridge.host_binding_ipv4=0.0.0.0 \
  my-custom-bridge
```

## 🏠 Host 网络

### Host 网络特点

- 容器直接使用主机网络栈
- 性能最佳，但失去网络隔离
- 端口冲突需要手动管理

```bash
# 使用 host 网络
docker run -d --network host nginx

# 查看网络配置（与主机相同）
docker exec container-name ip addr show
```

### Host 网络使用场景

```bash
# 高性能网络应用
docker run -d --network host \
  --name high-perf-app \
  my-performance-app

# 网络监控工具
docker run -d --network host \
  --name network-monitor \
  monitoring-tool
```

## 🔗 Overlay 网络

### 创建 Overlay 网络

```bash
# 初始化 Swarm 模式
docker swarm init

# 创建 overlay 网络
docker network create \
  --driver overlay \
  --subnet=10.0.0.0/24 \
  --attachable \
  my-overlay

# 跨主机容器通信
docker run -d --network my-overlay --name web nginx
docker run -d --network my-overlay --name db mysql:8.0
```

### Overlay 网络加密

```bash
# 创建加密的 overlay 网络
docker network create \
  --driver overlay \
  --opt encrypted \
  --subnet=10.1.0.0/24 \
  secure-overlay
```

## 🏷️ Macvlan 网络

### Macvlan 网络配置

```bash
# 创建 macvlan 网络
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  my-macvlan

# 使用 macvlan 网络
docker run -d --network my-macvlan \
  --ip=192.168.1.100 \
  --name web nginx
```

### Macvlan 使用场景

- 需要容器拥有独立 MAC 地址
- 直接连接到物理网络
- 传统应用迁移到容器

## 🔒 网络安全

### 网络隔离

```bash
# 创建隔离的网络
docker network create --internal isolated-network

# 运行隔离的容器
docker run -d --network isolated-network \
  --name secure-app my-app
```

### 防火墙规则

```bash
# 查看 Docker 创建的 iptables 规则
sudo iptables -L DOCKER

# 自定义防火墙规则
sudo iptables -I DOCKER-USER -s 192.168.1.0/24 -j DROP
```

## 📊 网络监控和调试

### 网络诊断工具

```bash
# 安装网络工具的容器
docker run -it --rm --network container:target-container \
  nicolaka/netshoot

# 网络连通性测试
docker exec container-name ping google.com
docker exec container-name nslookup google.com
docker exec container-name netstat -tulpn

# 抓包分析
docker exec container-name tcpdump -i eth0
```

### 性能监控

```bash
# 网络性能测试
docker run -it --rm --network my-network \
  networkstatic/iperf3 -c target-host

# 带宽监控
docker exec container-name iftop -i eth0
```

## 🛠️ 实际应用场景

### 微服务架构网络

```bash
# 前端网络
docker network create frontend

# 后端网络
docker network create backend

# 数据库网络
docker network create database

# Web 服务器（连接前端和后端）
docker run -d --name nginx \
  --network frontend \
  nginx

docker network connect backend nginx

# API 服务（连接后端和数据库）
docker run -d --name api \
  --network backend \
  my-api

docker network connect database api

# 数据库（仅连接数据库网络）
docker run -d --name db \
  --network database \
  mysql:8.0
```

### 负载均衡网络

```bash
# 创建负载均衡网络
docker network create lb-network

# 运行多个后端服务
docker run -d --name backend1 --network lb-network my-app
docker run -d --name backend2 --network lb-network my-app
docker run -d --name backend3 --network lb-network my-app

# 运行负载均衡器
docker run -d --name lb \
  --network lb-network \
  -p 80:80 \
  nginx-lb
```

## 🚀 最佳实践

### 1. 网络命名规范
```bash
# 使用描述性名称
docker network create app-frontend
docker network create app-backend
docker network create app-database
```

### 2. 网络分段
```bash
# 按功能分段网络
docker network create --subnet=10.1.0.0/24 web-tier
docker network create --subnet=10.2.0.0/24 app-tier
docker network create --subnet=10.3.0.0/24 db-tier
```

### 3. 安全配置
```bash
# 最小权限原则
docker network create --internal secure-backend
```

### 4. 性能优化
```bash
# 对于高性能需求使用 host 网络
docker run --network host high-performance-app
```

通过合理的网络配置，您可以构建安全、高效、可扩展的容器化应用架构。
