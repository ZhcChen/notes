# Docker 存储管理

Docker 存储管理是容器化应用数据持久化的关键。本文档详细介绍 Docker 存储的类型、管理方式和最佳实践。

## 💾 存储类型概述

### Docker 存储方式

Docker 提供三种主要的数据存储方式：

| 存储类型 | 描述 | 使用场景 | 性能 |
|---------|------|----------|------|
| Volumes | Docker 管理的存储 | 数据持久化 | 高 |
| Bind Mounts | 主机目录挂载 | 开发调试 | 高 |
| tmpfs | 内存存储 | 临时数据 | 最高 |

### 存储位置

```bash
# Docker 存储根目录
/var/lib/docker/

# 数据卷存储位置
/var/lib/docker/volumes/

# 镜像层存储
/var/lib/docker/overlay2/
```

## 📦 数据卷 (Volumes)

### 基础卷操作

```bash
# 创建数据卷
docker volume create my-volume

# 列出所有数据卷
docker volume ls

# 查看数据卷详细信息
docker volume inspect my-volume

# 删除数据卷
docker volume rm my-volume

# 清理未使用的数据卷
docker volume prune
```

### 使用数据卷

```bash
# 运行容器时挂载数据卷
docker run -d --name web \
  -v my-volume:/var/www/html \
  nginx

# 匿名数据卷
docker run -d --name db \
  -v /var/lib/mysql \
  mysql:8.0

# 只读数据卷
docker run -d --name app \
  -v my-volume:/data:ro \
  my-app
```

### 数据卷驱动

```bash
# 使用本地驱动创建卷
docker volume create --driver local \
  --opt type=ext4 \
  --opt device=/dev/sdb1 \
  my-local-volume

# 使用 NFS 驱动
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.100,rw \
  --opt device=:/path/to/dir \
  nfs-volume
```

## 🔗 绑定挂载 (Bind Mounts)

### 基础绑定挂载

```bash
# 绑定挂载主机目录
docker run -d --name web \
  -v /host/path:/container/path \
  nginx

# 绑定挂载文件
docker run -d --name app \
  -v /host/config.conf:/app/config.conf \
  my-app

# 只读绑定挂载
docker run -d --name app \
  -v /host/data:/app/data:ro \
  my-app
```

### 绑定挂载选项

```bash
# 使用 --mount 语法（推荐）
docker run -d --name web \
  --mount type=bind,source=/host/path,target=/container/path \
  nginx

# 带权限的绑定挂载
docker run -d --name app \
  --mount type=bind,source=/host/data,target=/app/data,readonly \
  my-app

# 绑定挂载传播
docker run -d --name app \
  --mount type=bind,source=/host/data,target=/app/data,bind-propagation=shared \
  my-app
```

## 🚀 tmpfs 挂载

### 内存存储

```bash
# 创建 tmpfs 挂载
docker run -d --name app \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  my-app

# 使用 --mount 语法
docker run -d --name app \
  --mount type=tmpfs,destination=/tmp,tmpfs-size=100m \
  my-app
```

### tmpfs 使用场景

- 敏感数据临时存储
- 高速缓存
- 临时文件处理

## 🗄️ 存储驱动

### 存储驱动类型

```bash
# 查看当前存储驱动
docker info | grep "Storage Driver"

# 常见存储驱动
# - overlay2 (推荐)
# - aufs
# - devicemapper
# - btrfs
# - zfs
```

### Overlay2 驱动

```bash
# 查看 overlay2 信息
docker info | grep -A 10 "Storage Driver"

# 镜像层目录
ls /var/lib/docker/overlay2/

# 查看容器层
docker inspect container-name | grep MergedDir
```

## 📊 存储监控

### 存储使用情况

```bash
# 查看 Docker 存储使用
docker system df

# 详细存储信息
docker system df -v

# 查看容器存储使用
docker exec container-name df -h

# 查看数据卷使用
du -sh /var/lib/docker/volumes/*
```

