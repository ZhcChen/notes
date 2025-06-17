# 🔧 Kotlin 函数

函数是 Kotlin 程序的基本构建块。Kotlin 提供了强大而灵活的函数系统，支持高阶函数、扩展函数、内联函数等高级特性。

## 🎯 学习目标

- 掌握函数的定义和调用
- 理解参数和返回值
- 学会使用高阶函数和 Lambda
- 了解扩展函数和内联函数

## 📝 基本函数定义

### 函数语法
```kotlin
// 基本函数定义
fun greet(name: String): String {
    return "Hello, $name!"
}

// 单表达式函数
fun add(a: Int, b: Int): Int = a + b

// 无返回值函数（Unit）
fun printMessage(message: String) {
    println(message)
}

// 显式声明 Unit 返回类型
fun printMessageExplicit(message: String): Unit {
    println(message)
}

fun main() {
    println(greet("Kotlin"))        // Hello, Kotlin!
    println(add(5, 3))              // 8
    printMessage("Hello World")     // Hello World
}
```

### 参数和默认值
```kotlin
// 默认参数
fun createUser(
    name: String,
    age: Int = 18,
    city: String = "北京",
    isActive: Boolean = true
) {
    println("用户：$name, 年龄：$age, 城市：$city, 活跃：$isActive")
}

// 命名参数
fun main() {
    createUser("张三")                                    // 使用默认值
    createUser("李四", 25)                               // 部分默认值
    createUser("王五", city = "上海")                     // 命名参数
    createUser(name = "赵六", isActive = false, age = 30) // 改变参数顺序
}
```

### 可变参数
```kotlin
// vararg 关键字
fun printNumbers(vararg numbers: Int) {
    for (number in numbers) {
        println(number)
    }
}

fun sum(vararg numbers: Int): Int {
    var total = 0
    for (number in numbers) {
        total += number
    }
    return total
}

fun main() {
    printNumbers(1, 2, 3, 4, 5)
    println("总和：${sum(1, 2, 3, 4, 5)}")  // 总和：15
    
    // 传递数组
    val array = intArrayOf(1, 2, 3)
    println("数组总和：${sum(*array)}")      // 使用展开操作符
}
```

## 🔄 高阶函数

### 函数作为参数
```kotlin
// 接受函数作为参数
fun calculate(a: Int, b: Int, operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}

fun main() {
    // 传递函数引用
    fun multiply(x: Int, y: Int): Int = x * y
    
    val result1 = calculate(5, 3, ::multiply)
    println("乘法结果：$result1")  // 15
    
    // 传递 Lambda 表达式
    val result2 = calculate(5, 3) { x, y -> x + y }
    println("加法结果：$result2")  // 8
    
    // 使用标准库高阶函数
    val numbers = listOf(1, 2, 3, 4, 5)
    val doubled = numbers.map { it * 2 }
    val evens = numbers.filter { it % 2 == 0 }
    
    println("翻倍：$doubled")  // [2, 4, 6, 8, 10]
    println("偶数：$evens")    // [2, 4]
}
```

### 函数作为返回值
```kotlin
// 返回函数
fun getOperation(type: String): (Int, Int) -> Int {
    return when (type) {
        "add" -> { a, b -> a + b }
        "multiply" -> { a, b -> a * b }
        "subtract" -> { a, b -> a - b }
        else -> { _, _ -> 0 }
    }
}

fun main() {
    val addFunction = getOperation("add")
    val multiplyFunction = getOperation("multiply")
    
    println("5 + 3 = ${addFunction(5, 3)}")      // 8
    println("5 * 3 = ${multiplyFunction(5, 3)}")  // 15
}
```

## 🎭 Lambda 表达式

### Lambda 语法
```kotlin
fun main() {
    // 完整语法
    val lambda1: (Int, Int) -> Int = { a: Int, b: Int -> a + b }
    
    // 类型推断
    val lambda2 = { a: Int, b: Int -> a + b }
    
    // 单参数 Lambda（it）
    val numbers = listOf(1, 2, 3, 4, 5)
    val squared = numbers.map { it * it }
    println("平方：$squared")  // [1, 4, 9, 16, 25]
    
    // 多行 Lambda
    val complexLambda = { x: Int ->
        val doubled = x * 2
        val squared = doubled * doubled
        squared
    }
    println("复杂计算：${complexLambda(3)}")  // 36
}
```

