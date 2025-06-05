# 宏编程

宏（Macros）是 Rust 中的元编程工具，允许您编写生成其他代码的代码。宏在编译时展开，可以减少代码重复并提供强大的抽象能力。

## 声明式宏

### 基本语法

```rust
// 定义一个简单的宏
macro_rules! say_hello {
    () => {
        println!("Hello, world!");
    };
}

fn main() {
    say_hello!(); // 调用宏
}
```

### 带参数的宏

```rust
macro_rules! create_function {
    ($func_name:ident) => {
        fn $func_name() {
            println!("You called {:?}()", stringify!($func_name));
        }
    };
}

// 使用宏生成函数
create_function!(foo);
create_function!(bar);

fn main() {
    foo();
    bar();
}
```

### 模式匹配

```rust
macro_rules! calculate {
    (eval $e:expr) => {
        {
            let val: usize = $e; // 强制类型为 usize
            println!("{} = {}", stringify!($e), val);
        }
    };
}

fn main() {
    calculate!(eval 1 + 2);
    calculate!(eval (1 + 2) * (3 / 4));
}
```

## 宏的模式类型

### 表达式和语句

```rust
macro_rules! print_result {
    ($expression:expr) => {
        println!("Result: {}", $expression);
    };
}

macro_rules! create_variable {
    ($var_name:ident = $value:expr) => {
        let $var_name = $value;
    };
}

fn main() {
    print_result!(2 + 3);
    
    create_variable!(x = 42);
    println!("x = {}", x);
}
```

### 类型和标识符

```rust
macro_rules! impl_display {
    ($type:ty) => {
        impl std::fmt::Display for $type {
            fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                write!(f, "{:?}", self)
            }
        }
    };
}

#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

impl_display!(Point);

fn main() {
    let p = Point { x: 1, y: 2 };
    println!("{}", p);
}
```

### 重复模式

```rust
macro_rules! vec_of_strings {
    ($($element:expr),*) => {
        {
            let mut v = Vec::new();
            $(
                v.push($element.to_string());
            )*
            v
        }
    };
}

fn main() {
    let v = vec_of_strings!["hello", "world", "rust"];
    println!("{:?}", v);
}
```

## 高级宏模式

### 多种模式匹配

```rust
macro_rules! test {
    // 单个标识符
    ($left:ident) => {
        println!("Single identifier: {}", stringify!($left));
    };
    
    // 两个表达式
    ($left:expr; and $right:expr) => {
        println!("Left: {}, Right: {}", $left, $right);
    };
    
    // 可变参数
    ($($args:expr),*) => {
        println!("Multiple arguments:");
        $(
            println!("  {}", $args);
        )*
    };
}

fn main() {
    test!(hello);
    test!(1 + 1; and 2 + 2);
    test!(1, 2, 3, 4);
}
```

### 递归宏

```rust
macro_rules! find_min {
    ($x:expr) => ($x);
    ($x:expr, $($y:expr),+) => (
        std::cmp::min($x, find_min!($($y),+))
    );
}

fn main() {
    println!("Minimum: {}", find_min!(5, 2, 8, 1, 9));
}
```

### 条件编译宏

```rust
macro_rules! debug_print {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        {
            println!("[DEBUG] {}", format!($($arg)*));
        }
    };
}

fn main() {
    debug_print!("This is a debug message: {}", 42);
    println!("This always prints");
}
```

## 过程宏基础

### 属性宏

```rust
// 需要在 Cargo.toml 中添加：
// [lib]
// proc-macro = true
// 
// [dependencies]
// proc-macro2 = "1.0"
// quote = "1.0"
// syn = { version = "2.0", features = ["full"] }

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;
    
    let gen = quote! {
        impl HelloMacro for #name {
            fn hello_macro() {
                println!("Hello, Macro! My name is {}!", stringify!(#name));
            }
        }
    };
    
    gen.into()
}

// 使用派生宏
trait HelloMacro {
    fn hello_macro();
}

#[derive(HelloMacro)]
struct Pancakes;

fn main() {
    Pancakes::hello_macro();
}
```

### 函数式宏

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Expr};

#[proc_macro]
pub fn make_answer(_item: TokenStream) -> TokenStream {
    quote! {
        fn answer() -> u32 {
            42
        }
    }.into()
}

