# 生命周期

生命周期（Lifetimes）是 Rust 中另一种泛型，它确保引用在需要时保持有效。每一个引用都有一个生命周期，也就是引用保持有效的作用域。

## 生命周期的作用

### 防止悬垂引用

```rust
fn main() {
    let r;

    {
        let x = 5;
        r = &x; // 错误！x 的生命周期比 r 短
    } // x 在这里离开作用域

    // println!("r: {}", r); // 错误！r 引用了已经被释放的内存
}
```

### 借用检查器

```rust
fn main() {
    let x = 5;            // ----------+-- 'b
                          //           |
    let r = &x;           // --+-- 'a  |
                          //   |       |
    println!("r: {}", r); //   |       |
                          // --+       |
}                         // ----------+
```

## 函数中的生命周期

### 生命周期注解语法

```rust
// 生命周期参数以撇号开始，通常很短，如 'a
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}
```

### 生命周期注解的含义

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("long string is long");

    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is {}", result);
    }
}
```

### 不同生命周期的例子

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        // 错误！string2 的生命周期太短
    }
    // println!("The longest string is {}", result);
}
```

## 结构体中的生命周期

### 基本结构体生命周期

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");
    let i = ImportantExcerpt {
        part: first_sentence,
    };
    
    println!("Important excerpt: {}", i.part);
}
```

### 多个生命周期参数

```rust
struct Excerpt<'a, 'b> {
    part: &'a str,
    author: &'b str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let author = String::from("Herman Melville");
    
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");
    let excerpt = Excerpt {
        part: first_sentence,
        author: &author,
    };
    
    println!("Excerpt: {} by {}", excerpt.part, excerpt.author);
}
```

## 生命周期省略规则

### 输入生命周期和输出生命周期

```rust
// 编译器可以推断的情况
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

// 等价于
fn first_word_explicit<'a>(s: &'a str) -> &'a str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

### 三条省略规则

1. **第一条规则**：每一个是引用的参数都有它自己的生命周期参数
2. **第二条规则**：如果只有一个输入生命周期参数，那么它被赋予所有输出生命周期参数
3. **第三条规则**：如果方法有多个输入生命周期参数并且其中一个参数是 `&self` 或 `&mut self`，那么所有输出生命周期参数被赋予 `self` 的生命周期

```rust
// 规则1：每个引用参数都有自己的生命周期
fn foo<'a, 'b>(x: &'a i32, y: &'b i32) -> i32 { *x + *y }

// 规则2：只有一个输入生命周期，赋予输出
fn foo<'a>(x: &'a i32) -> &'a i32 { x }

// 规则3：方法中的 self 生命周期赋予输出
impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
    
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {}", announcement);
        self.part
    }
}
```

## 方法定义中的生命周期

### 基本方法

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
}

impl<'a> ImportantExcerpt<'a> {
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {}", announcement);
        self.part
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");
    let i = ImportantExcerpt {
        part: first_sentence,
    };
    
    println!("Level: {}", i.level());
    println!("Part: {}", i.announce_and_return_part("Hello"));
}
```

## 静态生命周期

### 'static 生命周期

```rust
fn main() {
    let s: &'static str = "I have a static lifetime.";
    println!("{}", s);
}
```

### 字符串字面量

```rust
fn main() {
    // 所有字符串字面量都有 'static 生命周期
    let s1: &'static str = "Hello, world!";
    let s2 = "Hello, world!"; // 类型推断为 &'static str
    
    println!("{}", s1);
    println!("{}", s2);
}
```

## 泛型、特征约束和生命周期

### 综合使用

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest_with_an_announcement(
        string1.as_str(),
        string2,
        "Today is someone's birthday!",
    );
    println!("The longest string is {}", result);
}
```

## 高级生命周期

### 生命周期子类型

```rust
fn main() {
    let string1 = String::from("long string is long");
    let string2 = String::from("xyz");

    let result = longest(string1.as_str(), string2.as_str());
    println!("The longest string is {}", result);
}

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### 生命周期约束

```rust
struct Context<'s>(&'s str);

struct Parser<'c, 's> {
    context: &'c Context<'s>,
}

impl<'c, 's> Parser<'c, 's> {
    fn parse(&self) -> Result<(), &'s str> {
        Err(&self.context.0[1..])
    }
}

fn parse_context(context: Context) -> Result<(), &str> {
    Parser { context: &context }.parse()
}
```

### 高阶特征约束 (HRTB)

```rust
fn call_with_one<F>(func: F) -> usize
where
    F: for<'a> Fn(&'a str) -> usize,
{
    func("hello")
}

