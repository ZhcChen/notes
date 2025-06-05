# 基本语法

本章介绍 Rust 编程语言的基本语法规则，包括关键字、标识符、字面量等基础概念。

## 关键字

Rust 有一系列保留关键字，不能用作标识符：

### 当前使用的关键字

```rust
// 控制流
if else match loop while for break continue return

// 函数和模块
fn mod pub use as extern crate

// 类型相关
struct enum union trait impl type

// 变量和所有权
let mut const static ref move

// 其他
true false self Self super where unsafe async await
```

### 保留关键字

这些关键字目前未使用，但为将来保留：

```
abstract become box do final macro override priv typeof unsized virtual yield try
```

## 标识符

### 命名规则

```rust
// 有效的标识符
let variable_name = 42;
let _private = true;
let number2 = 3.14;
let 中文变量 = "支持Unicode";

// 无效的标识符
// let 2number = 42;     // 不能以数字开头
// let if = 42;          // 不能使用关键字
// let my-var = 42;      // 不能使用连字符
```

### 命名约定

```rust
// 变量和函数：snake_case
let user_name = "Alice";
fn calculate_sum() {}

// 常量：SCREAMING_SNAKE_CASE
const MAX_SIZE: usize = 100;

// 类型：PascalCase
struct UserAccount {}
enum Color {}
trait Display {}

// 模块：snake_case
mod user_management {}
```

## 字面量

### 整数字面量

```rust
fn main() {
    // 十进制
    let decimal = 98_222;
    
    // 十六进制
    let hex = 0xff;
    
    // 八进制
    let octal = 0o77;
    
    // 二进制
    let binary = 0b1111_0000;
    
    // 字节（仅限 u8）
    let byte = b'A';
    
    // 类型后缀
    let typed = 42u32;
}
```

### 浮点数字面量

```rust
fn main() {
    let float1 = 2.0;      // f64
    let float2 = 3.14f32;  // f32
    let float3 = 1e6;      // 科学计数法
    let float4 = 2.5E-4;   // 科学计数法
}
```

### 字符和字符串字面量

```rust
fn main() {
    // 字符
    let c1 = 'a';
    let c2 = '中';
    let c3 = '🦀';
    let c4 = '\n';         // 转义字符
    let c5 = '\u{1F980}';  // Unicode 转义
    
    // 字符串
    let s1 = "Hello, world!";
    let s2 = "包含\n换行符";
    let s3 = r"原始字符串\n不转义";
    let s4 = r#"可以包含"双引号"#;
    
    // 字节字符串
    let bytes = b"hello";
}
```

### 布尔字面量

```rust
fn main() {
    let is_true = true;
    let is_false = false;
}
```

## 运算符

### 算术运算符

```rust
fn main() {
    let a = 10;
    let b = 3;
    
    println!("加法：{} + {} = {}", a, b, a + b);
    println!("减法：{} - {} = {}", a, b, a - b);
    println!("乘法：{} * {} = {}", a, b, a * b);
    println!("除法：{} / {} = {}", a, b, a / b);
    println!("取余：{} % {} = {}", a, b, a % b);
}
```

### 比较运算符

```rust
fn main() {
    let x = 5;
    let y = 10;
    
    println!("{} == {} : {}", x, y, x == y);  // 等于
    println!("{} != {} : {}", x, y, x != y);  // 不等于
    println!("{} < {} : {}", x, y, x < y);    // 小于
    println!("{} > {} : {}", x, y, x > y);    // 大于
    println!("{} <= {} : {}", x, y, x <= y);  // 小于等于
    println!("{} >= {} : {}", x, y, x >= y);  // 大于等于
}
```

### 逻辑运算符

```rust
fn main() {
    let a = true;
    let b = false;
    
    println!("!{} = {}", a, !a);           // 逻辑非
    println!("{} && {} = {}", a, b, a && b); // 逻辑与
    println!("{} || {} = {}", a, b, a || b); // 逻辑或
}
```

### 位运算符

```rust
fn main() {
    let a = 0b1100;
    let b = 0b1010;
    
    println!("按位与：{:04b} & {:04b} = {:04b}", a, b, a & b);
    println!("按位或：{:04b} | {:04b} = {:04b}", a, b, a | b);
    println!("按位异或：{:04b} ^ {:04b} = {:04b}", a, b, a ^ b);
    println!("按位非：!{:04b} = {:04b}", a, !a);
    println!("左移：{:04b} << 2 = {:04b}", a, a << 2);
    println!("右移：{:04b} >> 2 = {:04b}", a, a >> 2);
}
```

