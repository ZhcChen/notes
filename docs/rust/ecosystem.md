# 常用库推荐

Rust 拥有丰富的生态系统，这里推荐一些在不同领域中最常用和最优秀的库。

## 基础工具库

### 错误处理
```toml
[dependencies]
# 简化错误处理
anyhow = "1.0"          # 简单的错误处理
thiserror = "1.0"       # 自定义错误类型
eyre = "0.6"           # anyhow 的替代品
```

```rust
// anyhow 示例
use anyhow::{Context, Result};

fn read_config() -> Result<String> {
    std::fs::read_to_string("config.toml")
        .context("Failed to read config file")?;
    Ok("config content".to_string())
}

// thiserror 示例
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Parse error: {message}")]
    Parse { message: String },
}
```

### 序列化
```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"      # JSON 支持
serde_yaml = "0.9"      # YAML 支持
toml = "0.8"           # TOML 支持
bincode = "1.3"        # 二进制序列化
```

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct Config {
    name: String,
    port: u16,
    features: Vec<String>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config {
        name: "MyApp".to_string(),
        port: 8080,
        features: vec!["auth".to_string(), "logging".to_string()],
    };

    // JSON
    let json = serde_json::to_string(&config)?;
    println!("JSON: {}", json);

    // YAML
    let yaml = serde_yaml::to_string(&config)?;
    println!("YAML: {}", yaml);

    Ok(())
}
```

### 日期时间
```toml
[dependencies]
chrono = { version = "0.4", features = ["serde"] }
time = "0.3"           # 更现代的时间库
```

```rust
use chrono::{DateTime, Utc, Local, Duration};

fn main() {
    let now = Utc::now();
    let local = Local::now();
    
    println!("UTC: {}", now);
    println!("Local: {}", local);
    
    let tomorrow = now + Duration::days(1);
    println!("Tomorrow: {}", tomorrow);
}
```

## 异步编程

### 异步运行时
```toml
[dependencies]
tokio = { version = "1.0", features = ["full"] }
async-std = "1.12"     # 替代运行时
smol = "1.3"          # 轻量级运行时
```

### 异步工具
```toml
[dependencies]
futures = "0.3"        # Future 工具
tokio-stream = "0.1"   # 异步流
async-trait = "0.1"    # 异步 trait
```

```rust
use tokio::time::{sleep, Duration};
use futures::stream::{self, StreamExt};

#[tokio::main]
async fn main() {
    // 并发执行
    let tasks = (0..5).map(|i| {
        tokio::spawn(async move {
            sleep(Duration::from_millis(100 * i)).await;
            format!("Task {} completed", i)
        })
    });

    let results = futures::future::join_all(tasks).await;
    for result in results {
        println!("{}", result.unwrap());
    }

    // 流处理
    let stream = stream::iter(0..10)
        .map(|x| x * 2)
        .filter(|&x| x > 5);

    stream.for_each(|x| async move {
        println!("Processed: {}", x);
    }).await;
}
```

## 网络编程

### HTTP 客户端
```toml
[dependencies]
reqwest = { version = "0.11", features = ["json"] }
hyper = { version = "0.14", features = ["full"] }
```

```rust
use reqwest;
use serde::Deserialize;

#[derive(Deserialize)]
struct Post {
    id: u32,
    title: String,
    body: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    
    let post: Post = client
        .get("https://jsonplaceholder.typicode.com/posts/1")
        .send()
        .await?
        .json()
        .await?;

