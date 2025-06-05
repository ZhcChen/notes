# 变量与数据类型

Rust 是一门静态类型语言，这意味着在编译时必须知道所有变量的类型。本章将详细介绍 Rust 的变量系统和数据类型。

## 变量

### 变量声明

```rust
fn main() {
    // 不可变变量（默认）
    let x = 5;
    println!("x 的值是：{}", x);
    
    // x = 6; // 错误！不能修改不可变变量
    
    // 可变变量
    let mut y = 5;
    println!("y 的值是：{}", y);
    y = 6; // 正确！可以修改可变变量
    println!("y 的值是：{}", y);
}
```

### 变量遮蔽（Shadowing）

```rust
fn main() {
    let x = 5;
    let x = x + 1;  // 遮蔽前一个 x
    
    {
        let x = x * 2;  // 在内部作用域遮蔽
        println!("内部作用域中 x 的值是：{}", x); // 12
    }
    
    println!("外部作用域中 x 的值是：{}", x); // 6
    
    // 遮蔽允许改变类型
    let spaces = "   ";
    let spaces = spaces.len(); // 从字符串变为数字
}
```

### 常量

```rust
// 全局常量
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;

fn main() {
    // 局部常量
    const MAX_POINTS: u32 = 100_000;
    
    println!("最大分数：{}", MAX_POINTS);
    println!("三小时的秒数：{}", THREE_HOURS_IN_SECONDS);
}
```

## 标量类型

### 整数类型

```rust
fn main() {
    // 有符号整数
    let a: i8 = -128;      // -128 到 127
    let b: i16 = -32768;   // -32,768 到 32,767
    let c: i32 = -2147483648; // 默认整数类型
    let d: i64 = -9223372036854775808;
    let e: i128 = -170141183460469231731687303715884105728;
    let f: isize = -9223372036854775808; // 依赖架构
    
    // 无符号整数
    let g: u8 = 255;       // 0 到 255
    let h: u16 = 65535;    // 0 到 65,535
    let i: u32 = 4294967295;
    let j: u64 = 18446744073709551615;
    let k: u128 = 340282366920938463463374607431768211455;
    let l: usize = 18446744073709551615; // 依赖架构
    
    println!("各种整数类型：{}, {}, {}, {}, {}, {}", a, b, c, d, e, f);
    println!("无符号整数：{}, {}, {}, {}, {}, {}", g, h, i, j, k, l);
}
```

### 整数字面量

```rust
fn main() {
    let decimal = 98_222;        // 十进制
    let hex = 0xff;              // 十六进制
    let octal = 0o77;            // 八进制
    let binary = 0b1111_0000;    // 二进制
    let byte = b'A';             // 字节（仅限 u8）
    
    println!("十进制：{}", decimal);
    println!("十六进制：{}", hex);
    println!("八进制：{}", octal);
    println!("二进制：{}", binary);
    println!("字节：{}", byte);
}
```

### 浮点类型

```rust
fn main() {
    let x = 2.0;      // f64（默认）
    let y: f32 = 3.0; // f32
    
    // 浮点运算
    let sum = x + y as f64;
    let difference = 95.5 - 4.3;
    let product = 4.0 * 30.0;
    let quotient = 56.7 / 32.2;
    let remainder = 43.0 % 5.0;
    
    println!("浮点运算结果：{}, {}, {}, {}, {}", 
             sum, difference, product, quotient, remainder);
}
```

### 布尔类型

```rust
fn main() {
    let t = true;
    let f: bool = false; // 显式类型注解
    
    println!("布尔值：{}, {}", t, f);
    
    // 布尔运算
    println!("逻辑与：{}", t && f);
    println!("逻辑或：{}", t || f);
    println!("逻辑非：{}", !t);
}
```

### 字符类型

```rust
fn main() {
    let c = 'z';
    let z: char = 'ℤ'; // 显式类型注解
    let heart_eyed_cat = '😻';
    let chinese = '中';
    
    println!("字符：{}, {}, {}, {}", c, z, heart_eyed_cat, chinese);
    
    // 字符的大小
    println!("char 的大小：{} 字节", std::mem::size_of::<char>());
}
```

## 复合类型

### 元组类型

```rust
fn main() {
    // 创建元组
    let tup: (i32, f64, u8) = (500, 6.4, 1);
    
    // 解构元组
    let (x, y, z) = tup;
    println!("解构后的值：{}, {}, {}", x, y, z);
    
    // 通过索引访问
    let five_hundred = tup.0;
    let six_point_four = tup.1;
    let one = tup.2;
    println!("索引访问：{}, {}, {}", five_hundred, six_point_four, one);
    
    // 单元类型（空元组）
    let unit: () = ();
    println!("单元类型的大小：{} 字节", std::mem::size_of_val(&unit));
}
```

