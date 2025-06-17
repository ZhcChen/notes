# Dockerfile 编写指南

Dockerfile 是用于构建 Docker 镜像的文本文件，包含了一系列指令来自动化镜像构建过程。

## 📝 基本语法

### Dockerfile 指令

#### FROM - 基础镜像
```dockerfile
# 指定基础镜像
FROM ubuntu:20.04

# 多阶段构建
FROM node:16 AS builder
FROM nginx:alpine AS runtime
```

#### LABEL - 添加元数据
```dockerfile
LABEL maintainer="your-email@example.com"
LABEL version="1.0"
LABEL description="My application"
```

#### ENV - 环境变量
```dockerfile
# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV PATH="/app/bin:${PATH}"
```

#### ARG - 构建参数
```dockerfile
# 定义构建时参数
ARG VERSION=latest
ARG BUILD_DATE

# 使用参数
FROM node:${VERSION}
LABEL build-date=${BUILD_DATE}
```

#### WORKDIR - 工作目录
```dockerfile
# 设置工作目录
WORKDIR /app

# 相对路径会基于当前 WORKDIR
WORKDIR src
```

#### COPY 和 ADD - 复制文件
```dockerfile
# 复制文件（推荐）
COPY package.json .
COPY src/ ./src/

# ADD 支持 URL 和自动解压
ADD https://example.com/file.tar.gz /tmp/
ADD archive.tar.gz /opt/
```

#### RUN - 执行命令
```dockerfile
# 执行 shell 命令
RUN apt-get update && apt-get install -y \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# 使用 exec 形式
RUN ["npm", "install"]
```

#### EXPOSE - 暴露端口
```dockerfile
# 声明容器监听的端口
EXPOSE 3000
EXPOSE 80 443
```

#### CMD 和 ENTRYPOINT - 启动命令
```dockerfile
# CMD - 默认命令（可被覆盖）
CMD ["npm", "start"]
CMD npm start

# ENTRYPOINT - 入口点（不可被覆盖）
ENTRYPOINT ["docker-entrypoint.sh"]

# 组合使用
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
```

#### USER - 用户
```dockerfile
# 创建用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 切换用户
USER appuser
```

#### VOLUME - 数据卷
```dockerfile
# 声明挂载点
VOLUME ["/data"]
VOLUME /var/log /var/db
```

## 🏗️ 实践示例

### Node.js 应用
```dockerfile
# 使用官方 Node.js 镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 更改文件所有者
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### Python 应用
```dockerfile
FROM python:3.9-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash app
USER app

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### Go 应用
```dockerfile
# 多阶段构建
FROM golang:1.19-alpine AS builder

WORKDIR /app

# 复制 go mod 文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 运行阶段
FROM alpine:latest

# 安装 ca-certificates
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# 从构建阶段复制二进制文件
COPY --from=builder /app/main .

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["./main"]
```

## 🚀 最佳实践

### 1. 镜像优化
```dockerfile
# ❌ 不好的做法
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim
RUN apt-get install -y git

# ✅ 好的做法
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y \
    curl \
    vim \
    git \
    && rm -rf /var/lib/apt/lists/*
```

### 2. 使用 .dockerignore
```txt
# .dockerignore 文件
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
```

### 3. 多阶段构建
```dockerfile
# 构建阶段
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 4. 缓存优化
```dockerfile
# ✅ 先复制依赖文件，利用缓存
COPY package*.json ./
RUN npm install

# 再复制源代码
COPY . .
```

### 5. 安全实践
```dockerfile
# 使用非 root 用户
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

# 使用特定版本标签
FROM node:16.14.2-alpine

# 扫描漏洞
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
```

## 🔧 高级技巧

### 条件构建
```dockerfile
ARG BUILD_ENV=production

RUN if [ "$BUILD_ENV" = "development" ]; then \
        npm install; \
    else \
        npm ci --only=production; \
    fi
```

### 健康检查
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

### 信号处理
```dockerfile
# 使用 tini 作为 init 进程
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

## 📊 构建优化

### 构建参数
```bash
# 构建时传递参数
docker build --build-arg NODE_ENV=production -t myapp .

# 使用构建缓存
docker build --cache-from myapp:latest -t myapp:new .

# 禁用缓存
docker build --no-cache -t myapp .
```

### BuildKit 特性
```dockerfile
# syntax=docker/dockerfile:1
FROM alpine
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --update git
```

## 🐛 常见问题

### 1. 镜像过大
- 使用 alpine 基础镜像
- 多阶段构建
- 清理包管理器缓存
- 使用 .dockerignore

### 2. 构建缓存失效
- 合理安排指令顺序
- 分离依赖安装和代码复制
- 使用 --cache-from 参数

### 3. 权限问题
- 避免使用 root 用户
- 正确设置文件权限
- 使用 USER 指令

通过遵循这些最佳实践，您可以构建出高效、安全、可维护的 Docker 镜像。
