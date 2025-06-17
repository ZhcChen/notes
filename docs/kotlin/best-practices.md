# 🏆 Kotlin 最佳实践

本章总结了 Kotlin 开发中的最佳实践，帮助您编写更清晰、更安全、更高效的代码。

## 🎯 学习目标

- 掌握 Kotlin 编码规范
- 学会编写惯用的 Kotlin 代码
- 了解性能优化技巧
- 掌握代码组织和架构原则

## 📝 编码规范

### 命名约定
```kotlin
// 类名：PascalCase
class UserService
class DatabaseConnection

// 函数和变量：camelCase
fun getUserById(id: String): User? { }
val userName = "张三"
var isActive = true

// 常量：UPPER_SNAKE_CASE
const val MAX_RETRY_COUNT = 3
const val DEFAULT_TIMEOUT = 5000L

// 包名：小写，用点分隔
package com.example.userservice

// 文件名：PascalCase
// UserService.kt
// DatabaseConnection.kt
```

### 代码格式化
```kotlin
// 好的格式
class User(
    val id: String,
    val name: String,
    val email: String
) {
    fun getDisplayName(): String {
        return if (name.isNotEmpty()) {
            name
        } else {
            "匿名用户"
        }
    }
}

// 链式调用格式
val result = users
    .filter { it.isActive }
    .map { it.name }
    .sorted()
    .take(10)
```

## 🛡️ 空安全最佳实践

### 优先使用非空类型
```kotlin
// 好的做法：明确的非空类型
fun processUser(user: User) {
    println("处理用户：${user.name}")
}

// 避免：不必要的可空类型
fun processUserBad(user: User?) {
    user?.let { println("处理用户：${it.name}") }
}

// 使用有意义的默认值
fun getUserName(user: User?): String {
    return user?.name ?: "匿名用户"
}

// 返回空集合而不是 null
fun getActiveUsers(): List<User> {
    return emptyList()  // 而不是返回 null
}
```

### 合理使用空安全操作符
```kotlin
// 好的做法：链式安全调用
val city = user?.address?.city ?: "未知城市"

// 避免：过度使用非空断言
val badExample = user!!.address!!.city!!  // 危险！

// 使用 let 处理可空值
user?.let { u ->
    println("用户：${u.name}")
    sendEmail(u.email)
}

// 使用 takeIf/takeUnless
val validEmail = email.takeIf { it.contains("@") }
```

## 🔧 函数设计

### 函数参数
```kotlin
// 使用默认参数减少重载
fun createUser(
    name: String,
    email: String,
    age: Int = 18,
    isActive: Boolean = true
) { }

// 使用命名参数提高可读性
createUser(
    name = "张三",
    email = "zhang@example.com",
    age = 25
)

// 避免过多参数，使用数据类
data class UserRequest(
    val name: String,
    val email: String,
    val age: Int = 18,
    val isActive: Boolean = true
)

fun createUser(request: UserRequest) { }
```

### 单一职责原则
```kotlin
// 好的做法：单一职责
fun validateEmail(email: String): Boolean {
    return email.contains("@") && email.contains(".")
}

fun sendEmail(email: String, message: String) {
    // 发送邮件逻辑
}

// 避免：职责混合
fun validateAndSendEmail(email: String, message: String) {
    // 验证和发送混在一起
}
```

## 🏗️ 类设计

### 数据类使用
```kotlin
// 使用数据类表示数据
data class User(
    val id: String,
    val name: String,
    val email: String
)

// 使用密封类表示状态
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

// 使用枚举表示常量
enum class UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}
```

### 类的组织
```kotlin
class UserService(
    private val repository: UserRepository,
    private val emailService: EmailService
) {
    // 公共方法在前
    fun createUser(request: UserRequest): User {
        validateRequest(request)
        val user = User(generateId(), request.name, request.email)
        repository.save(user)
        sendWelcomeEmail(user)
        return user
    }
    
    // 私有方法在后
    private fun validateRequest(request: UserRequest) {
        require(request.name.isNotEmpty()) { "姓名不能为空" }
        require(request.email.contains("@")) { "邮箱格式无效" }
    }
    
    private fun generateId(): String = UUID.randomUUID().toString()
    
    private fun sendWelcomeEmail(user: User) {
        emailService.send(user.email, "欢迎注册")
    }
}
```

