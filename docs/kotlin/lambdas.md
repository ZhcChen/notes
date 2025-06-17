# 🎭 Kotlin Lambda 表达式

Lambda 表达式是 Kotlin 函数式编程的核心特性，它让代码更加简洁和表达力强。本章将深入探讨 Lambda 的语法、用法和最佳实践。

## 🎯 学习目标

- 掌握 Lambda 表达式的语法
- 理解闭包和作用域
- 学会使用高阶函数
- 了解函数式编程技巧

## 📝 Lambda 基础语法

### 基本语法
```kotlin
fun main() {
    // 完整语法
    val sum: (Int, Int) -> Int = { a: Int, b: Int -> a + b }
    
    // 类型推断
    val multiply = { a: Int, b: Int -> a * b }
    
    // 单参数 Lambda（使用 it）
    val square: (Int) -> Int = { it * it }
    
    // 无参数 Lambda
    val greeting = { "Hello, World!" }
    
    // 调用 Lambda
    println("5 + 3 = ${sum(5, 3)}")        // 8
    println("4 * 6 = ${multiply(4, 6)}")   // 24
    println("7 的平方 = ${square(7)}")      // 49
    println(greeting())                     // Hello, World!
}
```

### Lambda 类型声明
```kotlin
fun main() {
    // 函数类型声明
    val operation: (Int, Int) -> Int
    
    // 赋值不同的 Lambda
    operation = { a, b -> a + b }
    println("加法：${operation(5, 3)}")  // 8
    
    operation = { a, b -> a * b }
    println("乘法：${operation(5, 3)}")  // 15
    
    // 可空函数类型
    var nullableFunction: ((String) -> String)? = null
    nullableFunction = { "处理：$it" }
    println(nullableFunction?.invoke("数据"))  // 处理：数据
    
    // 带接收者的函数类型
    val stringBuilder: StringBuilder.() -> Unit = {
        append("Hello")
        append(" ")
        append("Kotlin")
    }
    
    val sb = StringBuilder()
    sb.stringBuilder()
    println(sb.toString())  // Hello Kotlin
}
```

## 🔧 高阶函数

### 函数作为参数
```kotlin
// 接受函数作为参数的高阶函数
fun calculate(a: Int, b: Int, operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}

fun processString(input: String, processor: (String) -> String): String {
    return processor(input)
}

fun main() {
    // 传递 Lambda 表达式
    val result1 = calculate(10, 5) { a, b -> a + b }
    val result2 = calculate(10, 5) { a, b -> a - b }
    val result3 = calculate(10, 5) { a, b -> a * b }
    
    println("10 + 5 = $result1")  // 15
    println("10 - 5 = $result2")  // 5
    println("10 * 5 = $result3")  // 50
    
    // 字符串处理
    val processed1 = processString("hello") { it.uppercase() }
    val processed2 = processString("WORLD") { it.lowercase() }
    val processed3 = processString("kotlin") { it.replaceFirstChar { char -> char.uppercase() } }
    
    println(processed1)  // HELLO
    println(processed2)  // world
    println(processed3)  // Kotlin
}
```

### 函数作为返回值
```kotlin
// 返回函数的高阶函数
fun getOperation(type: String): (Int, Int) -> Int {
    return when (type) {
        "add" -> { a, b -> a + b }
        "subtract" -> { a, b -> a - b }
        "multiply" -> { a, b -> a * b }
        "divide" -> { a, b -> if (b != 0) a / b else 0 }
        else -> { _, _ -> 0 }
    }
}

fun createValidator(minLength: Int): (String) -> Boolean {
    return { input -> input.length >= minLength }
}

fun createFormatter(prefix: String, suffix: String): (String) -> String {
    return { content -> "$prefix$content$suffix" }
}

fun main() {
    // 获取不同的操作函数
    val addFunction = getOperation("add")
    val multiplyFunction = getOperation("multiply")
    
    println("5 + 3 = ${addFunction(5, 3)}")      // 8
    println("5 * 3 = ${multiplyFunction(5, 3)}")  // 15
    
    // 创建验证器
    val emailValidator = createValidator(5)
    val passwordValidator = createValidator(8)
    
    println("邮箱验证：${emailValidator("test@example.com")}")  // true
    println("密码验证：${passwordValidator("123")}")           // false
    
    // 创建格式化器
    val htmlFormatter = createFormatter("<p>", "</p>")
    val markdownFormatter = createFormatter("**", "**")
    
    println(htmlFormatter("Hello"))      // <p>Hello</p>
    println(markdownFormatter("Bold"))   // **Bold**
}
```

