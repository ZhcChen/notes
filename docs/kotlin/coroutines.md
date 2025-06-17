# ⚡ Kotlin 协程

协程是 Kotlin 中用于异步编程的强大工具，它提供了一种轻量级的并发编程方式，让异步代码看起来像同步代码一样简洁。

## 🎯 学习目标

- 理解协程的基本概念
- 掌握协程的创建和使用
- 学会协程的取消和异常处理
- 了解协程的实际应用场景

## 🌟 协程简介

### 什么是协程？
协程是一种并发设计模式，可以在单个线程上运行多个协程，通过协作式多任务来实现并发。

```kotlin
import kotlinx.coroutines.*

fun main() {
    println("程序开始")
    
    // 创建协程
    runBlocking {
        launch {
            delay(1000)  // 非阻塞延迟
            println("协程执行完毕")
        }
        println("主协程继续执行")
    }
    
    println("程序结束")
}
```

### 协程 vs 线程
```kotlin
import kotlinx.coroutines.*
import kotlin.system.measureTimeMillis

fun main() {
    // 线程方式（资源消耗大）
    val threadTime = measureTimeMillis {
        val threads = List(10000) {
            Thread {
                Thread.sleep(1000)
                print(".")
            }
        }
        threads.forEach { it.start() }
        threads.forEach { it.join() }
    }
    println("\n线程耗时：${threadTime}ms")
    
    // 协程方式（轻量级）
    val coroutineTime = measureTimeMillis {
        runBlocking {
            repeat(10000) {
                launch {
                    delay(1000)
                    print(".")
                }
            }
        }
    }
    println("\n协程耗时：${coroutineTime}ms")
}
```

## 🚀 协程构建器

### runBlocking
```kotlin
import kotlinx.coroutines.*

fun main() {
    println("开始")
    
    // runBlocking：阻塞当前线程直到协程完成
    runBlocking {
        delay(1000)
        println("runBlocking 完成")
    }
    
    println("结束")
}
```

### launch
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    // launch：启动新协程，不阻塞当前协程
    val job = launch {
        repeat(5) { i ->
            println("协程工作中 $i")
            delay(500)
        }
    }
    
    delay(1300)
    println("主协程等待中...")
    job.join()  // 等待协程完成
    println("完成")
}
```

### async
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    // async：启动协程并返回 Deferred（可以获取结果）
    val deferred1 = async {
        delay(1000)
        "结果1"
    }
    
    val deferred2 = async {
        delay(1500)
        "结果2"
    }
    
    // 等待结果
    println("结果：${deferred1.await()} 和 ${deferred2.await()}")
}
```

## 🔄 挂起函数

### suspend 关键字
```kotlin
import kotlinx.coroutines.*

// 挂起函数只能在协程或其他挂起函数中调用
suspend fun fetchData(): String {
    delay(1000)  // 模拟网络请求
    return "数据"
}

suspend fun processData(data: String): String {
    delay(500)   // 模拟数据处理
    return "处理后的$data"
}

fun main() = runBlocking {
    val data = fetchData()
    val result = processData(data)
    println(result)  // 处理后的数据
}
```

### 挂起函数的组合
```kotlin
import kotlinx.coroutines.*

suspend fun getUserInfo(userId: String): String {
    delay(1000)
    return "用户信息：$userId"
}

suspend fun getUserPosts(userId: String): List<String> {
    delay(800)
    return listOf("帖子1", "帖子2", "帖子3")
}

fun main() = runBlocking {
    val userId = "user123"
    
    // 顺序执行
    val userInfo = getUserInfo(userId)
    val userPosts = getUserPosts(userId)
    println("$userInfo, 帖子：$userPosts")
    
    // 并发执行
    val userInfoDeferred = async { getUserInfo(userId) }
    val userPostsDeferred = async { getUserPosts(userId) }
    
    val info = userInfoDeferred.await()
    val posts = userPostsDeferred.await()
    println("并发结果：$info, 帖子：$posts")
}
```

## 🎛️ 协程上下文和调度器

### 调度器类型
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    // Dispatchers.Default：CPU 密集型任务
    launch(Dispatchers.Default) {
        println("Default: ${Thread.currentThread().name}")
        // CPU 密集型计算
    }
    
    // Dispatchers.IO：IO 密集型任务
    launch(Dispatchers.IO) {
        println("IO: ${Thread.currentThread().name}")
        // 文件读写、网络请求
    }
    
    // Dispatchers.Main：主线程（Android）
    // launch(Dispatchers.Main) {
    //     // UI 更新
    // }
    
    // Dispatchers.Unconfined：不限制线程
    launch(Dispatchers.Unconfined) {
        println("Unconfined: ${Thread.currentThread().name}")
    }
    
    delay(100)
}
```

### 协程作用域
```kotlin
import kotlinx.coroutines.*

class MyClass {
    private val scope = CoroutineScope(Dispatchers.Default + Job())
    
    fun doSomething() {
        scope.launch {
            repeat(5) { i ->
                println("工作中 $i")
                delay(500)
            }
        }
    }
    
    fun cleanup() {
        scope.cancel()  // 取消所有协程
    }
}

fun main() = runBlocking {
    val myClass = MyClass()
    myClass.doSomething()
    
    delay(2000)
    myClass.cleanup()
    delay(1000)
    println("程序结束")
}
```

## ❌ 协程取消

### 取消协程
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val job = launch {
        repeat(1000) { i ->
            println("工作中 $i")
            delay(500)
        }
    }
    
    delay(1300)
    println("取消协程")
    job.cancel()  // 取消协程
    job.join()    // 等待协程结束
    println("协程已取消")
}
```