### 存储性能监控

```bash
# 磁盘 I/O 监控
iostat -x 1

# 容器内磁盘性能
docker exec container-name iostat -x 1

# 存储性能测试
docker run --rm -v my-volume:/data \
  busybox dd if=/dev/zero of=/data/test bs=1M count=100
```

## 🔧 存储管理实践

### 数据备份

```bash
# 备份数据卷
docker run --rm \
  -v my-volume:/data \
  -v $(pwd):/backup \
  busybox tar czf /backup/backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm \
  -v my-volume:/data \
  -v $(pwd):/backup \
  busybox tar xzf /backup/backup.tar.gz -C /data
```

### 数据迁移

```bash
# 导出数据卷
docker run --rm \
  -v source-volume:/from \
  -v target-volume:/to \
  busybox cp -av /from/. /to/

# 跨主机数据迁移
docker run --rm \
  -v my-volume:/data \
  busybox tar czf - -C /data . | \
  ssh user@remote-host 'docker run --rm -i -v remote-volume:/data busybox tar xzf - -C /data'
```

### 存储清理

```bash
# 清理未使用的数据卷
docker volume prune

# 清理所有未使用的存储
docker system prune -a --volumes

# 清理特定数据卷
docker volume rm $(docker volume ls -qf dangling=true)
```

## 🏗️ 实际应用场景

### 数据库存储

```bash
# MySQL 数据持久化
docker run -d --name mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0

# PostgreSQL 数据持久化
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=password \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15
```

### Web 应用存储

```bash
# 静态文件存储
docker run -d --name nginx \
  -v web-content:/usr/share/nginx/html \
  -p 80:80 \
  nginx

# 应用日志存储
docker run -d --name app \
  -v app-logs:/var/log/app \
  my-application
```

### 开发环境存储

```bash
# 代码热重载
docker run -d --name dev-app \
  -v $(pwd)/src:/app/src \
  -v node-modules:/app/node_modules \
  -p 3000:3000 \
  node:16
```

## 🔒 存储安全

### 权限管理

```bash
# 设置用户权限
docker run -d --name app \
  --user 1000:1000 \
  -v app-data:/data \
  my-app

# 只读挂载
docker run -d --name app \
  -v config-data:/config:ro \
  my-app
```

### 加密存储

```bash
# 使用加密文件系统
docker volume create --driver local \
  --opt type=ext4 \
  --opt device=/dev/mapper/encrypted-volume \
  encrypted-volume
```

## 🚀 最佳实践

### 1. 选择合适的存储类型

```bash
# 数据持久化 - 使用 Volumes
docker run -v db-data:/var/lib/mysql mysql

# 开发调试 - 使用 Bind Mounts
docker run -v $(pwd):/app node

# 临时数据 - 使用 tmpfs
docker run --tmpfs /tmp my-app
```

### 2. 存储命名规范

```bash
# 使用描述性名称
docker volume create app-database-data
docker volume create app-logs
docker volume create app-config
```

### 3. 定期备份

```bash
#!/bin/bash
# backup-volumes.sh
for volume in $(docker volume ls -q); do
  docker run --rm \
    -v $volume:/data \
    -v $(pwd)/backups:/backup \
    busybox tar czf /backup/$volume-$(date +%Y%m%d).tar.gz -C /data .
done
```

### 4. 监控存储使用

```bash
# 定期检查存储使用情况
docker system df
docker volume ls
du -sh /var/lib/docker/volumes/*
```

### 5. 存储性能优化

```bash
# 使用 SSD 存储关键数据
docker volume create --driver local \
  --opt type=ext4 \
  --opt device=/dev/nvme0n1p1 \
  high-performance-volume

# 分离数据和日志存储
docker run -d \
  -v db-data:/var/lib/mysql \
  -v db-logs:/var/log/mysql \
  mysql:8.0
```

通过合理的存储管理，您可以确保容器化应用的数据安全、性能和可维护性。
