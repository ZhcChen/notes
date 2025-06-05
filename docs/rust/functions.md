# 函数

函数是 Rust 代码的基本构建块。本章将详细介绍如何定义、调用和使用函数，以及 Rust 函数的特殊特性。

## 函数定义

### 基本语法

```rust
fn main() {
    println!("Hello, world!");
    
    // 调用其他函数
    another_function();
    greet("Alice");
    let result = add(5, 3);
    println!("5 + 3 = {}", result);
}

// 无参数函数
fn another_function() {
    println!("Another function.");
}

// 带参数函数
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

// 带返回值函数
fn add(a: i32, b: i32) -> i32 {
    a + b  // 表达式，不加分号
}
```

### 函数命名约定

```rust
// 使用 snake_case 命名
fn calculate_area() {}
fn get_user_name() {}
fn is_valid_email() {}

// 避免这样命名
// fn calculateArea() {}  // camelCase
// fn GetUserName() {}    // PascalCase
```

## 函数参数

### 基本参数

```rust
fn main() {
    print_value(42);
    print_coordinates(3, 4);
    print_info("Alice", 25, true);
}

fn print_value(x: i32) {
    println!("值是：{}", x);
}

fn print_coordinates(x: i32, y: i32) {
    println!("坐标：({}, {})", x, y);
}

fn print_info(name: &str, age: u32, is_student: bool) {
    println!("姓名：{}，年龄：{}，学生：{}", name, age, is_student);
}
```

### 可变参数

```rust
fn main() {
    let mut x = 5;
    println!("修改前：{}", x);
    
    modify_value(&mut x);
    println!("修改后：{}", x);
}

fn modify_value(x: &mut i32) {
    *x += 10;
}
```

### 参数模式匹配

```rust
fn main() {
    let point = (3, 5);
    print_point(point);
    
    let person = ("Alice", 25);
    print_person(person);
}

// 元组参数解构
fn print_point((x, y): (i32, i32)) {
    println!("点的坐标：({}, {})", x, y);
}

// 元组参数
fn print_person(person: (&str, u32)) {
    println!("姓名：{}，年龄：{}", person.0, person.1);
}
```

## 返回值

### 基本返回值

```rust
fn main() {
    let x = five();
    println!("x 的值是：{}", x);
    
    let y = plus_one(5);
    println!("y 的值是：{}", y);
}

fn five() -> i32 {
    5  // 返回表达式
}

fn plus_one(x: i32) -> i32 {
    x + 1  // 返回表达式
}
```

### 多个返回值（元组）

```rust
fn main() {
    let (sum, product) = calculate(4, 5);
    println!("和：{}，积：{}", sum, product);
    
    let (quotient, remainder) = divide(17, 5);
    println!("商：{}，余数：{}", quotient, remainder);
}

fn calculate(a: i32, b: i32) -> (i32, i32) {
    (a + b, a * b)
}

fn divide(dividend: i32, divisor: i32) -> (i32, i32) {
    (dividend / divisor, dividend % divisor)
}
```

### 提前返回

```rust
fn main() {
    println!("结果：{}", check_number(15));
    println!("结果：{}", check_number(-5));
    println!("结果：{}", check_number(0));
}

fn check_number(n: i32) -> &'static str {
    if n < 0 {
        return "负数";  // 提前返回
    }
    
    if n == 0 {
        return "零";    // 提前返回
    }
    
    "正数"  // 默认返回
}
```

## 表达式 vs 语句

### 理解区别

```rust
fn main() {
    // 语句：不返回值
    let x = 5;
    
    // 表达式：返回值
    let y = {
        let inner = 3;
        inner + 1  // 表达式，返回 4
    };
    
    println!("x = {}, y = {}", x, y);
    
    // 函数调用是表达式
    let z = add_one(5);
    println!("z = {}", z);
}

fn add_one(x: i32) -> i32 {
    x + 1  // 表达式
}

// 错误示例
fn wrong_add_one(x: i32) -> i32 {
    x + 1;  // 语句！会导致编译错误
}
```

### 块表达式

```rust
fn main() {
    let result = {
        let a = 2;
        let b = 3;
        a * b  // 块的返回值
    };
    
    println!("结果：{}", result);
    
    // 条件表达式
    let number = 6;
    let description = if number % 2 == 0 {
        "偶数"
    } else {
        "奇数"
    };
    
    println!("{} 是 {}", number, description);
}
```

## 函数作为值

### 函数指针

```rust
fn main() {
    let operation = add;  // 函数指针
    let result = operation(5, 3);
    println!("结果：{}", result);
    
    // 传递函数作为参数
    let result1 = apply_operation(10, 5, add);
    let result2 = apply_operation(10, 5, multiply);
    
    println!("加法结果：{}", result1);
    println!("乘法结果：{}", result2);
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn apply_operation(a: i32, b: i32, op: fn(i32, i32) -> i32) -> i32 {
    op(a, b)
}
```

