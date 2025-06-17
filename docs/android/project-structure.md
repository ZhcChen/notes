# 📁 Android 项目结构

本章将详细介绍 Android 项目的目录结构和各个文件的作用，帮助您深入理解 Android 应用的组织方式。

## 🎯 学习目标

- 理解 Android 项目的完整目录结构
- 掌握各个配置文件的作用
- 了解资源文件的组织方式
- 学会项目结构的最佳实践

## 🏗️ 项目根目录结构

```
MyFirstApp/
├── .gradle/                    # Gradle 缓存目录
├── .idea/                      # Android Studio 配置
├── app/                        # 主应用模块
├── gradle/                     # Gradle Wrapper 文件
├── build.gradle.kts           # 项目级构建脚本
├── gradle.properties          # Gradle 配置属性
├── gradlew                    # Gradle Wrapper 脚本 (Unix)
├── gradlew.bat               # Gradle Wrapper 脚本 (Windows)
├── local.properties          # 本地配置（SDK路径等）
├── settings.gradle.kts       # 项目设置
└── README.md                 # 项目说明文档
```

### 根目录文件详解

#### build.gradle.kts (Project)
```kotlin
// Top-level build file where you can add configuration options 
// common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.2.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.20" apply false
}
```

#### settings.gradle.kts
```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MyFirstApp"
include(":app")
```

#### gradle.properties
```properties
# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true

# Android settings
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=false

# Kotlin settings
kotlin.code.style=official
```

## 📱 app 模块结构

```
app/
├── src/
│   ├── main/                   # 主源码目录
│   │   ├── java/              # Java/Kotlin 源码
│   │   ├── res/               # 资源文件
│   │   └── AndroidManifest.xml # 应用清单文件
│   ├── test/                  # 单元测试
│   └── androidTest/           # 仪器测试
├── build/                     # 构建输出目录
├── build.gradle.kts          # 模块构建脚本
└── proguard-rules.pro        # ProGuard 混淆规则
```

### app/build.gradle.kts
```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.myfirstapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.myfirstapp"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
```

## 📂 源码目录结构

### main/java 目录
```
main/java/com/example/myfirstapp/
├── MainActivity.kt             # 主活动
├── ui/                        # UI 相关类
│   ├── activities/           # 活动类
│   ├── fragments/            # 片段类
│   ├── adapters/             # 适配器类
│   └── custom/               # 自定义视图
├── data/                     # 数据层
│   ├── models/               # 数据模型
│   ├── repositories/         # 数据仓库
│   └── network/              # 网络请求
├── utils/                    # 工具类
├── constants/                # 常量定义
└── Application.kt            # 应用程序类
```

#### 包命名规范
```kotlin
// 推荐的包结构
com.company.appname.feature.type

// 示例
com.example.myfirstapp.ui.activities
com.example.myfirstapp.data.models
com.example.myfirstapp.utils.network
```

## 🎨 资源目录结构

### res 目录详解
```
res/
├── drawable/                  # 图片资源
│   ├── ic_launcher.xml       # 应用图标
│   └── button_background.xml # 按钮背景
├── drawable-hdpi/            # 高密度图片
├── drawable-mdpi/            # 中密度图片
├── drawable-xhdpi/           # 超高密度图片
├── drawable-xxhdpi/          # 超超高密度图片
├── drawable-xxxhdpi/         # 超超超高密度图片
├── layout/                   # 布局文件
│   ├── activity_main.xml     # 主活动布局
│   └── fragment_home.xml     # 首页片段布局
├── layout-land/              # 横屏布局
├── layout-sw600dp/           # 平板布局
├── mipmap-hdpi/              # 启动图标 (高密度)
├── mipmap-mdpi/              # 启动图标 (中密度)
├── mipmap-xhdpi/             # 启动图标 (超高密度)
├── mipmap-xxhdpi/            # 启动图标 (超超高密度)
├── mipmap-xxxhdpi/           # 启动图标 (超超超高密度)
├── values/                   # 默认值资源
│   ├── colors.xml            # 颜色定义
│   ├── strings.xml           # 字符串资源
│   ├── themes.xml            # 主题样式
│   ├── dimens.xml            # 尺寸定义
│   └── styles.xml            # 样式定义
├── values-night/             # 夜间模式资源
├── values-zh/                # 中文资源
├── values-en/                # 英文资源
├── font/                     # 字体文件
├── raw/                      # 原始文件
└── xml/                      # XML 配置文件
```

### 资源文件示例

#### colors.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="purple_200">#FFBB86FC</color>
    <color name="purple_500">#FF6200EE</color>
    <color name="purple_700">#FF3700B3</color>
    <color name="teal_200">#FF03DAC5</color>
    <color name="teal_700">#FF018786</color>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
    
    <!-- 自定义颜色 -->
    <color name="primary_blue">#FF2196F3</color>
    <color name="accent_orange">#FFFF9800</color>
