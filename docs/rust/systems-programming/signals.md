# 信号处理

## 🎯 信号处理概述

信号是Unix/Linux系统中进程间通信的重要机制，用于通知进程发生了特定事件。掌握信号处理对于编写健壮的系统软件至关重要。

## 📡 基础信号概念

### 常见信号类型
```rust
use nix::sys::signal::Signal;

fn signal_overview() {
    println!("=== 常见Unix信号 ===");
    println!("SIGINT ({}): 中断信号 (Ctrl+C)", Signal::SIGINT as i32);
    println!("SIGTERM ({}): 终止信号", Signal::SIGTERM as i32);
    println!("SIGKILL ({}): 强制终止信号", Signal::SIGKILL as i32);
    println!("SIGUSR1 ({}): 用户定义信号1", Signal::SIGUSR1 as i32);
    println!("SIGUSR2 ({}): 用户定义信号2", Signal::SIGUSR2 as i32);
    println!("SIGCHLD ({}): 子进程状态改变", Signal::SIGCHLD as i32);
    println!("SIGPIPE ({}): 管道破裂", Signal::SIGPIPE as i32);
    println!("SIGALRM ({}): 定时器信号", Signal::SIGALRM as i32);
}
```

## 🔧 信号处理实现

### 基础信号处理器
```rust
use nix::sys::signal::{self, Signal, SigHandler};
use std::sync::atomic::{AtomicBool, AtomicI32, Ordering};
use std::sync::Arc;

// 全局状态变量
static SHUTDOWN_REQUESTED: AtomicBool = AtomicBool::new(false);
static SIGNAL_COUNT: AtomicI32 = AtomicI32::new(0);

extern "C" fn handle_sigint(_signal: libc::c_int) {
    let count = SIGNAL_COUNT.fetch_add(1, Ordering::Relaxed) + 1;
    
    if count == 1 {
        println!("\n收到SIGINT信号，准备优雅关闭... (再次按Ctrl+C强制退出)");
        SHUTDOWN_REQUESTED.store(true, Ordering::Relaxed);
    } else {
        println!("\n收到第二次SIGINT信号，强制退出！");
        std::process::exit(1);
    }
}

extern "C" fn handle_sigusr1(_signal: libc::c_int) {
    println!("收到SIGUSR1信号 - 执行自定义操作");
}

extern "C" fn handle_sigterm(_signal: libc::c_int) {
    println!("收到SIGTERM信号 - 开始优雅关闭");
    SHUTDOWN_REQUESTED.store(true, Ordering::Relaxed);
}

fn setup_signal_handlers() -> nix::Result<()> {
    unsafe {
        // 注册信号处理器
        signal::signal(Signal::SIGINT, SigHandler::Handler(handle_sigint))?;
        signal::signal(Signal::SIGUSR1, SigHandler::Handler(handle_sigusr1))?;
        signal::signal(Signal::SIGTERM, SigHandler::Handler(handle_sigterm))?;
        
        // 忽略SIGPIPE信号
        signal::signal(Signal::SIGPIPE, SigHandler::SigIgn)?;
    }
    
    Ok(())
}

fn signal_handling_demo() -> nix::Result<()> {
    setup_signal_handlers()?;
    
    println!("信号处理演示程序启动");
    println!("进程PID: {}", nix::unistd::getpid());
    println!("发送信号测试:");
    println!("  kill -INT {} (或按 Ctrl+C)", nix::unistd::getpid());
    println!("  kill -USR1 {}", nix::unistd::getpid());
    println!("  kill -TERM {}", nix::unistd::getpid());
    
    let mut counter = 0;
    while !SHUTDOWN_REQUESTED.load(Ordering::Relaxed) {
        std::thread::sleep(std::time::Duration::from_secs(1));
        counter += 1;
        
        if counter % 5 == 0 {
            println!("程序运行中... ({}秒)", counter);
        }
    }
    
    println!("程序正在优雅关闭...");
    std::thread::sleep(std::time::Duration::from_secs(1));
    println!("清理完成，程序退出");
    
    Ok(())
}
```

