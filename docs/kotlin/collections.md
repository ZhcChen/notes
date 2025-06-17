# 📚 Kotlin 集合框架

Kotlin 提供了丰富而强大的集合框架，包括不可变和可变集合，以及大量的操作函数，让数据处理变得简单高效。

## 🎯 学习目标

- 掌握 Kotlin 集合的基本类型
- 理解可变与不可变集合的区别
- 学会使用集合操作函数
- 了解序列的惰性计算

## 📋 集合类型概览

### 集合层次结构
```kotlin
// 不可变集合（只读）
val readOnlyList: List<String> = listOf("a", "b", "c")
val readOnlySet: Set<Int> = setOf(1, 2, 3)
val readOnlyMap: Map<String, Int> = mapOf("a" to 1, "b" to 2)

// 可变集合
val mutableList: MutableList<String> = mutableListOf("a", "b", "c")
val mutableSet: MutableSet<Int> = mutableSetOf(1, 2, 3)
val mutableMap: MutableMap<String, Int> = mutableMapOf("a" to 1, "b" to 2)

fun main() {
    // 只读集合不能修改
    // readOnlyList.add("d")  // 编译错误
    
    // 可变集合可以修改
    mutableList.add("d")
    mutableSet.remove(1)
    mutableMap["c"] = 3
    
    println("可变列表：$mutableList")  // [a, b, c, d]
    println("可变集合：$mutableSet")   // [2, 3]
    println("可变映射：$mutableMap")   // {a=1, b=2, c=3}
}
```

## 📝 List（列表）

### List 基本操作
```kotlin
fun main() {
    // 创建列表
    val fruits = listOf("苹果", "香蕉", "橙子", "苹果")
    val numbers = listOf(1, 2, 3, 4, 5)
    val emptyList = emptyList<String>()
    
    // 访问元素
    println("第一个水果：${fruits[0]}")           // 苹果
    println("第一个水果：${fruits.first()}")      // 苹果
    println("最后一个水果：${fruits.last()}")     // 苹果
    println("安全获取：${fruits.getOrNull(10)}")  // null
    
    // 列表信息
    println("列表大小：${fruits.size}")           // 4
    println("是否为空：${fruits.isEmpty()}")      // false
    println("包含苹果：${fruits.contains("苹果")}")  // true
    println("苹果的索引：${fruits.indexOf("苹果")}")  // 0
    
    // 子列表
    val subList = numbers.subList(1, 4)  // [2, 3, 4]
    println("子列表：$subList")
}
```

### MutableList 操作
```kotlin
fun main() {
    val mutableFruits = mutableListOf("苹果", "香蕉")
    
    // 添加元素
    mutableFruits.add("橙子")
    mutableFruits.add(1, "葡萄")  // 在指定位置插入
    mutableFruits.addAll(listOf("西瓜", "草莓"))
    
    println("添加后：$mutableFruits")  // [苹果, 葡萄, 香蕉, 橙子, 西瓜, 草莓]
    
    // 删除元素
    mutableFruits.remove("香蕉")      // 删除指定元素
    mutableFruits.removeAt(0)        // 删除指定位置元素
    mutableFruits.removeAll(listOf("西瓜", "草莓"))  // 删除多个元素
    
    println("删除后：$mutableFruits")  // [葡萄, 橙子]
    
    // 修改元素
    mutableFruits[0] = "芒果"
    println("修改后：$mutableFruits")  // [芒果, 橙子]
    
    // 排序
    val numbers = mutableListOf(3, 1, 4, 1, 5, 9)
    numbers.sort()  // 原地排序
    println("排序后：$numbers")  // [1, 1, 3, 4, 5, 9]
}
```

## 🎯 Set（集合）

### Set 基本操作
```kotlin
fun main() {
    // 创建集合（自动去重）
    val numbers = setOf(1, 2, 3, 2, 1)
    println("数字集合：$numbers")  // [1, 2, 3]
    
    val fruits = setOf("苹果", "香蕉", "橙子")
    
    // 集合操作
    println("集合大小：${numbers.size}")
    println("包含2：${numbers.contains(2)}")
    println("是否为空：${numbers.isEmpty()}")
    
    // 集合运算
    val set1 = setOf(1, 2, 3, 4)
    val set2 = setOf(3, 4, 5, 6)
    
    println("并集：${set1 union set2}")        // [1, 2, 3, 4, 5, 6]
    println("交集：${set1 intersect set2}")    // [3, 4]
    println("差集：${set1 subtract set2}")     // [1, 2]
    
    // 检查关系
    val subset = setOf(1, 2)
    println("是否为子集：${subset.all { it in set1 }}")  // true
}
```