### 闭包
```kotlin
fun main() {
    var counter = 0
    
    // Lambda 可以访问外部变量
    val increment = {
        counter++
        println("计数器：$counter")
    }
    
    increment()  // 计数器：1
    increment()  // 计数器：2
    increment()  // 计数器：3
    
    // 返回闭包的函数
    fun createMultiplier(factor: Int): (Int) -> Int {
        return { number -> number * factor }
    }
    
    val double = createMultiplier(2)
    val triple = createMultiplier(3)
    
    println("双倍：${double(5)}")  // 10
    println("三倍：${triple(5)}")  // 15
}
```

## 🔧 扩展函数

### 为现有类添加功能
```kotlin
// 为 String 添加扩展函数
fun String.isPalindrome(): Boolean {
    val cleaned = this.lowercase().replace(" ", "")
    return cleaned == cleaned.reversed()
}

// 为 Int 添加扩展函数
fun Int.isEven(): Boolean = this % 2 == 0

// 为 List 添加扩展函数
fun <T> List<T>.secondOrNull(): T? {
    return if (this.size >= 2) this[1] else null
}

fun main() {
    // 使用扩展函数
    println("level".isPalindrome())        // true
    println("hello".isPalindrome())        // false
    
    println("4 是偶数：${4.isEven()}")      // true
    println("5 是偶数：${5.isEven()}")      // false
    
    val list = listOf("a", "b", "c")
    println("第二个元素：${list.secondOrNull()}")  // b
}
```

### 扩展属性
```kotlin
// 为 String 添加扩展属性
val String.lastIndex: Int
    get() = this.length - 1

// 为 List 添加扩展属性
val <T> List<T>.lastIndex: Int
    get() = this.size - 1

fun main() {
    val text = "Hello"
    println("最后一个索引：${text.lastIndex}")  // 4
    
    val numbers = listOf(1, 2, 3, 4, 5)
    println("列表最后索引：${numbers.lastIndex}")  // 4
}
```

## ⚡ 内联函数

### inline 关键字
```kotlin
// 内联函数避免 Lambda 的性能开销
inline fun measureTime(action: () -> Unit): Long {
    val startTime = System.currentTimeMillis()
    action()
    val endTime = System.currentTimeMillis()
    return endTime - startTime
}

fun main() {
    val time = measureTime {
        // 模拟耗时操作
        Thread.sleep(100)
        println("操作完成")
    }
    println("耗时：${time}ms")
}
```

### noinline 和 crossinline
```kotlin
// 部分参数不内联
inline fun complexFunction(
    inlineAction: () -> Unit,
    noinline nonInlineAction: () -> Unit
) {
    inlineAction()
    nonInlineAction()
}

// crossinline 防止非局部返回
inline fun runWithCallback(crossinline callback: () -> Unit) {
    val runnable = Runnable {
        callback()  // 不能在这里使用 return
    }
    runnable.run()
}
```

## 🏗️ 作用域函数

### let, run, with, apply, also
```kotlin
data class Person(var name: String, var age: Int)

fun main() {
    val person = Person("张三", 25)
    
    // let：转换对象
    val nameLength = person.let {
        println("处理：${it.name}")
        it.name.length
    }
    println("姓名长度：$nameLength")
    
    // run：在对象上下文中执行代码
    val description = person.run {
        "姓名：$name，年龄：$age"
    }
    println(description)
    
    // with：对象作为参数
    val info = with(person) {
        "这个人叫 $name，今年 $age 岁"
    }
    println(info)
    
    // apply：配置对象
    val newPerson = Person("", 0).apply {
        name = "李四"
        age = 30
    }
    println("新人员：$newPerson")
    
    // also：执行额外操作
    val result = person.also {
        println("记录日志：创建了 ${it.name}")
    }
    println("结果：$result")
}
```

## 🎯 函数式编程

