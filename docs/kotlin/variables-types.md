# 📊 变量与数据类型

Kotlin 提供了丰富的数据类型系统和灵活的变量声明方式。本章将详细介绍 Kotlin 中的变量声明、数据类型和类型系统。

## 🎯 学习目标

- 掌握变量声明的不同方式
- 理解 Kotlin 的类型系统
- 学会使用基本数据类型
- 了解类型推断和类型转换

## 📝 变量声明

### val vs var
```kotlin
fun main() {
    // val：只读变量（不可变）
    val name = "Kotlin"
    // name = "Java"  // 编译错误！
    
    // var：可变变量
    var age = 25
    age = 26  // 正确
    
    // 显式类型声明
    val language: String = "Kotlin"
    var version: Double = 1.9
}
```

### 变量初始化
```kotlin
fun main() {
    // 立即初始化
    val message = "Hello"
    
    // 延迟初始化
    val result: String
    if (true) {
        result = "Success"
    } else {
        result = "Failure"
    }
    
    // lateinit：延迟初始化（仅限 var）
    lateinit var database: String
    database = "MySQL"
    
    // lazy：惰性初始化（仅限 val）
    val expensiveValue: String by lazy {
        println("计算中...")
        "计算结果"
    }
}
```

## 🔢 基本数据类型

### 数字类型
```kotlin
fun main() {
    // 整数类型
    val byte: Byte = 127                    // 8位
    val short: Short = 32767                // 16位
    val int: Int = 2147483647              // 32位
    val long: Long = 9223372036854775807L   // 64位
    
    // 浮点类型
    val float: Float = 3.14f               // 32位
    val double: Double = 3.14159265359     // 64位
    
    // 类型推断
    val autoInt = 42        // Int
    val autoLong = 42L      // Long
    val autoFloat = 3.14f   // Float
    val autoDouble = 3.14   // Double
    
    // 数字字面量
    val decimal = 123
    val hexadecimal = 0x7B
    val binary = 0b1111011
    
    // 下划线分隔符（提高可读性）
    val million = 1_000_000
    val bytes = 0xFF_EC_DE_5E
}
```

### 字符和字符串
```kotlin
fun main() {
    // 字符类型
    val char: Char = 'A'
    val unicodeChar: Char = '\u0041'  // Unicode A
    val escapeChar: Char = '\n'       // 转义字符
    
    // 字符串类型
    val string: String = "Hello, Kotlin!"
    val multilineString = """
        这是一个
        多行字符串
        可以包含换行
    """.trimIndent()
    
    // 字符串模板
    val name = "张三"
    val age = 25
    val greeting = "你好，我是 $name，今年 $age 岁"
    val calculation = "2 + 3 = ${2 + 3}"
    
    // 原始字符串
    val regex = """[a-zA-Z0-9]+"""
    val path = """C:\Users\Name\Documents"""
}
```

### 布尔类型
```kotlin
fun main() {
    // 布尔值
    val isTrue: Boolean = true
    val isFalse: Boolean = false
    
    // 布尔运算
    val and = true && false   // false
    val or = true || false    // true
    val not = !true          // false
    
    // 比较运算
    val equal = (5 == 5)      // true
    val notEqual = (5 != 3)   // true
    val greater = (5 > 3)     // true
    val less = (3 < 5)        // true
}
```

## 🔄 类型转换

### 显式转换
```kotlin
fun main() {
    // 数字类型转换
    val int: Int = 42
    val long: Long = int.toLong()
    val double: Double = int.toDouble()
    val string: String = int.toString()
    
    // 字符串转数字
    val numberString = "123"
    val number = numberString.toInt()
    val safeNumber = numberString.toIntOrNull() ?: 0
    
    // 字符转换
    val char = 'A'
    val charCode = char.code  // 获取 ASCII 码
    val upperCase = char.uppercaseChar()
    val lowerCase = char.lowercaseChar()
}
```

### 智能转换
```kotlin
fun main() {
    val obj: Any = "Hello"
    
    // is 类型检查
    if (obj is String) {
        // 在这个作用域内，obj 自动转换为 String
        println(obj.length)  // 无需显式转换
    }
    
    // when 表达式中的智能转换
    when (obj) {
        is String -> println("字符串长度：${obj.length}")
        is Int -> println("整数值：$obj")
        is Boolean -> println("布尔值：$obj")
        else -> println("未知类型")
    }
}
```

## 🔍 类型检查

### 类型判断
```kotlin
fun main() {
    val value: Any = 42
    
    // is 操作符
    if (value is Int) {
        println("这是一个整数")
    }
    
    // !is 操作符
    if (value !is String) {
        println("这不是字符串")
    }
    
    // 类型检查函数
    fun checkType(obj: Any) {
        when (obj) {
            is String -> println("字符串：$obj")
            is Int -> println("整数：$obj")
            is List<*> -> println("列表，大小：${obj.size}")
            else -> println("其他类型：${obj::class.simpleName}")
        }
    }
    
    checkType("Hello")
    checkType(42)
    checkType(listOf(1, 2, 3))
}
```

