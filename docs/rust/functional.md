# 函数式编程

Rust 包含了许多函数式编程语言的特性，如闭包和迭代器。这些特性让您能够以更简洁、更表达性的方式编写代码。

## 闭包

### 基本闭包语法

```rust
fn main() {
    // 基本闭包
    let add_one = |x| x + 1;
    println!("5 + 1 = {}", add_one(5));

    // 带类型注解的闭包
    let add_one_v2 = |x: i32| -> i32 { x + 1 };
    println!("5 + 1 = {}", add_one_v2(5));

    // 多行闭包
    let add_one_v3 = |x| {
        println!("Adding 1 to {}", x);
        x + 1
    };
    println!("5 + 1 = {}", add_one_v3(5));
}
```

### 闭包类型推断

```rust
fn main() {
    let example_closure = |x| x;

    let s = example_closure(String::from("hello"));
    println!("String: {}", s);

    // 一旦确定了类型，就不能改变
    // let n = example_closure(5); // 错误！类型不匹配
}
```

### 捕获环境

```rust
fn main() {
    let x = 4;

    // 闭包捕获环境中的变量
    let equal_to_x = |z| z == x;

    let y = 4;
    assert!(equal_to_x(y));
    println!("y equals x: {}", equal_to_x(y));
}
```

## 闭包的捕获方式

### 不可变借用

```rust
fn main() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {:?}", list);

    let only_borrows = || println!("From closure: {:?}", list);

    println!("Before calling closure: {:?}", list);
    only_borrows();
    println!("After calling closure: {:?}", list);
}
```

### 可变借用

```rust
fn main() {
    let mut list = vec![1, 2, 3];
    println!("Before defining closure: {:?}", list);

    let mut borrows_mutably = || list.push(7);

    // println!("Before calling closure: {:?}", list); // 错误！
    borrows_mutably();
    println!("After calling closure: {:?}", list);
}
```

### 获取所有权

```rust
fn main() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {:?}", list);

    // 使用 move 关键字强制获取所有权
    let takes_ownership = move || println!("From closure: {:?}", list);

    // println!("After defining closure: {:?}", list); // 错误！list 已被移动
    takes_ownership();
}
```

## Fn 特征

### 三种 Fn 特征

```rust
fn main() {
    // FnOnce：只能调用一次，获取所有权
    let consume = move |x: Vec<i32>| {
        println!("Consuming: {:?}", x);
        x // 返回 x，消费了它
    };

    // FnMut：可以多次调用，可变借用
    let mut count = 0;
    let mut increment = || {
        count += 1;
        println!("Count: {}", count);
    };

    increment();
    increment();

    // Fn：可以多次调用，不可变借用
    let x = 5;
    let print_x = || println!("x: {}", x);
    print_x();
    print_x();
}
```

### 作为参数的闭包

```rust
fn call_with_different_closures() {
    let answer = 42;

    // Fn
    call_fn(|| answer);

    // FnMut
    let mut counter = 0;
    call_fn_mut(|| {
        counter += 1;
        counter
    });

    // FnOnce
    call_fn_once(move || answer);
}

fn call_fn<F>(closure: F)
where
    F: Fn() -> i32,
{
    println!("Fn result: {}", closure());
    println!("Fn result: {}", closure()); // 可以多次调用
}

fn call_fn_mut<F>(mut closure: F)
where
    F: FnMut() -> i32,
{
    println!("FnMut result: {}", closure());
    println!("FnMut result: {}", closure()); // 可以多次调用
}

fn call_fn_once<F>(closure: F)
where
    F: FnOnce() -> i32,
{
    println!("FnOnce result: {}", closure()); // 只能调用一次
}

fn main() {
    call_with_different_closures();
}
```

## 迭代器

### 基本迭代器

```rust
fn main() {
    let v1 = vec![1, 2, 3];

    // 创建迭代器
    let v1_iter = v1.iter();

    // 使用 for 循环
    for val in v1_iter {
        println!("Got: {}", val);
    }

    // 手动迭代
    let mut v1_iter = v1.iter();
    assert_eq!(v1_iter.next(), Some(&1));
    assert_eq!(v1_iter.next(), Some(&2));
    assert_eq!(v1_iter.next(), Some(&3));
    assert_eq!(v1_iter.next(), None);
}
```

### 迭代器适配器