## 🔄 闭包

### 访问外部变量
```kotlin
fun main() {
    var counter = 0
    val maxCount = 5
    
    // Lambda 可以访问和修改外部变量
    val increment = {
        if (counter < maxCount) {
            counter++
            println("计数器：$counter")
        } else {
            println("已达到最大值")
        }
    }
    
    // 多次调用
    repeat(7) {
        increment()
    }
    
    println("最终计数：$counter")  // 5
}
```

### 闭包的实际应用
```kotlin
fun createCounter(initial: Int = 0): () -> Int {
    var count = initial
    return {
        count++
        count
    }
}

fun createAccumulator(): (Int) -> Int {
    var total = 0
    return { value ->
        total += value
        total
    }
}

fun main() {
    // 创建独立的计数器
    val counter1 = createCounter()
    val counter2 = createCounter(10)
    
    println("计数器1：${counter1()}")  // 1
    println("计数器1：${counter1()}")  // 2
    println("计数器2：${counter2()}")  // 11
    println("计数器2：${counter2()}")  // 12
    
    // 创建累加器
    val accumulator = createAccumulator()
    println("累加：${accumulator(5)}")   // 5
    println("累加：${accumulator(10)}")  // 15
    println("累加：${accumulator(3)}")   // 18
}
```

## 📚 集合操作中的 Lambda

### 常用集合函数
```kotlin
fun main() {
    val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    val words = listOf("apple", "banana", "cherry", "date", "elderberry")
    
    // map：转换每个元素
    val doubled = numbers.map { it * 2 }
    val lengths = words.map { it.length }
    println("翻倍：$doubled")  // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
    println("长度：$lengths")  // [5, 6, 6, 4, 10]
    
    // filter：过滤元素
    val evens = numbers.filter { it % 2 == 0 }
    val longWords = words.filter { it.length > 5 }
    println("偶数：$evens")      // [2, 4, 6, 8, 10]
    println("长单词：$longWords")  // [banana, cherry, elderberry]
    
    // reduce：聚合操作
    val sum = numbers.reduce { acc, n -> acc + n }
    val product = numbers.fold(1) { acc, n -> acc * n }
    println("总和：$sum")      // 55
    println("乘积：$product")  // 3628800
    
    // forEach：遍历
    words.forEach { word ->
        println("单词：$word")
    }
    
    // any/all：条件检查
    val hasEven = numbers.any { it % 2 == 0 }
    val allPositive = numbers.all { it > 0 }
    println("包含偶数：$hasEven")    // true
    println("全为正数：$allPositive")  // true
}
```

### 复杂的集合操作
```kotlin
data class Person(val name: String, val age: Int, val city: String)

fun main() {
    val people = listOf(
        Person("张三", 25, "北京"),
        Person("李四", 30, "上海"),
        Person("王五", 28, "北京"),
        Person("赵六", 35, "深圳"),
        Person("钱七", 22, "上海")
    )
    
    // 复杂过滤和转换
    val youngPeopleInBeijing = people
        .filter { it.age < 30 }
        .filter { it.city == "北京" }
        .map { it.name }
    
    println("北京的年轻人：$youngPeopleInBeijing")  // [张三, 王五]
    
    // 分组操作
    val peopleByCity = people.groupBy { it.city }
    peopleByCity.forEach { (city, peopleList) ->
        println("$city：${peopleList.map { it.name }}")
    }
    
    // 排序操作
    val sortedByAge = people.sortedBy { it.age }
    val sortedByNameDesc = people.sortedByDescending { it.name }
    
    println("按年龄排序：${sortedByAge.map { "${it.name}(${it.age})" }}")
    println("按姓名降序：${sortedByNameDesc.map { it.name }}")
    
    // 查找操作
    val oldestPerson = people.maxByOrNull { it.age }
    val firstPersonInShanghai = people.find { it.city == "上海" }
    
    println("最年长的人：${oldestPerson?.name}")
    println("上海第一个人：${firstPersonInShanghai?.name}")
}
```

