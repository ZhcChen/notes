# 系统调用与接口

## 🎯 什么是系统调用

系统调用（System Call）是用户程序请求操作系统内核服务的接口。它是用户空间和内核空间之间的桥梁，提供了访问硬件资源和系统功能的安全方式。

## 🔧 Rust中的系统调用

### 使用标准库
```rust
use std::fs::File;
use std::io::{Read, Write};
use std::process::Command;

fn basic_system_operations() -> std::io::Result<()> {
    // 文件操作 - 底层使用 open/read/write 系统调用
    let mut file = File::create("example.txt")?;
    file.write_all(b"Hello, System Programming!")?;
    
    // 进程创建 - 底层使用 fork/exec 系统调用
    let output = Command::new("ls")
        .arg("-la")
        .output()?;
    
    println!("Command output: {}", String::from_utf8_lossy(&output.stdout));
    Ok(())
}
```

### 直接使用libc
```rust
use libc::{c_int, c_char, size_t};
use std::ffi::CString;
use std::ptr;

extern "C" {
    fn open(pathname: *const c_char, flags: c_int) -> c_int;
    fn read(fd: c_int, buf: *mut u8, count: size_t) -> isize;
    fn write(fd: c_int, buf: *const u8, count: size_t) -> isize;
    fn close(fd: c_int) -> c_int;
}

fn direct_system_calls() -> Result<(), Box<dyn std::error::Error>> {
    unsafe {
        // 打开文件
        let filename = CString::new("example.txt")?;
        let fd = open(filename.as_ptr(), libc::O_RDWR | libc::O_CREAT);
        
        if fd == -1 {
            return Err("Failed to open file".into());
        }
        
        // 写入数据
        let data = b"Direct system call!";
        let bytes_written = write(fd, data.as_ptr(), data.len());
        
        if bytes_written == -1 {
            close(fd);
            return Err("Failed to write to file".into());
        }
        
        // 关闭文件
        close(fd);
        println!("Successfully wrote {} bytes", bytes_written);
    }
    
    Ok(())
}
```

## 🐧 Unix/Linux 系统调用

### 文件和I/O操作
```rust
use nix::fcntl::{open, OFlag};
use nix::sys::stat::Mode;
use nix::unistd::{read, write, close};
use std::os::unix::io::RawFd;

fn unix_file_operations() -> nix::Result<()> {
    // 使用nix库进行安全的系统调用
    let fd: RawFd = open(
        "test.txt",
        OFlag::O_CREAT | OFlag::O_WRONLY | OFlag::O_TRUNC,
        Mode::S_IRUSR | Mode::S_IWUSR
    )?;
    
    let data = b"Hello from Unix system calls!";
    write(fd, data)?;
    
    close(fd)?;
    println!("File operation completed successfully");
    Ok(())
}
```

### 进程管理
```rust
use nix::unistd::{fork, getpid, getppid, ForkResult};
use nix::sys::wait::{waitpid, WaitStatus};

fn process_management() -> nix::Result<()> {
    println!("Parent process PID: {}", getpid());
    
    match unsafe { fork() }? {
        ForkResult::Parent { child } => {
            println!("Parent: Created child with PID {}", child);
            
            // 等待子进程结束
            match waitpid(child, None)? {
                WaitStatus::Exited(pid, status) => {
                    println!("Child {} exited with status {}", pid, status);
                }
                _ => println!("Child process ended unexpectedly"),
            }
        }
        ForkResult::Child => {
            println!("Child process PID: {}, Parent PID: {}", getpid(), getppid());
            std::process::exit(0);
        }
    }
    
    Ok(())
}
```

### 信号处理
```rust
use nix::sys::signal::{self, Signal, SigHandler};
use nix::unistd::getpid;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

static RECEIVED_SIGINT: AtomicBool = AtomicBool::new(false);

extern "C" fn handle_sigint(_: libc::c_int) {
    RECEIVED_SIGINT.store(true, Ordering::Relaxed);
}

fn signal_handling() -> nix::Result<()> {
    // 注册信号处理器
    unsafe {
        signal::signal(Signal::SIGINT, SigHandler::Handler(handle_sigint))?;
    }
    
    println!("Process PID: {}. Press Ctrl+C to test signal handling.", getpid());
    
    // 主循环
    loop {
        if RECEIVED_SIGINT.load(Ordering::Relaxed) {
            println!("Received SIGINT, exiting gracefully...");
            break;
        }
        
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    
    Ok(())
}
```

## 🪟 Windows 系统调用

### 使用winapi库
```rust
#[cfg(windows)]
use winapi::um::fileapi::{CreateFileW, WriteFile, CloseHandle};
#[cfg(windows)]
use winapi::um::winnt::{GENERIC_WRITE, FILE_ATTRIBUTE_NORMAL};
#[cfg(windows)]
use winapi::um::handleapi::INVALID_HANDLE_VALUE;
#[cfg(windows)]
use std::ffi::OsStr;
#[cfg(windows)]
use std::os::windows::ffi::OsStrExt;

#[cfg(windows)]
fn windows_file_operations() -> Result<(), Box<dyn std::error::Error>> {
    unsafe {
        // 将文件名转换为UTF-16
        let filename: Vec<u16> = OsStr::new("test.txt")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        
        // 创建文件
        let handle = CreateFileW(
            filename.as_ptr(),
            GENERIC_WRITE,
            0,
            std::ptr::null_mut(),
            winapi::um::fileapi::CREATE_ALWAYS,
            FILE_ATTRIBUTE_NORMAL,
            std::ptr::null_mut(),
        );
        
        if handle == INVALID_HANDLE_VALUE {
            return Err("Failed to create file".into());
        }
        
        // 写入数据
        let data = b"Hello from Windows API!";
        let mut bytes_written = 0;
        let success = WriteFile(
            handle,
            data.as_ptr() as *const _,
            data.len() as u32,
            &mut bytes_written,
            std::ptr::null_mut(),
        );
        
        CloseHandle(handle);
        
        if success != 0 {
            println!("Successfully wrote {} bytes", bytes_written);
        } else {
            return Err("Failed to write to file".into());
        }
    }
    
    Ok(())
}
```

