# 测试

测试是软件开发中确保代码质量的重要环节。Rust 内置了强大的测试框架，支持单元测试、集成测试和文档测试。

## 单元测试

### 基本测试

```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
        assert_eq!(add(-1, 1), 0);
        assert_eq!(add(0, 0), 0);
    }

    #[test]
    fn test_add_negative() {
        assert_eq!(add(-2, -3), -5);
    }
}
```

### 断言宏

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_assertions() {
        // 基本断言
        assert!(true);
        assert!(!false);

        // 相等断言
        assert_eq!(2 + 2, 4);
        assert_ne!(2 + 2, 5);

        // 自定义错误消息
        assert_eq!(
            2 + 2, 
            4, 
            "Math is broken! 2 + 2 should equal 4"
        );

        // 条件断言
        let result = Some(42);
        assert!(result.is_some(), "Result should be Some");
    }

    #[test]
    fn test_panic_assertions() {
        // 测试 panic
        std::panic::catch_unwind(|| {
            panic!("This should panic");
        }).unwrap_err();
    }
}
```

### should_panic 测试

```rust
pub fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("Cannot divide by zero!");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn test_divide_by_zero() {
        divide(10.0, 0.0);
    }

    #[test]
    #[should_panic(expected = "Cannot divide by zero!")]
    fn test_divide_by_zero_with_message() {
        divide(10.0, 0.0);
    }

    #[test]
    fn test_divide_normal() {
        assert_eq!(divide(10.0, 2.0), 5.0);
    }
}
```

### Result 测试

```rust
use std::fs::File;
use std::io::Error;

fn read_file(path: &str) -> Result<String, Error> {
    std::fs::read_to_string(path)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_read_existing_file() -> Result<(), Error> {
        // 创建测试文件
        std::fs::write("test_file.txt", "Hello, test!")?;
        
        let content = read_file("test_file.txt")?;
        assert_eq!(content, "Hello, test!");
        
        // 清理
        std::fs::remove_file("test_file.txt")?;
        Ok(())
    }

    #[test]
    fn test_read_nonexistent_file() {
        let result = read_file("nonexistent.txt");
        assert!(result.is_err());
    }
}
```

## 测试组织

### 测试模块

```rust
// src/lib.rs
pub mod calculator;
pub mod string_utils;

// src/calculator.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_multiply() {
        assert_eq!(multiply(3, 4), 12);
    }
}

// src/string_utils.rs
pub fn reverse_string(s: &str) -> String {
    s.chars().rev().collect()
}

pub fn is_palindrome(s: &str) -> bool {
    let cleaned: String = s.chars()
        .filter(|c| c.is_alphanumeric())
        .map(|c| c.to_lowercase().next().unwrap())
        .collect();
    
    cleaned == cleaned.chars().rev().collect::<String>()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reverse_string() {
        assert_eq!(reverse_string("hello"), "olleh");
        assert_eq!(reverse_string(""), "");
    }

    #[test]
    fn test_is_palindrome() {
        assert!(is_palindrome("racecar"));
        assert!(is_palindrome("A man a plan a canal Panama"));
        assert!(!is_palindrome("hello"));
    }
}
```

### 忽略测试

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn quick_test() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    #[ignore]
    fn expensive_test() {
        // 这个测试很慢，通常被忽略
        for i in 0..1_000_000 {
            // 一些昂贵的计算
        }
        assert!(true);
    }

    #[test]
    #[ignore = "not implemented yet"]
    fn future_test() {
        // 未来要实现的测试
        todo!("Implement this test");
    }
}
```

## 集成测试

### 基本集成测试

```rust
// tests/integration_test.rs
use my_crate::calculator;

#[test]
fn test_calculator_integration() {
    let result = calculator::add(2, 3);
    assert_eq!(result, 5);
    
    let result = calculator::multiply(result, 2);
    assert_eq!(result, 10);
}

#[test]
fn test_complex_calculation() {
    let a = calculator::add(10, 5);
    let b = calculator::multiply(3, 4);
    let result = calculator::add(a, b);
    assert_eq!(result, 27);
}
```

### 共享测试代码

```rust
// tests/common/mod.rs
use std::fs;
use std::path::Path;

pub fn setup_test_environment() {
    // 创建测试目录
    if !Path::new("test_data").exists() {
        fs::create_dir("test_data").unwrap();
    }
}

pub fn cleanup_test_environment() {
    // 清理测试数据
    if Path::new("test_data").exists() {
        fs::remove_dir_all("test_data").unwrap();
    }
}

pub fn create_test_file(name: &str, content: &str) {
    let path = format!("test_data/{}", name);
    fs::write(path, content).unwrap();
}

// tests/file_operations.rs
mod common;

use my_crate::file_utils;

#[test]
fn test_file_operations() {
    common::setup_test_environment();
    
    common::create_test_file("test.txt", "Hello, World!");
    
    let content = file_utils::read_file("test_data/test.txt").unwrap();
    assert_eq!(content, "Hello, World!");
    
    common::cleanup_test_environment();
}
```

