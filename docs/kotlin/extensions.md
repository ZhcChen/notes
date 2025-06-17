# 🔧 Kotlin 扩展函数

扩展函数是 Kotlin 的一个强大特性，允许您为现有类添加新功能而无需修改其源代码或使用继承。

## 🎯 学习目标

- 掌握扩展函数的定义和使用
- 理解扩展属性的概念
- 学会扩展函数的作用域和可见性
- 了解扩展函数的实际应用场景

## 📝 扩展函数基础

### 基本语法
```kotlin
// 为 String 类添加扩展函数
fun String.isPalindrome(): Boolean {
    val cleaned = this.lowercase().replace(" ", "")
    return cleaned == cleaned.reversed()
}

// 为 Int 类添加扩展函数
fun Int.isEven(): Boolean = this % 2 == 0

fun Int.isOdd(): Boolean = this % 2 != 0

// 为 List 添加扩展函数
fun <T> List<T>.secondOrNull(): T? {
    return if (this.size >= 2) this[1] else null
}

fun main() {
    // 使用扩展函数
    println("level".isPalindrome())        // true
    println("hello world".isPalindrome())  // false
    
    println("4 是偶数：${4.isEven()}")      // true
    println("5 是奇数：${5.isOdd()}")       // true
    
    val list = listOf("a", "b", "c")
    println("第二个元素：${list.secondOrNull()}")  // b
    
    val shortList = listOf("x")
    println("第二个元素：${shortList.secondOrNull()}")  // null
}
```

### 扩展函数的本质
```kotlin
// 扩展函数实际上是静态函数
fun String.addExclamation(): String {
    return this + "!"
}

// 编译后等价于：
// fun addExclamation(receiver: String): String {
//     return receiver + "!"
// }

fun main() {
    val text = "Hello"
    
    // 两种调用方式等价
    println(text.addExclamation())  // Hello!
    // println(addExclamation(text))  // 实际的调用方式
}
```

## 🏷️ 扩展属性

### 扩展属性定义
```kotlin
// 为 String 添加扩展属性
val String.lastIndex: Int
    get() = this.length - 1

val String.isBlank: Boolean
    get() = this.trim().isEmpty()

// 为 List 添加扩展属性
val <T> List<T>.lastIndex: Int
    get() = this.size - 1

val <T> List<T>.penultimate: T?
    get() = if (this.size >= 2) this[this.size - 2] else null

// 可变扩展属性（需要后备字段的替代方案）
var StringBuilder.lastChar: Char
    get() = this[this.length - 1]
    set(value) {
        this.setCharAt(this.length - 1, value)
    }

fun main() {
    val text = "Hello"
    println("最后一个索引：${text.lastIndex}")  // 4
    println("是否为空白：${"   ".isBlank}")     // true
    
    val numbers = listOf(1, 2, 3, 4, 5)
    println("列表最后索引：${numbers.lastIndex}")     // 4
    println("倒数第二个元素：${numbers.penultimate}")  // 4
    
    val sb = StringBuilder("Hello")
    println("最后一个字符：${sb.lastChar}")  // o
    sb.lastChar = '!'
    println("修改后：$sb")  // Hell!
}
```

## 🎯 实用扩展函数

### 字符串扩展
```kotlin
// 字符串处理扩展
fun String.wordCount(): Int = this.split("\\s+".toRegex()).size

fun String.reverseWords(): String = this.split(" ").reversed().joinToString(" ")

fun String.toTitleCase(): String = this.split(" ").joinToString(" ") { 
    it.replaceFirstChar { char -> char.uppercase() } 
}

fun String.removeWhitespace(): String = this.replace("\\s".toRegex(), "")

fun String.isValidEmail(): Boolean {
    val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()
    return this.matches(emailRegex)
}

fun String.truncate(maxLength: Int, suffix: String = "..."): String {
    return if (this.length <= maxLength) this
    else this.take(maxLength - suffix.length) + suffix
}

fun main() {
    val text = "hello world kotlin programming"
    
    println("原文：$text")
    println("单词数：${text.wordCount()}")
    println("反转单词：${text.reverseWords()}")
    println("标题格式：${text.toTitleCase()}")
    println("移除空格：${text.removeWhitespace()}")
    
    val email = "test@example.com"
    println("邮箱验证：${email.isValidEmail()}")
    
    val longText = "这是一个很长的文本内容"
    println("截断：${longText.truncate(8)}")
}
```