    println!("Title: {}", post.title);
    Ok(())
}
```

### Web 框架
```toml
[dependencies]
axum = "0.7"           # 现代 web 框架
warp = "0.3"           # 函数式 web 框架
actix-web = "4.0"      # 高性能 web 框架
rocket = "0.5"         # 易用的 web 框架
```

```rust
// Axum 示例
use axum::{
    routing::{get, post},
    http::StatusCode,
    Json, Router,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct User {
    id: u64,
    username: String,
}

async fn get_user() -> Json<User> {
    Json(User {
        id: 1,
        username: "alice".to_string(),
    })
}

async fn create_user(Json(payload): Json<User>) -> StatusCode {
    println!("Creating user: {}", payload.username);
    StatusCode::CREATED
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/users", get(get_user))
        .route("/users", post(create_user));

    println!("Server running on http://localhost:3000");
    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

## 数据库

### SQL 数据库
```toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres", "chrono", "uuid"] }
diesel = { version = "2.1", features = ["postgres", "chrono"] }
sea-orm = { version = "0.12", features = ["sqlx-postgres", "runtime-tokio-rustls", "macros"] }
```

```rust
// SQLx 示例
use sqlx::{PgPool, Row};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPool::connect("postgresql://user:password@localhost/database").await?;

    let row = sqlx::query("SELECT id, name FROM users WHERE id = $1")
        .bind(1i64)
        .fetch_one(&pool)
        .await?;

    let id: i64 = row.get("id");
    let name: String = row.get("name");

    println!("User: {} (ID: {})", name, id);
    Ok(())
}
```

### NoSQL 数据库
```toml
[dependencies]
redis = { version = "0.23", features = ["tokio-comp"] }
mongodb = "2.7"
```

## 命令行工具

### 参数解析
```toml
[dependencies]
clap = { version = "4.0", features = ["derive"] }
structopt = "0.3"      # 基于 clap 的宏
```

```rust
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "myapp")]
#[command(about = "A fictional versioning CLI")]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Add a new item
    Add {
        /// Name of the item
        name: String,
        /// Optional description
        #[arg(short, long)]
        description: Option<String>,
    },
    /// List all items
    List,
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Some(Commands::Add { name, description }) => {
            println!("Adding item: {}", name);
            if let Some(desc) = description {
                println!("Description: {}", desc);
            }
        }
        Some(Commands::List) => {
            println!("Listing all items");
        }
        None => {
            println!("No command specified");
        }
    }
}
```

### 终端 UI
```toml
[dependencies]
crossterm = "0.27"     # 跨平台终端操作
ratatui = "0.24"       # 终端 UI 框架
console = "0.15"       # 终端工具
indicatif = "0.17"     # 进度条
```

```rust
use indicatif::{ProgressBar, ProgressStyle};
use std::time::Duration;

fn main() {
    let pb = ProgressBar::new(100);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos:>7}/{len:7} {msg}")
            .unwrap()
            .progress_chars("#>-"),
    );

    for i in 0..100 {
        pb.set_position(i);
        pb.set_message(format!("Processing item {}", i));
        std::thread::sleep(Duration::from_millis(50));
    }

    pb.finish_with_message("Done!");
}
```

## 数据处理

### CSV 处理
```toml
[dependencies]
csv = "1.3"
```

```rust
use csv::Reader;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Record {
    name: String,
    age: u32,
    city: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let data = "name,age,city\nAlice,30,New York\nBob,25,London";
    let mut reader = Reader::from_reader(data.as_bytes());

    for result in reader.deserialize() {
        let record: Record = result?;
        println!("{:?}", record);
    }

    Ok(())
}
```

### 正则表达式
```toml
[dependencies]
regex = "1.10"
```

```rust
use regex::Regex;

fn main() {
    let re = Regex::new(r"(\d{4})-(\d{2})-(\d{2})").unwrap();
    let text = "Today is 2023-12-25 and tomorrow is 2023-12-26";

    for cap in re.captures_iter(text) {
        println!("Date: {}, Year: {}, Month: {}, Day: {}", 
                 &cap[0], &cap[1], &cap[2], &cap[3]);
    }
}
```

## 图像和多媒体

### 图像处理
```toml
[dependencies]
image = "0.24"
```

```rust
use image::{ImageBuffer, Rgb};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 创建一个简单的渐变图像
    let img = ImageBuffer::from_fn(256, 256, |x, y| {
        Rgb([x as u8, y as u8, (x + y) as u8])
    });

    img.save("gradient.png")?;
    println!("Image saved as gradient.png");

    // 加载和处理图像
    let img = image::open("gradient.png")?;
    let resized = img.resize(128, 128, image::imageops::FilterType::Lanczos3);
    resized.save("gradient_small.png")?;

    Ok(())
}
```

## 加密和安全

### 密码学
```toml
[dependencies]
ring = "0.17"          # 密码学原语
rustls = "0.21"        # TLS 实现
argon2 = "0.5"         # 密码哈希
```

```rust
use ring::{digest, rand};
use ring::rand::SecureRandom;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 生成随机数
    let rng = rand::SystemRandom::new();
    let mut key = [0u8; 32];
    rng.fill(&mut key)?;
    println!("Random key: {:?}", key);

    // 计算哈希
    let data = b"Hello, world!";
    let hash = digest::digest(&digest::SHA256, data);
    println!("SHA256: {:?}", hash.as_ref());

    Ok(())
}
```

## 测试和基准

### 测试工具
```toml
[dev-dependencies]
proptest = "1.0"       # 属性测试
mockall = "0.11"       # 模拟对象
wiremock = "0.5"       # HTTP 模拟
```

### 基准测试
```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }
```

```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        n => fibonacci(n-1) + fibonacci(n-2),
    }
}

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("fib 20", |b| b.iter(|| fibonacci(black_box(20))));
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```

## 配置管理

### 配置库
```toml
[dependencies]
config = "0.13"        # 配置管理
figment = "0.10"       # 分层配置
```

```rust
use config::{Config, ConfigError, File};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct AppConfig {
    database_url: String,
    port: u16,
    debug: bool,
}

fn load_config() -> Result<AppConfig, ConfigError> {
    let settings = Config::builder()
        .add_source(File::with_name("config/default"))
        .add_source(File::with_name("config/local").required(false))
        .build()?;

    settings.try_deserialize()
}
```

## 并发和并行

### 并发工具
```toml
[dependencies]
rayon = "1.8"          # 数据并行
crossbeam = "0.8"      # 并发工具
parking_lot = "0.12"   # 高性能锁
```

```rust
use rayon::prelude::*;

fn main() {
    let numbers: Vec<i32> = (0..1_000_000).collect();
    
    // 并行计算
    let sum: i32 = numbers.par_iter().sum();
    println!("Sum: {}", sum);

    // 并行映射
    let squares: Vec<i32> = numbers
        .par_iter()
        .map(|&x| x * x)
        .collect();
    
    println!("First 10 squares: {:?}", &squares[..10]);
}
```

## 系统编程

### 系统接口
```toml
[dependencies]
libc = "0.2"           # C 库绑定
nix = "0.27"           # Unix 系统调用
winapi = "0.3"         # Windows API (仅 Windows)
```

### 文件系统
```toml
[dependencies]
walkdir = "2.4"        # 目录遍历
notify = "6.1"         # 文件系统监控
tempfile = "3.8"       # 临时文件
```

```rust
use walkdir::WalkDir;

fn main() {
    for entry in WalkDir::new(".").into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            println!("{}", entry.path().display());
        }
    }
}
```

## 开发工具

### 日志
```toml
[dependencies]
log = "0.4"            # 日志接口
env_logger = "0.10"    # 简单日志实现
tracing = "0.1"        # 结构化日志
tracing-subscriber = "0.3"
```

```rust
use tracing::{info, warn, error, instrument};

#[instrument]
async fn process_data(id: u32) -> Result<String, &'static str> {
    info!("Processing data for ID: {}", id);
    
    if id == 0 {
        error!("Invalid ID: 0");
        return Err("Invalid ID");
    }
    
    warn!("This is a warning for ID: {}", id);
    Ok(format!("Processed data for ID: {}", id))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    
    let result = process_data(42).await;
    match result {
        Ok(data) => info!("Success: {}", data),
        Err(e) => error!("Error: {}", e),
    }
}
```

## 选择建议

### 按用途选择

**Web 开发**：axum + sqlx + serde + tokio
**CLI 工具**：clap + anyhow + serde
**系统工具**：tokio + crossbeam + libc
**数据处理**：rayon + csv + serde
**网络服务**：tokio + reqwest + tracing

### 版本管理

- 优先选择活跃维护的库
- 查看 GitHub stars 和最近更新时间
- 阅读文档和社区反馈
- 考虑库的依赖数量和编译时间

### 性能考虑

- 对于高性能需求，选择零成本抽象的库
- 考虑编译时间 vs 运行时性能的权衡
- 使用 `cargo tree` 检查依赖树
- 定期更新依赖以获得性能改进

这些库构成了 Rust 生态系统的核心，掌握它们将大大提高您的开发效率！
