# 开发工具

Rust 拥有丰富的开发工具生态系统，这些工具可以大大提高开发效率和代码质量。本章介绍最重要和最实用的 Rust 开发工具。

## 核心工具

### rustc - Rust 编译器

```bash
# 直接编译单个文件
rustc main.rs

# 指定输出文件名
rustc main.rs -o my_program

# 优化编译
rustc -O main.rs

# 查看编译器版本
rustc --version

# 查看目标平台
rustc --print target-list

# 交叉编译
rustc --target x86_64-pc-windows-gnu main.rs
```

### rustup - 工具链管理器

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 更新 Rust
rustup update

# 查看已安装的工具链
rustup show

# 安装特定版本
rustup install 1.70.0
rustup install nightly

# 设置默认工具链
rustup default stable
rustup default nightly

# 为项目设置特定工具链
rustup override set nightly

# 安装组件
rustup component add clippy
rustup component add rustfmt
rustup component add rust-src

# 安装目标平台
rustup target add wasm32-unknown-unknown
rustup target add x86_64-pc-windows-gnu
```

## 代码质量工具

### Clippy - 代码检查器

```bash
# 安装 Clippy
rustup component add clippy

# 运行 Clippy
cargo clippy

# 严格模式
cargo clippy -- -D warnings

# 修复建议
cargo clippy --fix

# 特定目标
cargo clippy --bin my_binary
cargo clippy --lib
```

```rust
// Clippy 配置文件 clippy.toml
cognitive-complexity-threshold = 30
type-complexity-threshold = 250

# 或在 Cargo.toml 中配置
[lints.clippy]
all = "warn"
pedantic = "warn"
nursery = "warn"
cargo = "warn"
```

### Rustfmt - 代码格式化

```bash
# 安装 rustfmt
rustup component add rustfmt

# 格式化代码
cargo fmt

# 检查格式但不修改
cargo fmt -- --check

# 格式化特定文件
rustfmt src/main.rs
```

```toml
# rustfmt.toml 配置文件
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
use_small_heuristics = "Default"
reorder_imports = true
reorder_modules = true
remove_nested_parens = true
edition = "2024"
```

## 文档工具

### rustdoc - 文档生成器

```bash
# 生成文档
cargo doc

# 生成并打开文档
cargo doc --open

# 包含私有项
cargo doc --document-private-items

# 不包含依赖的文档
cargo doc --no-deps

# 测试文档中的代码
cargo test --doc
```

```rust
//! 这是 crate 级别的文档
//! 
//! # 示例
//! 
//! ```
//! use my_crate::add;
//! assert_eq!(add(2, 3), 5);
//! ```

/// 计算两个数的和
/// 
/// # 参数
/// 
/// * `a` - 第一个数
/// * `b` - 第二个数
/// 
/// # 返回值
/// 
/// 返回两个数的和
/// 
/// # 示例
/// 
/// ```
/// use my_crate::add;
/// 
/// let result = add(2, 3);
/// assert_eq!(result, 5);
/// ```
/// 
/// # Panics
/// 
/// 当结果溢出时会 panic
/// 
/// # Errors
/// 
/// 此函数不会返回错误
/// 
/// # Safety
/// 
/// 此函数是安全的
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

### mdBook - 书籍生成器

```bash
# 安装 mdBook
cargo install mdbook

# 创建新书
mdbook init my_book

# 构建书籍
mdbook build

# 启动开发服务器
mdbook serve

# 测试代码示例
mdbook test
```

```toml
# book.toml
[book]
authors = ["Your Name"]
language = "zh"
multilingual = false
src = "src"
title = "我的 Rust 书籍"

[build]
build-dir = "book"

[output.html]
theme = "theme"
default-theme = "light"
preferred-dark-theme = "navy"
git-repository-url = "https://github.com/user/repo"
```

## 测试工具

### cargo-nextest - 更快的测试运行器

