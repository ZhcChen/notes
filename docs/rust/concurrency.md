# 并发编程

Rust 的并发编程模型基于所有权系统，提供了内存安全的并发编程能力。Rust 通过类型系统在编译时防止数据竞争，让并发编程变得更加安全。

## 线程基础

### 创建线程

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // 创建新线程
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    // 主线程执行
    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }

    // 等待子线程完成
    handle.join().unwrap();
}
```

### 线程间数据传递

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    // 使用 move 将所有权转移到线程
    let handle = thread::spawn(move || {
        println!("Here's a vector: {:?}", v);
    });

    // println!("v: {:?}", v); // 错误！v 已被移动

    handle.join().unwrap();
}
```

## 消息传递

### 基本通道

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // 创建通道
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
        // println!("val is {}", val); // 错误！val 已被移动
    });

    // 接收消息
    let received = rx.recv().unwrap();
    println!("Got: {}", received);
}
```

### 发送多个值

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    // 接收多个消息
    for received in rx {
        println!("Got: {}", received);
    }
}
```

### 多个发送者

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 克隆发送者
    let tx1 = tx.clone();
    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx1.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    thread::spawn(move || {
        let vals = vec![
            String::from("more"),
            String::from("messages"),
            String::from("for"),
            String::from("you"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    for received in rx {
        println!("Got: {}", received);
    }
}
```

## 共享状态并发

### Mutex 互斥锁

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut num = m.lock().unwrap();
        *num = 6;
    } // 锁在这里被释放

    println!("m = {:?}", m);
}
```

### 多线程共享 Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // 使用 Arc 在多个线程间共享 Mutex
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

### RwLock 读写锁

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // 多个读者
    for i in 0..3 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            let reader = data.read().unwrap();
            println!("Reader {}: {:?}", i, *reader);
            thread::sleep(Duration::from_millis(100));
        });
        handles.push(handle);
    }

    // 一个写者
    let data_writer = Arc::clone(&data);
    let writer_handle = thread::spawn(move || {
        thread::sleep(Duration::from_millis(50));
        let mut writer = data_writer.write().unwrap();
        writer.push(4);
        println!("Writer: added 4");
    });
    handles.push(writer_handle);

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final data: {:?}", *data.read().unwrap());
}
```

## 原子类型

### 基本原子操作

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(AtomicUsize::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            for _ in 0..1000 {
                counter.fetch_add(1, Ordering::SeqCst);
            }
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", counter.load(Ordering::SeqCst));
}
```

### 不同的内存排序

```rust
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(AtomicUsize::new(0));
    let flag = Arc::new(AtomicBool::new(false));

    let data_clone = Arc::clone(&data);
    let flag_clone = Arc::clone(&flag);

    // 写线程
    let writer = thread::spawn(move || {
        data_clone.store(42, Ordering::Relaxed);
        flag_clone.store(true, Ordering::Release); // Release 语义
    });

    // 读线程
    let reader = thread::spawn(move || {
        while !flag.load(Ordering::Acquire) { // Acquire 语义
            thread::yield_now();
        }
        let value = data.load(Ordering::Relaxed);
        println!("Read value: {}", value);
    });

    writer.join().unwrap();
    reader.join().unwrap();
}
```

## 线程池

### 简单线程池实现

```rust
use std::sync::{mpsc, Arc, Mutex};
use std::thread;

type Job = Box<dyn FnOnce() + Send + 'static>;

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        self.sender.send(job).unwrap();
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || loop {
            let job = receiver.lock().unwrap().recv().unwrap();
            println!("Worker {} got a job; executing.", id);
            job();
        });

        Worker { id, thread }
    }
}

fn main() {
    let pool = ThreadPool::new(4);

    for i in 0..8 {
        pool.execute(move || {
            println!("Task {} is running", i);
            thread::sleep(std::time::Duration::from_secs(1));
            println!("Task {} completed", i);
        });
    }

    thread::sleep(std::time::Duration::from_secs(10));
}
```

## 同步原语

### Barrier 屏障

