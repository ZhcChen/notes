# 最佳实践

本章总结了 Rust 开发中的最佳实践，这些实践来自社区经验和官方建议，能帮助您编写更安全、更高效、更可维护的 Rust 代码。

## 代码组织

### 项目结构

```
my_project/
├── Cargo.toml
├── README.md
├── LICENSE
├── src/
│   ├── lib.rs          # 库的根模块
│   ├── main.rs         # 二进制的入口点
│   ├── bin/            # 额外的二进制文件
│   │   └── tool.rs
│   ├── modules/        # 模块组织
│   │   ├── mod.rs
│   │   ├── config.rs
│   │   └── utils.rs
│   └── error.rs        # 错误定义
├── tests/              # 集成测试
│   └── integration_test.rs
├── benches/            # 基准测试
│   └── benchmark.rs
├── examples/           # 示例代码
│   └── basic_usage.rs
└── docs/               # 文档
    └── api.md
```

### 模块设计原则

```rust
// 好的模块设计
pub mod config {
    pub struct Config {
        // 公开必要的字段
        pub host: String,
        pub port: u16,
        // 私有内部状态
        validated: bool,
    }
    
    impl Config {
        pub fn new(host: String, port: u16) -> Result<Self, ConfigError> {
            // 验证逻辑
            Ok(Config {
                host,
                port,
                validated: true,
            })
        }
        
        // 提供访问器而不是直接暴露字段
        pub fn is_valid(&self) -> bool {
            self.validated
        }
    }
}

// 使用 re-export 简化 API
pub use config::Config;
pub use error::{Error, Result};
```

## 错误处理

### 错误类型设计

```rust
use thiserror::Error;

// 定义清晰的错误类型
#[derive(Error, Debug)]
pub enum AppError {
    #[error("配置错误: {message}")]
    Config { message: String },
    
    #[error("网络错误")]
    Network(#[from] std::io::Error),
    
    #[error("解析错误: {0}")]
    Parse(#[from] serde_json::Error),
    
    #[error("验证失败: {field} 字段无效")]
    Validation { field: String },
}

// 使用 Result 类型别名
pub type Result<T> = std::result::Result<T, AppError>;

// 提供便利的构造函数
impl AppError {
    pub fn config(message: impl Into<String>) -> Self {
        AppError::Config {
            message: message.into(),
        }
    }
    
    pub fn validation(field: impl Into<String>) -> Self {
        AppError::Validation {
            field: field.into(),
        }
    }
}
```

### 错误处理模式

```rust
use anyhow::{Context, Result};

// 使用 context 提供更多信息
fn read_config_file(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("无法读取配置文件: {}", path))?;
    
    let config: Config = serde_json::from_str(&content)
        .context("配置文件格式错误")?;
    
    Ok(config)
}

// 早期返回模式
fn validate_user_input(input: &UserInput) -> Result<()> {
    if input.name.is_empty() {
        return Err(AppError::validation("name"));
    }
    
    if input.email.is_empty() {
        return Err(AppError::validation("email"));
    }
    
    // 更多验证...
    Ok(())
}
```

## API 设计

### 函数签名设计

```rust
// 好的 API 设计原则

// 1. 使用借用而不是拥有所有权（除非需要）
fn process_data(data: &[u8]) -> Result<Vec<u8>> {
    // 处理数据
    Ok(data.to_vec())
}

// 2. 返回借用而不是拥有的数据（当可能时）
fn get_name(&self) -> &str {
    &self.name
}

// 3. 使用泛型提高灵活性
fn serialize_to_writer<W, T>(writer: W, data: &T) -> Result<()>
where
    W: std::io::Write,
    T: serde::Serialize,
{
    serde_json::to_writer(writer, data)?;
    Ok(())
}

// 4. 使用建造者模式处理复杂配置
pub struct HttpClientBuilder {
    timeout: Option<Duration>,
    user_agent: Option<String>,
    headers: HashMap<String, String>,
}

impl HttpClientBuilder {
    pub fn new() -> Self {
        Self {
            timeout: None,
            user_agent: None,
            headers: HashMap::new(),
        }
    }
    
    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = Some(timeout);
        self
    }
    
    pub fn user_agent(mut self, user_agent: impl Into<String>) -> Self {
        self.user_agent = Some(user_agent.into());
        self
    }
    
    pub fn build(self) -> HttpClient {
        HttpClient {
            timeout: self.timeout.unwrap_or(Duration::from_secs(30)),
            user_agent: self.user_agent.unwrap_or_else(|| "rust-client".to_string()),
            headers: self.headers,
        }
    }
}
```

