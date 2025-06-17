# 内存管理

## 🎯 系统级内存管理概述

在系统编程中，精确的内存管理是至关重要的。Rust通过其独特的所有权系统提供了内存安全，同时允许在需要时进行底层内存操作。

## 🔧 Rust的内存模型

### 栈内存 vs 堆内存
```rust
fn memory_layout_demo() {
    // 栈内存 - 编译时已知大小，自动管理
    let stack_array = [1, 2, 3, 4, 5];  // 在栈上分配
    let stack_var = 42;                  // 在栈上分配
    
    // 堆内存 - 运行时分配，需要手动管理（Rust自动化）
    let heap_vec = vec![1, 2, 3, 4, 5]; // 数据在堆上
    let heap_string = String::from("Hello"); // 数据在堆上
    
    println!("Stack array: {:?}", stack_array);
    println!("Heap vector: {:?}", heap_vec);
    
    // 当变量离开作用域时，Rust自动清理内存
}
```

### 内存布局分析
```rust
use std::mem;

fn analyze_memory_layout() {
    println!("=== 基本类型内存布局 ===");
    println!("i32 size: {} bytes", mem::size_of::<i32>());
    println!("i64 size: {} bytes", mem::size_of::<i64>());
    println!("usize size: {} bytes", mem::size_of::<usize>());
    println!("*const i32 size: {} bytes", mem::size_of::<*const i32>());
    
    println!("\n=== 复合类型内存布局 ===");
    println!("Vec<i32> size: {} bytes", mem::size_of::<Vec<i32>>());
    println!("String size: {} bytes", mem::size_of::<String>());
    println!("Option<i32> size: {} bytes", mem::size_of::<Option<i32>>());
    
    // 结构体内存对齐
    #[repr(C)]
    struct AlignedStruct {
        a: u8,    // 1 byte
        b: u32,   // 4 bytes (需要3字节填充)
        c: u16,   // 2 bytes
    }
    
    println!("\n=== 结构体内存对齐 ===");
    println!("AlignedStruct size: {} bytes", mem::size_of::<AlignedStruct>());
    println!("AlignedStruct alignment: {} bytes", mem::align_of::<AlignedStruct>());
}
```

## 🔍 原始内存操作

### 使用std::ptr进行指针操作
```rust
use std::ptr;
use std::mem;

fn raw_pointer_operations() {
    let mut data = [1, 2, 3, 4, 5];
    let ptr = data.as_mut_ptr();
    
    unsafe {
        // 读取指针指向的值
        let first_value = ptr::read(ptr);
        println!("First value: {}", first_value);
        
        // 写入新值
        ptr::write(ptr, 10);
        
        // 指针算术
        let second_ptr = ptr.add(1);
        let second_value = ptr::read(second_ptr);
        println!("Second value: {}", second_value);
        
        // 内存复制
        let mut dest = [0; 5];
        ptr::copy_nonoverlapping(ptr, dest.as_mut_ptr(), 5);
        println!("Copied data: {:?}", dest);
    }
    
    println!("Modified data: {:?}", data);
}
```

### 内存分配和释放
```rust
use std::alloc::{alloc, dealloc, Layout};
use std::ptr;

fn manual_memory_allocation() {
    unsafe {
        // 分配内存
        let layout = Layout::new::<i32>();
        let ptr = alloc(layout) as *mut i32;
        
        if ptr.is_null() {
            panic!("Memory allocation failed");
        }
        
        // 使用分配的内存
        ptr::write(ptr, 42);
        let value = ptr::read(ptr);
        println!("Allocated value: {}", value);
        
        // 释放内存
        dealloc(ptr as *mut u8, layout);
    }
}

// 更安全的内存分配封装
struct SafeAllocator<T> {
    ptr: *mut T,
    layout: Layout,
}

impl<T> SafeAllocator<T> {
    fn new() -> Option<Self> {
        let layout = Layout::new::<T>();
        unsafe {
            let ptr = alloc(layout) as *mut T;
            if ptr.is_null() {
                None
            } else {
                Some(SafeAllocator { ptr, layout })
            }
        }
    }
    
    fn write(&mut self, value: T) {
        unsafe {
            ptr::write(self.ptr, value);
        }
    }
    
    fn read(&self) -> T {
        unsafe {
            ptr::read(self.ptr)
        }
    }
}

impl<T> Drop for SafeAllocator<T> {
    fn drop(&mut self) {
        unsafe {
            dealloc(self.ptr as *mut u8, self.layout);
        }
    }
}
```

