# 常用配置

Docker Compose 常用 yaml 配置
配置采用 v3 版本，所以省略了 version 字段

## PostgreSQL
```yml
services:
  postgres:
    container_name: postgres
    image: postgres:16.8
    restart: always
    network_mode: host
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/postgresql/data
```

## Redis
```yml
services:
  redis:
    container_name: redis
    image: redis:7.2.3
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - ./data:/data
    command: ["redis-server", "--tcp-keepalive", "60", "--bind", "0.0.0.0", "--requirepass", "you_password"]
```

## MySQL
```yml
services:
  mysql:
    image: mysql:8.2.0
    container_name: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: your_root_password
      MYSQL_DATABASE: your_database_name
      MYSQL_USER: your_username
      MYSQL_PASSWORD: your_password
    ports:
      - "3306:3306"
    volumes:
      - ./data:/var/lib/mysql
```

## Nginx
```yml
services:
  nginx:
    container_name: nginx
    image: nginx:1.24.0
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./conf.d:/etc/nginx/conf.d
    networks:
      - my_network
networks:
  my_network:
```

## qBittorrent
```yml
services:
  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:latest
    container_name: qbittorrent
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
      - WEBUI_PORT=8080
    volumes:
      - ./config:/config
      - ./downloads:/downloads
    ports:
      - 8080:8080
      - 6881:6881
      - 6881:6881/udp
    restart: unless-stopped
```