## 🔄 集合操作

### 惯用的集合处理
```kotlin
// 使用函数式操作
val activeUsers = users
    .filter { it.status == UserStatus.ACTIVE }
    .sortedBy { it.name }

// 使用 groupBy 分组
val usersByStatus = users.groupBy { it.status }

// 使用 associate 创建映射
val userMap = users.associateBy { it.id }

// 使用 partition 分割
val (adults, minors) = users.partition { it.age >= 18 }

// 避免不必要的中间集合
val result = users
    .asSequence()  // 使用序列进行惰性计算
    .filter { it.isActive }
    .map { it.name }
    .take(10)
    .toList()
```

### 集合创建
```kotlin
// 使用具体的集合类型
val mutableList = mutableListOf<String>()
val immutableList = listOf("a", "b", "c")
val set = setOf(1, 2, 3)
val map = mapOf("key1" to "value1", "key2" to "value2")

// 使用 buildList/buildSet/buildMap
val dynamicList = buildList {
    add("first")
    if (condition) {
        add("conditional")
    }
    addAll(otherList)
}
```

## ⚡ 性能优化

### 避免不必要的对象创建
```kotlin
// 好的做法：重用对象
class StringProcessor {
    private val stringBuilder = StringBuilder()
    
    fun process(strings: List<String>): String {
        stringBuilder.clear()
        strings.forEach { stringBuilder.append(it) }
        return stringBuilder.toString()
    }
}

// 使用对象池
object DateFormatPool {
    private val formatters = ThreadLocal.withInitial { 
        SimpleDateFormat("yyyy-MM-dd") 
    }
    
    fun format(date: Date): String = formatters.get().format(date)
}
```

### 内联函数的使用
```kotlin
// 对于高阶函数使用 inline
inline fun <T> measureTime(block: () -> T): Pair<T, Long> {
    val start = System.currentTimeMillis()
    val result = block()
    val time = System.currentTimeMillis() - start
    return result to time
}

// 避免对大函数使用 inline
// inline fun largeFunction() { ... }  // 不推荐
```

## 🔒 异常处理

### 异常处理策略
```kotlin
// 使用具体的异常类型
class UserNotFoundException(userId: String) : 
    Exception("用户不存在：$userId")

class InvalidEmailException(email: String) : 
    Exception("无效邮箱：$email")

// 在适当的层级处理异常
class UserService {
    fun getUserById(id: String): User {
        return repository.findById(id) 
            ?: throw UserNotFoundException(id)
    }
}

class UserController {
    fun getUser(id: String): ResponseEntity<User> {
        return try {
            val user = userService.getUserById(id)
            ResponseEntity.ok(user)
        } catch (e: UserNotFoundException) {
            ResponseEntity.notFound().build()
        }
    }
}
```

### 使用 Result 类型
```kotlin
// 使用 Result 避免异常
fun parseNumber(input: String): Result<Int> {
    return try {
        Result.success(input.toInt())
    } catch (e: NumberFormatException) {
        Result.failure(e)
    }
}

// 链式处理 Result
val result = parseNumber("123")
    .map { it * 2 }
    .getOrElse { 0 }
```

## 🏛️ 架构原则

### 依赖注入
```kotlin
// 使用构造函数注入
class UserService(
    private val userRepository: UserRepository,
    private val emailService: EmailService,
    private val logger: Logger
) {
    // 实现
}

// 避免服务定位器模式
class BadUserService {
    private val userRepository = ServiceLocator.get<UserRepository>()
    // 不推荐
}
```

### 接口隔离
```kotlin
// 好的做法：小而专注的接口
interface UserReader {
    fun findById(id: String): User?
    fun findByEmail(email: String): User?
}

interface UserWriter {
    fun save(user: User): User
    fun delete(id: String)
}

// 避免：大而全的接口
interface BadUserRepository {
    fun findById(id: String): User?
    fun findByEmail(email: String): User?
    fun save(user: User): User
    fun delete(id: String)
    fun sendEmail(user: User)  // 职责不清
    fun generateReport(): String  // 职责不清
}
```