### 协作式取消
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val job = launch {
        try {
            repeat(1000) { i ->
                // 检查是否被取消
                if (!isActive) {
                    println("协程被取消")
                    return@launch
                }
                println("工作中 $i")
                delay(500)
            }
        } catch (e: CancellationException) {
            println("协程取消异常：${e.message}")
        } finally {
            println("清理资源")
        }
    }
    
    delay(1300)
    job.cancel("手动取消")
    job.join()
}
```

### 超时取消
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    try {
        withTimeout(1300) {
            repeat(1000) { i ->
                println("工作中 $i")
                delay(500)
            }
        }
    } catch (e: TimeoutCancellationException) {
        println("操作超时")
    }
    
    // 或者使用 withTimeoutOrNull
    val result = withTimeoutOrNull(1300) {
        repeat(1000) { i ->
            println("工作中 $i")
            delay(500)
        }
        "完成"
    }
    println("结果：$result")  // null（超时）
}
```

## 🔧 异常处理

### 协程异常处理
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    // 使用 try-catch
    try {
        launch {
            throw RuntimeException("协程异常")
        }.join()
    } catch (e: Exception) {
        println("捕获异常：${e.message}")
    }
    
    // 使用 CoroutineExceptionHandler
    val handler = CoroutineExceptionHandler { _, exception ->
        println("异常处理器：${exception.message}")
    }
    
    val job = launch(handler) {
        throw RuntimeException("未处理异常")
    }
    
    job.join()
}
```

### async 异常处理
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    // async 异常在 await() 时抛出
    val deferred = async {
        delay(100)
        throw RuntimeException("async 异常")
    }
    
    try {
        deferred.await()
    } catch (e: Exception) {
        println("捕获 async 异常：${e.message}")
    }
}
```

## 🌊 协程流（Flow）

### 基本 Flow
```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun simpleFlow(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100)
        emit(i)  // 发射值
    }
}

fun main() = runBlocking {
    // 收集 Flow
    simpleFlow().collect { value ->
        println("收到：$value")
    }
}
```

### Flow 操作符
```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun main() = runBlocking {
    (1..5).asFlow()
        .map { it * it }           // 转换
        .filter { it > 10 }        // 过滤
        .collect { println(it) }   // 收集
    
    // 组合 Flow
    val flow1 = (1..3).asFlow()
    val flow2 = (4..6).asFlow()
    
    flow1.zip(flow2) { a, b -> a + b }
        .collect { println("组合：$it") }
}
```

## 🎯 实际应用

### 网络请求模拟
```kotlin
import kotlinx.coroutines.*

data class User(val id: String, val name: String)
data class Post(val id: String, val title: String, val userId: String)

class ApiService {
    suspend fun getUser(id: String): User {
        delay(1000)  // 模拟网络延迟
        return User(id, "用户$id")
    }
    
    suspend fun getUserPosts(userId: String): List<Post> {
        delay(800)
        return listOf(
            Post("1", "帖子1", userId),
            Post("2", "帖子2", userId)
        )
    }
}

fun main() = runBlocking {
    val apiService = ApiService()
    
    // 并发获取用户信息和帖子
    val userId = "123"
    val userDeferred = async { apiService.getUser(userId) }
    val postsDeferred = async { apiService.getUserPosts(userId) }
    
    val user = userDeferred.await()
    val posts = postsDeferred.await()
    
    println("用户：${user.name}")
    println("帖子：${posts.map { it.title }}")
}
```

### 生产者-消费者模式
```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()
    
    // 生产者
    launch {
        for (x in 1..5) {
            println("发送：$x")
            channel.send(x)
            delay(100)
        }
        channel.close()
    }
    
    // 消费者
    launch {
        for (y in channel) {
            println("接收：$y")
            delay(200)
        }
    }
    
    delay(2000)
}
```

## 🎯 最佳实践

### 1. 使用结构化并发
```kotlin
import kotlinx.coroutines.*

class UserRepository {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    fun loadUserData(userId: String) {
        scope.launch {
            try {
                val user = fetchUser(userId)
                val posts = fetchUserPosts(userId)
                // 处理数据
            } catch (e: Exception) {
                // 处理异常
            }
        }
    }
    
    fun cleanup() {
        scope.cancel()
    }
    
    private suspend fun fetchUser(userId: String): String {
        delay(1000)
        return "用户数据"
    }
    
    private suspend fun fetchUserPosts(userId: String): List<String> {
        delay(800)
        return listOf("帖子1", "帖子2")
    }
}
```

### 2. 避免阻塞操作
```kotlin
import kotlinx.coroutines.*

// 错误：在协程中使用阻塞操作
fun badExample() = runBlocking {
    launch {
        Thread.sleep(1000)  // 阻塞线程
    }
}

// 正确：使用挂起函数
fun goodExample() = runBlocking {
    launch {
        delay(1000)  // 非阻塞挂起
    }
}
```

### 3. 合理使用调度器
```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    // CPU 密集型任务
    val result = withContext(Dispatchers.Default) {
        // 复杂计算
        (1..1000000).sum()
    }
    
    // IO 操作
    withContext(Dispatchers.IO) {
        // 文件读写、网络请求
    }
    
    println("计算结果：$result")
}
```

## 🎯 下一步

掌握协程后，您可以继续学习：

1. [集合框架](./collections.md)
2. [泛型](./generics.md)
3. [Android 开发](./android-development.md)

---

*协程是 Kotlin 异步编程的核心，掌握它将让您能够编写高效的并发程序！*
