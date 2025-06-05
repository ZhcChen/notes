# 枚举与模式匹配

枚举（Enum）允许您定义一个类型，它可以是几个可能的变体之一。枚举与模式匹配结合使用，是 Rust 中非常强大的特性，能够帮助您编写更安全、更表达性的代码。

## 定义枚举

### 基本枚举

```rust
// 定义枚举
enum IpAddrKind {
    V4,
    V6,
}

fn main() {
    // 创建枚举值
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;
    
    route(IpAddrKind::V4);
    route(IpAddrKind::V6);
}

fn route(ip_kind: IpAddrKind) {
    match ip_kind {
        IpAddrKind::V4 => println!("IPv4 地址"),
        IpAddrKind::V6 => println!("IPv6 地址"),
    }
}
```

### 带数据的枚举

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

fn main() {
    let home = IpAddr::V4(127, 0, 0, 1);
    let loopback = IpAddr::V6(String::from("::1"));
    
    print_ip(home);
    print_ip(loopback);
}

fn print_ip(ip: IpAddr) {
    match ip {
        IpAddr::V4(a, b, c, d) => {
            println!("IPv4: {}.{}.{}.{}", a, b, c, d);
        }
        IpAddr::V6(addr) => {
            println!("IPv6: {}", addr);
        }
    }
}
```

### 复杂枚举

```rust
enum Message {
    Quit,                       // 没有关联数据
    Move { x: i32, y: i32 },   // 命名字段
    Write(String),              // 单个字符串
    ChangeColor(i32, i32, i32), // 三个整数
}

impl Message {
    fn call(&self) {
        match self {
            Message::Quit => println!("退出消息"),
            Message::Move { x, y } => println!("移动到 ({}, {})", x, y),
            Message::Write(text) => println!("写入文本：{}", text),
            Message::ChangeColor(r, g, b) => println!("改变颜色为 RGB({}, {}, {})", r, g, b),
        }
    }
}

fn main() {
    let messages = vec![
        Message::Quit,
        Message::Move { x: 10, y: 20 },
        Message::Write(String::from("Hello")),
        Message::ChangeColor(255, 0, 0),
    ];
    
    for message in messages {
        message.call();
    }
}
```

## Option 枚举

### Option 的定义和使用

```rust
fn main() {
    let some_number = Some(5);
    let some_string = Some("a string");
    let absent_number: Option<i32> = None;
    
    println!("数字：{:?}", some_number);
    println!("字符串：{:?}", some_string);
    println!("空值：{:?}", absent_number);
    
    // 使用 Option
    let x: i8 = 5;
    let y: Option<i8> = Some(5);
    
    // let sum = x + y; // 错误！不能直接相加
    
    // 正确的方式
    match y {
        Some(value) => println!("和为：{}", x + value),
        None => println!("y 是 None"),
    }
}
```

### Option 的方法

```rust
fn main() {
    let some_value = Some(42);
    let no_value: Option<i32> = None;
    
    // is_some() 和 is_none()
    println!("some_value 是 Some：{}", some_value.is_some());
    println!("no_value 是 None：{}", no_value.is_none());
    
    // unwrap() - 危险！可能 panic
    println!("unwrap 值：{}", some_value.unwrap());
    // println!("{}", no_value.unwrap()); // 会 panic！
    
    // unwrap_or() - 提供默认值
    println!("unwrap_or 值：{}", no_value.unwrap_or(0));
    
    // expect() - 自定义 panic 消息
    println!("expect 值：{}", some_value.expect("应该有值"));
    
    // map() - 转换 Some 中的值
    let doubled = some_value.map(|x| x * 2);
    println!("翻倍后：{:?}", doubled);
    
    // and_then() - 链式操作
    let result = some_value.and_then(|x| {
        if x > 40 {
            Some(x * 2)
        } else {
            None
        }
    });
    println!("条件翻倍：{:?}", result);
}
```

## Result 枚举

### Result 的基本使用

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    // Result&lt;T, E&gt; 用于可能失败的操作
    let file_result = File::open("hello.txt");
    
    match file_result {
        Ok(file) => println!("文件打开成功：{:?}", file),
        Err(error) => match error.kind() {
            ErrorKind::NotFound => println!("文件未找到"),
            other_error => println!("打开文件时出错：{:?}", other_error),
        },
    }
    
    // 使用 unwrap_or_else
    let file = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("创建文件失败：{:?}", error);
            })
        } else {
            panic!("打开文件失败：{:?}", error);
        }
    });
}
```

