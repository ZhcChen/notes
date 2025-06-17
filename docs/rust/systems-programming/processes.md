# 进程与线程管理

## 🎯 进程管理概述

进程和线程管理是系统编程的核心技能，涉及进程创建、进程间通信、线程同步、资源管理等重要概念。

## 🚀 进程创建和管理

### 使用std::process创建进程
```rust
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};

fn basic_process_creation() -> std::io::Result<()> {
    // 简单命令执行
    let output = Command::new("ls")
        .arg("-la")
        .output()?;
    
    println!("Exit status: {}", output.status);
    println!("Stdout: {}", String::from_utf8_lossy(&output.stdout));
    println!("Stderr: {}", String::from_utf8_lossy(&output.stderr));
    
    // 检查命令是否成功
    if output.status.success() {
        println!("Command executed successfully");
    } else {
        println!("Command failed with code: {:?}", output.status.code());
    }
    
    Ok(())
}

fn interactive_process() -> std::io::Result<()> {
    let mut child = Command::new("python3")
        .arg("-c")
        .arg("import sys; print('Hello from Python'); print(input('Enter something: '), file=sys.stderr)")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;
    
    // 向子进程发送输入
    if let Some(stdin) = child.stdin.take() {
        use std::io::Write;
        let mut stdin = stdin;
        stdin.write_all(b"Hello from Rust!\n")?;
    }
    
    // 读取输出
    let output = child.wait_with_output()?;
    println!("Python stdout: {}", String::from_utf8_lossy(&output.stdout));
    println!("Python stderr: {}", String::from_utf8_lossy(&output.stderr));
    
    Ok(())
}
```

### Unix进程管理
```rust
use nix::unistd::{fork, getpid, getppid, ForkResult, execv};
use nix::sys::wait::{waitpid, WaitStatus};
use std::ffi::CString;

fn unix_process_management() -> nix::Result<()> {
    println!("Parent process PID: {}", getpid());
    
    match unsafe { fork() }? {
        ForkResult::Parent { child } => {
            println!("Parent: Created child with PID {}", child);
            
            // 等待子进程结束
            match waitpid(child, None)? {
                WaitStatus::Exited(pid, status) => {
                    println!("Child {} exited with status {}", pid, status);
                }
                WaitStatus::Signaled(pid, signal, _) => {
                    println!("Child {} killed by signal {:?}", pid, signal);
                }
                _ => println!("Child process ended unexpectedly"),
            }
        }
        ForkResult::Child => {
            println!("Child process PID: {}, Parent PID: {}", getpid(), getppid());
            
            // 子进程执行一些工作
            std::thread::sleep(std::time::Duration::from_secs(2));
            println!("Child process finishing");
            
            std::process::exit(0);
        }
    }
    
    Ok(())
}

fn exec_example() -> nix::Result<()> {
    match unsafe { fork() }? {
        ForkResult::Parent { child } => {
            waitpid(child, None)?;
            println!("Child process completed");
        }
        ForkResult::Child => {
            // 使用exec替换当前进程映像
            let program = CString::new("/bin/echo")?;
            let args = vec![
                CString::new("echo")?,
                CString::new("Hello from exec!")?,
            ];
            
            execv(&program, &args)?;
            // 如果exec成功，这行代码不会执行
            unreachable!();
        }
    }
    
    Ok(())
}
```

## 🧵 线程管理

### 标准库线程
```rust
use std::thread;
use std::sync::{Arc, Mutex, Condvar};
use std::time::Duration;

fn basic_threading() {
    let handles: Vec<_> = (0..5)
        .map(|i| {
            thread::spawn(move || {
                println!("Thread {} starting", i);
                thread::sleep(Duration::from_millis(100 * i));
                println!("Thread {} finishing", i);
                i * i
            })
        })
        .collect();
    
    // 等待所有线程完成并收集结果
    for (i, handle) in handles.into_iter().enumerate() {
        match handle.join() {
            Ok(result) => println!("Thread {} result: {}", i, result),
            Err(_) => println!("Thread {} panicked", i),
        }
    }
}

fn producer_consumer_example() {
    let data = Arc::new(Mutex::new(Vec::new()));
    let condvar = Arc::new(Condvar::new());
    
    // 生产者线程
    let data_producer = Arc::clone(&data);
    let condvar_producer = Arc::clone(&condvar);
    let producer = thread::spawn(move || {
        for i in 0..10 {
            {
                let mut vec = data_producer.lock().unwrap();
                vec.push(i);
                println!("Produced: {}", i);
            }
            condvar_producer.notify_one();
            thread::sleep(Duration::from_millis(100));
        }
    });
    
    // 消费者线程
    let data_consumer = Arc::clone(&data);
    let condvar_consumer = Arc::clone(&condvar);
    let consumer = thread::spawn(move || {
        loop {
            let mut vec = data_consumer.lock().unwrap();
            while vec.is_empty() {
                vec = condvar_consumer.wait(vec).unwrap();
            }
            
            if let Some(item) = vec.pop() {
                println!("Consumed: {}", item);
                drop(vec); // 释放锁
                thread::sleep(Duration::from_millis(150));
            }
        }
    });
    
    producer.join().unwrap();
    thread::sleep(Duration::from_secs(2)); // 让消费者处理剩余数据
}
```

