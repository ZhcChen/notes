# 安装与环境配置

本章将指导您在不同操作系统上安装 Rust 开发环境，并配置必要的开发工具。

## 安装 Rust

### 使用 rustup（推荐）

`rustup` 是 Rust 官方的工具链管理器，可以轻松安装和管理 Rust 版本。

#### 在 Linux 和 macOS 上安装

打开终端并运行以下命令：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### 在 Windows 上安装

1. 访问 [rustup.rs](https://rustup.rs/)
2. 下载并运行 `rustup-init.exe`
3. 按照安装向导的指示完成安装

### 验证安装

安装完成后，重新启动终端并运行：

```bash
rustc --version
cargo --version
```

如果看到版本信息，说明安装成功。

## 更新 Rust

使用以下命令更新到最新版本：

```bash
rustup update
```

## Rust 版本管理

### 安装特定版本

```bash
# 安装稳定版
rustup install stable

# 安装测试版
rustup install beta

# 安装开发版
rustup install nightly

# 安装特定版本
rustup install 1.85.0
```

### 切换默认版本

```bash
# 设置稳定版为默认
rustup default stable

# 设置特定版本为默认
rustup default 1.85.0
```

### 为项目设置特定版本

在项目根目录创建 `rust-toolchain.toml` 文件：

```toml
[toolchain]
channel = "1.85.0"
components = ["rustfmt", "clippy"]
```

## 开发环境配置

### 编辑器推荐

#### Visual Studio Code
1. 安装 VS Code
2. 安装 `rust-analyzer` 扩展
3. 安装 `CodeLLDB` 扩展（用于调试）

#### IntelliJ IDEA / CLion
1. 安装 IntelliJ Rust 插件
2. 配置 Rust 工具链路径

#### Vim/Neovim
使用 `rust.vim` 插件或配置 LSP 客户端使用 `rust-analyzer`

### 必要组件安装

```bash
# 安装代码格式化工具
rustup component add rustfmt

# 安装代码检查工具
rustup component add clippy

# 安装 Rust 语言服务器
rustup component add rust-analyzer
```

## 创建第一个项目

使用 Cargo 创建新项目：

```bash
# 创建二进制项目
cargo new hello_rust
cd hello_rust

# 创建库项目
cargo new --lib my_library
```

### 项目结构

```
hello_rust/
├── Cargo.toml      # 项目配置文件
├── src/
│   └── main.rs     # 主源文件
└── target/         # 编译输出目录（自动生成）
```

### 运行项目

```bash
# 编译并运行
cargo run

# 仅编译
cargo build

# 发布版本编译（优化）
cargo build --release

# 检查代码（不生成可执行文件）
cargo check
```

## 常用工具

### Cargo 子命令

```bash
# 格式化代码
cargo fmt

# 代码检查
cargo clippy

# 运行测试
cargo test

# 生成文档
cargo doc --open

# 清理构建文件
cargo clean
```

### 其他有用工具

```bash
# 安装 cargo-edit（用于管理依赖）
cargo install cargo-edit

# 安装 cargo-watch（自动重新编译）
cargo install cargo-watch

# 安装 cargo-expand（展开宏）
cargo install cargo-expand
```

## 配置文件

### Cargo 全局配置

创建 `~/.cargo/config.toml`：

```toml
[source.crates-io]
# 使用中科大镜像源（中国用户）
replace-with = 'ustc'

[source.ustc]
registry = "https://mirrors.ustc.edu.cn/crates.io-index"

[build]
# 设置默认编译目标
target = "x86_64-unknown-linux-gnu"

[term]
# 彩色输出
color = 'always'
```

### 项目配置示例

`Cargo.toml` 文件示例：

```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2024"
authors = ["Your Name <your.email@example.com>"]
description = "A sample Rust project"
license = "MIT"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }

[dev-dependencies]
criterion = "0.5"

[[bin]]
name = "main"
path = "src/main.rs"

[profile.release]
opt-level = 3
lto = true
```

## 故障排除

### 常见问题

1. **权限问题**：确保有写入 `~/.cargo` 目录的权限
2. **网络问题**：配置代理或使用镜像源
3. **路径问题**：确保 `~/.cargo/bin` 在 PATH 环境变量中

### 重新安装

如果遇到问题，可以完全重新安装：

```bash
# 卸载 rustup
rustup self uninstall

# 重新安装
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 下一步

安装完成后，您可以：

1. 阅读[第一个 Rust 程序](./hello-world.md)
2. 学习[基本语法](./basic-syntax.md)
3. 探索 Rust 的[所有权系统](./ownership.md)

现在您已经准备好开始 Rust 编程之旅了！
