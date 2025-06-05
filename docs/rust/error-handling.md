# 错误处理

Rust 的错误处理哲学是让错误处理变得明确和可控。Rust 将错误分为两大类：可恢复的错误（recoverable errors）和不可恢复的错误（unrecoverable errors）。

## 不可恢复错误与 panic!

### 基本 panic!

```rust
fn main() {
    panic!("程序崩溃了！");
    
    // 这行代码不会执行
    println!("这行不会被打印");
}
```

### 数组越界引发的 panic

```rust
fn main() {
    let v = vec![1, 2, 3];
    
    // 这会引发 panic
    v[99];
}
```

### 设置 panic 行为

```rust
// 在 Cargo.toml 中设置
// [profile.release]
// panic = 'abort'

fn main() {
    // 在 debug 模式下，panic 会展开栈
    // 在 release 模式下，可以设置为直接终止
    panic!("Something went wrong!");
}
```

### 使用 backtrace

```bash
# 设置环境变量查看详细错误信息
RUST_BACKTRACE=1 cargo run
RUST_BACKTRACE=full cargo run
```

## Result 枚举

### Result 的定义

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

### 基本 Result 使用

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");
    
    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => panic!("打开文件时出错：{:?}", error),
    };
}
```

### 匹配不同的错误

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let greeting_file_result = File::open("hello.txt");
    
    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("创建文件时出错：{:?}", e),
            },
            other_error => {
                panic!("打开文件时出错：{:?}", other_error);
            }
        },
    };
}
```

### 使用闭包简化错误处理

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let greeting_file = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("创建文件时出错：{:?}", error);
            })
        } else {
            panic!("打开文件时出错：{:?}", error);
        }
    });
}
```

## Result 的方法

### unwrap 和 expect

```rust
use std::fs::File;

fn main() {
    // unwrap：如果是 Ok 返回值，如果是 Err 则 panic
    let greeting_file = File::open("hello.txt").unwrap();
    
    // expect：类似 unwrap，但可以自定义 panic 消息
    let greeting_file = File::open("hello.txt")
        .expect("hello.txt 应该包含在这个项目中");
}
```

### 其他有用的方法

```rust
fn main() {
    let result: Result<i32, &str> = Ok(42);
    
    // is_ok() 和 is_err()
    println!("是否成功：{}", result.is_ok());
    println!("是否失败：{}", result.is_err());
    
    // unwrap_or() - 提供默认值
    let value = result.unwrap_or(0);
    println!("值：{}", value);
    
    // unwrap_or_else() - 使用闭包计算默认值
    let value = result.unwrap_or_else(|_| 0);
    println!("值：{}", value);
    
    // map() - 转换 Ok 中的值
    let doubled = result.map(|x| x * 2);
    println!("翻倍：{:?}", doubled);
    
    // map_err() - 转换 Err 中的值
    let mapped_err = result.map_err(|e| format!("错误：{}", e));
    println!("映射错误：{:?}", mapped_err);
}
```

## 错误传播

### 手动传播错误

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let username_file_result = File::open("username.txt");
    
    let mut username_file = match username_file_result {
        Ok(file) => file,
        Err(e) => return Err(e),
    };
    
    let mut username = String::new();
    
    match username_file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}

fn main() {
    match read_username_from_file() {
        Ok(username) => println!("用户名：{}", username),
        Err(error) => println!("读取用户名失败：{}", error),
    }
}
```