### 线程池实现
```rust
use std::sync::{Arc, Mutex, mpsc};
use std::thread;

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

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
            println!("Worker {} executing job", id);
            job();
        });
        
        Worker { id, thread }
    }
}

fn thread_pool_example() {
    let pool = ThreadPool::new(4);
    
    for i in 0..10 {
        pool.execute(move || {
            println!("Task {} executing on thread {:?}", i, thread::current().id());
            thread::sleep(Duration::from_millis(500));
            println!("Task {} completed", i);
        });
    }
    
    thread::sleep(Duration::from_secs(5));
}
```

## 📡 进程间通信

### 管道通信
```rust
use std::process::{Command, Stdio};
use std::io::{Write, BufRead, BufReader};

fn pipe_communication() -> std::io::Result<()> {
    let mut child1 = Command::new("echo")
        .arg("Hello, pipe!")
        .stdout(Stdio::piped())
        .spawn()?;
    
    let mut child2 = Command::new("wc")
        .arg("-w")
        .stdin(child1.stdout.take().unwrap())
        .stdout(Stdio::piped())
        .spawn()?;
    
    let output = child2.wait_with_output()?;
    println!("Word count: {}", String::from_utf8_lossy(&output.stdout));
    
    Ok(())
}

// Unix命名管道
#[cfg(unix)]
fn named_pipe_example() -> std::io::Result<()> {
    use std::fs::OpenOptions;
    use std::io::{Read, Write};
    
    let pipe_path = "/tmp/rust_pipe";
    
    // 创建命名管道
    unsafe {
        let path = std::ffi::CString::new(pipe_path).unwrap();
        if libc::mkfifo(path.as_ptr(), 0o666) == -1 {
            let error = std::io::Error::last_os_error();
            if error.kind() != std::io::ErrorKind::AlreadyExists {
                return Err(error);
            }
        }
    }
    
    // 启动写入线程
    let pipe_path_clone = pipe_path.to_string();
    let writer_thread = thread::spawn(move || {
        let mut file = OpenOptions::new()
            .write(true)
            .open(&pipe_path_clone)
            .unwrap();
        
        for i in 0..5 {
            writeln!(file, "Message {}", i).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });
    
    // 读取线程
    let reader_thread = thread::spawn(move || {
        let file = OpenOptions::new()
            .read(true)
            .open(pipe_path)
            .unwrap();
        
        let reader = BufReader::new(file);
        for line in reader.lines() {
            println!("Received: {}", line.unwrap());
        }
    });
    
    writer_thread.join().unwrap();
    reader_thread.join().unwrap();
    
    Ok(())
}
```

### 共享内存
```rust
#[cfg(unix)]
mod shared_memory {
    use std::ptr;
    use std::slice;
    use libc::{shm_open, shm_unlink, ftruncate, mmap, munmap};
    use libc::{O_CREAT, O_RDWR, PROT_READ, PROT_WRITE, MAP_SHARED};
    
    pub struct SharedMemory {
        ptr: *mut u8,
        size: usize,
        name: String,
    }
    
    impl SharedMemory {
        pub fn create(name: &str, size: usize) -> std::io::Result<Self> {
            let c_name = std::ffi::CString::new(name)?;
            
            unsafe {
                // 创建共享内存对象
                let fd = shm_open(c_name.as_ptr(), O_CREAT | O_RDWR, 0o666);
                if fd == -1 {
                    return Err(std::io::Error::last_os_error());
                }
                
                // 设置大小
                if ftruncate(fd, size as i64) == -1 {
                    libc::close(fd);
                    return Err(std::io::Error::last_os_error());
                }
                
                // 映射到内存
                let ptr = mmap(
                    ptr::null_mut(),
                    size,
                    PROT_READ | PROT_WRITE,
                    MAP_SHARED,
                    fd,
                    0,
                );
                
                libc::close(fd);
                
                if ptr == libc::MAP_FAILED {
                    return Err(std::io::Error::last_os_error());
                }
                
                Ok(SharedMemory {
                    ptr: ptr as *mut u8,
                    size,
                    name: name.to_string(),
                })
            }
        }
        
        pub fn as_slice_mut(&mut self) -> &mut [u8] {
            unsafe { slice::from_raw_parts_mut(self.ptr, self.size) }
        }
        
        pub fn as_slice(&self) -> &[u8] {
            unsafe { slice::from_raw_parts(self.ptr, self.size) }
        }
    }
    
    impl Drop for SharedMemory {
        fn drop(&mut self) {
            unsafe {
                munmap(self.ptr as *mut libc::c_void, self.size);
                let c_name = std::ffi::CString::new(&self.name).unwrap();
                shm_unlink(c_name.as_ptr());
            }
        }
    }
}

#[cfg(unix)]
fn shared_memory_example() -> std::io::Result<()> {
    use shared_memory::SharedMemory;
    
    let mut shm = SharedMemory::create("/rust_shm", 1024)?;
    let data = shm.as_slice_mut();
    
    // 写入数据
    data[0..13].copy_from_slice(b"Hello, shared");
    
    println!("Written to shared memory: {:?}", 
        std::str::from_utf8(&data[0..13]).unwrap());
    
    Ok(())
}
```