### 高阶函数

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // 使用闭包
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    println!("翻倍：{:?}", doubled);
    
    // 使用函数
    let squared: Vec<i32> = numbers.iter().map(square).collect();
    println!("平方：{:?}", squared);
}

fn square(x: &i32) -> i32 {
    x * x
}
```

## 递归函数

### 基本递归

```rust
fn main() {
    println!("5! = {}", factorial(5));
    println!("斐波那契数列第 10 项：{}", fibonacci(10));
}

fn factorial(n: u32) -> u32 {
    if n <= 1 {
        1
    } else {
        n * factorial(n - 1)
    }
}

fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
```

### 尾递归优化

```rust
fn main() {
    println!("5! = {}", factorial_tail(5, 1));
    println!("斐波那契数列第 10 项：{}", fibonacci_tail(10));
}

// 尾递归阶乘
fn factorial_tail(n: u32, acc: u32) -> u32 {
    if n <= 1 {
        acc
    } else {
        factorial_tail(n - 1, n * acc)
    }
}

// 尾递归斐波那契
fn fibonacci_tail(n: u32) -> u32 {
    fn fib_helper(n: u32, a: u32, b: u32) -> u32 {
        if n == 0 {
            a
        } else {
            fib_helper(n - 1, b, a + b)
        }
    }
    fib_helper(n, 0, 1)
}
```

## 泛型函数

### 基本泛型

```rust
fn main() {
    println!("较大的数：{}", largest(5, 10));
    println!("较大的字符：{}", largest('a', 'z'));
}

fn largest<T: PartialOrd>(a: T, b: T) -> T {
    if a > b {
        a
    } else {
        b
    }
}
```

### 多个泛型参数

```rust
fn main() {
    let point = make_point(3, 4.5);
    println!("点：({}, {})", point.0, point.1);
}

fn make_point<T, U>(x: T, y: U) -> (T, U) {
    (x, y)
}
```

## 函数重载（不支持）

Rust 不支持函数重载，但可以使用其他方式实现类似功能：

```rust
fn main() {
    println!("整数相加：{}", add_i32(5, 3));
    println!("浮点相加：{}", add_f64(5.5, 3.2));
    
    // 使用泛型
    println!("泛型相加：{}", add(5, 3));
    println!("泛型相加：{}", add(5.5, 3.2));
}

// 不同名称的函数
fn add_i32(a: i32, b: i32) -> i32 {
    a + b
}

fn add_f64(a: f64, b: f64) -> f64 {
    a + b
}

// 使用泛型替代重载
fn add<T: std::ops::Add<Output = T>>(a: T, b: T) -> T {
    a + b
}
```

## 内联函数

```rust
fn main() {
    let result = fast_add(5, 3);
    println!("结果：{}", result);
}

#[inline]
fn fast_add(a: i32, b: i32) -> i32 {
    a + b
}

#[inline(always)]
fn always_inline_add(a: i32, b: i32) -> i32 {
    a + b
}

#[inline(never)]
fn never_inline_add(a: i32, b: i32) -> i32 {
    a + b
}
```

## 函数文档

```rust
/// 计算两个数的和
/// 
/// # 参数
/// 
/// * `a` - 第一个加数
/// * `b` - 第二个加数
/// 
/// # 返回值
/// 
/// 返回两个数的和
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

/// 计算圆的面积
/// 
/// # 参数
/// 
/// * `radius` - 圆的半径
/// 
/// # 返回值
/// 
/// 返回圆的面积
/// 
/// # Panics
/// 
/// 当半径为负数时会 panic
fn circle_area(radius: f64) -> f64 {
    assert!(radius >= 0.0, "半径不能为负数");
    std::f64::consts::PI * radius * radius
}
```

## 练习

### 练习 1：温度转换
编写函数将摄氏度转换为华氏度，以及华氏度转换为摄氏度。

### 练习 2：数学运算
编写一个计算器模块，包含加、减、乘、除四个函数。

### 练习 3：字符串处理
编写函数检查字符串是否为回文。

### 练习 4：递归练习
编写递归函数计算最大公约数（GCD）。

### 练习 5：高阶函数
编写一个函数，接受一个数组和一个操作函数，对数组中的每个元素应用该操作。

## 下一步

掌握了函数的使用后，您可以继续学习：

1. [所有权系统](./ownership.md) - Rust 最重要的概念
2. [结构体](./structs.md) - 创建自定义数据类型
3. [枚举与模式匹配](./enums.md) - 强大的数据建模工具

函数是构建复杂程序的基础，继续探索 Rust 的更多特性吧！