## 🧠 内存映射

### 使用mmap进行内存映射
```rust
use std::fs::File;
use std::os::unix::io::AsRawFd;

#[cfg(unix)]
fn memory_mapping_example() -> Result<(), Box<dyn std::error::Error>> {
    use libc::{mmap, munmap, PROT_READ, PROT_WRITE, MAP_SHARED};
    use std::slice;
    
    // 创建一个文件
    let file = File::create("mmap_test.dat")?;
    file.set_len(4096)?; // 设置文件大小为4KB
    
    unsafe {
        let fd = file.as_raw_fd();
        
        // 内存映射文件
        let ptr = mmap(
            std::ptr::null_mut(),
            4096,
            PROT_READ | PROT_WRITE,
            MAP_SHARED,
            fd,
            0,
        );
        
        if ptr == libc::MAP_FAILED {
            return Err("Memory mapping failed".into());
        }
        
        // 将映射的内存作为字节数组使用
        let mapped_slice = slice::from_raw_parts_mut(ptr as *mut u8, 4096);
        
        // 写入数据
        mapped_slice[0..5].copy_from_slice(b"Hello");
        
        // 读取数据
        let data = &mapped_slice[0..5];
        println!("Mapped data: {:?}", std::str::from_utf8(data)?);
        
        // 解除映射
        munmap(ptr, 4096);
    }
    
    Ok(())
}
```

### 使用memmap2库（更安全的方式）
```rust
// 在Cargo.toml中添加: memmap2 = "0.5"
use memmap2::{MmapMut, MmapOptions};
use std::fs::OpenOptions;

fn safe_memory_mapping() -> Result<(), Box<dyn std::error::Error>> {
    // 创建或打开文件
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open("safe_mmap_test.dat")?;
    
    file.set_len(4096)?;
    
    // 创建可变内存映射
    let mut mmap = unsafe { MmapOptions::new().map_mut(&file)? };
    
    // 写入数据
    mmap[0..13].copy_from_slice(b"Safe mapping!");
    
    // 强制同步到磁盘
    mmap.flush()?;
    
    // 读取数据
    let data = &mmap[0..13];
    println!("Safe mapped data: {}", std::str::from_utf8(data)?);
    
    Ok(())
}
```

## 🔄 内存池和自定义分配器

### 简单的内存池实现
```rust
use std::alloc::{alloc, dealloc, Layout};
use std::ptr;

struct SimpleMemoryPool {
    pool: Vec<*mut u8>,
    block_size: usize,
    layout: Layout,
}

impl SimpleMemoryPool {
    fn new(block_size: usize, initial_blocks: usize) -> Self {
        let layout = Layout::from_size_align(block_size, 8).unwrap();
        let mut pool = Vec::with_capacity(initial_blocks);
        
        // 预分配内存块
        for _ in 0..initial_blocks {
            unsafe {
                let ptr = alloc(layout);
                if !ptr.is_null() {
                    pool.push(ptr);
                }
            }
        }
        
        SimpleMemoryPool {
            pool,
            block_size,
            layout,
        }
    }
    
    fn allocate(&mut self) -> Option<*mut u8> {
        self.pool.pop().or_else(|| {
            // 池中没有可用块，分配新的
            unsafe {
                let ptr = alloc(self.layout);
                if ptr.is_null() { None } else { Some(ptr) }
            }
        })
    }
    
    fn deallocate(&mut self, ptr: *mut u8) {
        // 将块返回到池中
        self.pool.push(ptr);
    }
}

impl Drop for SimpleMemoryPool {
    fn drop(&mut self) {
        // 释放所有池中的内存块
        for ptr in self.pool.drain(..) {
            unsafe {
                dealloc(ptr, self.layout);
            }
        }
    }
}

// 使用示例
fn memory_pool_example() {
    let mut pool = SimpleMemoryPool::new(64, 10);
    
    // 从池中分配内存
    if let Some(ptr) = pool.allocate() {
        unsafe {
            // 使用内存
            ptr::write(ptr as *mut i32, 42);
            let value = ptr::read(ptr as *const i32);
            println!("Pool allocated value: {}", value);
        }
        
        // 将内存返回池中
        pool.deallocate(ptr);
    }
}
```