### MutableSet 操作
```kotlin
fun main() {
    val mutableNumbers = mutableSetOf(1, 2, 3)
    
    // 添加元素
    mutableNumbers.add(4)
    mutableNumbers.addAll(setOf(5, 6, 2))  // 2 已存在，不会重复添加
    
    println("添加后：$mutableNumbers")  // [1, 2, 3, 4, 5, 6]
    
    // 删除元素
    mutableNumbers.remove(1)
    mutableNumbers.removeAll(setOf(2, 3))
    
    println("删除后：$mutableNumbers")  // [4, 5, 6]
    
    // 保留元素
    mutableNumbers.retainAll(setOf(4, 5, 7, 8))
    println("保留后：$mutableNumbers")  // [4, 5]
}
```

## 🗺️ Map（映射）

### Map 基本操作
```kotlin
fun main() {
    // 创建映射
    val ages = mapOf(
        "张三" to 25,
        "李四" to 30,
        "王五" to 28
    )
    
    val emptyMap = emptyMap<String, Int>()
    
    // 访问元素
    println("张三的年龄：${ages["张三"]}")           // 25
    println("安全获取：${ages.getOrDefault("赵六", 0)}")  // 0
    println("使用 Elvis：${ages["赵六"] ?: 0}")      // 0
    
    // 映射信息
    println("映射大小：${ages.size}")
    println("是否为空：${ages.isEmpty()}")
    println("包含键：${ages.containsKey("张三")}")
    println("包含值：${ages.containsValue(25)}")
    
    // 获取键和值
    println("所有键：${ages.keys}")      // [张三, 李四, 王五]
    println("所有值：${ages.values}")    // [25, 30, 28]
    println("所有条目：${ages.entries}") // [张三=25, 李四=30, 王五=28]
}
```

### MutableMap 操作
```kotlin
fun main() {
    val mutableAges = mutableMapOf(
        "张三" to 25,
        "李四" to 30
    )
    
    // 添加和修改
    mutableAges["王五"] = 28        // 添加新条目
    mutableAges["张三"] = 26        // 修改现有条目
    mutableAges.put("赵六", 32)     // 使用 put 方法
    mutableAges.putAll(mapOf("钱七" to 29, "孙八" to 31))
    
    println("添加后：$mutableAges")
    
    // 删除
    mutableAges.remove("李四")
    val removedValue = mutableAges.remove("王五")
    println("删除的值：$removedValue")  // 28
    
    // 条件操作
    mutableAges.putIfAbsent("张三", 100)  // 如果不存在才添加
    println("条件添加后：$mutableAges")
    
    // 计算操作
    mutableAges.compute("张三") { _, oldValue -> (oldValue ?: 0) + 1 }
    println("计算后：$mutableAges")
}
```

## 🔄 集合操作函数

### 转换操作
```kotlin
fun main() {
    val numbers = listOf(1, 2, 3, 4, 5)
    val words = listOf("hello", "world", "kotlin")
    
    // map：转换每个元素
    val doubled = numbers.map { it * 2 }
    println("翻倍：$doubled")  // [2, 4, 6, 8, 10]
    
    val lengths = words.map { it.length }
    println("长度：$lengths")  // [5, 5, 6]
    
    // mapIndexed：带索引的转换
    val indexed = words.mapIndexed { index, word -> "$index: $word" }
    println("带索引：$indexed")  // [0: hello, 1: world, 2: kotlin]
    
    // mapNotNull：转换并过滤空值
    val strings = listOf("1", "2", "abc", "4")
    val validNumbers = strings.mapNotNull { it.toIntOrNull() }
    println("有效数字：$validNumbers")  // [1, 2, 4]
    
    // flatMap：扁平化映射
    val nestedLists = listOf(listOf(1, 2), listOf(3, 4), listOf(5))
    val flattened = nestedLists.flatMap { it }
    println("扁平化：$flattened")  // [1, 2, 3, 4, 5]
}
```

