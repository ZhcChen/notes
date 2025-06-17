# 网络编程

## 🎯 网络编程概述

网络编程是系统编程的重要组成部分，涉及套接字编程、协议实现、高性能服务器开发等。Rust提供了从底层套接字到高级异步网络库的完整解决方案。

## 🔌 套接字编程基础

### TCP套接字
```rust
use std::net::{TcpListener, TcpStream};
use std::io::{Read, Write};
use std::thread;

fn tcp_server_example() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8080")?;
    println!("Server listening on 127.0.0.1:8080");
    
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                thread::spawn(move || {
                    handle_client(stream).unwrap_or_else(|error| {
                        eprintln!("Error handling client: {}", error);
                    });
                });
            }
            Err(e) => {
                eprintln!("Connection failed: {}", e);
            }
        }
    }
    
    Ok(())
}

fn handle_client(mut stream: TcpStream) -> std::io::Result<()> {
    let mut buffer = [0; 1024];
    
    loop {
        let bytes_read = stream.read(&mut buffer)?;
        if bytes_read == 0 {
            break; // 客户端断开连接
        }
        
        // 回显数据
        stream.write_all(&buffer[..bytes_read])?;
    }
    
    Ok(())
}

fn tcp_client_example() -> std::io::Result<()> {
    let mut stream = TcpStream::connect("127.0.0.1:8080")?;
    
    // 发送数据
    stream.write_all(b"Hello, Server!")?;
    
    // 读取响应
    let mut buffer = [0; 1024];
    let bytes_read = stream.read(&mut buffer)?;
    
    println!("Server response: {}", 
        String::from_utf8_lossy(&buffer[..bytes_read]));
    
    Ok(())
}
```

### UDP套接字
```rust
use std::net::UdpSocket;

fn udp_server_example() -> std::io::Result<()> {
    let socket = UdpSocket::bind("127.0.0.1:8081")?;
    println!("UDP server listening on 127.0.0.1:8081");
    
    let mut buffer = [0; 1024];
    
    loop {
        let (bytes_received, src_addr) = socket.recv_from(&mut buffer)?;
        println!("Received {} bytes from {}", bytes_received, src_addr);
        
        // 回显数据
        socket.send_to(&buffer[..bytes_received], src_addr)?;
    }
}

fn udp_client_example() -> std::io::Result<()> {
    let socket = UdpSocket::bind("0.0.0.0:0")?; // 绑定到任意端口
    
    // 发送数据
    socket.send_to(b"Hello, UDP Server!", "127.0.0.1:8081")?;
    
    // 接收响应
    let mut buffer = [0; 1024];
    let (bytes_received, _) = socket.recv_from(&mut buffer)?;
    
    println!("UDP response: {}", 
        String::from_utf8_lossy(&buffer[..bytes_received]));
    
    Ok(())
}
```

## 🚀 异步网络编程

### 使用tokio的异步TCP服务器
```rust
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn async_tcp_server() -> tokio::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8082").await?;
    println!("Async server listening on 127.0.0.1:8082");
    
    loop {
        let (socket, addr) = listener.accept().await?;
        println!("New connection from: {}", addr);
        
        tokio::spawn(async move {
            if let Err(e) = handle_async_client(socket).await {
                eprintln!("Error handling client {}: {}", addr, e);
            }
        });
    }
}

async fn handle_async_client(mut socket: TcpStream) -> tokio::io::Result<()> {
    let mut buffer = [0; 1024];
    
    loop {
        let bytes_read = socket.read(&mut buffer).await?;
        if bytes_read == 0 {
            break;
        }
        
        // 异步写入响应
        socket.write_all(&buffer[..bytes_read]).await?;
    }
    
    Ok(())
}

async fn async_tcp_client() -> tokio::io::Result<()> {
    let mut stream = TcpStream::connect("127.0.0.1:8082").await?;
    
    // 异步发送数据
    stream.write_all(b"Hello, Async Server!").await?;
    
    // 异步读取响应
    let mut buffer = [0; 1024];
    let bytes_read = stream.read(&mut buffer).await?;
    
    println!("Async response: {}", 
        String::from_utf8_lossy(&buffer[..bytes_read]));
    
    Ok(())
}
```

