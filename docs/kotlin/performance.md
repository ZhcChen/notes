# ⚡ Kotlin 性能优化

性能优化是软件开发中的重要环节。本章将介绍 Kotlin 中的性能优化技巧，帮助您编写高效的代码。

## 🎯 学习目标

- 理解 Kotlin 的性能特点
- 掌握内存优化技巧
- 学会 CPU 性能优化
- 了解性能测试和分析方法

## 📊 性能基础概念

### JVM 性能特点
```kotlin
import kotlin.system.measureTimeMillis

fun main() {
    // JVM 预热
    repeat(10000) {
        simpleCalculation()
    }
    
    // 测量性能
    val time = measureTimeMillis {
        repeat(1000000) {
            simpleCalculation()
        }
    }
    
    println("执行时间：${time}ms")
}

fun simpleCalculation(): Int {
    return (1..100).sum()
}
```

### 性能测试框架
```kotlin
// 简单的性能测试工具
class PerformanceTester {
    
    fun <T> benchmark(
        name: String,
        warmupIterations: Int = 1000,
        testIterations: Int = 10000,
        action: () -> T
    ): BenchmarkResult {
        // 预热
        repeat(warmupIterations) { action() }
        
        // 测试
        val times = mutableListOf<Long>()
        repeat(testIterations) {
            val time = measureTimeMillis { action() }
            times.add(time)
        }
        
        val avgTime = times.average()
        val minTime = times.minOrNull() ?: 0L
        val maxTime = times.maxOrNull() ?: 0L
        
        return BenchmarkResult(name, avgTime, minTime, maxTime)
    }
    
    data class BenchmarkResult(
        val name: String,
        val avgTime: Double,
        val minTime: Long,
        val maxTime: Long
    ) {
        override fun toString(): String {
            return "$name: 平均 ${avgTime}ms, 最小 ${minTime}ms, 最大 ${maxTime}ms"
        }
    }
}

fun main() {
    val tester = PerformanceTester()
    
    // 测试不同的实现
    val result1 = tester.benchmark("for循环") {
        var sum = 0
        for (i in 1..1000) {
            sum += i
        }
        sum
    }
    
    val result2 = tester.benchmark("函数式") {
        (1..1000).sum()
    }
    
    println(result1)
    println(result2)
}
```

## 🧠 内存优化

### 对象创建优化
```kotlin
// ❌ 避免：频繁创建对象
fun badStringConcatenation(items: List<String>): String {
    var result = ""
    for (item in items) {
        result += item  // 每次都创建新的 String 对象
    }
    return result
}

// ✅ 好的做法：使用 StringBuilder
fun goodStringConcatenation(items: List<String>): String {
    val builder = StringBuilder()
    for (item in items) {
        builder.append(item)
    }
    return builder.toString()
}

// ✅ 更好的做法：使用 joinToString
fun bestStringConcatenation(items: List<String>): String {
    return items.joinToString("")
}

// 对象池模式
class ObjectPool<T>(
    private val factory: () -> T,
    private val reset: (T) -> Unit,
    maxSize: Int = 10
) {
    private val pool = ArrayDeque<T>(maxSize)
    
    fun acquire(): T {
        return if (pool.isNotEmpty()) {
            pool.removeFirst()
        } else {
            factory()
        }
    }
    
    fun release(obj: T) {
        reset(obj)
        if (pool.size < 10) {  // 限制池大小
            pool.addLast(obj)
        }
    }
}

// 使用对象池
class StringBuilderPool {
    companion object {
        private val pool = ObjectPool(
            factory = { StringBuilder() },
            reset = { it.clear() }
        )
        
        fun withStringBuilder(action: (StringBuilder) -> String): String {
            val sb = pool.acquire()
            try {
                return action(sb)
            } finally {
                pool.release(sb)
            }
        }
    }
}

fun main() {
    val items = (1..1000).map { "Item$it" }
    
    // 测试性能
    val tester = PerformanceTester()
    
    val result1 = tester.benchmark("StringBuilder池") {
        StringBuilderPool.withStringBuilder { sb ->
            items.forEach { sb.append(it) }
            sb.toString()
        }
    }
    
    val result2 = tester.benchmark("joinToString") {
        items.joinToString("")
    }
    
    println(result1)
    println(result2)
}
```

