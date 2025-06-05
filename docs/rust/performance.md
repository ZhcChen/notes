# 性能优化

Rust 以其出色的性能而闻名，但要充分发挥其潜力，需要了解各种优化技术和最佳实践。本章介绍如何编写高性能的 Rust 代码。

## 编译器优化

### 优化级别

```toml
# Cargo.toml
[profile.dev]
opt-level = 0          # 无优化，快速编译
debug = true           # 包含调试信息

[profile.release]
opt-level = 3          # 最高优化级别
debug = false          # 不包含调试信息
lto = true            # 链接时优化
codegen-units = 1     # 单个代码生成单元
panic = "abort"       # panic 时直接终止
```

### 目标特定优化

```toml
# 针对本机 CPU 优化
[profile.release]
rustflags = ["-C", "target-cpu=native"]

# 或使用环境变量
# RUSTFLAGS="-C target-cpu=native" cargo build --release
```

```bash
# 查看可用的 CPU 特性
rustc --print target-features

# 启用特定特性
RUSTFLAGS="-C target-feature=+avx2,+fma" cargo build --release
```

## 内存优化

### 避免不必要的分配

```rust
// 不好：频繁分配
fn bad_string_concat(items: &[&str]) -> String {
    let mut result = String::new();
    for item in items {
        result = result + item + " "; // 每次都重新分配
    }
    result
}

// 好：预分配容量
fn good_string_concat(items: &[&str]) -> String {
    let total_len: usize = items.iter().map(|s| s.len() + 1).sum();
    let mut result = String::with_capacity(total_len);
    for item in items {
        result.push_str(item);
        result.push(' ');
    }
    result
}

// 更好：使用 join
fn best_string_concat(items: &[&str]) -> String {
    items.join(" ")
}
```

### 使用栈分配

```rust
use std::collections::HashMap;
use smallvec::SmallVec;

// 使用 SmallVec 避免小集合的堆分配
type SmallVector = SmallVec<[i32; 8]>; // 8个元素以内在栈上

fn process_small_collections() {
    let mut vec = SmallVector::new();
    vec.push(1);
    vec.push(2);
    // 如果元素少于8个，不会分配堆内存
}

// 使用数组而不是 Vec（如果大小已知）
fn process_fixed_size() {
    let data = [1, 2, 3, 4, 5]; // 栈分配
    // 而不是 vec![1, 2, 3, 4, 5] // 堆分配
}
```

### 内存池

```rust
use std::collections::VecDeque;

struct ObjectPool<T> {
    objects: VecDeque<T>,
    factory: Box<dyn Fn() -> T>,
}

impl<T> ObjectPool<T> {
    fn new<F>(factory: F) -> Self 
    where 
        F: Fn() -> T + 'static 
    {
        ObjectPool {
            objects: VecDeque::new(),
            factory: Box::new(factory),
        }
    }

    fn get(&mut self) -> T {
        self.objects.pop_front().unwrap_or_else(|| (self.factory)())
    }

    fn return_object(&mut self, obj: T) {
        self.objects.push_back(obj);
    }
}

// 使用示例
fn main() {
    let mut pool = ObjectPool::new(|| Vec::<i32>::with_capacity(100));
    
    let mut vec = pool.get();
    vec.push(1);
    vec.push(2);
    vec.clear(); // 清空但保留容量
    
    pool.return_object(vec); // 返回到池中重用
}
```

## 算法优化

### 选择合适的数据结构

```rust
use std::collections::{HashMap, BTreeMap, HashSet, BTreeSet};

// 根据使用场景选择合适的数据结构
fn choose_data_structure() {
    // 频繁随机访问：HashMap
    let mut map = HashMap::new();
    map.insert("key", "value");

    // 需要有序遍历：BTreeMap
    let mut ordered_map = BTreeMap::new();
    ordered_map.insert(1, "one");

    // 大量数据的成员检查：HashSet
    let mut set = HashSet::new();
    set.insert(42);

    // 需要范围查询：BTreeSet
    let mut ordered_set = BTreeSet::new();
    ordered_set.insert(1);
    let range: Vec<_> = ordered_set.range(1..10).collect();
}
```

