# unsafe Rust

unsafe Rust 允许您绕过 Rust 的安全检查，直接操作内存和调用不安全的函数。虽然强大，但需要程序员手动保证内存安全。

## unsafe 的五种超能力

### 1. 解引用裸指针

```rust
fn main() {
    let mut num = 5;

    // 创建裸指针
    let r1 = &num as *const i32;
    let r2 = &mut num as *mut i32;

    // 在 unsafe 块中解引用裸指针
    unsafe {
        println!("r1 is: {}", *r1);
        println!("r2 is: {}", *r2);
        
        // 修改值
        *r2 = 10;
        println!("r2 after modification: {}", *r2);
    }
}
```

### 2. 调用不安全函数

```rust
unsafe fn dangerous() {
    println!("This is a dangerous function!");
}

fn main() {
    unsafe {
        dangerous();
    }
}
```

### 3. 访问或修改可变静态变量

```rust
static mut COUNTER: usize = 0;

fn add_to_count(inc: usize) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    add_to_count(3);

    unsafe {
        println!("COUNTER: {}", COUNTER);
    }
}
```

### 4. 实现不安全特征

```rust
unsafe trait Foo {
    // 方法定义
}

unsafe impl Foo for i32 {
    // 实现
}

fn main() {
    // 使用不安全特征
}
```

### 5. 访问联合体字段

```rust
union MyUnion {
    f1: u32,
    f2: f32,
}

fn main() {
    let u = MyUnion { f1: 1 };

    unsafe {
        let f = u.f1;
        println!("f1: {}", f);
    }
}
```

## 裸指针详解

### 创建裸指针

```rust
fn main() {
    let mut num = 5;

    // 从引用创建裸指针（安全）
    let r1 = &num as *const i32;
    let r2 = &mut num as *mut i32;

    // 从任意内存地址创建裸指针（危险）
    let address = 0x012345usize;
    let r3 = address as *const i32;

    println!("r1: {:p}", r1);
    println!("r2: {:p}", r2);
    println!("r3: {:p}", r3);

    // 只能在 unsafe 块中解引用
    unsafe {
        println!("Value at r1: {}", *r1);
        // println!("Value at r3: {}", *r3); // 危险！可能导致段错误
    }
}
```

### 裸指针运算

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let ptr = arr.as_ptr();

    unsafe {
        for i in 0..5 {
            let value = *ptr.add(i);
            println!("arr[{}] = {}", i, value);
        }
    }
}
```

### 空指针检查

```rust
fn main() {
    let ptr: *const i32 = std::ptr::null();

    if ptr.is_null() {
        println!("Pointer is null");
    } else {
        unsafe {
            println!("Value: {}", *ptr);
        }
    }
}
```

## 不安全函数和方法

### 定义不安全函数

```rust
unsafe fn slice_from_raw_parts(ptr: *const i32, len: usize) -> &'static [i32] {
    std::slice::from_raw_parts(ptr, len)
}

fn main() {
    let arr = [1, 2, 3, 4, 5];
    let ptr = arr.as_ptr();

    unsafe {
        let slice = slice_from_raw_parts(ptr, 5);
        println!("Slice: {:?}", slice);
    }
}
```

### 包装不安全代码

```rust
use std::slice;

fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();

    assert!(mid <= len);

    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = vec![1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut v, 3);
    
    println!("Left: {:?}", left);
    println!("Right: {:?}", right);
}
```

## 外部函数接口 (FFI)

### 调用 C 函数

```rust
extern "C" {
    fn abs(input: i32) -> i32;
    fn sqrt(input: f64) -> f64;
}

fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
        println!("Square root of 9 according to C: {}", sqrt(9.0));
    }
}
```

### 从其他语言调用 Rust

```rust
#[no_mangle]
pub extern "C" fn call_from_c() {
    println!("Just called a Rust function from C!");
}

#[no_mangle]
pub extern "C" fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    // 这些函数可以从 C 代码中调用
}
```

## 全局变量

### 静态变量

```rust
static HELLO_WORLD: &str = "Hello, world!";

static mut COUNTER: usize = 0;

fn increment_counter() {
    unsafe {
        COUNTER += 1;
    }
}

fn get_counter() -> usize {
    unsafe { COUNTER }
}

fn main() {
    println!("{}", HELLO_WORLD);

    increment_counter();
    increment_counter();
    println!("Counter: {}", get_counter());
}
```

### 使用 lazy_static

```rust
// 需要在 Cargo.toml 中添加：
// lazy_static = "1.4"

use lazy_static::lazy_static;
use std::collections::HashMap;

lazy_static! {
    static ref HASHMAP: HashMap<u32, &'static str> = {
        let mut m = HashMap::new();
        m.insert(0, "foo");
        m.insert(1, "bar");
        m.insert(2, "baz");
        m
    };
}