### 过滤操作
```kotlin
fun main() {
    val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    val words = listOf("apple", "banana", "cherry", "date")
    
    // filter：过滤元素
    val evens = numbers.filter { it % 2 == 0 }
    println("偶数：$evens")  // [2, 4, 6, 8, 10]
    
    val longWords = words.filter { it.length > 5 }
    println("长单词：$longWords")  // [banana, cherry]
    
    // filterIndexed：带索引的过滤
    val evenIndexed = numbers.filterIndexed { index, _ -> index % 2 == 0 }
    println("偶数索引：$evenIndexed")  // [1, 3, 5, 7, 9]
    
    // filterNot：反向过滤
    val odds = numbers.filterNot { it % 2 == 0 }
    println("奇数：$odds")  // [1, 3, 5, 7, 9]
    
    // filterIsInstance：类型过滤
    val mixed: List<Any> = listOf(1, "hello", 2.5, "world", 3)
    val strings = mixed.filterIsInstance<String>()
    println("字符串：$strings")  // [hello, world]
    
    // partition：分割
    val (evenPartition, oddPartition) = numbers.partition { it % 2 == 0 }
    println("偶数分区：$evenPartition")  // [2, 4, 6, 8, 10]
    println("奇数分区：$oddPartition")   // [1, 3, 5, 7, 9]
}
```

### 聚合操作
```kotlin
fun main() {
    val numbers = listOf(1, 2, 3, 4, 5)
    val words = listOf("apple", "banana", "cherry")
    
    // 基本聚合
    println("总和：${numbers.sum()}")           // 15
    println("平均值：${numbers.average()}")     // 3.0
    println("最大值：${numbers.maxOrNull()}")   // 5
    println("最小值：${numbers.minOrNull()}")   // 1
    println("计数：${numbers.count()}")         // 5
    
    // 条件聚合
    println("偶数个数：${numbers.count { it % 2 == 0 }}")  // 2
    println("最大偶数：${numbers.filter { it % 2 == 0 }.maxOrNull()}")  // 4
    
    // reduce 和 fold
    val product = numbers.reduce { acc, n -> acc * n }
    println("乘积：$product")  // 120
    
    val concatenated = words.fold("") { acc, word -> acc + word }
    println("连接：$concatenated")  // applebananacherry
    
    // 自定义聚合
    val longest = words.maxByOrNull { it.length }
    println("最长单词：$longest")  // banana
    
    val shortest = words.minByOrNull { it.length }
    println("最短单词：$shortest")  // apple
}
```

### 分组和排序
```kotlin
fun main() {
    val words = listOf("apple", "banana", "cherry", "date", "elderberry")
    val numbers = listOf(3, 1, 4, 1, 5, 9, 2, 6)
    
    // 分组
    val groupedByLength = words.groupBy { it.length }
    println("按长度分组：$groupedByLength")
    // {5=[apple], 6=[banana, cherry], 4=[date], 10=[elderberry]}
    
    val groupedByFirstChar = words.groupBy { it.first() }
    println("按首字母分组：$groupedByFirstChar")
    // {a=[apple], b=[banana], c=[cherry], d=[date], e=[elderberry]}
    
    // 排序
    val sorted = numbers.sorted()
    println("升序：$sorted")  // [1, 1, 2, 3, 4, 5, 6, 9]
    
    val sortedDesc = numbers.sortedDescending()
    println("降序：$sortedDesc")  // [9, 6, 5, 4, 3, 2, 1, 1]
    
    val sortedByLength = words.sortedBy { it.length }
    println("按长度排序：$sortedByLength")  // [date, apple, banana, cherry, elderberry]
    
    val sortedByLengthDesc = words.sortedByDescending { it.length }
    println("按长度降序：$sortedByLengthDesc")  // [elderberry, banana, cherry, apple, date]
}
```

## ⚡ 序列（Sequence）

