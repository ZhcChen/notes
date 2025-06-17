# 📖 Kotlin 基础语法

本章将介绍 Kotlin 的基础语法，包括控制流、循环、条件语句等核心语言特性。

## 🎯 学习目标

- 掌握条件语句的使用
- 理解循环结构
- 学会使用 when 表达式
- 了解异常处理机制

## 🔀 条件语句

### if 表达式
```kotlin
fun main() {
    val age = 18
    
    // 传统 if 语句
    if (age >= 18) {
        println("成年人")
    } else {
        println("未成年人")
    }
    
    // if 作为表达式
    val status = if (age >= 18) "成年人" else "未成年人"
    println("状态：$status")
    
    // 多分支 if
    val category = if (age < 13) {
        "儿童"
    } else if (age < 18) {
        "青少年"
    } else if (age < 60) {
        "成年人"
    } else {
        "老年人"
    }
    println("年龄分类：$category")
}
```

### when 表达式
```kotlin
fun main() {
    val grade = 'B'
    
    // 基本 when 表达式
    when (grade) {
        'A' -> println("优秀")
        'B' -> println("良好")
        'C' -> println("及格")
        'D', 'F' -> println("不及格")
        else -> println("无效等级")
    }
    
    // when 作为表达式
    val description = when (grade) {
        'A' -> "优秀"
        'B' -> "良好"
        'C' -> "及格"
        else -> "需要努力"
    }
    
    // 范围匹配
    val score = 85
    val level = when (score) {
        in 90..100 -> "优秀"
        in 80..89 -> "良好"
        in 70..79 -> "中等"
        in 60..69 -> "及格"
        else -> "不及格"
    }
    println("成绩等级：$level")
    
    // 类型检查
    fun describe(obj: Any) = when (obj) {
        is String -> "字符串，长度：${obj.length}"
        is Int -> "整数：$obj"
        is Boolean -> "布尔值：$obj"
        is List<*> -> "列表，大小：${obj.size}"
        else -> "未知类型"
    }
    
    println(describe("Hello"))
    println(describe(42))
    println(describe(listOf(1, 2, 3)))
}
```

## 🔄 循环结构

### for 循环
```kotlin
fun main() {
    // 遍历范围
    println("1 到 5：")
    for (i in 1..5) {
        print("$i ")
    }
    println()
    
    // 遍历范围（不包含结束值）
    println("1 到 4：")
    for (i in 1 until 5) {
        print("$i ")
    }
    println()
    
    // 倒序遍历
    println("5 到 1：")
    for (i in 5 downTo 1) {
        print("$i ")
    }
    println()
    
    // 指定步长
    println("1 到 10，步长 2：")
    for (i in 1..10 step 2) {
        print("$i ")
    }
    println()
    
    // 遍历数组
    val fruits = arrayOf("苹果", "香蕉", "橙子")
    for (fruit in fruits) {
        println("水果：$fruit")
    }
    
    // 遍历数组（带索引）
    for ((index, fruit) in fruits.withIndex()) {
        println("$index: $fruit")
    }
    
    // 遍历列表
    val numbers = listOf(1, 2, 3, 4, 5)
    for (number in numbers) {
        println("数字：$number")
    }
    
    // 遍历 Map
    val map = mapOf("a" to 1, "b" to 2, "c" to 3)
    for ((key, value) in map) {
        println("$key -> $value")
    }
}
```

### while 循环
```kotlin
fun main() {
    // while 循环
    var count = 1
    while (count <= 5) {
        println("计数：$count")
        count++
    }
    
    // do-while 循环
    var number = 1
    do {
        println("数字：$number")
        number++
    } while (number <= 3)
    
    // 无限循环（需要 break 退出）
    var input = ""
    while (true) {
        println("输入 'quit' 退出")
        input = readLine() ?: ""
        if (input == "quit") {
            break
        }
        println("您输入了：$input")
    }
}
```

