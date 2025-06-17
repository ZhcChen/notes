# 🚀 第一个 Flutter 应用

> 本指南将带你创建并运行一个简单的 Flutter 应用，帮助你熟悉 Flutter 开发流程。

## 创建新项目

有两种方式可以创建 Flutter 项目：通过命令行或使用 IDE。

### 使用命令行创建项目

1. 打开终端或命令提示符
2. 运行以下命令创建新项目：

```bash
flutter create my_first_app
```

这将创建一个名为 `my_first_app` 的新 Flutter 项目。

### 使用 IDE 创建项目

#### Android Studio / IntelliJ IDEA

1. 打开 Android Studio 或 IntelliJ IDEA
2. 点击 `File` → `New` → `New Flutter Project`
3. 选择 `Flutter Application`
4. 填写项目名称（如 `my_first_app`）和项目位置
5. 选择 Flutter SDK 路径（如果尚未配置）
6. 点击 `Finish` 创建项目

#### Visual Studio Code

1. 打开 VS Code
2. 按下 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（macOS）打开命令面板
3. 输入 `Flutter: New Project`
4. 选择项目位置
5. 输入项目名称（如 `my_first_app`）

## 项目结构

新创建的 Flutter 项目结构如下：

```
my_first_app/
├── .dart_tool/           # Dart 工具相关文件
├── .idea/                # IDE 配置文件（IntelliJ）
├── android/              # Android 平台特定代码
├── build/                # 构建输出目录
├── ios/                  # iOS 平台特定代码
├── lib/                  # 主要的 Dart 代码目录
│   └── main.dart         # 应用入口文件
├── linux/                # Linux 平台特定代码
├── macos/                # macOS 平台特定代码
├── test/                 # 测试代码目录
├── web/                  # Web 平台特定代码
├── windows/              # Windows 平台特定代码
├── .gitignore            # Git 忽略文件
├── .metadata             # Flutter 元数据
├── analysis_options.yaml # Dart 分析选项
├── pubspec.lock          # 依赖锁定文件
├── pubspec.yaml          # 项目配置和依赖管理
└── README.md             # 项目说明文件
```

最重要的文件和目录：