### 安全转换
```kotlin
fun main() {
    val obj: Any = "Hello"
    
    // as 强制转换（可能抛出异常）
    val string1 = obj as String
    
    // as? 安全转换（失败返回 null）
    val string2 = obj as? String  // 成功，返回 "Hello"
    val number = obj as? Int      // 失败，返回 null
    
    // 使用安全转换
    val length = (obj as? String)?.length ?: 0
    println("字符串长度：$length")
}
```

## 🏷️ 类型别名

### 定义类型别名
```kotlin
// 为复杂类型定义别名
typealias UserMap = Map<String, User>
typealias StringProcessor = (String) -> String
typealias Predicate<T> = (T) -> Boolean

data class User(val name: String, val age: Int)

fun main() {
    // 使用类型别名
    val users: UserMap = mapOf(
        "user1" to User("张三", 25),
        "user2" to User("李四", 30)
    )
    
    val processor: StringProcessor = { it.uppercase() }
    val isAdult: Predicate<User> = { it.age >= 18 }
    
    println(processor("hello"))  // HELLO
    println(isAdult(User("小明", 20)))  // true
}
```

## 🔢 数字操作

### 数学运算
```kotlin
fun main() {
    val a = 10
    val b = 3
    
    // 基本运算
    println("加法：${a + b}")      // 13
    println("减法：${a - b}")      // 7
    println("乘法：${a * b}")      // 30
    println("除法：${a / b}")      // 3
    println("取余：${a % b}")      // 1
    
    // 位运算
    println("左移：${a shl 1}")    // 20
    println("右移：${a shr 1}")    // 5
    println("按位与：${a and b}")   // 2
    println("按位或：${a or b}")    // 11
    println("按位异或：${a xor b}") // 9
    println("按位取反：${a.inv()}") // -11
}
```

### 数学函数
```kotlin
import kotlin.math.*

fun main() {
    val x = 3.14
    val y = -2.5
    
    // 常用数学函数
    println("绝对值：${abs(y)}")           // 2.5
    println("最大值：${max(x, y)}")        // 3.14
    println("最小值：${min(x, y)}")        // -2.5
    println("平方根：${sqrt(x)}")          // 1.772...
    println("幂运算：${x.pow(2)}")         // 9.8596
    println("向上取整：${ceil(x)}")        // 4.0
    println("向下取整：${floor(x)}")       // 3.0
    println("四舍五入：${round(x)}")       // 3.0
}
```

## 📝 字符串操作

### 字符串方法
```kotlin
fun main() {
    val text = "  Hello, Kotlin!  "
    
    // 基本操作
    println("长度：${text.length}")
    println("去空格：'${text.trim()}'")
    println("大写：${text.uppercase()}")
    println("小写：${text.lowercase()}")
    println("首字母大写：${text.replaceFirstChar { it.uppercase() }}")
    
    // 查找和替换
    println("包含 'Kotlin'：${text.contains("Kotlin")}")
    println("以 'Hello' 开头：${text.trim().startsWith("Hello")}")
    println("以 '!' 结尾：${text.trim().endsWith("!")}")
    println("替换：${text.replace("Kotlin", "Java")}")
    
    // 分割和连接
    val words = "apple,banana,orange".split(",")
    println("分割：$words")
    println("连接：${words.joinToString(" | ")}")
    
    // 子字符串
    val substring = text.trim().substring(0, 5)
    println("子字符串：$substring")
}
```

## 🎯 实践练习

### 练习 1：类型转换
```kotlin
fun main() {
    val input = "123.45"
    
    // 尝试转换为不同类型
    val intValue = input.toDoubleOrNull()?.toInt() ?: 0
    val doubleValue = input.toDoubleOrNull() ?: 0.0
    
    println("原始字符串：$input")
    println("转换为整数：$intValue")
    println("转换为浮点数：$doubleValue")
}
```

### 练习 2：字符串处理
```kotlin
fun main() {
    val sentence = "Kotlin is a modern programming language"
    
    // 统计单词数量
    val wordCount = sentence.split(" ").size
    
    // 查找最长的单词
    val longestWord = sentence.split(" ").maxByOrNull { it.length }
    
    // 首字母大写
    val titleCase = sentence.split(" ")
        .joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
    
    println("原句：$sentence")
    println("单词数量：$wordCount")
    println("最长单词：$longestWord")
    println("标题格式：$titleCase")
}
```

## 🔧 常见问题

### 问题 1：数字溢出
```kotlin
fun main() {
    val maxInt = Int.MAX_VALUE
    println("最大整数：$maxInt")
    
    // 溢出处理
    val overflow = maxInt + 1
    println("溢出结果：$overflow")  // 负数
    
    // 使用 Long 避免溢出
    val safeLong = maxInt.toLong() + 1
    println("安全结果：$safeLong")
}
```

### 问题 2：空安全
```kotlin
fun main() {
    var nullableString: String? = null
    
    // 安全调用
    val length = nullableString?.length ?: 0
    println("长度：$length")
    
    // 非空断言（谨慎使用）
    // val unsafeLength = nullableString!!.length  // 可能抛出异常
}
```

## 🎯 下一步

掌握变量和数据类型后，您可以继续学习：

1. [基础语法](./basic-syntax.md)
2. [函数](./functions.md)
3. [类与对象](./classes.md)

---

*现在您已经掌握了 Kotlin 的变量和数据类型，让我们继续学习基础语法！*
