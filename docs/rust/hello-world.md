# 第一个 Rust 程序

让我们从编写第一个 Rust 程序开始，了解 Rust 的基本结构和工作流程。

## Hello, World!

### 创建项目

首先创建一个新的 Rust 项目：

```bash
cargo new hello_world
cd hello_world
```

这会创建以下目录结构：

```
hello_world/
├── Cargo.toml
└── src/
    └── main.rs
```

### 查看生成的代码

打开 `src/main.rs` 文件，您会看到：

```rust
fn main() {
    println!("Hello, world!");
}
```

### 运行程序

在项目根目录运行：

```bash
cargo run
```

输出：
```
   Compiling hello_world v0.1.0 (/path/to/hello_world)
    Finished dev [unoptimized + debuginfo] target(s) in 0.50s
     Running `target/debug/hello_world`
Hello, world!
```

## 代码解析

让我们分析这个简单的程序：

### main 函数

```rust
fn main() {
    // 函数体
}
```

- `fn` 关键字定义函数
- `main` 是程序的入口点
- `()` 表示函数不接受参数
- `{}` 包含函数体

### println! 宏

```rust
println!("Hello, world!");
```

- `println!` 是一个宏（注意感叹号 `!`）
- 用于向控制台打印文本并换行
- 字符串字面量用双引号包围

## 编译过程

### 手动编译

您也可以直接使用 `rustc` 编译器：

```bash
rustc src/main.rs
./main  # Linux/macOS
# 或
main.exe  # Windows
```

### Cargo vs rustc

| 特性 | rustc | cargo |
|------|-------|-------|
| 适用场景 | 单文件程序 | 项目管理 |
| 依赖管理 | 手动 | 自动 |
| 构建配置 | 命令行参数 | Cargo.toml |
| 推荐使用 | 学习/实验 | 实际开发 |

## 更多示例

### 带变量的程序

```rust
fn main() {
    let name = "Rust";
    let version = 2024;
    
    println!("Hello, {}!", name);
    println!("Edition: {}", version);
    println!("Welcome to {} {} edition!", name, version);
}
```

### 用户输入

```rust
use std::io;

fn main() {
    println!("请输入您的姓名：");
    
    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .expect("读取输入失败");
    
    println!("您好，{}！", input.trim());
}
```

### 简单计算

```rust
fn main() {
    let x = 5;
    let y = 10;
    let sum = x + y;
    
    println!("{} + {} = {}", x, y, sum);
    
    // 更多运算
    println!("减法：{} - {} = {}", y, x, y - x);
    println!("乘法：{} * {} = {}", x, y, x * y);
    println!("除法：{} / {} = {}", y, x, y / x);
    println!("取余：{} % {} = {}", y, x, y % x);
}
```

## 格式化输出

### 基本格式化

```rust
fn main() {
    let name = "Alice";
    let age = 30;
    let height = 1.68;
    
    // 位置参数
    println!("{} is {} years old", name, age);
    
    // 命名参数
    println!("{name} is {age} years old", name = name, age = age);
    
    // 数字格式化
    println!("Height: {:.2} meters", height);  // 保留2位小数
    println!("Age in hex: {:x}", age);         // 十六进制
    println!("Age in binary: {:b}", age);      // 二进制
}
```

### 调试输出

```rust
#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
}

fn main() {
    let person = Person {
        name: String::from("Bob"),
        age: 25,
    };
    
    // 调试格式输出
    println!("{:?}", person);
    
    // 美化调试输出
    println!("{:#?}", person);
}
```

## 注释

### 行注释

```rust
fn main() {
    // 这是单行注释
    println!("Hello, world!"); // 行尾注释
}
```

### 块注释

```rust
fn main() {
    /*
     * 这是块注释
     * 可以跨越多行
     */
    println!("Hello, world!");
}
```

### 文档注释

```rust
/// 这是文档注释
/// 用于生成文档
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    greet("World");
}
```

## 常见错误

### 忘记分号

```rust
fn main() {
    println!("Hello, world!")  // 错误：缺少分号
}
```

错误信息：
```
error: expected `;`, found `}`
```

### 拼写错误

```rust
fn main() {
    printl!("Hello, world!");  // 错误：拼写错误
}
```

### 未使用的变量

```rust
fn main() {
    let unused_var = 42;  // 警告：未使用的变量
    println!("Hello, world!");
}
```

警告信息：
```
warning: unused variable: `unused_var`
```

可以使用下划线前缀忽略警告：
```rust
fn main() {
    let _unused_var = 42;  // 不会产生警告
    println!("Hello, world!");
}
```

## 练习

### 练习 1：个人信息
编写一个程序，输出您的姓名、年龄和爱好。

### 练习 2：简单计算器
编写一个程序，计算两个数的四则运算结果。

### 练习 3：温度转换
编写一个程序，将摄氏度转换为华氏度。
公式：F = C × 9/5 + 32

### 练习 4：用户交互
编写一个程序，询问用户的姓名和年龄，然后输出个性化的问候语。

## 下一步

现在您已经了解了 Rust 程序的基本结构，接下来可以学习：

1. [基本语法](./basic-syntax.md) - 了解 Rust 的语法规则
2. [变量与数据类型](./variables-types.md) - 深入了解 Rust 的类型系统
3. [函数](./functions.md) - 学习如何定义和使用函数

继续您的 Rust 学习之旅吧！
