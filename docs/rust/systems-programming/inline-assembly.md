# 内联汇编

## 🎯 内联汇编概述

内联汇编允许在Rust代码中直接嵌入汇编指令，这在系统编程中用于性能关键代码、硬件特定操作或实现编译器无法优化的特殊功能。

## 🔧 基础内联汇编

### asm!宏基础语法
```rust
use std::arch::asm;

fn basic_inline_assembly() {
    let mut x: u64 = 10;
    let y: u64 = 20;
    
    unsafe {
        // 基础汇编：将两个数相加
        asm!(
            "add {0}, {1}",
            inout(reg) x,
            in(reg) y,
        );
    }
    
    println!("Result: {}", x); // 输出: 30
}

fn assembly_with_output() {
    let a: u64 = 100;
    let b: u64 = 200;
    let result: u64;
    
    unsafe {
        asm!(
            "add {result}, {a}, {b}",
            a = in(reg) a,
            b = in(reg) b,
            result = out(reg) result,
        );
    }
    
    println!("Assembly addition: {} + {} = {}", a, b, result);
}
```

### 寄存器约束
```rust
fn register_constraints() {
    let input: u32 = 42;
    let mut output: u32;
    
    unsafe {
        // 使用特定寄存器
        asm!(
            "mov {}, {}",
            out(reg) output,
            in(reg) input,
        );
        
        // 使用eax寄存器（x86_64）
        #[cfg(target_arch = "x86_64")]
        asm!(
            "mov eax, {}",
            "mov {}, eax",
            in(reg) input,
            out(reg) output,
            out("eax") _,  // 告诉编译器eax被修改
        );
    }
    
    println!("Input: {}, Output: {}", input, output);
}
```

## ⚡ 性能优化汇编

### SIMD指令
```rust
#[cfg(target_arch = "x86_64")]
fn simd_assembly_example() {
    let a = [1.0f32, 2.0, 3.0, 4.0];
    let b = [5.0f32, 6.0, 7.0, 8.0];
    let mut result = [0.0f32; 4];
    
    unsafe {
        asm!(
            // 加载数据到XMM寄存器
            "movups xmm0, [{a}]",
            "movups xmm1, [{b}]",
            // 执行向量加法
            "addps xmm0, xmm1",
            // 存储结果
            "movups [{result}], xmm0",
            a = in(reg) a.as_ptr(),
            b = in(reg) b.as_ptr(),
            result = in(reg) result.as_mut_ptr(),
            out("xmm0") _,
            out("xmm1") _,
        );
    }
    
    println!("SIMD result: {:?}", result);
}

// 高性能内存复制
fn fast_memcpy(dst: *mut u8, src: *const u8, len: usize) {
    unsafe {
        #[cfg(target_arch = "x86_64")]
        asm!(
            "rep movsb",
            inout("rdi") dst => _,
            inout("rsi") src => _,
            inout("rcx") len => _,
        );
        
        #[cfg(target_arch = "aarch64")]
        asm!(
            "1:",
            "ldrb w3, [x1], #1",
            "strb w3, [x0], #1",
            "subs x2, x2, #1",
            "bne 1b",
            inout("x0") dst => _,
            inout("x1") src => _,
            inout("x2") len => _,
            out("w3") _,
        );
    }
}
```

### 原子操作
```rust
fn atomic_operations() {
    let mut value: u64 = 10;
    let increment: u64 = 5;
    let old_value: u64;
    
    unsafe {
        #[cfg(target_arch = "x86_64")]
        asm!(
            "lock xadd {old}, {value}",
            old = inout(reg) increment => old_value,
            value = in(reg) &mut value,
        );
    }
    
    println!("Old value: {}, New value: {}", old_value, value);
}

// 比较并交换
fn compare_and_swap(ptr: *mut u64, expected: u64, new: u64) -> u64 {
    let mut old = expected;
    
    unsafe {
        #[cfg(target_arch = "x86_64")]
        asm!(
            "lock cmpxchg {new}, {ptr}",
            ptr = in(reg) ptr,
            new = in(reg) new,
            inout("rax") old,
        );
    }
    
    old
}
```

## 🔧 系统级操作