### 特征设计

```rust
// 设计清晰的特征接口
pub trait Cache {
    type Key;
    type Value;
    type Error;
    
    fn get(&self, key: &Self::Key) -> Result<Option<Self::Value>, Self::Error>;
    fn set(&mut self, key: Self::Key, value: Self::Value) -> Result<(), Self::Error>;
    fn remove(&mut self, key: &Self::Key) -> Result<bool, Self::Error>;
    
    // 提供默认实现
    fn contains_key(&self, key: &Self::Key) -> Result<bool, Self::Error> {
        Ok(self.get(key)?.is_some())
    }
}

// 使用关联类型而不是泛型参数（当只有一种实现时）
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}

// 而不是
// pub trait Iterator<T> {
//     fn next(&mut self) -> Option<T>;
// }
```

## 内存管理

### 所有权最佳实践

```rust
// 1. 优先使用借用
fn process_string(s: &str) -> String {
    s.to_uppercase()
}

// 2. 当需要所有权时才获取所有权
fn take_ownership(s: String) -> String {
    format!("Processed: {}", s)
}

// 3. 使用 Cow 处理可能需要修改的情况
use std::borrow::Cow;

fn maybe_modify(s: &str, should_modify: bool) -> Cow<str> {
    if should_modify {
        Cow::Owned(s.to_uppercase())
    } else {
        Cow::Borrowed(s)
    }
}

// 4. 合理使用 Clone
#[derive(Clone)]
struct Config {
    // 只为需要克隆的类型实现 Clone
    settings: HashMap<String, String>,
}

impl Config {
    // 提供便利方法避免不必要的克隆
    fn get_setting(&self, key: &str) -> Option<&str> {
        self.settings.get(key).map(|s| s.as_str())
    }
}
```

### 生命周期管理

```rust
// 明确生命周期关系
struct Parser<'a> {
    input: &'a str,
    position: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Parser { input, position: 0 }
    }
    
    fn parse_token(&mut self) -> Option<&'a str> {
        // 返回输入字符串的切片
        if self.position < self.input.len() {
            let start = self.position;
            // 查找下一个空格
            while self.position < self.input.len() 
                && !self.input.chars().nth(self.position).unwrap().is_whitespace() {
                self.position += 1;
            }
            Some(&self.input[start..self.position])
        } else {
            None
        }
    }
}
```

## 并发编程

### 线程安全设计

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::thread;

// 使用 Arc + Mutex 共享可变状态
struct SharedCounter {
    value: Arc<Mutex<i32>>,
}

impl SharedCounter {
    fn new() -> Self {
        SharedCounter {
            value: Arc::new(Mutex::new(0)),
        }
    }
    
    fn increment(&self) {
        let mut value = self.value.lock().unwrap();
        *value += 1;
    }
    
    fn get(&self) -> i32 {
        *self.value.lock().unwrap()
    }
}

// 使用 RwLock 优化读多写少的场景
struct ReadHeavyData {
    data: Arc<RwLock<HashMap<String, String>>>,
}

impl ReadHeavyData {
    fn get(&self, key: &str) -> Option<String> {
        let data = self.data.read().unwrap();
        data.get(key).cloned()
    }
    
    fn insert(&self, key: String, value: String) {
        let mut data = self.data.write().unwrap();
        data.insert(key, value);
    }
}
```

### 异步编程最佳实践

```rust
use tokio::time::{timeout, Duration};

