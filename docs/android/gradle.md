# 🔧 Gradle 构建系统

本章将深入介绍 Android 项目中的 Gradle 构建系统，包括配置文件、依赖管理、构建变体等核心概念。

## 🎯 学习目标

- 理解 Gradle 在 Android 开发中的作用
- 掌握 Gradle 配置文件的编写
- 学会依赖管理和版本控制
- 了解构建变体和产品风味
- 掌握构建优化技巧

## 🏗️ Gradle 简介

### 什么是 Gradle？

Gradle 是一个基于 Apache Ant 和 Apache Maven 概念的项目自动化构建工具，使用 Groovy 或 Kotlin DSL 来声明项目设置。

### Gradle 的优势

- **灵活性**: 支持多种编程语言和平台
- **性能**: 增量构建和构建缓存
- **可扩展性**: 丰富的插件生态系统
- **依赖管理**: 强大的依赖解析机制

## 📁 Gradle 文件结构

```
MyApp/
├── build.gradle.kts           # 项目级构建脚本
├── settings.gradle.kts        # 项目设置
├── gradle.properties          # Gradle 属性配置
├── local.properties          # 本地配置
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew                   # Gradle Wrapper (Unix)
├── gradlew.bat              # Gradle Wrapper (Windows)
└── app/
    └── build.gradle.kts     # 模块级构建脚本
```

## 🔧 项目级构建脚本

### build.gradle.kts (Project)

```kotlin
// Top-level build file where you can add configuration options 
// common to all sub-projects/modules.

buildscript {
    ext {
        kotlin_version = "1.9.20"
        compose_version = "1.5.8"
    }
}

plugins {
    id("com.android.application") version "8.2.0" apply false
    id("com.android.library") version "8.2.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.20" apply false
    id("com.google.dagger.hilt.android") version "2.48" apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}

tasks.register("clean", Delete::class) {
    delete(rootProject.buildDir)
}
```

### settings.gradle.kts

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
        maven { url = uri("https://jitpack.io") }
    }
}

rootProject.name = "MyApp"
include(":app")
include(":core")
include(":feature-login")
include(":feature-home")
```

## 📱 模块级构建脚本

### app/build.gradle.kts

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
    id("kotlin-parcelize")
}

android {
    namespace = "com.example.myapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.myapp"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        // 矢量图支持
        vectorDrawables {
            useSupportLibrary = true
        }
        
        // 构建配置字段
        buildConfigField("String", "API_BASE_URL", "\"https://api.example.com\"")
        buildConfigField("boolean", "DEBUG_MODE", "true")
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            isDebuggable = true
            isMinifyEnabled = false
            isShrinkResources = false
            
            // 自定义构建配置
            buildConfigField("String", "API_BASE_URL", "\"https://dev-api.example.com\"")
            
            // 签名配置
            signingConfig = signingConfigs.getByName("debug")
        }
        
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            
            // 生产环境配置
            buildConfigField("String", "API_BASE_URL", "\"https://api.example.com\"")
            buildConfigField("boolean", "DEBUG_MODE", "false")
            
            // 签名配置
            signingConfig = signingConfigs.getByName("release")
        }
    }
    
    // 签名配置
    signingConfigs {
        create("release") {
            storeFile = file("../keystore/release.keystore")
            storePassword = "your_store_password"
            keyAlias = "your_key_alias"
            keyPassword = "your_key_password"
        }
    }
    
    // 产品风味
    flavorDimensions += listOf("environment", "version")
    
    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "ENVIRONMENT", "\"development\"")
        }
        
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            buildConfigField("String", "ENVIRONMENT", "\"staging\"")
        }
        
        create("prod") {
            dimension = "environment"
            buildConfigField("String", "ENVIRONMENT", "\"production\"")
        }
        
        create("free") {
            dimension = "version"
            buildConfigField("boolean", "IS_PREMIUM", "false")
        }
        
        create("premium") {
            dimension = "version"
            buildConfigField("boolean", "IS_PREMIUM", "true")
        }
    }
    
    // 编译选项
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }
    
    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=kotlin.RequiresOptIn",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }
    
    // 构建功能
    buildFeatures {
        buildConfig = true
        viewBinding = true
        dataBinding = true
        compose = true
    }
    
    // Compose 配置
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    
    // 打包选项
    packagingOptions {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
    
    // 测试选项
    testOptions {
        unitTests {
            isIncludeAndroidResources = true
        }
    }
}

dependencies {
    // Android 核心库
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    
    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.6")
    
    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    
    // Hilt 依赖注入
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-compiler:2.48")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    
    // 网络请求
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // 图片加载
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // 数据库
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    
    // 协程
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    
    // 日期处理
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")
    
    // 测试依赖
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.8.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.02.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

## ⚙️ Gradle 配置文件

### gradle.properties

```properties
# Project-wide Gradle settings.

