# 模块系统

Rust 的模块系统允许您组织代码，控制作用域和私有性。模块系统包括包（packages）、单元包（crates）、模块（modules）和路径（paths）。

## 包和单元包

### 包（Package）

包是提供一系列功能的一个或多个单元包。包含有一个 `Cargo.toml` 文件，阐述如何去构建这些单元包。

```toml
# Cargo.toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2024"

[dependencies]
```

### 单元包（Crate）

单元包是 Rust 在编译时最小的代码单位。单元包可以包含模块，这些模块可以定义在其他文件，然后和单元包一起编译。

```rust
// src/main.rs - 二进制单元包根
fn main() {
    println!("Hello, world!");
}
```

```rust
// src/lib.rs - 库单元包根
pub fn add(left: usize, right: usize) -> usize {
    left + right
}
```

## 模块定义

### 内联模块

```rust
// src/lib.rs
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();
    
    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

### 文件模块

```rust
// src/lib.rs
mod front_of_house;

pub fn eat_at_restaurant() {
    front_of_house::hosting::add_to_waitlist();
}
```

```rust
// src/front_of_house.rs
pub mod hosting {
    pub fn add_to_waitlist() {}
}

pub mod serving {
    fn take_order() {}
    fn serve_order() {}
    fn take_payment() {}
}
```

### 目录模块

```
src/
├── lib.rs
└── front_of_house/
    ├── mod.rs
    ├── hosting.rs
    └── serving.rs
```

```rust
// src/front_of_house/mod.rs
pub mod hosting;
pub mod serving;
```

```rust
// src/front_of_house/hosting.rs
pub fn add_to_waitlist() {}
pub fn seat_at_table() {}
```

```rust
// src/front_of_house/serving.rs
fn take_order() {}
fn serve_order() {}
fn take_payment() {}
```

## 可见性和私有性

### 公有和私有

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
        
        fn private_function() {} // 私有函数
    }
    
    mod serving { // 私有模块
        fn take_order() {}
    }
}

pub fn eat_at_restaurant() {
    // 可以访问公有函数
    front_of_house::hosting::add_to_waitlist();
    
    // 不能访问私有函数
    // front_of_house::hosting::private_function(); // 错误！
    
    // 不能访问私有模块
    // front_of_house::serving::take_order(); // 错误！
}
```

### 结构体和枚举的可见性

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,
        seasonal_fruit: String, // 私有字段
    }
    
    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
    
    pub enum Appetizer {
        Soup,
        Salad,
    }
}

pub fn eat_at_restaurant() {
    // 创建结构体实例
    let mut meal = back_of_house::Breakfast::summer("Rye");
    
    // 可以修改公有字段
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please", meal.toast);
    
    // 不能访问私有字段
    // meal.seasonal_fruit = String::from("blueberries"); // 错误！
    
    // 枚举的所有变体都是公有的
    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
}
```

## use 关键字

### 基本 use

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

### use 的习惯用法

```rust
use std::collections::HashMap;
use std::fmt::Result;
use std::io::Result as IoResult; // 使用 as 重命名

fn function1() -> Result {
    // --snip--
    Ok(())
}

fn function2() -> IoResult<()> {
    // --snip--
    Ok(())
}

fn main() {
    let mut map = HashMap::new();
    map.insert(1, 2);
}
```

### 嵌套路径

```rust
// 不使用嵌套路径
use std::cmp::Ordering;
use std::io;

// 使用嵌套路径
use std::{cmp::Ordering, io};

// 更复杂的例子
use std::io::{self, Write};
```

### glob 运算符

```rust
use std::collections::*;

fn main() {
    let mut map = HashMap::new();
    let mut set = HashSet::new();
}
```

## 模块组织实例

### 餐厅管理系统

```rust
// src/lib.rs
mod front_of_house;
mod back_of_house;

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::seat_at_table();
    
    let mut meal = back_of_house::Breakfast::summer("Rye");
    meal.toast = String::from("Wheat");
    
    let order1 = back_of_house::Appetizer::Soup;
}
```

```rust
// src/front_of_house.rs
pub mod hosting;
pub mod serving;
```

```rust
// src/front_of_house/hosting.rs
pub fn add_to_waitlist() {
    println!("Adding to waitlist");
}

pub fn seat_at_table() {
    println!("Seating at table");
}
```

```rust
// src/front_of_house/serving.rs
fn take_order() {
    println!("Taking order");
}

fn serve_order() {
    println!("Serving order");
}

fn take_payment() {
    println!("Taking payment");
}
```

```rust
// src/back_of_house.rs
pub struct Breakfast {
    pub toast: String,
    seasonal_fruit: String,
}