// 使用
make_answer!();

fn main() {
    println!("The answer is: {}", answer());
}
```

## 实用宏示例

### 配置宏

```rust
macro_rules! config {
    ($($key:ident: $value:expr),* $(,)?) => {
        {
            use std::collections::HashMap;
            let mut map = HashMap::new();
            $(
                map.insert(stringify!($key), $value.to_string());
            )*
            map
        }
    };
}

fn main() {
    let config = config! {
        host: "localhost",
        port: 8080,
        debug: true,
    };
    
    for (key, value) in &config {
        println!("{}: {}", key, value);
    }
}
```

### 测试宏

```rust
macro_rules! test_case {
    ($name:ident: $input:expr => $expected:expr) => {
        #[test]
        fn $name() {
            assert_eq!(my_function($input), $expected);
        }
    };
}

fn my_function(x: i32) -> i32 {
    x * 2
}

// 生成多个测试
test_case!(test_zero: 0 => 0);
test_case!(test_positive: 5 => 10);
test_case!(test_negative: -3 => -6);

#[cfg(test)]
mod tests {
    use super::*;
    
    test_case!(test_large: 1000 => 2000);
}
```

### 结构体生成宏

```rust
macro_rules! create_struct {
    ($name:ident { $($field:ident: $type:ty),* $(,)? }) => {
        #[derive(Debug, Clone)]
        struct $name {
            $(pub $field: $type,)*
        }
        
        impl $name {
            pub fn new($($field: $type),*) -> Self {
                Self {
                    $($field,)*
                }
            }
        }
    };
}

create_struct!(Person {
    name: String,
    age: u32,
    email: String,
});

fn main() {
    let person = Person::new(
        "Alice".to_string(),
        30,
        "alice@example.com".to_string(),
    );
    
    println!("{:?}", person);
}
```

## 宏调试

### 展开宏

```bash
# 安装 cargo-expand
cargo install cargo-expand

# 展开宏
cargo expand

# 展开特定模块的宏
cargo expand my_module

# 展开特定函数的宏
cargo expand my_function
```

### 调试技巧

```rust
macro_rules! debug_macro {
    ($($arg:tt)*) => {
        {
            // 打印宏输入
            println!("Macro input: {}", stringify!($($arg)*));
            
            // 实际的宏逻辑
            let result = {
                $($arg)*
            };
            
            // 打印结果
            println!("Macro result: {:?}", result);
            result
        }
    };
}

fn main() {
    let x = debug_macro!(2 + 3);
    println!("Final result: {}", x);
}
```

## 宏的限制和最佳实践

### 卫生性

```rust
macro_rules! using_a {
    () => {
        {
            let a = 42;
            a
        }
    };
}

fn main() {
    let a = 13;
    let result = using_a!(); // 宏内的 a 不会影响外部的 a
    println!("a: {}, result: {}", a, result);
}
```

### 避免常见陷阱

```rust
// 错误：可能多次求值
macro_rules! bad_max {
    ($a:expr, $b:expr) => {
        if $a > $b { $a } else { $b }
    };
}

// 正确：只求值一次
macro_rules! good_max {
    ($a:expr, $b:expr) => {
        {
            let a_val = $a;
            let b_val = $b;
            if a_val > b_val { a_val } else { b_val }
        }
    };
}

fn expensive_function() -> i32 {
    println!("Expensive computation!");
    42
}

fn main() {
    // bad_max 会调用两次 expensive_function
    // let result = bad_max!(expensive_function(), 10);
    
    // good_max 只调用一次
    let result = good_max!(expensive_function(), 10);
    println!("Result: {}", result);
}
```

## 实际应用示例

### 序列化宏

```rust
macro_rules! serialize_struct {
    ($name:ident { $($field:ident),* }) => {
        impl $name {
            pub fn to_json(&self) -> String {
                let mut json = String::from("{");
                let mut first = true;
                
                $(
                    if !first {
                        json.push_str(", ");
                    }
                    json.push_str(&format!(
                        "\"{}\": \"{}\"", 
                        stringify!($field), 
                        self.$field
                    ));
                    first = false;
                )*
                
                json.push('}');
                json
            }
        }
    };
}