## 文档测试

### 基本文档测试

```rust
/// 计算两个数的和
/// 
/// # Examples
/// 
/// ```
/// use my_crate::add;
/// 
/// let result = add(2, 3);
/// assert_eq!(result, 5);
/// ```
/// 
/// ```
/// use my_crate::add;
/// 
/// // 测试负数
/// assert_eq!(add(-1, 1), 0);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// 检查字符串是否为回文
/// 
/// # Examples
/// 
/// ```
/// use my_crate::is_palindrome;
/// 
/// assert!(is_palindrome("racecar"));
/// assert!(!is_palindrome("hello"));
/// ```
/// 
/// 忽略大小写和标点符号：
/// 
/// ```
/// use my_crate::is_palindrome;
/// 
/// assert!(is_palindrome("A man a plan a canal Panama"));
/// ```
pub fn is_palindrome(s: &str) -> bool {
    let cleaned: String = s.chars()
        .filter(|c| c.is_alphanumeric())
        .map(|c| c.to_lowercase().next().unwrap())
        .collect();
    
    cleaned == cleaned.chars().rev().collect::<String>()
}
```

### 文档测试选项

```rust
/// 这个函数可能会 panic
/// 
/// ```should_panic
/// use my_crate::divide;
/// 
/// divide(10.0, 0.0); // 这会 panic
/// ```
pub fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("Cannot divide by zero!");
    }
    a / b
}

/// 这个例子不会被编译
/// 
/// ```ignore
/// use some_nonexistent_crate::function;
/// 
/// function(); // 这不会被测试
/// ```
pub fn example_function() {
    println!("This is an example");
}

/// 这个例子不会显示在文档中
/// 
/// ```no_run
/// use std::process::Command;
/// 
/// // 这会编译但不会运行
/// Command::new("rm").arg("-rf").arg("/").spawn();
/// ```
pub fn dangerous_function() {
    println!("This is dangerous");
}
```

## 基准测试

### 使用 criterion

```toml
# Cargo.toml
[dev-dependencies]
criterion = "0.5"

[[bench]]
name = "my_benchmark"
harness = false
```

```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use my_crate::*;

fn benchmark_add(c: &mut Criterion) {
    c.bench_function("add", |b| {
        b.iter(|| add(black_box(2), black_box(3)))
    });
}

fn benchmark_fibonacci(c: &mut Criterion) {
    c.bench_function("fibonacci 20", |b| {
        b.iter(|| fibonacci(black_box(20)))
    });
}

fn benchmark_string_operations(c: &mut Criterion) {
    let mut group = c.benchmark_group("string_ops");
    
    group.bench_function("reverse_short", |b| {
        b.iter(|| reverse_string(black_box("hello")))
    });
    
    group.bench_function("reverse_long", |b| {
        let long_string = "a".repeat(1000);
        b.iter(|| reverse_string(black_box(&long_string)))
    });
    
    group.finish();
}

criterion_group!(benches, benchmark_add, benchmark_fibonacci, benchmark_string_operations);
criterion_main!(benches);

// 在 lib.rs 中添加被测试的函数
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
```

## 模拟和测试替身

### 使用 mockall

```toml
# Cargo.toml
[dev-dependencies]
mockall = "0.11"
```

```rust
use mockall::*;

#[automock]
trait Database {
    fn get_user(&self, id: u32) -> Option<String>;
    fn save_user(&mut self, id: u32, name: String) -> Result<(), String>;
}

struct UserService<D: Database> {
    db: D,
}

impl<D: Database> UserService<D> {
    fn new(db: D) -> Self {
        UserService { db }
    }

    fn get_user_name(&self, id: u32) -> String {
        self.db.get_user(id).unwrap_or_else(|| "Unknown".to_string())
    }