### HTTP服务器实现
```rust
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use std::collections::HashMap;

#[tokio::main]
async fn http_server() -> tokio::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:8083").await?;
    println!("HTTP server listening on http://127.0.0.1:8083");
    
    loop {
        let (socket, _) = listener.accept().await?;
        tokio::spawn(async move {
            if let Err(e) = handle_http_request(socket).await {
                eprintln!("Error handling HTTP request: {}", e);
            }
        });
    }
}

async fn handle_http_request(mut socket: TcpStream) -> tokio::io::Result<()> {
    let mut reader = BufReader::new(&mut socket);
    let mut request_line = String::new();
    reader.read_line(&mut request_line).await?;
    
    // 解析请求行
    let parts: Vec<&str> = request_line.trim().split_whitespace().collect();
    if parts.len() < 3 {
        return Ok(());
    }
    
    let method = parts[0];
    let path = parts[1];
    
    // 读取请求头
    let mut headers = HashMap::new();
    loop {
        let mut line = String::new();
        reader.read_line(&mut line).await?;
        let line = line.trim();
        
        if line.is_empty() {
            break; // 空行表示头部结束
        }
        
        if let Some(colon_pos) = line.find(':') {
            let key = line[..colon_pos].trim().to_lowercase();
            let value = line[colon_pos + 1..].trim().to_string();
            headers.insert(key, value);
        }
    }
    
    // 生成响应
    let response = match (method, path) {
        ("GET", "/") => {
            "HTTP/1.1 200 OK\r\n\
             Content-Type: text/html\r\n\
             Content-Length: 27\r\n\
             \r\n\
             <h1>Hello, Rust HTTP!</h1>"
        }
        ("GET", "/api/status") => {
            "HTTP/1.1 200 OK\r\n\
             Content-Type: application/json\r\n\
             Content-Length: 25\r\n\
             \r\n\
             {\"status\": \"running\"}"
        }
        _ => {
            "HTTP/1.1 404 Not Found\r\n\
             Content-Type: text/plain\r\n\
             Content-Length: 9\r\n\
             \r\n\
             Not Found"
        }
    };
    
    socket.write_all(response.as_bytes()).await?;
    Ok(())
}
```

## 🌐 底层网络操作

### 原始套接字编程
```rust
use std::net::{IpAddr, Ipv4Addr};
use std::os::unix::io::AsRawFd;

#[cfg(unix)]
fn raw_socket_example() -> std::io::Result<()> {
    use libc::{socket, AF_INET, SOCK_RAW, IPPROTO_ICMP};
    
    unsafe {
        let sock_fd = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
        if sock_fd == -1 {
            return Err(std::io::Error::last_os_error());
        }
        
        println!("Raw socket created: {}", sock_fd);
        
        // 注意：原始套接字通常需要root权限
        libc::close(sock_fd);
    }
    
    Ok(())
}

// 网络接口信息
#[cfg(unix)]
fn get_network_interfaces() -> std::io::Result<()> {
    use std::ffi::CStr;
    use libc::{getifaddrs, freeifaddrs, ifaddrs};
    
    unsafe {
        let mut ifaddrs_ptr: *mut ifaddrs = std::ptr::null_mut();
        
        if getifaddrs(&mut ifaddrs_ptr) == -1 {
            return Err(std::io::Error::last_os_error());
        }
        
        let mut current = ifaddrs_ptr;
        while !current.is_null() {
            let ifaddr = &*current;
            
            if !ifaddr.ifa_name.is_null() {
                let name = CStr::from_ptr(ifaddr.ifa_name);
                println!("Interface: {:?}", name);
            }
            
            current = ifaddr.ifa_next;
        }
        
        freeifaddrs(ifaddrs_ptr);
    }
    
    Ok(())
}
```

### 套接字选项设置
```rust
use std::net::{TcpListener, TcpStream};
use std::os::unix::io::AsRawFd;

fn socket_options_example() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let fd = listener.as_raw_fd();
    
    unsafe {
        // 设置SO_REUSEADDR
        let optval: libc::c_int = 1;
        let result = libc::setsockopt(
            fd,
            libc::SOL_SOCKET,
            libc::SO_REUSEADDR,
            &optval as *const _ as *const libc::c_void,
            std::mem::size_of::<libc::c_int>() as libc::socklen_t,
        );
        
        if result == -1 {
            return Err(std::io::Error::last_os_error());
        }
        
        // 设置TCP_NODELAY
        let result = libc::setsockopt(
            fd,
            libc::IPPROTO_TCP,
            libc::TCP_NODELAY,
            &optval as *const _ as *const libc::c_void,
            std::mem::size_of::<libc::c_int>() as libc::socklen_t,
        );
        
        if result == -1 {
            return Err(std::io::Error::last_os_error());
        }
    }
    
    println!("Socket options set successfully");
    Ok(())
}
```

## 📡 网络协议实现