impl Breakfast {
    pub fn summer(toast: &str) -> Breakfast {
        Breakfast {
            toast: String::from(toast),
            seasonal_fruit: String::from("peaches"),
        }
    }
}

pub enum Appetizer {
    Soup,
    Salad,
}

fn fix_incorrect_order() {
    cook_order();
    super::front_of_house::serving::serve_order();
}

fn cook_order() {
    println!("Cooking order");
}
```

## 工作空间

### 创建工作空间

```toml
# Cargo.toml (工作空间根目录)
[workspace]
members = [
    "adder",
    "add_one",
]
```

```toml
# adder/Cargo.toml
[package]
name = "adder"
version = "0.1.0"
edition = "2024"

[dependencies]
add_one = { path = "../add_one" }
```

```toml
# add_one/Cargo.toml
[package]
name = "add_one"
version = "0.1.0"
edition = "2024"
```

```rust
// add_one/src/lib.rs
pub fn add_one(x: i32) -> i32 {
    x + 1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(3, add_one(2));
    }
}
```

```rust
// adder/src/main.rs
use add_one;

fn main() {
    let num = 10;
    println!("Hello, world! {} plus one is {}!", num, add_one::add_one(num));
}
```

## 路径和可见性规则

### 路径类型

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();
    
    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

### super 关键字

```rust
fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order(); // 使用 super 访问父模块
    }

    fn cook_order() {}
}
```

### self 关键字

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use self::front_of_house::hosting; // 使用 self

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

## 实际项目结构

### Web 应用项目结构

```
src/
├── main.rs
├── lib.rs
├── models/
│   ├── mod.rs
│   ├── user.rs
│   └── post.rs
├── handlers/
│   ├── mod.rs
│   ├── auth.rs
│   └── api.rs
├── utils/
│   ├── mod.rs
│   ├── database.rs
│   └── validation.rs
└── config/
    ├── mod.rs
    └── settings.rs
```

```rust
// src/lib.rs
pub mod models;
pub mod handlers;
pub mod utils;
pub mod config;

pub use models::{User, Post};
pub use handlers::{auth, api};
```

```rust
// src/models/mod.rs
pub mod user;
pub mod post;

pub use user::User;
pub use post::Post;
```

```rust
// src/models/user.rs
#[derive(Debug)]
pub struct User {
    pub id: u32,
    pub username: String,
    pub email: String,
}

impl User {
    pub fn new(id: u32, username: String, email: String) -> User {
        User { id, username, email }
    }
}
```

```rust
// src/handlers/mod.rs
pub mod auth;
pub mod api;
```

```rust
// src/handlers/auth.rs
use crate::models::User;

pub fn login(username: &str, password: &str) -> Option<User> {
    // 登录逻辑
    if username == "admin" && password == "password" {
        Some(User::new(1, username.to_string(), "admin@example.com".to_string()))
    } else {
        None
    }
}

pub fn logout() {
    println!("User logged out");
}
```

## 条件编译

### cfg 属性

```rust
// src/lib.rs
#[cfg(target_os = "windows")]
mod windows_specific {
    pub fn do_windows_stuff() {
        println!("Windows specific code");
    }
}

#[cfg(target_os = "linux")]
mod linux_specific {
    pub fn do_linux_stuff() {
        println!("Linux specific code");
    }
}

#[cfg(feature = "advanced")]
mod advanced_features {
    pub fn advanced_function() {
        println!("Advanced feature");
    }
}

pub fn cross_platform_function() {
    #[cfg(target_os = "windows")]
    windows_specific::do_windows_stuff();
    
    #[cfg(target_os = "linux")]
    linux_specific::do_linux_stuff();
    
    #[cfg(feature = "advanced")]
    advanced_features::advanced_function();
}
```

### 测试模块

```rust
// src/lib.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }
    
    #[test]
    fn test_add_negative() {
        assert_eq!(add(-1, 1), 0);
    }
}
```

## 练习

### 练习 1：图书馆管理系统
创建一个图书馆管理系统，包含书籍、用户、借阅等模块。

### 练习 2：电商系统
设计一个简单的电商系统，包含商品、订单、用户、支付等模块。

### 练习 3：重构现有代码
将一个大的 main.rs 文件重构为多个模块。

### 练习 4：工作空间项目
创建一个包含多个相关库的工作空间项目。

## 下一步

掌握了模块系统后，您可以继续学习：

1. [错误处理](./error-handling.md) - 优雅处理错误
2. [泛型](./generics.md) - 编写通用代码
3. [特征 (Traits)](./traits.md) - 定义共同行为

模块系统是组织大型 Rust 项目的基础，掌握它将帮助您构建可维护的应用程序！