```bash
# 安装 nextest
cargo install cargo-nextest

# 运行测试
cargo nextest run

# 并行运行测试
cargo nextest run --jobs 8

# 生成报告
cargo nextest run --profile ci
```

### cargo-tarpaulin - 代码覆盖率

```bash
# 安装 tarpaulin
cargo install cargo-tarpaulin

# 生成覆盖率报告
cargo tarpaulin

# 输出 HTML 报告
cargo tarpaulin --out Html

# 排除文件
cargo tarpaulin --exclude-files "tests/*"
```

### Miri - 内存安全检查器

```bash
# 安装 Miri
rustup +nightly component add miri

# 运行 Miri
cargo +nightly miri test

# 检查特定二进制
cargo +nightly miri run
```

## 性能分析工具

### cargo-flamegraph - 火焰图生成器

```bash
# 安装 flamegraph
cargo install flamegraph

# 生成火焰图
cargo flamegraph --bin my_binary

# 指定采样时间
cargo flamegraph --bin my_binary -- --duration 30
```

### cargo-profdata - 性能数据分析

```bash
# 安装 profdata
cargo install cargo-profdata

# 收集性能数据
RUSTFLAGS="-C instrument-coverage" cargo build
cargo profdata -- merge -sparse default.profraw -o default.profdata
```

### Valgrind 集成

```bash
# 使用 Valgrind 检查内存泄漏
cargo build
valgrind --tool=memcheck --leak-check=full ./target/debug/my_binary

# 使用 Callgrind 进行性能分析
valgrind --tool=callgrind ./target/debug/my_binary
```

## 依赖管理工具

### cargo-edit - 依赖编辑器

```bash
# 安装 cargo-edit
cargo install cargo-edit

# 添加依赖
cargo add serde
cargo add tokio --features full
cargo add --dev criterion

# 移除依赖
cargo remove serde

# 升级依赖
cargo upgrade
```

### cargo-outdated - 过时依赖检查

```bash
# 安装 cargo-outdated
cargo install cargo-outdated

# 检查过时依赖
cargo outdated

# 检查根依赖
cargo outdated --root-deps-only
```

### cargo-audit - 安全审计

```bash
# 安装 cargo-audit
cargo install cargo-audit

# 审计依赖
cargo audit

# 修复已知漏洞
cargo audit fix
```

## 开发辅助工具

### cargo-watch - 文件监控

```bash
# 安装 cargo-watch
cargo install cargo-watch

# 监控文件变化并重新构建
cargo watch -x build

# 监控并运行测试
cargo watch -x test

# 监控并运行程序
cargo watch -x run

# 复杂的监控命令
cargo watch -x check -x test -x run
```

### cargo-expand - 宏展开

```bash
# 安装 cargo-expand
cargo install cargo-expand

# 展开所有宏
cargo expand

# 展开特定模块
cargo expand my_module

# 展开特定函数
cargo expand my_function
```

### cargo-tree - 依赖树

```bash
# 显示依赖树（现已内置）
cargo tree

# 显示重复依赖
cargo tree --duplicates

# 显示特定包的依赖
cargo tree -p serde

# 反向依赖
cargo tree --invert tokio
```

## IDE 和编辑器支持

### VS Code

```json
// .vscode/settings.json
{
    "rust-analyzer.check.command": "clippy",
    "rust-analyzer.cargo.features": "all",
    "rust-analyzer.procMacro.enable": true,
    "rust-analyzer.imports.granularity.group": "module",
    "rust-analyzer.completion.addCallArgumentSnippets": true,
    "rust-analyzer.completion.addCallParenthesis": true
}
```

推荐扩展：
- rust-analyzer
- CodeLLDB
- Better TOML
- Error Lens

### IntelliJ IDEA / CLion

安装 Rust 插件：
- IntelliJ Rust
- TOML

### Vim/Neovim

```lua
-- 使用 nvim-lspconfig 配置 rust-analyzer
require'lspconfig'.rust_analyzer.setup{
  settings = {
    ["rust-analyzer"] = {
      cargo = {
        allFeatures = true,
      },
      checkOnSave = {
        command = "clippy"
      },
    }
  }
}
```

