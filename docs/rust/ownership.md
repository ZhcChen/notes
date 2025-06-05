# 所有权系统

所有权（Ownership）是 Rust 最独特和最重要的特性，它使 Rust 能够在不需要垃圾回收器的情况下保证内存安全。理解所有权是掌握 Rust 的关键。

## 什么是所有权

### 所有权规则

Rust 的所有权系统基于三个简单的规则：

1. **Rust 中的每一个值都有一个所有者（owner）**
2. **值在任一时刻有且只有一个所有者**
3. **当所有者离开作用域，这个值将被丢弃**

### 作用域

```rust
fn main() {
    {                      // s 在这里无效，它尚未声明
        let s = "hello";   // 从此处起，s 是有效的
        
        // 使用 s
        println!("{}", s);
    }                      // 此作用域已结束，s 不再有效
    
    // println!("{}", s);  // 错误！s 已经不在作用域内
}
```

## String 类型与所有权

### 字符串字面量 vs String

```rust
fn main() {
    // 字符串字面量：存储在程序二进制文件中，不可变
    let s1 = "hello";
    
    // String 类型：可变，存储在堆上
    let mut s2 = String::from("hello");
    s2.push_str(", world!");
    
    println!("字面量：{}", s1);
    println!("String：{}", s2);
}
```

### 内存分配

```rust
fn main() {
    {
        let s = String::from("hello"); // 从此处起，s 是有效的
        
        // 使用 s
        println!("{}", s);
    } // 此作用域已结束，s 不再有效，内存被自动释放
}
```

## 移动（Move）

### 基本移动

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 的值移动到了 s2
    
    println!("{}", s2); // 正确
    // println!("{}", s1); // 错误！s1 不再有效
}
```

### 移动的原因

```rust
fn main() {
    // 整数类型：实现了 Copy trait，会复制而不是移动
    let x = 5;
    let y = x;
    println!("x = {}, y = {}", x, y); // 都有效
    
    // String 类型：没有实现 Copy trait，会移动
    let s1 = String::from("hello");
    let s2 = s1; // 移动
    // println!("{}", s1); // 错误！
    println!("{}", s2); // 正确
}
```

### 函数调用中的移动

```rust
fn main() {
    let s = String::from("hello");
    
    takes_ownership(s); // s 的值移动到函数里
    // println!("{}", s); // 错误！s 不再有效
    
    let x = 5;
    makes_copy(x); // x 被复制到函数里
    println!("{}", x); // x 仍然有效
}

fn takes_ownership(some_string: String) {
    println!("{}", some_string);
} // some_string 离开作用域并被丢弃

fn makes_copy(some_integer: i32) {
    println!("{}", some_integer);
} // some_integer 离开作用域，但因为是 Copy 类型，没有特殊操作
```

### 返回值和所有权

```rust
fn main() {
    let s1 = gives_ownership();         // gives_ownership 将返回值移动给 s1
    let s2 = String::from("hello");     // s2 进入作用域
    let s3 = takes_and_gives_back(s2);  // s2 被移动到函数中，返回值移动给 s3
    
    println!("s1: {}", s1);
    println!("s3: {}", s3);
    // println!("s2: {}", s2); // 错误！s2 已被移动
}

fn gives_ownership() -> String {
    let some_string = String::from("yours");
    some_string // 返回 some_string 并移出给调用的函数
}

fn takes_and_gives_back(a_string: String) -> String {
    a_string // 返回 a_string 并移出给调用的函数
}
```

## 克隆（Clone）

### 深拷贝

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // 深拷贝
    
    println!("s1 = {}, s2 = {}", s1, s2); // 都有效
}
```

### Clone trait

```rust
#[derive(Clone)]
struct Person {
    name: String,
    age: u32,
}

fn main() {
    let person1 = Person {
        name: String::from("Alice"),
        age: 30,
    };
    
    let person2 = person1.clone(); // 克隆整个结构体
    
    println!("Person1: {} ({})", person1.name, person1.age);
    println!("Person2: {} ({})", person2.name, person2.age);
}
```

## Copy trait

### 实现 Copy 的类型

```rust
fn main() {
    // 这些类型实现了 Copy trait
    let x: i32 = 5;
    let y: f64 = 3.14;
    let z: bool = true;
    let c: char = 'a';
    
    // 元组（如果所有元素都是 Copy 的）
    let tuple: (i32, bool) = (5, true);
    
    // 数组（如果元素是 Copy 的）
    let array: [i32; 3] = [1, 2, 3];
    
    // 这些都会复制而不是移动
    let x2 = x;
    let y2 = y;
    let z2 = z;
    let c2 = c;
    let tuple2 = tuple;
    let array2 = array;
    
    // 原变量仍然有效
    println!("原变量：{}, {}, {}, {}", x, y, z, c);
    println!("新变量：{}, {}, {}, {}", x2, y2, z2, c2);
}
```

### 自定义 Copy 类型

```rust
#[derive(Copy, Clone)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = p1; // 复制，不是移动
    
    println!("p1: ({}, {})", p1.x, p1.y); // p1 仍然有效
    println!("p2: ({}, {})", p2.x, p2.y);
}
```

