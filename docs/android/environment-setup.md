# 🛠️ Android 开发环境搭建

本章将详细介绍如何搭建 Android 开发环境，包括 Android Studio 的安装、配置和基本使用。

## 🎯 学习目标

- 安装和配置 Android Studio
- 了解 Android SDK 的管理
- 配置模拟器和真机调试
- 熟悉开发环境的基本设置

## 📥 下载和安装 Android Studio

### 系统要求检查

在开始之前，请确保您的系统满足以下要求：

| 操作系统 | 最低要求 | 推荐配置 |
|----------|----------|----------|
| **Windows** | Windows 8/10/11 (64位) | Windows 10/11 |
| **macOS** | macOS 10.14 (API level 28) | macOS 12+ |
| **Linux** | Ubuntu 18.04 LTS | Ubuntu 20.04+ LTS |
| **内存** | 8GB RAM | 16GB+ RAM |
| **存储** | 8GB 可用空间 | 16GB+ SSD |
| **分辨率** | 1280 x 800 | 1920 x 1080+ |

### 下载 Android Studio

1. 访问 [Android Studio 官网](https://developer.android.com/studio)
2. 点击 "Download Android Studio" 按钮
3. 阅读并同意许可协议
4. 选择适合您操作系统的版本

### 安装步骤

#### Windows 安装
```bash
# 1. 运行下载的 .exe 文件
# 2. 按照安装向导进行安装
# 3. 选择安装路径（建议使用默认路径）
# 4. 等待安装完成

# 可选：设置环境变量
# ANDROID_HOME = C:\Users\[用户名]\AppData\Local\Android\Sdk
# 添加到 PATH: %ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

#### macOS 安装
```bash
# 1. 打开下载的 .dmg 文件
# 2. 将 Android Studio 拖拽到 Applications 文件夹
# 3. 从 Applications 启动 Android Studio

# 设置环境变量（在 ~/.bash_profile 或 ~/.zshrc 中）
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

#### Linux 安装
```bash
# 1. 解压下载的 .tar.gz 文件
tar -xzf android-studio-*.tar.gz

# 2. 移动到合适的目录
sudo mv android-studio /opt/

# 3. 启动 Android Studio
/opt/android-studio/bin/studio.sh

# 4. 设置环境变量（在 ~/.bashrc 中）
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

## ⚙️ 首次启动配置

### 设置向导

首次启动 Android Studio 时，会出现设置向导：

1. **欢迎界面**
   - 选择 "Do not import settings"（如果是首次安装）

2. **安装类型**
   - 选择 "Standard" 标准安装
   - 或选择 "Custom" 自定义安装路径

3. **UI 主题**
   - 选择 "Light" 浅色主题
   - 或选择 "Darcula" 深色主题

4. **SDK 组件**
   - 确认 Android SDK 安装路径
   - 等待 SDK 组件下载完成

### 验证安装

```bash
# 检查 Android SDK 工具
adb version
# 输出：Android Debug Bridge version x.x.x

# 检查可用的 Android 平台
android list targets
# 或使用新的命令
sdkmanager --list
```

## 📱 SDK Manager 配置

### 打开 SDK Manager

1. 在 Android Studio 中：`Tools` → `SDK Manager`
2. 或点击工具栏的 SDK Manager 图标

### 必需的 SDK 组件

#### SDK Platforms
```
✅ Android 14.0 (API 34) - 最新版本
✅ Android 13.0 (API 33) - 推荐
✅ Android 12.0 (API 31) - 常用
✅ Android 11.0 (API 30) - 兼容性
✅ Android 10.0 (API 29) - 广泛支持
```

#### SDK Tools
```
✅ Android SDK Build-Tools (最新版本)
✅ Android Emulator
✅ Android SDK Platform-Tools
✅ Android SDK Tools
✅ Intel x86 Emulator Accelerator (HAXM installer)
✅ Google Play services
✅ Google Repository
✅ Android Support Repository
```

### 更新 SDK

```bash
# 使用命令行更新 SDK
sdkmanager --update

# 列出可用更新
sdkmanager --list | grep -i "available updates"

# 安装特定组件
sdkmanager "platform-tools" "platforms;android-34"
```

## 🖥️ 模拟器配置

### 创建虚拟设备 (AVD)

1. 打开 AVD Manager：`Tools` → `AVD Manager`
2. 点击 "Create Virtual Device"
3. 选择设备类型和型号

#### 推荐的模拟器配置

| 设备类型 | 屏幕尺寸 | 分辨率 | API Level |
|----------|----------|--------|-----------|
| Pixel 7 | 6.3" | 1080 x 2400 | 34 (Android 14) |
| Pixel 6 | 6.4" | 1080 x 2400 | 33 (Android 13) |
| Nexus 5X | 5.2" | 1080 x 1920 | 31 (Android 12) |

#### 高级配置选项

```xml
<!-- config.ini 示例配置 -->
hw.accelerometer=yes
hw.audioInput=yes
hw.battery=yes
hw.camera.back=virtualscene
hw.camera.front=emulated
hw.cpu.arch=x86_64
hw.gpu.enabled=yes
hw.gpu.mode=auto
hw.ramSize=4096
vm.heapSize=512
```

### 模拟器性能优化

#### 启用硬件加速

**Windows (HAXM)**
```bash
# 检查 HAXM 状态
sc query intelhaxm

# 安装 HAXM
# 通过 SDK Manager 安装 Intel x86 Emulator Accelerator
```

**macOS/Linux (KVM)**
```bash
# 检查虚拟化支持
egrep -c '(vmx|svm)' /proc/cpuinfo

# 安装 KVM (Ubuntu)
sudo apt install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils
```

#### 模拟器启动参数

```bash
# 快速启动
emulator -avd Pixel_7_API_34 -no-boot-anim -no-audio

# 指定内存大小
emulator -avd Pixel_7_API_34 -memory 4096

# 启用 GPU 加速
emulator -avd Pixel_7_API_34 -gpu host
```

## 📲 真机调试配置

### 启用开发者选项

1. 打开手机 `设置` → `关于手机`
2. 连续点击 "版本号" 7次
3. 返回设置，找到 "开发者选项"

### 启用 USB 调试

1. 在开发者选项中启用 "USB 调试"
2. 启用 "允许通过 USB 安装应用"
3. 可选：启用 "无线调试"（Android 11+）

### 连接设备

```bash
# 检查连接的设备
adb devices

# 输出示例：
# List of devices attached
# emulator-5554    device
# 1A2B3C4D5E6F     device

# 如果显示 unauthorized，需要在手机上确认调试授权
```

### 无线调试 (Android 11+)

```bash
# 启用无线调试后，获取配对码
adb pair <IP地址>:<端口>

# 连接设备
adb connect <IP地址>:<端口>

# 示例
adb pair 192.168.1.100:37829
adb connect 192.168.1.100:37829
```

## 🔧 Android Studio 基本配置

### 编辑器设置

```kotlin
// 代码风格配置
// File → Settings → Editor → Code Style → Kotlin

// 推荐设置：
// - Tab size: 4
// - Indent: 4
// - Continuation indent: 8
// - Keep indents on empty lines: false
```

### 插件推荐

```
✅ Kotlin - Kotlin 语言支持
✅ Android APK Support - APK 分析
✅ Database Tools and SQL - 数据库工具
✅ GitToolBox - Git 增强
✅ Rainbow Brackets - 彩色括号
✅ Key Promoter X - 快捷键提示
✅ ADB Idea - ADB 命令集成
✅ Material Theme UI - 主题美化
```

### 性能优化设置

```kotlin
// 在 gradle.properties 中添加：
org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true
android.useAndroidX=true
android.enableJetifier=true
```

## ✅ 环境验证

### 创建测试项目

1. 启动 Android Studio
2. 选择 "Create New Project"
3. 选择 "Empty Activity"
4. 配置项目信息：
   - Name: `HelloWorld`
   - Package name: `com.example.helloworld`
   - Language: `Kotlin`
   - Minimum SDK: `API 24`

### 运行测试

```bash
# 构建项目
./gradlew build

# 安装到设备
./gradlew installDebug

# 运行测试
./gradlew test
```

## 🚨 常见问题解决

### SDK 下载失败
```bash
# 使用代理或镜像源
# 在 gradle.properties 中添加：
systemProp.http.proxyHost=127.0.0.1
systemProp.http.proxyPort=1080
systemProp.https.proxyHost=127.0.0.1
systemProp.https.proxyPort=1080
```

### 模拟器启动慢
```bash
# 检查 HAXM 状态
# Windows: 任务管理器查看 Intel HAXM 服务
# macOS: 系统偏好设置 → 安全性与隐私 → 允许 Intel

# 增加模拟器内存
# AVD Manager → Edit → Advanced Settings → RAM: 4096MB
```

### ADB 连接问题
```bash
# 重启 ADB 服务
adb kill-server
adb start-server

# 检查端口占用
netstat -ano | findstr :5037

# 更换 USB 端口或数据线
```

## 🎉 完成设置

恭喜！您已经成功搭建了 Android 开发环境。现在您可以：

- ✅ 使用 Android Studio 创建项目
- ✅ 在模拟器或真机上运行应用
- ✅ 调试和测试应用
- ✅ 管理 SDK 和依赖

---

**下一步**: [第一个 Android 应用](./first-app.md) →