    fn create_user(&mut self, id: u32, name: String) -> Result<(), String> {
        self.db.save_user(id, name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_existing_user() {
        let mut mock_db = MockDatabase::new();
        mock_db
            .expect_get_user()
            .with(eq(1))
            .times(1)
            .returning(|_| Some("Alice".to_string()));

        let service = UserService::new(mock_db);
        assert_eq!(service.get_user_name(1), "Alice");
    }

    #[test]
    fn test_get_nonexistent_user() {
        let mut mock_db = MockDatabase::new();
        mock_db
            .expect_get_user()
            .with(eq(999))
            .times(1)
            .returning(|_| None);

        let service = UserService::new(mock_db);
        assert_eq!(service.get_user_name(999), "Unknown");
    }

    #[test]
    fn test_create_user() {
        let mut mock_db = MockDatabase::new();
        mock_db
            .expect_save_user()
            .with(eq(1), eq("Bob".to_string()))
            .times(1)
            .returning(|_, _| Ok(()));

        let mut service = UserService::new(mock_db);
        assert!(service.create_user(1, "Bob".to_string()).is_ok());
    }
}
```

## 属性测试

### 使用 proptest

```toml
# Cargo.toml
[dev-dependencies]
proptest = "1.0"
```

```rust
use proptest::prelude::*;

fn reverse_string(s: &str) -> String {
    s.chars().rev().collect()
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}

proptest! {
    #[test]
    fn test_reverse_twice_is_identity(s in ".*") {
        let reversed_twice = reverse_string(&reverse_string(&s));
        prop_assert_eq!(s, reversed_twice);
    }

    #[test]
    fn test_add_commutative(a in any::<i32>(), b in any::<i32>()) {
        prop_assert_eq!(add(a, b), add(b, a));
    }

    #[test]
    fn test_add_associative(a in any::<i32>(), b in any::<i32>(), c in any::<i32>()) {
        prop_assert_eq!(add(add(a, b), c), add(a, add(b, c)));
    }

    #[test]
    fn test_string_length_preserved(s in ".*") {
        let reversed = reverse_string(&s);
        prop_assert_eq!(s.len(), reversed.len());
    }
}
```

## 测试配置和环境

### 条件编译

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(feature = "expensive_tests")]
    fn expensive_test() {
        // 只在启用特定 feature 时运行
        assert!(true);
    }

    #[test]
    #[cfg(not(target_os = "windows"))]
    fn unix_only_test() {
        // 只在非 Windows 系统上运行
        assert!(true);
    }
}
```

### 测试环境变量

```rust
#[cfg(test)]
mod tests {
    use std::env;

    #[test]
    fn test_with_env_var() {
        env::set_var("TEST_VAR", "test_value");
        
        // 测试依赖环境变量的代码
        let value = env::var("TEST_VAR").unwrap();
        assert_eq!(value, "test_value");
        
        env::remove_var("TEST_VAR");
    }
}
```

## 测试最佳实践

### 测试命名

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // 好的测试名称：描述测试的内容
    #[test]
    fn add_two_positive_numbers_returns_sum() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn add_positive_and_negative_numbers_returns_difference() {
        assert_eq!(add(5, -3), 2);
    }

    #[test]
    fn divide_by_zero_panics() {
        // 测试异常情况
    }

    // 使用模块组织相关测试
    mod calculator_tests {
        use super::*;

        #[test]
        fn test_addition() {
            assert_eq!(add(1, 1), 2);
        }

        #[test]
        fn test_subtraction() {
            assert_eq!(subtract(2, 1), 1);
        }
    }

    mod string_tests {
        use super::*;

        #[test]
        fn test_reverse() {
            assert_eq!(reverse_string("abc"), "cba");
        }
    }
}
```

### 测试数据管理

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // 使用常量定义测试数据
    const TEST_USER_ID: u32 = 123;
    const TEST_USER_NAME: &str = "Test User";

    // 使用辅助函数创建测试数据
    fn create_test_user() -> User {
        User {
            id: TEST_USER_ID,
            name: TEST_USER_NAME.to_string(),
            email: "test@example.com".to_string(),
        }
    }

    #[test]
    fn test_user_creation() {
        let user = create_test_user();
        assert_eq!(user.id, TEST_USER_ID);
        assert_eq!(user.name, TEST_USER_NAME);
    }
}
```

## 练习

### 练习 1：计算器测试
为一个计算器模块编写完整的测试套件，包括单元测试和集成测试。

### 练习 2：文件处理测试
测试文件读写功能，包括错误情况的处理。

### 练习 3：API 测试
为一个简单的 REST API 编写测试，使用模拟来测试外部依赖。

### 练习 4：性能测试
使用基准测试比较不同算法的性能。

## 下一步

掌握了测试后，您可以继续学习：

1. [包管理 Cargo](./cargo.md) - 项目管理工具
2. [宏编程](./macros.md) - 元编程
3. [unsafe Rust](./unsafe.md) - 底层控制

测试是确保 Rust 代码质量和可靠性的重要工具！