## 📊 内存性能分析

### 内存使用情况监控
```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering};

struct TrackingAllocator;

static ALLOCATED: AtomicUsize = AtomicUsize::new(0);
static DEALLOCATED: AtomicUsize = AtomicUsize::new(0);

unsafe impl GlobalAlloc for TrackingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let ptr = System.alloc(layout);
        if !ptr.is_null() {
            ALLOCATED.fetch_add(layout.size(), Ordering::Relaxed);
        }
        ptr
    }
    
    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        System.dealloc(ptr, layout);
        DEALLOCATED.fetch_add(layout.size(), Ordering::Relaxed);
    }
}

#[global_allocator]
static GLOBAL: TrackingAllocator = TrackingAllocator;

fn memory_usage_stats() {
    let allocated = ALLOCATED.load(Ordering::Relaxed);
    let deallocated = DEALLOCATED.load(Ordering::Relaxed);
    
    println!("Total allocated: {} bytes", allocated);
    println!("Total deallocated: {} bytes", deallocated);
    println!("Current usage: {} bytes", allocated - deallocated);
}
```

### 内存泄漏检测
```rust
use std::collections::HashMap;
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref ALLOCATIONS: Mutex<HashMap<usize, (usize, String)>> = 
        Mutex::new(HashMap::new());
}

fn track_allocation(ptr: *mut u8, size: usize, location: &str) {
    let mut allocations = ALLOCATIONS.lock().unwrap();
    allocations.insert(ptr as usize, (size, location.to_string()));
}

fn track_deallocation(ptr: *mut u8) {
    let mut allocations = ALLOCATIONS.lock().unwrap();
    allocations.remove(&(ptr as usize));
}

fn check_leaks() {
    let allocations = ALLOCATIONS.lock().unwrap();
    if !allocations.is_empty() {
        println!("Memory leaks detected:");
        for (ptr, (size, location)) in allocations.iter() {
            println!("  Leak at 0x{:x}: {} bytes from {}", ptr, size, location);
        }
    } else {
        println!("No memory leaks detected");
    }
}
```

## 🛡️ 内存安全最佳实践

### RAII模式
```rust
struct ResourceGuard {
    resource: *mut u8,
    size: usize,
}

impl ResourceGuard {
    fn new(size: usize) -> Option<Self> {
        unsafe {
            let layout = Layout::from_size_align(size, 8).ok()?;
            let resource = alloc(layout);
            
            if resource.is_null() {
                None
            } else {
                Some(ResourceGuard { resource, size })
            }
        }
    }
    
    fn as_slice_mut(&mut self) -> &mut [u8] {
        unsafe {
            std::slice::from_raw_parts_mut(self.resource, self.size)
        }
    }
}

impl Drop for ResourceGuard {
    fn drop(&mut self) {
        unsafe {
            let layout = Layout::from_size_align(self.size, 8).unwrap();
            dealloc(self.resource, layout);
        }
    }
}

// 使用RAII确保资源自动清理
fn raii_example() {
    let mut guard = ResourceGuard::new(1024).expect("Failed to allocate");
    let slice = guard.as_slice_mut();
    
    // 使用内存
    slice[0] = 42;
    println!("First byte: {}", slice[0]);
    
    // guard离开作用域时自动释放内存
}
```

## 📚 内存管理工具

### 使用Valgrind检测内存问题
```bash
# 安装Valgrind (Linux)
sudo apt-get install valgrind

# 检测内存泄漏
valgrind --leak-check=full --show-leak-kinds=all ./your_rust_program

# 检测内存错误
valgrind --tool=memcheck ./your_rust_program
```

### 使用AddressSanitizer
```bash
# 编译时启用AddressSanitizer
RUSTFLAGS="-Z sanitizer=address" cargo run --target x86_64-unknown-linux-gnu
```

---

*精确的内存管理是系统编程的核心技能，Rust让这变得既安全又高效！🧠*
