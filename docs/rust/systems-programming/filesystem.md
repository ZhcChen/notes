# 文件系统操作

## 🎯 文件系统编程概述

文件系统操作是系统编程的重要组成部分。Rust提供了从高级抽象到底层系统调用的完整文件操作能力。

## 📁 基础文件操作

### 标准库文件操作
```rust
use std::fs::{File, OpenOptions, metadata, remove_file, rename};
use std::io::{Read, Write, Seek, SeekFrom};
use std::path::Path;

fn basic_file_operations() -> std::io::Result<()> {
    // 创建文件
    let mut file = File::create("example.txt")?;
    file.write_all(b"Hello, File System!")?;
    
    // 打开文件进行读取
    let mut file = File::open("example.txt")?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    println!("File contents: {}", contents);
    
    // 文件元数据
    let metadata = metadata("example.txt")?;
    println!("File size: {} bytes", metadata.len());
    println!("Is file: {}", metadata.is_file());
    println!("Is directory: {}", metadata.is_dir());
    
    // 重命名文件
    rename("example.txt", "renamed_example.txt")?;
    
    // 删除文件
    remove_file("renamed_example.txt")?;
    
    Ok(())
}
```

### 高级文件操作选项
```rust
use std::fs::OpenOptions;
use std::io::{Write, Seek, SeekFrom};

fn advanced_file_operations() -> std::io::Result<()> {
    // 使用OpenOptions进行精确控制
    let mut file = OpenOptions::new()
        .create(true)           // 如果不存在则创建
        .write(true)            // 写入权限
        .append(true)           // 追加模式
        .truncate(false)        // 不截断文件
        .open("advanced.txt")?;
    
    // 追加内容
    writeln!(file, "First line")?;
    writeln!(file, "Second line")?;
    
    // 重新打开文件进行随机访问
    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .open("advanced.txt")?;
    
    // 定位到文件开头
    file.seek(SeekFrom::Start(0))?;
    
    // 在开头插入内容（需要读取现有内容）
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    
    file.seek(SeekFrom::Start(0))?;
    file.set_len(0)?; // 清空文件
    write!(file, "Header\n{}", contents)?;
    
    Ok(())
}
```

## 📂 目录操作

### 目录遍历和管理
```rust
use std::fs::{self, DirEntry, create_dir_all, remove_dir_all};
use std::path::Path;

fn directory_operations() -> std::io::Result<()> {
    // 创建目录结构
    create_dir_all("test_dir/subdir1/subdir2")?;
    
    // 在目录中创建文件
    std::fs::write("test_dir/file1.txt", "Content 1")?;
    std::fs::write("test_dir/subdir1/file2.txt", "Content 2")?;
    
    // 列出目录内容
    println!("Directory contents:");
    for entry in fs::read_dir("test_dir")? {
        let entry = entry?;
        let path = entry.path();
        let metadata = entry.metadata()?;
        
        if metadata.is_dir() {
            println!("  [DIR]  {}", path.display());
        } else {
            println!("  [FILE] {} ({} bytes)", path.display(), metadata.len());
        }
    }
    
    // 递归遍历目录
    visit_dirs(Path::new("test_dir"), &|dir| {
        println!("Visiting: {}", dir.display());
    })?;
    
    // 清理
    remove_dir_all("test_dir")?;
    
    Ok(())
}

fn visit_dirs(dir: &Path, cb: &dyn Fn(&Path)) -> std::io::Result<()> {
    if dir.is_dir() {
        cb(dir);
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                visit_dirs(&path, cb)?;
            } else {
                cb(&path);
            }
        }
    }
    Ok(())
}
```

### 使用walkdir库进行高效遍历
```rust
// 在Cargo.toml中添加: walkdir = "2"
use walkdir::WalkDir;

fn efficient_directory_traversal() {
    for entry in WalkDir::new(".")
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok()) 
    {
        let f_name = entry.file_name().to_string_lossy();
        let sec = entry.metadata().unwrap().len();
        
        if entry.file_type().is_file() {
            println!("{} - {} bytes", f_name, sec);
        } else if entry.file_type().is_dir() {
            println!("[DIR] {}", f_name);
        }
    }
}
```

## 🔗 符号链接和硬链接

### 链接操作
```rust
use std::os::unix::fs::{symlink, MetadataExt};
use std::fs::{hard_link, read_link};

#[cfg(unix)]
fn link_operations() -> std::io::Result<()> {
    // 创建原始文件
    std::fs::write("original.txt", "Original content")?;
    
    // 创建硬链接
    hard_link("original.txt", "hardlink.txt")?;
    
    // 创建符号链接
    symlink("original.txt", "symlink.txt")?;
    
    // 检查链接
    let original_meta = std::fs::metadata("original.txt")?;
    let hardlink_meta = std::fs::metadata("hardlink.txt")?;
    let symlink_meta = std::fs::symlink_metadata("symlink.txt")?;
    
    println!("Original inode: {}", original_meta.ino());
    println!("Hardlink inode: {}", hardlink_meta.ino());
    println!("Symlink is symlink: {}", symlink_meta.file_type().is_symlink());
    
    // 读取符号链接目标
    let target = read_link("symlink.txt")?;
    println!("Symlink target: {}", target.display());
    
    // 清理
    std::fs::remove_file("original.txt")?;
    std::fs::remove_file("hardlink.txt")?;
    std::fs::remove_file("symlink.txt")?;
    
    Ok(())
}
```

