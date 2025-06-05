# 异步编程

异步编程允许程序在等待 I/O 操作时执行其他任务，从而提高程序的并发性和效率。Rust 的异步编程基于 Future 和 async/await 语法。

## 异步基础

### async/await 语法

```rust
// 需要在 Cargo.toml 中添加：
// [dependencies]
// tokio = { version = "1", features = ["full"] }

use std::time::Duration;
use tokio::time::sleep;

async fn say_hello() {
    println!("Hello");
    sleep(Duration::from_secs(1)).await;
    println!("World");
}

#[tokio::main]
async fn main() {
    say_hello().await;
    println!("Done!");
}
```

### Future 特征

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};

struct TimerFuture {
    when: Instant,
}

impl TimerFuture {
    fn new(duration: Duration) -> Self {
        TimerFuture {
            when: Instant::now() + duration,
        }
    }
}

impl Future for TimerFuture {
    type Output = ();

    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        if Instant::now() >= self.when {
            Poll::Ready(())
        } else {
            Poll::Pending
        }
    }
}

#[tokio::main]
async fn main() {
    println!("Starting timer...");
    TimerFuture::new(Duration::from_secs(2)).await;
    println!("Timer finished!");
}
```

## 异步函数和块

### 异步函数

```rust
use tokio::time::{sleep, Duration};

async fn fetch_data(id: u32) -> String {
    println!("Fetching data for id: {}", id);
    sleep(Duration::from_millis(100)).await;
    format!("Data for id: {}", id)
}

async fn process_data(data: String) -> String {
    println!("Processing: {}", data);
    sleep(Duration::from_millis(50)).await;
    format!("Processed: {}", data)
}

#[tokio::main]
async fn main() {
    let data = fetch_data(42).await;
    let result = process_data(data).await;
    println!("Result: {}", result);
}
```

### 异步块

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let future = async {
        println!("Starting async block");
        sleep(Duration::from_secs(1)).await;
        println!("Async block completed");
        42
    };

    let result = future.await;
    println!("Result: {}", result);
}
```

## 并发执行

### join! 宏

```rust
use tokio::time::{sleep, Duration};

async fn task1() -> u32 {
    println!("Task 1 starting");
    sleep(Duration::from_secs(2)).await;
    println!("Task 1 completed");
    1
}

async fn task2() -> u32 {
    println!("Task 2 starting");
    sleep(Duration::from_secs(1)).await;
    println!("Task 2 completed");
    2
}

#[tokio::main]
async fn main() {
    let start = std::time::Instant::now();
    
    // 并发执行
    let (result1, result2) = tokio::join!(task1(), task2());
    
    println!("Results: {}, {}", result1, result2);
    println!("Total time: {:?}", start.elapsed());
}
```

### select! 宏

```rust
use tokio::time::{sleep, Duration};

async fn task1() -> &'static str {
    sleep(Duration::from_secs(1)).await;
    "Task 1 completed"
}

async fn task2() -> &'static str {
    sleep(Duration::from_secs(2)).await;
    "Task 2 completed"
}

#[tokio::main]
async fn main() {
    tokio::select! {
        result = task1() => {
            println!("First to complete: {}", result);
        }
        result = task2() => {
            println!("First to complete: {}", result);
        }
    }
}
```

### spawn 任务

```rust
use tokio::time::{sleep, Duration};

async fn background_task(id: u32) {
    for i in 1..=5 {
        println!("Background task {} - step {}", id, i);
        sleep(Duration::from_millis(500)).await;
    }
}

#[tokio::main]
async fn main() {
    // 生成后台任务
    let handle1 = tokio::spawn(background_task(1));
    let handle2 = tokio::spawn(background_task(2));

    // 主任务
    for i in 1..=3 {
        println!("Main task - step {}", i);
        sleep(Duration::from_secs(1)).await;
    }

    // 等待后台任务完成
    let _ = tokio::join!(handle1, handle2);
    println!("All tasks completed");
}
```

## 异步 I/O

### 文件操作

```rust
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 异步写文件
    let mut file = File::create("example.txt").await?;
    file.write_all(b"Hello, async world!").await?;
    file.flush().await?;

    // 异步读文件
    let mut file = File::open("example.txt").await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    
    println!("File contents: {}", contents);

    // 清理
    tokio::fs::remove_file("example.txt").await?;
    
    Ok(())
}
```

### 网络操作

```rust
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

async fn handle_client(mut socket: TcpStream) -> Result<(), Box<dyn std::error::Error>> {
    let mut buffer = [0; 1024];
    
    loop {
        let n = socket.read(&mut buffer).await?;
        
        if n == 0 {
            break;
        }
        
        // 回显数据
        socket.write_all(&buffer[..n]).await?;
    }
    
    Ok(())
}

async fn server() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server listening on 127.0.0.1:8080");

    loop {
        let (socket, addr) = listener.accept().await?;
        println!("New client: {}", addr);
        
        // 为每个客户端生成一个任务
        tokio::spawn(async move {
            if let Err(e) = handle_client(socket).await {
                eprintln!("Error handling client: {}", e);
            }
        });
    }
}

#[tokio::main]
async fn main() {
    if let Err(e) = server().await {
        eprintln!("Server error: {}", e);
    }
}
```

