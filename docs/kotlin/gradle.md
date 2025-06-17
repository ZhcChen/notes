# 🏗️ Gradle 构建工具

Gradle 是 Kotlin 项目的首选构建工具，提供了强大的依赖管理、构建自动化和多模块支持。本章将详细介绍如何在 Kotlin 项目中使用 Gradle。

## 🎯 学习目标

- 理解 Gradle 的基本概念
- 掌握 Kotlin DSL 构建脚本
- 学会依赖管理
- 了解常用 Gradle 任务

## 📋 Gradle 基础

### 什么是 Gradle？
Gradle 是一个开源的构建自动化工具，具有以下特点：
- **灵活性**：支持多种编程语言
- **性能**：增量构建和构建缓存
- **可扩展性**：丰富的插件生态系统
- **易用性**：简洁的 DSL 语法

### 核心概念
- **Project**：构建的基本单位
- **Task**：构建的基本执行单元
- **Plugin**：扩展 Gradle 功能的组件
- **Dependency**：项目依赖的外部库

## 🚀 项目初始化

### 使用 Gradle 创建项目
```bash
# 创建新的 Kotlin 应用项目
gradle init --type kotlin-application

# 创建新的 Kotlin 库项目
gradle init --type kotlin-library

# 交互式创建项目
gradle init
```

### 项目结构
```
my-kotlin-app/
├── build.gradle.kts          # 主构建脚本
├── settings.gradle.kts       # 项目设置
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew                   # Unix 包装脚本
├── gradlew.bat              # Windows 包装脚本
└── src/
    ├── main/
    │   ├── kotlin/          # 主要源码
    │   └── resources/       # 资源文件
    └── test/
        ├── kotlin/          # 测试代码
        └── resources/       # 测试资源
```

## 📝 构建脚本配置

### build.gradle.kts 基本结构
```kotlin
// build.gradle.kts
plugins {
    // 应用插件
    kotlin("jvm") version "1.9.20"
    application
}

group = "com.example"
version = "1.0.0"

repositories {
    // 配置仓库
    mavenCentral()
}

dependencies {
    // 配置依赖
    implementation(kotlin("stdlib"))
    testImplementation(kotlin("test"))
}

application {
    // 应用配置
    mainClass.set("com.example.MainKt")
}
```

### 插件配置
```kotlin
plugins {
    // Kotlin JVM 插件
    kotlin("jvm") version "1.9.20"
    
    // 应用插件
    application
    
    // 序列化插件
    kotlin("plugin.serialization") version "1.9.20"
    
    // Spring Boot 插件
    id("org.springframework.boot") version "3.1.0"
    
    // 发布插件
    `maven-publish`
}
```

### 仓库配置
```kotlin
repositories {
    // Maven 中央仓库
    mavenCentral()
    
    // Google 仓库
    google()
    
    // JCenter 仓库（已弃用）
    // jcenter()
    
    // 自定义仓库
    maven {
        url = uri("https://repo.example.com/maven")
    }
    
    // 本地仓库
    mavenLocal()
}
```

## 📦 依赖管理

### 依赖类型
```kotlin
dependencies {
    // 编译和运行时依赖
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // 仅编译时依赖
    compileOnly("org.jetbrains:annotations:24.0.1")
    
    // 仅运行时依赖
    runtimeOnly("mysql:mysql-connector-java:8.0.33")
    
    // 测试依赖
    testImplementation("org.junit.jupiter:junit-jupiter:5.9.3")
    testImplementation(kotlin("test"))
    
    // 测试运行时依赖
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
```

### 版本管理
```kotlin
// 使用版本目录
dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            library("kotlinx-coroutines", "org.jetbrains.kotlinx", "kotlinx-coroutines-core").version("1.7.3")
            library("junit", "org.junit.jupiter", "junit-jupiter").version("5.9.3")
        }
    }
}

// 在 build.gradle.kts 中使用
dependencies {
    implementation(libs.kotlinx.coroutines)
    testImplementation(libs.junit)
}
```

### 依赖约束
```kotlin
dependencies {
    // 强制版本
    implementation("com.fasterxml.jackson.core:jackson-core") {
        version {
            strictly("2.15.2")
        }
    }
    
    // 排除传递依赖
    implementation("org.springframework:spring-core") {
        exclude(group = "commons-logging", module = "commons-logging")
    }
}
```

## ⚙️ 任务配置

### 常用任务
```bash
# 编译项目
./gradlew build

# 运行应用
./gradlew run

# 运行测试
./gradlew test

# 清理构建
./gradlew clean

# 查看依赖
./gradlew dependencies

# 查看任务
./gradlew tasks
```

### 自定义任务
```kotlin
// 创建自定义任务
tasks.register("hello") {
    doLast {
        println("Hello from Gradle!")
    }
}

// 配置现有任务
tasks.named<Test>("test") {
    useJUnitPlatform()
    
    testLogging {
        events("passed", "skipped", "failed")
    }
}

// 任务依赖
tasks.register("customBuild") {
    dependsOn("clean", "build")
    
    doLast {
        println("Custom build completed!")
    }
}
```

