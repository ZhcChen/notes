# Docker 容器编排

容器编排是管理多个容器应用程序的过程，包括部署、扩展、网络和服务发现。本文档介绍 Docker Swarm 和 Kubernetes 的基础知识。

## 🎯 编排概述

### 什么是容器编排

容器编排解决的问题：
- **服务发现**：容器间如何找到彼此
- **负载均衡**：流量如何分发到多个容器
- **扩缩容**：根据负载自动调整容器数量
- **健康检查**：监控容器状态并自动恢复
- **滚动更新**：无停机更新应用
- **资源管理**：合理分配 CPU 和内存

### 编排工具对比

| 特性 | Docker Swarm | Kubernetes |
|------|-------------|------------|
| 学习曲线 | 简单 | 复杂 |
| 功能丰富度 | 基础 | 丰富 |
| 社区支持 | 中等 | 强大 |
| 适用场景 | 小型项目 | 企业级 |

## 🐝 Docker Swarm

### Swarm 基础概念

- **Node（节点）**：Swarm 集群中的 Docker 引擎实例
- **Manager Node（管理节点）**：管理集群状态和调度任务
- **Worker Node（工作节点）**：运行容器任务
- **Service（服务）**：定义要运行的任务
- **Task（任务）**：服务的一个实例

### 初始化 Swarm 集群

```bash
# 初始化 Swarm 集群
docker swarm init

# 指定管理节点 IP
docker swarm init --advertise-addr 192.168.1.100

# 查看集群信息
docker info | grep Swarm

# 查看节点列表
docker node ls
```

### 添加节点到集群

```bash
# 获取加入令牌
docker swarm join-token worker
docker swarm join-token manager

# 工作节点加入集群
docker swarm join --token SWMTKN-1-xxx 192.168.1.100:2377

# 管理节点加入集群
docker swarm join --token SWMTKN-1-xxx 192.168.1.100:2377
```

### 服务管理

```bash
# 创建服务
docker service create --name web --replicas 3 -p 80:80 nginx

# 列出服务
docker service ls

# 查看服务详情
docker service inspect web

# 查看服务任务
docker service ps web

# 扩缩容服务
docker service scale web=5

# 更新服务
docker service update --image nginx:1.24 web

# 删除服务
docker service rm web
```

### 服务配置示例

```bash
# 创建带约束的服务
docker service create \
  --name database \
  --replicas 1 \
  --constraint 'node.role == manager' \
  --mount type=volume,source=db-data,target=/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  mysql:8.0

# 创建带资源限制的服务
docker service create \
  --name api \
  --replicas 3 \
  --limit-cpu 0.5 \
  --limit-memory 512M \
  --reserve-cpu 0.25 \
  --reserve-memory 256M \
  my-api:latest
```

### Docker Stack

```yaml
# docker-stack.yml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    networks:
      - webnet

  api:
    image: my-api:latest
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    networks:
      - webnet
      - backend

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - db-data:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    networks:
      - backend

volumes:
  db-data:

networks:
  webnet:
  backend:
```

```bash
# 部署 Stack
docker stack deploy -c docker-stack.yml myapp

# 列出 Stack
docker stack ls

# 查看 Stack 服务
docker stack services myapp

# 删除 Stack
docker stack rm myapp
```

## ☸️ Kubernetes 入门

### Kubernetes 基础概念

- **Pod**：最小部署单元，包含一个或多个容器
- **Service**：为 Pod 提供稳定的网络访问
- **Deployment**：管理 Pod 的副本和更新
- **Namespace**：资源隔离和组织
- **ConfigMap/Secret**：配置和敏感数据管理

### 安装 Kubernetes

```bash
# 使用 Minikube（本地开发）
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# 启动 Minikube
minikube start

# 安装 kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/
```

### 基础 Kubernetes 资源

#### Pod 定义

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:alpine
    ports:
    - containerPort: 80
```

#### Deployment 定义

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 250m
            memory: 256Mi
```

#### Service 定义

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

### Kubernetes 命令

```bash
# 应用资源
kubectl apply -f deployment.yaml

# 查看资源
kubectl get pods
kubectl get deployments
kubectl get services

# 查看详细信息
kubectl describe pod nginx-pod
kubectl describe deployment nginx-deployment

# 扩缩容
kubectl scale deployment nginx-deployment --replicas=5

# 滚动更新
kubectl set image deployment/nginx-deployment nginx=nginx:1.24

# 查看日志
kubectl logs -f deployment/nginx-deployment

# 进入容器
kubectl exec -it pod-name -- /bin/bash

# 删除资源
kubectl delete -f deployment.yaml
```

## 🔄 服务发现和负载均衡

### Docker Swarm 服务发现

```bash
# 创建网络
docker network create --driver overlay my-network

# 创建服务
docker service create \
  --name web \
  --network my-network \
  --replicas 3 \
  nginx

docker service create \
  --name api \
  --network my-network \
  --replicas 2 \
  my-api

# 服务间通信（通过服务名）
# web 服务可以通过 http://api 访问 api 服务
```

### Kubernetes 服务发现

```yaml
# 通过 Service 进行服务发现
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api
  ports:
  - port: 8080
    targetPort: 8080

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
spec:
  template:
    spec:
      containers:
      - name: web
        image: my-web:latest
        env:
        - name: API_URL
          value: "http://api-service:8080"
```

## 📊 监控和日志

### Docker Swarm 监控

```bash
# 查看服务状态
docker service ps web

# 查看节点资源使用
docker node ls
docker system df

# 服务日志
docker service logs web
```

### Kubernetes 监控

```bash
# 查看集群状态
kubectl cluster-info
kubectl get nodes

# 查看资源使用
kubectl top nodes
kubectl top pods

# 查看事件
kubectl get events

# 查看日志
kubectl logs -f deployment/nginx-deployment
```

## 🚀 最佳实践

### 1. 服务设计原则

```yaml
# 无状态服务设计
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stateless-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: my-app:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

### 2. 健康检查

```yaml
# Kubernetes 健康检查
spec:
  containers:
  - name: app
    image: my-app:latest
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
```

### 3. 资源管理

```yaml
# 资源限制和请求
spec:
  containers:
  - name: app
    resources:
      limits:
        cpu: 1000m
        memory: 1Gi
      requests:
        cpu: 500m
        memory: 512Mi
```

### 4. 配置管理

```yaml
# ConfigMap 和 Secret
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.properties: |
    server.port=8080
    logging.level=INFO

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  password: cGFzc3dvcmQ=  # base64 encoded
```

### 5. 滚动更新策略

```yaml
# 滚动更新配置
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
      - name: app
        image: my-app:v2
```

容器编排是现代应用部署的核心技术，选择合适的编排工具并遵循最佳实践，可以大大提升应用的可靠性和可维护性。