### 简单的ping实现
```rust
use std::net::{IpAddr, Ipv4Addr};
use std::time::{Duration, Instant};

// ICMP包结构
#[repr(C, packed)]
struct IcmpHeader {
    icmp_type: u8,
    code: u8,
    checksum: u16,
    identifier: u16,
    sequence: u16,
}

impl IcmpHeader {
    fn new(identifier: u16, sequence: u16) -> Self {
        IcmpHeader {
            icmp_type: 8, // Echo Request
            code: 0,
            checksum: 0,
            identifier,
            sequence,
        }
    }
    
    fn calculate_checksum(&mut self, data: &[u8]) {
        self.checksum = 0;
        
        let mut sum: u32 = 0;
        
        // 计算头部校验和
        let header_bytes = unsafe {
            std::slice::from_raw_parts(
                self as *const _ as *const u8,
                std::mem::size_of::<IcmpHeader>()
            )
        };
        
        // 处理头部
        for chunk in header_bytes.chunks(2) {
            if chunk.len() == 2 {
                sum += u16::from_be_bytes([chunk[0], chunk[1]]) as u32;
            } else {
                sum += (chunk[0] as u32) << 8;
            }
        }
        
        // 处理数据
        for chunk in data.chunks(2) {
            if chunk.len() == 2 {
                sum += u16::from_be_bytes([chunk[0], chunk[1]]) as u32;
            } else {
                sum += (chunk[0] as u32) << 8;
            }
        }
        
        // 折叠进位
        while (sum >> 16) != 0 {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
        
        self.checksum = !(sum as u16);
    }
}

#[cfg(unix)]
fn simple_ping(target: Ipv4Addr) -> std::io::Result<Duration> {
    use libc::{socket, sendto, recvfrom, AF_INET, SOCK_RAW, IPPROTO_ICMP};
    use std::mem;
    
    unsafe {
        let sock_fd = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
        if sock_fd == -1 {
            return Err(std::io::Error::last_os_error());
        }
        
        let mut icmp_header = IcmpHeader::new(std::process::id() as u16, 1);
        let data = b"Hello, ping!";
        icmp_header.calculate_checksum(data);
        
        // 构造目标地址
        let mut target_addr: libc::sockaddr_in = mem::zeroed();
        target_addr.sin_family = AF_INET as u16;
        target_addr.sin_addr.s_addr = u32::from(target).to_be();
        
        // 发送ICMP包
        let start_time = Instant::now();
        
        let header_bytes = std::slice::from_raw_parts(
            &icmp_header as *const _ as *const u8,
            mem::size_of::<IcmpHeader>()
        );
        
        let mut packet = Vec::new();
        packet.extend_from_slice(header_bytes);
        packet.extend_from_slice(data);
        
        let result = sendto(
            sock_fd,
            packet.as_ptr() as *const libc::c_void,
            packet.len(),
            0,
            &target_addr as *const _ as *const libc::sockaddr,
            mem::size_of::<libc::sockaddr_in>() as libc::socklen_t,
        );
        
        if result == -1 {
            libc::close(sock_fd);
            return Err(std::io::Error::last_os_error());
        }
        
        // 接收响应（简化版本）
        let mut buffer = [0u8; 1024];
        let result = recvfrom(
            sock_fd,
            buffer.as_mut_ptr() as *mut libc::c_void,
            buffer.len(),
            0,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
        );
        
        let elapsed = start_time.elapsed();
        libc::close(sock_fd);
        
        if result == -1 {
            return Err(std::io::Error::last_os_error());
        }
        
        Ok(elapsed)
    }
}
```

## 🔧 高性能网络编程

