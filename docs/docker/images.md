# Docker 镜像管理

本文档详细介绍 Docker 镜像的构建、优化、管理和分发最佳实践。

## 🏗️ 镜像构建

### 基础构建
```bash
# 基本构建命令
docker build -t myapp:latest .

# 指定 Dockerfile 路径
docker build -f docker/Dockerfile -t myapp:v1.0 .

# 指定构建上下文
docker build -t myapp https://github.com/user/repo.git#main

# 从标准输入构建
docker build -t myapp - < Dockerfile
```

### 构建参数
```bash
# 传递构建参数
docker build --build-arg VERSION=1.0 --build-arg ENV=prod -t myapp .

# 设置标签
docker build -t myapp:latest -t myapp:v1.0 -t registry.com/myapp:latest .

# 设置目标阶段（多阶段构建）
docker build --target production -t myapp:prod .
```

### 构建优化
```bash
# 使用缓存
docker build --cache-from myapp:latest -t myapp:new .

# 禁用缓存
docker build --no-cache -t myapp .

# 压缩镜像层
docker build --squash -t myapp .

# 设置内存限制
docker build --memory 2g -t myapp .
```

## 🔍 镜像分析

### 查看镜像信息
```bash
# 列出镜像
docker images
docker image ls

# 查看镜像详细信息
docker inspect myapp:latest

# 查看镜像历史
docker history myapp:latest

# 查看镜像层
docker history --no-trunc myapp:latest
```

### 镜像大小分析
```bash
# 查看镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 分析镜像层大小
docker history --format "table {{.CreatedBy}}\t{{.Size}}" myapp:latest

# 使用 dive 工具分析（需要安装）
dive myapp:latest
```

## 🏷️ 镜像标签管理

### 标签操作
```bash
# 添加标签
docker tag myapp:latest myapp:v1.0
docker tag myapp:latest registry.com/myapp:latest

# 查看镜像标签
docker images myapp

# 删除标签
docker rmi myapp:v1.0
```

### 标签策略
```bash
# 语义化版本标签
docker tag myapp:latest myapp:1.2.3
docker tag myapp:latest myapp:1.2
docker tag myapp:latest myapp:1

# 环境标签
docker tag myapp:latest myapp:dev
docker tag myapp:latest myapp:staging
docker tag myapp:latest myapp:prod

# Git 提交标签
docker tag myapp:latest myapp:$(git rev-parse --short HEAD)
docker tag myapp:latest myapp:$(git describe --tags)
```

## 📦 镜像仓库操作

### 推送镜像
```bash
# 登录仓库
docker login registry.com

# 推送镜像
docker push registry.com/myapp:latest

# 推送所有标签
docker push --all-tags registry.com/myapp

# 推送到私有仓库
docker push localhost:5000/myapp:latest
```

### 拉取镜像
```bash
# 拉取最新版本
docker pull nginx:latest

# 拉取指定版本
docker pull postgres:13.8

# 拉取所有标签
docker pull --all-tags alpine

# 从私有仓库拉取
docker pull registry.com/myapp:latest
```

## 🗂️ 镜像导入导出

### 导出镜像
```bash
# 导出单个镜像
docker save -o myapp.tar myapp:latest

# 导出多个镜像
docker save -o images.tar myapp:latest nginx:alpine

# 压缩导出
docker save myapp:latest | gzip > myapp.tar.gz
```

### 导入镜像
```bash
# 导入镜像
docker load -i myapp.tar

# 从压缩文件导入
gunzip -c myapp.tar.gz | docker load

# 从标准输入导入
cat myapp.tar | docker load
```

## 🧹 镜像清理

### 清理未使用镜像
```bash
# 清理悬空镜像
docker image prune

# 清理所有未使用镜像
docker image prune -a

# 强制清理（不询问）
docker image prune -f

# 清理指定时间前的镜像
docker image prune --filter "until=24h"
```

### 批量删除镜像
```bash
# 删除所有镜像
docker rmi $(docker images -q)

# 删除悬空镜像
docker rmi $(docker images -f "dangling=true" -q)

# 删除指定仓库的镜像
docker rmi $(docker images myapp -q)

# 删除指定模式的镜像
docker images | grep "^<none>" | awk '{print $3}' | xargs docker rmi
```

## 🔧 镜像优化技巧

### 减小镜像大小
```dockerfile
# 1. 使用轻量级基础镜像
FROM alpine:latest
FROM node:16-alpine
FROM python:3.9-slim

# 2. 多阶段构建
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# 3. 合并 RUN 指令
RUN apt-get update && \
    apt-get install -y package1 package2 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 4. 使用 .dockerignore
# .dockerignore 文件内容
node_modules
.git
*.md
.env
```

### 缓存优化
```dockerfile
# 先复制依赖文件
COPY package*.json ./
RUN npm install

# 再复制源代码
COPY . .
```

### 安全优化
```dockerfile
# 使用非 root 用户
RUN adduser -D -s /bin/sh appuser
USER appuser

# 使用特定版本
FROM node:16.14.2-alpine

# 扫描漏洞
RUN apk add --no-cache --update && \
    apk upgrade
```

## 📊 镜像监控

### 镜像扫描
```bash
# 使用 Docker Scout（Docker Desktop）
docker scout cves myapp:latest

# 使用 Trivy 扫描
trivy image myapp:latest

# 使用 Clair 扫描
clairctl analyze myapp:latest
```

### 镜像签名
```bash
# 启用 Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# 推送签名镜像
docker push myapp:latest

# 验证镜像签名
docker trust inspect myapp:latest
```

## 🔄 镜像版本管理

### 版本策略
```bash
# 基于 Git 标签
VERSION=$(git describe --tags --always)
docker build -t myapp:$VERSION .

# 基于时间戳
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker build -t myapp:$TIMESTAMP .

# 基于构建号
BUILD_NUMBER=${CI_BUILD_NUMBER:-local}
docker build -t myapp:build-$BUILD_NUMBER .
```

### 自动化构建
```yaml
# GitHub Actions 示例
name: Build and Push
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build image
        run: |
          docker build -t myapp:${GITHUB_REF#refs/tags/} .
          docker push myapp:${GITHUB_REF#refs/tags/}
```

## 🛠️ 实用工具

### 镜像分析工具
```bash
# dive - 分析镜像层
dive myapp:latest

# docker-slim - 优化镜像
docker-slim build --target myapp:latest --tag myapp:slim

# hadolint - Dockerfile 检查
hadolint Dockerfile
```

### 镜像管理脚本
```bash
#!/bin/bash
# cleanup-images.sh - 清理旧镜像

# 保留最新的 5 个版本
docker images myapp --format "{{.Tag}}" | \
  sort -V | \
  head -n -5 | \
  xargs -I {} docker rmi myapp:{}
```

通过这些镜像管理技巧，您可以更好地控制 Docker 镜像的生命周期，提高开发和部署效率。