## 构建和部署工具

### cross - 交叉编译

```bash
# 安装 cross
cargo install cross

# 交叉编译到不同平台
cross build --target x86_64-pc-windows-gnu
cross build --target aarch64-unknown-linux-gnu
cross build --target wasm32-unknown-unknown
```

### cargo-deb - Debian 包生成器

```bash
# 安装 cargo-deb
cargo install cargo-deb

# 生成 .deb 包
cargo deb

# 指定目标架构
cargo deb --target x86_64-unknown-linux-gnu
```

### Docker 集成

```dockerfile
# Dockerfile
FROM rust:1.75 as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/my_app /usr/local/bin/my_app
CMD ["my_app"]
```

## 调试工具

### GDB 集成

```bash
# 使用 GDB 调试
cargo build
gdb ./target/debug/my_binary

# 在 GDB 中设置断点
(gdb) break main
(gdb) run
(gdb) backtrace
```

### LLDB 集成

```bash
# 使用 LLDB 调试
cargo build
lldb ./target/debug/my_binary

# LLDB 命令
(lldb) breakpoint set --name main
(lldb) run
(lldb) thread backtrace
```

### rust-gdb 和 rust-lldb

```bash
# 使用 Rust 特定的调试器
rust-gdb ./target/debug/my_binary
rust-lldb ./target/debug/my_binary
```

## 工作流自动化

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: dtolnay/rust-toolchain@stable
      with:
        components: clippy, rustfmt
    
    - name: Format check
      run: cargo fmt -- --check
    
    - name: Clippy check
      run: cargo clippy -- -D warnings
    
    - name: Run tests
      run: cargo test
    
    - name: Build
      run: cargo build --release
```

### Pre-commit hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: cargo-fmt
        name: cargo fmt
        entry: cargo fmt
        language: system
        types: [rust]
        pass_filenames: false
      
      - id: cargo-clippy
        name: cargo clippy
        entry: cargo clippy
        language: system
        types: [rust]
        pass_filenames: false
        args: [--all-targets, --all-features, --, -D, warnings]
```

## 性能监控

### cargo-criterion - 基准测试

```bash
# 安装 criterion
cargo install cargo-criterion

# 运行基准测试
cargo criterion

# 生成报告
cargo criterion --message-format json
```

### perf 集成

```bash
# 使用 perf 进行性能分析
cargo build --release
perf record ./target/release/my_binary
perf report
```

## 工具配置最佳实践

### 项目配置文件

```toml
# .cargo/config.toml
[build]
rustflags = ["-D", "warnings"]

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

[alias]
b = "build"
c = "check"
t = "test"
r = "run"
```

### 开发环境设置

```bash
# 安装常用工具的脚本
#!/bin/bash

# 核心组件
rustup component add clippy rustfmt rust-src

# 开发工具
cargo install cargo-edit
cargo install cargo-watch
cargo install cargo-expand
cargo install cargo-audit
cargo install cargo-outdated
cargo install cargo-nextest
cargo install cargo-tarpaulin

# 性能工具
cargo install flamegraph
cargo install cargo-criterion

# 部署工具
cargo install cross
cargo install cargo-deb

echo "Rust 开发环境配置完成！"
```

## 工具选择建议

### 必备工具
- rustup（工具链管理）
- cargo（包管理）
- clippy（代码检查）
- rustfmt（代码格式化）
- rust-analyzer（LSP）

### 推荐工具
- cargo-watch（开发时监控）
- cargo-edit（依赖管理）
- cargo-audit（安全审计）
- cargo-nextest（更快的测试）

### 高级工具
- cargo-expand（宏调试）
- flamegraph（性能分析）
- cross（交叉编译）
- Miri（内存安全检查）

这些工具构成了完整的 Rust 开发工具链，掌握它们将大大提高您的开发效率和代码质量！
