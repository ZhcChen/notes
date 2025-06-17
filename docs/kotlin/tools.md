# 🛠️ Kotlin 开发工具

本章介绍 Kotlin 开发中常用的工具和 IDE，帮助您提高开发效率和代码质量。

## 🎯 学习目标

- 掌握主流 Kotlin IDE 的使用
- 了解构建工具和依赖管理
- 学会使用调试和性能分析工具
- 掌握代码质量和测试工具

## 💻 集成开发环境 (IDE)

### IntelliJ IDEA
```kotlin
// IntelliJ IDEA 是 Kotlin 的官方 IDE
// 主要特性：
// - 原生 Kotlin 支持
// - 智能代码补全
// - 重构工具
// - 调试器
// - 版本控制集成

// 推荐插件：
// 1. Kotlin Multiplatform Mobile
// 2. Database Tools and SQL
// 3. GitToolBox
// 4. Rainbow Brackets
// 5. Key Promoter X

// 快捷键配置示例
class IDEAShortcuts {
    // Ctrl+Shift+A - 查找动作
    // Ctrl+N - 查找类
    // Ctrl+Shift+N - 查找文件
    // Ctrl+Alt+L - 格式化代码
    // Ctrl+Shift+F10 - 运行当前文件
    // Shift+F6 - 重命名
    // Ctrl+Alt+V - 提取变量
    // Ctrl+Alt+M - 提取方法
}
```

### Android Studio
```kotlin
// Android Studio 配置
// build.gradle.kts (Project level)
buildscript {
    ext.kotlin_version = "1.9.20"
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version")
    }
}

// build.gradle.kts (Module level)
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("kotlin-parcelize")
}

android {
    compileSdk = 34
    
    defaultConfig {
        applicationId = "com.example.myapp"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = "1.8"
        freeCompilerArgs += listOf(
            "-opt-in=kotlin.RequiresOptIn"
        )
    }
    
    buildFeatures {
        compose = true
        viewBinding = true
        dataBinding = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.4"
    }
}

// 有用的 Android Studio 插件
// 1. ADB Idea - ADB 命令快捷操作
// 2. JSON To Kotlin Class - JSON 转 Kotlin 类
// 3. Kotlin Fill Class - 快速填充类属性
// 4. Material Theme UI - 主题美化
```

### Visual Studio Code
```json
// settings.json 配置
{
    "kotlin.languageServer.enabled": true,
    "kotlin.compiler.jvm.target": "1.8",
    "kotlin.completion.snippets.enabled": true,
    "kotlin.linting.enabled": true,
    "kotlin.formatting.enabled": true,
    "files.associations": {
        "*.kt": "kotlin",
        "*.kts": "kotlin"
    }
}

// 推荐扩展
// 1. Kotlin Language - Kotlin 语言支持
// 2. Kotlin IDE - 增强的 Kotlin 支持
// 3. Gradle for Java - Gradle 支持
// 4. GitLens - Git 增强
// 5. Bracket Pair Colorizer - 括号配对
```

## 🔧 构建工具

### Gradle 配置优化
```kotlin
// gradle.properties 性能优化
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
kotlin.code.style=official
kotlin.incremental=true
kotlin.incremental.multiplatform=true
kotlin.parallel.tasks.in.project=true

// build.gradle.kts 优化
plugins {
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.serialization") version "1.9.20"
    id("org.jetbrains.kotlin.plugin.spring") version "1.9.20"
}

// 依赖版本管理
val kotlinVersion = "1.9.20"
val coroutinesVersion = "1.7.3"
val ktorVersion = "2.3.5"

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib:$kotlinVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutinesVersion")
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    
    // 测试依赖
    testImplementation("org.jetbrains.kotlin:kotlin-test:$kotlinVersion")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutinesVersion")
}

// 编译选项
tasks.withType<KotlinCompile> {
    kotlinOptions {
        jvmTarget = "11"
        freeCompilerArgs = listOf(
            "-Xjsr305=strict",
            "-Xjvm-default=all",
            "-opt-in=kotlin.RequiresOptIn"
        )
    }
}

// 自定义任务
tasks.register("generateBuildInfo") {
    doLast {
        val buildInfo = """
            buildTime=${System.currentTimeMillis()}
            version=${project.version}
            kotlinVersion=$kotlinVersion
        """.trimIndent()
        
        file("src/main/resources/build.properties").writeText(buildInfo)
    }
}

tasks.named("compileKotlin") {
    dependsOn("generateBuildInfo")
}
```