## 异步通道

### mpsc 通道

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(32);

    // 生产者任务
    let producer = tokio::spawn(async move {
        for i in 1..=5 {
            if tx.send(format!("Message {}", i)).await.is_err() {
                break;
            }
            sleep(Duration::from_millis(500)).await;
        }
    });

    // 消费者任务
    let consumer = tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            println!("Received: {}", message);
        }
    });

    let _ = tokio::join!(producer, consumer);
}
```

### oneshot 通道

```rust
use tokio::sync::oneshot;
use tokio::time::{sleep, Duration};

async fn compute_value() -> u32 {
    sleep(Duration::from_secs(2)).await;
    42
}

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel();

    // 计算任务
    tokio::spawn(async move {
        let value = compute_value().await;
        let _ = tx.send(value);
    });

    // 等待结果
    match rx.await {
        Ok(value) => println!("Computed value: {}", value),
        Err(_) => println!("Computation failed"),
    }
}
```

## 异步同步原语

### Mutex

```rust
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..5 {
        let data = Arc::clone(&data);
        let handle = tokio::spawn(async move {
            for _ in 0..10 {
                let mut guard = data.lock().await;
                *guard += 1;
                println!("Task {} incremented to {}", i, *guard);
                drop(guard); // 显式释放锁
                sleep(Duration::from_millis(10)).await;
            }
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.await.unwrap();
    }

    println!("Final value: {}", *data.lock().await);
}
```

### RwLock

```rust
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // 读者任务
    for i in 0..3 {
        let data = Arc::clone(&data);
        let handle = tokio::spawn(async move {
            let reader = data.read().await;
            println!("Reader {} sees: {:?}", i, *reader);
            sleep(Duration::from_millis(100)).await;
        });
        handles.push(handle);
    }

    // 写者任务
    let data_writer = Arc::clone(&data);
    let writer_handle = tokio::spawn(async move {
        sleep(Duration::from_millis(50)).await;
        let mut writer = data_writer.write().await;
        writer.push(4);
        println!("Writer added 4");
    });
    handles.push(writer_handle);

    for handle in handles {
        handle.await.unwrap();
    }

    println!("Final data: {:?}", *data.read().await);
}
```

## 流 (Streams)

### 基本流操作

```rust
use tokio_stream::{self as stream, StreamExt};
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    // 创建一个数字流
    let mut stream = stream::iter(1..=5);
    
    while let Some(value) = stream.next().await {
        println!("Value: {}", value);
    }

    // 定时器流
    let mut interval_stream = interval(Duration::from_secs(1));
    
    for _ in 0..3 {
        interval_stream.tick().await;
        println!("Tick!");
    }
}
```

### 流转换

```rust
use tokio_stream::{self as stream, StreamExt};

#[tokio::main]
async fn main() {
    let numbers = stream::iter(1..=10);
    
    let doubled: Vec<i32> = numbers
        .map(|x| x * 2)
        .filter(|&x| x > 10)
        .collect()
        .await;
    
    println!("Doubled and filtered: {:?}", doubled);
}
```

## 实际应用示例

### HTTP 客户端

```rust
// 需要在 Cargo.toml 中添加：
// reqwest = { version = "0.11", features = ["json"] }
// serde = { version = "1.0", features = ["derive"] }

use reqwest;
use serde::Deserialize;
use tokio::time::{timeout, Duration};

#[derive(Deserialize, Debug)]
struct Post {
    id: u32,
    title: String,
    body: String,
}

async fn fetch_post(id: u32) -> Result<Post, Box<dyn std::error::Error>> {
    let url = format!("https://jsonplaceholder.typicode.com/posts/{}", id);
    
    // 设置超时
    let response = timeout(
        Duration::from_secs(5),
        reqwest::get(&url)
    ).await??;
    
    let post: Post = response.json().await?;
    Ok(post)
}

async fn fetch_multiple_posts(ids: Vec<u32>) -> Vec<Result<Post, Box<dyn std::error::Error>>> {
    let futures: Vec<_> = ids.into_iter()
        .map(|id| fetch_post(id))
        .collect();
    
    // 并发执行所有请求
    futures::future::join_all(futures).await
}

#[tokio::main]
async fn main() {
    let post_ids = vec![1, 2, 3, 4, 5];
    
    let results = fetch_multiple_posts(post_ids).await;
    
    for (i, result) in results.into_iter().enumerate() {
        match result {
            Ok(post) => println!("Post {}: {}", i + 1, post.title),
            Err(e) => println!("Error fetching post {}: {}", i + 1, e),
        }
    }
}
```

### 异步任务调度器

```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tokio::time::{sleep, Duration, Instant};

