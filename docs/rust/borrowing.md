# 借用与引用

借用（Borrowing）是 Rust 所有权系统的重要组成部分，它允许我们使用值而不获取其所有权。通过引用，我们可以安全地访问数据而不移动它。

## 什么是引用

引用就像一个指针，因为它是一个地址，我们可以由此访问储存于该地址的属于其他变量的数据。与指针不同，引用确保指向某个特定类型的有效值。

### 基本引用

```rust
fn main() {
    let s1 = String::from("hello");
    
    let len = calculate_length(&s1); // &s1 创建一个指向 s1 的引用
    
    println!("'{}' 的长度是 {}", s1, len); // s1 仍然有效
}

fn calculate_length(s: &String) -> usize { // s 是对 String 的引用
    s.len()
} // 这里，s 离开了作用域。但因为它并不拥有引用值的所有权，所以什么也不会发生
```

### 引用的规则

Rust 的借用检查器确保引用总是有效的，基于以下规则：

1. **在任意给定时间，要么只能有一个可变引用，要么只能有多个不可变引用**
2. **引用必须总是有效的**

## 不可变引用

### 多个不可变引用

```rust
fn main() {
    let s = String::from("hello");
    
    let r1 = &s; // 没问题
    let r2 = &s; // 没问题
    let r3 = &s; // 没问题
    
    println!("{}, {}, {}", r1, r2, r3);
    
    // 可以同时存在多个不可变引用
    print_string(&s);
    print_string(&s);
    print_string(&s);
}

fn print_string(s: &String) {
    println!("字符串：{}", s);
}
```

### 不可变引用的限制

```rust
fn main() {
    let s = String::from("hello");
    let r = &s;
    
    // 不能通过不可变引用修改值
    // r.push_str(", world"); // 错误！
    
    println!("引用：{}", r);
}
```

## 可变引用

### 基本可变引用

```rust
fn main() {
    let mut s = String::from("hello");
    
    change(&mut s); // 传递可变引用
    
    println!("{}", s); // 输出：hello, world
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```

### 可变引用的限制

```rust
fn main() {
    let mut s = String::from("hello");
    
    let r1 = &mut s; // 没问题
    // let r2 = &mut s; // 错误！不能同时有两个可变引用
    
    println!("{}", r1);
    
    // 在 r1 使用完后，可以创建新的可变引用
    let r2 = &mut s; // 现在没问题
    println!("{}", r2);
}
```

### 可变引用与不可变引用不能共存

```rust
fn main() {
    let mut s = String::from("hello");
    
    let r1 = &s; // 没问题
    let r2 = &s; // 没问题
    // let r3 = &mut s; // 错误！不能在有不可变引用时创建可变引用
    
    println!("{} and {}", r1, r2);
    // 变量 r1 和 r2 不会再被使用
    
    let r3 = &mut s; // 现在没问题
    println!("{}", r3);
}
```

## 引用的作用域

### 非词法作用域生命周期（NLL）

```rust
fn main() {
    let mut s = String::from("hello");
    
    let r1 = &s; // 没问题
    let r2 = &s; // 没问题
    println!("{} and {}", r1, r2);
    // 此位置之后 r1 和 r2 不再使用
    
    let r3 = &mut s; // 没问题
    println!("{}", r3);
}
```

### 引用的生命周期

```rust
fn main() {
    let r;
    
    {
        let x = 5;
        r = &x; // 错误！x 的生命周期比 r 短
    } // x 在这里离开作用域
    
    // println!("r: {}", r); // 错误！悬垂引用
}
```

## 函数中的引用

### 参数引用

```rust
fn main() {
    let s = String::from("hello world");
    
    let word = first_word(&s);
    println!("第一个单词：{}", word);
    
    let mut s2 = String::from("hello world");
    let word2 = first_word_mut(&mut s2);
    word2.make_ascii_uppercase();
    println!("修改后：{}", s2);
}

fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();
    
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    
    &s[..]
}

fn first_word_mut(s: &mut String) -> &mut str {
    let len = s.len();
    let bytes = s.as_bytes();
    
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &mut s[0..i];
        }
    }
    
    &mut s[0..len]
}
```

### 返回引用

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = String::from("world");
    
    let result = longest(&s1, &s2);
    println!("最长的字符串是：{}", result);
}

// 需要生命周期参数
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

## 解引用

### 基本解引用

```rust
fn main() {
    let x = 5;
    let y = &x;
    
    assert_eq!(5, x);
    assert_eq!(5, *y); // 解引用 y 来获取值
    
    // 字符串引用
    let s = String::from("hello");
    let r = &s;
    
    println!("字符串：{}", s);
    println!("引用：{}", r);
    println!("解引用：{}", *r); // 不常用，因为 String 实现了 Display
}
```

