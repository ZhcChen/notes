# 包管理 Cargo

Cargo 是 Rust 的构建系统和包管理器。它处理许多任务，如构建代码、下载依赖库、构建这些库等。Cargo 是 Rust 生态系统的核心工具。

## Cargo 基础

### 创建新项目

```bash
# 创建二进制项目
cargo new hello_world
cd hello_world

# 创建库项目
cargo new --lib my_library

# 在现有目录中初始化项目
cargo init

# 指定版本控制系统
cargo new my_project --vcs git
cargo new my_project --vcs none
```

### 项目结构

```
my_project/
├── Cargo.toml          # 项目配置文件
├── Cargo.lock          # 依赖锁定文件
├── src/                # 源代码目录
│   ├── main.rs         # 二进制项目入口
│   └── lib.rs          # 库项目入口
├── tests/              # 集成测试
├── benches/            # 基准测试
├── examples/           # 示例代码
└── target/             # 构建输出目录
```

## Cargo.toml 配置

### 基本配置

```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2024"
authors = ["Your Name <your.email@example.com>"]
description = "A sample Rust project"
license = "MIT OR Apache-2.0"
repository = "https://github.com/username/my_project"
homepage = "https://github.com/username/my_project"
documentation = "https://docs.rs/my_project"
readme = "README.md"
keywords = ["cli", "tool", "utility"]
categories = ["command-line-utilities"]

[dependencies]
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }
clap = { version = "4.0", optional = true }

[dev-dependencies]
criterion = "0.5"
proptest = "1.0"

[build-dependencies]
cc = "1.0"

[features]
default = ["cli"]
cli = ["clap"]
experimental = []

[[bin]]
name = "my_tool"
path = "src/bin/my_tool.rs"

[[example]]
name = "basic_usage"
path = "examples/basic.rs"

[[bench]]
name = "performance"
harness = false

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"

[profile.dev]
opt-level = 0
debug = true
```

### 依赖管理

```toml
[dependencies]
# 来自 crates.io
serde = "1.0"

# 指定版本范围
regex = "^1.5"      # >= 1.5.0, < 2.0.0
log = "~0.4.14"     # >= 0.4.14, < 0.5.0
uuid = "1.0.0"      # 精确版本

# 来自 Git 仓库
my_lib = { git = "https://github.com/user/my_lib.git" }
my_lib = { git = "https://github.com/user/my_lib.git", branch = "main" }
my_lib = { git = "https://github.com/user/my_lib.git", tag = "v1.0.0" }
my_lib = { git = "https://github.com/user/my_lib.git", rev = "abc123" }

# 本地路径
local_lib = { path = "../local_lib" }

# 可选依赖
clap = { version = "4.0", optional = true }

# 特定平台依赖
[target.'cfg(windows)'.dependencies]
winapi = "0.3"

[target.'cfg(unix)'.dependencies]
libc = "0.2"
```

## Cargo 命令

### 基本命令

```bash
# 构建项目
cargo build                 # 调试构建
cargo build --release       # 发布构建
cargo build --target x86_64-pc-windows-gnu  # 交叉编译

# 运行项目
cargo run                   # 运行默认二进制
cargo run --bin my_tool     # 运行指定二进制
cargo run --example basic   # 运行示例

# 检查代码
cargo check                 # 快速检查（不生成可执行文件）
cargo clippy                # 代码检查和建议
cargo fmt                   # 代码格式化

# 测试
cargo test                  # 运行所有测试
cargo test unit_tests       # 运行特定测试
cargo test --lib            # 只运行库测试
cargo test --bins           # 只运行二进制测试
cargo test --doc            # 运行文档测试

# 基准测试
cargo bench                 # 运行基准测试

# 文档
cargo doc                   # 生成文档
cargo doc --open            # 生成并打开文档

# 清理
cargo clean                 # 清理构建文件
```

### 依赖管理命令

```bash
# 添加依赖
cargo add serde             # 添加最新版本
cargo add serde@1.0.100     # 添加特定版本
cargo add --dev criterion   # 添加开发依赖
cargo add --build cc        # 添加构建依赖
cargo add --optional clap   # 添加可选依赖

# 移除依赖
cargo remove serde

# 更新依赖
cargo update                # 更新所有依赖
cargo update serde          # 更新特定依赖

# 查看依赖
cargo tree                  # 显示依赖树
cargo tree --duplicates     # 显示重复依赖
```