```rust
fn main() {
    let v1: Vec<i32> = vec![1, 2, 3];

    // map：转换每个元素
    let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();
    println!("v2: {:?}", v2);

    // filter：过滤元素
    let v3: Vec<_> = v1.iter().filter(|&x| *x > 1).collect();
    println!("v3: {:?}", v3);

    // enumerate：添加索引
    let v4: Vec<_> = v1.iter().enumerate().collect();
    println!("v4: {:?}", v4);

    // zip：组合两个迭代器
    let v5 = vec![4, 5, 6];
    let v6: Vec<_> = v1.iter().zip(v5.iter()).collect();
    println!("v6: {:?}", v6);
}
```

### 消费适配器

```rust
fn main() {
    let v1 = vec![1, 2, 3];

    // collect：收集到集合
    let v2: Vec<i32> = v1.iter().map(|x| x + 1).collect();
    println!("collect: {:?}", v2);

    // reduce：归约
    let sum = v1.iter().fold(0, |acc, x| acc + x);
    println!("fold sum: {}", sum);

    // reduce 的另一种形式
    let sum2 = v1.iter().reduce(|acc, x| acc + x);
    println!("reduce sum: {:?}", sum2);

    // find：查找
    let found = v1.iter().find(|&&x| x > 2);
    println!("found: {:?}", found);

    // any 和 all
    let any_even = v1.iter().any(|&x| x % 2 == 0);
    let all_positive = v1.iter().all(|&x| x > 0);
    println!("any even: {}, all positive: {}", any_even, all_positive);
}
```

## 自定义迭代器

### 实现 Iterator 特征

```rust
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
    let mut counter = Counter::new(5);

    // 手动迭代
    while let Some(value) = counter.next() {
        println!("Counter: {}", value);
    }

    // 使用迭代器方法
    let sum: usize = Counter::new(5).sum();
    println!("Sum: {}", sum);

    let collected: Vec<usize> = Counter::new(3).collect();
    println!("Collected: {:?}", collected);
}
```

### 迭代器链

```rust
fn main() {
    let numbers: Vec<i32> = (1..=10)
        .filter(|&x| x % 2 == 0)  // 过滤偶数
        .map(|x| x * x)           // 平方
        .filter(|&x| x > 10)      // 过滤大于10的
        .collect();

    println!("Processed numbers: {:?}", numbers);

    // 更复杂的链式操作
    let result: i32 = (1..=100)
        .filter(|&x| x % 3 == 0 || x % 5 == 0)  // 3或5的倍数
        .map(|x| x * 2)                          // 乘以2
        .take(10)                                // 取前10个
        .sum();                                  // 求和

    println!("Complex chain result: {}", result);
}
```

## 高阶函数

### 函数作为参数

```rust
fn apply_operation<F>(numbers: Vec<i32>, operation: F) -> Vec<i32>
where
    F: Fn(i32) -> i32,
{
    numbers.into_iter().map(operation).collect()
}

fn double(x: i32) -> i32 {
    x * 2
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 使用函数
    let doubled = apply_operation(numbers.clone(), double);
    println!("Doubled: {:?}", doubled);

    // 使用闭包
    let squared = apply_operation(numbers.clone(), |x| x * x);
    println!("Squared: {:?}", squared);

    // 使用更复杂的闭包
    let processed = apply_operation(numbers, |x| {
        if x % 2 == 0 {
            x * 3
        } else {
            x + 1
        }
    });
    println!("Processed: {:?}", processed);
}
```

### 返回闭包

```rust
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n
}

fn make_multiplier(n: i32) -> Box<dyn Fn(i32) -> i32> {
    Box::new(move |x| x * n)
}

fn main() {
    let add_5 = make_adder(5);
    println!("10 + 5 = {}", add_5(10));

    let multiply_3 = make_multiplier(3);
    println!("7 * 3 = {}", multiply_3(7));
}
```

## 实际应用示例

### 数据处理管道

```rust
#[derive(Debug, Clone)]
struct Person {
    name: String,
    age: u32,
    salary: u32,
}

fn main() {
    let people = vec![
        Person { name: "Alice".to_string(), age: 30, salary: 50000 },
        Person { name: "Bob".to_string(), age: 25, salary: 45000 },
        Person { name: "Charlie".to_string(), age: 35, salary: 60000 },
        Person { name: "Diana".to_string(), age: 28, salary: 55000 },
    ];

    // 数据处理管道
    let high_earners: Vec<String> = people
        .iter()
        .filter(|person| person.salary > 50000)  // 高收入者
        .filter(|person| person.age < 35)        // 年龄小于35
        .map(|person| person.name.clone())       // 提取姓名
        .collect();

    println!("High earners under 35: {:?}", high_earners);

    // 统计信息
    let total_salary: u32 = people.iter().map(|p| p.salary).sum();
    let average_age: f64 = people.iter().map(|p| p.age as f64).sum::<f64>() / people.len() as f64;

    println!("Total salary: {}", total_salary);
    println!("Average age: {:.1}", average_age);
}
```