## 🎯 Lambda 的高级用法

### 带接收者的 Lambda
```kotlin
// 扩展函数类型
fun buildString(builderAction: StringBuilder.() -> Unit): String {
    val sb = StringBuilder()
    sb.builderAction()
    return sb.toString()
}

// 自定义 DSL
class HtmlBuilder {
    private val elements = mutableListOf<String>()
    
    fun h1(text: String) {
        elements.add("<h1>$text</h1>")
    }
    
    fun p(text: String) {
        elements.add("<p>$text</p>")
    }
    
    fun div(content: HtmlBuilder.() -> Unit) {
        elements.add("<div>")
        this.content()
        elements.add("</div>")
    }
    
    override fun toString(): String = elements.joinToString("\n")
}

fun html(init: HtmlBuilder.() -> Unit): String {
    val builder = HtmlBuilder()
    builder.init()
    return builder.toString()
}

fun main() {
    // 使用带接收者的 Lambda
    val result = buildString {
        append("Hello")
        append(" ")
        append("Kotlin")
        append("!")
    }
    println(result)  // Hello Kotlin!
    
    // 使用自定义 DSL
    val htmlContent = html {
        h1("欢迎来到 Kotlin")
        p("这是一个段落")
        div {
            p("这是 div 中的段落")
            p("另一个段落")
        }
    }
    
    println(htmlContent)
}
```

### 内联 Lambda
```kotlin
// 内联函数避免 Lambda 的性能开销
inline fun measureTime(action: () -> Unit): Long {
    val startTime = System.currentTimeMillis()
    action()
    val endTime = System.currentTimeMillis()
    return endTime - startTime
}

inline fun <T> List<T>.customFilter(predicate: (T) -> Boolean): List<T> {
    val result = mutableListOf<T>()
    for (item in this) {
        if (predicate(item)) {
            result.add(item)
        }
    }
    return result
}

fun main() {
    val time = measureTime {
        // 模拟耗时操作
        Thread.sleep(100)
        println("操作完成")
    }
    println("耗时：${time}ms")
    
    val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    val evens = numbers.customFilter { it % 2 == 0 }
    println("偶数：$evens")
}
```

## 🎯 实践练习

### 练习 1：函数式计算器
```kotlin
class FunctionalCalculator {
    private val operations = mapOf<String, (Double, Double) -> Double>(
        "+" to { a, b -> a + b },
        "-" to { a, b -> a - b },
        "*" to { a, b -> a * b },
        "/" to { a, b -> if (b != 0.0) a / b else Double.NaN },
        "^" to { a, b -> Math.pow(a, b) },
        "%" to { a, b -> a % b }
    )
    
    fun calculate(a: Double, operator: String, b: Double): Double {
        val operation = operations[operator] ?: { _, _ -> Double.NaN }
        return operation(a, b)
    }
    
    fun addOperation(symbol: String, operation: (Double, Double) -> Double) {
        (operations as MutableMap)[symbol] = operation
    }
    
    fun getAvailableOperations(): Set<String> = operations.keys
}

fun main() {
    val calculator = FunctionalCalculator()
    
    // 基本运算
    println("5 + 3 = ${calculator.calculate(5.0, "+", 3.0)}")
    println("10 / 2 = ${calculator.calculate(10.0, "/", 2.0)}")
    println("2 ^ 3 = ${calculator.calculate(2.0, "^", 3.0)}")
    
    // 添加自定义运算
    calculator.addOperation("min") { a, b -> minOf(a, b) }
    calculator.addOperation("max") { a, b -> maxOf(a, b) }
    
    println("min(5, 3) = ${calculator.calculate(5.0, "min", 3.0)}")
    println("max(5, 3) = ${calculator.calculate(5.0, "max", 3.0)}")
    
    println("可用运算：${calculator.getAvailableOperations()}")
}
```

