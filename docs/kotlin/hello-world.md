# 👋 第一个 Kotlin 程序

欢迎来到 Kotlin 编程的第一步！本章将带您创建并运行第一个 Kotlin 程序，了解基本的项目结构和开发流程。

## 🎯 学习目标

- 创建第一个 Kotlin 程序
- 理解 Kotlin 程序的基本结构
- 学会编译和运行 Kotlin 代码
- 了解不同的运行方式

## 📝 Hello World 程序

### 最简单的程序
创建一个名为 `Hello.kt` 的文件：

```kotlin
fun main() {
    println("Hello, World!")
}
```

### 程序解析
```kotlin
fun main() {           // 1. 程序入口点
    println("Hello, World!")  // 2. 输出语句
}                      // 3. 函数结束
```

**代码说明：**
1. `fun main()`：程序的入口点，类似于 Java 的 `public static void main(String[] args)`
2. `println()`：输出函数，会在末尾添加换行符
3. 不需要分号结尾（可选）
4. 不需要类包装（与 Java 不同）

## 🔧 编译和运行

### 方法一：命令行编译
```bash
# 编译 Kotlin 文件
kotlinc Hello.kt -include-runtime -d Hello.jar

# 运行编译后的程序
java -jar Hello.jar
```

### 方法二：直接运行脚本
```bash
# 直接运行 Kotlin 脚本
kotlin Hello.kt
```

### 方法三：使用 IDE
```
1. 在 IntelliJ IDEA 中打开文件
2. 点击行号旁的绿色三角形
3. 或者使用快捷键 Ctrl+Shift+F10 (Windows/Linux) 或 Cmd+Shift+R (macOS)
```

## 🏗️ 项目结构

### 创建标准项目
```bash
# 创建项目目录
mkdir hello-kotlin
cd hello-kotlin

# 创建源码目录
mkdir -p src/main/kotlin
mkdir -p src/test/kotlin
```

### 项目文件结构
```
hello-kotlin/
├── build.gradle.kts          # Gradle 构建文件
├── src/
│   ├── main/
│   │   └── kotlin/
│   │       └── Main.kt       # 主程序文件
│   └── test/
│       └── kotlin/
│           └── MainTest.kt   # 测试文件
└── gradle/
    └── wrapper/
```

### 创建 Main.kt
```kotlin
// src/main/kotlin/Main.kt
fun main() {
    println("Hello, Kotlin!")
    println("欢迎来到 Kotlin 世界！")
    
    // 调用其他函数
    greetUser("张三")
    showNumbers()
}

fun greetUser(name: String) {
    println("你好，$name！")
}

fun showNumbers() {
    println("数字 1 到 5：")
    for (i in 1..5) {
        println("数字：$i")
    }
}
```

## 📦 使用 Gradle 构建

### 创建 build.gradle.kts
```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "1.9.20"
    application
}

group = "com.example"
version = "1.0.0"

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

tasks.test {
    useJUnitPlatform()
}
```

### Gradle 命令
```bash
# 编译项目
./gradlew build

# 运行程序
./gradlew run

# 清理构建
./gradlew clean

# 查看任务
./gradlew tasks
```

## 🎨 程序变体

### 带参数的 main 函数
```kotlin
fun main(args: Array<String>) {
    println("Hello, World!")
    
    if (args.isNotEmpty()) {
        println("传入的参数：")
        args.forEachIndexed { index, arg ->
            println("参数 $index: $arg")
        }
    } else {
        println("没有传入参数")
    }
}
```

### 面向对象版本
```kotlin
class Greeter(private val name: String) {
    fun greet() {
        println("Hello, $name!")
    }
}

fun main() {
    val greeter = Greeter("Kotlin")
    greeter.greet()
    
    // 创建多个实例
    val greetings = listOf("World", "Kotlin", "开发者")
    greetings.forEach { name ->
        Greeter(name).greet()
    }
}
```

### 函数式编程版本
```kotlin
fun main() {
    val names = listOf("Alice", "Bob", "Charlie", "小明", "小红")
    
    // 使用高阶函数
    names
        .filter { it.length > 3 }
        .map { "Hello, $it!" }
        .forEach { println(it) }
    
    // 使用 lambda 表达式
    val greeting = { name: String -> "你好，$name！" }
    names.forEach { println(greeting(it)) }
}
```

## 🔍 代码解析

### Kotlin 特性展示
```kotlin
fun main() {
    // 1. 类型推断
    val message = "Hello, Kotlin!"  // 自动推断为 String
    val number = 42                 // 自动推断为 Int
    
    // 2. 字符串模板
    val name = "Kotlin"
    println("欢迎使用 $name 编程语言！")
    println("2 + 3 = ${2 + 3}")
    
    // 3. 空安全
    var nullableString: String? = null
    println("长度：${nullableString?.length ?: 0}")
    
    // 4. 扩展函数
    fun String.addExclamation() = this + "!"
    println("Hello".addExclamation())
    
    // 5. 数据类
    data class Person(val name: String, val age: Int)
    val person = Person("张三", 25)
    println(person)
}
```

## 🚀 运行方式对比

### 命令行运行
```bash
# 优点：简单直接，适合学习
# 缺点：每次都需要手动编译

kotlinc Hello.kt -include-runtime -d Hello.jar
java -jar Hello.jar
```

### IDE 运行
```
优点：
- 一键运行
- 调试支持
- 代码提示
- 错误检查

缺点：
- 需要安装 IDE
- 资源占用较大
```

### Gradle 运行
```bash
# 优点：
# - 依赖管理
# - 构建自动化
# - 多模块支持
# - 测试集成

./gradlew run
```

## 🎯 实践练习

### 练习 1：个人信息
创建一个程序，输出您的个人信息：

```kotlin
fun main() {
    val name = "你的姓名"
    val age = 25
    val city = "你的城市"
    
    println("姓名：$name")
    println("年龄：$age")
    println("城市：$city")
}
```

### 练习 2：简单计算器
```kotlin
fun main() {
    val a = 10
    val b = 5
    
    println("$a + $b = ${a + b}")
    println("$a - $b = ${a - b}")
    println("$a * $b = ${a * b}")
    println("$a / $b = ${a / b}")
}
```

### 练习 3：循环输出
```kotlin
fun main() {
    println("倒计时：")
    for (i in 10 downTo 1) {
        println(i)
    }
    println("发射！🚀")
}
```

## 🔧 常见问题

### 问题 1：编译错误
```
错误：kotlinc: command not found
解决：检查 Kotlin 是否正确安装，PATH 环境变量是否配置
```

### 问题 2：中文乱码
```kotlin
// 确保文件编码为 UTF-8
fun main() {
    println("你好，世界！")  // 应该正常显示中文
}
```

### 问题 3：找不到主类
```
错误：找不到或无法加载主类
解决：检查文件名和类名是否匹配，确保编译成功
```

## 📚 扩展阅读

### 与 Java 对比
```java
// Java 版本
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

```kotlin
// Kotlin 版本
fun main() {
    println("Hello, World!")
}
```

**Kotlin 的简化：**
- 不需要类包装
- 不需要 public static
- 更简洁的函数语法
- 自动导入常用函数

## 🎯 下一步

完成第一个程序后，您可以继续学习：

1. [Gradle 构建工具](./gradle.md)
2. [变量与数据类型](./variables-types.md)
3. [基础语法](./basic-syntax.md)

---

*恭喜您完成了第一个 Kotlin 程序！现在让我们深入学习 Kotlin 的语法特性。*
