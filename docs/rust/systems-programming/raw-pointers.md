# 指针与原始内存操作

## 🎯 原始指针概述

原始指针（Raw Pointers）是Rust中最底层的内存访问方式，它们绕过了Rust的借用检查器，提供了与C语言类似的直接内存访问能力。

## 🔧 原始指针基础

### 原始指针类型
```rust
fn raw_pointer_basics() {
    let x = 42;
    let y = &x as *const i32;    // 不可变原始指针
    let mut z = 42;
    let w = &mut z as *mut i32;  // 可变原始指针
    
    println!("Value of x: {}", x);
    println!("Address of x: {:p}", y);
    
    // 原始指针解引用需要在unsafe块中
    unsafe {
        println!("Value through raw pointer: {}", *y);
        *w = 100;
        println!("Modified value: {}", z);
    }
}
```

### 指针算术
```rust
fn pointer_arithmetic() {
    let arr = [1, 2, 3, 4, 5];
    let ptr = arr.as_ptr();
    
    unsafe {
        // 指针偏移
        for i in 0..arr.len() {
            let element_ptr = ptr.add(i);
            println!("Element {}: {}", i, *element_ptr);
        }
        
        // 指针比较
        let ptr1 = ptr;
        let ptr2 = ptr.add(2);
        println!("Pointer difference: {}", ptr2.offset_from(ptr1));
        
        // 指针范围检查
        let end_ptr = ptr.add(arr.len());
        let mut current = ptr;
        while current < end_ptr {
            println!("Value: {}", *current);
            current = current.add(1);
        }
    }
}
```

## 🧠 内存布局操作

### 结构体内存布局
```rust
use std::mem;

#[repr(C)]
struct Point {
    x: f64,
    y: f64,
}

#[repr(C)]
struct ComplexStruct {
    flag: bool,
    value: u32,
    data: [u8; 16],
}

fn memory_layout_analysis() {
    println!("=== Point Structure ===");
    println!("Size: {} bytes", mem::size_of::<Point>());
    println!("Alignment: {} bytes", mem::align_of::<Point>());
    
    let point = Point { x: 3.14, y: 2.71 };
    let ptr = &point as *const Point as *const u8;
    
    unsafe {
        // 以字节形式查看结构体内存
        let bytes = std::slice::from_raw_parts(ptr, mem::size_of::<Point>());
        println!("Memory bytes: {:?}", bytes);
        
        // 访问结构体字段的指针
        let x_ptr = &point.x as *const f64;
        let y_ptr = &point.y as *const f64;
        
        println!("X field address: {:p}, value: {}", x_ptr, *x_ptr);
        println!("Y field address: {:p}, value: {}", y_ptr, *y_ptr);
    }
    
    println!("\n=== Complex Structure ===");
    let complex = ComplexStruct {
        flag: true,
        value: 0x12345678,
        data: [0; 16],
    };
    
    unsafe {
        let base_ptr = &complex as *const ComplexStruct as *const u8;
        
        // 计算字段偏移
        let flag_offset = &complex.flag as *const bool as *const u8;
        let value_offset = &complex.value as *const u32 as *const u8;
        let data_offset = complex.data.as_ptr();
        
        println!("Flag offset: {}", flag_offset.offset_from(base_ptr));
        println!("Value offset: {}", value_offset.offset_from(base_ptr));
        println!("Data offset: {}", data_offset.offset_from(base_ptr));
    }
}
```

### 联合体（Union）操作
```rust
#[repr(C)]
union FloatOrInt {
    f: f32,
    i: u32,
}

fn union_operations() {
    let mut data = FloatOrInt { f: 3.14159 };
    
    unsafe {
        println!("As float: {}", data.f);
        println!("As int: 0x{:08x}", data.i);
        
        // 修改联合体
        data.i = 0x40490FDB; // π的IEEE 754表示
        println!("Modified as float: {}", data.f);
    }
    
    // 类型双关（Type Punning）
    let float_val = 3.14159f32;
    let int_representation = unsafe {
        std::mem::transmute::<f32, u32>(float_val)
    };
    println!("Float {} as int: 0x{:08x}", float_val, int_representation);
}
```

## 🔄 内存操作函数