# IDE (e.g. Android Studio) users:
# Gradle settings configured through the IDE *will override*
# any settings specified in this file.

# For more details on how to configure your build environment visit
# http://www.gradle.org/docs/current/userguide/build_environment.html

# Specifies the JVM arguments used for the daemon process.
# The setting is particularly useful for tweaking memory settings.
org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# When configured, Gradle will run in incubating parallel mode.
# This option should only be used with decoupled projects. More details, visit
# http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:decoupled_projects
org.gradle.parallel=true

# AndroidX package structure to make it clearer which packages are bundled with the
# Android operating system, and which are packaged with your app's APK
# https://developer.android.com/topic/libraries/support-library/androidx-rn
android.useAndroidX=true

# Kotlin code style for this project: "official" or "obsolete":
kotlin.code.style=official

# Enables namespacing of each library's R class so that its R class includes only the
# resources declared in the library itself and none from the library's dependencies,
# thereby reducing the size of the R class for that library
android.nonTransitiveRClass=false

# Enable Gradle Configuration Cache
org.gradle.configuration-cache=true

# Enable Gradle Build Cache
org.gradle.caching=true

# Enable incremental annotation processing
kapt.incremental.apt=true
kapt.use.worker.api=true
```

### local.properties

```properties
# This file contains machine-specific properties for the build.
# Do not commit this file to version control.

# Location of the Android SDK
sdk.dir=/Users/username/Library/Android/sdk

# NDK location (if needed)
ndk.dir=/Users/username/Library/Android/sdk/ndk/25.1.8937393

# Keystore properties (for release builds)
RELEASE_STORE_FILE=../keystore/release.keystore
RELEASE_STORE_PASSWORD=your_store_password
RELEASE_KEY_ALIAS=your_key_alias
RELEASE_KEY_PASSWORD=your_key_password

# API keys
MAPS_API_KEY=your_maps_api_key
ANALYTICS_API_KEY=your_analytics_api_key
```

## 🔄 依赖管理

### 依赖类型

```kotlin
dependencies {
    // 编译时和运行时都需要
    implementation("androidx.core:core-ktx:1.12.0")
    
    // 仅编译时需要
    compileOnly("org.projectlombok:lombok:1.18.30")
    
    // 仅运行时需要
    runtimeOnly("mysql:mysql-connector-java:8.0.33")
    
    // API 依赖（会传递给依赖此模块的其他模块）
    api("com.google.gson:gson:2.10.1")
    
    // 测试依赖
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    
    // 调试版本依赖
    debugImplementation("com.squareup.leakcanary:leakcanary-android:2.12")
    
    // 特定构建类型依赖
    releaseImplementation("com.example:release-library:1.0.0")
    
    // 特定产品风味依赖
    devImplementation("com.example:dev-tools:1.0.0")
}
```

### 版本管理

#### 使用 buildSrc

```kotlin
// buildSrc/src/main/kotlin/Dependencies.kt
object Versions {
    const val kotlin = "1.9.20"
    const val compose = "1.5.8"
    const val hilt = "2.48"
    const val retrofit = "2.9.0"
    const val room = "2.6.1"
}