### epoll事件循环
```rust
#[cfg(target_os = "linux")]
mod epoll_server {
    use std::os::unix::io::{AsRawFd, RawFd};
    use std::collections::HashMap;
    use std::net::{TcpListener, TcpStream};
    use std::io::{Read, Write};
    
    pub struct EpollServer {
        epoll_fd: RawFd,
        listener: TcpListener,
        connections: HashMap<RawFd, TcpStream>,
    }
    
    impl EpollServer {
        pub fn new(addr: &str) -> std::io::Result<Self> {
            let listener = TcpListener::bind(addr)?;
            listener.set_nonblocking(true)?;
            
            let epoll_fd = unsafe { libc::epoll_create1(libc::EPOLL_CLOEXEC) };
            if epoll_fd == -1 {
                return Err(std::io::Error::last_os_error());
            }
            
            // 添加监听套接字到epoll
            let mut event = libc::epoll_event {
                events: libc::EPOLLIN as u32,
                u64: listener.as_raw_fd() as u64,
            };
            
            unsafe {
                if libc::epoll_ctl(epoll_fd, libc::EPOLL_CTL_ADD, listener.as_raw_fd(), &mut event) == -1 {
                    return Err(std::io::Error::last_os_error());
                }
            }
            
            Ok(EpollServer {
                epoll_fd,
                listener,
                connections: HashMap::new(),
            })
        }
        
        pub fn run(&mut self) -> std::io::Result<()> {
            let mut events = [libc::epoll_event { events: 0, u64: 0 }; 1024];
            
            loop {
                let nfds = unsafe {
                    libc::epoll_wait(self.epoll_fd, events.as_mut_ptr(), events.len() as i32, -1)
                };
                
                if nfds == -1 {
                    return Err(std::io::Error::last_os_error());
                }
                
                for i in 0..nfds as usize {
                    let event = events[i];
                    let fd = event.u64 as RawFd;
                    
                    if fd == self.listener.as_raw_fd() {
                        // 新连接
                        self.accept_connection()?;
                    } else {
                        // 现有连接的数据
                        self.handle_connection(fd)?;
                    }
                }
            }
        }
        
        fn accept_connection(&mut self) -> std::io::Result<()> {
            loop {
                match self.listener.accept() {
                    Ok((stream, addr)) => {
                        println!("New connection from: {}", addr);
                        stream.set_nonblocking(true)?;
                        
                        let fd = stream.as_raw_fd();
                        let mut event = libc::epoll_event {
                            events: (libc::EPOLLIN | libc::EPOLLET) as u32,
                            u64: fd as u64,
                        };
                        
                        unsafe {
                            if libc::epoll_ctl(self.epoll_fd, libc::EPOLL_CTL_ADD, fd, &mut event) == -1 {
                                return Err(std::io::Error::last_os_error());
                            }
                        }
                        
                        self.connections.insert(fd, stream);
                    }
                    Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                        break; // 没有更多连接
                    }
                    Err(e) => return Err(e),
                }
            }
            Ok(())
        }
        
        fn handle_connection(&mut self, fd: RawFd) -> std::io::Result<()> {
            if let Some(stream) = self.connections.get_mut(&fd) {
                let mut buffer = [0; 1024];
                
                loop {
                    match stream.read(&mut buffer) {
                        Ok(0) => {
                            // 连接关闭
                            self.connections.remove(&fd);
                            unsafe {
                                libc::epoll_ctl(self.epoll_fd, libc::EPOLL_CTL_DEL, fd, std::ptr::null_mut());
                            }
                            break;
                        }
                        Ok(n) => {
                            // 回显数据
                            stream.write_all(&buffer[..n])?;
                        }
                        Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                            break; // 没有更多数据
                        }
                        Err(e) => return Err(e),
                    }
                }
            }
            Ok(())
        }
    }
    
    impl Drop for EpollServer {
        fn drop(&mut self) {
            unsafe {
                libc::close(self.epoll_fd);
            }
        }
    }
}
```

## 📊 网络性能监控

### 连接统计
```rust
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct ConnectionStats {
    pub total_connections: u64,
    pub active_connections: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub connection_duration: HashMap<String, Duration>,
}

impl ConnectionStats {
    pub fn new() -> Self {
        ConnectionStats {
            total_connections: 0,
            active_connections: 0,
            bytes_sent: 0,
            bytes_received: 0,
            connection_duration: HashMap::new(),
        }
    }
    
    pub fn new_connection(&mut self, addr: String) {
        self.total_connections += 1;
        self.active_connections += 1;
        self.connection_duration.insert(addr, Duration::new(0, 0));
    }
    
    pub fn close_connection(&mut self, addr: String, duration: Duration) {
        self.active_connections = self.active_connections.saturating_sub(1);
        self.connection_duration.insert(addr, duration);
    }
    
    pub fn add_bytes_sent(&mut self, bytes: u64) {
        self.bytes_sent += bytes;
    }
    
    pub fn add_bytes_received(&mut self, bytes: u64) {
        self.bytes_received += bytes;
    }
    
    pub fn report(&self) {
        println!("=== Network Statistics ===");
        println!("Total connections: {}", self.total_connections);
        println!("Active connections: {}", self.active_connections);
        println!("Bytes sent: {}", self.bytes_sent);
        println!("Bytes received: {}", self.bytes_received);
        
        if !self.connection_duration.is_empty() {
            let avg_duration: Duration = self.connection_duration.values()
                .sum::<Duration>() / self.connection_duration.len() as u32;
            println!("Average connection duration: {:?}", avg_duration);
        }
    }
}

pub type SharedStats = Arc<Mutex<ConnectionStats>>;

// 使用示例
fn monitored_server() -> std::io::Result<()> {
    let stats = Arc::new(Mutex::new(ConnectionStats::new()));
    
    // 启动统计报告线程
    let stats_clone = Arc::clone(&stats);
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(10));
            if let Ok(stats) = stats_clone.lock() {
                stats.report();
            }
        }
    });
    
    // 服务器逻辑...
    Ok(())
}
```

---

*网络编程是连接世界的桥梁，掌握这些技能将让您能够构建高性能的网络应用！🌐*