// 设置合理的超时
async fn fetch_with_timeout(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let response = timeout(
        Duration::from_secs(10),
        reqwest::get(url)
    ).await??;
    
    let text = response.text().await?;
    Ok(text)
}

// 使用 join! 并发执行
async fn fetch_multiple_urls(urls: &[&str]) -> Vec<Result<String, Box<dyn std::error::Error>>> {
    let futures: Vec<_> = urls.iter()
        .map(|&url| fetch_with_timeout(url))
        .collect();
    
    futures::future::join_all(futures).await
}

// 合理使用 spawn
async fn background_task() {
    tokio::spawn(async {
        // 后台任务
        loop {
            // 定期清理工作
            cleanup().await;
            tokio::time::sleep(Duration::from_secs(60)).await;
        }
    });
}
```

## 测试策略

### 单元测试

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    // 测试命名要描述性强
    #[test]
    fn test_config_validation_rejects_empty_host() {
        let result = Config::new("".to_string(), 8080);
        assert!(result.is_err());
    }
    
    // 使用辅助函数创建测试数据
    fn create_test_config() -> Config {
        Config::new("localhost".to_string(), 8080).unwrap()
    }
    
    #[test]
    fn test_config_serialization_roundtrip() {
        let original = create_test_config();
        let json = serde_json::to_string(&original).unwrap();
        let deserialized: Config = serde_json::from_str(&json).unwrap();
        assert_eq!(original, deserialized);
    }
    
    // 测试错误情况
    #[test]
    #[should_panic(expected = "Invalid port")]
    fn test_config_panics_on_invalid_port() {
        Config::new("localhost".to_string(), 0).unwrap();
    }
}
```

### 集成测试

```rust
// tests/integration_test.rs
use my_crate::*;
use tempfile::TempDir;

#[test]
fn test_full_workflow() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join("config.json");
    
    // 设置测试环境
    let config = Config::new("localhost".to_string(), 8080).unwrap();
    std::fs::write(&config_path, serde_json::to_string(&config).unwrap()).unwrap();
    
    // 测试完整流程
    let loaded_config = load_config(&config_path).unwrap();
    assert_eq!(loaded_config.host, "localhost");
    assert_eq!(loaded_config.port, 8080);
}
```

## 文档编写

### 文档注释最佳实践

```rust
/// HTTP 客户端，用于发送 HTTP 请求
/// 
/// # 示例
/// 
/// ```
/// use my_crate::HttpClient;
/// 
/// let client = HttpClient::new();
/// let response = client.get("https://api.example.com/data").await?;
/// ```
/// 
/// # 错误
/// 
/// 当网络连接失败或服务器返回错误状态码时，方法会返回错误。
pub struct HttpClient {
    // 字段文档
    /// 请求超时时间
    timeout: Duration,
}

impl HttpClient {
    /// 创建新的 HTTP 客户端
    /// 
    /// # 参数
    /// 
    /// * `timeout` - 请求超时时间
    /// 
    /// # 示例
    /// 
    /// ```
    /// use std::time::Duration;
    /// use my_crate::HttpClient;
    /// 
    /// let client = HttpClient::with_timeout(Duration::from_secs(30));
    /// ```
    pub fn with_timeout(timeout: Duration) -> Self {
        HttpClient { timeout }
    }
    
    /// 发送 GET 请求
    /// 
    /// # 参数
    /// 
    /// * `url` - 请求的 URL
    /// 
    /// # 返回值
    /// 
    /// 返回 `Result<Response, Error>`，成功时包含响应数据
    /// 
    /// # 错误
    /// 
    /// * `NetworkError` - 网络连接失败
    /// * `TimeoutError` - 请求超时
    /// * `HttpError` - HTTP 错误状态码
    /// 
    /// # 示例
    /// 
    /// ```no_run
    /// # use my_crate::HttpClient;
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = HttpClient::new();
    /// let response = client.get("https://api.example.com/users").await?;
    /// println!("Status: {}", response.status());
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get(&self, url: &str) -> Result<Response, Error> {
        // 实现
        todo!()
    }
}
```

## 性能考虑

### 编译时优化

```rust
// 使用 const fn 进行编译时计算
const fn calculate_buffer_size(max_items: usize) -> usize {
    max_items * std::mem::size_of::<Item>()
}

