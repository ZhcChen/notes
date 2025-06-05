# 智能指针

智能指针（Smart Pointers）是一类数据结构，它们的行为类似指针，但是拥有额外的元数据和功能。Rust 标准库中包含了多种智能指针，它们提供了超出引用所能提供的功能。

## 指针与智能指针的区别

### 普通引用

```rust
fn main() {
    let x = 5;
    let y = &x;  // 普通引用

    assert_eq!(5, x);
    assert_eq!(5, *y);  // 解引用

    println!("x = {}, y = {}", x, y);
}
```

### 智能指针特征

智能指针通常使用结构体实现，并实现了 `Deref` 和 `Drop` 特征：
- `Deref`：允许智能指针结构体实例表现得像引用一样
- `Drop`：允许自定义当智能指针离开作用域时运行的代码

## Box&lt;T&gt; - 堆上分配

### 基本使用

```rust
fn main() {
    // 在堆上存储数据
    let b = Box::new(5);
    println!("b = {}", b);

    // Box 实现了 Deref，可以像引用一样使用
    let x = 5;
    let y = Box::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

### 递归类型

```rust
// 使用 Box 定义递归类型
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
    
    // 打印链表
    print_list(&list);
}

fn print_list(list: &List) {
    match list {
        Cons(value, next) => {
            print!("{} -> ", value);
            print_list(next);
        }
        Nil => println!("Nil"),
    }
}
```

### 大型数据结构

```rust
struct LargeStruct {
    data: [u8; 1000000],  // 1MB 的数据
}

fn main() {
    // 避免栈溢出，将大型结构体放在堆上
    let large_data = Box::new(LargeStruct {
        data: [0; 1000000],
    });

    println!("Large data created on heap");
}
```

## Rc&lt;T&gt; - 引用计数

### 基本使用

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(5);
    println!("Reference count after creating a: {}", Rc::strong_count(&a));

    let b = Rc::clone(&a);  // 增加引用计数
    println!("Reference count after creating b: {}", Rc::strong_count(&a));

    {
        let c = Rc::clone(&a);  // 再次增加引用计数
        println!("Reference count after creating c: {}", Rc::strong_count(&a));
    }  // c 离开作用域，引用计数减少

    println!("Reference count after c goes out of scope: {}", Rc::strong_count(&a));
}
```

### 共享数据结构

```rust
use std::rc::Rc;

enum List {
    Cons(i32, Rc<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    println!("count after creating a = {}", Rc::strong_count(&a));

    let b = Cons(3, Rc::clone(&a));
    println!("count after creating b = {}", Rc::strong_count(&a));

    {
        let c = Cons(4, Rc::clone(&a));
        println!("count after creating c = {}", Rc::strong_count(&a));
    }

    println!("count after c goes out of scope = {}", Rc::strong_count(&a));
}
```

## RefCell&lt;T&gt; - 内部可变性

### 基本使用

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    // 借用可变引用
    *data.borrow_mut() += 1;

    // 借用不可变引用
    println!("data: {}", data.borrow());
}
```

### 运行时借用检查

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    let r1 = data.borrow();     // 不可变借用
    let r2 = data.borrow();     // 可以有多个不可变借用

    println!("r1: {}, r2: {}", r1, r2);

    // 释放不可变借用
    drop(r1);
    drop(r2);

    let mut r3 = data.borrow_mut();  // 可变借用
    *r3 += 1;
    println!("r3: {}", r3);

    // 下面的代码会在运行时 panic
    // let r4 = data.borrow();  // 错误！已有可变借用
}
```

