# Docker 基础命令

本文档介绍 Docker 的常用命令，帮助您快速掌握容器操作。

## 🐳 镜像相关命令

### 查看镜像
```bash
# 列出本地所有镜像
docker images
docker image ls

# 查看镜像详细信息
docker inspect <镜像名>

# 查看镜像历史
docker history <镜像名>
```

### 拉取镜像
```bash
# 从 Docker Hub 拉取镜像
docker pull <镜像名>:<标签>

# 拉取指定版本
docker pull nginx:1.24.0
docker pull postgres:16

# 拉取最新版本
docker pull redis:latest
```

### 构建镜像
```bash
# 从 Dockerfile 构建镜像
docker build -t <镜像名>:<标签> .

# 指定 Dockerfile 路径
docker build -f /path/to/Dockerfile -t myapp:v1.0 .

# 构建时传递参数
docker build --build-arg VERSION=1.0 -t myapp .
```

### 删除镜像
```bash
# 删除指定镜像
docker rmi <镜像ID或名称>

# 删除多个镜像
docker rmi image1 image2 image3

# 删除所有未使用的镜像
docker image prune

# 强制删除所有镜像
docker rmi -f $(docker images -q)
```

## 📦 容器相关命令

### 运行容器
```bash
# 基本运行
docker run <镜像名>

# 后台运行
docker run -d <镜像名>

# 交互式运行
docker run -it <镜像名> /bin/bash

# 端口映射
docker run -p 8080:80 nginx

# 挂载数据卷
docker run -v /host/path:/container/path <镜像名>

# 设置环境变量
docker run -e ENV_VAR=value <镜像名>

# 完整示例
docker run -d --name my-nginx -p 8080:80 -v /data:/usr/share/nginx/html nginx:latest
```

### 管理容器
```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 启动容器
docker start <容器ID或名称>

# 停止容器
docker stop <容器ID或名称>

# 重启容器
docker restart <容器ID或名称>

# 暂停/恢复容器
docker pause <容器ID或名称>
docker unpause <容器ID或名称>
```

### 进入容器
```bash
# 进入运行中的容器
docker exec -it <容器ID或名称> /bin/bash

# 以 root 用户进入
docker exec -it --user root <容器ID或名称> /bin/bash

# 执行单个命令
docker exec <容器ID或名称> ls -la
```

### 查看容器信息
```bash
# 查看容器详细信息
docker inspect <容器ID或名称>

# 查看容器日志
docker logs <容器ID或名称>

# 实时查看日志
docker logs -f <容器ID或名称>

# 查看容器资源使用情况
docker stats <容器ID或名称>

# 查看容器进程
docker top <容器ID或名称>
```

### 删除容器
```bash
# 删除停止的容器
docker rm <容器ID或名称>

# 强制删除运行中的容器
docker rm -f <容器ID或名称>

# 删除所有停止的容器
docker container prune

# 删除所有容器
docker rm -f $(docker ps -aq)
```

## 🌐 网络相关命令

### 网络管理
```bash
# 列出网络
docker network ls

# 创建网络
docker network create <网络名>

# 查看网络详情
docker network inspect <网络名>

# 连接容器到网络
docker network connect <网络名> <容器名>

# 断开容器网络连接
docker network disconnect <网络名> <容器名>

# 删除网络
docker network rm <网络名>
```

## 💾 数据卷相关命令

### 数据卷管理
```bash
# 列出数据卷
docker volume ls

# 创建数据卷
docker volume create <卷名>

# 查看数据卷详情
docker volume inspect <卷名>

# 删除数据卷
docker volume rm <卷名>

# 删除未使用的数据卷
docker volume prune
```

## 🧹 系统清理命令

### 清理资源
```bash
# 清理未使用的镜像
docker image prune

# 清理停止的容器
docker container prune

# 清理未使用的网络
docker network prune

# 清理未使用的数据卷
docker volume prune

# 清理所有未使用的资源
docker system prune

# 清理所有资源（包括未使用的镜像）
docker system prune -a
```

### 查看系统信息
```bash
# 查看 Docker 系统信息
docker info

# 查看 Docker 版本
docker version

# 查看磁盘使用情况
docker system df
```

## 📋 实用技巧

### 批量操作
```bash
# 停止所有容器
docker stop $(docker ps -q)

# 删除所有容器
docker rm $(docker ps -aq)

# 删除所有镜像
docker rmi $(docker images -q)

# 删除悬空镜像
docker rmi $(docker images -f "dangling=true" -q)
```

### 容器备份和恢复
```bash
# 将容器保存为镜像
docker commit <容器ID> <新镜像名>:<标签>

# 导出镜像
docker save -o <文件名>.tar <镜像名>

# 导入镜像
docker load -i <文件名>.tar

# 导出容器
docker export <容器ID> > <文件名>.tar

# 导入容器
docker import <文件名>.tar <镜像名>:<标签>
```

### 资源限制
```bash
# 限制内存使用
docker run -m 512m <镜像名>

# 限制 CPU 使用
docker run --cpus="1.5" <镜像名>

# 限制 CPU 核心
docker run --cpuset-cpus="0,1" <镜像名>
```

## 🔍 常用组合命令

```bash
# 一键清理系统
docker system prune -a --volumes

# 查看容器 IP 地址
docker inspect <容器名> | grep IPAddress

# 进入容器并查看环境变量
docker exec -it <容器名> env

# 复制文件到容器
docker cp /host/file <容器名>:/container/path

# 从容器复制文件
docker cp <容器名>:/container/file /host/path
```

这些命令涵盖了 Docker 的日常使用场景，熟练掌握这些命令将大大提高您的容器操作效率。