## 工作空间

### 工作空间配置

```toml
# 根目录 Cargo.toml
[workspace]
members = [
    "crates/core",
    "crates/cli",
    "crates/web",
]
exclude = [
    "old_crate",
]

[workspace.dependencies]
serde = "1.0"
tokio = "1.0"

[workspace.package]
version = "0.1.0"
edition = "2024"
authors = ["Your Name <your.email@example.com>"]
license = "MIT"
```

### 成员包配置

```toml
# crates/core/Cargo.toml
[package]
name = "my_project_core"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true

[dependencies]
serde.workspace = true

# crates/cli/Cargo.toml
[package]
name = "my_project_cli"
version.workspace = true
edition.workspace = true

[dependencies]
my_project_core = { path = "../core" }
clap = "4.0"
```

### 工作空间命令

```bash
# 在工作空间根目录
cargo build                 # 构建所有成员
cargo test                  # 测试所有成员
cargo build -p my_project_core  # 构建特定包

# 运行特定包的二进制
cargo run -p my_project_cli

# 发布工作空间包
cargo publish -p my_project_core
```

## 自定义命令

### 安装 Cargo 扩展

```bash
# 安装常用扩展
cargo install cargo-edit     # 添加 cargo add/remove 命令
cargo install cargo-watch    # 文件变化时自动重新构建
cargo install cargo-expand   # 展开宏
cargo install cargo-audit    # 安全审计
cargo install cargo-outdated # 检查过时依赖
cargo install cargo-tree     # 依赖树（现已内置）
cargo install cargo-bloat    # 分析二进制大小
```

### 使用扩展命令

```bash
# 监视文件变化
cargo watch -x check         # 文件变化时运行 check
cargo watch -x test          # 文件变化时运行测试
cargo watch -x "run --bin my_tool"

# 展开宏
cargo expand                 # 展开所有宏
cargo expand main            # 展开特定函数的宏

# 安全审计
cargo audit                  # 检查已知安全漏洞

# 检查过时依赖
cargo outdated               # 显示可更新的依赖

# 分析二进制大小
cargo bloat --release        # 分析发布版本的大小
```

## 构建脚本

### build.rs 示例

```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // 获取环境变量
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("generated.rs");

    // 生成代码
    fs::write(
        &dest_path,
        r#"
        pub const GENERATED_CONSTANT: &str = "Hello from build script!";
        "#,
    ).unwrap();

    // 告诉 Cargo 重新运行构建脚本的条件
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=src/template.txt");

    // 设置环境变量
    println!("cargo:rustc-env=BUILD_TIME={}", chrono::Utc::now().to_rfc3339());

    // 链接库
    println!("cargo:rustc-link-lib=ssl");
    println!("cargo:rustc-link-search=native=/usr/local/lib");

    // 编译 C 代码
    cc::Build::new()
        .file("src/helper.c")
        .compile("helper");
}
```

### 在代码中使用构建脚本输出

```rust
// src/lib.rs
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

pub fn get_build_info() -> &'static str {
    GENERATED_CONSTANT
}

pub fn get_build_time() -> &'static str {
    env!("BUILD_TIME")
}
```

## 发布和版本管理

### 准备发布

```toml
# Cargo.toml
[package]
name = "my_awesome_crate"
version = "0.1.0"
description = "An awesome Rust crate"
license = "MIT OR Apache-2.0"
repository = "https://github.com/username/my_awesome_crate"
documentation = "https://docs.rs/my_awesome_crate"
homepage = "https://github.com/username/my_awesome_crate"
readme = "README.md"
keywords = ["awesome", "rust", "crate"]
categories = ["development-tools"]
include = [
    "src/**/*",
    "Cargo.toml",
    "README.md",
    "LICENSE*",
]
exclude = [
    "tests/fixtures/*",
    "benches/large_datasets/*",
]
```

### 发布命令

```bash
# 检查包是否可以发布
cargo package                # 创建发布包
cargo package --list         # 列出将要包含的文件

# 发布到 crates.io
cargo publish                # 发布包
cargo publish --dry-run      # 模拟发布（不实际发布）

# 撤回版本（只能在发布后 72 小时内）
cargo yank --vers 0.1.0      # 撤回版本
cargo yank --vers 0.1.0 --undo  # 取消撤回
```