#[derive(Debug)]
struct User {
    name: String,
    email: String,
    age: u32,
}

serialize_struct!(User { name, email, age });

fn main() {
    let user = User {
        name: "Alice".to_string(),
        email: "alice@example.com".to_string(),
        age: 30,
    };
    
    println!("{}", user.to_json());
}
```

### 状态机宏

```rust
macro_rules! state_machine {
    (
        $name:ident {
            states: [$($state:ident),*],
            transitions: {
                $($from:ident -> $to:ident on $event:ident),*
            }
        }
    ) => {
        #[derive(Debug, Clone, PartialEq)]
        enum State {
            $($state,)*
        }
        
        #[derive(Debug, Clone)]
        enum Event {
            $($event,)*
        }
        
        struct $name {
            state: State,
        }
        
        impl $name {
            pub fn new() -> Self {
                Self {
                    state: State::$($state)*, // 使用第一个状态作为初始状态
                }
            }
            
            pub fn handle_event(&mut self, event: Event) -> Result<(), String> {
                match (&self.state, &event) {
                    $(
                        (State::$from, Event::$event) => {
                            self.state = State::$to;
                            Ok(())
                        }
                    )*
                    _ => Err(format!("Invalid transition from {:?} on {:?}", self.state, event)),
                }
            }
            
            pub fn current_state(&self) -> &State {
                &self.state
            }
        }
    };
}

state_machine!(TrafficLight {
    states: [Red, Yellow, Green],
    transitions: {
        Red -> Green on Go,
        Green -> Yellow on Caution,
        Yellow -> Red on Stop
    }
});

fn main() {
    let mut light = TrafficLight::new();
    println!("Initial state: {:?}", light.current_state());
    
    light.handle_event(Event::Go).unwrap();
    println!("After Go: {:?}", light.current_state());
    
    light.handle_event(Event::Caution).unwrap();
    println!("After Caution: {:?}", light.current_state());
    
    light.handle_event(Event::Stop).unwrap();
    println!("After Stop: {:?}", light.current_state());
}
```

### 建造者模式宏

```rust
macro_rules! builder {
    ($name:ident {
        $($field:ident: $type:ty),* $(,)?
    }) => {
        #[derive(Debug, Clone)]
        pub struct $name {
            $(pub $field: $type,)*
        }
        
        paste::paste! {
            #[derive(Default)]
            pub struct [<$name Builder>] {
                $($field: Option<$type>,)*
            }
            
            impl [<$name Builder>] {
                pub fn new() -> Self {
                    Self::default()
                }
                
                $(
                    pub fn $field(mut self, $field: $type) -> Self {
                        self.$field = Some($field);
                        self
                    }
                )*
                
                pub fn build(self) -> Result<$name, String> {
                    Ok($name {
                        $(
                            $field: self.$field.ok_or_else(|| {
                                format!("Field '{}' is required", stringify!($field))
                            })?,
                        )*
                    })
                }
            }
        }
    };
}

// 需要在 Cargo.toml 中添加：
// paste = "1.0"

builder!(Config {
    host: String,
    port: u16,
    database_url: String,
});

fn main() {
    let config = ConfigBuilder::new()
        .host("localhost".to_string())
        .port(8080)
        .database_url("postgres://localhost/mydb".to_string())
        .build()
        .unwrap();
    
    println!("{:?}", config);
}
```

## 练习

### 练习 1：日志宏
创建一个日志宏，支持不同的日志级别（DEBUG、INFO、WARN、ERROR）。

### 练习 2：枚举生成宏
编写一个宏，自动为枚举生成 `from_str` 和 `to_str` 方法。

### 练习 3：测试数据生成宏
创建一个宏，用于生成测试数据结构。

### 练习 4：DSL 宏
设计一个简单的领域特定语言（DSL）宏，比如配置文件解析器。

## 下一步

掌握了宏编程后，您可以继续学习：

1. [unsafe Rust](./unsafe.md) - 底层控制
2. [常用库推荐](./ecosystem.md) - 社区生态
3. [开发工具](./tools.md) - 提高开发效率

宏是 Rust 中强大的元编程工具，能够大大减少代码重复并提供灵活的抽象！