### 循环控制
```kotlin
fun main() {
    // break 和 continue
    for (i in 1..10) {
        if (i == 3) {
            continue  // 跳过当前迭代
        }
        if (i == 8) {
            break     // 退出循环
        }
        println(i)
    }
    
    // 标签和跳转
    outer@ for (i in 1..3) {
        inner@ for (j in 1..3) {
            if (i == 2 && j == 2) {
                break@outer  // 跳出外层循环
            }
            println("$i, $j")
        }
    }
    
    // return 在 lambda 中的使用
    val numbers = listOf(1, 2, 3, 4, 5)
    numbers.forEach { number ->
        if (number == 3) {
            return@forEach  // 跳过当前元素
        }
        println(number)
    }
}
```

## 📊 范围和区间

### 范围操作符
```kotlin
fun main() {
    // 闭区间（包含两端）
    val range1 = 1..10
    println("1..10 包含 5：${5 in range1}")  // true
    println("1..10 包含 15：${15 in range1}")  // false
    
    // 半开区间（不包含结束值）
    val range2 = 1 until 10
    println("1 until 10 包含 10：${10 in range2}")  // false
    
    // 倒序范围
    val range3 = 10 downTo 1
    for (i in range3 step 2) {
        print("$i ")
    }
    println()
    
    // 字符范围
    val charRange = 'a'..'z'
    println("字符范围包含 'm'：${'m' in charRange}")  // true
    
    // 范围函数
    println("范围是否为空：${(5..1).isEmpty()}")  // true
    println("范围第一个元素：${range1.first}")    // 1
    println("范围最后一个元素：${range1.last}")     // 10
}
```

## ⚠️ 异常处理

### try-catch 语句
```kotlin
fun main() {
    // 基本异常处理
    try {
        val result = 10 / 0
        println(result)
    } catch (e: ArithmeticException) {
        println("除零错误：${e.message}")
    } catch (e: Exception) {
        println("其他错误：${e.message}")
    } finally {
        println("清理资源")
    }
    
    // try 作为表达式
    val result = try {
        "123".toInt()
    } catch (e: NumberFormatException) {
        0
    }
    println("转换结果：$result")
    
    // 多个 catch 块
    fun parseNumber(str: String): Int {
        return try {
            str.toInt()
        } catch (e: NumberFormatException) {
            println("数字格式错误：$str")
            0
        } catch (e: Exception) {
            println("未知错误：${e.message}")
            -1
        }
    }
    
    println(parseNumber("123"))   // 123
    println(parseNumber("abc"))   // 0
}
```

### 抛出异常
```kotlin
fun main() {
    // 抛出异常
    fun validateAge(age: Int) {
        if (age < 0) {
            throw IllegalArgumentException("年龄不能为负数")
        }
        if (age > 150) {
            throw IllegalArgumentException("年龄不能超过 150")
        }
        println("年龄验证通过：$age")
    }
    
    try {
        validateAge(25)   // 正常
        validateAge(-5)   // 抛出异常
    } catch (e: IllegalArgumentException) {
        println("参数错误：${e.message}")
    }
    
    // Nothing 类型
    fun fail(message: String): Nothing {
        throw IllegalStateException(message)
    }
    
    // Elvis 操作符与异常
    fun processInput(input: String?) {
        val nonNullInput = input ?: throw IllegalArgumentException("输入不能为空")
        println("处理输入：$nonNullInput")
    }
    
    try {
        processInput(null)
    } catch (e: IllegalArgumentException) {
        println("输入验证失败：${e.message}")
    }
}
```

## 🔍 空安全

### 可空类型
```kotlin
fun main() {
    // 可空类型声明
    var nullableString: String? = null
    var nonNullString: String = "Hello"
    
    // 安全调用操作符
    val length1 = nullableString?.length
    println("可空字符串长度：$length1")  // null
    
    val length2 = nonNullString.length
    println("非空字符串长度：$length2")  // 5
    
    // Elvis 操作符
    val length3 = nullableString?.length ?: 0
    println("使用默认值的长度：$length3")  // 0
    
    // 安全转换
    val obj: Any? = "Hello"
    val str = obj as? String
    println("安全转换结果：$str")  // Hello
    
    // 非空断言
    nullableString = "World"
    val length4 = nullableString!!.length  // 确定不为空时使用
    println("非空断言长度：$length4")  // 5
}
```

