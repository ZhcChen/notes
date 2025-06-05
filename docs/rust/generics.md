# 泛型

泛型（Generics）允许我们编写可以处理多种类型的代码，而不需要为每种类型重复编写相同的逻辑。泛型是 Rust 中实现代码复用的重要机制。

## 函数中的泛型

### 基本泛型函数

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    
    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];
    let result = largest(&number_list);
    println!("最大的数字是 {}", result);
    
    let char_list = vec!['y', 'm', 'a', 'q'];
    let result = largest(&char_list);
    println!("最大的字符是 {}", result);
}
```

### 多个泛型参数

```rust
fn make_pair<T, U>(first: T, second: U) -> (T, U) {
    (first, second)
}

fn main() {
    let pair1 = make_pair(5, "hello");
    let pair2 = make_pair(3.14, true);
    let pair3 = make_pair("world", 42);
    
    println!("pair1: {:?}", pair1);
    println!("pair2: {:?}", pair2);
    println!("pair3: {:?}", pair3);
}
```

## 结构体中的泛型

### 基本泛型结构体

```rust
#[derive(Debug)]
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn new(x: T, y: T) -> Point<T> {
        Point { x, y }
    }
    
    fn x(&self) -> &T {
        &self.x
    }
    
    fn y(&self) -> &T {
        &self.y
    }
}

fn main() {
    let integer_point = Point::new(5, 10);
    let float_point = Point::new(1.0, 4.0);
    
    println!("整数点：{:?}", integer_point);
    println!("浮点数点：{:?}", float_point);
    
    println!("整数点的 x 坐标：{}", integer_point.x());
    println!("浮点数点的 y 坐标：{}", float_point.y());
}
```

### 多个泛型参数的结构体

```rust
#[derive(Debug)]
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn new(x: T, y: U) -> Point<T, U> {
        Point { x, y }
    }
    
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point::new(5, 10.4);
    let p2 = Point::new("Hello", 'c');
    
    let p3 = p1.mixup(p2);
    
    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

## 枚举中的泛型

### Option 和 Result

```rust
// Option 的定义（标准库中）
enum Option<T> {
    Some(T),
    None,
}

// Result 的定义（标准库中）
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn main() {
    let some_number = Some(5);
    let some_string = Some("a string");
    let absent_number: Option<i32> = None;
    
    println!("{:?}", some_number);
    println!("{:?}", some_string);
    println!("{:?}", absent_number);
}
```

### 自定义泛型枚举

```rust
#[derive(Debug)]
enum Container<T> {
    Empty,
    Single(T),
    Multiple(Vec<T>),
}

impl<T> Container<T> {
    fn new() -> Container<T> {
        Container::Empty
    }
    
    fn add(self, item: T) -> Container<T> {
        match self {
            Container::Empty => Container::Single(item),
            Container::Single(existing) => Container::Multiple(vec![existing, item]),
            Container::Multiple(mut items) => {
                items.push(item);
                Container::Multiple(items)
            }
        }
    }
    
    fn len(&self) -> usize {
        match self {
            Container::Empty => 0,
            Container::Single(_) => 1,
            Container::Multiple(items) => items.len(),
        }
    }
}

fn main() {
    let mut container = Container::new();
    println!("初始容器：{:?}", container);
    
    container = container.add(1);
    println!("添加一个元素：{:?}", container);
    
    container = container.add(2);
    println!("添加第二个元素：{:?}", container);
    
    container = container.add(3);
    println!("添加第三个元素：{:?}", container);
    
    println!("容器长度：{}", container.len());
}
```

## 方法中的泛型

### 为特定类型实现方法

```rust
struct Point<T> {
    x: T,
    y: T,
}

// 为所有类型 T 实现方法
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// 只为 f32 类型实现方法
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10 };
    let p2 = Point { x: 1.0, y: 4.0 };
    
    println!("p1.x = {}", p1.x());
    println!("p2.x = {}", p2.x());
    
    // 只有 f32 类型的点才有这个方法
    println!("p2 到原点的距离：{}", p2.distance_from_origin());
}
```

### 方法中的额外泛型参数

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c' };
    
    let p3 = p1.mixup(p2);
    
    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

## 泛型约束

### 基本约束

```rust
use std::fmt::Display;

fn print_and_return<T: Display>(value: T) -> T {
    println!("值是：{}", value);
    value
}

fn main() {
    let number = print_and_return(42);
    let text = print_and_return("Hello");
    
    println!("返回的数字：{}", number);
    println!("返回的文本：{}", text);
}
```

### 多个约束

```rust
use std::fmt::{Debug, Display};

fn compare_and_print<T: Debug + Display + PartialOrd>(a: T, b: T) {
    println!("比较 {} 和 {}", a, b);
    
    if a > b {
        println!("{:?} 大于 {:?}", a, b);
    } else if a < b {
        println!("{:?} 小于 {:?}", a, b);
    } else {
        println!("{:?} 等于 {:?}", a, b);
    }
}

fn main() {
    compare_and_print(10, 20);
    compare_and_print(3.14, 2.71);
}
```

### where 子句

```rust
use std::fmt::{Debug, Display};

// 使用 where 子句使代码更清晰
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    println!("t: {}", t);
    println!("u: {:?}", u);
    42
}

fn main() {
    let t = "hello";
    let u = vec![1, 2, 3];
    
    let result = some_function(&t, &u);
    println!("结果：{}", result);
}
```

## 关联类型

### Iterator trait 示例