### 缓存友好的数据布局

```rust
// 不好：指针追逐
struct BadNode {
    data: i32,
    next: Option<Box<BadNode>>,
}

// 好：数组布局
struct GoodContainer {
    data: Vec<i32>,
}

// 结构体字段排序以减少内存占用
#[repr(C)]
struct OptimizedStruct {
    // 按大小降序排列以减少填充
    large_field: u64,    // 8 bytes
    medium_field: u32,   // 4 bytes
    small_field: u16,    // 2 bytes
    tiny_field: u8,      // 1 byte
    // 编译器会添加 1 byte 填充
}

#[repr(C)]
struct UnoptimizedStruct {
    tiny_field: u8,      // 1 byte + 7 bytes padding
    large_field: u64,    // 8 bytes
    small_field: u16,    // 2 bytes + 2 bytes padding
    medium_field: u32,   // 4 bytes
    // 总共 24 bytes 而不是 16 bytes
}
```

## 并行化

### 使用 Rayon 进行数据并行

```rust
use rayon::prelude::*;

fn parallel_processing() {
    let data: Vec<i32> = (0..1_000_000).collect();

    // 串行处理
    let serial_sum: i32 = data.iter().map(|&x| x * x).sum();

    // 并行处理
    let parallel_sum: i32 = data.par_iter().map(|&x| x * x).sum();

    // 并行排序
    let mut data_to_sort = data.clone();
    data_to_sort.par_sort_unstable();

    // 并行过滤和映射
    let processed: Vec<i32> = data
        .par_iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * 3)
        .collect();
}
```

### SIMD 优化

```rust
use std::simd::{f32x4, SimdFloat};

// 使用 SIMD 进行向量运算
fn simd_vector_add(a: &[f32], b: &[f32], result: &mut [f32]) {
    assert_eq!(a.len(), b.len());
    assert_eq!(a.len(), result.len());
    assert_eq!(a.len() % 4, 0); // 假设长度是4的倍数

    for i in (0..a.len()).step_by(4) {
        let va = f32x4::from_slice(&a[i..i+4]);
        let vb = f32x4::from_slice(&b[i..i+4]);
        let vr = va + vb;
        vr.copy_to_slice(&mut result[i..i+4]);
    }
}

// 标量版本对比
fn scalar_vector_add(a: &[f32], b: &[f32], result: &mut [f32]) {
    for i in 0..a.len() {
        result[i] = a[i] + b[i];
    }
}
```

## 避免性能陷阱

### 避免不必要的克隆

```rust
// 不好：不必要的克隆
fn bad_process_strings(strings: Vec<String>) -> Vec<String> {
    strings.iter().map(|s| s.clone().to_uppercase()).collect()
}

// 好：避免克隆
fn good_process_strings(strings: Vec<String>) -> Vec<String> {
    strings.into_iter().map(|s| s.to_uppercase()).collect()
}

// 更好：就地修改
fn best_process_strings(mut strings: Vec<String>) {
    for s in &mut strings {
        s.make_ascii_uppercase();
    }
}
```

### 避免边界检查

```rust
// 使用迭代器避免边界检查
fn sum_with_bounds_check(data: &[i32]) -> i32 {
    let mut sum = 0;
    for i in 0..data.len() {
        sum += data[i]; // 每次访问都有边界检查
    }
    sum
}

fn sum_without_bounds_check(data: &[i32]) -> i32 {
    data.iter().sum() // 迭代器避免了边界检查
}

// 使用 unsafe 手动避免边界检查（谨慎使用）
fn sum_unsafe(data: &[i32]) -> i32 {
    let mut sum = 0;
    for i in 0..data.len() {
        unsafe {
            sum += *data.get_unchecked(i); // 无边界检查
        }
    }
    sum
}
```

### 字符串处理优化