### 内存复制和移动
```rust
use std::ptr;

fn memory_operations() {
    let src = [1, 2, 3, 4, 5];
    let mut dst = [0; 5];
    
    unsafe {
        // 非重叠内存复制
        ptr::copy_nonoverlapping(src.as_ptr(), dst.as_mut_ptr(), src.len());
        println!("Non-overlapping copy: {:?}", dst);
        
        // 重叠内存复制
        let mut data = [1, 2, 3, 4, 5, 6, 7, 8];
        ptr::copy(data.as_ptr().add(2), data.as_mut_ptr().add(4), 3);
        println!("Overlapping copy: {:?}", data);
        
        // 内存填充
        let mut buffer = [0u8; 10];
        ptr::write_bytes(buffer.as_mut_ptr(), 0xFF, buffer.len());
        println!("Filled buffer: {:?}", buffer);
        
        // 内存比较
        let arr1 = [1, 2, 3, 4];
        let arr2 = [1, 2, 3, 4];
        let arr3 = [1, 2, 3, 5];
        
        let cmp1 = libc::memcmp(
            arr1.as_ptr() as *const libc::c_void,
            arr2.as_ptr() as *const libc::c_void,
            arr1.len() * std::mem::size_of::<i32>()
        );
        
        let cmp2 = libc::memcmp(
            arr1.as_ptr() as *const libc::c_void,
            arr3.as_ptr() as *const libc::c_void,
            arr1.len() * std::mem::size_of::<i32>()
        );
        
        println!("arr1 vs arr2: {}", cmp1);
        println!("arr1 vs arr3: {}", cmp2);
    }
}
```

### 原子内存操作
```rust
use std::sync::atomic::{AtomicPtr, AtomicUsize, Ordering};
use std::ptr;

fn atomic_pointer_operations() {
    let data = Box::new(42);
    let atomic_ptr = AtomicPtr::new(Box::into_raw(data));
    
    // 原子加载
    let ptr = atomic_ptr.load(Ordering::Acquire);
    unsafe {
        if !ptr.is_null() {
            println!("Atomic loaded value: {}", *ptr);
        }
    }
    
    // 原子交换
    let new_data = Box::new(100);
    let old_ptr = atomic_ptr.swap(Box::into_raw(new_data), Ordering::AcqRel);
    
    unsafe {
        if !old_ptr.is_null() {
            let old_value = Box::from_raw(old_ptr);
            println!("Old value: {}", *old_value);
        }
    }
    
    // 比较并交换
    let expected = atomic_ptr.load(Ordering::Acquire);
    let new_data = Box::new(200);
    
    match atomic_ptr.compare_exchange_weak(
        expected,
        Box::into_raw(new_data),
        Ordering::AcqRel,
        Ordering::Acquire
    ) {
        Ok(old_ptr) => {
            println!("CAS succeeded");
            unsafe {
                if !old_ptr.is_null() {
                    let _ = Box::from_raw(old_ptr);
                }
            }
        }
        Err(actual) => {
            println!("CAS failed, actual: {:p}", actual);
        }
    }
    
    // 清理
    let final_ptr = atomic_ptr.load(Ordering::Acquire);
    unsafe {
        if !final_ptr.is_null() {
            let _ = Box::from_raw(final_ptr);
        }
    }
}
```

## 🔗 指针与引用转换

### 安全的指针操作封装
```rust
use std::marker::PhantomData;
use std::ptr::NonNull;

// 安全的原始指针封装
struct SafePtr<T> {
    ptr: NonNull<T>,
    _marker: PhantomData<T>,
}

impl<T> SafePtr<T> {
    fn new(value: &T) -> Self {
        SafePtr {
            ptr: NonNull::from(value),
            _marker: PhantomData,
        }
    }
    
    fn as_ptr(&self) -> *const T {
        self.ptr.as_ptr()
    }
    
    unsafe fn as_ref(&self) -> &T {
        self.ptr.as_ref()
    }
}

// 可变指针封装
struct SafeMutPtr<T> {
    ptr: NonNull<T>,
    _marker: PhantomData<T>,
}

impl<T> SafeMutPtr<T> {
    fn new(value: &mut T) -> Self {
        SafeMutPtr {
            ptr: NonNull::from(value),
            _marker: PhantomData,
        }
    }
    
    fn as_mut_ptr(&self) -> *mut T {
        self.ptr.as_ptr()
    }
    
    unsafe fn as_mut(&mut self) -> &mut T {
        self.ptr.as_mut()
    }
}

fn safe_pointer_wrappers() {
    let mut value = 42;
    
    // 使用安全封装
    let safe_ptr = SafePtr::new(&value);
    unsafe {
        println!("Safe pointer value: {}", *safe_ptr.as_ref());
    }
    
    let mut safe_mut_ptr = SafeMutPtr::new(&mut value);
    unsafe {
        *safe_mut_ptr.as_mut() = 100;
    }
    
    println!("Modified value: {}", value);
}
```