### Maven 配置
```xml
<!-- pom.xml Kotlin 配置 -->
<properties>
    <kotlin.version>1.9.20</kotlin.version>
    <kotlin.code.style>official</kotlin.code.style>
    <junit.version>5.9.3</junit.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.jetbrains.kotlin</groupId>
        <artifactId>kotlin-stdlib</artifactId>
        <version>${kotlin.version}</version>
    </dependency>
    
    <dependency>
        <groupId>org.jetbrains.kotlinx</groupId>
        <artifactId>kotlinx-coroutines-core</artifactId>
        <version>1.7.3</version>
    </dependency>
</dependencies>

<build>
    <sourceDirectory>src/main/kotlin</sourceDirectory>
    <testSourceDirectory>src/test/kotlin</testSourceDirectory>
    
    <plugins>
        <plugin>
            <groupId>org.jetbrains.kotlin</groupId>
            <artifactId>kotlin-maven-plugin</artifactId>
            <version>${kotlin.version}</version>
            <executions>
                <execution>
                    <id>compile</id>
                    <phase>compile</phase>
                    <goals>
                        <goal>compile</goal>
                    </goals>
                </execution>
                <execution>
                    <id>test-compile</id>
                    <phase>test-compile</phase>
                    <goals>
                        <goal>test-compile</goal>
                    </goals>
                </execution>
            </executions>
            <configuration>
                <jvmTarget>11</jvmTarget>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## 🐛 调试工具

### 调试技巧
```kotlin
// 调试最佳实践
class DebuggingExample {
    
    // 1. 使用断点
    fun calculateSum(numbers: List<Int>): Int {
        var sum = 0
        for (number in numbers) {  // 在这里设置断点
            sum += number
        }
        return sum  // 在这里设置断点查看结果
    }
    
    // 2. 条件断点
    fun processItems(items: List<String>) {
        items.forEachIndexed { index, item ->
            // 条件断点：index == 5
            println("处理第 $index 个项目：$item")
        }
    }
    
    // 3. 日志断点（不停止执行）
    fun logExample(data: String) {
        // 在 IDE 中设置日志断点，输出变量值
        val processed = data.uppercase()
        println("处理结果：$processed")
    }
    
    // 4. 异常断点
    fun riskyOperation(input: String): Int {
        return try {
            input.toInt()  // 可能抛出 NumberFormatException
        } catch (e: NumberFormatException) {
            // 在异常处设置断点
            println("转换失败：${e.message}")
            0
        }
    }
}

// 调试协程
class CoroutineDebugging {
    
    suspend fun debugCoroutines() {
        // 启用协程调试
        // VM 选项：-Dkotlinx.coroutines.debug
        
        coroutineScope {
            launch {
                delay(1000)
                println("协程 1 完成")  // 设置断点
            }
            
            launch {
                delay(2000)
                println("协程 2 完成")  // 设置断点
            }
        }
    }
}
```

### 性能分析
```kotlin
// 内置性能分析
class PerformanceProfiling {
    
    // 1. 时间测量
    fun measureExecutionTime() {
        val startTime = System.currentTimeMillis()
        
        // 执行代码
        heavyComputation()
        
        val endTime = System.currentTimeMillis()
        println("执行时间：${endTime - startTime}ms")
    }
    
    // 2. 内存使用监控
    fun monitorMemoryUsage() {
        val runtime = Runtime.getRuntime()
        
        val beforeMemory = runtime.totalMemory() - runtime.freeMemory()
        
        // 执行代码
        createLargeDataStructure()
        
        val afterMemory = runtime.totalMemory() - runtime.freeMemory()
        println("内存使用增加：${(afterMemory - beforeMemory) / 1024 / 1024}MB")
    }
    
    // 3. 使用 JProfiler 或 YourKit
    fun profileWithTools() {
        // 在 IDE 中配置 Profiler
        // Run -> Profile -> Edit Configurations
        // 添加 JVM 参数进行性能分析
    }
    