type TaskId = u64;
type TaskFn = Box<dyn Fn() -> Box<dyn std::future::Future<Output = ()> + Send + Unpin> + Send + Sync>;

struct Task {
    id: TaskId,
    name: String,
    interval: Duration,
    last_run: Option<Instant>,
    task_fn: TaskFn,
}

struct Scheduler {
    tasks: Arc<Mutex<HashMap<TaskId, Task>>>,
    next_id: Arc<Mutex<TaskId>>,
}

impl Scheduler {
    fn new() -> Self {
        Scheduler {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            next_id: Arc::new(Mutex::new(0)),
        }
    }

    async fn add_task<F, Fut>(&self, name: String, interval: Duration, task_fn: F) -> TaskId
    where
        F: Fn() -> Fut + Send + Sync + 'static,
        Fut: std::future::Future<Output = ()> + Send + 'static,
    {
        let mut next_id = self.next_id.lock().await;
        let id = *next_id;
        *next_id += 1;

        let task = Task {
            id,
            name,
            interval,
            last_run: None,
            task_fn: Box::new(move || Box::new(task_fn())),
        };

        self.tasks.lock().await.insert(id, task);
        id
    }

    async fn run(&self) {
        loop {
            let now = Instant::now();
            let mut tasks_to_run = Vec::new();

            {
                let mut tasks = self.tasks.lock().await;
                for task in tasks.values_mut() {
                    let should_run = task.last_run
                        .map(|last| now.duration_since(last) >= task.interval)
                        .unwrap_or(true);

                    if should_run {
                        task.last_run = Some(now);
                        tasks_to_run.push((task.id, task.name.clone(), (task.task_fn)()));
                    }
                }
            }

            for (id, name, future) in tasks_to_run {
                let name_clone = name.clone();
                tokio::spawn(async move {
                    println!("Running task {}: {}", id, name_clone);
                    future.await;
                    println!("Completed task {}: {}", id, name_clone);
                });
            }

            sleep(Duration::from_millis(100)).await;
        }
    }
}

async fn example_task(message: &'static str) {
    println!("Executing: {}", message);
    sleep(Duration::from_secs(1)).await;
}

#[tokio::main]
async fn main() {
    let scheduler = Scheduler::new();

    // 添加任务
    scheduler.add_task(
        "Task 1".to_string(),
        Duration::from_secs(3),
        || example_task("Hello from task 1")
    ).await;

    scheduler.add_task(
        "Task 2".to_string(),
        Duration::from_secs(5),
        || example_task("Hello from task 2")
    ).await;

    // 运行调度器
    scheduler.run().await;
}
```

## 错误处理

### 异步错误传播

```rust
use tokio::fs::File;
use tokio::io::AsyncReadExt;

async fn read_file_content(path: &str) -> Result<String, Box<dyn std::error::Error>> {
    let mut file = File::open(path).await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    Ok(contents)
}

async fn process_files(paths: Vec<&str>) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let mut results = Vec::new();
    
    for path in paths {
        let content = read_file_content(path).await?;
        results.push(content);
    }
    
    Ok(results)
}

#[tokio::main]
async fn main() {
    let files = vec!["file1.txt", "file2.txt"];
    
    match process_files(files).await {
        Ok(contents) => {
            for (i, content) in contents.iter().enumerate() {
                println!("File {}: {} chars", i + 1, content.len());
            }
        }
        Err(e) => println!("Error: {}", e),
    }
}
```

## 性能优化

### 避免阻塞

```rust
use tokio::task;
use std::time::Duration;

fn cpu_intensive_task(n: u64) -> u64 {
    // 模拟 CPU 密集型任务
    (0..n).sum()
}

#[tokio::main]
async fn main() {
    println!("Starting tasks...");
    
    // 错误做法：阻塞异步运行时
    // let result = cpu_intensive_task(1_000_000);
    
    // 正确做法：使用 spawn_blocking
    let handle = task::spawn_blocking(|| cpu_intensive_task(1_000_000));
    
    // 同时执行其他异步任务
    tokio::time::sleep(Duration::from_millis(100)).await;
    println!("Other async work completed");
    
    let result = handle.await.unwrap();
    println!("CPU task result: {}", result);
}
```

## 练习

### 练习 1：异步爬虫
实现一个简单的网页爬虫，并发抓取多个网页。

### 练习 2：聊天服务器
创建一个异步聊天服务器，支持多个客户端连接。

### 练习 3：文件处理器
实现异步文件处理器，并发处理多个文件。

### 练习 4：缓存服务
创建一个异步缓存服务，支持过期和自动清理。

## 下一步

掌握了异步编程后，您可以继续学习：

1. [测试](./testing.md) - 单元测试和集成测试
2. [包管理 Cargo](./cargo.md) - 项目管理工具
3. [宏编程](./macros.md) - 元编程

异步编程是构建高性能 I/O 密集型应用的关键技术！