### 自动解引用

```rust
fn main() {
    let s = String::from("hello world");
    let r = &s;
    
    // 这些调用是等价的
    println!("长度1：{}", s.len());
    println!("长度2：{}", r.len());      // 自动解引用
    println!("长度3：{}", (*r).len());   // 显式解引用
}
```

## 引用模式

### 结构体中的引用

```rust
struct Person<'a> {
    name: &'a str,
    age: u32,
}

fn main() {
    let name = String::from("Alice");
    let person = Person {
        name: &name,
        age: 30,
    };
    
    println!("姓名：{}，年龄：{}", person.name, person.age);
}
```

### 方法中的引用

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 不可变借用 self
    fn area(&self) -> u32 {
        self.width * self.height
    }
    
    // 可变借用 self
    fn double(&mut self) {
        self.width *= 2;
        self.height *= 2;
    }
    
    // 获取 self 的所有权
    fn into_square(self) -> Rectangle {
        let size = std::cmp::max(self.width, self.height);
        Rectangle {
            width: size,
            height: size,
        }
    }
}

fn main() {
    let mut rect = Rectangle {
        width: 30,
        height: 50,
    };
    
    println!("面积：{}", rect.area());
    
    rect.double();
    println!("翻倍后面积：{}", rect.area());
    
    let square = rect.into_square(); // rect 被移动
    println!("正方形面积：{}", square.area());
}
```

## 常见错误和解决方案

### 悬垂引用

```rust
// 错误示例
fn dangle() -> &String { // 返回字符串的引用
    let s = String::from("hello"); // s 是一个新字符串
    &s // 返回字符串 s 的引用
} // 这里 s 离开作用域并被丢弃。其内存被释放。危险！

// 正确做法
fn no_dangle() -> String {
    let s = String::from("hello");
    s // 直接返回字符串，转移所有权
}
```

### 借用检查器错误

```rust
fn main() {
    let mut data = vec![1, 2, 3, 4, 5];
    
    // 错误：同时存在可变和不可变引用
    // let first = &data[0];
    // data.push(6); // 错误！
    // println!("第一个元素：{}", first);
    
    // 正确做法1：分开使用
    let first = data[0]; // 复制值而不是借用
    data.push(6);
    println!("第一个元素：{}", first);
    
    // 正确做法2：限制引用作用域
    {
        let first = &data[0];
        println!("第一个元素：{}", first);
    } // first 的作用域结束
    data.push(7); // 现在可以修改
}
```

## 最佳实践

### 选择合适的引用类型

```rust
// 优先使用不可变引用
fn read_data(data: &Vec<i32>) {
    for item in data {
        println!("{}", item);
    }
}

// 只在需要修改时使用可变引用
fn modify_data(data: &mut Vec<i32>) {
    data.push(42);
}

// 只在需要所有权时获取所有权
fn consume_data(data: Vec<i32>) -> i32 {
    data.iter().sum()
}

fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];
    
    read_data(&numbers);        // 借用
    modify_data(&mut numbers);  // 可变借用
    let sum = consume_data(numbers); // 转移所有权
    
    println!("总和：{}", sum);
}
```

### 避免过度借用

```rust
fn main() {
    let s = String::from("hello");
    
    // 不好：不必要的引用
    let len = calculate_length(&s);
    
    // 更好：直接传递值（如果类型实现了 Copy）
    let x = 5;
    let doubled = double(x); // 而不是 double(&x)
    
    println!("长度：{}，翻倍：{}", len, doubled);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}

fn double(x: i32) -> i32 {
    x * 2
}
```

## 练习

### 练习 1：引用基础
编写一个函数，接受两个字符串引用，返回较长的那个。

### 练习 2：可变引用
编写一个函数，接受一个可变向量引用，移除所有偶数。

### 练习 3：借用检查器
修复以下代码中的借用检查器错误：

```rust
fn main() {
    let mut s = String::from("hello");
    let r1 = &s;
    let r2 = &mut s;
    println!("{}, {}", r1, r2);
}
```

### 练习 4：引用与所有权
重写以下函数，使其不获取参数的所有权：

```rust
fn process_string(s: String) -> usize {
    s.len()
}
```

## 下一步

掌握了借用与引用后，您可以继续学习：

1. [切片](./slices.md) - 引用集合的一部分
2. [结构体](./structs.md) - 创建自定义数据类型
3. [生命周期](./lifetimes.md) - 深入理解引用的有效性

借用是 Rust 内存安全的关键机制，理解它将帮助您编写更安全、更高效的代码！