```rust
trait Iterator {
    type Item; // 关联类型
    
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
        println!("计数：{}", value);
    }
}
```

## 泛型的性能

### 单态化（Monomorphization）

```rust
// 这个泛型函数
fn add<T: std::ops::Add<Output = T>>(a: T, b: T) -> T {
    a + b
}

fn main() {
    let int_result = add(5, 10);        // 编译器生成 add_i32
    let float_result = add(1.5, 2.5);   // 编译器生成 add_f64
    
    println!("整数相加：{}", int_result);
    println!("浮点数相加：{}", float_result);
}

// 编译器实际生成的代码类似于：
// fn add_i32(a: i32, b: i32) -> i32 { a + b }
// fn add_f64(a: f64, b: f64) -> f64 { a + b }
```

## 实际应用示例

### 泛型数据结构

```rust
#[derive(Debug)]
struct Stack<T> {
    items: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Stack<T> {
        Stack { items: Vec::new() }
    }
    
    fn push(&mut self, item: T) {
        self.items.push(item);
    }
    
    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }
    
    fn peek(&self) -> Option<&T> {
        self.items.last()
    }
    
    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
    
    fn len(&self) -> usize {
        self.items.len()
    }
}

fn main() {
    let mut int_stack = Stack::new();
    int_stack.push(1);
    int_stack.push(2);
    int_stack.push(3);
    
    println!("整数栈：{:?}", int_stack);
    println!("栈顶元素：{:?}", int_stack.peek());
    println!("弹出元素：{:?}", int_stack.pop());
    
    let mut string_stack = Stack::new();
    string_stack.push(String::from("hello"));
    string_stack.push(String::from("world"));
    
    println!("字符串栈：{:?}", string_stack);
    println!("栈长度：{}", string_stack.len());
}
```

### 泛型缓存

```rust
use std::collections::HashMap;
use std::hash::Hash;

struct Cache<K, V> {
    data: HashMap<K, V>,
}

impl<K, V> Cache<K, V>
where
    K: Eq + Hash,
{
    fn new() -> Cache<K, V> {
        Cache {
            data: HashMap::new(),
        }
    }
    
    fn get(&self, key: &K) -> Option<&V> {
        self.data.get(key)
    }
    
    fn insert(&mut self, key: K, value: V) -> Option<V> {
        self.data.insert(key, value)
    }
    
    fn remove(&mut self, key: &K) -> Option<V> {
        self.data.remove(key)
    }
    
    fn contains_key(&self, key: &K) -> bool {
        self.data.contains_key(key)
    }
    
    fn len(&self) -> usize {
        self.data.len()
    }
}

fn main() {
    let mut string_cache = Cache::new();
    string_cache.insert("key1", "value1");
    string_cache.insert("key2", "value2");
    
    println!("获取 key1：{:?}", string_cache.get(&"key1"));
    println!("缓存大小：{}", string_cache.len());
    
    let mut number_cache = Cache::new();
    number_cache.insert(1, 100);
    number_cache.insert(2, 200);
    
    println!("获取键 1：{:?}", number_cache.get(&1));
    println!("包含键 3：{}", number_cache.contains_key(&3));
}
```

### 泛型构建器模式

```rust
#[derive(Debug)]
struct Config<T> {
    host: String,
    port: u16,
    data: T,
}

struct ConfigBuilder<T> {
    host: Option<String>,
    port: Option<u16>,
    data: Option<T>,
}

impl<T> ConfigBuilder<T> {
    fn new() -> ConfigBuilder<T> {
        ConfigBuilder {
            host: None,
            port: None,
            data: None,
        }
    }
    
    fn host(mut self, host: &str) -> ConfigBuilder<T> {
        self.host = Some(host.to_string());
        self
    }
    
    fn port(mut self, port: u16) -> ConfigBuilder<T> {
        self.port = Some(port);
        self
    }
    
    fn data(mut self, data: T) -> ConfigBuilder<T> {
        self.data = Some(data);
        self
    }
    
    fn build(self) -> Result<Config<T>, String> {
        Ok(Config {
            host: self.host.ok_or("缺少 host")?,
            port: self.port.ok_or("缺少 port")?,
            data: self.data.ok_or("缺少 data")?,
        })
    }
}

fn main() {
    let config = ConfigBuilder::new()
        .host("localhost")
        .port(8080)
        .data(vec![1, 2, 3])
        .build();
    
    match config {
        Ok(cfg) => println!("配置：{:?}", cfg),
        Err(error) => println!("构建失败：{}", error),
    }
    
    let string_config = ConfigBuilder::new()
        .host("example.com")
        .port(443)
        .data("Hello, World!")
        .build();
    
    match string_config {
        Ok(cfg) => println!("字符串配置：{:?}", cfg),
        Err(error) => println!("构建失败：{}", error),
    }
}
```

## 练习

### 练习 1：泛型链表
实现一个泛型单向链表，支持插入、删除和查找操作。

### 练习 2：泛型二叉树
创建一个泛型二叉搜索树，实现插入、查找和遍历功能。

### 练习 3：泛型队列
实现一个泛型队列，支持入队、出队和查看队首元素。

### 练习 4：泛型矩阵
创建一个泛型矩阵类型，支持基本的矩阵运算。

## 下一步

掌握了泛型后，您可以继续学习：

1. [特征 (Traits)](./traits.md) - 定义共同行为
2. [生命周期](./lifetimes.md) - 引用的有效性
3. [函数式编程](./functional.md) - 闭包和迭代器

泛型是 Rust 中实现代码复用和类型安全的重要工具！