</resources>
```

#### strings.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">我的第一个应用</string>
    <string name="hello_world">Hello World!</string>
    
    <!-- 按钮文本 -->
    <string name="btn_submit">提交</string>
    <string name="btn_cancel">取消</string>
    
    <!-- 提示信息 -->
    <string name="msg_loading">加载中...</string>
    <string name="msg_error">发生错误</string>
    
    <!-- 格式化字符串 -->
    <string name="welcome_message">欢迎，%1$s！</string>
    <string name="item_count">共 %d 项</string>
</resources>
```

#### dimens.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- 间距 -->
    <dimen name="margin_small">8dp</dimen>
    <dimen name="margin_medium">16dp</dimen>
    <dimen name="margin_large">24dp</dimen>
    
    <!-- 文字大小 -->
    <dimen name="text_size_small">12sp</dimen>
    <dimen name="text_size_medium">16sp</dimen>
    <dimen name="text_size_large">20sp</dimen>
    
    <!-- 按钮尺寸 -->
    <dimen name="button_height">48dp</dimen>
    <dimen name="button_corner_radius">8dp</dimen>
</resources>
```

## 📋 AndroidManifest.xml

### 完整的清单文件示例
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- 权限声明 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- 硬件特性 -->
    <uses-feature 
        android:name="android.hardware.camera"
        android:required="false" />

    <application
        android:name=".MyApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MyFirstApp"
        tools:targetApi="31">

        <!-- 主活动 -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- 其他活动 -->
        <activity
            android:name=".SecondActivity"
            android:exported="false"
            android:parentActivityName=".MainActivity" />

        <!-- 服务 -->
        <service
            android:name=".MyService"
            android:enabled="true"
            android:exported="false" />

        <!-- 广播接收器 -->
        <receiver
            android:name=".MyReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

        <!-- 内容提供器 -->
        <provider
            android:name=".MyContentProvider"
            android:authorities="com.example.myfirstapp.provider"
            android:enabled="true"
            android:exported="false" />

    </application>

</manifest>
```

## 🧪 测试目录结构

### test 目录 (单元测试)
```
test/java/com/example/myfirstapp/
├── ExampleUnitTest.kt         # 示例单元测试
├── utils/                     # 工具类测试
├── data/                      # 数据层测试
└── ui/                        # UI 逻辑测试
```

### androidTest 目录 (仪器测试)
```
androidTest/java/com/example/myfirstapp/
├── ExampleInstrumentedTest.kt # 示例仪器测试
├── ui/                        # UI 测试
└── database/                  # 数据库测试
```

## 🔧 构建配置

### 多模块项目结构
```
MyApp/
├── app/                       # 主应用模块
├── core/                      # 核心模块
├── feature-login/             # 登录功能模块
├── feature-home/              # 首页功能模块
├── data/                      # 数据模块
└── common/                    # 通用模块
```

### 构建变体配置
```kotlin
android {
    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            isMinifyEnabled = false
        }
        
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    flavorDimensions += "environment"
    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
        }
        
        create("prod") {
            dimension = "environment"
        }
    }
}
```

## 📝 最佳实践

### 1. 包结构组织
```kotlin
// 按功能分组 (推荐)
com.example.app.feature.login
com.example.app.feature.home
com.example.app.feature.profile

// 按类型分组 (不推荐)
com.example.app.activities
com.example.app.fragments
com.example.app.adapters
```

### 2. 资源命名规范
```xml
<!-- 布局文件 -->
activity_main.xml
fragment_home.xml
item_user.xml
dialog_confirm.xml

<!-- 图片资源 -->
ic_home.xml          <!-- 图标 -->
bg_button.xml        <!-- 背景 -->
img_placeholder.png  <!-- 图片 -->

<!-- 字符串资源 -->
<string name="btn_submit">提交</string>
<string name="msg_error">错误信息</string>
<string name="title_home">首页</string>
```

### 3. 代码组织
```kotlin
class MainActivity : AppCompatActivity() {
    // 1. 常量
    companion object {
        private const val TAG = "MainActivity"
        private const val REQUEST_CODE = 100
    }
    
    // 2. 属性
    private lateinit var binding: ActivityMainBinding
    
    // 3. 生命周期方法
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // ...
    }
    
    // 4. 私有方法
    private fun setupViews() {
        // ...
    }
    
    // 5. 内部类
    inner class MyAdapter : RecyclerView.Adapter<ViewHolder>() {
        // ...
    }
}
```

## 🎯 总结

理解 Android 项目结构是开发的基础：

- ✅ **根目录**: 包含构建配置和项目设置
- ✅ **app 模块**: 主要的应用代码和资源
- ✅ **源码目录**: 按功能组织 Java/Kotlin 代码
- ✅ **资源目录**: 管理 UI 资源和配置
- ✅ **清单文件**: 声明应用组件和权限
- ✅ **测试目录**: 单元测试和仪器测试

掌握这些结构将帮助您更好地组织和维护 Android 项目。

---

**下一步**: [Gradle 构建系统](./gradle.md) →