### 配置处理器

```rust
use std::collections::HashMap;

type ConfigProcessor = Box<dyn Fn(&str) -> String>;

struct ConfigManager {
    processors: HashMap<String, ConfigProcessor>,
}

impl ConfigManager {
    fn new() -> Self {
        ConfigManager {
            processors: HashMap::new(),
        }
    }

    fn add_processor<F>(&mut self, key: String, processor: F)
    where
        F: Fn(&str) -> String + 'static,
    {
        self.processors.insert(key, Box::new(processor));
    }

    fn process(&self, key: &str, value: &str) -> Option<String> {
        self.processors.get(key).map(|processor| processor(value))
    }
}

fn main() {
    let mut config_manager = ConfigManager::new();

    // 添加处理器
    config_manager.add_processor(
        "uppercase".to_string(),
        |s| s.to_uppercase(),
    );

    config_manager.add_processor(
        "add_prefix".to_string(),
        |s| format!("PREFIX_{}", s),
    );

    config_manager.add_processor(
        "reverse".to_string(),
        |s| s.chars().rev().collect(),
    );

    // 使用处理器
    let configs = vec![
        ("uppercase", "hello world"),
        ("add_prefix", "config"),
        ("reverse", "rust"),
    ];

    for (processor, value) in configs {
        if let Some(result) = config_manager.process(processor, value) {
            println!("{} -> {}", value, result);
        }
    }
}
```

### 事件处理系统

```rust
type EventHandler<T> = Box<dyn Fn(&T)>;

struct EventBus<T> {
    handlers: Vec<EventHandler<T>>,
}

impl<T> EventBus<T> {
    fn new() -> Self {
        EventBus {
            handlers: Vec::new(),
        }
    }

    fn subscribe<F>(&mut self, handler: F)
    where
        F: Fn(&T) + 'static,
    {
        self.handlers.push(Box::new(handler));
    }

    fn publish(&self, event: &T) {
        for handler in &self.handlers {
            handler(event);
        }
    }
}

#[derive(Debug)]
struct UserEvent {
    user_id: u32,
    action: String,
}

fn main() {
    let mut event_bus = EventBus::new();

    // 订阅事件处理器
    event_bus.subscribe(|event: &UserEvent| {
        println!("Logger: User {} performed {}", event.user_id, event.action);
    });

    event_bus.subscribe(|event: &UserEvent| {
        if event.action == "login" {
            println!("Security: User {} logged in", event.user_id);
        }
    });

    event_bus.subscribe(|event: &UserEvent| {
        println!("Analytics: Recording action {} for user {}", event.action, event.user_id);
    });

    // 发布事件
    let events = vec![
        UserEvent { user_id: 1, action: "login".to_string() },
        UserEvent { user_id: 1, action: "view_page".to_string() },
        UserEvent { user_id: 2, action: "login".to_string() },
    ];

    for event in events {
        println!("\n--- Publishing event ---");
        event_bus.publish(&event);
    }
}
```

## 性能考虑

### 零成本抽象

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 函数式风格 - 零成本抽象
    let sum1: i32 = numbers.iter().map(|x| x * 2).sum();

    // 命令式风格 - 等价的性能
    let mut sum2 = 0;
    for &number in &numbers {
        sum2 += number * 2;
    }

    println!("Functional sum: {}", sum1);
    println!("Imperative sum: {}", sum2);
}
```

### 惰性求值

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // 惰性求值 - 只处理需要的元素
    let result: Vec<i32> = numbers
        .iter()
        .map(|x| {
            println!("Processing {}", x);
            x * 2
        })
        .filter(|&x| x > 10)
        .take(3)  // 只取前3个
        .collect();

    println!("Result: {:?}", result);
}
```

## 练习

### 练习 1：数据分析
使用迭代器和闭包分析一组学生成绩数据。

### 练习 2：文本处理
创建一个文本处理管道，支持多种转换操作。

### 练习 3：自定义迭代器
实现一个斐波那契数列迭代器。

### 练习 4：函数组合
实现函数组合器，允许组合多个函数。

## 下一步

掌握了函数式编程后，您可以继续学习：

1. [智能指针](./smart-pointers.md) - 高级内存管理
2. [并发编程](./concurrency.md) - 多线程和并发
3. [异步编程](./async.md) - async/await 模式

函数式编程让您能够编写更简洁、更表达性的 Rust 代码！