## 所有权与函数

### 避免所有权转移

```rust
fn main() {
    let s = String::from("hello");
    
    // 方法1：使用引用（推荐）
    let len = calculate_length(&s);
    println!("'{}' 的长度是 {}", s, len); // s 仍然有效
    
    // 方法2：返回所有权
    let (s2, len2) = calculate_length_and_return(s);
    println!("'{}' 的长度是 {}", s2, len2);
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s 离开作用域，但因为它不拥有引用值，所以什么也不会发生

fn calculate_length_and_return(s: String) -> (String, usize) {
    let length = s.len();
    (s, length) // 返回 String 的所有权
}
```

### 所有权模式

```rust
fn main() {
    let mut data = vec![1, 2, 3, 4, 5];
    
    // 模式1：借用
    process_data(&data);
    println!("数据仍然可用：{:?}", data);
    
    // 模式2：可变借用
    modify_data(&mut data);
    println!("修改后的数据：{:?}", data);
    
    // 模式3：转移所有权
    let processed = consume_data(data);
    println!("处理后的数据：{:?}", processed);
    // println!("{:?}", data); // 错误！data 已被移动
}

fn process_data(data: &Vec<i32>) {
    println!("处理数据：{:?}", data);
}

fn modify_data(data: &mut Vec<i32>) {
    data.push(6);
}

fn consume_data(mut data: Vec<i32>) -> Vec<i32> {
    data.iter_mut().for_each(|x| *x *= 2);
    data
}
```

## 所有权与集合

### Vec 的所有权

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    
    // 移动元素
    let first = v.remove(0); // 移动第一个元素
    println!("移动的元素：{}", first);
    println!("剩余元素：{:?}", v);
    
    // 克隆元素
    let second = v[0].clone(); // 对于 i32，clone 等同于 copy
    println!("克隆的元素：{}", second);
    println!("原向量：{:?}", v);
}
```

### HashMap 的所有权

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    
    // 对于 Copy 类型
    let key1 = 1;
    let value1 = 100;
    map.insert(key1, value1);
    println!("key1: {}, value1: {}", key1, value1); // 仍然有效
    
    // 对于非 Copy 类型
    let key2 = String::from("hello");
    let value2 = String::from("world");
    map.insert(key2, value2);
    // println!("{}, {}", key2, value2); // 错误！已被移动
    
    println!("Map: {:?}", map);
}
```

## 所有权最佳实践

### 选择合适的所有权策略

```rust
// 1. 当函数不需要拥有数据时，使用借用
fn print_string(s: &String) {
    println!("{}", s);
}

// 2. 当函数需要修改数据时，使用可变借用
fn append_exclamation(s: &mut String) {
    s.push('!');
}

// 3. 当函数需要拥有数据时，转移所有权
fn consume_string(s: String) -> String {
    format!("Consumed: {}", s)
}

// 4. 当需要返回新数据时，返回所有权
fn create_greeting(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    let mut s = String::from("Hello");
    
    print_string(&s);           // 借用
    append_exclamation(&mut s); // 可变借用
    println!("{}", s);
    
    let greeting = create_greeting("World"); // 获得新数据的所有权
    let consumed = consume_string(s);        // 转移所有权
    
    println!("{}", greeting);
    println!("{}", consumed);
}
```

### 避免常见错误

```rust
fn main() {
    // 错误1：使用已移动的值
    let s1 = String::from("hello");
    let s2 = s1;
    // println!("{}", s1); // 错误！
    
    // 正确做法：克隆或使用引用
    let s3 = String::from("hello");
    let s4 = s3.clone();
    println!("{}, {}", s3, s4); // 正确
    
    // 错误2：返回局部变量的引用
    // fn dangle() -> &String {
    //     let s = String::from("hello");
    //     &s // 错误！返回悬垂引用
    // }
    
    // 正确做法：返回所有权
    fn no_dangle() -> String {
        let s = String::from("hello");
        s // 正确：移动所有权
    }
    
    let s = no_dangle();
    println!("{}", s);
}
```

## 练习

### 练习 1：所有权转移
编写一个函数，接受一个 String，在其末尾添加文本，然后返回修改后的 String。

### 练习 2：所有权分析
分析以下代码的所有权变化，并修复编译错误：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    let s3 = s1; // 这里会出错
    println!("{}, {}", s2, s3);
}
```

### 练习 3：函数所有权
编写一个函数，计算字符串向量中所有字符串的总长度，不转移向量的所有权。

### 练习 4：所有权重构
重构以下代码，使其更高效地处理所有权：

```rust
fn process_strings(strings: Vec<String>) -> Vec<String> {
    let mut result = Vec::new();
    for s in strings {
        result.push(s.to_uppercase());
    }
    result
}
```

## 下一步

理解了所有权后，您可以继续学习：

1. [借用与引用](./borrowing.md) - 深入了解借用机制
2. [切片](./slices.md) - 引用集合的一部分
3. [结构体](./structs.md) - 创建自定义数据类型

所有权是 Rust 的核心概念，掌握它将帮助您编写安全、高效的 Rust 代码！
