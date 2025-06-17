# 🚀 第一个 Android 应用

本章将带您创建第一个 Android 应用，从项目创建到运行，让您快速体验 Android 开发的完整流程。

## 🎯 学习目标

- 创建新的 Android 项目
- 了解项目的基本结构
- 编写简单的用户界面
- 在模拟器或真机上运行应用
- 理解 Android 应用的基本组成

## 📱 创建新项目

### 启动项目创建向导

1. 打开 Android Studio
2. 选择 "Create New Project" 或 "File" → "New" → "New Project"
3. 在模板选择界面，选择 "Empty Activity"
4. 点击 "Next"

### 配置项目信息

```kotlin
// 项目配置示例
Name: MyFirstApp
Package name: com.example.myfirstapp
Save location: /Users/yourname/AndroidStudioProjects/MyFirstApp
Language: Kotlin
Minimum SDK: API 24: Android 7.0 (Nougat)
```

#### 重要配置说明

| 配置项 | 说明 | 建议 |
|--------|------|------|
| **Name** | 应用显示名称 | 简洁明了，避免特殊字符 |
| **Package name** | 应用唯一标识符 | 使用反向域名格式 |
| **Language** | 编程语言 | 推荐使用 Kotlin |
| **Minimum SDK** | 最低支持版本 | API 24+ 覆盖95%设备 |

### 选择目标设备

```kotlin
// 目标设备选择
Phone and Tablet: ✅ API 24 (Android 7.0)
Wear OS: ❌ (本教程不涉及)
TV: ❌ (本教程不涉及)
Automotive: ❌ (本教程不涉及)
```

## 📁 项目结构解析

创建完成后，您会看到以下项目结构：

```
MyFirstApp/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/myfirstapp/
│   │   │   │   └── MainActivity.kt
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   │   └── activity_main.xml
│   │   │   │   ├── values/
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   └── themes.xml
│   │   │   │   └── mipmap/
│   │   │   └── AndroidManifest.xml
│   │   ├── test/
│   │   └── androidTest/
│   ├── build.gradle.kts (Module: app)
│   └── proguard-rules.pro
├── gradle/
├── build.gradle.kts (Project: MyFirstApp)
├── gradle.properties
├── settings.gradle.kts
└── local.properties
```

### 核心文件说明

#### MainActivity.kt
```kotlin
package com.example.myfirstapp

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
```

#### activity_main.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Hello World!"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

#### AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MyFirstApp"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>
</manifest>
```

## 🎨 自定义应用界面

让我们修改默认的 "Hello World" 应用，添加更多交互元素。

### 修改布局文件

编辑 `app/src/main/res/layout/activity_main.xml`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="16dp"
    tools:context=".MainActivity">

    <!-- 标题 -->
    <TextView
        android:id="@+id/titleText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="我的第一个 Android 应用"
        android:textSize="24sp"
        android:textStyle="bold"
        android:textColor="@color/purple_700"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        android:layout_marginTop="32dp" />

    <!-- 输入框 -->
    <EditText
        android:id="@+id/nameInput"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:hint="请输入您的姓名"
        android:inputType="textPersonName"
        app:layout_constraintTop_toBottomOf="@id/titleText"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        android:layout_marginTop="32dp" />

    <!-- 按钮 -->
    <Button
        android:id="@+id/greetButton"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="打招呼"
        app:layout_constraintTop_toBottomOf="@id/nameInput"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        android:layout_marginTop="16dp" />

    <!-- 显示结果 -->
    <TextView
        android:id="@+id/resultText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text=""
        android:textSize="18sp"
        android:textColor="@color/teal_700"
        app:layout_constraintTop_toBottomOf="@id/greetButton"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        android:layout_marginTop="32dp" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

### 添加交互逻辑

修改 `MainActivity.kt`：

```kotlin
package com.example.myfirstapp

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    
    // 声明 UI 组件
    private lateinit var nameInput: EditText
    private lateinit var greetButton: Button
    private lateinit var resultText: TextView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // 初始化 UI 组件
        initViews()
        
        // 设置按钮点击事件
        setupClickListeners()
    }
    
    private fun initViews() {
        nameInput = findViewById(R.id.nameInput)
        greetButton = findViewById(R.id.greetButton)
        resultText = findViewById(R.id.resultText)
    }
    
    private fun setupClickListeners() {
        greetButton.setOnClickListener {
            val name = nameInput.text.toString().trim()
            
            if (name.isEmpty()) {
                // 显示提示消息
                Toast.makeText(this, "请输入您的姓名", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            // 生成问候语
            val greeting = generateGreeting(name)
            resultText.text = greeting
            
            // 清空输入框
            nameInput.text.clear()
        }
    }
    
    private fun generateGreeting(name: String): String {
        val greetings = listOf(
            "你好，$name！欢迎来到 Android 世界！",
            "嗨，$name！很高兴认识你！",
            "欢迎，$name！开始你的 Android 开发之旅吧！"
        )
        return greetings.random()
    }
}
```

### 添加字符串资源

编辑 `app/src/main/res/values/strings.xml`：

```xml
<resources>
    <string name="app_name">我的第一个应用</string>
    <string name="title_text">我的第一个 Android 应用</string>
    <string name="name_hint">请输入您的姓名</string>
    <string name="greet_button">打招呼</string>
    <string name="empty_name_warning">请输入您的姓名</string>
</resources>
```

## 🏃‍♂️ 运行应用

### 在模拟器上运行

1. 确保已创建 AVD（虚拟设备）
2. 点击工具栏的 "Run" 按钮（绿色三角形）
3. 选择目标设备
4. 等待应用安装和启动

### 在真机上运行

1. 连接 Android 设备到电脑
2. 确保已启用 USB 调试
3. 在设备选择器中选择您的设备
4. 点击 "Run" 按钮

### 运行命令

```bash
# 使用 Gradle 命令运行
./gradlew installDebug

# 启动应用
adb shell am start -n com.example.myfirstapp/.MainActivity

# 查看日志
adb logcat | grep MyFirstApp
```

## 🐛 调试技巧

### 使用 Log 输出

```kotlin
import android.util.Log

class MainActivity : AppCompatActivity() {
    companion object {
        private const val TAG = "MainActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "onCreate called")
        setContentView(R.layout.activity_main)
    }
    
    private fun generateGreeting(name: String): String {
        Log.i(TAG, "Generating greeting for: $name")
        // ... 其他代码
    }
}
```

### 使用断点调试

1. 在代码行号左侧点击设置断点
2. 以 Debug 模式运行应用（点击绿色虫子图标）
3. 当程序执行到断点时会暂停
4. 使用调试工具查看变量值

### 查看 Logcat

```bash
# 过滤特定标签
adb logcat -s MainActivity

# 过滤特定包名
adb logcat | grep com.example.myfirstapp

# 清除日志
adb logcat -c
```

## 📊 应用性能分析

### 使用 Android Studio Profiler

1. 运行应用后，点击 "View" → "Tool Windows" → "Profiler"
2. 选择您的应用进程
3. 查看 CPU、内存、网络使用情况

### 布局检查器

1. 运行应用后，点击 "Tools" → "Layout Inspector"
2. 选择您的设备和应用
3. 查看布局层次结构和属性

## 🎉 完成第一个应用

恭喜！您已经成功创建并运行了第一个 Android 应用。这个应用包含了：

- ✅ 用户界面设计
- ✅ 用户交互处理
- ✅ 数据验证
- ✅ 随机内容生成
- ✅ Toast 消息提示

### 应用功能总结

1. **界面展示**: 标题、输入框、按钮、结果显示
2. **用户交互**: 点击按钮触发事件
3. **数据处理**: 获取用户输入并生成问候语
4. **错误处理**: 验证输入是否为空
5. **用户反馈**: 显示 Toast 消息和结果文本

### 下一步学习建议

- 了解 Android 项目结构的更多细节
- 学习更多 UI 组件的使用
- 掌握 Activity 生命周期
- 探索不同的布局方式

---

**下一步**: [Android 项目结构](./project-structure.md) →