## 🧪 内存对齐和填充

### 自定义内存对齐
```rust
use std::alloc::{alloc, dealloc, Layout};
use std::mem;

fn custom_alignment() {
    // 创建特定对齐的内存布局
    let layout = Layout::from_size_align(64, 32).unwrap();
    
    unsafe {
        let ptr = alloc(layout);
        if ptr.is_null() {
            panic!("Allocation failed");
        }
        
        println!("Allocated address: {:p}", ptr);
        println!("Address alignment: {}", ptr as usize % 32);
        
        // 使用对齐的内存
        let aligned_slice = std::slice::from_raw_parts_mut(ptr, 64);
        aligned_slice[0] = 0xFF;
        aligned_slice[31] = 0xAA;
        
        println!("First byte: 0x{:02x}", aligned_slice[0]);
        println!("32nd byte: 0x{:02x}", aligned_slice[31]);
        
        dealloc(ptr, layout);
    }
}

// 检查结构体填充
#[repr(C)]
struct PaddedStruct {
    a: u8,     // 1 byte
    // 3 bytes padding
    b: u32,    // 4 bytes
    c: u16,    // 2 bytes
    // 2 bytes padding (for alignment)
}

fn analyze_padding() {
    println!("PaddedStruct size: {}", mem::size_of::<PaddedStruct>());
    println!("PaddedStruct alignment: {}", mem::align_of::<PaddedStruct>());
    
    let s = PaddedStruct { a: 1, b: 2, c: 3 };
    let base_ptr = &s as *const PaddedStruct as *const u8;
    
    unsafe {
        let a_ptr = &s.a as *const u8;
        let b_ptr = &s.b as *const u32 as *const u8;
        let c_ptr = &s.c as *const u16 as *const u8;
        
        println!("Field 'a' offset: {}", a_ptr.offset_from(base_ptr));
        println!("Field 'b' offset: {}", b_ptr.offset_from(base_ptr));
        println!("Field 'c' offset: {}", c_ptr.offset_from(base_ptr));
    }
}
```

## 🔍 内存调试工具

### 内存访问检测
```rust
use std::ptr;

// 简单的边界检查指针
struct BoundsCheckedPtr<T> {
    ptr: *mut T,
    start: *const T,
    end: *const T,
}

impl<T> BoundsCheckedPtr<T> {
    fn new(slice: &mut [T]) -> Self {
        let ptr = slice.as_mut_ptr();
        let start = ptr;
        let end = unsafe { ptr.add(slice.len()) };
        
        BoundsCheckedPtr { ptr, start, end }
    }
    
    unsafe fn read(&self) -> T 
    where 
        T: Copy 
    {
        self.check_bounds();
        ptr::read(self.ptr)
    }
    
    unsafe fn write(&mut self, value: T) {
        self.check_bounds();
        ptr::write(self.ptr, value);
    }
    
    fn advance(&mut self) {
        unsafe {
            let next = self.ptr.add(1);
            if next <= self.end {
                self.ptr = next;
            } else {
                panic!("Pointer advanced beyond bounds");
            }
        }
    }
    
    fn check_bounds(&self) {
        if self.ptr < self.start || self.ptr >= self.end {
            panic!("Pointer access out of bounds");
        }
    }
}

fn bounds_checked_example() {
    let mut data = [1, 2, 3, 4, 5];
    let mut checked_ptr = BoundsCheckedPtr::new(&mut data);
    
    unsafe {
        // 正常访问
        println!("Value: {}", checked_ptr.read());
        checked_ptr.write(10);
        
        // 移动指针
        checked_ptr.advance();
        println!("Next value: {}", checked_ptr.read());
        
        // 这会触发边界检查错误
        // for _ in 0..10 {
        //     checked_ptr.advance();
        // }
    }
}
```

