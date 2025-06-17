# Docker 多阶段构建

多阶段构建是 Docker 的一个强大特性，允许在单个 Dockerfile 中使用多个 FROM 指令，从而优化镜像大小和构建效率。

## 🎯 多阶段构建概述

### 什么是多阶段构建

多阶段构建允许您：
- 在构建阶段使用完整的开发环境
- 在运行阶段使用精简的生产环境
- 显著减少最终镜像大小
- 提高安全性和性能

### 传统构建 vs 多阶段构建

```dockerfile
# 传统构建 - 镜像较大
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# 多阶段构建 - 镜像精简
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

## 🏗️ 基础语法

### 基本结构

```dockerfile
# 第一阶段：构建阶段
FROM base-image AS stage-name
# 构建指令...

# 第二阶段：运行阶段
FROM runtime-image
COPY --from=stage-name /source /destination
# 运行指令...
```

### 阶段命名

```dockerfile
# 使用 AS 关键字命名阶段
FROM golang:1.19 AS builder
FROM node:16 AS frontend-builder
FROM python:3.9 AS backend-builder

# 从命名阶段复制文件
COPY --from=builder /app/binary /usr/local/bin/
COPY --from=frontend-builder /app/dist /var/www/html/
```

## 🚀 实践示例

### Go 应用多阶段构建

```dockerfile
# 构建阶段
FROM golang:1.19-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache git ca-certificates tzdata

# 设置工作目录
WORKDIR /app

# 复制 go mod 文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags='-w -s -extldflags "-static"' \
    -o main .

# 运行阶段
FROM scratch

# 从构建阶段复制必要文件
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /app/main /main

# 暴露端口
EXPOSE 8080

# 运行应用
ENTRYPOINT ["/main"]
```

### Node.js 应用多阶段构建

```dockerfile
# 依赖安装阶段
FROM node:16-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 构建阶段
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM node:16-alpine AS runner
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
```

### Python 应用多阶段构建

```dockerfile
# 构建阶段
FROM python:3.9-slim AS builder

# 安装构建依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖到临时目录
RUN pip install --user --no-cache-dir -r requirements.txt

# 运行阶段
FROM python:3.9-slim

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash app

# 从构建阶段复制依赖
COPY --from=builder /root/.local /home/app/.local

# 复制应用代码
COPY . /app
WORKDIR /app

# 切换到非 root 用户
USER app

# 设置 PATH
ENV PATH=/home/app/.local/bin:$PATH

EXPOSE 8000
CMD ["python", "app.py"]
```

### React 应用多阶段构建

```dockerfile
# 构建阶段
FROM node:16-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 高级技巧

### 从外部镜像复制

```dockerfile
# 从官方镜像复制文件
FROM alpine AS base
COPY --from=nginx:alpine /etc/nginx/nginx.conf /etc/nginx/

# 从特定版本复制
COPY --from=node:16-alpine /usr/local/bin/node /usr/local/bin/
```

### 条件构建

```dockerfile
FROM node:16 AS base

# 开发阶段
FROM base AS development
RUN npm install
CMD ["npm", "run", "dev"]

# 生产阶段
FROM base AS production
RUN npm ci --only=production
CMD ["npm", "start"]

# 默认目标
FROM production
```

### 构建参数控制

```dockerfile
ARG BUILD_ENV=production

FROM node:16 AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]

FROM ${BUILD_ENV} AS final
```

## 📊 构建优化

### 缓存优化

```dockerfile
# 优化前 - 每次都重新安装依赖
FROM node:16
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# 优化后 - 利用层缓存
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### 并行构建

```dockerfile
# 前端构建
FROM node:16 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# 后端构建
FROM golang:1.19 AS backend
WORKDIR /app/backend
COPY backend/go.* ./
RUN go mod download
COPY backend/ .
RUN go build -o server

# 最终镜像
FROM alpine:latest
COPY --from=frontend /app/frontend/dist /var/www/html
COPY --from=backend /app/backend/server /usr/local/bin/
CMD ["server"]
```

## 🛠️ 构建工具集成

### Docker Buildx

```bash
# 启用 BuildKit
export DOCKER_BUILDKIT=1

# 构建特定阶段
docker build --target development -t myapp:dev .
docker build --target production -t myapp:prod .

# 多平台构建
docker buildx build --platform linux/amd64,linux/arm64 -t myapp .
```

### BuildKit 特性

```dockerfile
# syntax=docker/dockerfile:1
FROM alpine AS base

# 缓存挂载
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --update git

# 密钥挂载
RUN --mount=type=secret,id=mypassword \
    cat /run/secrets/mypassword
```

## 📈 性能对比

### 镜像大小对比

```bash
# 单阶段构建
REPOSITORY    TAG       SIZE
myapp         single    1.2GB

# 多阶段构建
REPOSITORY    TAG       SIZE
myapp         multi     150MB
```

### 构建时间优化

```dockerfile
# 优化构建时间
FROM node:16-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
CMD ["npm", "start"]
```

## 🚀 最佳实践

### 1. 合理选择基础镜像

```dockerfile
# 构建阶段使用完整镜像
FROM node:16 AS builder

# 运行阶段使用精简镜像
FROM node:16-alpine
```

### 2. 优化层缓存

```dockerfile
# 先复制依赖文件
COPY package*.json ./
RUN npm install

# 再复制源代码
COPY . .
```

### 3. 最小化最终镜像

```dockerfile
# 只复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
```

### 4. 使用非 root 用户

```dockerfile
FROM alpine
RUN adduser -D -s /bin/sh appuser
USER appuser
```

### 5. 清理构建缓存

```dockerfile
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
```

通过多阶段构建，您可以创建更小、更安全、更高效的 Docker 镜像，提升应用的部署和运行效率。