```rust
// 避免重复的 UTF-8 验证
fn process_ascii_string(s: &str) -> String {
    // 如果确定是 ASCII，可以使用字节操作
    if s.is_ascii() {
        unsafe {
            String::from_utf8_unchecked(
                s.as_bytes().iter().map(|&b| b.to_ascii_uppercase()).collect()
            )
        }
    } else {
        s.to_uppercase()
    }
}

// 使用 Cow 避免不必要的分配
use std::borrow::Cow;

fn maybe_process_string(s: &str, should_process: bool) -> Cow<str> {
    if should_process {
        Cow::Owned(s.to_uppercase())
    } else {
        Cow::Borrowed(s)
    }
}
```

## 性能测量

### 基准测试

```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};

fn fibonacci_recursive(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        n => fibonacci_recursive(n-1) + fibonacci_recursive(n-2),
    }
}

fn fibonacci_iterative(n: u64) -> u64 {
    let mut a = 0;
    let mut b = 1;
    for _ in 0..n {
        let temp = a + b;
        a = b;
        b = temp;
    }
    b
}

fn bench_fibonacci(c: &mut Criterion) {
    let mut group = c.benchmark_group("fibonacci");
    
    for i in [10, 15, 20].iter() {
        group.bench_with_input(BenchmarkId::new("recursive", i), i, 
            |b, i| b.iter(|| fibonacci_recursive(black_box(*i))));
        group.bench_with_input(BenchmarkId::new("iterative", i), i, 
            |b, i| b.iter(|| fibonacci_iterative(black_box(*i))));
    }
    group.finish();
}

criterion_group!(benches, bench_fibonacci);
criterion_main!(benches);
```

### 性能分析

```rust
use std::time::Instant;

fn profile_function() {
    let start = Instant::now();
    
    // 执行需要测量的代码
    expensive_operation();
    
    let duration = start.elapsed();
    println!("操作耗时: {:?}", duration);
}

// 使用 perf 进行更详细的分析
fn expensive_operation() {
    // 模拟耗时操作
    let data: Vec<i32> = (0..1_000_000).collect();
    let _sum: i32 = data.iter().sum();
}
```

## 内存使用优化

### 减少内存占用

```rust
// 使用位字段减少内存占用
struct CompactFlags {
    flags: u8, // 可以存储8个布尔值
}

impl CompactFlags {
    fn new() -> Self {
        CompactFlags { flags: 0 }
    }
    
    fn set_flag(&mut self, index: u8, value: bool) {
        if value {
            self.flags |= 1 << index;
        } else {
            self.flags &= !(1 << index);
        }
    }
    
    fn get_flag(&self, index: u8) -> bool {
        (self.flags & (1 << index)) != 0
    }
}

// 使用枚举而不是字符串
#[derive(Clone, Copy)]
enum Status {
    Active,
    Inactive,
    Pending,
}

// 而不是
// status: String
```

### 延迟初始化

```rust
use std::sync::Once;

struct ExpensiveResource {
    data: Vec<u8>,
}

impl ExpensiveResource {
    fn new() -> Self {
        println!("创建昂贵的资源");
        ExpensiveResource {
            data: vec![0; 1_000_000],
        }
    }
}

static INIT: Once = Once::new();
static mut RESOURCE: Option<ExpensiveResource> = None;

fn get_resource() -> &'static ExpensiveResource {
    unsafe {
        INIT.call_once(|| {
            RESOURCE = Some(ExpensiveResource::new());
        });
        RESOURCE.as_ref().unwrap()
    }
}

// 或使用 lazy_static
use lazy_static::lazy_static;

lazy_static! {
    static ref EXPENSIVE_RESOURCE: ExpensiveResource = ExpensiveResource::new();
}
```

## 编译时优化

### 常量求值

```rust
// 编译时计算
const FACTORIAL_10: u64 = {
    let mut result = 1;
    let mut i = 1;
    while i <= 10 {
        result *= i;
        i += 1;
    }
    result
};

// 使用 const fn
const fn fibonacci(n: u32) -> u32 {
    match n {
        0 | 1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

const FIB_10: u32 = fibonacci(10); // 编译时计算
```

### 零成本抽象

