# 特征 (Traits)

特征（Trait）定义了某个特定类型拥有可能与其他类型共享的功能。我们可以通过特征以一种抽象的方式定义共同行为。特征类似于其他语言中的接口（interface）。

## 定义特征

### 基本特征定义

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

### 为类型实现特征

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

fn main() {
    let tweet = Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    };

    println!("1 new tweet: {}", tweet.summarize());

    let article = NewsArticle {
        headline: String::from("Penguins win the Stanley Cup Championship!"),
        location: String::from("Pittsburgh, PA, USA"),
        author: String::from("Iceburgh"),
        content: String::from("The Pittsburgh Penguins once again are the best hockey team in the NHL."),
    };

    println!("New article available! {}", article.summarize());
}
```

## 默认实现

### 提供默认行为

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

// 使用默认实现
impl Summary for NewsArticle {}

fn main() {
    let article = NewsArticle {
        headline: String::from("Penguins win the Stanley Cup Championship!"),
        location: String::from("Pittsburgh, PA, USA"),
        author: String::from("Iceburgh"),
        content: String::from("The Pittsburgh Penguins once again are the best hockey team in the NHL."),
    };

    println!("New article available! {}", article.summarize());
}
```

### 默认实现调用其他方法

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}

impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}

fn main() {
    let tweet = Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    };

    println!("1 new tweet: {}", tweet.summarize());
}
```

## 特征作为参数

### 基本语法

```rust
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}

fn main() {
    let tweet = Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    };

    notify(&tweet);
}
```

### 特征约束语法

```rust
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}

// 多个特征约束
use std::fmt::Display;

pub fn notify_display<T: Summary + Display>(item: &T) {
    println!("Breaking news! {}", item.summarize());
    println!("Display: {}", item);
}
```

### where 子句

```rust
use std::fmt::{Debug, Display};

fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // 函数体
    42
}

fn main() {
    let t = "hello";
    let u = vec![1, 2, 3];
    let result = some_function(&t, &u);
    println!("Result: {}", result);
}
```

## 返回实现特征的类型

### 基本返回

```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    }
}

fn main() {
    let tweet = returns_summarizable();
    println!("Tweet: {}", tweet.summarize());
}
```

### 条件返回的限制

```rust
// 这样不行！不能根据条件返回不同类型
// fn returns_summarizable(switch: bool) -> impl Summary {
//     if switch {
//         NewsArticle {
//             headline: String::from("Penguins win the Stanley Cup Championship!"),
//             location: String::from("Pittsburgh, PA, USA"),
//             author: String::from("Iceburgh"),
//             content: String::from("The Pittsburgh Penguins once again are the best hockey team in the NHL."),
//         }
//     } else {
//         Tweet {
//             username: String::from("horse_ebooks"),
//             content: String::from("of course, as you probably already know, people"),
//             reply: false,
//             retweet: false,
//         }
//     }
// }
```

## 使用特征约束有条件地实现方法

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}

fn main() {
    let pair = Pair::new(5, 10);
    pair.cmp_display();
}
```

## 常用标准库特征

### Debug 特征

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect is {:?}", rect);
    println!("rect is {:#?}", rect);
}
```

### Clone 特征

```rust
#[derive(Debug, Clone)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = p1.clone();

    println!("p1: {:?}", p1);
    println!("p2: {:?}", p2);
}
```

### PartialEq 和 Eq 特征

```rust
#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = Point { x: 1, y: 2 };
    let p3 = Point { x: 2, y: 3 };

    println!("p1 == p2: {}", p1 == p2);
    println!("p1 == p3: {}", p1 == p3);
}
```

### PartialOrd 和 Ord 特征

```rust
#[derive(Debug, PartialEq, PartialOrd)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = Point { x: 2, y: 3 };

    println!("p1 < p2: {}", p1 < p2);
    println!("p1 > p2: {}", p1 > p2);
}
```

## 自定义特征实现

### Display 特征

```rust
use std::fmt;

struct Point {
    x: i32,
    y: i32,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let point = Point { x: 3, y: 4 };
    println!("Point: {}", point);
}
```

### From 和 Into 特征

```rust
#[derive(Debug)]
struct Number {
    value: i32,
}

impl From<i32> for Number {
    fn from(item: i32) -> Self {
        Number { value: item }
    }
}

fn main() {
    let num = Number::from(30);
    println!("Number: {:?}", num);

    // Into 是自动实现的
    let num2: Number = 42.into();
    println!("Number2: {:?}", num2);
}
```

### TryFrom 和 TryInto 特征

```rust
use std::convert::TryFrom;
use std::convert::TryInto;

#[derive(Debug, PartialEq)]
struct EvenNumber(i32);

impl TryFrom<i32> for EvenNumber {
    type Error = ();

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value % 2 == 0 {
            Ok(EvenNumber(value))
        } else {
            Err(())
        }
    }
}