### 编译配置
```kotlin
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        // JVM 目标版本
        jvmTarget = "11"
        
        // 启用实验性功能
        freeCompilerArgs = listOf("-Xjsr305=strict")
        
        // 语言版本
        languageVersion = "1.9"
        apiVersion = "1.9"
    }
}
```

## 🔧 高级配置

### 多模块项目
```kotlin
// settings.gradle.kts
rootProject.name = "my-kotlin-project"

include(
    ":core",
    ":web",
    ":android"
)
```

```kotlin
// core/build.gradle.kts
plugins {
    kotlin("jvm")
}

dependencies {
    implementation(kotlin("stdlib"))
}
```

```kotlin
// web/build.gradle.kts
plugins {
    kotlin("jvm")
    application
}

dependencies {
    implementation(project(":core"))
    implementation("org.springframework.boot:spring-boot-starter-web")
}
```

### 源码集配置
```kotlin
sourceSets {
    main {
        kotlin {
            srcDirs("src/main/kotlin", "src/generated/kotlin")
        }
        resources {
            srcDirs("src/main/resources")
        }
    }
    
    test {
        kotlin {
            srcDirs("src/test/kotlin")
        }
    }
    
    // 自定义源码集
    create("integration") {
        kotlin {
            srcDirs("src/integration/kotlin")
        }
    }
}
```

### 构建变体
```kotlin
// 配置不同的构建类型
configurations {
    create("developmentOnly")
    create("productionOnly")
}

dependencies {
    "developmentOnly"("org.springframework.boot:spring-boot-devtools")
    "productionOnly"("org.springframework.boot:spring-boot-starter-actuator")
}
```

## 📊 性能优化

### Gradle 配置
```properties
# gradle.properties
# 启用并行构建
org.gradle.parallel=true

# 启用构建缓存
org.gradle.caching=true

# 配置 JVM 参数
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m

# 启用配置缓存
org.gradle.configuration-cache=true

# Kotlin 编译器守护进程
kotlin.compiler.execution.strategy=in-process
```

### 增量编译
```kotlin
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    incremental = true
}
```

## 🧪 测试配置

### JUnit 5 配置
```kotlin
dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.9.3")
    testImplementation("org.junit.jupiter:junit-jupiter-params:5.9.3")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.9.3")
    
    // Kotlin 测试
    testImplementation(kotlin("test"))
    testImplementation(kotlin("test-junit5"))
}

tasks.named<Test>("test") {
    useJUnitPlatform()
    
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = true
    }
    
    // 并行测试
    maxParallelForks = Runtime.getRuntime().availableProcessors()
}
```

### 测试报告
```kotlin
tasks.test {
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}
```

## 📦 打包和发布

### JAR 配置
```kotlin
tasks.jar {
    manifest {
        attributes(
            "Main-Class" to "com.example.MainKt",
            "Implementation-Title" to project.name,
            "Implementation-Version" to project.version
        )
    }
    
    // 包含依赖的 Fat JAR
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) })
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
```

### 发布配置
```kotlin
publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            
            pom {
                name.set("My Kotlin Library")
                description.set("A sample Kotlin library")
                url.set("https://github.com/example/my-kotlin-lib")
                
                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }
            }
        }
    }
    
    repositories {
        maven {
            url = uri("https://repo.example.com/maven")
            credentials {
                username = project.findProperty("repoUsername") as String?
                password = project.findProperty("repoPassword") as String?
            }
        }
    }
}
```

## 🔍 调试和故障排除

### 常用调试命令
```bash
# 详细输出
./gradlew build --info

# 调试模式
./gradlew build --debug

# 性能分析
./gradlew build --profile

# 依赖分析
./gradlew dependencyInsight --dependency kotlin-stdlib

# 构建扫描
./gradlew build --scan
```

### 常见问题
```kotlin
// 问题：依赖冲突
// 解决：查看依赖树并排除冲突依赖
./gradlew dependencies --configuration runtimeClasspath

// 问题：编译错误
// 解决：检查 Kotlin 版本兼容性
kotlin {
    jvmToolchain(11)
}
```

## 🎯 最佳实践

### 项目组织
1. **模块化**：将大项目拆分为多个模块
2. **版本管理**：使用版本目录统一管理依赖版本
3. **构建缓存**：启用 Gradle 构建缓存提高性能
4. **并行构建**：利用多核 CPU 加速构建

### 脚本编写
1. **使用 Kotlin DSL**：类型安全的构建脚本
2. **提取公共配置**：使用 `buildSrc` 或约定插件
3. **文档化**：为自定义任务添加描述
4. **测试**：为构建逻辑编写测试

## 🎯 下一步

掌握 Gradle 基础后，您可以继续学习：

1. [变量与数据类型](./variables-types.md)
2. [基础语法](./basic-syntax.md)
3. [函数](./functions.md)

---

*现在您已经掌握了 Gradle 构建工具，让我们开始学习 Kotlin 的语法特性！*
