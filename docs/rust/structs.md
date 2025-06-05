# 结构体

结构体（Struct）是一种自定义数据类型，允许您将多个相关的值组合在一起形成一个有意义的组合。结构体是 Rust 中创建复杂数据类型的主要方式。

## 定义结构体

### 基本结构体

```rust
// 定义结构体
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    // 创建结构体实例
    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };
    
    println!("用户名：{}", user1.username);
    println!("邮箱：{}", user1.email);
}
```

### 可变结构体

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    let mut user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };
    
    // 修改字段值
    user1.email = String::from("anotheremail@example.com");
    user1.sign_in_count += 1;
    
    println!("新邮箱：{}", user1.email);
    println!("登录次数：{}", user1.sign_in_count);
}
```

## 结构体语法

### 字段初始化简写

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username, // 字段初始化简写
        email,    // 字段初始化简写
        sign_in_count: 1,
    }
}

fn main() {
    let user = build_user(
        String::from("test@example.com"),
        String::from("testuser"),
    );
    
    println!("用户：{}", user.username);
}
```

### 结构体更新语法

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    let user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };
    
    // 使用结构体更新语法创建新实例
    let user2 = User {
        email: String::from("another@example.com"),
        ..user1 // 其余字段从 user1 获取
    };
    
    println!("用户2邮箱：{}", user2.email);
    println!("用户2用户名：{}", user2.username);
    
    // 注意：user1 的 username 被移动到 user2，user1 不再完全可用
    // println!("{}", user1.username); // 错误！
    println!("{}", user1.active); // 但基本类型字段仍可用
}
```

## 元组结构体

### 基本元组结构体

```rust
// 元组结构体
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
    
    // 访问元组结构体的字段
    println!("黑色：({}, {}, {})", black.0, black.1, black.2);
    println!("原点：({}, {}, {})", origin.0, origin.1, origin.2);
    
    // 解构元组结构体
    let Color(r, g, b) = black;
    println!("RGB：{}, {}, {}", r, g, b);
}
```

### 单元结构体

```rust
// 单元结构体（没有字段）
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
    
    // 单元结构体常用于实现 trait 而不需要存储数据
    println!("单元结构体创建成功");
}
```

## 方法

### 定义方法

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 方法：第一个参数是 &self
    fn area(&self) -> u32 {
        self.width * self.height
    }
    
    fn width(&self) -> bool {
        self.width > 0
    }
    
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    
    println!("矩形面积：{}", rect1.area());
    println!("矩形有宽度：{}", rect1.width());
    println!("rect1 能容纳 rect2：{}", rect1.can_hold(&rect2));
}
```

### 可变方法

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
    
    // 可变方法：修改 self
    fn double(&mut self) {
        self.width *= 2;
        self.height *= 2;
    }
    
    // 获取所有权的方法
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
    
    println!("原始面积：{}", rect.area());
    
    rect.double();
    println!("翻倍后面积：{}", rect.area());
    
    let square = rect.into_square(); // rect 被移动
    println!("正方形面积：{}", square.area());
}
```

## 关联函数

### 构造函数

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 关联函数：不以 self 作为第一个参数
    fn new(width: u32, height: u32) -> Rectangle {
        Rectangle { width, height }
    }
    
    fn square(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            height: size,
        }
    }
    
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    // 使用关联函数创建实例
    let rect = Rectangle::new(30, 50);
    let square = Rectangle::square(25);
    
    println!("矩形面积：{}", rect.area());
    println!("正方形面积：{}", square.area());
}
```

### 多个 impl 块

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    
    println!("面积：{}", rect1.area());
    println!("能容纳：{}", rect1.can_hold(&rect2));
}
```

## 结构体与所有权

### 字段所有权

```rust
struct User {
    active: bool,
    username: String,    // 拥有数据
    email: String,       // 拥有数据
    sign_in_count: u64,
}

// 使用引用的结构体需要生命周期参数
struct UserRef<'a> {
    active: bool,
    username: &'a str,   // 借用数据
    email: &'a str,      // 借用数据
    sign_in_count: u64,
}

fn main() {
    // 拥有数据的结构体
    let user1 = User {
        active: true,
        username: String::from("user1"),
        email: String::from("user1@example.com"),
        sign_in_count: 1,
    };
    
    // 借用数据的结构体
    let username = "user2";
    let email = "user2@example.com";
    let user2 = UserRef {
        active: true,
        username,
        email,
        sign_in_count: 1,
    };
    
    println!("用户1：{}", user1.username);
    println!("用户2：{}", user2.username);
}
```

## 调试结构体

### Debug trait

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    
    // 调试打印
    println!("rect1 是 {:?}", rect1);
    
    // 美化调试打印
    println!("rect1 是 {:#?}", rect1);
    
    // 使用 dbg! 宏
    let scale = 2;
    let rect2 = Rectangle {
        width: dbg!(30 * scale),
        height: 50,
    };
    
    dbg!(&rect2);
}
```

### 自定义 Display

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

impl fmt::Debug for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Point {{ x: {}, y: {} }}", self.x, self.y)
    }
}