fn main() {
    // TryFrom
    assert_eq!(EvenNumber::try_from(8), Ok(EvenNumber(8)));
    assert_eq!(EvenNumber::try_from(5), Err(()));

    // TryInto
    let result: Result<EvenNumber, ()> = 8i32.try_into();
    assert_eq!(result, Ok(EvenNumber(8)));

    let result: Result<EvenNumber, ()> = 5i32.try_into();
    assert_eq!(result, Err(()));
}
```

## 运算符重载

### 基本运算符

```rust
use std::ops::Add;

#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 1, y: 0 };
    let p2 = Point { x: 2, y: 3 };

    let p3 = p1 + p2;
    println!("{:?} + {:?} = {:?}", p1, p2, p3);
}
```

### 其他运算符

```rust
use std::ops::{Add, Sub, Mul, Div};

#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

impl Add for Point {
    type Output = Point;
    fn add(self, other: Point) -> Point {
        Point { x: self.x + other.x, y: self.y + other.y }
    }
}

impl Sub for Point {
    type Output = Point;
    fn sub(self, other: Point) -> Point {
        Point { x: self.x - other.x, y: self.y - other.y }
    }
}

impl Mul<f64> for Point {
    type Output = Point;
    fn mul(self, scalar: f64) -> Point {
        Point { x: self.x * scalar, y: self.y * scalar }
    }
}

fn main() {
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = Point { x: 3.0, y: 4.0 };

    println!("p1 + p2 = {:?}", p1 + p2);
    println!("p2 - p1 = {:?}", p2 - p1);
    println!("p1 * 2.0 = {:?}", p1 * 2.0);
}
```

## 特征对象

### 动态分发

```rust
trait Draw {
    fn draw(&self);
}

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

impl Draw for Circle {
    fn draw(&self) {
        println!("Drawing a circle with radius {}", self.radius);
    }
}

impl Draw for Rectangle {
    fn draw(&self) {
        println!("Drawing a rectangle {}x{}", self.width, self.height);
    }
}

fn main() {
    let shapes: Vec<Box<dyn Draw>> = vec![
        Box::new(Circle { radius: 5.0 }),
        Box::new(Rectangle { width: 10.0, height: 20.0 }),
    ];

    for shape in shapes {
        shape.draw();
    }
}
```

### 特征对象的限制

```rust
// 对象安全的特征
trait Draw {
    fn draw(&self);
}

// 不是对象安全的特征（有泛型参数）
trait Clone {
    fn clone(&self) -> Self;
}

// 不是对象安全的特征（有静态方法）
trait Factory {
    fn create() -> Self;
}
```

## 高级特征

### 关联类型

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}

struct Counter {
    current: usize,
    max: usize,
}

impl Counter {
    fn new(max: usize) -> Counter {
        Counter { current: 0, max }
    }
}

impl Iterator for Counter {
    type Item = usize;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.max {
            let current = self.current;
            self.current += 1;
            Some(current)
        } else {
            None
        }
    }
}

fn main() {
    let mut counter = Counter::new(3);
    while let Some(value) = counter.next() {
        println!("Value: {}", value);
    }
}
```

### 默认泛型类型参数

```rust
use std::ops::Add;

trait Add<Rhs=Self> {
    type Output;
    fn add(self, rhs: Rhs) -> Self::Output;
}

struct Millimeters(u32);
struct Meters(u32);

impl Add<Meters> for Millimeters {
    type Output = Millimeters;

    fn add(self, other: Meters) -> Millimeters {
        Millimeters(self.0 + (other.0 * 1000))
    }
}
```

## 实际应用示例

### 序列化特征

```rust
trait Serialize {
    fn serialize(&self) -> String;
}

trait Deserialize {
    fn deserialize(data: &str) -> Result<Self, String>
    where
        Self: Sized;
}

#[derive(Debug)]
struct User {
    name: String,
    age: u32,
}

impl Serialize for User {
    fn serialize(&self) -> String {
        format!("{}:{}", self.name, self.age)
    }
}

impl Deserialize for User {
    fn deserialize(data: &str) -> Result<Self, String> {
        let parts: Vec<&str> = data.split(':').collect();
        if parts.len() != 2 {
            return Err("Invalid format".to_string());
        }
        
        let age = parts[1].parse().map_err(|_| "Invalid age")?;
        Ok(User {
            name: parts[0].to_string(),
            age,
        })
    }
}

fn main() {
    let user = User {
        name: "Alice".to_string(),
        age: 30,
    };

    let serialized = user.serialize();
    println!("Serialized: {}", serialized);

    let deserialized = User::deserialize(&serialized).unwrap();
    println!("Deserialized: {:?}", deserialized);
}
```

## 练习

### 练习 1：几何图形
创建一个 `Shape` 特征，为不同的几何图形实现面积和周长计算。

### 练习 2：比较器
实现一个通用的比较器特征，支持不同的比较策略。

### 练习 3：转换器
创建类型转换特征，实现不同数据类型之间的转换。

### 练习 4：迭代器
实现自定义迭代器特征，遍历自定义数据结构。

## 下一步

掌握了特征后，您可以继续学习：

1. [生命周期](./lifetimes.md) - 引用的有效性
2. [函数式编程](./functional.md) - 闭包和迭代器
3. [智能指针](./smart-pointers.md) - 高级内存管理

特征是 Rust 中实现多态和代码复用的核心机制！