### 高级信号处理
```rust
use nix::sys::signal::{sigaction, SigAction, SigSet, SaFlags};
use nix::sys::signalfd::{SignalFd, SfdFlags};

// 使用sigaction进行更精确的信号控制
fn advanced_signal_handling() -> nix::Result<()> {
    // 创建信号集
    let mut mask = SigSet::empty();
    mask.add(Signal::SIGINT);
    mask.add(Signal::SIGUSR1);
    
    // 阻塞这些信号，通过signalfd处理
    mask.thread_block()?;
    
    // 创建signalfd
    let mut sfd = SignalFd::new(&mask, SfdFlags::SFD_CLOEXEC)?;
    
    println!("使用signalfd处理信号...");
    println!("发送信号: kill -INT {} 或 kill -USR1 {}", 
        nix::unistd::getpid(), nix::unistd::getpid());
    
    loop {
        match sfd.read_signal() {
            Ok(Some(signal)) => {
                match signal.ssi_signo as i32 {
                    libc::SIGINT => {
                        println!("通过signalfd收到SIGINT");
                        break;
                    }
                    libc::SIGUSR1 => {
                        println!("通过signalfd收到SIGUSR1");
                        println!("信号发送者PID: {}", signal.ssi_pid);
                    }
                    _ => {
                        println!("收到其他信号: {}", signal.ssi_signo);
                    }
                }
            }
            Ok(None) => {
                // 没有信号，继续等待
                continue;
            }
            Err(e) => {
                eprintln!("读取信号失败: {}", e);
                break;
            }
        }
    }
    
    Ok(())
}
```

## ⏰ 定时器和闹钟

### 使用alarm设置定时器
```rust
use nix::sys::signal::{alarm, Signal, SigHandler};
use std::sync::atomic::{AtomicBool, Ordering};

static ALARM_TRIGGERED: AtomicBool = AtomicBool::new(false);

extern "C" fn handle_alarm(_signal: libc::c_int) {
    println!("定时器触发！");
    ALARM_TRIGGERED.store(true, Ordering::Relaxed);
}

fn alarm_example() -> nix::Result<()> {
    unsafe {
        signal::signal(Signal::SIGALRM, SigHandler::Handler(handle_alarm))?;
    }
    
    println!("设置5秒定时器...");
    alarm::alarm(5);
    
    // 等待定时器触发
    while !ALARM_TRIGGERED.load(Ordering::Relaxed) {
        std::thread::sleep(std::time::Duration::from_millis(100));
        print!(".");
        use std::io::{self, Write};
        io::stdout().flush().unwrap();
    }
    
    println!("\n定时器完成！");
    Ok(())
}
```

### 高精度定时器
```rust
use nix::sys::timerfd::{TimerFd, ClockId, TimerFlags, TimerSetTimeFlags};
use nix::sys::time::{TimeSpec, TimeValLike};
use std::os::unix::io::AsRawFd;

fn high_precision_timer() -> nix::Result<()> {
    // 创建定时器
    let timer_fd = TimerFd::new(ClockId::CLOCK_MONOTONIC, TimerFlags::empty())?;
    
    // 设置定时器：1秒后触发，然后每500毫秒重复
    let initial = TimeSpec::from_duration(std::time::Duration::from_secs(1));
    let interval = TimeSpec::from_duration(std::time::Duration::from_millis(500));
    
    timer_fd.set(initial, Some(interval), TimerSetTimeFlags::empty())?;
    
    println!("高精度定时器启动...");
    
    let fd = timer_fd.as_raw_fd();
    let mut count = 0;
    
    loop {
        // 等待定时器事件
        let mut fds = [libc::pollfd {
            fd,
            events: libc::POLLIN,
            revents: 0,
        }];
        
        unsafe {
            let result = libc::poll(fds.as_mut_ptr(), 1, -1);
            if result > 0 {
                // 读取定时器事件
                let mut buffer = [0u8; 8];
                libc::read(fd, buffer.as_mut_ptr() as *mut libc::c_void, 8);
                
                count += 1;
                println!("定时器事件 #{}", count);
                
                if count >= 10 {
                    break;
                }
            }
        }
    }
    
    println!("定时器演示完成");
    Ok(())
}
```

## 🔄 信号发送

### 发送信号给其他进程
```rust
use nix::sys::signal::{kill, Signal};
use nix::unistd::Pid;

fn send_signals_example() -> nix::Result<()> {
    let current_pid = nix::unistd::getpid();
    println!("当前进程PID: {}", current_pid);
    
    // 创建子进程用于演示
    match unsafe { nix::unistd::fork() }? {
        nix::unistd::ForkResult::Parent { child } => {
            println!("父进程: 创建了子进程 {}", child);
            
            // 等待一下让子进程设置信号处理器
            std::thread::sleep(std::time::Duration::from_secs(1));
            
            // 发送SIGUSR1信号给子进程
            println!("父进程: 发送SIGUSR1给子进程");
            kill(child, Signal::SIGUSR1)?;
            
            std::thread::sleep(std::time::Duration::from_secs(1));
            
            // 发送SIGTERM信号终止子进程
            println!("父进程: 发送SIGTERM给子进程");
            kill(child, Signal::SIGTERM)?;
            
            // 等待子进程结束
            nix::sys::wait::waitpid(child, None)?;
            println!("父进程: 子进程已结束");
        }
        nix::unistd::ForkResult::Child => {
            // 子进程设置信号处理器
            unsafe {
                signal::signal(Signal::SIGUSR1, SigHandler::Handler(|_| {
                    println!("子进程: 收到SIGUSR1信号");
                }))?;
                
                signal::signal(Signal::SIGTERM, SigHandler::Handler(|_| {
                    println!("子进程: 收到SIGTERM信号，准备退出");
                    std::process::exit(0);
                }))?;
            }
            
            println!("子进程: 等待信号...");
            
            // 子进程主循环
            loop {
                std::thread::sleep(std::time::Duration::from_millis(100));
            }
        }
    }
    
    Ok(())
}
```