## 🔐 文件权限和属性

### Unix文件权限
```rust
use std::os::unix::fs::PermissionsExt;
use std::fs::{self, Permissions};

#[cfg(unix)]
fn file_permissions() -> std::io::Result<()> {
    // 创建文件
    std::fs::write("perm_test.txt", "Permission test")?;
    
    // 获取当前权限
    let metadata = fs::metadata("perm_test.txt")?;
    let permissions = metadata.permissions();
    let mode = permissions.mode();
    
    println!("Current permissions: {:o}", mode & 0o777);
    
    // 设置新权限 (rw-r--r--)
    let new_permissions = Permissions::from_mode(0o644);
    fs::set_permissions("perm_test.txt", new_permissions)?;
    
    // 验证权限更改
    let metadata = fs::metadata("perm_test.txt")?;
    let mode = metadata.permissions().mode();
    println!("New permissions: {:o}", mode & 0o777);
    
    // 清理
    fs::remove_file("perm_test.txt")?;
    
    Ok(())
}

// 权限检查辅助函数
#[cfg(unix)]
fn check_permissions(path: &str) -> std::io::Result<()> {
    let metadata = fs::metadata(path)?;
    let permissions = metadata.permissions();
    let mode = permissions.mode();
    
    println!("File: {}", path);
    println!("  Owner: {}{}{}",
        if mode & 0o400 != 0 { "r" } else { "-" },
        if mode & 0o200 != 0 { "w" } else { "-" },
        if mode & 0o100 != 0 { "x" } else { "-" }
    );
    println!("  Group: {}{}{}",
        if mode & 0o040 != 0 { "r" } else { "-" },
        if mode & 0o020 != 0 { "w" } else { "-" },
        if mode & 0o010 != 0 { "x" } else { "-" }
    );
    println!("  Other: {}{}{}",
        if mode & 0o004 != 0 { "r" } else { "-" },
        if mode & 0o002 != 0 { "w" } else { "-" },
        if mode & 0o001 != 0 { "x" } else { "-" }
    );
    
    Ok(())
}
```

## 🔍 文件监控

### 使用notify库监控文件变化
```rust
// 在Cargo.toml中添加: notify = "5.0"
use notify::{Watcher, RecursiveMode, Result, Event, EventKind};
use std::sync::mpsc::channel;
use std::time::Duration;

fn file_monitoring() -> Result<()> {
    let (tx, rx) = channel();
    
    // 创建文件监控器
    let mut watcher = notify::recommended_watcher(move |res: Result<Event>| {
        match res {
            Ok(event) => {
                if let Err(e) = tx.send(event) {
                    println!("Failed to send event: {}", e);
                }
            }
            Err(e) => println!("Watch error: {:?}", e),
        }
    })?;
    
    // 监控当前目录
    watcher.watch(std::path::Path::new("."), RecursiveMode::Recursive)?;
    
    println!("Monitoring file changes. Press Ctrl+C to stop.");
    
    // 处理文件变化事件
    loop {
        match rx.recv_timeout(Duration::from_secs(1)) {
            Ok(event) => {
                match event.kind {
                    EventKind::Create(_) => {
                        println!("File created: {:?}", event.paths);
                    }
                    EventKind::Modify(_) => {
                        println!("File modified: {:?}", event.paths);
                    }
                    EventKind::Remove(_) => {
                        println!("File removed: {:?}", event.paths);
                    }
                    _ => {
                        println!("Other event: {:?}", event);
                    }
                }
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                // 超时，继续监控
                continue;
            }
            Err(e) => {
                println!("Receive error: {}", e);
                break;
            }
        }
    }
    
    Ok(())
}
```

## 💾 内存映射文件

### 大文件处理
```rust
use memmap2::{Mmap, MmapOptions};
use std::fs::File;

fn memory_mapped_file_processing() -> Result<(), Box<dyn std::error::Error>> {
    // 创建一个大文件用于测试
    let mut file = File::create("large_file.dat")?;
    file.set_len(1024 * 1024)?; // 1MB文件
    
    // 重新打开文件进行内存映射
    let file = File::open("large_file.dat")?;
    let mmap = unsafe { Mmap::map(&file)? };
    
    // 直接访问映射的内存
    println!("File size: {} bytes", mmap.len());
    
    // 搜索特定字节模式
    let pattern = b"test";
    if let Some(pos) = find_pattern(&mmap, pattern) {
        println!("Pattern found at position: {}", pos);
    } else {
        println!("Pattern not found");
    }
    
    // 清理
    drop(mmap);
    std::fs::remove_file("large_file.dat")?;
    
    Ok(())
}

fn find_pattern(data: &[u8], pattern: &[u8]) -> Option<usize> {
    data.windows(pattern.len())
        .position(|window| window == pattern)
}
```