## 🧪 测试友好的代码

### 可测试的设计
```kotlin
// 好的做法：依赖注入，易于测试
class UserService(
    private val repository: UserRepository,
    private val timeProvider: TimeProvider = SystemTimeProvider()
) {
    fun createUser(name: String): User {
        val user = User(
            id = generateId(),
            name = name,
            createdAt = timeProvider.now()
        )
        return repository.save(user)
    }
    
    private fun generateId(): String = UUID.randomUUID().toString()
}

interface TimeProvider {
    fun now(): Instant
}

class SystemTimeProvider : TimeProvider {
    override fun now(): Instant = Instant.now()
}

// 测试中可以使用 MockTimeProvider
```

### 避免静态依赖
```kotlin
// 避免：难以测试的静态调用
class BadUserService {
    fun createUser(name: String): User {
        val user = User(
            id = UUID.randomUUID().toString(),  // 难以测试
            name = name,
            createdAt = Instant.now()  // 难以测试
        )
        return DatabaseConnection.save(user)  // 难以测试
    }
}
```

## 📚 文档和注释

### 有意义的注释
```kotlin
/**
 * 计算用户的信用评分
 * 
 * @param user 用户信息
 * @param transactions 最近12个月的交易记录
 * @return 信用评分 (0-1000)
 * @throws IllegalArgumentException 当用户信息不完整时
 */
fun calculateCreditScore(
    user: User, 
    transactions: List<Transaction>
): Int {
    // 验证输入参数
    require(user.age >= 18) { "用户年龄必须大于等于18岁" }
    
    // 计算基础分数（基于年龄和收入）
    val baseScore = calculateBaseScore(user)
    
    // 根据交易历史调整分数
    val adjustedScore = adjustScoreByTransactions(baseScore, transactions)
    
    return adjustedScore.coerceIn(0, 1000)
}

// 避免无意义的注释
// val name = user.name  // 获取用户姓名 - 无意义的注释
```

## 🎯 实践建议

### 代码审查清单
1. **空安全**：是否正确处理了可空类型？
2. **异常处理**：是否在适当的层级处理异常？
3. **性能**：是否避免了不必要的对象创建？
4. **可读性**：代码是否清晰易懂？
5. **测试性**：代码是否易于测试？
6. **单一职责**：每个类和函数是否只有一个职责？

### 重构技巧
```kotlin
// 重构前：长函数
fun processOrder(order: Order) {
    // 验证订单
    if (order.items.isEmpty()) throw IllegalArgumentException("订单为空")
    if (order.customer == null) throw IllegalArgumentException("客户信息缺失")
    
    // 计算总价
    var total = 0.0
    for (item in order.items) {
        total += item.price * item.quantity
    }
    
    // 应用折扣
    if (order.customer.isPremium) {
        total *= 0.9
    }
    
    // 保存订单
    database.save(order.copy(total = total))
    
    // 发送确认邮件
    emailService.send(order.customer.email, "订单确认")
}

// 重构后：小函数
fun processOrder(order: Order) {
    validateOrder(order)
    val total = calculateTotal(order)
    val finalOrder = order.copy(total = total)
    saveOrder(finalOrder)
    sendConfirmationEmail(finalOrder)
}

private fun validateOrder(order: Order) {
    require(order.items.isNotEmpty()) { "订单为空" }
    require(order.customer != null) { "客户信息缺失" }
}

private fun calculateTotal(order: Order): Double {
    val subtotal = order.items.sumOf { it.price * it.quantity }
    return if (order.customer.isPremium) subtotal * 0.9 else subtotal
}
```

## 🎯 下一步

掌握最佳实践后，您可以继续学习：

1. [性能优化](./performance.md)
2. [Android 开发](./android-development.md)
3. [多平台开发](./multiplatform.md)

---

*遵循最佳实践将让您的 Kotlin 代码更加专业和高效！*