    private fun heavyComputation() {
        repeat(1000000) {
            Math.sqrt(it.toDouble())
        }
    }
    
    private fun createLargeDataStructure() {
        val largeList = (1..1000000).toList()
        // 使用 largeList
    }
}
```

## 📊 代码质量工具

### Detekt 静态分析
```kotlin
// build.gradle.kts 配置 Detekt
plugins {
    id("io.gitlab.arturbosch.detekt") version "1.23.3"
}

detekt {
    toolVersion = "1.23.3"
    config = files("config/detekt/detekt.yml")
    buildUponDefaultConfig = true
    autoCorrect = true
    
    reports {
        html.required.set(true)
        xml.required.set(true)
        txt.required.set(true)
        sarif.required.set(true)
    }
}

dependencies {
    detektPlugins("io.gitlab.arturbosch.detekt:detekt-formatting:1.23.3")
}

// detekt.yml 配置示例
/*
complexity:
  ComplexMethod:
    threshold: 15
  LongMethod:
    threshold: 60
  TooManyFunctions:
    thresholdInFiles: 20

style:
  MaxLineLength:
    maxLineLength: 120
  FunctionNaming:
    functionPattern: '[a-z][a-zA-Z0-9]*'
*/
```

### KtLint 代码格式化
```kotlin
// build.gradle.kts 配置 KtLint
plugins {
    id("org.jlleitschuh.gradle.ktlint") version "11.6.1"
}

ktlint {
    version.set("0.50.0")
    debug.set(true)
    verbose.set(true)
    android.set(false)
    outputToConsole.set(true)
    outputColorName.set("RED")
    ignoreFailures.set(false)
    
    filter {
        exclude("**/generated/**")
        include("**/kotlin/**")
    }
}

// .editorconfig 配置
/*
[*.{kt,kts}]
indent_style = space
indent_size = 4
continuation_indent_size = 4
max_line_length = 120
insert_final_newline = true
*/
```

### SonarQube 集成
```kotlin
// build.gradle.kts 配置 SonarQube
plugins {
    id("org.sonarqube") version "4.4.1.3373"
    jacoco
}

sonarqube {
    properties {
        property("sonar.projectKey", "my-kotlin-project")
        property("sonar.organization", "my-org")
        property("sonar.host.url", "https://sonarcloud.io")
        property("sonar.coverage.jacoco.xmlReportPaths", "build/reports/jacoco/test/jacocoTestReport.xml")
        property("sonar.kotlin.detekt.reportPaths", "build/reports/detekt/detekt.xml")
    }
}

jacoco {
    toolVersion = "0.8.8"
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}
```

## 🧪 测试工具

### 测试框架配置
```kotlin
// build.gradle.kts 测试依赖
dependencies {
    // JUnit 5
    testImplementation("org.junit.jupiter:junit-jupiter:5.9.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    
    // Kotlin 测试
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    
    // MockK
    testImplementation("io.mockk:mockk:1.13.8")
    
    // 协程测试
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    
    // AssertJ
    testImplementation("org.assertj.core:assertj-core:3.24.2")
    
    // Testcontainers
    testImplementation("org.testcontainers:junit-jupiter:1.19.1")
    testImplementation("org.testcontainers:postgresql:1.19.1")
}

tasks.test {
    useJUnitPlatform()
    
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = true
    }
    
    // 并行测试
    systemProperty("junit.jupiter.execution.parallel.enabled", "true")
    systemProperty("junit.jupiter.execution.parallel.mode.default", "concurrent")
}
```

### 测试覆盖率
```kotlin
// JaCoCo 配置
tasks.jacocoTestReport {
    dependsOn(tasks.test)
    
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }
    
    finalizedBy(tasks.jacocoTestCoverageVerification)
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()  // 80% 覆盖率
            }
        }
        
        rule {
            enabled = true
            element = "CLASS"
            
            limit {
                counter = "BRANCH"
                value = "COVEREDRATIO"
                minimum = "0.70".toBigDecimal()
            }
        }
    }
}
```

## 📦 包管理和发布

### 发布到 Maven Central
```kotlin
// build.gradle.kts 发布配置
plugins {
    `maven-publish`
    signing
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            
            pom {
                name.set("My Kotlin Library")
                description.set("A useful Kotlin library")
                url.set("https://github.com/username/my-kotlin-library")
                
                licenses {
                    license {
                        name.set("The Apache License, Version 2.0")
                        url.set("http://www.apache.org/licenses/LICENSE-2.0.txt")
                    }
                }
                
                developers {
                    developer {
                        id.set("username")
                        name.set("Your Name")
                        email.set("your.email@example.com")
                    }
                }
                
                scm {
                    connection.set("scm:git:git://github.com/username/my-kotlin-library.git")
                    developerConnection.set("scm:git:ssh://github.com:username/my-kotlin-library.git")
                    url.set("https://github.com/username/my-kotlin-library/tree/main")
                }
            }
        }
    }
    
    repositories {
        maven {
            name = "sonatype"
            url = uri("https://s01.oss.sonatype.org/service/local/staging/deploy/maven2/")
            credentials {
                username = project.findProperty("ossrhUsername") as String? ?: ""
                password = project.findProperty("ossrhPassword") as String? ?: ""
            }
        }
    }
}