### 惰性计算
```kotlin
fun main() {
    val numbers = (1..1000000).asSequence()
    
    // 序列操作是惰性的，只有在终端操作时才执行
    val result = numbers
        .filter { 
            println("过滤：$it")  // 只会打印前几个
            it % 2 == 0 
        }
        .map { 
            println("映射：$it")  // 只会打印前几个
            it * it 
        }
        .take(5)  // 只取前5个
        .toList()  // 终端操作，触发计算
    
    println("结果：$result")  // [4, 16, 36, 64, 100]
    
    // 对比：列表操作是立即执行的
    val listResult = (1..10).toList()
        .filter { it % 2 == 0 }  // 处理所有元素
        .map { it * it }         // 处理所有元素
        .take(3)                 // 然后才取前3个
    
    println("列表结果：$listResult")  // [4, 16, 36]
}
```

### 序列的优势
```kotlin
fun main() {
    // 生成序列
    val fibonacci = generateSequence(1 to 1) { (a, b) -> b to (a + b) }
        .map { it.first }
    
    val first10Fibonacci = fibonacci.take(10).toList()
    println("前10个斐波那契数：$first10Fibonacci")
    // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
    
    // 无限序列
    val primes = generateSequence(2) { it + 1 }
        .filter { candidate ->
            (2 until candidate).none { candidate % it == 0 }
        }
    
    val first10Primes = primes.take(10).toList()
    println("前10个质数：$first10Primes")
    // [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
}
```

## 🎯 实践练习

### 练习：学生成绩分析
```kotlin
data class Student(
    val name: String,
    val age: Int,
    val grades: List<Int>
)

fun main() {
    val students = listOf(
        Student("张三", 20, listOf(85, 92, 78, 96)),
        Student("李四", 19, listOf(88, 76, 94, 82)),
        Student("王五", 21, listOf(92, 88, 85, 90)),
        Student("赵六", 20, listOf(76, 82, 79, 85)),
        Student("钱七", 22, listOf(95, 89, 92, 88))
    )
    
    // 1. 计算每个学生的平均分
    val averageGrades = students.map { student ->
        student.name to student.grades.average()
    }.toMap()
    
    println("平均分：")
    averageGrades.forEach { (name, avg) ->
        println("$name: ${"%.2f".format(avg)}")
    }
    
    // 2. 找出平均分最高的学生
    val topStudent = students.maxByOrNull { it.grades.average() }
    println("\n最高平均分学生：${topStudent?.name} (${topStudent?.grades?.average()?.let { "%.2f".format(it) }})")
    
    // 3. 按年龄分组
    val groupedByAge = students.groupBy { it.age }
    println("\n按年龄分组：")
    groupedByAge.forEach { (age, studentList) ->
        println("$age 岁：${studentList.map { it.name }}")
    }
    
    // 4. 找出所有90分以上的成绩
    val highGrades = students
        .flatMap { student -> 
            student.grades.map { grade -> student.name to grade }
        }
        .filter { (_, grade) -> grade >= 90 }
    
    println("\n90分以上成绩：")
    highGrades.forEach { (name, grade) ->
        println("$name: $grade")
    }
    
    // 5. 统计各分数段人数
    val gradeRanges = students
        .flatMap { it.grades }
        .groupBy { grade ->
            when {
                grade >= 90 -> "优秀 (90-100)"
                grade >= 80 -> "良好 (80-89)"
                grade >= 70 -> "中等 (70-79)"
                else -> "需努力 (<70)"
            }
        }
        .mapValues { it.value.size }
    
    println("\n分数段统计：")
    gradeRanges.forEach { (range, count) ->
        println("$range: $count 个")
    }
    
    // 6. 使用序列优化大数据处理
    val processedData = students.asSequence()
        .filter { it.age >= 20 }
        .map { it.name to it.grades.average() }
        .filter { (_, avg) -> avg >= 85.0 }
        .sortedByDescending { (_, avg) -> avg }
        .take(3)
        .toList()
    
    println("\n20岁以上平均分85+的前3名：")
    processedData.forEach { (name, avg) ->
        println("$name: ${"%.2f".format(avg)}")
    }
}
```

## 🎯 下一步

掌握集合框架后，您可以继续学习：

1. [泛型](./generics.md)
2. [Lambda 表达式](./lambdas.md)
3. [扩展函数](./extensions.md)

---

*集合框架是 Kotlin 编程的重要工具，掌握它将大大提升您的数据处理能力！*
