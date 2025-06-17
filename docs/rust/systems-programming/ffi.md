# FFI外部函数接口

## 🎯 FFI概述

FFI（Foreign Function Interface）允许Rust代码与其他编程语言（主要是C/C++）编写的代码进行互操作。这是系统编程中的重要技能，让您能够利用现有的C库和系统API。

## 🔧 调用C函数

### 基础C函数调用
```rust
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};

// 声明C标准库函数
extern "C" {
    fn strlen(s: *const c_char) -> usize;
    fn strcmp(s1: *const c_char, s2: *const c_char) -> c_int;
    fn malloc(size: usize) -> *mut std::ffi::c_void;
    fn free(ptr: *mut std::ffi::c_void);
}

fn basic_c_functions() -> Result<(), Box<dyn std::error::Error>> {
    // 使用C字符串
    let rust_string = "Hello, FFI!";
    let c_string = CString::new(rust_string)?;
    
    unsafe {
        let len = strlen(c_string.as_ptr());
        println!("String length (from C): {}", len);
        
        // 字符串比较
        let other_string = CString::new("Hello, FFI!")?;
        let cmp_result = strcmp(c_string.as_ptr(), other_string.as_ptr());
        println!("String comparison: {}", cmp_result);
    }
    
    Ok(())
}
```

### 使用libc库
```rust
use libc::{getpid, time, c_long};

fn libc_functions() {
    unsafe {
        // 获取进程ID
        let pid = getpid();
        println!("Process ID: {}", pid);
        
        // 获取当前时间
        let current_time = time(std::ptr::null_mut());
        println!("Current time: {}", current_time);
        
        // 使用系统调用
        let result = libc::write(1, b"Hello from libc!\n".as_ptr() as *const _, 17);
        if result == -1 {
            println!("Write failed");
        }
    }
}
```

## 📚 创建C兼容的库

### 导出Rust函数给C使用
```rust
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};

// 导出给C使用的函数
#[no_mangle]
pub extern "C" fn rust_add(a: c_int, b: c_int) -> c_int {
    a + b
}

#[no_mangle]
pub extern "C" fn rust_string_length(s: *const c_char) -> usize {
    if s.is_null() {
        return 0;
    }
    
    unsafe {
        CStr::from_ptr(s).to_bytes().len()
    }
}

#[no_mangle]
pub extern "C" fn rust_create_string() -> *mut c_char {
    let s = CString::new("Hello from Rust!").unwrap();
    s.into_raw()
}

#[no_mangle]
pub extern "C" fn rust_free_string(s: *mut c_char) {
    if s.is_null() {
        return;
    }
    
    unsafe {
        let _ = CString::from_raw(s);
    }
}

// 复杂数据结构
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[no_mangle]
pub extern "C" fn rust_distance(p1: *const Point, p2: *const Point) -> f64 {
    if p1.is_null() || p2.is_null() {
        return -1.0;
    }
    
    unsafe {
        let p1 = &*p1;
        let p2 = &*p2;
        let dx = p1.x - p2.x;
        let dy = p1.y - p2.y;
        (dx * dx + dy * dy).sqrt()
    }
}
```

### 对应的C头文件
```c
// rust_lib.h
#ifndef RUST_LIB_H
#define RUST_LIB_H

#include <stddef.h>

typedef struct {
    double x;
    double y;
} Point;

int rust_add(int a, int b);
size_t rust_string_length(const char* s);
char* rust_create_string(void);
void rust_free_string(char* s);
double rust_distance(const Point* p1, const Point* p2);

#endif
```

## 🔗 绑定生成工具

### 使用bindgen自动生成绑定
```toml
# Cargo.toml
[build-dependencies]
bindgen = "0.60"

[dependencies]
libc = "0.2"
```

```rust
// build.rs
extern crate bindgen;

use std::env;
use std::path::PathBuf;

fn main() {
    // 告诉cargo重新运行如果头文件改变
    println!("cargo:rerun-if-changed=wrapper.h");
    
    // 生成绑定
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks))
        .generate()
        .expect("Unable to generate bindings");
    
    // 写入绑定文件
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

```c
// wrapper.h
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 自定义结构体
typedef struct {
    int id;
    char name[64];
    double value;
} MyStruct;

// 函数声明
int process_data(MyStruct* data);
void cleanup_data(MyStruct* data);
```

```rust
// 使用生成的绑定
include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