### 集合优化
```kotlin
// 选择合适的集合类型
fun collectionPerformance() {
    val size = 100000
    val tester = PerformanceTester()
    
    // ArrayList vs LinkedList
    val arrayListResult = tester.benchmark("ArrayList添加") {
        val list = ArrayList<Int>()
        repeat(size) { list.add(it) }
        list
    }
    
    val linkedListResult = tester.benchmark("LinkedList添加") {
        val list = LinkedList<Int>()
        repeat(size) { list.add(it) }
        list
    }
    
    println(arrayListResult)
    println(linkedListResult)
    
    // 预分配容量
    val preAllocatedResult = tester.benchmark("预分配ArrayList") {
        val list = ArrayList<Int>(size)
        repeat(size) { list.add(it) }
        list
    }
    
    println(preAllocatedResult)
}

// 使用原始类型数组
fun primitiveArrays() {
    val size = 1000000
    val tester = PerformanceTester()
    
    // 装箱类型列表
    val boxedResult = tester.benchmark("装箱列表") {
        val list = mutableListOf<Int>()
        repeat(size) { list.add(it) }
        list.sum()
    }
    
    // 原始类型数组
    val primitiveResult = tester.benchmark("原始数组") {
        val array = IntArray(size) { it }
        array.sum()
    }
    
    println(boxedResult)
    println(primitiveResult)
}

// 避免不必要的集合操作
fun efficientCollectionOperations() {
    val numbers = (1..1000000).toList()
    val tester = PerformanceTester()
    
    // ❌ 多次遍历
    val multiplePassResult = tester.benchmark("多次遍历") {
        numbers.filter { it % 2 == 0 }
            .map { it * 2 }
            .filter { it > 1000 }
            .sum()
    }
    
    // ✅ 单次遍历
    val singlePassResult = tester.benchmark("单次遍历") {
        var sum = 0
        for (number in numbers) {
            if (number % 2 == 0) {
                val doubled = number * 2
                if (doubled > 1000) {
                    sum += doubled
                }
            }
        }
        sum
    }
    
    // ✅ 使用序列（惰性计算）
    val sequenceResult = tester.benchmark("序列") {
        numbers.asSequence()
            .filter { it % 2 == 0 }
            .map { it * 2 }
            .filter { it > 1000 }
            .sum()
    }
    
    println(multiplePassResult)
    println(singlePassResult)
    println(sequenceResult)
}
```

## 🚀 CPU 性能优化

### 内联函数优化
```kotlin
// 内联函数避免函数调用开销
inline fun <T> measureTime(block: () -> T): Pair<T, Long> {
    val start = System.nanoTime()
    val result = block()
    val end = System.nanoTime()
    return result to (end - start)
}

// 高阶函数的内联优化
inline fun <T> List<T>.customFilter(predicate: (T) -> Boolean): List<T> {
    val result = mutableListOf<T>()
    for (item in this) {
        if (predicate(item)) {
            result.add(item)
        }
    }
    return result
}

// 避免装箱的内联函数
inline fun IntArray.customSum(): Int {
    var sum = 0
    for (element in this) {
        sum += element
    }
    return sum
}

fun main() {
    val numbers = IntArray(1000000) { it }
    val tester = PerformanceTester()
    
    val inlineResult = tester.benchmark("内联求和") {
        numbers.customSum()
    }
    
    val standardResult = tester.benchmark("标准求和") {
        numbers.sum()
    }
    
    println(inlineResult)
    println(standardResult)
}
```

### 循环优化
```kotlin
// 循环优化技巧
fun loopOptimizations() {
    val size = 1000000
    val array = IntArray(size) { it }
    val tester = PerformanceTester()
    
    // 减少边界检查
    val boundsCheckResult = tester.benchmark("边界检查") {
        var sum = 0
        for (i in array.indices) {
            sum += array[i]  // 每次都检查边界
        }
        sum
    }
    
    val noBoundsCheckResult = tester.benchmark("无边界检查") {
        var sum = 0
        for (element in array) {  // 迭代器，减少边界检查
            sum += element
        }
        sum
    }
    
    // 循环展开
    val unrolledResult = tester.benchmark("循环展开") {
        var sum = 0
        var i = 0
        while (i < array.size - 3) {
            sum += array[i] + array[i + 1] + array[i + 2] + array[i + 3]
            i += 4
        }
        while (i < array.size) {
            sum += array[i]
            i++
        }
        sum
    }
    
    println(boundsCheckResult)
    println(noBoundsCheckResult)
    println(unrolledResult)
}
```