```rust
// 迭代器是零成本抽象
fn zero_cost_iteration(data: &[i32]) -> i32 {
    data.iter()
        .filter(|&&x| x > 0)
        .map(|&x| x * 2)
        .sum()
}

// 编译后等价于手写的循环
fn manual_loop(data: &[i32]) -> i32 {
    let mut sum = 0;
    for &x in data {
        if x > 0 {
            sum += x * 2;
        }
    }
    sum
}
```

## 实际优化案例

### JSON 解析优化

```rust
use serde_json;
use simd_json;

// 标准 JSON 解析
fn parse_json_standard(data: &str) -> serde_json::Result<serde_json::Value> {
    serde_json::from_str(data)
}

// SIMD 加速的 JSON 解析
fn parse_json_simd(data: &mut [u8]) -> simd_json::Result<simd_json::OwnedValue> {
    simd_json::to_owned_value(data)
}

// 流式解析大文件
use serde_json::Deserializer;

fn parse_json_streaming(data: &str) {
    let stream = Deserializer::from_str(data).into_iter::<serde_json::Value>();
    for value in stream {
        match value {
            Ok(v) => println!("解析到值: {:?}", v),
            Err(e) => eprintln!("解析错误: {}", e),
        }
    }
}
```

### 网络 I/O 优化

```rust
use tokio::io::{AsyncReadExt, AsyncWriteExt, BufReader, BufWriter};
use tokio::net::TcpStream;

// 使用缓冲 I/O
async fn optimized_network_io(mut stream: TcpStream) -> tokio::io::Result<()> {
    let (reader, writer) = stream.split();
    let mut buf_reader = BufReader::new(reader);
    let mut buf_writer = BufWriter::new(writer);

    let mut buffer = vec![0; 8192]; // 使用较大的缓冲区
    
    loop {
        let n = buf_reader.read(&mut buffer).await?;
        if n == 0 {
            break;
        }
        
        buf_writer.write_all(&buffer[..n]).await?;
        buf_writer.flush().await?; // 定期刷新
    }
    
    Ok(())
}
```

## 性能监控

### 运行时性能监控

```rust
use std::time::{Duration, Instant};
use std::collections::VecDeque;

struct PerformanceMonitor {
    samples: VecDeque<Duration>,
    max_samples: usize,
}

impl PerformanceMonitor {
    fn new(max_samples: usize) -> Self {
        PerformanceMonitor {
            samples: VecDeque::new(),
            max_samples,
        }
    }
    
    fn record(&mut self, duration: Duration) {
        if self.samples.len() >= self.max_samples {
            self.samples.pop_front();
        }
        self.samples.push_back(duration);
    }
    
    fn average(&self) -> Option<Duration> {
        if self.samples.is_empty() {
            None
        } else {
            let total: Duration = self.samples.iter().sum();
            Some(total / self.samples.len() as u32)
        }
    }
}

// 使用示例
fn monitored_operation() {
    static mut MONITOR: Option<PerformanceMonitor> = None;
    
    unsafe {
        if MONITOR.is_none() {
            MONITOR = Some(PerformanceMonitor::new(100));
        }
        
        let start = Instant::now();
        expensive_operation();
        let duration = start.elapsed();
        
        MONITOR.as_mut().unwrap().record(duration);
        
        if let Some(avg) = MONITOR.as_ref().unwrap().average() {
            println!("平均耗时: {:?}", avg);
        }
    }
}
```

## 最佳实践总结

### 性能优化原则

1. **先测量，后优化** - 使用 profiler 找到真正的瓶颈
2. **选择合适的算法** - 算法复杂度比微优化更重要
3. **避免过早优化** - 保持代码清晰，在需要时再优化
4. **利用编译器** - 相信 Rust 编译器的优化能力

### 常见优化技巧

- 使用 `Vec::with_capacity()` 预分配内存
- 优先使用迭代器而不是索引访问
- 避免不必要的克隆和分配
- 使用 `&str` 而不是 `String` 作为参数
- 考虑使用 `Cow` 类型避免不必要的分配
- 利用 SIMD 和并行化处理大数据集

性能优化是一个持续的过程，需要在可读性、可维护性和性能之间找到平衡！