fn use_generated_bindings() {
    unsafe {
        let mut data = MyStruct {
            id: 1,
            name: [0; 64],
            value: 3.14,
        };
        
        // 设置名称
        let name = b"Test\0";
        std::ptr::copy_nonoverlapping(
            name.as_ptr(),
            data.name.as_mut_ptr() as *mut u8,
            name.len()
        );
        
        let result = process_data(&mut data);
        println!("Process result: {}", result);
        
        cleanup_data(&mut data);
    }
}
```

## 🛡️ 安全的FFI封装

### 创建安全的Rust包装器
```rust
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int};

// 假设的C库函数
extern "C" {
    fn c_create_context() -> *mut std::ffi::c_void;
    fn c_destroy_context(ctx: *mut std::ffi::c_void);
    fn c_process_string(ctx: *mut std::ffi::c_void, input: *const c_char) -> *mut c_char;
    fn c_free_string(s: *mut c_char);
}

// 安全的Rust包装器
pub struct CContext {
    ctx: *mut std::ffi::c_void,
}

impl CContext {
    pub fn new() -> Option<Self> {
        let ctx = unsafe { c_create_context() };
        if ctx.is_null() {
            None
        } else {
            Some(CContext { ctx })
        }
    }
    
    pub fn process_string(&self, input: &str) -> Result<String, Box<dyn std::error::Error>> {
        let c_input = CString::new(input)?;
        
        unsafe {
            let result_ptr = c_process_string(self.ctx, c_input.as_ptr());
            if result_ptr.is_null() {
                return Err("C function returned null".into());
            }
            
            let c_str = CStr::from_ptr(result_ptr);
            let rust_string = c_str.to_string_lossy().into_owned();
            
            c_free_string(result_ptr);
            
            Ok(rust_string)
        }
    }
}

impl Drop for CContext {
    fn drop(&mut self) {
        unsafe {
            c_destroy_context(self.ctx);
        }
    }
}

// 使用安全包装器
fn safe_ffi_usage() -> Result<(), Box<dyn std::error::Error>> {
    let context = CContext::new().ok_or("Failed to create context")?;
    let result = context.process_string("Hello, safe FFI!")?;
    println!("Processed: {}", result);
    Ok(())
}
```

## 🔄 回调函数

### C回调函数处理
```rust
use std::ffi::c_void;
use std::os::raw::{c_int, c_char};

// C函数类型定义
type CCallback = extern "C" fn(data: *const c_char, user_data: *mut c_void) -> c_int;

extern "C" {
    fn register_callback(callback: CCallback, user_data: *mut c_void);
    fn trigger_callback();
}

// Rust回调函数
extern "C" fn rust_callback(data: *const c_char, user_data: *mut c_void) -> c_int {
    unsafe {
        if !data.is_null() {
            let c_str = std::ffi::CStr::from_ptr(data);
            if let Ok(rust_str) = c_str.to_str() {
                println!("Callback received: {}", rust_str);
            }
        }
        
        if !user_data.is_null() {
            let counter = user_data as *mut i32;
            *counter += 1;
            println!("Callback count: {}", *counter);
        }
    }
    
    0 // 成功返回码
}

fn callback_example() {
    let mut counter = 0i32;
    
    unsafe {
        register_callback(rust_callback, &mut counter as *mut i32 as *mut c_void);
        trigger_callback();
    }
    
    println!("Final counter: {}", counter);
}
```

### 闭包作为回调
```rust
use std::ffi::c_void;
use std::os::raw::c_int;

// 存储闭包的结构
struct CallbackData<F> {
    closure: F,
}

// 通用回调包装器
extern "C" fn callback_wrapper<F>(value: c_int, user_data: *mut c_void) -> c_int
where
    F: FnMut(i32) -> i32,
{
    unsafe {
        let callback_data = &mut *(user_data as *mut CallbackData<F>);
        (callback_data.closure)(value)
    }
}

// 注册闭包回调的安全接口
fn register_closure_callback<F>(mut closure: F) -> Box<CallbackData<F>>
where
    F: FnMut(i32) -> i32,
{
    let callback_data = Box::new(CallbackData { closure });
    
    unsafe {
        // 假设的C函数，注册回调
        // register_c_callback(callback_wrapper::<F>, callback_data.as_ref() as *const _ as *mut c_void);
    }
    
    callback_data
}
```

## 🧵 线程安全的FFI

### 跨线程FFI调用
```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::ffi::CString;

// 线程安全的C库包装器
pub struct ThreadSafeCLib {
    // 使用Mutex保护C库状态
    inner: Arc<Mutex<*mut std::ffi::c_void>>,
}

unsafe impl Send for ThreadSafeCLib {}
unsafe impl Sync for ThreadSafeCLib {}