fn main() {
    let result = call_with_one(|s| s.len());
    println!("Result: {}", result);
}
```

## 实际应用示例

### 字符串分割器

```rust
struct StrSplit<'haystack, 'delimiter> {
    remainder: Option<&'haystack str>,
    delimiter: &'delimiter str,
}

impl<'haystack, 'delimiter> StrSplit<'haystack, 'delimiter> {
    fn new(haystack: &'haystack str, delimiter: &'delimiter str) -> Self {
        Self {
            remainder: Some(haystack),
            delimiter,
        }
    }
}

impl<'haystack, 'delimiter> Iterator for StrSplit<'haystack, 'delimiter> {
    type Item = &'haystack str;

    fn next(&mut self) -> Option<Self::Item> {
        let remainder = self.remainder.as_mut()?;
        if let Some(next_delim) = remainder.find(self.delimiter) {
            let until_delimiter = &remainder[..next_delim];
            *remainder = &remainder[(next_delim + self.delimiter.len())..];
            Some(until_delimiter)
        } else {
            self.remainder.take()
        }
    }
}

fn main() {
    let haystack = "a b c d e";
    let letters: Vec<_> = StrSplit::new(haystack, " ").collect();
    println!("Letters: {:?}", letters);
}
```

### 缓存结构

```rust
use std::collections::HashMap;

struct Cache<'a> {
    data: HashMap<&'a str, String>,
}

impl<'a> Cache<'a> {
    fn new() -> Self {
        Cache {
            data: HashMap::new(),
        }
    }

    fn get(&self, key: &str) -> Option<&String> {
        self.data.get(key)
    }

    fn set(&mut self, key: &'a str, value: String) {
        self.data.insert(key, value);
    }
}

fn main() {
    let mut cache = Cache::new();
    
    let key = "hello";
    cache.set(key, "world".to_string());
    
    if let Some(value) = cache.get("hello") {
        println!("Found: {}", value);
    }
}
```

### 配置解析器

```rust
struct Config<'a> {
    name: &'a str,
    version: &'a str,
    description: Option<&'a str>,
}

impl<'a> Config<'a> {
    fn new(name: &'a str, version: &'a str) -> Self {
        Config {
            name,
            version,
            description: None,
        }
    }

    fn with_description(mut self, description: &'a str) -> Self {
        self.description = Some(description);
        self
    }

    fn display(&self) {
        println!("Name: {}", self.name);
        println!("Version: {}", self.version);
        if let Some(desc) = self.description {
            println!("Description: {}", desc);
        }
    }
}

fn main() {
    let name = "MyApp";
    let version = "1.0.0";
    let description = "A sample application";

    let config = Config::new(name, version)
        .with_description(description);

    config.display();
}
```

## 常见错误和解决方案

### 错误1：生命周期不匹配

```rust
// 错误的代码
// fn invalid_output<'a>() -> &'a str {
//     let s = String::from("hello");
//     &s // 错误！返回了局部变量的引用
// }

// 正确的解决方案
fn valid_output() -> String {
    String::from("hello")
}

fn main() {
    let result = valid_output();
    println!("{}", result);
}
```

### 错误2：借用检查器错误

```rust
fn main() {
    let mut data = vec![1, 2, 3, 4, 5];
    
    // 错误的方式
    // let first = &data[0];
    // data.push(6); // 错误！不能在有不可变借用时修改
    // println!("First: {}", first);
    
    // 正确的方式
    {
        let first = &data[0];
        println!("First: {}", first);
    } // first 的生命周期结束
    data.push(6); // 现在可以修改了
    
    println!("Data: {:?}", data);
}
```

## 练习

### 练习 1：字符串处理器
创建一个结构体，存储字符串引用并提供各种处理方法。

### 练习 2：数据验证器
实现一个验证器，接受引用并返回验证结果。

### 练习 3：配置管理器
创建一个配置管理器，使用生命周期管理配置数据的引用。

### 练习 4：迭代器包装器
实现一个自定义迭代器，包装其他迭代器并添加额外功能。

## 下一步

掌握了生命周期后，您可以继续学习：

1. [函数式编程](./functional.md) - 闭包和迭代器
2. [智能指针](./smart-pointers.md) - 高级内存管理
3. [并发编程](./concurrency.md) - 多线程和并发

生命周期是 Rust 内存安全的核心保证，理解它将帮助您编写更安全的代码！