const BUFFER_SIZE: usize = calculate_buffer_size(1000);

// 使用静态分发而不是动态分发（当可能时）
fn process_items<T: Iterator<Item = i32>>(iter: T) -> i32 {
    iter.sum()
}

// 而不是
// fn process_items(iter: &mut dyn Iterator<Item = i32>) -> i32 {
//     iter.sum()
// }
```

### 内存效率

```rust
// 使用合适的集合类型
use std::collections::{HashMap, BTreeMap, HashSet};

// 频繁查找：HashMap
// 需要排序：BTreeMap
// 去重：HashSet

// 预分配容量
fn create_large_vector() -> Vec<i32> {
    let mut vec = Vec::with_capacity(1000);
    for i in 0..1000 {
        vec.push(i);
    }
    vec
}

// 使用 Box 存储大型数据
struct LargeData([u8; 1024 * 1024]);

fn store_large_data() -> Box<LargeData> {
    Box::new(LargeData([0; 1024 * 1024]))
}
```

## 安全编程

### 避免常见陷阱

```rust
// 1. 避免整数溢出
fn safe_add(a: u32, b: u32) -> Option<u32> {
    a.checked_add(b)
}

// 2. 安全的数组访问
fn safe_get<T>(slice: &[T], index: usize) -> Option<&T> {
    slice.get(index)
}

// 3. 验证用户输入
fn validate_email(email: &str) -> Result<(), ValidationError> {
    if email.is_empty() {
        return Err(ValidationError::Empty);
    }
    
    if !email.contains('@') {
        return Err(ValidationError::InvalidFormat);
    }
    
    Ok(())
}

// 4. 安全的字符串处理
fn safe_substring(s: &str, start: usize, len: usize) -> Option<&str> {
    let end = start.checked_add(len)?;
    if end <= s.len() {
        Some(&s[start..end])
    } else {
        None
    }
}
```

## 代码风格

### 命名约定

```rust
// 模块名：snake_case
mod user_management;

// 类型名：PascalCase
struct UserAccount;
enum ConnectionState;
trait Serializable;

// 函数和变量：snake_case
fn calculate_total_price() -> f64 { 0.0 }
let user_count = 42;

// 常量：SCREAMING_SNAKE_CASE
const MAX_CONNECTIONS: usize = 100;
static GLOBAL_CONFIG: &str = "config";

// 生命周期：短小的描述性名称
fn parse<'input>(data: &'input str) -> &'input str { data }
```

### 代码组织

```rust
// 导入顺序：标准库 -> 外部 crate -> 本地模块
use std::collections::HashMap;
use std::fs::File;

use serde::{Deserialize, Serialize};
use tokio::time::Duration;

use crate::config::Config;
use crate::error::Error;

// 使用 pub use 重新导出常用类型
pub use error::{Error, Result};
pub use config::Config;
```

## 版本管理

### 语义化版本

```toml
# Cargo.toml
[package]
name = "my_crate"
version = "1.2.3"  # MAJOR.MINOR.PATCH

# MAJOR: 不兼容的 API 变更
# MINOR: 向后兼容的功能新增
# PATCH: 向后兼容的问题修正
```

### API 稳定性

```rust
// 使用 #[deprecated] 标记过时的 API
#[deprecated(since = "1.2.0", note = "使用 `new_function` 替代")]
pub fn old_function() {
    // 旧实现
}

// 提供迁移路径
pub fn new_function() {
    // 新实现
}

// 使用特性门控实验性功能
#[cfg(feature = "experimental")]
pub fn experimental_feature() {
    // 实验性功能
}
```

这些最佳实践将帮助您编写更高质量的 Rust 代码，提高代码的可读性、可维护性和性能！