### 错误传播

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut file = File::open("username.txt")?; // ? 运算符
    let mut username = String::new();
    file.read_to_string(&mut username)?;
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

fn main() {
    match read_username_from_file() {
        Ok(username) => println!("用户名：{}", username),
        Err(error) => println!("读取失败：{}", error),
    }
}
```

## match 表达式

### 基本 match

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("幸运便士！");
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {
    let coin = Coin::Penny;
    println!("硬币价值：{} 分", value_in_cents(coin));
}
```

### 绑定值的模式

```rust
#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
    California,
    // ... 其他州
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("来自 {:?} 州的 25 分硬币！", state);
            25
        }
    }
}

fn main() {
    let coin = Coin::Quarter(UsState::Alaska);
    println!("价值：{} 分", value_in_cents(coin));
}
```

### 匹配 Option&lt;T&gt;

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

fn main() {
    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
    
    println!("five: {:?}", five);
    println!("six: {:?}", six);
    println!("none: {:?}", none);
}
```

### 通配符和 _ 占位符

```rust
fn main() {
    let dice_roll = 9;
    
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        other => move_player(other), // 绑定其他值
    }
    
    // 使用 _ 忽略值
    match dice_roll {
        3 => add_fancy_hat(),
        7 => remove_fancy_hat(),
        _ => (), // 什么都不做
    }
}

fn add_fancy_hat() {
    println!("获得帽子！");
}

fn remove_fancy_hat() {
    println!("失去帽子！");
}

fn move_player(num_spaces: u8) {
    println!("移动 {} 步", num_spaces);
}
```

## if let 语法糖

### 基本 if let

```rust
fn main() {
    let config_max = Some(3u8);
    
    // 使用 match
    match config_max {
        Some(max) => println!("最大值是 {}", max),
        _ => (),
    }
    
    // 使用 if let（更简洁）
    if let Some(max) = config_max {
        println!("最大值是 {}", max);
    }
    
    // if let 与 else
    let coin = Coin::Penny;
    let mut count = 0;
    
    if let Coin::Quarter(state) = coin {
        println!("来自 {:?} 州的 25 分硬币！", state);
    } else {
        count += 1;
        println!("计数：{}", count);
    }
}

#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}
```

### while let 循环

```rust
fn main() {
    let mut stack = Vec::new();
    
    stack.push(1);
    stack.push(2);
    stack.push(3);
    
    // while let 循环
    while let Some(top) = stack.pop() {
        println!("弹出：{}", top);
    }
    
    println!("栈现在是空的");
}
```

## 模式匹配的高级用法

### 解构结构体和枚举

```rust
struct Point {
    x: i32,
    y: i32,
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let p = Point { x: 0, y: 7 };
    
    match p {
        Point { x, y: 0 } => println!("在 x 轴上，x = {}", x),
        Point { x: 0, y } => println!("在 y 轴上，y = {}", y),
        Point { x, y } => println!("在其他位置：({}, {})", x, y),
    }
    
    let msg = Message::ChangeColor(0, 160, 255);
    
    match msg {
        Message::Quit => println!("退出"),
        Message::Move { x, y } => println!("移动到 ({}, {})", x, y),
        Message::Write(text) => println!("文本消息：{}", text),
        Message::ChangeColor(r, g, b) => println!("改变颜色为 RGB({}, {}, {})", r, g, b),
    }
}
```

### 复杂模式匹配

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);
    
    match numbers {
        (first, .., last) => {
            println!("第一个：{}，最后一个：{}", first, last);
        }
    }
    
    // 匹配守卫
    let num = Some(4);
    
    match num {
        Some(x) if x < 5 => println!("小于 5：{}", x),
        Some(x) => println!("大于等于 5：{}", x),
        None => (),
    }
    
    // @ 绑定
    enum Message {
        Hello { id: i32 },
    }
    
    let msg = Message::Hello { id: 5 };
    
    match msg {
        Message::Hello { id: id_variable @ 3..=7 } => {
            println!("找到 id 在范围内：{}", id_variable);
        }
        Message::Hello { id: 10..=12 } => {
            println!("找到 id 在另一个范围内");
        }
        Message::Hello { id } => {
            println!("找到其他 id：{}", id);
        }
    }
}
```