signing {
    sign(publishing.publications["maven"])
}
```

## 🔄 持续集成

### GitHub Actions 配置
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        kotlin-version: [1.9.20]
        java-version: [11, 17]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK ${{ matrix.java-version }}
      uses: actions/setup-java@v3
      with:
        java-version: ${{ matrix.java-version }}
        distribution: 'temurin'
    
    - name: Cache Gradle packages
      uses: actions/cache@v3
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        restore-keys: |
          ${{ runner.os }}-gradle-
    
    - name: Grant execute permission for gradlew
      run: chmod +x gradlew
    
    - name: Run tests
      run: ./gradlew test
    
    - name: Run Detekt
      run: ./gradlew detekt
    
    - name: Generate test report
      run: ./gradlew jacocoTestReport
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./build/reports/jacoco/test/jacocoTestReport.xml
```

## 🎯 开发工作流

### Git 工作流
```bash
# 推荐的 Git 工作流
# 1. 功能分支
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 2. 代码审查
# 创建 Pull Request
# 运行 CI/CD 检查
# 代码审查通过后合并

# 3. 发布流程
git checkout main
git pull origin main
git tag v1.0.0
git push origin v1.0.0

# Git hooks 配置
# .git/hooks/pre-commit
#!/bin/sh
./gradlew ktlintCheck detekt test
```

### 开发环境配置
```kotlin
// 开发环境最佳实践
class DevelopmentSetup {
    
    // 1. 环境变量配置
    fun setupEnvironment() {
        // ~/.bashrc 或 ~/.zshrc
        // export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
        // export KOTLIN_HOME=/opt/kotlinc
        // export PATH=$PATH:$KOTLIN_HOME/bin
    }
    
    // 2. IDE 配置同步
    fun syncIDESettings() {
        // 使用 IDE Settings Sync 插件
        // 或者将 .idea 目录加入版本控制（部分文件）
    }
    
    // 3. 代码模板
    fun setupCodeTemplates() {
        // File -> Settings -> Editor -> Live Templates
        // 创建常用的代码模板
    }
}
```

## 🎯 最佳实践

### 1. 工具链选择
- **IDE**: IntelliJ IDEA Ultimate（推荐）或 Android Studio
- **构建工具**: Gradle（推荐）或 Maven
- **代码质量**: Detekt + KtLint + SonarQube
- **测试**: JUnit 5 + MockK + Testcontainers
- **CI/CD**: GitHub Actions 或 GitLab CI

### 2. 开发效率提升
- 使用代码模板和 Live Templates
- 配置快捷键和宏
- 使用版本控制集成
- 启用自动导入和格式化
- 使用调试器而不是 println

### 3. 团队协作
- 统一代码风格配置
- 使用共享的 IDE 设置
- 建立代码审查流程
- 自动化测试和部署
- 文档和知识分享

## 🎯 下一步

掌握开发工具后，您可以继续学习：

1. [Web 开发](./web-development.md)
2. [多平台开发](./multiplatform.md)
3. [Android 开发](./android-development.md)

---

*好的工具是高效开发的基础，选择合适的工具并熟练使用将大大提升您的开发体验！*