### 数组类型

```rust
fn main() {
    // 创建数组
    let a = [1, 2, 3, 4, 5];
    let months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
    
    // 指定类型和长度
    let a: [i32; 5] = [1, 2, 3, 4, 5];
    
    // 初始化相同值
    let a = [3; 5]; // 等同于 [3, 3, 3, 3, 3]
    
    // 访问数组元素
    let first = a[0];
    let second = a[1];
    println!("数组元素：{}, {}", first, second);
    
    // 数组长度
    println!("数组长度：{}", a.len());
    
    // 遍历数组
    for element in &a {
        println!("元素：{}", element);
    }
    
    // 带索引遍历
    for (index, element) in a.iter().enumerate() {
        println!("索引 {} 的值是：{}", index, element);
    }
}
```

## 字符串类型

### 字符串字面量

```rust
fn main() {
    // 字符串字面量（&str）
    let s1 = "hello";
    let s2: &str = "world";
    
    // 原始字符串
    let raw_str = r"C:\Users\Name\Documents";
    let raw_str_with_quotes = r#"He said "Hello""#;
    
    println!("字符串：{}, {}", s1, s2);
    println!("原始字符串：{}", raw_str);
    println!("包含引号的原始字符串：{}", raw_str_with_quotes);
}
```

### String 类型

```rust
fn main() {
    // 创建 String
    let mut s = String::new();
    let s1 = String::from("hello");
    let s2 = "world".to_string();
    
    // 修改 String
    s.push_str("hello");
    s.push(' ');
    s.push_str("world");
    
    println!("String：{}", s);
    
    // 字符串连接
    let s3 = s1 + " " + &s2; // s1 被移动，不能再使用
    println!("连接后：{}", s3);
    
    // 使用 format! 宏
    let s4 = format!("{} {}", "hello", "world");
    println!("格式化：{}", s4);
}
```

## 类型转换

### 显式转换

```rust
fn main() {
    // 数值类型转换
    let a = 13u8;
    let b = 7u32;
    let c = a as u32 + b;
    println!("类型转换：{}", c);
    
    // 浮点数转换
    let x = 3.14f64;
    let y = x as f32;
    let z = x as i32; // 截断小数部分
    println!("浮点转换：{}, {}", y, z);
    
    // 字符转换
    let ch = 'A';
    let ascii = ch as u8;
    println!("字符 '{}' 的 ASCII 值：{}", ch, ascii);
}
```

### 解析转换

```rust
fn main() {
    // 字符串解析为数字
    let num_str = "42";
    let num: i32 = num_str.parse().expect("不是有效数字");
    println!("解析的数字：{}", num);
    
    // 使用 turbofish 语法
    let num2 = "3.14".parse::<f64>().expect("不是有效浮点数");
    println!("解析的浮点数：{}", num2);
    
    // 处理解析错误
    let invalid = "abc";
    match invalid.parse::<i32>() {
        Ok(n) => println!("解析成功：{}", n),
        Err(e) => println!("解析失败：{}", e),
    }
}
```

## 类型推断

```rust
fn main() {
    // Rust 可以推断类型
    let x = 5;        // i32
    let y = 3.14;     // f64
    let z = true;     // bool
    let ch = 'A';     // char
    
    // 有时需要类型注解
    let numbers: Vec<i32> = Vec::new();
    
    // 或者通过使用方式推断
    let mut numbers = Vec::new();
    numbers.push(1); // 现在 Rust 知道这是 Vec<i32>
    
    println!("推断的类型正常工作");
}
```

## 类型别名

```rust
// 类型别名
type Kilometers = i32;
type Result<T> = std::result::Result<T, std::io::Error>;

fn main() {
    let distance: Kilometers = 100;
    println!("距离：{} 公里", distance);
}

// 函数返回类型别名
fn read_file() -> Result<String> {
    // 实现省略
    Ok(String::from("文件内容"))
}
```

## 练习

### 练习 1：类型探索
创建不同类型的变量，并打印它们的值和大小。

### 练习 2：数组操作
创建一个数组，计算所有元素的和与平均值。

### 练习 3：字符串处理
创建一个程序，将用户输入的字符串转换为大写。

### 练习 4：类型转换
编写一个程序，将摄氏度转换为华氏度（涉及浮点数计算）。

### 练习 5：元组应用
使用元组表示一个点的坐标，并计算两点之间的距离。

## 下一步

了解了变量和数据类型后，您可以继续学习：

1. [函数](./functions.md) - 学习如何定义和使用函数
2. [所有权系统](./ownership.md) - Rust 最重要的概念
3. [结构体](./structs.md) - 创建自定义数据类型

掌握这些基础知识将为您后续的 Rust 学习打下坚实的基础！