### 集合扩展
```kotlin
// 集合操作扩展
fun <T> List<T>.chunked(size: Int): List<List<T>> {
    return this.windowed(size, size, true)
}

fun <T> List<T>.takeRandom(count: Int): List<T> {
    return this.shuffled().take(count)
}

fun <T> MutableList<T>.swap(index1: Int, index2: Int) {
    val temp = this[index1]
    this[index1] = this[index2]
    this[index2] = temp
}

fun <T> List<T>.frequencies(): Map<T, Int> {
    return this.groupingBy { it }.eachCount()
}

fun <T> List<T>.duplicates(): List<T> {
    return this.groupingBy { it }
        .eachCount()
        .filter { it.value > 1 }
        .keys
        .toList()
}

fun main() {
    val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    
    // 分块
    val chunks = numbers.chunked(3)
    println("分块：$chunks")  // [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
    
    // 随机取样
    val random = numbers.takeRandom(3)
    println("随机3个：$random")
    
    // 交换元素
    val mutableNumbers = mutableListOf(1, 2, 3, 4, 5)
    mutableNumbers.swap(0, 4)
    println("交换后：$mutableNumbers")  // [5, 2, 3, 4, 1]
    
    // 频率统计
    val items = listOf("a", "b", "a", "c", "b", "a")
    println("频率：${items.frequencies()}")  // {a=3, b=2, c=1}
    println("重复项：${items.duplicates()}")  // [a, b]
}
```

### 数字扩展
```kotlin
// 数字处理扩展
fun Int.factorial(): Long {
    return if (this <= 1) 1L else this * (this - 1).factorial()
}

fun Int.isPrime(): Boolean {
    if (this < 2) return false
    for (i in 2..Math.sqrt(this.toDouble()).toInt()) {
        if (this % i == 0) return false
    }
    return true
}

fun Double.round(decimals: Int): Double {
    val factor = Math.pow(10.0, decimals.toDouble())
    return Math.round(this * factor) / factor
}

fun Int.times(action: () -> Unit) {
    repeat(this) { action() }
}

fun Int.times(action: (Int) -> Unit) {
    repeat(this) { action(it) }
}

fun main() {
    println("5! = ${5.factorial()}")        // 120
    println("17 是质数：${17.isPrime()}")     // true
    println("18 是质数：${18.isPrime()}")     // false
    
    val pi = 3.14159265359
    println("π 保留2位：${pi.round(2)}")     // 3.14
    
    // 重复执行
    3.times { println("Hello") }
    
    3.times { index -> println("索引：$index") }
}
```

## 🔍 扩展函数的作用域

### 顶层扩展函数
```kotlin
// 在文件顶层定义的扩展函数，全局可用
fun String.capitalize(): String = 
    this.replaceFirstChar { it.uppercase() }

// 在类内部定义的扩展函数
class StringUtils {
    fun String.addPrefix(prefix: String): String = "$prefix$this"
    
    fun processString(input: String): String {
        // 只能在类内部使用
        return input.addPrefix("[处理] ")
    }
}

// 在函数内部定义的扩展函数
fun demonstrateLocalExtensions() {
    fun Int.square(): Int = this * this
    
    val number = 5
    println("${number}的平方是：${number.square()}")
    // square() 只在这个函数内可用
}

fun main() {
    println("hello".capitalize())  // Hello
    
    val utils = StringUtils()
    println(utils.processString("测试"))  // [处理] 测试
    
    demonstrateLocalExtensions()
}
```

### 扩展函数的可见性
```kotlin
// 私有扩展函数
private fun String.secretFunction(): String = "秘密：$this"

// 内部扩展函数
internal fun String.internalFunction(): String = "内部：$this"

// 公共扩展函数（默认）
fun String.publicFunction(): String = "公共：$this"

class ExtensionDemo {
    // 类内部的扩展函数
    private fun String.classPrivateExtension(): String = "类私有：$this"
    
    fun useExtensions() {
        val text = "测试"
        println(text.secretFunction())        // 可以访问
        println(text.classPrivateExtension()) // 可以访问
    }
}
```

## 🎨 高级扩展技巧

### 泛型扩展函数
```kotlin
// 泛型扩展函数
fun <T> T.applyIf(condition: Boolean, block: T.() -> T): T {
    return if (condition) this.block() else this
}

fun <T> T.also(block: (T) -> Unit): T {
    block(this)
    return this
}

fun <T, R> T.let(block: (T) -> R): R {
    return block(this)
}

// 集合的泛型扩展
fun <T> List<T>.head(): T? = this.firstOrNull()

fun <T> List<T>.tail(): List<T> = this.drop(1)

fun <T> List<T>.init(): List<T> = this.dropLast(1)

fun main() {
    val text = "hello"
    val result = text
        .applyIf(true) { uppercase() }
        .applyIf(false) { reversed() }
        .also { println("处理中：$it") }
        .let { "结果：$it" }
    
    println(result)  // 结果：HELLO
    
    val numbers = listOf(1, 2, 3, 4, 5)
    println("头部：${numbers.head()}")  // 1
    println("尾部：${numbers.tail()}")  // [2, 3, 4, 5]
    println("初始：${numbers.init()}")  // [1, 2, 3, 4]
}
```