### 算法优化
```kotlin
// 选择合适的算法
class AlgorithmOptimization {
    
    // ❌ 低效的查找
    fun linearSearch(list: List<Int>, target: Int): Int {
        for (i in list.indices) {
            if (list[i] == target) return i
        }
        return -1
    }
    
    // ✅ 高效的查找（对于已排序数据）
    fun binarySearch(list: List<Int>, target: Int): Int {
        var left = 0
        var right = list.size - 1
        
        while (left <= right) {
            val mid = (left + right) / 2
            when {
                list[mid] == target -> return mid
                list[mid] < target -> left = mid + 1
                else -> right = mid - 1
            }
        }
        return -1
    }
    
    // 使用哈希表优化查找
    fun hashMapLookup(map: Map<Int, Int>, target: Int): Int? {
        return map[target]
    }
}

fun main() {
    val size = 100000
    val sortedList = (1..size).toList()
    val hashMap = sortedList.withIndex().associate { it.value to it.index }
    val target = size / 2
    
    val optimizer = AlgorithmOptimization()
    val tester = PerformanceTester()
    
    val linearResult = tester.benchmark("线性查找") {
        optimizer.linearSearch(sortedList, target)
    }
    
    val binaryResult = tester.benchmark("二分查找") {
        optimizer.binarySearch(sortedList, target)
    }
    
    val hashMapResult = tester.benchmark("哈希表查找") {
        optimizer.hashMapLookup(hashMap, target)
    }
    
    println(linearResult)
    println(binaryResult)
    println(hashMapResult)
}
```

## 🔧 编译器优化

### 编译器标志
```kotlin
// build.gradle.kts 中的优化配置
/*
kotlinOptions {
    jvmTarget = "11"
    freeCompilerArgs = listOf(
        "-Xjsr305=strict",
        "-Xjvm-default=all",
        "-opt-in=kotlin.RequiresOptIn"
    )
}

// 启用实验性优化
tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = freeCompilerArgs + listOf(
            "-Xuse-experimental=kotlin.Experimental"
        )
    }
}
*/
```

### 内联类优化
```kotlin
// 内联类避免装箱开销
@JvmInline
value class UserId(val value: String)

@JvmInline
value class Price(val value: Double)

// 传统类（有装箱开销）
data class TraditionalUserId(val value: String)

fun performanceComparison() {
    val tester = PerformanceTester()
    val iterations = 1000000
    
    // 内联类性能测试
    val inlineClassResult = tester.benchmark("内联类") {
        val userIds = mutableListOf<UserId>()
        repeat(iterations) {
            userIds.add(UserId("user_$it"))
        }
        userIds.size
    }
    
    // 传统类性能测试
    val traditionalClassResult = tester.benchmark("传统类") {
        val userIds = mutableListOf<TraditionalUserId>()
        repeat(iterations) {
            userIds.add(TraditionalUserId("user_$it"))
        }
        userIds.size
    }
    
    println(inlineClassResult)
    println(traditionalClassResult)
}
```

## 📈 性能监控

### 内存使用监控
```kotlin
import java.lang.management.ManagementFactory

class MemoryMonitor {
    
    fun getMemoryUsage(): MemoryInfo {
        val memoryBean = ManagementFactory.getMemoryMXBean()
        val heapMemory = memoryBean.heapMemoryUsage
        val nonHeapMemory = memoryBean.nonHeapMemoryUsage
        
        return MemoryInfo(
            heapUsed = heapMemory.used,
            heapMax = heapMemory.max,
            nonHeapUsed = nonHeapMemory.used,
            nonHeapMax = nonHeapMemory.max
        )
    }
    
    fun forceGC() {
        System.gc()
        Thread.sleep(100)  // 等待 GC 完成
    }
    
    data class MemoryInfo(
        val heapUsed: Long,
        val heapMax: Long,
        val nonHeapUsed: Long,
        val nonHeapMax: Long
    ) {
        fun heapUsagePercent(): Double = (heapUsed.toDouble() / heapMax) * 100
        
        override fun toString(): String {
            return "堆内存: ${heapUsed / 1024 / 1024}MB / ${heapMax / 1024 / 1024}MB (${String.format("%.1f", heapUsagePercent())}%)"
        }
    }
}

fun memoryLeakExample() {
    val monitor = MemoryMonitor()
    val leakyList = mutableListOf<ByteArray>()
    
    println("初始内存: ${monitor.getMemoryUsage()}")
    
    // 模拟内存泄漏
    repeat(1000) {
        leakyList.add(ByteArray(1024 * 1024))  // 1MB
        
        if (it % 100 == 0) {
            println("分配 ${it + 1} MB: ${monitor.getMemoryUsage()}")
        }
    }
    
    // 清理内存
    leakyList.clear()
    monitor.forceGC()
    println("清理后: ${monitor.getMemoryUsage()}")
}
```