### let 函数
```kotlin
fun main() {
    val nullableString: String? = "Hello"
    
    // 使用 let 处理可空值
    nullableString?.let { str ->
        println("字符串长度：${str.length}")
        println("大写：${str.uppercase()}")
    }
    
    // 链式调用
    val result = nullableString
        ?.takeIf { it.isNotEmpty() }
        ?.let { it.uppercase() }
        ?: "默认值"
    
    println("处理结果：$result")
}
```

## 🎯 实践练习

### 练习 1：成绩统计
```kotlin
fun main() {
    val scores = listOf(85, 92, 78, 96, 88, 73, 91)
    
    var excellent = 0  // 90分以上
    var good = 0       // 80-89分
    var average = 0    // 70-79分
    var poor = 0       // 70分以下
    
    for (score in scores) {
        when (score) {
            in 90..100 -> excellent++
            in 80..89 -> good++
            in 70..79 -> average++
            else -> poor++
        }
    }
    
    println("成绩统计：")
    println("优秀（90+）：$excellent 人")
    println("良好（80-89）：$good 人")
    println("中等（70-79）：$average 人")
    println("需努力（<70）：$poor 人")
}
```

### 练习 2：数字猜测游戏
```kotlin
import kotlin.random.Random

fun main() {
    val targetNumber = Random.nextInt(1, 101)
    var attempts = 0
    val maxAttempts = 7
    
    println("猜数字游戏！我想了一个 1-100 的数字，你有 $maxAttempts 次机会。")
    
    while (attempts < maxAttempts) {
        print("请输入你的猜测：")
        val input = readLine()
        
        val guess = try {
            input?.toInt() ?: continue
        } catch (e: NumberFormatException) {
            println("请输入有效的数字！")
            continue
        }
        
        attempts++
        
        when {
            guess == targetNumber -> {
                println("恭喜！你在第 $attempts 次猜对了！")
                return
            }
            guess < targetNumber -> println("太小了！")
            else -> println("太大了！")
        }
        
        val remaining = maxAttempts - attempts
        if (remaining > 0) {
            println("还有 $remaining 次机会")
        }
    }
    
    println("游戏结束！正确答案是 $targetNumber")
}
```

### 练习 3：简单计算器
```kotlin
fun main() {
    while (true) {
        println("\n简单计算器")
        println("输入 'quit' 退出")
        
        print("请输入第一个数字：")
        val input1 = readLine()
        if (input1 == "quit") break
        
        print("请输入运算符 (+, -, *, /)：")
        val operator = readLine()
        if (operator == "quit") break
        
        print("请输入第二个数字：")
        val input2 = readLine()
        if (input2 == "quit") break
        
        try {
            val num1 = input1?.toDouble() ?: continue
            val num2 = input2?.toDouble() ?: continue
            
            val result = when (operator) {
                "+" -> num1 + num2
                "-" -> num1 - num2
                "*" -> num1 * num2
                "/" -> {
                    if (num2 == 0.0) {
                        println("错误：除数不能为零！")
                        continue
                    }
                    num1 / num2
                }
                else -> {
                    println("错误：不支持的运算符！")
                    continue
                }
            }
            
            println("结果：$num1 $operator $num2 = $result")
            
        } catch (e: NumberFormatException) {
            println("错误：请输入有效的数字！")
        }
    }
    
    println("再见！")
}
```

## 🎯 下一步

掌握基础语法后，您可以继续学习：

1. [函数](./functions.md)
2. [类与对象](./classes.md)
3. [空安全](./null-safety.md)

---

*现在您已经掌握了 Kotlin 的基础语法，让我们继续学习函数的定义和使用！*