fn main() {
    let point = Point { x: 3, y: 4 };
    
    println!("Display: {}", point);
    println!("Debug: {:?}", point);
}
```

## 结构体模式匹配

### 解构结构体

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };
    
    // 解构结构体
    let Point { x, y } = p;
    println!("x: {}, y: {}", x, y);
    
    // 部分解构
    let Point { x, .. } = p;
    println!("x: {}", x);
    
    // 重命名字段
    let Point { x: a, y: b } = p;
    println!("a: {}, b: {}", a, b);
    
    // 在 match 中使用
    match p {
        Point { x, y: 0 } => println!("在 x 轴上，x = {}", x),
        Point { x: 0, y } => println!("在 y 轴上，y = {}", y),
        Point { x, y } => println!("在其他位置：({}, {})", x, y),
    }
}
```

## 嵌套结构体

### 复杂数据结构

```rust
#[derive(Debug)]
struct Address {
    street: String,
    city: String,
    country: String,
}

#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
    address: Address,
}

impl Person {
    fn new(name: String, age: u32, address: Address) -> Person {
        Person { name, age, address }
    }
    
    fn full_info(&self) -> String {
        format!("{}, {} 岁, 住址：{}, {}, {}", 
                 self.name, self.age, 
                 self.address.street, self.address.city, self.address.country)
    }
}

fn main() {
    let address = Address {
        street: String::from("123 Main St"),
        city: String::from("北京"),
        country: String::from("中国"),
    };
    
    let person = Person::new(
        String::from("张三"),
        30,
        address,
    );
    
    println!("{:#?}", person);
    println!("{}", person.full_info());
}
```

## 实际应用示例

### 图形计算

```rust
#[derive(Debug, Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}

#[derive(Debug)]
struct Circle {
    center: Point,
    radius: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Point {
        Point { x, y }
    }
    
    fn distance_to(&self, other: &Point) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }
}

impl Circle {
    fn new(center: Point, radius: f64) -> Circle {
        Circle { center, radius }
    }
    
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }
    
    fn circumference(&self) -> f64 {
        2.0 * std::f64::consts::PI * self.radius
    }
    
    fn contains_point(&self, point: &Point) -> bool {
        self.center.distance_to(point) <= self.radius
    }
}

fn main() {
    let center = Point::new(0.0, 0.0);
    let circle = Circle::new(center, 5.0);
    
    println!("圆心：{:?}", circle.center);
    println!("半径：{}", circle.radius);
    println!("面积：{:.2}", circle.area());
    println!("周长：{:.2}", circle.circumference());
    
    let test_point = Point::new(3.0, 4.0);
    println!("点 {:?} 在圆内：{}", test_point, circle.contains_point(&test_point));
}
```

### 数据建模

```rust
#[derive(Debug)]
enum Status {
    Active,
    Inactive,
    Pending,
}

#[derive(Debug)]
struct Account {
    id: u64,
    username: String,
    email: String,
    status: Status,
    balance: f64,
}

impl Account {
    fn new(id: u64, username: String, email: String) -> Account {
        Account {
            id,
            username,
            email,
            status: Status::Pending,
            balance: 0.0,
        }
    }
    
    fn activate(&mut self) {
        self.status = Status::Active;
    }
    
    fn deposit(&mut self, amount: f64) -> Result<(), String> {
        if amount <= 0.0 {
            return Err("存款金额必须大于0".to_string());
        }
        
        match self.status {
            Status::Active => {
                self.balance += amount;
                Ok(())
            }
            _ => Err("账户未激活".to_string()),
        }
    }
    
    fn withdraw(&mut self, amount: f64) -> Result<(), String> {
        if amount <= 0.0 {
            return Err("取款金额必须大于0".to_string());
        }
        
        if amount > self.balance {
            return Err("余额不足".to_string());
        }
        
        match self.status {
            Status::Active => {
                self.balance -= amount;
                Ok(())
            }
            _ => Err("账户未激活".to_string()),
        }
    }
}

fn main() {
    let mut account = Account::new(
        1,
        String::from("alice"),
        String::from("alice@example.com"),
    );
    
    println!("新账户：{:#?}", account);
    
    account.activate();
    println!("激活后状态：{:?}", account.status);
    
    match account.deposit(100.0) {
        Ok(()) => println!("存款成功，余额：{}", account.balance),
        Err(e) => println!("存款失败：{}", e),
    }
    
    match account.withdraw(30.0) {
        Ok(()) => println!("取款成功，余额：{}", account.balance),
        Err(e) => println!("取款失败：{}", e),
    }
}
```

## 练习

### 练习 1：学生管理系统
创建一个 `Student` 结构体，包含姓名、年龄、成绩等字段，实现计算平均分的方法。

### 练习 2：图书管理
设计 `Book` 和 `Library` 结构体，实现添加、查找、借阅图书的功能。

### 练习 3：几何图形
创建不同的几何图形结构体（矩形、圆形、三角形），实现计算面积和周长的方法。

### 练习 4：购物车
设计购物车系统，包含商品、购物车等结构体，实现添加商品、计算总价等功能。

## 下一步

掌握了结构体后，您可以继续学习：

1. [枚举与模式匹配](./enums.md) - 更强大的数据建模工具
2. [模块系统](./modules.md) - 代码组织和可见性
3. [泛型](./generics.md) - 编写通用的结构体和方法

结构体是 Rust 中组织数据的基础，掌握它将帮助您构建更复杂的应用程序！