## 实际应用示例

### 状态机

```rust
#[derive(Debug)]
enum State {
    Idle,
    Running { speed: u32 },
    Stopped,
    Error { code: u32, message: String },
}

struct Machine {
    state: State,
}

impl Machine {
    fn new() -> Machine {
        Machine { state: State::Idle }
    }
    
    fn start(&mut self, speed: u32) {
        match self.state {
            State::Idle | State::Stopped => {
                self.state = State::Running { speed };
                println!("机器启动，速度：{}", speed);
            }
            State::Running { .. } => {
                println!("机器已在运行");
            }
            State::Error { .. } => {
                println!("机器处于错误状态，无法启动");
            }
        }
    }
    
    fn stop(&mut self) {
        match self.state {
            State::Running { .. } => {
                self.state = State::Stopped;
                println!("机器已停止");
            }
            _ => {
                println!("机器未在运行");
            }
        }
    }
    
    fn error(&mut self, code: u32, message: String) {
        self.state = State::Error { code, message };
        println!("机器出错");
    }
    
    fn status(&self) {
        match &self.state {
            State::Idle => println!("状态：空闲"),
            State::Running { speed } => println!("状态：运行中，速度：{}", speed),
            State::Stopped => println!("状态：已停止"),
            State::Error { code, message } => {
                println!("状态：错误 - 代码：{}，消息：{}", code, message);
            }
        }
    }
}

fn main() {
    let mut machine = Machine::new();
    
    machine.status();
    machine.start(100);
    machine.status();
    machine.stop();
    machine.status();
    machine.error(404, String::from("传感器故障"));
    machine.status();
}
```

### JSON 解析器（简化版）

```rust
#[derive(Debug)]
enum JsonValue {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<JsonValue>),
    Object(std::collections::HashMap<String, JsonValue>),
}

impl JsonValue {
    fn type_name(&self) -> &'static str {
        match self {
            JsonValue::Null => "null",
            JsonValue::Bool(_) => "boolean",
            JsonValue::Number(_) => "number",
            JsonValue::String(_) => "string",
            JsonValue::Array(_) => "array",
            JsonValue::Object(_) => "object",
        }
    }
    
    fn is_truthy(&self) -> bool {
        match self {
            JsonValue::Null => false,
            JsonValue::Bool(b) => *b,
            JsonValue::Number(n) => *n != 0.0,
            JsonValue::String(s) => !s.is_empty(),
            JsonValue::Array(arr) => !arr.is_empty(),
            JsonValue::Object(obj) => !obj.is_empty(),
        }
    }
}

fn main() {
    use std::collections::HashMap;
    
    let values = vec![
        JsonValue::Null,
        JsonValue::Bool(true),
        JsonValue::Number(42.0),
        JsonValue::String(String::from("hello")),
        JsonValue::Array(vec![JsonValue::Number(1.0), JsonValue::Number(2.0)]),
        JsonValue::Object(HashMap::new()),
    ];
    
    for value in values {
        println!("类型：{}，真值：{}，值：{:?}", 
                 value.type_name(), value.is_truthy(), value);
    }
}
```

## 练习

### 练习 1：交通灯系统
创建一个交通灯枚举，实现状态转换和持续时间计算。

### 练习 2：计算器
设计一个计算器枚举，支持基本的数学运算。

### 练习 3：文件系统
创建文件系统节点枚举，区分文件和目录，实现大小计算。

### 练习 4：HTTP 状态码
设计 HTTP 状态码枚举，实现状态码分类和描述。

## 下一步

掌握了枚举与模式匹配后，您可以继续学习：

1. [模块系统](./modules.md) - 代码组织和可见性
2. [错误处理](./error-handling.md) - 优雅处理错误
3. [泛型](./generics.md) - 编写通用代码

枚举和模式匹配是 Rust 中非常强大的特性，它们让您能够编写更安全、更表达性的代码！