fn main() {
    println!("The entry for `0` is \"{}\".", HASHMAP.get(&0).unwrap());
}
```

## 联合体

### 基本联合体

```rust
#[repr(C)]
union Data {
    i: i32,
    f: f32,
}

fn main() {
    let mut data = Data { i: 42 };

    unsafe {
        println!("data.i: {}", data.i);
        
        data.f = 3.14;
        println!("data.f: {}", data.f);
        
        // 注意：此时 data.i 的值是未定义的
        println!("data.i after setting f: {}", data.i);
    }
}
```

### 联合体的实际应用

```rust
#[repr(C)]
union FloatOrInt {
    float_val: f32,
    int_val: u32,
}

impl FloatOrInt {
    fn new_float(f: f32) -> Self {
        FloatOrInt { float_val: f }
    }

    fn new_int(i: u32) -> Self {
        FloatOrInt { int_val: i }
    }

    unsafe fn as_float(&self) -> f32 {
        self.float_val
    }

    unsafe fn as_int(&self) -> u32 {
        self.int_val
    }
}

fn main() {
    let val = FloatOrInt::new_float(3.14);

    unsafe {
        println!("As float: {}", val.as_float());
        println!("As int: {}", val.as_int());
    }
}
```

## 内存管理

### 手动内存分配

```rust
use std::alloc::{alloc, dealloc, Layout};

fn main() {
    unsafe {
        // 分配内存
        let layout = Layout::new::<i32>();
        let ptr = alloc(layout) as *mut i32;

        if ptr.is_null() {
            panic!("Memory allocation failed");
        }

        // 写入值
        *ptr = 42;
        println!("Value: {}", *ptr);

        // 释放内存
        dealloc(ptr as *mut u8, layout);
    }
}
```

### 自定义分配器

```rust
use std::alloc::{GlobalAlloc, Layout, System};

struct MyAllocator;

unsafe impl GlobalAlloc for MyAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        println!("Allocating {} bytes", layout.size());
        System.alloc(layout)
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        println!("Deallocating {} bytes", layout.size());
        System.dealloc(ptr, layout)
    }
}

#[global_allocator]
static GLOBAL: MyAllocator = MyAllocator;

fn main() {
    let v = vec![1, 2, 3, 4, 5];
    println!("Vector: {:?}", v);
}
```

## 实际应用示例

### 高性能向量操作

```rust
fn add_vectors_safe(a: &[f32], b: &[f32], result: &mut [f32]) {
    assert_eq!(a.len(), b.len());
    assert_eq!(a.len(), result.len());

    for i in 0..a.len() {
        result[i] = a[i] + b[i];
    }
}

fn add_vectors_unsafe(a: &[f32], b: &[f32], result: &mut [f32]) {
    assert_eq!(a.len(), b.len());
    assert_eq!(a.len(), result.len());

    let len = a.len();
    let a_ptr = a.as_ptr();
    let b_ptr = b.as_ptr();
    let result_ptr = result.as_mut_ptr();

    unsafe {
        for i in 0..len {
            *result_ptr.add(i) = *a_ptr.add(i) + *b_ptr.add(i);
        }
    }
}

fn main() {
    let a = vec![1.0, 2.0, 3.0, 4.0];
    let b = vec![5.0, 6.0, 7.0, 8.0];
    let mut result = vec![0.0; 4];

    add_vectors_safe(&a, &b, &mut result);
    println!("Safe result: {:?}", result);

    result.fill(0.0);
    add_vectors_unsafe(&a, &b, &mut result);
    println!("Unsafe result: {:?}", result);
}
```

### 零拷贝字符串分割

```rust
struct UnsafeStrSplit<'a> {
    remainder: *const u8,
    end: *const u8,
    delimiter: u8,
    _phantom: std::marker::PhantomData<&'a str>,
}

impl<'a> UnsafeStrSplit<'a> {
    fn new(s: &'a str, delimiter: char) -> Self {
        let bytes = s.as_bytes();
        UnsafeStrSplit {
            remainder: bytes.as_ptr(),
            end: unsafe { bytes.as_ptr().add(bytes.len()) },
            delimiter: delimiter as u8,
            _phantom: std::marker::PhantomData,
        }
    }
}

impl<'a> Iterator for UnsafeStrSplit<'a> {
    type Item = &'a str;

    fn next(&mut self) -> Option<Self::Item> {
        if self.remainder >= self.end {
            return None;
        }

        unsafe {
            let start = self.remainder;
            let mut current = self.remainder;

            while current < self.end && *current != self.delimiter {
                current = current.add(1);
            }

            let slice = std::slice::from_raw_parts(start, current as usize - start as usize);
            let result = std::str::from_utf8_unchecked(slice);

            if current < self.end {
                self.remainder = current.add(1); // 跳过分隔符
            } else {
                self.remainder = self.end;
            }

            Some(result)
        }
    }
}

