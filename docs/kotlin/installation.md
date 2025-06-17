# 🛠️ Kotlin 安装与环境配置

本章将指导您如何搭建 Kotlin 开发环境，包括不同平台的安装方法和 IDE 配置。

## 📋 环境要求

### 系统要求
- **操作系统**：Windows 10+、macOS 10.14+、Linux (Ubuntu 18.04+)
- **Java**：JDK 8 或更高版本
- **内存**：至少 4GB RAM（推荐 8GB+）
- **存储**：至少 2GB 可用空间

### 必需组件
1. **JDK (Java Development Kit)**
2. **Kotlin 编译器**
3. **构建工具** (Gradle 或 Maven)
4. **IDE** (IntelliJ IDEA 或 Android Studio)

## ☕ 安装 JDK

### Windows
```bash
# 使用 Chocolatey
choco install openjdk

# 或者下载 Oracle JDK/OpenJDK
# 从官网下载安装包：https://adoptium.net/
```

### macOS
```bash
# 使用 Homebrew
brew install openjdk

# 设置环境变量
echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Linux (Ubuntu/Debian)
```bash
# 安装 OpenJDK
sudo apt update
sudo apt install openjdk-11-jdk

# 验证安装
java -version
javac -version
```

## 🎯 安装 Kotlin

### 方法一：使用 SDKMAN (推荐)
```bash
# 安装 SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# 安装 Kotlin
sdk install kotlin

# 验证安装
kotlin -version
```

### 方法二：使用包管理器

#### macOS (Homebrew)
```bash
brew install kotlin
```

#### Windows (Chocolatey)
```bash
choco install kotlinc
```

#### Linux (Snap)
```bash
sudo snap install --classic kotlin
```

### 方法三：手动安装
1. 从 [GitHub Releases](https://github.com/JetBrains/kotlin/releases) 下载最新版本
2. 解压到目标目录
3. 将 `bin` 目录添加到 PATH 环境变量

```bash
# 下载并解压
wget https://github.com/JetBrains/kotlin/releases/download/v1.9.20/kotlin-compiler-1.9.20.zip
unzip kotlin-compiler-1.9.20.zip

# 设置环境变量
export PATH="$PATH:/path/to/kotlinc/bin"
```

## 🏗️ 安装构建工具

### Gradle (推荐)
```bash
# 使用 SDKMAN
sdk install gradle

# 或使用包管理器
# macOS
brew install gradle

# Windows
choco install gradle

# 验证安装
gradle -version
```

### Maven
```bash
# 使用 SDKMAN
sdk install maven

# 或使用包管理器
# macOS
brew install maven

# Windows
choco install maven

# 验证安装
mvn -version
```

## 💻 IDE 安装与配置

### IntelliJ IDEA (推荐)

#### 安装
1. 访问 [JetBrains 官网](https://www.jetbrains.com/idea/)
2. 下载 Community 版本（免费）或 Ultimate 版本
3. 按照安装向导完成安装

#### 配置 Kotlin 插件
```
1. 打开 IntelliJ IDEA
2. File → Settings (Windows/Linux) 或 Preferences (macOS)
3. Plugins → 搜索 "Kotlin"
4. 安装并启用 Kotlin 插件
5. 重启 IDE
```

### Android Studio
```
1. 下载 Android Studio：https://developer.android.com/studio
2. 安装并启动
3. Kotlin 插件已预装，无需额外配置
```

### Visual Studio Code
```bash
# 安装 Kotlin 扩展
1. 安装 VS Code
2. 打开扩展面板 (Ctrl+Shift+X)
3. 搜索并安装 "Kotlin Language" 扩展
4. 安装 "Code Runner" 扩展（可选）
```

## 🔧 环境变量配置

### Windows
```cmd
# 设置 KOTLIN_HOME
set KOTLIN_HOME=C:\kotlin-compiler
set PATH=%PATH%;%KOTLIN_HOME%\bin

# 永久设置（系统属性 → 高级 → 环境变量）
```

### macOS/Linux
```bash
# 编辑 shell 配置文件
# ~/.bashrc (Bash) 或 ~/.zshrc (Zsh)

export KOTLIN_HOME=/path/to/kotlin-compiler
export PATH=$PATH:$KOTLIN_HOME/bin

# 重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc
```

## ✅ 验证安装

### 检查版本
```bash
# 检查 Java
java -version

# 检查 Kotlin
kotlin -version
kotlinc -version

# 检查 Gradle
gradle -version

# 检查 Maven (如果安装)
mvn -version
```

### 创建测试项目
```bash
# 创建目录
mkdir kotlin-test
cd kotlin-test

# 创建 Hello.kt 文件
echo 'fun main() { println("Hello, Kotlin!") }' > Hello.kt

# 编译并运行
kotlinc Hello.kt -include-runtime -d Hello.jar
java -jar Hello.jar
```

## 🚀 创建第一个项目

### 使用 IntelliJ IDEA
```
1. File → New → Project
2. 选择 "Kotlin" → "Kotlin/JVM"
3. 设置项目名称和位置
4. 选择 Project SDK (JDK)
5. 点击 "Finish"
```

### 使用 Gradle
```bash
# 创建新项目
mkdir my-kotlin-app
cd my-kotlin-app

# 初始化 Gradle 项目
gradle init --type kotlin-application
```

### 项目结构
```
my-kotlin-app/
├── build.gradle.kts
├── gradle/
├── gradlew
├── gradlew.bat
├── settings.gradle.kts
└── src/
    ├── main/
    │   └── kotlin/
    │       └── App.kt
    └── test/
        └── kotlin/
            └── AppTest.kt
```

## 🔧 常见问题解决

### 问题 1：找不到 kotlinc 命令
```bash
# 检查 PATH 环境变量
echo $PATH

# 重新设置 PATH
export PATH=$PATH:/path/to/kotlinc/bin
```

### 问题 2：Java 版本不兼容
```bash
# 检查 Java 版本
java -version

# 如果版本过低，升级到 JDK 8+
```

### 问题 3：IDE 无法识别 Kotlin 文件
```
1. 确保安装了 Kotlin 插件
2. 检查项目 SDK 配置
3. 重新导入项目
```

## 📚 推荐配置

### IDE 设置优化
```
1. 启用自动导入
2. 配置代码格式化
3. 启用实时模板
4. 配置版本控制
```

### Gradle 配置示例
```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.20"
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(kotlin("stdlib"))
    testImplementation(kotlin("test"))
}

application {
    mainClass.set("MainKt")
}
```

## 🎯 下一步

环境搭建完成后，您可以：

1. [编写第一个 Kotlin 程序](./hello-world.md)
2. [学习 Gradle 构建工具](./gradle.md)
3. [了解基础语法](./basic-syntax.md)

---

*环境配置完成！现在让我们开始编写第一个 Kotlin 程序吧！*