### CPU 性能分析
```kotlin
import java.lang.management.ManagementFactory

class CPUMonitor {
    
    fun getCPUUsage(): Double {
        val osBean = ManagementFactory.getOperatingSystemMXBean()
        if (osBean is com.sun.management.OperatingSystemMXBean) {
            return osBean.processCpuLoad * 100
        }
        return -1.0
    }
    
    fun getThreadCount(): Int {
        val threadBean = ManagementFactory.getThreadMXBean()
        return threadBean.threadCount
    }
    
    fun profileMethod(name: String, iterations: Int, method: () -> Unit) {
        val startCPU = getCPUUsage()
        val startTime = System.nanoTime()
        
        repeat(iterations) {
            method()
        }
        
        val endTime = System.nanoTime()
        val endCPU = getCPUUsage()
        
        val duration = (endTime - startTime) / 1_000_000.0  // 转换为毫秒
        val avgCPU = (startCPU + endCPU) / 2
        
        println("$name: ${duration}ms, CPU: ${String.format("%.1f", avgCPU)}%, 线程: ${getThreadCount()}")
    }
}

fun main() {
    val cpuMonitor = CPUMonitor()
    
    // 测试不同的计算密集型任务
    cpuMonitor.profileMethod("质数计算", 1000) {
        isPrime(97)
    }
    
    cpuMonitor.profileMethod("排序算法", 100) {
        val list = (1..1000).shuffled().toMutableList()
        list.sort()
    }
}

fun isPrime(n: Int): Boolean {
    if (n < 2) return false
    for (i in 2..Math.sqrt(n.toDouble()).toInt()) {
        if (n % i == 0) return false
    }
    return true
}
```

## 🎯 最佳实践

### 1. 性能优化原则
```kotlin
// ✅ 先测量，再优化
fun optimizationPrinciples() {
    // 1. 确定性能瓶颈
    // 2. 设定性能目标
    // 3. 实施优化
    // 4. 验证效果
    // 5. 重复过程
}

// ✅ 选择合适的数据结构
fun chooseRightDataStructure() {
    // 频繁查找：使用 HashMap
    // 有序数据：使用 TreeMap
    // 频繁插入删除：使用 LinkedList
    // 随机访问：使用 ArrayList
}
```

### 2. 避免过早优化
```kotlin
// ❌ 过早优化
fun prematureOptimization() {
    // 在没有性能问题时就开始优化
    // 牺牲代码可读性来获得微小的性能提升
}

// ✅ 合理优化
fun reasonableOptimization() {
    // 先确保代码正确性
    // 识别真正的性能瓶颈
    // 在关键路径上进行优化
    // 保持代码可读性
}
```

### 3. 性能测试策略
```kotlin
class PerformanceTestStrategy {
    
    // 基准测试
    fun benchmarkTesting() {
        // 使用一致的测试环境
        // 多次运行取平均值
        // 预热 JVM
        // 测试不同的输入规模
    }
    
    // 负载测试
    fun loadTesting() {
        // 模拟真实负载
        // 监控系统资源
        // 识别性能瓶颈
        // 测试极限情况
    }
    
    // 回归测试
    fun regressionTesting() {
        // 建立性能基线
        // 自动化性能测试
        // 监控性能变化
        // 及时发现性能退化
    }
}
```

## 🎯 下一步

掌握性能优化后，您可以继续学习：

1. [开发工具](./tools.md)
2. [Web 开发](./web-development.md)
3. [多平台开发](./multiplatform.md)

---

*性能优化是一个持续的过程，要在性能和代码可维护性之间找到平衡！*