object Dependencies {
    const val coreKtx = "androidx.core:core-ktx:1.12.0"
    const val composeUi = "androidx.compose.ui:ui:${Versions.compose}"
    const val hiltAndroid = "com.google.dagger:hilt-android:${Versions.hilt}"
    const val retrofit = "com.squareup.retrofit2:retrofit:${Versions.retrofit}"
    const val roomRuntime = "androidx.room:room-runtime:${Versions.room}"
}
```

#### 使用版本目录 (Version Catalogs)

```toml
# gradle/libs.versions.toml
[versions]
kotlin = "1.9.20"
compose = "1.5.8"
hilt = "2.48"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version = "1.12.0" }
compose-ui = { group = "androidx.compose.ui", name = "ui", version.ref = "compose" }
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }

[plugins]
android-application = { id = "com.android.application", version = "8.2.0" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }

[bundles]
compose = ["compose-ui", "compose-ui-graphics", "compose-ui-tooling-preview"]
```

## 🏗️ 构建变体

### 构建类型 + 产品风味

```kotlin
// 构建变体组合示例
// buildType: debug, release
// flavor: dev, staging, prod

// 生成的构建变体：
// - devDebug
// - devRelease  
// - stagingDebug
// - stagingRelease
// - prodDebug
// - prodRelease
```

### 资源合并

```
src/
├── main/                    # 基础资源
├── debug/                   # debug 构建类型资源
├── release/                 # release 构建类型资源
├── dev/                     # dev 产品风味资源
├── staging/                 # staging 产品风味资源
├── prod/                    # prod 产品风味资源
├── devDebug/               # dev + debug 组合资源
└── prodRelease/            # prod + release 组合资源
```

## 🚀 构建优化

### Gradle 性能优化

```kotlin
// 在 gradle.properties 中
org.gradle.jvmargs=-Xmx4g -XX:+UseParallelGC
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true
org.gradle.caching=true
org.gradle.configuration-cache=true

// 在 build.gradle.kts 中
android {
    // 启用增量编译
    compileOptions {
        incremental = true
    }
    
    // 减少资源处理时间
    aaptOptions {
        cruncherEnabled = false
    }
}
```

### 依赖优化

```kotlin
dependencies {
    // 使用 BOM 管理版本
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    
    // 排除不需要的传递依赖
    implementation("com.example:library:1.0.0") {
        exclude(group = "com.unwanted", module = "unwanted-module")
    }
    
    // 强制使用特定版本
    implementation("com.example:library:1.0.0") {
        force = true
    }
}
```

## 📝 常用 Gradle 任务

```bash
# 清理项目
./gradlew clean

# 构建 debug 版本
./gradlew assembleDebug

# 构建 release 版本
./gradlew assembleRelease

# 安装 debug 版本到设备
./gradlew installDebug

# 运行单元测试
./gradlew test

# 运行仪器测试
./gradlew connectedAndroidTest

# 生成签名的 APK
./gradlew assembleRelease

# 查看依赖树
./gradlew app:dependencies

# 查看任务列表
./gradlew tasks

# 构建性能分析
./gradlew assembleDebug --profile
```

## 🎯 总结

Gradle 是 Android 开发的核心构建工具：

- ✅ **项目配置**: 管理多模块项目结构
- ✅ **依赖管理**: 自动解析和下载依赖
- ✅ **构建变体**: 支持多环境和多版本构建
- ✅ **性能优化**: 增量构建和缓存机制
- ✅ **自动化**: 支持 CI/CD 集成

掌握 Gradle 将大大提高您的开发效率和项目管理能力。

---

**下一步**: [Activity 生命周期](./activity-lifecycle.md) →
