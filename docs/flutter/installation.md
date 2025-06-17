# 🔧 Flutter 安装与环境配置

> 本指南将帮助你在各种操作系统上安装 Flutter SDK 并配置开发环境。

## 系统要求

### Windows
- **操作系统**：Windows 10 或更高版本（64位）
- **磁盘空间**：至少 1.64 GB（不包括IDE和工具）
- **工具**：Windows PowerShell 5.0 或更高版本，Git for Windows

### macOS
- **操作系统**：macOS 11.0 (Big Sur) 或更高版本
- **磁盘空间**：至少 2.8 GB（不包括IDE和工具）
- **工具**：bash、curl、git、mkdir、rm、unzip、which

### Linux
- **操作系统**：Ubuntu 20.04 LTS 或更高版本
- **磁盘空间**：至少 1.6 GB（不包括IDE和工具）
- **工具**：bash、curl、git、mkdir、rm、unzip、which、xz-utils

## 安装步骤

### Windows 安装

1. **下载 Flutter SDK**
   - 访问 [Flutter 官方下载页面](https://flutter.dev/docs/get-started/install/windows)
   - 下载最新的 Flutter SDK zip 文件

2. **解压 Flutter SDK**
   - 将下载的 zip 文件解压到所需位置（如 `C:\dev\flutter`）
   - 注意：不建议安装在需要高权限的位置（如 `C:\Program Files\`）

3. **添加 Flutter 到环境变量**
   - 打开"系统属性" → "高级" → "环境变量"
   - 在"用户变量"中，编辑 `Path` 变量
   - 添加 Flutter SDK 的 `bin` 目录路径（如 `C:\dev\flutter\bin`）

4. **安装 Android Studio**
   - 下载并安装 [Android Studio](https://developer.android.com/studio)
   - 运行 Android Studio，完成初始设置向导
   - 安装 Flutter 和 Dart 插件：
     - 打开 Android Studio
     - 转到 File → Settings → Plugins
     - 搜索 Flutter 插件并安装
     - 系统会提示同时安装 Dart 插件，点击"Yes"

### macOS 安装

1. **下载 Flutter SDK**
   - 访问 [Flutter 官方下载页面](https://flutter.dev/docs/get-started/install/macos)
   - 下载最新的 Flutter SDK zip 文件

2. **解压 Flutter SDK**
   ```bash
   cd ~/development
   unzip ~/Downloads/flutter_macos_3.19.0-stable.zip
   ```

3. **添加 Flutter 到环境变量**
   - 打开终端，编辑 `~/.zshrc` 或 `~/.bash_profile` 文件：
   ```bash
   echo 'export PATH="$PATH:$HOME/development/flutter/bin"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **安装 Xcode**
   - 从 Mac App Store 安装 [Xcode](https://apps.apple.com/us/app/xcode/id497799835)
   - 安装 Xcode 命令行工具：
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```
   - 接受 Xcode 许可协议：
   ```bash
   sudo xcodebuild -license
   ```

5. **安装 Android Studio**
   - 下载并安装 [Android Studio](https://developer.android.com/studio)
   - 安装 Flutter 和 Dart 插件

### Linux 安装

1. **安装依赖项**
   ```bash
   sudo apt update
   sudo apt install -y curl git unzip xz-utils zip libglu1-mesa
   ```

2. **下载 Flutter SDK**
   ```bash
   cd ~/development
   git clone https://github.com/flutter/flutter.git -b stable
   ```

3. **添加 Flutter 到环境变量**
   ```bash
   echo 'export PATH="$PATH:$HOME/development/flutter/bin"' >> ~/.bashrc
   source ~/.bashrc
   ```

4. **安装 Android Studio**
   - 下载 [Android Studio](https://developer.android.com/studio)
   - 解压并安装：
   ```bash
   cd ~/Downloads
   tar -xf android-studio-*.tar.gz
   mv android-studio ~/android-studio
   cd ~/android-studio/bin
   ./studio.sh
   ```
   - 安装 Flutter 和 Dart 插件

## 验证安装

安装完成后，运行以下命令检查是否需要安装其他依赖项：

```bash
flutter doctor
```

`flutter doctor` 命令会检查你的环境并显示报告，指出 Flutter 安装是否完成以及是否需要安装其他依赖项。

## 配置编辑器

### Visual Studio Code

1. 安装 [Visual Studio Code](https://code.visualstudio.com/)
2. 安装 Flutter 扩展：
   - 打开 VS Code
   - 转到扩展视图（Ctrl+Shift+X / Cmd+Shift+X）
   - 搜索 "Flutter"，选择 Flutter 扩展并安装
   - 系统会提示同时安装 Dart 扩展

### Android Studio / IntelliJ IDEA

1. 安装 Flutter 和 Dart 插件：
   - 打开 Android Studio / IntelliJ IDEA
   - 转到 Preferences → Plugins
   - 搜索 Flutter 插件并安装
   - 系统会提示同时安装 Dart 插件，点击"Yes"

## 创建模拟器/连接设备

### Android 模拟器

1. 打开 Android Studio
2. 点击 "AVD Manager"（Android Virtual Device Manager）
3. 点击 "Create Virtual Device"
4. 选择设备类型和系统镜像
5. 完成配置并创建模拟器

### iOS 模拟器（仅限 macOS）

1. 安装 Xcode
2. 打开终端，运行：
   ```bash
   open -a Simulator
   ```

### 连接实体设备

1. **Android 设备**：
   - 启用 USB 调试
   - 使用 USB 连接设备到电脑

2. **iOS 设备**（仅限 macOS）：
   - 安装 Xcode
   - 使用 USB 连接设备到 Mac
   - 在设备上信任电脑
   - 在 Xcode 中配置开发者账号

## 常见问题解决

### Flutter doctor 报错

- **Android licenses not accepted**：运行 `flutter doctor --android-licenses` 并接受所有许可证
- **Xcode not installed or not configured properly**：确保安装了最新版本的 Xcode
- **Missing components**：按照 `flutter doctor` 的建议安装缺失组件

### 网络问题

如果你在中国大陆地区，可能需要设置 Flutter 镜像：

```bash
# 设置 Flutter 镜像
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

将上述命令添加到你的 `~/.bashrc`、`~/.zshrc` 或 `~/.bash_profile` 文件中。

## 更新 Flutter

定期更新 Flutter SDK 以获取最新功能和修复：

```bash
flutter upgrade
```

---

> 接下来：➡️ [第一个 Flutter 应用](./first-app)