### CPU特性检测
```rust
#[cfg(target_arch = "x86_64")]
fn cpu_features() {
    let mut eax: u32;
    let mut ebx: u32;
    let mut ecx: u32;
    let mut edx: u32;
    
    unsafe {
        // CPUID指令
        asm!(
            "cpuid",
            inout("eax") 1u32 => eax,
            out("ebx") ebx,
            out("ecx") ecx,
            out("edx") edx,
        );
    }
    
    println!("CPU Features:");
    println!("  SSE3: {}", (ecx & (1 << 0)) != 0);
    println!("  SSSE3: {}", (ecx & (1 << 9)) != 0);
    println!("  SSE4.1: {}", (ecx & (1 << 19)) != 0);
    println!("  SSE4.2: {}", (ecx & (1 << 20)) != 0);
    println!("  AVX: {}", (ecx & (1 << 28)) != 0);
}

// 读取时间戳计数器
#[cfg(target_arch = "x86_64")]
fn read_timestamp_counter() -> u64 {
    let low: u32;
    let high: u32;
    
    unsafe {
        asm!(
            "rdtsc",
            out("eax") low,
            out("edx") high,
        );
    }
    
    ((high as u64) << 32) | (low as u64)
}
```

### 内存屏障
```rust
fn memory_barriers() {
    unsafe {
        #[cfg(target_arch = "x86_64")]
        {
            // 内存屏障
            asm!("mfence");  // 完全内存屏障
            asm!("lfence");  // 加载屏障
            asm!("sfence");  // 存储屏障
        }
        
        #[cfg(target_arch = "aarch64")]
        {
            asm!("dmb sy");  // 数据内存屏障
            asm!("dsb sy");  // 数据同步屏障
            asm!("isb");     // 指令同步屏障
        }
    }
}

// 缓存控制
#[cfg(target_arch = "x86_64")]
fn cache_operations(addr: *const u8) {
    unsafe {
        // 预取数据到缓存
        asm!(
            "prefetcht0 [{}]",
            in(reg) addr,
        );
        
        // 刷新缓存行
        asm!(
            "clflush [{}]",
            in(reg) addr,
        );
    }
}
```

## 🛠️ 嵌入式系统汇编

### ARM汇编示例
```rust
#[cfg(target_arch = "aarch64")]
fn arm_assembly_examples() {
    let a: u64 = 10;
    let b: u64 = 20;
    let mut result: u64;
    
    unsafe {
        // ARM64汇编
        asm!(
            "add {result}, {a}, {b}",
            a = in(reg) a,
            b = in(reg) b,
            result = out(reg) result,
        );
    }
    
    println!("ARM addition: {}", result);
}

// 位操作
#[cfg(target_arch = "aarch64")]
fn arm_bit_operations() {
    let value: u64 = 0b1010_1100;
    let mut count: u64;
    
    unsafe {
        // 计算设置的位数
        asm!(
            "cnt {count}, {value}",
            value = in(reg) value,
            count = out(reg) count,
        );
    }
    
    println!("Bit count: {}", count);
}
```

### 中断和异常处理
```rust
// 禁用中断
#[cfg(target_arch = "x86_64")]
fn disable_interrupts() {
    unsafe {
        asm!("cli");
    }
}

// 启用中断
#[cfg(target_arch = "x86_64")]
fn enable_interrupts() {
    unsafe {
        asm!("sti");
    }
}

// 获取/设置中断标志
#[cfg(target_arch = "x86_64")]
fn interrupt_flag_operations() -> bool {
    let flags: u64;
    
    unsafe {
        // 获取EFLAGS寄存器
        asm!(
            "pushfq",
            "pop {}",
            out(reg) flags,
        );
    }
    
    // 检查中断标志位（第9位）
    (flags & (1 << 9)) != 0
}
```

## 🔍 调试和分析

### 断点和调试
```rust
fn debug_breakpoint() {
    unsafe {
        #[cfg(target_arch = "x86_64")]
        asm!("int3");  // 软件断点
        
        #[cfg(target_arch = "aarch64")]
        asm!("brk #0");  // ARM断点
    }
}

// 性能计数器
#[cfg(target_arch = "x86_64")]
fn performance_monitoring() {
    let counter_value: u64;
    
    unsafe {
        // 读取性能监控计数器
        asm!(
            "rdpmc",
            in("ecx") 0u32,  // 计数器索引
            out("eax") _,
            out("edx") _,
            lateout("rax") counter_value,
        );
    }
    
    println!("Performance counter: {}", counter_value);
}
```