## 🛡️ 信号安全编程

### 信号安全的数据结构
```rust
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};
use std::sync::Arc;

// 信号安全的计数器
struct SignalSafeCounter {
    count: AtomicUsize,
    max_count: usize,
}

impl SignalSafeCounter {
    fn new(max_count: usize) -> Self {
        SignalSafeCounter {
            count: AtomicUsize::new(0),
            max_count,
        }
    }
    
    fn increment(&self) -> bool {
        let current = self.count.fetch_add(1, Ordering::Relaxed);
        current < self.max_count
    }
    
    fn get(&self) -> usize {
        self.count.load(Ordering::Relaxed)
    }
    
    fn reset(&self) {
        self.count.store(0, Ordering::Relaxed);
    }
}

static SIGNAL_COUNTER: SignalSafeCounter = SignalSafeCounter {
    count: AtomicUsize::new(0),
    max_count: 5,
};

extern "C" fn safe_signal_handler(_signal: libc::c_int) {
    if SIGNAL_COUNTER.increment() {
        // 只使用信号安全的函数
        unsafe {
            let msg = b"Signal received\n";
            libc::write(libc::STDERR_FILENO, msg.as_ptr() as *const libc::c_void, msg.len());
        }
    } else {
        unsafe {
            let msg = b"Too many signals, exiting\n";
            libc::write(libc::STDERR_FILENO, msg.as_ptr() as *const libc::c_void, msg.len());
            libc::_exit(1);
        }
    }
}

fn signal_safe_programming() -> nix::Result<()> {
    unsafe {
        signal::signal(Signal::SIGUSR1, SigHandler::Handler(safe_signal_handler))?;
    }
    
    println!("信号安全编程演示");
    println!("发送信号: kill -USR1 {}", nix::unistd::getpid());
    println!("最多处理5个信号");
    
    loop {
        std::thread::sleep(std::time::Duration::from_secs(1));
        let count = SIGNAL_COUNTER.get();
        
        if count > 0 {
            println!("已处理 {} 个信号", count);
        }
        
        if count >= 5 {
            break;
        }
    }
    
    Ok(())
}
```

### 自恢复信号处理
```rust
use std::sync::atomic::{AtomicU32, Ordering};

static RESTART_COUNT: AtomicU32 = AtomicU32::new(0);
const MAX_RESTARTS: u32 = 3;

extern "C" fn restart_handler(_signal: libc::c_int) {
    let count = RESTART_COUNT.fetch_add(1, Ordering::Relaxed);
    
    if count < MAX_RESTARTS {
        unsafe {
            let msg = format!("Restarting... (attempt {})\n", count + 1);
            libc::write(
                libc::STDERR_FILENO,
                msg.as_ptr() as *const libc::c_void,
                msg.len()
            );
        }
        
        // 这里可以执行重启逻辑
        // 例如：重新初始化资源、重新连接数据库等
    } else {
        unsafe {
            let msg = b"Max restart attempts reached, exiting\n";
            libc::write(
                libc::STDERR_FILENO,
                msg.as_ptr() as *const libc::c_void,
                msg.len()
            );
            libc::_exit(1);
        }
    }
}

fn self_healing_service() -> nix::Result<()> {
    unsafe {
        signal::signal(Signal::SIGUSR2, SigHandler::Handler(restart_handler))?;
    }
    
    println!("自恢复服务启动");
    println!("发送重启信号: kill -USR2 {}", nix::unistd::getpid());
    println!("最多允许{}次重启", MAX_RESTARTS);
    
    let mut work_counter = 0;
    loop {
        // 模拟工作
        std::thread::sleep(std::time::Duration::from_secs(2));
        work_counter += 1;
        println!("工作循环 #{}", work_counter);
        
        let restart_count = RESTART_COUNT.load(Ordering::Relaxed);
        if restart_count >= MAX_RESTARTS {
            println!("达到最大重启次数，服务停止");
            break;
        }
    }
    
    Ok(())
}
```