```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let mut handles = Vec::with_capacity(10);
    let barrier = Arc::new(Barrier::new(10));

    for i in 0..10 {
        let c = Arc::clone(&barrier);
        handles.push(thread::spawn(move || {
            println!("Thread {} is working...", i);
            thread::sleep(std::time::Duration::from_millis(i * 100));
            
            println!("Thread {} finished work, waiting for others", i);
            c.wait();
            
            println!("Thread {} passed the barrier!", i);
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Condvar 条件变量

```rust
use std::sync::{Arc, Condvar, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));
    let pair2 = Arc::clone(&pair);

    // 等待线程
    thread::spawn(move || {
        let (lock, cvar) = &*pair2;
        let mut started = lock.lock().unwrap();
        
        while !*started {
            println!("Waiting for condition...");
            started = cvar.wait(started).unwrap();
        }
        
        println!("Condition met! Proceeding...");
    });

    // 通知线程
    thread::sleep(Duration::from_secs(2));
    
    let (lock, cvar) = &*pair;
    let mut started = lock.lock().unwrap();
    *started = true;
    cvar.notify_one();
    
    thread::sleep(Duration::from_secs(1));
}
```

### Once 一次性初始化

```rust
use std::sync::Once;
use std::thread;

static INIT: Once = Once::new();
static mut VAL: usize = 0;

fn get_value() -> usize {
    unsafe {
        INIT.call_once(|| {
            VAL = expensive_computation();
        });
        VAL
    }
}

fn expensive_computation() -> usize {
    println!("Performing expensive computation...");
    thread::sleep(std::time::Duration::from_secs(1));
    42
}