- **lib/main.dart**：应用的主入口点，包含 `main()` 函数
- **pubspec.yaml**：项目配置文件，用于管理依赖和资源
- **android/** 和 **ios/**：平台特定代码和配置
- **test/**：单元测试和集成测试代码

## 理解默认应用

打开 `lib/main.dart` 文件，你会看到一个计数器应用的示例代码。让我们来理解这个代码：

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

代码解析：

1. **main() 函数**：应用的入口点，调用 `runApp()` 启动应用
2. **MyApp 类**：定义应用的全局设置，如主题和首页
3. **MyHomePage 类**：定义一个有状态的页面（StatefulWidget）
4. **_MyHomePageState 类**：管理 MyHomePage 的状态，包含计数器逻辑

## 运行应用

### 命令行运行

1. 进入项目目录：
   ```bash
   cd my_first_app
   ```

2. 确保有可用设备（模拟器或实体设备）：
   ```bash
   flutter devices
   ```

3. 运行应用：
   ```bash
   flutter run
   ```

### 使用 IDE 运行

#### Android Studio / IntelliJ IDEA

1. 在设备选择器中选择目标设备（模拟器或实体设备）
2. 点击 `Run` 按钮或按 `Shift+F10`

#### Visual Studio Code

1. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
2. 输入 `Flutter: Select Device` 并选择目标设备
3. 按 `F5` 或点击 `Run` → `Start Debugging`

## 热重载（Hot Reload）与热重启（Hot Restart）

Flutter 提供了两种快速开发工具：热重载和热重启。

### 热重载（Hot Reload）

热重载允许你在不重启应用的情况下快速查看代码更改的效果：

1. 修改 `lib/main.dart` 文件中的文本：
   ```dart
   const Text(
     'You have pushed the awesome button this many times:',
   ),
   ```

2. 保存文件（`Ctrl+S` 或 `Cmd+S`）

3. 如果使用命令行运行，按 `r` 键触发热重载；如果使用 IDE，热重载通常会自动触发

你会立即看到应用中的文本更新，而不需要重新启动应用。

**热重载的工作原理**：
- 将更新的代码注入到正在运行的 Dart 虚拟机中
- 重建 widget 树，但保持应用状态
- 不会重新执行 `initState()` 等初始化方法
- 适合 UI 更改和添加功能

### 热重启（Hot Restart）

当热重载不足以应用你的更改时，可以使用热重启：

1. 在命令行中按 `Shift+R` 或在 IDE 中点击热重启按钮

**热重启的工作原理**：
- 重新启动 Dart 虚拟机，但不重启应用
- 重新执行所有代码，包括 `initState()` 等初始化方法
- 应用状态会被重置
- 比完全重启快，但比热重载慢
- 适合更改初始化逻辑、添加全局变量或修改状态管理

### 热重载的局限性

热重载不适用于以下情况：
- 更改了类型定义或继承关系
- 修改了全局变量的初始化
- 更改了 `initState()` 方法中的代码
- 修改了原生代码（Android/iOS）

在这些情况下，应使用热重启或完全重启应用。

## 修改应用

让我们对默认应用进行一些简单的修改：

1. 更改应用标题和主题颜色：

```dart
return MaterialApp(
  title: 'My First Flutter App',
  theme: ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
    useMaterial3: true,
  ),
  home: const MyHomePage(title: 'My First Flutter App'),
);
```

2. 添加一个新的文本 Widget：

```dart
body: Center(
  child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: <Widget>[
      const Text(
        'You have pushed the button this many times:',
      ),
      Text(
        '$_counter',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const SizedBox(height: 20),  // 添加间距
      const Text(
        'Flutter is awesome!',
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    ],
  ),
),
```

3. 添加一个减少计数的按钮：

首先，添加一个新方法：

```dart
void _decrementCounter() {
  setState(() {
    if (_counter > 0) {
      _counter--;
    }
  });
}
```

然后，修改浮动按钮部分：

```dart
floatingActionButton: Row(
  mainAxisAlignment: MainAxisAlignment.end,
  children: [
    FloatingActionButton(
      onPressed: _decrementCounter,
      tooltip: 'Decrement',
      child: const Icon(Icons.remove),
    ),
    const SizedBox(width: 10),
    FloatingActionButton(
      onPressed: _incrementCounter,
      tooltip: 'Increment',
      child: const Icon(Icons.add),
    ),
  ],
),
```

## 调试应用

Flutter 提供了多种调试工具和技术：

### 使用 print 和 debugPrint 语句

在代码中添加打印语句来输出调试信息：

```dart
void _incrementCounter() {
  setState(() {
    _counter++;
    print('Counter incremented to: $_counter');
    // 或使用 debugPrint，它在高频输出时不会被截断
    debugPrint('Counter value: $_counter');
  });
}
```

> 注意：`debugPrint` 在发布版本中会自动被移除，而 `print` 不会。

### 使用 Flutter DevTools

Flutter DevTools 是一个强大的调试和性能分析工具：

1. 在命令行中运行：
   ```bash
   flutter pub global activate devtools
   flutter pub global run devtools
   ```

2. 或在 IDE 中使用内置的 DevTools：
   - 在 Android Studio 中：点击 `View` → `Tool Windows` → `Flutter Inspector`
   - 在 VS Code 中：打开命令面板，输入 `Flutter: Open DevTools`

DevTools 提供以下功能：
- **Flutter Inspector**：检查和操作 widget 树
- **Timeline**：分析应用性能和帧渲染
- **Memory**：监控内存使用情况
- **Performance**：分析 CPU 和 GPU 使用情况
- **Network**：监控网络请求
- **Logging**：查看日志输出

### 使用断点调试

在 IDE 中设置断点进行调试：

1. 在代码行号旁边点击设置断点
2. 以调试模式运行应用
3. 当执行到断点时，应用会暂停
4. 检查变量值、调用栈和执行流程

### 使用 debugger() 语句

在代码中添加 `debugger()` 语句来设置程序断点：

```dart
import 'dart:developer';

void _incrementCounter() {
  debugger(); // 程序会在此处暂停，仅在调试模式下有效
  setState(() {
    _counter++;
  });
}
```

### 使用 assert 语句

使用 `assert` 在调试模式下验证条件：

```dart
void _incrementCounter() {
  setState(() {
    _counter++;
    assert(_counter >= 0, 'Counter should not be negative');
  });
}
```

### 检查布局问题

使用 `debugPaintSizeEnabled` 可视化布局边界：

```dart
import 'package:flutter/rendering.dart';

void main() {
  debugPaintSizeEnabled = true; // 打开布局边界可视化
  runApp(const MyApp());
}
```

## 添加依赖

大多数应用需要外部依赖包。Flutter 使用 `pubspec.yaml` 文件管理依赖：

### 添加依赖的步骤

1. 打开 `pubspec.yaml` 文件
2. 在 `dependencies` 部分添加所需的包：

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2
  intl: ^0.18.0  # 添加国际化支持包
  http: ^1.1.0   # 添加 HTTP 请求包
  shared_preferences: ^2.2.0  # 添加本地存储包
```

3. 保存文件后，运行：

```bash
flutter pub get
```

或者在 IDE 中，保存文件后会自动运行 `flutter pub get`。

### 使用依赖包

添加依赖后，你可以在代码中导入并使用这些包：

#### 示例 1：使用 intl 包格式化日期

```dart
import 'package:intl/intl.dart';

// 在 _MyHomePageState 类中添加一个方法
String _formattedDate() {
  final now = DateTime.now();
  final formatter = DateFormat('yyyy-MM-dd HH:mm:ss');
  return formatter.format(now);
}

// 在 build 方法中添加显示日期的文本
const SizedBox(height: 20),
Text(
  'Current time: ${_formattedDate()}',
  style: const TextStyle(fontSize: 16),
),
```

#### 示例 2：使用 http 包发送网络请求

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

// 在 _MyHomePageState 类中添加一个方法
Future<void> fetchData() async {
  final response = await http.get(Uri.parse('https://jsonplaceholder.typicode.com/todos/1'));
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    print('Fetched data: $data');
  } else {
    print('Failed to fetch data: ${response.statusCode}');
  }
}

// 在 initState 中调用
@override
void initState() {
  super.initState();
  fetchData();
}
```

#### 示例 3：使用 shared_preferences 存储本地数据

```dart
import 'package:shared_preferences/shared_preferences.dart';

// 保存计数器值
Future<void> _saveCounter() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setInt('counter', _counter);
  print('Counter saved: $_counter');
}

// 加载计数器值
Future<void> _loadCounter() async {
  final prefs = await SharedPreferences.getInstance();
  setState(() {
    _counter = prefs.getInt('counter') ?? 0;
  });
  print('Counter loaded: $_counter');
}

// 在 initState 中加载数据
@override
void initState() {
  super.initState();
  _loadCounter();
}

// 在 _incrementCounter 方法中保存数据
void _incrementCounter() {
  setState(() {
    _counter++;
  });
  _saveCounter();
}
```

### 查找和选择包

可以在 [pub.dev](https://pub.dev) 网站上搜索和查看 Flutter 包。选择包时，请考虑以下因素：

- **流行度**：下载量和点赞数
- **维护状态**：最近更新时间和版本
- **兼容性**：与你的 Flutter 版本兼容
- **文档质量**：是否有详细的使用说明
- **许可证**：是否符合你的项目需求

## 使用资源文件

Flutter 应用通常需要使用图片、字体和其他资源文件。

### 添加图片资源

1. 在项目根目录创建 `assets/images` 文件夹
2. 将图片文件（如 `logo.png`）放入该文件夹
3. 在 `pubspec.yaml` 文件中声明资源：

```yaml
flutter:
  assets:
    - assets/images/logo.png
    - assets/images/  # 包含整个目录
```

4. 在代码中使用图片：

```dart
Image.asset('assets/images/logo.png')

// 或使用 AssetImage
Image(image: AssetImage('assets/images/logo.png'))
```

### 添加字体资源

1. 在项目根目录创建 `assets/fonts` 文件夹
2. 将字体文件（如 `CustomFont-Regular.ttf`）放入该文件夹
3. 在 `pubspec.yaml` 文件中声明字体：

```yaml
flutter:
  fonts:
    - family: CustomFont
      fonts:
        - asset: assets/fonts/CustomFont-Regular.ttf
        - asset: assets/fonts/CustomFont-Bold.ttf
          weight: 700
```

4. 在代码中使用字体：

```dart
Text(
  'Custom Font Text',
  style: TextStyle(
    fontFamily: 'CustomFont',
    fontSize: 24,
  ),
)
```

### 添加 JSON 或其他文本资源

1. 在项目根目录创建 `assets/data` 文件夹
2. 将 JSON 文件（如 `config.json`）放入该文件夹
3. 在 `pubspec.yaml` 文件中声明资源：

```yaml
flutter:
  assets:
    - assets/data/config.json
```

4. 在代码中加载 JSON 文件：

```dart
import 'dart:convert';
import 'package:flutter/services.dart';

Future<Map<String, dynamic>> loadConfig() async {
  final jsonString = await rootBundle.loadString('assets/data/config.json');
  return json.decode(jsonString);
}
```

## 响应式设计

创建适应不同屏幕尺寸的 Flutter 应用：

### 使用 MediaQuery 获取屏幕信息

```dart
Widget build(BuildContext context) {
  final screenSize = MediaQuery.of(context).size;
  final screenWidth = screenSize.width;
  final screenHeight = screenSize.height;
  
  return Scaffold(
    body: Center(
      child: Container(
        width: screenWidth * 0.8, // 屏幕宽度的 80%
        height: screenHeight * 0.3, // 屏幕高度的 30%
        color: Colors.blue,
        child: const Center(
          child: Text('响应式容器'),
        ),
      ),
    ),
  );
}
```

### 使用 LayoutBuilder 创建响应式布局

```dart
Widget build(BuildContext context) {
  return Scaffold(
    body: LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > 600) {
          // 宽屏布局（平板、桌面）
          return Row(
            children: [
              Expanded(
                flex: 1,
                child: _buildSidebar(),
              ),
              Expanded(
                flex: 3,
                child: _buildMainContent(),
              ),
            ],
          );
        } else {
          // 窄屏布局（手机）
          return Column(
            children: [
              _buildMainContent(),
              _buildBottomNav(),
            ],
          );
        }
      },
    ),
  );
}
```

### 使用 FittedBox 自适应内容

```dart
FittedBox(
  fit: BoxFit.contain,
  child: Text(
    'This text will scale to fit its container',
    style: TextStyle(fontSize: 30),
  ),
)
```

### 使用 Flexible 和 Expanded 控制空间分配

```dart
Row(
  children: [
    Expanded(
      flex: 2, // 占用 2/3 的空间
      child: Container(color: Colors.red),
    ),
    Expanded(
      flex: 1, // 占用 1/3 的空间
      child: Container(color: Colors.blue),
    ),
  ],
)
```

## 测试 Flutter 应用

Flutter 提供了多种测试方法：

### 单元测试

单元测试用于测试单个函数、方法或类。

1. 在 `pubspec.yaml` 中添加测试依赖：

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
```

2. 在 `test` 目录中创建测试文件，如 `counter_test.dart`：

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:my_first_app/main.dart';

void main() {
  test('Counter increments smoke test', () {
    final counter = Counter();
    counter.increment();
    expect(counter.value, 1);
  });
}
```

3. 运行测试：

```bash
flutter test
```

### Widget 测试

Widget 测试用于测试单个 widget 的行为。

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_first_app/main.dart';

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // 构建应用并触发一帧
    await tester.pumpWidget(const MyApp());

    // 验证计数器从 0 开始
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // 点击 + 按钮并触发一帧
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // 验证计数器增加到 1
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
```

### 集成测试

集成测试用于测试完整应用或应用的大部分功能。

1. 添加集成测试依赖：

```yaml
dev_dependencies:
  integration_test:
    sdk: flutter
```

2. 创建 `integration_test` 目录和测试文件：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:my_first_app/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Counter increments test', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('0'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();
    expect(find.text('1'), findsOneWidget);
  });
}
```

3. 运行集成测试：

```bash
flutter test integration_test
```

## 构建发布版本

当你准备发布应用时，需要构建发布版本：

### Android 发布版本

```bash
flutter build apk --release
```

生成的 APK 文件位于 `build/app/outputs/flutter-apk/app-release.apk`。

对于 App Bundle（推荐用于 Google Play 发布）：

```bash
flutter build appbundle --release
```

生成的 AAB 文件位于 `build/app/outputs/bundle/release/app-release.aab`。

### iOS 发布版本

```bash
flutter build ios --release
```

然后使用 Xcode 打开 `ios/Runner.xcworkspace` 进行最终构建和发布。

### Web 发布版本

```bash
flutter build web --release
```

生成的文件位于 `build/web` 目录，可以部署到任何 Web 服务器。

### 桌面发布版本

```bash
# Windows
flutter build windows --release

# macOS
flutter build macos --release

# Linux
flutter build linux --release
```

## 常见问题解决

### 应用崩溃或白屏

1. 检查控制台错误日志
2. 确保所有 Widget 都正确初始化
3. 检查异步操作是否正确处理
4. 使用 try-catch 捕获可能的异常

### 布局溢出（黄黑条纹警告）

1. 使用 `SingleChildScrollView` 包裹可能溢出的内容
2. 使用 `Expanded` 或 `Flexible` 控制子 Widget 大小
3. 使用 `ConstrainedBox` 或 `SizedBox` 限制 Widget 尺寸

### 性能问题

1. 使用 `const` 构造函数减少重建
2. 避免在 `build` 方法中执行复杂计算
3. 使用 `ListView.builder` 代替 `ListView` 处理长列表
4. 使用 Flutter DevTools 分析性能瓶颈

### 状态管理问题

1. 确保在正确的位置调用 `setState()`
2. 考虑使用更高级的状态管理方案（Provider、Riverpod、Bloc）
3. 避免在 Widget 树深处传递回调函数

## 下一步

恭喜！你已经成功创建并运行了第一个 Flutter 应用。接下来，你可以：

1. 学习 Dart 语言基础
2. 深入了解 Flutter 的 Widget 系统
3. 探索更多 Flutter 包和插件
4. 尝试构建更复杂的 UI
5. 学习高级状态管理方案
6. 探索 Flutter 的动画系统
7. 学习如何与后端服务集成

## 推荐资源

- [Flutter 官方文档](https://flutter.dev/docs)
- [Dart 官方文档](https://dart.dev/guides)
- [Flutter Cookbook](https://flutter.dev/docs/cookbook)
- [pub.dev](https://pub.dev) - Flutter 包仓库
- [Flutter 社区](https://flutter.dev/community)

---

> 接下来：➡️ [Dart 语言快速入门](./dart-basics)