### 赋值运算符

```rust
fn main() {
    let mut x = 10;
    
    x += 5;   // x = x + 5
    println!("x += 5: {}", x);
    
    x -= 3;   // x = x - 3
    println!("x -= 3: {}", x);
    
    x *= 2;   // x = x * 2
    println!("x *= 2: {}", x);
    
    x /= 4;   // x = x / 4
    println!("x /= 4: {}", x);
    
    x %= 3;   // x = x % 3
    println!("x %= 3: {}", x);
}
```

## 表达式和语句

### 语句 vs 表达式

```rust
fn main() {
    // 语句：执行操作但不返回值
    let x = 5;  // let 语句
    
    // 表达式：计算并返回值
    let y = {
        let inner = 3;
        inner + 1  // 注意：没有分号，这是表达式
    };
    
    println!("x = {}, y = {}", x, y);
    
    // 函数调用是表达式
    let z = add_one(5);
    println!("z = {}", z);
}

fn add_one(x: i32) -> i32 {
    x + 1  // 返回表达式
}
```

### 块表达式

```rust
fn main() {
    let result = {
        let a = 2;
        let b = 3;
        a * b  // 块的值
    };
    
    println!("result = {}", result);
}
```

## 控制流基础

### if 表达式

```rust
fn main() {
    let number = 6;
    
    if number % 4 == 0 {
        println!("number is divisible by 4");
    } else if number % 3 == 0 {
        println!("number is divisible by 3");
    } else if number % 2 == 0 {
        println!("number is divisible by 2");
    } else {
        println!("number is not divisible by 4, 3, or 2");
    }
    
    // if 作为表达式
    let condition = true;
    let number = if condition { 5 } else { 6 };
    println!("The value of number is: {}", number);
}
```

### 循环

```rust
fn main() {
    // loop 循环
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2;  // 从循环返回值
        }
    };
    println!("The result is {}", result);
    
    // while 循环
    let mut number = 3;
    while number != 0 {
        println!("{}!", number);
        number -= 1;
    }
    println!("LIFTOFF!!!");
    
    // for 循环
    let a = [10, 20, 30, 40, 50];
    for element in a {
        println!("the value is: {}", element);
    }
    
    // 范围循环
    for number in 1..4 {
        println!("{}!", number);
    }
}
```

## 模式匹配基础

### match 表达式

```rust
fn main() {
    let number = 13;
    
    match number {
        1 => println!("One!"),
        2 | 3 | 5 | 7 | 11 => println!("This is a prime"),
        13..=19 => println!("A teen"),
        _ => println!("Ain't special"),
    }
    
    // match 作为表达式
    let boolean = true;
    let binary = match boolean {
        false => 0,
        true => 1,
    };
    println!("boolean as binary: {}", binary);
}
```

## 注释风格

### 普通注释

```rust
fn main() {
    // 单行注释
    
    /*
     * 多行注释
     * 可以跨越多行
     */
    
    let x = 5; // 行尾注释
}
```

### 文档注释

```rust
/// 计算两个数的和
/// 
/// # 参数
/// 
/// * `a` - 第一个数
/// * `b` - 第二个数
/// 
/// # 示例
/// 
/// ```
/// let result = add(2, 3);
/// assert_eq!(result, 5);
/// ```
fn add(a: i32, b: i32) -> i32 {
    a + b
}

//! 这是模块级文档注释
//! 描述整个模块的功能
```

## 属性

### 常用属性

```rust
// 允许未使用的变量
#[allow(unused_variables)]
fn main() {
    let unused = 42;
}

// 派生常用 trait
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

// 条件编译
#[cfg(target_os = "windows")]
fn windows_only() {
    println!("This only runs on Windows");
}

// 测试函数
#[test]
fn test_addition() {
    assert_eq!(2 + 2, 4);
}
```

## 练习

### 练习 1：运算符练习
编写一个程序，使用所有类型的运算符进行计算。

### 练习 2：控制流练习
编写一个程序，判断一个数是正数、负数还是零。

### 练习 3：循环练习
编写一个程序，计算 1 到 100 的和。

### 练习 4：模式匹配练习
编写一个程序，根据输入的数字输出对应的英文单词（1-10）。

## 下一步

掌握了基本语法后，您可以继续学习：

1. [变量与数据类型](./variables-types.md) - 深入了解 Rust 的类型系统
2. [函数](./functions.md) - 学习函数定义和调用
3. [所有权系统](./ownership.md) - Rust 最重要的概念

继续探索 Rust 的强大功能！