### 语义化版本

```toml
# 版本格式：MAJOR.MINOR.PATCH
version = "1.2.3"

# 预发布版本
version = "1.0.0-alpha.1"
version = "1.0.0-beta.2"
version = "1.0.0-rc.1"

# 构建元数据
version = "1.0.0+build.1"
```

## 配置和环境

### Cargo 配置文件

```toml
# ~/.cargo/config.toml 或项目根目录 .cargo/config.toml

[build]
target = "x86_64-unknown-linux-gnu"
target-dir = "target"
jobs = 4

[cargo-new]
name = "Your Name"
email = "your.email@example.com"
vcs = "git"

[source.crates-io]
replace-with = "ustc"

[source.ustc]
registry = "https://mirrors.ustc.edu.cn/crates.io-index"

[target.x86_64-pc-windows-gnu]
linker = "x86_64-w64-mingw32-gcc"

[alias]
b = "build"
c = "check"
t = "test"
r = "run"
rr = "run --release"
```

### 环境变量

```bash
# 常用环境变量
export CARGO_TARGET_DIR=/tmp/target    # 自定义构建目录
export RUSTFLAGS="-C target-cpu=native"  # 编译器标志
export CARGO_INCREMENTAL=1             # 启用增量编译
export RUST_BACKTRACE=1                # 启用错误回溯

# 交叉编译
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc
```

## 实际应用示例

### CLI 工具项目

```toml
# Cargo.toml
[package]
name = "my_cli_tool"
version = "0.1.0"
edition = "2024"
description = "A useful CLI tool"
license = "MIT"

[[bin]]
name = "my_tool"
path = "src/main.rs"

[dependencies]
clap = { version = "4.0", features = ["derive"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
tokio = { version = "1.0", features = ["full"] }

[dev-dependencies]
assert_cmd = "2.0"
predicates = "3.0"
tempfile = "3.0"
```

### 库项目

```toml
# Cargo.toml
[package]
name = "my_library"
version = "0.1.0"
edition = "2024"
description = "A useful Rust library"
license = "MIT OR Apache-2.0"
repository = "https://github.com/username/my_library"
documentation = "https://docs.rs/my_library"

[dependencies]
serde = { version = "1.0", features = ["derive"], optional = true }
tokio = { version = "1.0", optional = true }

[features]
default = []
serde_support = ["serde"]
async_support = ["tokio"]
full = ["serde_support", "async_support"]

[dev-dependencies]
criterion = "0.5"
proptest = "1.0"

[[bench]]
name = "benchmarks"
harness = false
```

## 最佳实践

### 版本管理

```bash
# 使用语义化版本
# MAJOR: 不兼容的 API 变更
# MINOR: 向后兼容的功能新增
# PATCH: 向后兼容的问题修正

# 发布流程
git tag v0.1.0
cargo publish
```

### 依赖管理

```toml
# 使用合适的版本约束
[dependencies]
# 好：允许补丁更新
serde = "1.0.100"

# 谨慎：允许次版本更新
regex = "1.5"

# 避免：过于宽松
# some_crate = "*"
```

### 特性管理

```toml
[features]
default = ["std"]
std = []
serde = ["dep:serde"]
async = ["dep:tokio"]

# 互斥特性
tls-native = ["native-tls"]
tls-rustls = ["rustls"]
```

## 练习

### 练习 1：创建 CLI 工具
使用 Cargo 创建一个命令行工具项目，包含多个子命令。

### 练习 2：构建库项目
创建一个库项目，支持多个可选特性。

### 练习 3：工作空间管理
创建一个包含多个相关包的工作空间。

### 练习 4：发布准备
准备一个包用于发布到 crates.io（不实际发布）。

## 下一步

掌握了 Cargo 后，您可以继续学习：

1. [宏编程](./macros.md) - 元编程
2. [unsafe Rust](./unsafe.md) - 底层控制
3. [常用库推荐](./ecosystem.md) - 社区生态

Cargo 是 Rust 开发的核心工具，掌握它将大大提高您的开发效率！