fn main() {
    let text = "hello,world,rust,programming";
    let splitter = UnsafeStrSplit::new(text, ',');

    for part in splitter {
        println!("Part: {}", part);
    }
}
```

### 内存映射文件

```rust
use std::fs::File;
use std::os::unix::io::AsRawFd;

struct MemoryMappedFile {
    ptr: *mut u8,
    len: usize,
}

impl MemoryMappedFile {
    fn new(file: &File) -> Result<Self, Box<dyn std::error::Error>> {
        let metadata = file.metadata()?;
        let len = metadata.len() as usize;

        unsafe {
            let ptr = libc::mmap(
                std::ptr::null_mut(),
                len,
                libc::PROT_READ,
                libc::MAP_PRIVATE,
                file.as_raw_fd(),
                0,
            ) as *mut u8;

            if ptr == libc::MAP_FAILED as *mut u8 {
                return Err("mmap failed".into());
            }

            Ok(MemoryMappedFile { ptr, len })
        }
    }

    fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }
}

impl Drop for MemoryMappedFile {
    fn drop(&mut self) {
        unsafe {
            libc::munmap(self.ptr as *mut libc::c_void, self.len);
        }
    }
}

// 注意：这个例子需要 libc crate 和 Unix 系统
```

## 安全抽象

### 封装不安全代码

```rust
pub struct Vec<T> {
    ptr: *mut T,
    cap: usize,
    len: usize,
}

impl<T> Vec<T> {
    pub fn new() -> Self {
        Vec {
            ptr: std::ptr::NonNull::dangling().as_ptr(),
            cap: 0,
            len: 0,
        }
    }

    pub fn push(&mut self, elem: T) {
        if self.len == self.cap {
            self.grow();
        }

        unsafe {
            std::ptr::write(self.ptr.add(self.len), elem);
        }
        self.len += 1;
    }

    pub fn pop(&mut self) -> Option<T> {
        if self.len == 0 {
            None
        } else {
            self.len -= 1;
            unsafe { Some(std::ptr::read(self.ptr.add(self.len))) }
        }
    }

    fn grow(&mut self) {
        let new_cap = if self.cap == 0 { 1 } else { 2 * self.cap };
        let new_layout = std::alloc::Layout::array::<T>(new_cap).unwrap();

        let new_ptr = if self.cap == 0 {
            unsafe { std::alloc::alloc(new_layout) }
        } else {
            let old_layout = std::alloc::Layout::array::<T>(self.cap).unwrap();
            unsafe { std::alloc::realloc(self.ptr as *mut u8, old_layout, new_layout.size()) }
        };

        if new_ptr.is_null() {
            std::alloc::handle_alloc_error(new_layout);
        }

        self.ptr = new_ptr as *mut T;
        self.cap = new_cap;
    }
}

impl<T> Drop for Vec<T> {
    fn drop(&mut self) {
        while let Some(_) = self.pop() {}

        if self.cap != 0 {
            let layout = std::alloc::Layout::array::<T>(self.cap).unwrap();
            unsafe {
                std::alloc::dealloc(self.ptr as *mut u8, layout);
            }
        }
    }
}
```

## 最佳实践

### 最小化 unsafe 代码

```rust
// 好：将 unsafe 限制在小范围内
fn safe_function(data: &[u8]) -> Option<u32> {
    if data.len() < 4 {
        return None;
    }

    unsafe {
        // 我们已经检查了长度，所以这是安全的
        let ptr = data.as_ptr() as *const u32;
        Some(*ptr)
    }
}

// 不好：大范围的 unsafe 块
// unsafe fn unsafe_function(data: &[u8]) -> Option<u32> {
//     // 大量代码...
// }
```

### 文档化不安全代码

```rust
/// 从字节切片中读取 u32 值
/// 
/// # Safety
/// 
/// 调用者必须确保：
/// - `data` 至少包含 4 个字节
/// - `data` 的前 4 个字节是有效的 u32 表示
/// - `data` 的内存对齐适合读取 u32
unsafe fn read_u32_unchecked(data: &[u8]) -> u32 {
    let ptr = data.as_ptr() as *const u32;
    *ptr
}
```

## 练习

### 练习 1：安全包装器
为一个不安全的 C 库函数创建安全的 Rust 包装器。

### 练习 2：自定义集合
实现一个简单的链表，使用裸指针管理节点。

### 练习 3：内存池
创建一个简单的内存池分配器。

### 练习 4：零拷贝解析器
实现一个零拷贝的 CSV 解析器。

## 下一步

掌握了 unsafe Rust 后，您可以继续学习：

1. [常用库推荐](./ecosystem.md) - 社区生态
2. [开发工具](./tools.md) - 提高开发效率
3. [性能优化](./performance.md) - 编写高性能代码

unsafe Rust 是系统编程和性能优化的重要工具，但请谨慎使用！