## 🚀 高级技巧

### 内联汇编宏
```rust
macro_rules! atomic_add {
    ($ptr:expr, $val:expr) => {
        unsafe {
            #[cfg(target_arch = "x86_64")]
            asm!(
                "lock add qword ptr [{}], {}",
                in(reg) $ptr,
                in(reg) $val,
            );
        }
    };
}

macro_rules! memory_fence {
    () => {
        unsafe {
            #[cfg(target_arch = "x86_64")]
            asm!("mfence");
            
            #[cfg(target_arch = "aarch64")]
            asm!("dmb sy");
        }
    };
}

fn macro_usage() {
    let mut value = 10u64;
    atomic_add!(&mut value as *mut u64, 5);
    memory_fence!();
    println!("Atomic result: {}", value);
}
```

### 条件编译和平台特定代码
```rust
fn platform_specific_assembly() {
    #[cfg(target_arch = "x86_64")]
    unsafe {
        let result: u64;
        asm!(
            "mov {}, 0x1234567890ABCDEF",
            out(reg) result,
        );
        println!("x86_64 result: 0x{:016X}", result);
    }
    
    #[cfg(target_arch = "aarch64")]
    unsafe {
        let result: u64;
        asm!(
            "mov {}, #0x1234",
            "movk {}, #0x5678, lsl #16",
            "movk {}, #0x90AB, lsl #32",
            "movk {}, #0xCDEF, lsl #48",
            out(reg) result,
        );
        println!("ARM64 result: 0x{:016X}", result);
    }
}
```

## 📚 最佳实践

### 安全使用内联汇编
```rust
// 1. 封装unsafe操作
fn safe_atomic_increment(ptr: &mut u64) -> u64 {
    unsafe {
        let old_value: u64;
        #[cfg(target_arch = "x86_64")]
        asm!(
            "mov rax, 1",
            "lock xadd [{}], rax",
            in(reg) ptr,
            out("rax") old_value,
        );
        old_value
    }
}

// 2. 提供fallback实现
fn optimized_memset(ptr: *mut u8, value: u8, len: usize) {
    #[cfg(target_arch = "x86_64")]
    unsafe {
        asm!(
            "rep stosb",
            inout("rdi") ptr => _,
            inout("rcx") len => _,
            in("al") value,
        );
    }
    
    #[cfg(not(target_arch = "x86_64"))]
    unsafe {
        // Fallback到标准库实现
        std::ptr::write_bytes(ptr, value, len);
    }
}

// 3. 文档化汇编代码
/// 使用x86_64 POPCNT指令计算设置的位数
/// 
/// # Safety
/// 
/// 调用者必须确保CPU支持POPCNT指令
#[cfg(target_arch = "x86_64")]
unsafe fn popcnt(value: u64) -> u32 {
    let result: u32;
    asm!(
        "popcnt {result:e}, {value}",
        value = in(reg) value,
        result = out(reg) result,
    );
    result
}
```

### 性能测试
```rust
use std::time::Instant;

fn benchmark_assembly_vs_rust() {
    const ITERATIONS: usize = 1_000_000;
    let mut data = vec![0u64; 1000];
    
    // Rust实现
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        for item in &mut data {
            *item = item.wrapping_add(1);
        }
    }
    let rust_time = start.elapsed();
    
    // 汇编实现
    let start = Instant::now();
    for _ in 0..ITERATIONS {
        unsafe {
            for item in &mut data {
                asm!(
                    "inc qword ptr [{}]",
                    in(reg) item,
                );
            }
        }
    }
    let asm_time = start.elapsed();
    
    println!("Rust time: {:?}", rust_time);
    println!("Assembly time: {:?}", asm_time);
    println!("Speedup: {:.2}x", rust_time.as_nanos() as f64 / asm_time.as_nanos() as f64);
}
```

---

*内联汇编是系统编程的终极工具，让您能够发挥硬件的最大潜力！⚡*