## 📊 信号统计和监控

### 信号统计收集
```rust
use std::collections::HashMap;
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref SIGNAL_STATS: Mutex<HashMap<i32, u32>> = Mutex::new(HashMap::new());
}

extern "C" fn stats_signal_handler(signal: libc::c_int) {
    if let Ok(mut stats) = SIGNAL_STATS.lock() {
        *stats.entry(signal).or_insert(0) += 1;
    }
}

fn signal_monitoring() -> nix::Result<()> {
    // 注册多个信号的统计处理器
    unsafe {
        signal::signal(Signal::SIGUSR1, SigHandler::Handler(stats_signal_handler))?;
        signal::signal(Signal::SIGUSR2, SigHandler::Handler(stats_signal_handler))?;
        signal::signal(Signal::SIGINT, SigHandler::Handler(stats_signal_handler))?;
    }
    
    println!("信号监控启动");
    println!("发送信号进行测试:");
    println!("  kill -USR1 {}", nix::unistd::getpid());
    println!("  kill -USR2 {}", nix::unistd::getpid());
    println!("  kill -INT {} (Ctrl+C)", nix::unistd::getpid());
    
    let mut last_report = std::time::Instant::now();
    
    loop {
        std::thread::sleep(std::time::Duration::from_millis(500));
        
        // 每5秒报告一次统计
        if last_report.elapsed() >= std::time::Duration::from_secs(5) {
            if let Ok(stats) = SIGNAL_STATS.lock() {
                if !stats.is_empty() {
                    println!("\n=== 信号统计 ===");
                    for (signal, count) in stats.iter() {
                        let signal_name = match *signal {
                            libc::SIGUSR1 => "SIGUSR1",
                            libc::SIGUSR2 => "SIGUSR2", 
                            libc::SIGINT => "SIGINT",
                            _ => "UNKNOWN",
                        };
                        println!("{}: {} 次", signal_name, count);
                    }
                    println!("================\n");
                }
            }
            last_report = std::time::Instant::now();
        }
        
        // 检查是否收到SIGINT
        if let Ok(stats) = SIGNAL_STATS.lock() {
            if stats.get(&(libc::SIGINT)).unwrap_or(&0) > &0 {
                println!("收到SIGINT，退出监控");
                break;
            }
        }
    }
    
    Ok(())
}
```

## 📚 最佳实践

### 信号处理最佳实践
```rust
// 1. 使用信号安全的函数
const SIGNAL_SAFE_FUNCTIONS: &[&str] = &[
    "write", "read", "open", "close",
    "signal", "sigaction", "kill",
    "_exit", "abort"
];

// 2. 避免在信号处理器中使用的函数
const UNSAFE_FUNCTIONS: &[&str] = &[
    "malloc", "free", "printf", "fprintf",
    "mutex_lock", "pthread_create"
];

// 3. 推荐的信号处理模式
fn recommended_signal_pattern() -> nix::Result<()> {
    // 使用self-pipe技巧
    let (read_fd, write_fd) = nix::unistd::pipe()?;
    
    // 信号处理器只写入一个字节到管道
    extern "C" fn simple_handler(_: libc::c_int) {
        unsafe {
            libc::write(WRITE_FD, b"1".as_ptr() as *const libc::c_void, 1);
        }
    }
    
    static mut WRITE_FD: i32 = -1;
    unsafe {
        WRITE_FD = write_fd;
        signal::signal(Signal::SIGUSR1, SigHandler::Handler(simple_handler))?;
    }
    
    println!("推荐的信号处理模式演示");
    println!("发送信号: kill -USR1 {}", nix::unistd::getpid());
    
    // 主循环使用select/poll监听管道
    let mut buffer = [0u8; 1];
    loop {
        match nix::unistd::read(read_fd, &mut buffer) {
            Ok(_) => {
                println!("通过管道收到信号通知");
                // 在这里安全地处理信号
                break;
            }
            Err(nix::errno::Errno::EINTR) => {
                // 被信号中断，继续
                continue;
            }
            Err(e) => {
                eprintln!("读取管道失败: {}", e);
                break;
            }
        }
    }
    
    nix::unistd::close(read_fd)?;
    nix::unistd::close(write_fd)?;
    
    Ok(())
}
```

---

*信号处理是Unix系统编程的重要技能，正确使用信号能让您的程序更加健壮和用户友好！📡*
