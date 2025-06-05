# Web 开发

Rust 在 Web 开发领域表现出色，提供了高性能、内存安全的解决方案。本章介绍使用 Rust 进行 Web 开发的主要框架、工具和最佳实践。

## Web 框架概览

### 主流框架对比

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| Axum | 现代、类型安全、基于 tokio | 高性能 API 服务 |
| Actix-web | 成熟、高性能、功能丰富 | 企业级应用 |
| Warp | 函数式、组合式、轻量 | 微服务 |
| Rocket | 易用、类型安全、宏驱动 | 快速原型开发 |
| Tide | 简单、模块化 | 学习和小项目 |

## Axum 框架详解

### 基础设置

```toml
# Cargo.toml
[dependencies]
axum = "0.7"
tokio = { version = "1.0", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"
```

### 基本服务器

```rust
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

// 应用状态
#[derive(Clone)]
struct AppState {
    users: Arc<RwLock<HashMap<u32, User>>>,
}

// 数据模型
#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[derive(Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
}

#[derive(Deserialize)]
struct UserQuery {
    limit: Option<usize>,
    offset: Option<usize>,
}

// 路由处理器
async fn get_users(
    Query(params): Query<UserQuery>,
    State(state): State<AppState>,
) -> Json<Vec<User>> {
    let users = state.users.read().await;
    let mut user_list: Vec<User> = users.values().cloned().collect();
    
    let offset = params.offset.unwrap_or(0);
    let limit = params.limit.unwrap_or(10);
    
    user_list.sort_by_key(|u| u.id);
    let end = std::cmp::min(offset + limit, user_list.len());
    
    Json(user_list[offset..end].to_vec())
}

async fn get_user(
    Path(user_id): Path<u32>,
    State(state): State<AppState>,
) -> Result<Json<User>, StatusCode> {
    let users = state.users.read().await;
    
    match users.get(&user_id) {
        Some(user) => Ok(Json(user.clone())),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    let mut users = state.users.write().await;
    
    let id = users.len() as u32 + 1;
    let user = User {
        id,
        name: payload.name,
        email: payload.email,
    };
    
    users.insert(id, user.clone());
    Ok(Json(user))
}

async fn health_check() -> &'static str {
    "OK"
}

#[tokio::main]
async fn main() {
    // 初始化日志
    tracing_subscriber::init();

    // 创建应用状态
    let state = AppState {
        users: Arc::new(RwLock::new(HashMap::new())),
    };

    // 构建路由
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/users", get(get_users).post(create_user))
        .route("/users/:id", get(get_user))
        .with_state(state);

    // 启动服务器
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();
    
    println!("服务器运行在 http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
```

## 中间件

### 自定义中间件

```rust
use axum::{
    body::Body,
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
    compression::CompressionLayer,
};

// 认证中间件
async fn auth_middleware(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = headers
        .get("authorization")
        .and_then(|header| header.to_str().ok());

    match auth_header {
        Some(token) if token.starts_with("Bearer ") => {
            // 验证 token
            if validate_token(&token[7..]) {
                Ok(next.run(request).await)
            } else {
                Err(StatusCode::UNAUTHORIZED)
            }
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}

fn validate_token(token: &str) -> bool {
    // 实际的 token 验证逻辑
    token == "valid_token"
}

// 请求日志中间件
async fn logging_middleware(
    request: Request,
    next: Next,
) -> Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    let start = std::time::Instant::now();
    let response = next.run(request).await;
    let duration = start.elapsed();
    
    tracing::info!(
        method = %method,
        uri = %uri,
        status = %response.status(),
        duration = ?duration,
        "Request processed"
    );
    
    response
}

// 应用中间件
fn create_app() -> Router {
    Router::new()
        .route("/protected", get(protected_handler))
        .route_layer(axum::middleware::from_fn(auth_middleware))
        .route("/public", get(public_handler))
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CompressionLayer::new())
                .layer(CorsLayer::permissive())
                .layer(axum::middleware::from_fn(logging_middleware))
        )
}

async fn protected_handler() -> &'static str {
    "这是受保护的资源"
}

async fn public_handler() -> &'static str {
    "这是公开的资源"
}
```

## 数据库集成

### 使用 SQLx

```toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres", "chrono", "uuid"] }
```

```rust
use sqlx::{PgPool, Row};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: Uuid,
    name: String,
    email: String,
    created_at: DateTime<Utc>,
}

// 数据库操作
struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    async fn create_user(&self, name: &str, email: &str) -> Result<User, sqlx::Error> {
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (id, name, email, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, created_at
            "#,
            Uuid::new_v4(),
            name,
            email,
            Utc::now()
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    async fn get_user_by_id(&self, id: Uuid) -> Result<Option<User>, sqlx::Error> {
        let user = sqlx::query_as!(
            User,
            "SELECT id, name, email, created_at FROM users WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    async fn list_users(&self, limit: i64, offset: i64) -> Result<Vec<User>, sqlx::Error> {
        let users = sqlx::query_as!(
            User,
            "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(users)
    }
}

// 集成到 Axum
#[derive(Clone)]
struct AppState {
    user_repo: UserRepository,
}

async fn create_user_handler(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<User>, (StatusCode, String)> {
    match state.user_repo.create_user(&payload.name, &payload.email).await {
        Ok(user) => Ok(Json(user)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}
```

## 认证和授权

### JWT 认证

```toml
[dependencies]
jsonwebtoken = "9.0"
```