### 内存泄漏跟踪
```rust
use std::collections::HashMap;
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref ALLOCATIONS: Mutex<HashMap<usize, (usize, &'static str)>> = 
        Mutex::new(HashMap::new());
}

fn track_allocation(ptr: *mut u8, size: usize, location: &'static str) {
    let mut allocations = ALLOCATIONS.lock().unwrap();
    allocations.insert(ptr as usize, (size, location));
}

fn track_deallocation(ptr: *mut u8) {
    let mut allocations = ALLOCATIONS.lock().unwrap();
    allocations.remove(&(ptr as usize));
}

fn report_leaks() {
    let allocations = ALLOCATIONS.lock().unwrap();
    if allocations.is_empty() {
        println!("No memory leaks detected");
    } else {
        println!("Memory leaks detected:");
        for (addr, (size, location)) in allocations.iter() {
            println!("  0x{:x}: {} bytes allocated at {}", addr, size, location);
        }
    }
}

// 使用宏简化跟踪
macro_rules! tracked_alloc {
    ($size:expr) => {{
        use std::alloc::{alloc, Layout};
        let layout = Layout::from_size_align($size, 8).unwrap();
        let ptr = unsafe { alloc(layout) };
        if !ptr.is_null() {
            track_allocation(ptr, $size, concat!(file!(), ":", line!()));
        }
        ptr
    }};
}

macro_rules! tracked_dealloc {
    ($ptr:expr, $size:expr) => {{
        use std::alloc::{dealloc, Layout};
        track_deallocation($ptr);
        let layout = Layout::from_size_align($size, 8).unwrap();
        unsafe { dealloc($ptr, layout) };
    }};
}
```

## 📚 最佳实践

### 安全的原始指针使用模式
```rust
// 1. 使用RAII管理资源
struct RawBuffer {
    ptr: *mut u8,
    size: usize,
    capacity: usize,
}

impl RawBuffer {
    fn with_capacity(capacity: usize) -> Option<Self> {
        use std::alloc::{alloc, Layout};
        
        let layout = Layout::from_size_align(capacity, 8).ok()?;
        let ptr = unsafe { alloc(layout) };
        
        if ptr.is_null() {
            None
        } else {
            Some(RawBuffer {
                ptr,
                size: 0,
                capacity,
            })
        }
    }
    
    fn push(&mut self, byte: u8) -> Result<(), &'static str> {
        if self.size >= self.capacity {
            return Err("Buffer full");
        }
        
        unsafe {
            *self.ptr.add(self.size) = byte;
        }
        self.size += 1;
        Ok(())
    }
    
    fn as_slice(&self) -> &[u8] {
        unsafe {
            std::slice::from_raw_parts(self.ptr, self.size)
        }
    }
}

impl Drop for RawBuffer {
    fn drop(&mut self) {
        use std::alloc::{dealloc, Layout};
        
        let layout = Layout::from_size_align(self.capacity, 8).unwrap();
        unsafe {
            dealloc(self.ptr, layout);
        }
    }
}

// 2. 使用类型状态模式确保安全
struct Initialized;
struct Uninitialized;

struct TypedBuffer<State> {
    ptr: *mut u8,
    size: usize,
    _state: std::marker::PhantomData<State>,
}

impl TypedBuffer<Uninitialized> {
    fn new(size: usize) -> Option<Self> {
        use std::alloc::{alloc, Layout};
        
        let layout = Layout::from_size_align(size, 8).ok()?;
        let ptr = unsafe { alloc(layout) };
        
        if ptr.is_null() {
            None
        } else {
            Some(TypedBuffer {
                ptr,
                size,
                _state: std::marker::PhantomData,
            })
        }
    }
    
    fn initialize(self, value: u8) -> TypedBuffer<Initialized> {
        unsafe {
            std::ptr::write_bytes(self.ptr, value, self.size);
        }
        
        TypedBuffer {
            ptr: self.ptr,
            size: self.size,
            _state: std::marker::PhantomData,
        }
    }
}

impl TypedBuffer<Initialized> {
    fn as_slice(&self) -> &[u8] {
        unsafe {
            std::slice::from_raw_parts(self.ptr, self.size)
        }
    }
}

impl<State> Drop for TypedBuffer<State> {
    fn drop(&mut self) {
        use std::alloc::{dealloc, Layout};
        
        let layout = Layout::from_size_align(self.size, 8).unwrap();
        unsafe {
            dealloc(self.ptr, layout);
        }
    }
}
```

---

*原始指针是系统编程的强大工具，但需要谨慎使用。掌握这些技术将让您能够编写高效且安全的底层代码！⚡*