### 常用高阶函数
```kotlin
fun main() {
    val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    
    // map：转换
    val doubled = numbers.map { it * 2 }
    println("翻倍：$doubled")
    
    // filter：过滤
    val evens = numbers.filter { it % 2 == 0 }
    println("偶数：$evens")
    
    // reduce：聚合
    val sum = numbers.reduce { acc, n -> acc + n }
    println("总和：$sum")
    
    // fold：带初始值的聚合
    val product = numbers.fold(1) { acc, n -> acc * n }
    println("乘积：$product")
    
    // forEach：遍历
    numbers.forEach { println("数字：$it") }
    
    // any/all：条件检查
    val hasEven = numbers.any { it % 2 == 0 }
    val allPositive = numbers.all { it > 0 }
    println("包含偶数：$hasEven，全为正数：$allPositive")
}
```

### 函数组合
```kotlin
fun main() {
    // 函数组合
    val addOne = { x: Int -> x + 1 }
    val multiplyByTwo = { x: Int -> x * 2 }
    
    // 手动组合
    val addThenMultiply = { x: Int -> multiplyByTwo(addOne(x)) }
    println("5 加1再乘2：${addThenMultiply(5)}")  // 12
    
    // 使用 let 链式调用
    val result = 5.let(addOne).let(multiplyByTwo)
    println("链式调用结果：$result")  // 12
    
    // 创建组合函数
    fun <T, R, S> compose(f: (R) -> S, g: (T) -> R): (T) -> S {
        return { x -> f(g(x)) }
    }
    
    val composed = compose(multiplyByTwo, addOne)
    println("组合函数结果：${composed(5)}")  // 12
}
```

## 🎯 实践练习

### 练习 1：计算器函数
```kotlin
fun main() {
    // 创建计算器函数
    fun calculator(
        a: Double,
        b: Double,
        operation: (Double, Double) -> Double
    ): Double {
        return operation(a, b)
    }
    
    // 定义操作
    val add = { x: Double, y: Double -> x + y }
    val subtract = { x: Double, y: Double -> x - y }
    val multiply = { x: Double, y: Double -> x * y }
    val divide = { x: Double, y: Double -> if (y != 0.0) x / y else 0.0 }
    
    // 测试计算器
    println("10 + 5 = ${calculator(10.0, 5.0, add)}")
    println("10 - 5 = ${calculator(10.0, 5.0, subtract)}")
    println("10 * 5 = ${calculator(10.0, 5.0, multiply)}")
    println("10 / 5 = ${calculator(10.0, 5.0, divide)}")
}
```

### 练习 2：字符串处理扩展
```kotlin
// 扩展函数练习
fun String.wordCount(): Int = this.split("\\s+".toRegex()).size

fun String.reverseWords(): String = this.split(" ").reversed().joinToString(" ")

fun String.capitalize(): String = this.split(" ").joinToString(" ") { 
    it.replaceFirstChar { char -> char.uppercase() } 
}

fun main() {
    val text = "hello world kotlin programming"
    
    println("原文：$text")
    println("单词数：${text.wordCount()}")
    println("反转单词：${text.reverseWords()}")
    println("首字母大写：${text.capitalize()}")
}
```

### 练习 3：集合处理
```kotlin
fun main() {
    val students = listOf(
        Student("张三", 85),
        Student("李四", 92),
        Student("王五", 78),
        Student("赵六", 96),
        Student("钱七", 88)
    )
    
    // 使用高阶函数处理数据
    val topStudents = students
        .filter { it.score >= 90 }
        .sortedByDescending { it.score }
        .map { "${it.name}(${it.score}分)" }
    
    println("优秀学生：$topStudents")
    
    // 计算平均分
    val averageScore = students.map { it.score }.average()
    println("平均分：${"%.2f".format(averageScore)}")
    
    // 按成绩分组
    val grouped = students.groupBy { 
        when {
            it.score >= 90 -> "优秀"
            it.score >= 80 -> "良好"
            else -> "及格"
        }
    }
    
    grouped.forEach { (level, studentList) ->
        println("$level：${studentList.map { it.name }}")
    }
}

data class Student(val name: String, val score: Int)
```

## 🎯 下一步

掌握函数后，您可以继续学习：

1. [类与对象](./classes.md)
2. [Lambda 表达式](./lambdas.md)
3. [扩展函数](./extensions.md)

---

*函数是 Kotlin 编程的核心，掌握高阶函数和函数式编程将大大提升您的编程能力！*