```rust
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use chrono::{Duration, Utc};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,  // 用户 ID
    exp: usize,   // 过期时间
    iat: usize,   // 签发时间
    role: String, // 用户角色
}

struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    fn new(secret: &str) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_ref()),
            decoding_key: DecodingKey::from_secret(secret.as_ref()),
        }
    }

    fn create_token(&self, user_id: &str, role: &str) -> Result<String, jsonwebtoken::errors::Error> {
        let now = Utc::now();
        let exp = (now + Duration::hours(24)).timestamp() as usize;
        let iat = now.timestamp() as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            exp,
            iat,
            role: role.to_string(),
        };

        encode(&Header::default(), &claims, &self.encoding_key)
    }

    fn verify_token(&self, token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &Validation::default(),
        )?;

        Ok(token_data.claims)
    }
}

// 认证中间件
async fn jwt_auth_middleware(
    State(jwt_service): State<Arc<JwtService>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|header| header.to_str().ok());

    let token = match auth_header {
        Some(header) if header.starts_with("Bearer ") => &header[7..],
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    match jwt_service.verify_token(token) {
        Ok(claims) => {
            // 将用户信息添加到请求中
            request.extensions_mut().insert(claims);
            Ok(next.run(request).await)
        }
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}

// 登录处理器
#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct LoginResponse {
    token: String,
    user: User,
}

async fn login_handler(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    // 验证用户凭据
    if let Some(user) = authenticate_user(&payload.email, &payload.password).await {
        let token = state.jwt_service
            .create_token(&user.id.to_string(), "user")
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(Json(LoginResponse { token, user }))
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}

async fn authenticate_user(email: &str, password: &str) -> Option<User> {
    // 实际的用户认证逻辑
    // 这里应该查询数据库并验证密码哈希
    None
}
```

## WebSocket 支持

```rust
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast;

// WebSocket 状态
#[derive(Clone)]
struct WsState {
    tx: broadcast::Sender<String>,
}

// WebSocket 升级处理器
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<WsState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: WsState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    // 发送消息的任务
    let send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // 接收消息的任务
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            // 广播消息给所有连接的客户端
            let _ = state.tx.send(text);
        }
    });

    // 等待任一任务完成
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }
}

// 创建带 WebSocket 的应用
fn create_websocket_app() -> Router {
    let (tx, _rx) = broadcast::channel(100);
    let ws_state = WsState { tx };

    Router::new()
        .route("/ws", get(websocket_handler))
        .with_state(ws_state)
}
```

## 文件上传

```rust
use axum::{
    extract::Multipart,
    http::StatusCode,
    response::Json,
};
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

#[derive(Serialize)]
struct UploadResponse {
    filename: String,
    size: u64,
    url: String,
}

async fn upload_file(
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, StatusCode> {
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        let filename = field.file_name().unwrap().to_string();
        let data = field.bytes().await.unwrap();

        if name == "file" {
            // 生成唯一文件名
            let unique_filename = format!("{}_{}", 
                chrono::Utc::now().timestamp(), 
                filename
            );
            
            let file_path = format!("uploads/{}", unique_filename);
            
            // 保存文件
            let mut file = File::create(&file_path).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            
            file.write_all(&data).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            return Ok(Json(UploadResponse {
                filename: unique_filename.clone(),
                size: data.len() as u64,
                url: format!("/uploads/{}", unique_filename),
            }));
        }
    }

    Err(StatusCode::BAD_REQUEST)
}

// 静态文件服务
use tower_http::services::ServeDir;

fn create_app_with_static() -> Router {
    Router::new()
        .route("/upload", post(upload_file))
        .nest_service("/uploads", ServeDir::new("uploads"))
}
```

## 测试

### 集成测试

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_health_check() {
        let app = create_app();

        let response = app
            .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_create_user() {
        let app = create_app();

        let user_data = serde_json::json!({
            "name": "Test User",
            "email": "test@example.com"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/users")
                    .header("content-type", "application/json")
                    .body(Body::from(user_data.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
```

## 部署

### Docker 部署

```dockerfile
# Dockerfile
FROM rust:1.75 as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/web-app /usr/local/bin/web-app

EXPOSE 3000

CMD ["web-app"]
```

### 配置管理

```rust
use config::{Config, ConfigError, File};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Settings {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration_hours: i64,
}

impl Settings {
    pub fn new() -> Result<Self, ConfigError> {
        let settings = Config::builder()
            .add_source(File::with_name("config/default"))
            .add_source(File::with_name("config/local").required(false))
            .add_source(config::Environment::with_prefix("APP"))
            .build()?;

        settings.try_deserialize()
    }
}
```

## 性能优化

### 连接池

```rust
use sqlx::postgres::PgPoolOptions;

async fn create_database_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .connect(database_url)
        .await
}
```

### 缓存

```rust
use moka::future::Cache;
use std::time::Duration;

#[derive(Clone)]
struct CacheService {
    cache: Cache<String, String>,
}

impl CacheService {
    fn new() -> Self {
        let cache = Cache::builder()
            .max_capacity(10_000)
            .time_to_live(Duration::from_secs(300))
            .build();

        Self { cache }
    }

    async fn get(&self, key: &str) -> Option<String> {
        self.cache.get(key).await
    }

    async fn set(&self, key: String, value: String) {
        self.cache.insert(key, value).await;
    }
}
```

Rust Web 开发生态系统正在快速发展，提供了构建高性能、安全的 Web 应用所需的所有工具！