fn main() {
    let mut handles = vec![];

    for i in 0..5 {
        let handle = thread::spawn(move || {
            println!("Thread {} got value: {}", i, get_value());
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

## 实际应用示例

### 并发下载器

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

struct DownloadManager {
    downloads: Arc<Mutex<Vec<Download>>>,
    max_concurrent: usize,
}

#[derive(Debug, Clone)]
struct Download {
    id: usize,
    url: String,
    status: DownloadStatus,
}

#[derive(Debug, Clone)]
enum DownloadStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

impl DownloadManager {
    fn new(max_concurrent: usize) -> Self {
        DownloadManager {
            downloads: Arc::new(Mutex::new(Vec::new())),
            max_concurrent,
        }
    }

    fn add_download(&self, url: String) -> usize {
        let mut downloads = self.downloads.lock().unwrap();
        let id = downloads.len();
        downloads.push(Download {
            id,
            url,
            status: DownloadStatus::Pending,
        });
        id
    }

    fn start_downloads(&self) {
        let downloads = Arc::clone(&self.downloads);
        
        for _ in 0..self.max_concurrent {
            let downloads_clone = Arc::clone(&downloads);
            thread::spawn(move || {
                loop {
                    let download = {
                        let mut downloads = downloads_clone.lock().unwrap();
                        downloads.iter_mut()
                            .find(|d| matches!(d.status, DownloadStatus::Pending))
                            .map(|d| {
                                d.status = DownloadStatus::InProgress;
                                d.clone()
                            })
                    };

                    if let Some(download) = download {
                        println!("Starting download {}: {}", download.id, download.url);
                        
                        // 模拟下载
                        thread::sleep(Duration::from_secs(2));
                        
                        let mut downloads = downloads_clone.lock().unwrap();
                        if let Some(d) = downloads.iter_mut().find(|d| d.id == download.id) {
                            d.status = DownloadStatus::Completed;
                            println!("Completed download {}", download.id);
                        }
                    } else {
                        thread::sleep(Duration::from_millis(100));
                    }
                }
            });
        }
    }

    fn get_status(&self) -> Vec<Download> {
        self.downloads.lock().unwrap().clone()
    }
}

fn main() {
    let manager = DownloadManager::new(3);

    // 添加下载任务
    for i in 0..10 {
        manager.add_download(format!("https://example.com/file{}.zip", i));
    }

    // 开始下载
    manager.start_downloads();

    // 监控进度
    for _ in 0..15 {
        thread::sleep(Duration::from_secs(1));
        let downloads = manager.get_status();
        let completed = downloads.iter().filter(|d| matches!(d.status, DownloadStatus::Completed)).count();
        let in_progress = downloads.iter().filter(|d| matches!(d.status, DownloadStatus::InProgress)).count();
        let pending = downloads.iter().filter(|d| matches!(d.status, DownloadStatus::Pending)).count();
        
        println!("Progress: {} completed, {} in progress, {} pending", completed, in_progress, pending);
        
        if completed == downloads.len() {
            break;
        }
    }
}
```

### 生产者-消费者模式

```rust
use std::sync::{Arc, Condvar, Mutex};
use std::thread;
use std::time::Duration;
use std::collections::VecDeque;

struct Buffer<T> {
    queue: Mutex<VecDeque<T>>,
    not_empty: Condvar,
    not_full: Condvar,
    capacity: usize,
}

impl<T> Buffer<T> {
    fn new(capacity: usize) -> Self {
        Buffer {
            queue: Mutex::new(VecDeque::new()),
            not_empty: Condvar::new(),
            not_full: Condvar::new(),
            capacity,
        }
    }

    fn put(&self, item: T) {
        let mut queue = self.queue.lock().unwrap();
        
        while queue.len() == self.capacity {
            queue = self.not_full.wait(queue).unwrap();
        }
        
        queue.push_back(item);
        self.not_empty.notify_one();
    }

    fn take(&self) -> T {
        let mut queue = self.queue.lock().unwrap();
        
        while queue.is_empty() {
            queue = self.not_empty.wait(queue).unwrap();
        }
        
        let item = queue.pop_front().unwrap();
        self.not_full.notify_one();
        item
    }
}

fn main() {
    let buffer = Arc::new(Buffer::new(5));
    let mut handles = vec![];

    // 生产者
    for i in 0..3 {
        let buffer = Arc::clone(&buffer);
        let handle = thread::spawn(move || {
            for j in 0..5 {
                let item = format!("Producer {} - Item {}", i, j);
                println!("Producing: {}", item);
                buffer.put(item);
                thread::sleep(Duration::from_millis(100));
            }
        });
        handles.push(handle);
    }

    // 消费者
    for i in 0..2 {
        let buffer = Arc::clone(&buffer);
        let handle = thread::spawn(move || {
            for _ in 0..7 {
                let item = buffer.take();
                println!("Consumer {} consumed: {}", i, item);
                thread::sleep(Duration::from_millis(150));
            }
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

## 性能考虑

### 避免过度同步

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    // 不好的做法：频繁加锁
    for _ in 0..10 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            for _ in 0..1000 {
                let mut num = data.lock().unwrap();
                *num += 1;
                // 锁持有时间过长
            }
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Bad approach result: {}", *data.lock().unwrap());

    // 更好的做法：批量操作
    let data2 = Arc::new(Mutex::new(0));
    let mut handles2 = vec![];

    for _ in 0..10 {
        let data = Arc::clone(&data2);
        let handle = thread::spawn(move || {
            let mut local_sum = 0;
            for _ in 0..1000 {
                local_sum += 1;
            }
            let mut num = data.lock().unwrap();
            *num += local_sum;
        });
        handles2.push(handle);
    }

    for handle in handles2 {
        handle.join().unwrap();
    }

    println!("Better approach result: {}", *data2.lock().unwrap());
}
```

## 练习

### 练习 1：并发计数器
实现一个线程安全的计数器，支持多线程同时增减。

### 练习 2：任务队列
创建一个任务队列系统，支持多个工作线程处理任务。

### 练习 3：缓存系统
实现一个线程安全的 LRU 缓存。

### 练习 4：并发哈希表
设计一个支持并发读写的哈希表。

## 下一步

掌握了并发编程后，您可以继续学习：

1. [异步编程](./async.md) - async/await 模式
2. [测试](./testing.md) - 单元测试和集成测试
3. [包管理 Cargo](./cargo.md) - 项目管理工具

并发编程是构建高性能 Rust 应用的重要技能！