### 练习 2：事件处理系统
```kotlin
typealias EventHandler<T> = (T) -> Unit

class EventEmitter<T> {
    private val handlers = mutableListOf<EventHandler<T>>()
    
    fun on(handler: EventHandler<T>) {
        handlers.add(handler)
    }
    
    fun off(handler: EventHandler<T>) {
        handlers.remove(handler)
    }
    
    fun emit(event: T) {
        handlers.forEach { it(event) }
    }
    
    fun once(handler: EventHandler<T>) {
        val onceHandler: EventHandler<T> = { event ->
            handler(event)
            off(this)
        }
        on(onceHandler)
    }
}

data class UserEvent(val type: String, val userId: String, val data: Map<String, Any> = emptyMap())

fun main() {
    val userEventEmitter = EventEmitter<UserEvent>()
    
    // 添加事件处理器
    val loginHandler: EventHandler<UserEvent> = { event ->
        println("用户登录：${event.userId}")
    }
    
    val logHandler: EventHandler<UserEvent> = { event ->
        println("日志：${event.type} - ${event.userId}")
    }
    
    userEventEmitter.on(loginHandler)
    userEventEmitter.on(logHandler)
    
    // 一次性处理器
    userEventEmitter.once { event ->
        if (event.type == "first_login") {
            println("欢迎新用户：${event.userId}")
        }
    }
    
    // 发送事件
    userEventEmitter.emit(UserEvent("login", "user123"))
    userEventEmitter.emit(UserEvent("first_login", "user456"))
    userEventEmitter.emit(UserEvent("logout", "user123"))
}
```

### 练习 3：函数式数据处理管道
```kotlin
class DataPipeline<T> {
    private val transformations = mutableListOf<(T) -> T>()
    private val filters = mutableListOf<(T) -> Boolean>()
    
    fun map(transform: (T) -> T): DataPipeline<T> {
        transformations.add(transform)
        return this
    }
    
    fun filter(predicate: (T) -> Boolean): DataPipeline<T> {
        filters.add(predicate)
        return this
    }
    
    fun process(data: List<T>): List<T> {
        return data
            .filter { item -> filters.all { filter -> filter(item) } }
            .map { item -> transformations.fold(item) { acc, transform -> transform(acc) } }
    }
}

data class Product(val name: String, val price: Double, val category: String, val inStock: Boolean)

fun main() {
    val products = listOf(
        Product("笔记本电脑", 5999.0, "电子产品", true),
        Product("手机", 3999.0, "电子产品", false),
        Product("书籍", 29.9, "图书", true),
        Product("耳机", 299.0, "电子产品", true),
        Product("杂志", 15.0, "图书", false)
    )
    
    // 创建数据处理管道
    val pipeline = DataPipeline<Product>()
        .filter { it.inStock }  // 只要有库存的
        .filter { it.category == "电子产品" }  // 只要电子产品
        .map { it.copy(price = it.price * 0.9) }  // 打9折
        .map { it.copy(name = "[促销] ${it.name}") }  // 添加促销标签
    
    val processedProducts = pipeline.process(products)
    
    println("处理后的产品：")
    processedProducts.forEach { product ->
        println("${product.name} - ¥${product.price}")
    }
}
```

## 🎯 最佳实践

### 1. 选择合适的语法
```kotlin
// ✅ 单参数使用 it
val doubled = numbers.map { it * 2 }

// ✅ 多参数使用命名参数
val combined = list1.zip(list2) { a, b -> a + b }

// ✅ 复杂逻辑使用多行
val processed = data.filter { item ->
    item.isValid() && 
    item.price > 100 &&
    item.category in allowedCategories
}
```

### 2. 避免过度嵌套
```kotlin
// ❌ 避免：过度嵌套
val result = data
    .map { item ->
        item.details.map { detail ->
            detail.values.filter { value ->
                value > 0
            }.sum()
        }.sum()
    }

// ✅ 好的做法：提取函数
fun processItemDetails(item: Item): Int {
    return item.details.sumOf { detail ->
        detail.values.filter { it > 0 }.sum()
    }
}

val result = data.map { processItemDetails(it) }
```

## 🎯 下一步

掌握 Lambda 表达式后，您可以继续学习：

1. [扩展函数](./extensions.md)
2. [泛型](./generics.md)
3. [协程](./coroutines.md)

---

*Lambda 表达式是函数式编程的核心，掌握它将让您的 Kotlin 代码更加优雅和高效！*