### ? 运算符

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username_file = File::open("username.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}

// 更简洁的版本
fn read_username_from_file_short() -> Result<String, io::Error> {
    let mut username = String::new();
    File::open("username.txt")?.read_to_string(&mut username)?;
    Ok(username)
}

// 最简洁的版本
fn read_username_from_file_shortest() -> Result<String, io::Error> {
    std::fs::read_to_string("username.txt")
}
```

### ? 运算符与 Option

```rust
fn last_char_of_first_line(text: &str) -> Option<char> {
    text.lines().next()?.chars().last()
}

fn main() {
    let text = "Hello\nWorld";
    match last_char_of_first_line(text) {
        Some(ch) => println!("最后一个字符：{}", ch),
        None => println!("没有找到字符"),
    }
}
```

### main 函数中的 ?

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let greeting_file = File::open("hello.txt")?;
    
    Ok(())
}
```

## 自定义错误类型

### 简单的自定义错误

```rust
#[derive(Debug)]
struct CustomError {
    message: String,
}

impl CustomError {
    fn new(message: &str) -> CustomError {
        CustomError {
            message: message.to_string(),
        }
    }
}

impl std::fmt::Display for CustomError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "自定义错误：{}", self.message)
    }
}

impl std::error::Error for CustomError {}

fn might_fail(should_fail: bool) -> Result<String, CustomError> {
    if should_fail {
        Err(CustomError::new("操作失败"))
    } else {
        Ok("操作成功".to_string())
    }
}

fn main() {
    match might_fail(true) {
        Ok(message) => println!("{}", message),
        Err(error) => println!("错误：{}", error),
    }
}
```

### 使用枚举定义错误类型

```rust
#[derive(Debug)]
enum MathError {
    DivisionByZero,
    NegativeSquareRoot,
    InvalidInput(String),
}

impl std::fmt::Display for MathError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            MathError::DivisionByZero => write!(f, "除零错误"),
            MathError::NegativeSquareRoot => write!(f, "负数开方错误"),
            MathError::InvalidInput(msg) => write!(f, "无效输入：{}", msg),
        }
    }
}

impl std::error::Error for MathError {}

fn divide(a: f64, b: f64) -> Result<f64, MathError> {
    if b == 0.0 {
        Err(MathError::DivisionByZero)
    } else {
        Ok(a / b)
    }
}

fn sqrt(x: f64) -> Result<f64, MathError> {
    if x < 0.0 {
        Err(MathError::NegativeSquareRoot)
    } else {
        Ok(x.sqrt())
    }
}

fn main() {
    // 测试除法
    match divide(10.0, 2.0) {
        Ok(result) => println!("10 / 2 = {}", result),
        Err(error) => println!("错误：{}", error),
    }
    
    match divide(10.0, 0.0) {
        Ok(result) => println!("10 / 0 = {}", result),
        Err(error) => println!("错误：{}", error),
    }
    
    // 测试开方
    match sqrt(-4.0) {
        Ok(result) => println!("sqrt(-4) = {}", result),
        Err(error) => println!("错误：{}", error),
    }
}
```

## 错误转换

### From trait

```rust
use std::fs::File;
use std::io;
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Io(io::Error),
    Parse(ParseIntError),
}

impl From<io::Error> for AppError {
    fn from(error: io::Error) -> Self {
        AppError::Io(error)
    }
}

impl From<ParseIntError> for AppError {
    fn from(error: ParseIntError) -> Self {
        AppError::Parse(error)
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            AppError::Io(err) => write!(f, "IO 错误：{}", err),
            AppError::Parse(err) => write!(f, "解析错误：{}", err),
        }
    }
}

impl std::error::Error for AppError {}

fn read_and_parse_file() -> Result<i32, AppError> {
    let content = std::fs::read_to_string("number.txt")?; // io::Error 自动转换
    let number: i32 = content.trim().parse()?; // ParseIntError 自动转换
    Ok(number)
}

fn main() {
    match read_and_parse_file() {
        Ok(number) => println!("读取到的数字：{}", number),
        Err(error) => println!("错误：{}", error),
    }
}
```

## 错误处理最佳实践

### 何时使用 panic!

```rust
fn main() {
    // 1. 示例、原型代码和测试
    let v = vec![1, 2, 3];
    let element = v[0]; // 在示例中可以使用
    
    // 2. 当你比编译器知道更多信息时
    let home: std::net::IpAddr = "127.0.0.1"
        .parse()
        .expect("硬编码的 IP 地址应该是有效的");
    
    // 3. 不可恢复的错误
    if std::env::args().len() < 2 {
        panic!("程序需要至少一个参数");
    }
}
```

### 何时使用 Result

```rust
use std::fs::File;
use std::io::{self, Read};

// 1. 可能失败的操作
fn read_config_file() -> Result<String, io::Error> {
    std::fs::read_to_string("config.toml")
}

// 2. 用户输入验证
fn validate_age(age: i32) -> Result<i32, String> {
    if age < 0 {
        Err("年龄不能为负数".to_string())
    } else if age > 150 {
        Err("年龄不能超过 150".to_string())
    } else {
        Ok(age)
    }
}

// 3. 网络操作
fn fetch_data(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    // 模拟网络请求
    if url.is_empty() {
        Err("URL 不能为空".into())
    } else {
        Ok("数据".to_string())
    }
}

fn main() {
    // 处理配置文件读取
    match read_config_file() {
        Ok(config) => println!("配置：{}", config),
        Err(_) => println!("使用默认配置"),
    }
    
    // 处理用户输入
    match validate_age(25) {
        Ok(age) => println!("有效年龄：{}", age),
        Err(error) => println!("无效年龄：{}", error),
    }
}
```

### 错误处理模式

```rust
use std::fs::File;
use std::io::{self, Read};

// 1. 早期返回模式
fn process_file(filename: &str) -> Result<String, io::Error> {
    let mut file = File::open(filename)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    
    // 处理内容
    Ok(contents.to_uppercase())
}

// 2. 链式调用模式
fn process_file_chain(filename: &str) -> Result<String, io::Error> {
    std::fs::read_to_string(filename)
        .map(|contents| contents.to_uppercase())
}

// 3. 组合多个 Result
fn combine_results() -> Result<i32, Box<dyn std::error::Error>> {
    let a: Result<i32, _> = "42".parse();
    let b: Result<i32, _> = "24".parse();
    
    let sum = a? + b?;
    Ok(sum)
}

fn main() {
    // 测试不同的错误处理模式
    match process_file("test.txt") {
        Ok(content) => println!("处理结果：{}", content),
        Err(error) => println!("处理失败：{}", error),
    }
}
```

## 实际应用示例

### 配置文件解析器

```rust
use std::collections::HashMap;
use std::fs;

#[derive(Debug)]
enum ConfigError {
    FileNotFound,
    ParseError(String),
    MissingKey(String),
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            ConfigError::FileNotFound => write!(f, "配置文件未找到"),
            ConfigError::ParseError(msg) => write!(f, "解析错误：{}", msg),
            ConfigError::MissingKey(key) => write!(f, "缺少配置项：{}", key),
        }
    }
}

impl std::error::Error for ConfigError {}

struct Config {
    settings: HashMap<String, String>,
}

impl Config {
    fn load(filename: &str) -> Result<Config, ConfigError> {
        let content = fs::read_to_string(filename)
            .map_err(|_| ConfigError::FileNotFound)?;
        
        let mut settings = HashMap::new();
        
        for line in content.lines() {
            if line.trim().is_empty() || line.starts_with('#') {
                continue;
            }
            
            let parts: Vec<&str> = line.splitn(2, '=').collect();
            if parts.len() != 2 {
                return Err(ConfigError::ParseError(
                    format!("无效的配置行：{}", line)
                ));
            }
            
            settings.insert(
                parts[0].trim().to_string(),
                parts[1].trim().to_string(),
            );
        }
        
        Ok(Config { settings })
    }
    
    fn get(&self, key: &str) -> Result<&String, ConfigError> {
        self.settings.get(key)
            .ok_or_else(|| ConfigError::MissingKey(key.to_string()))
    }
    
    fn get_or_default(&self, key: &str, default: &str) -> String {
        self.settings.get(key)
            .cloned()
            .unwrap_or_else(|| default.to_string())
    }
}

fn main() {
    match Config::load("app.conf") {
        Ok(config) => {
            println!("配置加载成功");
            
            match config.get("database_url") {
                Ok(url) => println!("数据库 URL：{}", url),
                Err(error) => println!("错误：{}", error),
            }
            
            let port = config.get_or_default("port", "8080");
            println!("端口：{}", port);
        }
        Err(error) => {
            println!("配置加载失败：{}", error);
        }
    }
}
```

## 练习

### 练习 1：计算器错误处理
创建一个计算器，处理除零、无效输入等错误。

### 练习 2：文件处理器
编写一个文件处理程序，优雅地处理文件不存在、权限不足等错误。

### 练习 3：网络客户端
模拟一个网络客户端，处理连接超时、服务器错误等情况。

### 练习 4：数据验证器
创建一个数据验证系统，处理各种验证错误。

## 下一步

掌握了错误处理后，您可以继续学习：

1. [泛型](./generics.md) - 编写通用代码
2. [特征 (Traits)](./traits.md) - 定义共同行为
3. [生命周期](./lifetimes.md) - 引用的有效性

良好的错误处理是编写健壮 Rust 程序的关键！