## 🚀 异步文件操作

### 使用tokio进行异步文件I/O
```rust
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncReadExt, AsyncWriteExt, AsyncSeekExt};

async fn async_file_operations() -> tokio::io::Result<()> {
    // 异步创建和写入文件
    let mut file = File::create("async_test.txt").await?;
    file.write_all(b"Async file content").await?;
    file.flush().await?;
    
    // 异步读取文件
    let mut file = File::open("async_test.txt").await?;
    let mut contents = Vec::new();
    file.read_to_end(&mut contents).await?;
    
    println!("Async read: {}", String::from_utf8_lossy(&contents));
    
    // 异步追加内容
    let mut file = OpenOptions::new()
        .append(true)
        .open("async_test.txt")
        .await?;
    
    file.write_all(b"\nAppended line").await?;
    
    // 清理
    tokio::fs::remove_file("async_test.txt").await?;
    
    Ok(())
}

// 并发文件处理
async fn concurrent_file_processing() -> tokio::io::Result<()> {
    let files = vec!["file1.txt", "file2.txt", "file3.txt"];
    
    // 并发创建多个文件
    let create_tasks: Vec<_> = files.iter().enumerate().map(|(i, &filename)| {
        tokio::spawn(async move {
            let content = format!("Content for file {}", i + 1);
            tokio::fs::write(filename, content).await
        })
    }).collect();
    
    // 等待所有创建任务完成
    for task in create_tasks {
        task.await??;
    }
    
    // 并发读取所有文件
    let read_tasks: Vec<_> = files.iter().map(|&filename| {
        tokio::spawn(async move {
            tokio::fs::read_to_string(filename).await
        })
    }).collect();
    
    // 收集结果
    for (i, task) in read_tasks.into_iter().enumerate() {
        let content = task.await??;
        println!("File {}: {}", i + 1, content);
    }
    
    // 清理
    for &filename in &files {
        tokio::fs::remove_file(filename).await?;
    }
    
    Ok(())
}
```

## 🛠️ 文件系统工具

### 文件完整性检查
```rust
use std::fs::File;
use std::io::{Read, BufReader};
use sha2::{Sha256, Digest};

fn calculate_file_hash(path: &str) -> std::io::Result<String> {
    let file = File::open(path)?;
    let mut reader = BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = [0; 8192];
    
    loop {
        let bytes_read = reader.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }
    
    Ok(format!("{:x}", hasher.finalize()))
}

fn verify_file_integrity() -> std::io::Result<()> {
    // 创建测试文件
    std::fs::write("integrity_test.txt", "Test content for integrity check")?;
    
    // 计算原始哈希
    let original_hash = calculate_file_hash("integrity_test.txt")?;
    println!("Original hash: {}", original_hash);
    
    // 模拟文件修改
    std::fs::write("integrity_test.txt", "Modified content")?;
    
    // 重新计算哈希
    let new_hash = calculate_file_hash("integrity_test.txt")?;
    println!("New hash: {}", new_hash);
    
    if original_hash == new_hash {
        println!("File integrity verified");
    } else {
        println!("File has been modified!");
    }
    
    // 清理
    std::fs::remove_file("integrity_test.txt")?;
    
    Ok(())
}
```

## 📊 性能优化

### 缓冲I/O优化
```rust
use std::fs::File;
use std::io::{BufReader, BufWriter, Read, Write};
use std::time::Instant;

fn io_performance_comparison() -> std::io::Result<()> {
    let data = vec![0u8; 1024 * 1024]; // 1MB数据
    
    // 无缓冲写入
    let start = Instant::now();
    {
        let mut file = File::create("unbuffered.dat")?;
        for chunk in data.chunks(1024) {
            file.write_all(chunk)?;
        }
    }
    let unbuffered_time = start.elapsed();
    
    // 缓冲写入
    let start = Instant::now();
    {
        let file = File::create("buffered.dat")?;
        let mut writer = BufWriter::new(file);
        for chunk in data.chunks(1024) {
            writer.write_all(chunk)?;
        }
    } // BufWriter在drop时自动flush
    let buffered_time = start.elapsed();
    
    println!("Unbuffered write: {:?}", unbuffered_time);
    println!("Buffered write: {:?}", buffered_time);
    println!("Speedup: {:.2}x", 
        unbuffered_time.as_secs_f64() / buffered_time.as_secs_f64());
    
    // 清理
    std::fs::remove_file("unbuffered.dat")?;
    std::fs::remove_file("buffered.dat")?;
    
    Ok(())
}
```

---

*掌握文件系统操作是系统编程的基础技能，让我们继续探索更深层的系统编程主题！📁*