### Rc&lt;RefCell&lt;T&gt;&gt; 组合

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let value = Rc::new(RefCell::new(5));

    let a = Rc::new(Cons(Rc::clone(&value), Rc::new(Nil)));
    let b = Cons(Rc::new(RefCell::new(3)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(4)), Rc::clone(&a));

    // 修改共享的值
    *value.borrow_mut() += 10;

    println!("a after = {:?}", a);
    println!("b after = {:?}", b);
    println!("c after = {:?}", c);
}
```

## 循环引用和内存泄漏

### 创建循环引用

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct Node {
    value: i32,
    children: RefCell<Vec<Rc<Node>>>,
    parent: RefCell<Option<Rc<Node>>>,
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        children: RefCell::new(vec![]),
        parent: RefCell::new(None),
    });

    let branch = Rc::new(Node {
        value: 5,
        children: RefCell::new(vec![Rc::clone(&leaf)]),
        parent: RefCell::new(None),
    });

    // 创建循环引用
    *leaf.parent.borrow_mut() = Some(Rc::clone(&branch));

    // 这会导致内存泄漏！
    println!("leaf parent = {:?}", leaf.parent.borrow().as_ref().unwrap().value);
}
```

## Weak&lt;T&gt; - 弱引用

### 避免循环引用

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[derive(Debug)]
struct Node {
    value: i32,
    children: RefCell<Vec<Rc<Node>>>,
    parent: RefCell<Option<Weak<Node>>>,  // 使用 Weak 引用
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        children: RefCell::new(vec![]),
        parent: RefCell::new(None),
    });

    println!("leaf strong = {}, weak = {}", 
             Rc::strong_count(&leaf), Rc::weak_count(&leaf));

    {
        let branch = Rc::new(Node {
            value: 5,
            children: RefCell::new(vec![Rc::clone(&leaf)]),
            parent: RefCell::new(None),
        });

        *leaf.parent.borrow_mut() = Some(Rc::downgrade(&branch));

        println!("branch strong = {}, weak = {}", 
                 Rc::strong_count(&branch), Rc::weak_count(&branch));
        println!("leaf strong = {}, weak = {}", 
                 Rc::strong_count(&leaf), Rc::weak_count(&leaf));

        // 访问父节点
        if let Some(parent) = leaf.parent.borrow().as_ref() {
            if let Some(parent_node) = parent.upgrade() {
                println!("leaf parent = {}", parent_node.value);
            }
        }
    }

    println!("leaf parent = {:?}", leaf.parent.borrow().as_ref());
    println!("leaf strong = {}, weak = {}", 
             Rc::strong_count(&leaf), Rc::weak_count(&leaf));
}
```

## 自定义智能指针

### 实现 Deref 特征

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);  // 解引用强制转换

    // 函数调用中的解引用强制转换
    let m = MyBox::new(String::from("Rust"));
    hello(&m);  // &MyBox<String> -> &String -> &str
}

fn hello(name: &str) {
    println!("Hello, {}!", name);
}
```

### 实现 Drop 特征

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer {
        data: String::from("my stuff"),
    };
    let d = CustomSmartPointer {
        data: String::from("other stuff"),
    };
    println!("CustomSmartPointers created.");

    // 手动释放
    drop(c);
    println!("CustomSmartPointer dropped before the end of main.");
}
```

## 实际应用示例

### 二叉树

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

type TreeNode = Rc<RefCell<Node>>;
type WeakTreeNode = Weak<RefCell<Node>>;

#[derive(Debug)]
struct Node {
    value: i32,
    left: Option<TreeNode>,
    right: Option<TreeNode>,
    parent: Option<WeakTreeNode>,
}

impl Node {
    fn new(value: i32) -> TreeNode {
        Rc::new(RefCell::new(Node {
            value,
            left: None,
            right: None,
            parent: None,
        }))
    }

    fn add_left_child(parent: &TreeNode, value: i32) -> TreeNode {
        let child = Node::new(value);
        child.borrow_mut().parent = Some(Rc::downgrade(parent));
        parent.borrow_mut().left = Some(child.clone());
        child
    }

    fn add_right_child(parent: &TreeNode, value: i32) -> TreeNode {
        let child = Node::new(value);
        child.borrow_mut().parent = Some(Rc::downgrade(parent));
        parent.borrow_mut().right = Some(child.clone());
        child
    }
}

fn print_tree(node: &TreeNode, depth: usize) {
    let indent = "  ".repeat(depth);
    println!("{}Node: {}", indent, node.borrow().value);

    if let Some(ref left) = node.borrow().left {
        println!("{}Left:", indent);
        print_tree(left, depth + 1);
    }

    if let Some(ref right) = node.borrow().right {
        println!("{}Right:", indent);
        print_tree(right, depth + 1);
    }
}

fn main() {
    let root = Node::new(1);
    let left = Node::add_left_child(&root, 2);
    let right = Node::add_right_child(&root, 3);
    Node::add_left_child(&left, 4);
    Node::add_right_child(&left, 5);

    print_tree(&root, 0);

    // 验证父子关系
    if let Some(parent) = left.borrow().parent.as_ref() {
        if let Some(parent_node) = parent.upgrade() {
            println!("Left child's parent value: {}", parent_node.borrow().value);
        }
    }
}
```