## 🔄 信号处理

### 基础信号处理
```rust
use nix::sys::signal::{self, Signal, SigHandler};
use std::sync::atomic::{AtomicBool, Ordering};

static RUNNING: AtomicBool = AtomicBool::new(true);

extern "C" fn handle_sigint(_: libc::c_int) {
    println!("\nReceived SIGINT, shutting down gracefully...");
    RUNNING.store(false, Ordering::Relaxed);
}

extern "C" fn handle_sigusr1(_: libc::c_int) {
    println!("Received SIGUSR1 - Custom signal handled");
}

fn signal_handling_example() -> nix::Result<()> {
    // 注册信号处理器
    unsafe {
        signal::signal(Signal::SIGINT, SigHandler::Handler(handle_sigint))?;
        signal::signal(Signal::SIGUSR1, SigHandler::Handler(handle_sigusr1))?;
    }
    
    println!("Process PID: {}. Send signals to test:", nix::unistd::getpid());
    println!("  kill -INT {} (or Ctrl+C)", nix::unistd::getpid());
    println!("  kill -USR1 {}", nix::unistd::getpid());
    
    // 主循环
    while RUNNING.load(Ordering::Relaxed) {
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    
    println!("Process exiting cleanly");
    Ok(())
}
```

## 📊 进程监控

### 系统资源监控
```rust
use std::fs;
use std::collections::HashMap;

#[derive(Debug)]
struct ProcessInfo {
    pid: u32,
    name: String,
    cpu_usage: f64,
    memory_usage: u64,
    state: String,
}

fn get_process_info(pid: u32) -> std::io::Result<ProcessInfo> {
    let stat_path = format!("/proc/{}/stat", pid);
    let stat_content = fs::read_to_string(stat_path)?;
    let fields: Vec<&str> = stat_content.split_whitespace().collect();
    
    let name = fields[1].trim_matches('(').trim_matches(')').to_string();
    let state = fields[2].to_string();
    
    // 读取内存信息
    let status_path = format!("/proc/{}/status", pid);
    let status_content = fs::read_to_string(status_path)?;
    let mut memory_usage = 0;
    
    for line in status_content.lines() {
        if line.starts_with("VmRSS:") {
            if let Some(value) = line.split_whitespace().nth(1) {
                memory_usage = value.parse().unwrap_or(0);
            }
            break;
        }
    }
    
    Ok(ProcessInfo {
        pid,
        name,
        cpu_usage: 0.0, // 简化版本，实际需要计算
        memory_usage,
        state,
    })
}

fn list_processes() -> std::io::Result<Vec<ProcessInfo>> {
    let mut processes = Vec::new();
    
    for entry in fs::read_dir("/proc")? {
        let entry = entry?;
        let file_name = entry.file_name();
        
        if let Some(name) = file_name.to_str() {
            if let Ok(pid) = name.parse::<u32>() {
                if let Ok(info) = get_process_info(pid) {
                    processes.push(info);
                }
            }
        }
    }
    
    Ok(processes)
}

fn process_monitoring_example() -> std::io::Result<()> {
    let processes = list_processes()?;
    
    println!("Top processes by memory usage:");
    let mut sorted_processes = processes;
    sorted_processes.sort_by(|a, b| b.memory_usage.cmp(&a.memory_usage));
    
    for (i, process) in sorted_processes.iter().take(10).enumerate() {
        println!("{}. {} (PID: {}) - {} KB - State: {}", 
            i + 1, process.name, process.pid, process.memory_usage, process.state);
    }
    
    Ok(())
}
```

## 🛡️ 进程安全和权限

### 权限管理
```rust
#[cfg(unix)]
fn privilege_management() -> nix::Result<()> {
    use nix::unistd::{getuid, geteuid, getgid, getegid, setuid, setgid};
    
    println!("Real UID: {}", getuid());
    println!("Effective UID: {}", geteuid());
    println!("Real GID: {}", getgid());
    println!("Effective GID: {}", getegid());
    
    // 注意：这些操作通常需要特殊权限
    // setuid(nix::unistd::Uid::from_raw(1000))?;
    // setgid(nix::unistd::Gid::from_raw(1000))?;
    
    Ok(())
}

// 安全的临时文件创建
fn secure_temp_file() -> std::io::Result<()> {
    use std::fs::OpenOptions;
    use std::os::unix::fs::OpenOptionsExt;
    
    let temp_file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .mode(0o600) // 只有所有者可读写
        .open("/tmp/secure_temp_file")?;
    
    println!("Secure temporary file created");
    
    // 使用完毕后删除
    std::fs::remove_file("/tmp/secure_temp_file")?;
    
    Ok(())
}
```

---

*进程和线程管理是系统编程的核心，掌握这些技能将让您能够构建高效、可靠的系统软件！🧵*