## 🔒 安全的系统调用封装

### 创建安全的包装器
```rust
use std::os::unix::io::{AsRawFd, RawFd};
use std::fs::File;

pub struct SafeFile {
    file: File,
}

impl SafeFile {
    pub fn create(path: &str) -> std::io::Result<Self> {
        let file = File::create(path)?;
        Ok(SafeFile { file })
    }
    
    pub fn write_all(&mut self, data: &[u8]) -> std::io::Result<()> {
        use std::io::Write;
        self.file.write_all(data)
    }
    
    pub fn sync(&self) -> std::io::Result<()> {
        // 强制将数据写入磁盘
        unsafe {
            let fd = self.file.as_raw_fd();
            if libc::fsync(fd) == -1 {
                return Err(std::io::Error::last_os_error());
            }
        }
        Ok(())
    }
}

// 使用示例
fn safe_file_operations() -> std::io::Result<()> {
    let mut file = SafeFile::create("safe_example.txt")?;
    file.write_all(b"Safe system programming with Rust!")?;
    file.sync()?;  // 确保数据已写入磁盘
    
    println!("Safe file operation completed");
    Ok(())
}
```

## 🚀 异步系统调用

### 使用tokio进行异步I/O
```rust
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

async fn async_file_operations() -> tokio::io::Result<()> {
    // 异步创建文件
    let mut file = File::create("async_example.txt").await?;
    
    // 异步写入
    file.write_all(b"Async system programming!").await?;
    file.flush().await?;
    
    // 异步读取
    let mut file = File::open("async_example.txt").await?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).await?;
    
    println!("File contents: {}", contents);
    Ok(())
}

// 在main函数中运行
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    async_file_operations().await?;
    Ok(())
}
```

## 📊 性能考虑

### 系统调用的开销
```rust
use std::time::Instant;

fn measure_syscall_overhead() {
    let iterations = 1_000_000;
    
    // 测量getpid系统调用的开销
    let start = Instant::now();
    for _ in 0..iterations {
        unsafe {
            libc::getpid();
        }
    }
    let duration = start.elapsed();
    
    println!("Average syscall time: {:?}", duration / iterations);
}

// 批量操作减少系统调用次数
fn batch_operations() -> std::io::Result<()> {
    use std::io::Write;
    
    let mut file = std::fs::File::create("batch_example.txt")?;
    
    // 不好的做法：多次系统调用
    // for i in 0..1000 {
    //     file.write_all(format!("Line {}\n", i).as_bytes())?;
    // }
    
    // 好的做法：批量写入
    let mut buffer = String::new();
    for i in 0..1000 {
        buffer.push_str(&format!("Line {}\n", i));
    }
    file.write_all(buffer.as_bytes())?;
    
    Ok(())
}
```

## 🛠️ 调试和监控

### 使用strace监控系统调用
```bash
# 监控Rust程序的系统调用
strace -c ./your_rust_program

# 详细跟踪特定系统调用
strace -e trace=open,read,write ./your_rust_program
```

### 程序内监控
```rust
use std::time::Instant;

struct SyscallMonitor {
    call_count: std::sync::atomic::AtomicUsize,
    total_time: std::sync::Mutex<std::time::Duration>,
}

impl SyscallMonitor {
    fn new() -> Self {
        SyscallMonitor {
            call_count: std::sync::atomic::AtomicUsize::new(0),
            total_time: std::sync::Mutex::new(std::time::Duration::new(0, 0)),
        }
    }
    
    fn time_syscall<F, R>(&self, f: F) -> R
    where
        F: FnOnce() -> R,
    {
        let start = Instant::now();
        let result = f();
        let duration = start.elapsed();
        
        self.call_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        *self.total_time.lock().unwrap() += duration;
        
        result
    }
    
    fn report(&self) {
        let count = self.call_count.load(std::sync::atomic::Ordering::Relaxed);
        let total = *self.total_time.lock().unwrap();
        
        println!("System calls: {}, Total time: {:?}", count, total);
        if count > 0 {
            println!("Average time per call: {:?}", total / count as u32);
        }
    }
}
```

## 📚 最佳实践

1. **优先使用标准库**：除非有特殊需求，否则使用std库的高级接口
2. **错误处理**：始终检查系统调用的返回值和错误码
3. **资源管理**：确保正确关闭文件描述符和释放资源
4. **性能优化**：减少系统调用次数，使用批量操作
5. **安全编程**：使用安全的封装库如nix，避免直接使用unsafe代码

---

*掌握系统调用是系统编程的基础，让我们继续深入学习！🔧*