### 扩展函数的重载
```kotlin
// 扩展函数可以重载
fun String.repeat(times: Int): String = this.repeat(times)

fun String.repeat(times: Int, separator: String): String {
    return (1..times).map { this }.joinToString(separator)
}

fun String.repeat(times: Int, transform: (String) -> String): String {
    return (1..times).map { transform(this) }.joinToString("")
}

fun main() {
    val text = "Hello"
    
    println(text.repeat(3))                    // HelloHelloHello
    println(text.repeat(3, " "))               // Hello Hello Hello
    println(text.repeat(3) { it.uppercase() }) // HELLOHELLOHELLO
}
```

## 🎯 实际应用场景

### 日期时间扩展
```kotlin
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

// 日期时间扩展
fun LocalDateTime.toFormattedString(pattern: String = "yyyy-MM-dd HH:mm:ss"): String {
    return this.format(DateTimeFormatter.ofPattern(pattern))
}

fun LocalDateTime.isToday(): Boolean {
    val today = LocalDateTime.now()
    return this.toLocalDate() == today.toLocalDate()
}

fun LocalDateTime.addDays(days: Long): LocalDateTime = this.plusDays(days)

fun LocalDateTime.addHours(hours: Long): LocalDateTime = this.plusHours(hours)

val LocalDateTime.isWeekend: Boolean
    get() = this.dayOfWeek.value in 6..7

fun main() {
    val now = LocalDateTime.now()
    
    println("当前时间：${now.toFormattedString()}")
    println("是否今天：${now.isToday()}")
    println("是否周末：${now.isWeekend}")
    
    val tomorrow = now.addDays(1)
    println("明天：${tomorrow.toFormattedString("MM-dd")}")
}
```

### 文件操作扩展
```kotlin
import java.io.File

// 文件操作扩展
fun File.isImage(): Boolean {
    val imageExtensions = setOf("jpg", "jpeg", "png", "gif", "bmp")
    return this.extension.lowercase() in imageExtensions
}

fun File.sizeInMB(): Double = this.length() / (1024.0 * 1024.0)

fun File.copyToDirectory(directory: File): File {
    val targetFile = File(directory, this.name)
    this.copyTo(targetFile, overwrite = true)
    return targetFile
}

fun File.readLines(): List<String> = this.readText().lines()

fun File.appendLine(line: String) {
    this.appendText(line + System.lineSeparator())
}

// 注意：这些是示例，实际使用时需要处理异常
fun main() {
    val file = File("example.jpg")
    
    if (file.exists()) {
        println("是否为图片：${file.isImage()}")
        println("文件大小：${"%.2f".format(file.sizeInMB())} MB")
    }
}
```

### JSON 扩展（使用 Gson）
```kotlin
// 假设使用 Gson 库
// import com.google.gson.Gson

/*
inline fun <reified T> String.fromJson(): T {
    return Gson().fromJson(this, T::class.java)
}

fun Any.toJson(): String {
    return Gson().toJson(this)
}

data class User(val name: String, val age: Int)

fun main() {
    val user = User("张三", 25)
    val json = user.toJson()
    println("JSON: $json")
    
    val userFromJson = json.fromJson<User>()
    println("从JSON解析: $userFromJson")
}
*/
```

## 🎯 最佳实践

### 1. 命名约定
```kotlin
// ✅ 好的命名：描述性强
fun String.isValidEmail(): Boolean { /* ... */ }
fun List<Int>.sum(): Int { /* ... */ }
fun File.sizeInBytes(): Long { /* ... */ }

// ❌ 避免：模糊的命名
fun String.check(): Boolean { /* ... */ }
fun List<Int>.calc(): Int { /* ... */ }
```

### 2. 避免副作用
```kotlin
// ✅ 好的做法：纯函数
fun String.addPrefix(prefix: String): String = "$prefix$this"

// ❌ 避免：有副作用的扩展函数
fun String.printWithPrefix(prefix: String): String {
    println("$prefix$this")  // 副作用
    return "$prefix$this"
}
```

### 3. 合理使用扩展
```kotlin
// ✅ 适合扩展：为现有类型添加便利方法
fun String.isBlank(): Boolean = this.trim().isEmpty()

// ❌ 不适合扩展：复杂的业务逻辑
fun User.calculateComplexBusinessMetric(): Double {
    // 复杂的业务逻辑应该在专门的服务类中
}
```

## 🎯 下一步

掌握扩展函数后，您可以继续学习：

1. [泛型](./generics.md)
2. [反射](./reflection.md)
3. [注解](./annotations.md)

---

*扩展函数让您能够优雅地为现有类型添加功能，是 Kotlin 最实用的特性之一！*