### 缓存系统

```rust
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

type CacheValue = Rc<RefCell<String>>;

struct Cache {
    data: RefCell<HashMap<String, CacheValue>>,
}

impl Cache {
    fn new() -> Self {
        Cache {
            data: RefCell::new(HashMap::new()),
        }
    }

    fn get(&self, key: &str) -> Option<CacheValue> {
        self.data.borrow().get(key).cloned()
    }

    fn set(&self, key: String, value: String) {
        let cache_value = Rc::new(RefCell::new(value));
        self.data.borrow_mut().insert(key, cache_value);
    }

    fn update(&self, key: &str, new_value: String) -> bool {
        if let Some(value) = self.get(key) {
            *value.borrow_mut() = new_value;
            true
        } else {
            false
        }
    }

    fn remove(&self, key: &str) -> bool {
        self.data.borrow_mut().remove(key).is_some()
    }

    fn size(&self) -> usize {
        self.data.borrow().len()
    }
}

fn main() {
    let cache = Cache::new();

    // 设置缓存
    cache.set("user:1".to_string(), "Alice".to_string());
    cache.set("user:2".to_string(), "Bob".to_string());

    // 获取缓存
    if let Some(user) = cache.get("user:1") {
        println!("User 1: {}", user.borrow());
    }

    // 更新缓存
    cache.update("user:1", "Alice Smith".to_string());

    // 共享引用
    let user1_ref = cache.get("user:1").unwrap();
    let another_ref = user1_ref.clone();

    println!("Original ref: {}", user1_ref.borrow());
    println!("Another ref: {}", another_ref.borrow());

    // 通过一个引用修改，另一个引用也能看到变化
    *user1_ref.borrow_mut() = "Alice Johnson".to_string();
    println!("After update - Another ref: {}", another_ref.borrow());

    println!("Cache size: {}", cache.size());
}
```

## 性能考虑

### 智能指针的开销

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    // Box<T> - 最小开销，只是堆分配
    let boxed = Box::new(42);
    println!("Box size: {}", std::mem::size_of_val(&boxed));

    // Rc<T> - 引用计数开销
    let rc = Rc::new(42);
    println!("Rc size: {}", std::mem::size_of_val(&rc));
    println!("Rc strong count: {}", Rc::strong_count(&rc));

    // RefCell<T> - 运行时借用检查开销
    let refcell = RefCell::new(42);
    println!("RefCell size: {}", std::mem::size_of_val(&refcell));

    // Rc<RefCell<T>> - 组合开销
    let rc_refcell = Rc::new(RefCell::new(42));
    println!("Rc<RefCell<T>> size: {}", std::mem::size_of_val(&rc_refcell));
}
```

## 练习

### 练习 1：链表实现
使用智能指针实现一个双向链表。

### 练习 2：图结构
创建一个图数据结构，处理节点间的循环引用。

### 练习 3：观察者模式
使用智能指针实现观察者模式。

### 练习 4：内存池
实现一个简单的内存池，使用智能指针管理对象生命周期。

## 下一步

掌握了智能指针后，您可以继续学习：

1. [并发编程](./concurrency.md) - 多线程和并发
2. [异步编程](./async.md) - async/await 模式
3. [测试](./testing.md) - 单元测试和集成测试

智能指针是 Rust 中管理复杂内存模式的重要工具！