impl ThreadSafeCLib {
    pub fn new() -> Option<Self> {
        unsafe {
            let ctx = c_create_context();
            if ctx.is_null() {
                None
            } else {
                Some(ThreadSafeCLib {
                    inner: Arc::new(Mutex::new(ctx)),
                })
            }
        }
    }
    
    pub fn process_in_thread(&self, input: String) -> thread::JoinHandle<Option<String>> {
        let inner = Arc::clone(&self.inner);
        
        thread::spawn(move || {
            let ctx = inner.lock().ok()?;
            let c_input = CString::new(input).ok()?;
            
            unsafe {
                let result_ptr = c_process_string(*ctx, c_input.as_ptr());
                if result_ptr.is_null() {
                    return None;
                }
                
                let c_str = std::ffi::CStr::from_ptr(result_ptr);
                let rust_string = c_str.to_string_lossy().into_owned();
                c_free_string(result_ptr);
                
                Some(rust_string)
            }
        })
    }
}

impl Drop for ThreadSafeCLib {
    fn drop(&mut self) {
        if let Ok(ctx) = self.inner.lock() {
            unsafe {
                c_destroy_context(*ctx);
            }
        }
    }
}
```

## 🔍 调试FFI代码

### FFI调试技巧
```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

// 调试宏
macro_rules! ffi_debug {
    ($msg:expr) => {
        #[cfg(debug_assertions)]
        eprintln!("[FFI DEBUG] {}", $msg);
    };
    ($fmt:expr, $($arg:tt)*) => {
        #[cfg(debug_assertions)]
        eprintln!("[FFI DEBUG] {}", format!($fmt, $($arg)*));
    };
}

// 安全的字符串转换函数
fn safe_c_string_to_rust(ptr: *const c_char) -> Option<String> {
    if ptr.is_null() {
        ffi_debug!("Null pointer passed to safe_c_string_to_rust");
        return None;
    }
    
    unsafe {
        match CStr::from_ptr(ptr).to_str() {
            Ok(s) => {
                ffi_debug!("Successfully converted C string: '{}'", s);
                Some(s.to_owned())
            }
            Err(e) => {
                ffi_debug!("Failed to convert C string: {}", e);
                None
            }
        }
    }
}

// 内存泄漏检测
static mut ALLOCATION_COUNT: std::sync::atomic::AtomicUsize = 
    std::sync::atomic::AtomicUsize::new(0);

fn track_c_allocation(ptr: *mut c_void, size: usize) {
    if !ptr.is_null() {
        let count = unsafe { 
            ALLOCATION_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed) 
        };
        ffi_debug!("C allocation #{}: {:p} ({} bytes)", count + 1, ptr, size);
    }
}

fn track_c_deallocation(ptr: *mut c_void) {
    if !ptr.is_null() {
        let count = unsafe { 
            ALLOCATION_COUNT.fetch_sub(1, std::sync::atomic::Ordering::Relaxed) 
        };
        ffi_debug!("C deallocation: {:p} (remaining: {})", ptr, count - 1);
    }
}
```

## 📚 最佳实践

### FFI安全检查清单
```rust
// 1. 空指针检查
fn check_null_pointer<T>(ptr: *const T, name: &str) -> Result<(), &'static str> {
    if ptr.is_null() {
        eprintln!("Null pointer detected: {}", name);
        Err("Null pointer")
    } else {
        Ok(())
    }
}

// 2. 字符串长度验证
fn validate_c_string(ptr: *const c_char, max_len: usize) -> Result<(), &'static str> {
    if ptr.is_null() {
        return Err("Null string pointer");
    }
    
    unsafe {
        let mut len = 0;
        let mut current = ptr;
        
        while len < max_len {
            if *current == 0 {
                return Ok(());
            }
            current = current.add(1);
            len += 1;
        }
        
        Err("String too long or not null-terminated")
    }
}

// 3. 错误码处理
#[derive(Debug)]
enum CLibError {
    Success = 0,
    InvalidArgument = -1,
    OutOfMemory = -2,
    IOError = -3,
}

impl From<c_int> for CLibError {
    fn from(code: c_int) -> Self {
        match code {
            0 => CLibError::Success,
            -1 => CLibError::InvalidArgument,
            -2 => CLibError::OutOfMemory,
            -3 => CLibError::IOError,
            _ => CLibError::InvalidArgument,
        }
    }
}

fn handle_c_result(result: c_int) -> Result<(), CLibError> {
    let error = CLibError::from(result);
    match error {
        CLibError::Success => Ok(()),
        _ => Err(error),
    }
}
```

---

*FFI是连接Rust与现有C/C++生态系统的桥梁，掌握它将大大扩展您的系统编程能力！🔗*
