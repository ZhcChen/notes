# 🧪 Kotlin 测试

测试是软件开发中的重要环节，Kotlin 提供了优秀的测试支持，包括单元测试、集成测试和协程测试等。

## 🎯 学习目标

- 掌握 Kotlin 测试基础
- 学会使用 JUnit 5 进行单元测试
- 了解 MockK 模拟框架
- 掌握协程测试技巧

## 🏗️ 测试环境搭建

### Gradle 配置
```kotlin
// build.gradle.kts
dependencies {
    // JUnit 5
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.9.3")
    testImplementation("org.junit.jupiter:junit-jupiter-params:5.9.3")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.9.3")
    
    // Kotlin 测试
    testImplementation(kotlin("test"))
    
    // MockK 模拟框架
    testImplementation("io.mockk:mockk:1.13.5")
    
    // 协程测试
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    
    // AssertJ（可选，更好的断言）
    testImplementation("org.assertj.core:assertj-core:3.24.2")
}

tasks.test {
    useJUnitPlatform()
    
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = true
    }
}
```

## 📝 基础单元测试

### JUnit 5 基础
```kotlin
import org.junit.jupiter.api.*
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class CalculatorTest {
    
    private lateinit var calculator: Calculator
    
    @BeforeEach
    fun setUp() {
        calculator = Calculator()
    }
    
    @AfterEach
    fun tearDown() {
        // 清理资源
    }
    
    @Test
    fun `should add two numbers correctly`() {
        // Given
        val a = 5
        val b = 3
        
        // When
        val result = calculator.add(a, b)
        
        // Then
        assertEquals(8, result)
    }
    
    @Test
    fun `should throw exception when dividing by zero`() {
        assertThrows<IllegalArgumentException> {
            calculator.divide(10, 0)
        }
    }
    
    @Test
    @DisplayName("测试乘法运算")
    fun testMultiplication() {
        val result = calculator.multiply(4, 5)
        assertEquals(20, result)
    }
}

class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    fun multiply(a: Int, b: Int): Int = a * b
    fun divide(a: Int, b: Int): Int {
        if (b == 0) throw IllegalArgumentException("除数不能为零")
        return a / b
    }
}
```

### 参数化测试
```kotlin
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.*
import kotlin.test.assertEquals

class ParameterizedTestExample {
    
    @ParameterizedTest
    @ValueSource(ints = [1, 2, 3, 4, 5])
    fun `should return true for positive numbers`(number: Int) {
        assertTrue(number > 0)
    }
    
    @ParameterizedTest
    @CsvSource(
        "1, 1, 2",
        "2, 3, 5",
        "5, 7, 12"
    )
    fun `should add numbers correctly`(a: Int, b: Int, expected: Int) {
        val calculator = Calculator()
        assertEquals(expected, calculator.add(a, b))
    }
    
    @ParameterizedTest
    @MethodSource("stringProvider")
    fun `should handle different strings`(input: String) {
        assertTrue(input.isNotEmpty())
    }
    
    companion object {
        @JvmStatic
        fun stringProvider() = listOf("hello", "world", "kotlin")
    }
}
```

## 🎭 模拟测试 (MockK)

### 基本模拟
```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

interface UserRepository {
    fun findById(id: String): User?
    fun save(user: User): User
}

data class User(val id: String, val name: String, val email: String)

class UserService(private val repository: UserRepository) {
    fun getUserById(id: String): User {
        return repository.findById(id) ?: throw UserNotFoundException("用户不存在")
    }
    
    fun createUser(name: String, email: String): User {
        val user = User(generateId(), name, email)
        return repository.save(user)
    }
    
    private fun generateId(): String = "user_${System.currentTimeMillis()}"
}

class UserNotFoundException(message: String) : Exception(message)

class UserServiceTest {
    
    private val repository = mockk<UserRepository>()
    private val userService = UserService(repository)
    
    @Test
    fun `should return user when found`() {
        // Given
        val userId = "123"
        val expectedUser = User(userId, "张三", "zhang@example.com")
        every { repository.findById(userId) } returns expectedUser
        
        // When
        val result = userService.getUserById(userId)
        
        // Then
        assertEquals(expectedUser, result)
        verify { repository.findById(userId) }
    }
    
    @Test
    fun `should throw exception when user not found`() {
        // Given
        val userId = "999"
        every { repository.findById(userId) } returns null
        
        // When & Then
        assertThrows<UserNotFoundException> {
            userService.getUserById(userId)
        }
    }
    
    @Test
    fun `should create user successfully`() {
        // Given
        val name = "李四"
        val email = "li@example.com"
        val savedUser = User("generated_id", name, email)
        
        every { repository.save(any()) } returns savedUser
        
        // When
        val result = userService.createUser(name, email)
        
        // Then
        assertEquals(savedUser, result)
        verify { repository.save(match { it.name == name && it.email == email }) }
    }
}
```

### 高级模拟技巧
```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test

class AdvancedMockingTest {
    
    @Test
    fun `should use relaxed mock`() {
        // relaxed mock 自动返回默认值
        val repository = mockk<UserRepository>(relaxed = true)
        
        // 不需要 every，会返回默认值
        val result = repository.findById("123")
        println(result)  // null
    }
    
    @Test
    fun `should capture arguments`() {
        val repository = mockk<UserRepository>()
        val userSlot = slot<User>()
        
        every { repository.save(capture(userSlot)) } returns mockk()
        
        val userService = UserService(repository)
        userService.createUser("测试", "test@example.com")
        
        // 验证捕获的参数
        assertEquals("测试", userSlot.captured.name)
        assertEquals("test@example.com", userSlot.captured.email)
    }
    
    @Test
    fun `should mock static methods`() {
        mockkStatic(System::class)
        every { System.currentTimeMillis() } returns 12345L
        
        // 测试依赖 System.currentTimeMillis() 的代码
        
        unmockkStatic(System::class)
    }
    
    @Test
    fun `should verify call order`() {
        val repository = mockk<UserRepository>(relaxed = true)
        
        repository.findById("1")
        repository.findById("2")
        
        verifyOrder {
            repository.findById("1")
            repository.findById("2")
        }
    }
}
```

## ⚡ 协程测试

### 基本协程测试
```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class CoroutineService {
    suspend fun fetchData(): String {
        delay(1000)
        return "数据"
    }
    
    suspend fun processData(data: String): String {
        delay(500)
        return "处理后的$data"
    }
}

class CoroutineServiceTest {
    
    @Test
    fun `should fetch and process data`() = runTest {
        val service = CoroutineService()
        
        val data = service.fetchData()
        val result = service.processData(data)
        
        assertEquals("处理后的数据", result)
    }
    
    @Test
    fun `should test with virtual time`() = runTest {
        val service = CoroutineService()
        
        // 虚拟时间，测试立即完成
        val result = service.fetchData()
        assertEquals("数据", result)
    }
    
    @Test
    fun `should test concurrent operations`() = runTest {
        val service = CoroutineService()
        
        val deferred1 = async { service.fetchData() }
        val deferred2 = async { service.fetchData() }
        
        val results = awaitAll(deferred1, deferred2)
        assertEquals(listOf("数据", "数据"), results)
    }
}
```

### 测试调度器
```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.Test

class SchedulerTestExample {
    
    @Test
    fun `should test with test dispatcher`() = runTest {
        val testDispatcher = StandardTestDispatcher()
        
        var result = ""
        
        launch(testDispatcher) {
            delay(1000)
            result = "完成"
        }
        
        // 此时协程还未执行
        assertEquals("", result)
        
        // 推进虚拟时间
        advanceTimeBy(1000)
        
        // 现在协程执行完成
        assertEquals("完成", result)
    }
    
    @Test
    fun `should test with unconfined dispatcher`() = runTest {
        val testDispatcher = UnconfinedTestDispatcher()
        
        var result = ""
        
        launch(testDispatcher) {
            result = "立即执行"
        }
        
        // UnconfinedTestDispatcher 立即执行
        assertEquals("立即执行", result)
    }
}
```

## 🎯 测试最佳实践

### 1. 测试结构 (AAA 模式)
```kotlin
class BestPracticeTest {
    
    @Test
    fun `should follow AAA pattern`() {
        // Arrange (准备)
        val calculator = Calculator()
        val a = 5
        val b = 3
        
        // Act (执行)
        val result = calculator.add(a, b)
        
        // Assert (断言)
        assertEquals(8, result)
    }
}
```

### 2. 测试命名
```kotlin
class NamingTest {
    
    // 好的命名：描述性强
    @Test
    fun `should return empty list when no users exist`() { }
    
    @Test
    fun `should throw exception when email is invalid`() { }
    
    @Test
    fun `should calculate discount correctly for premium users`() { }
    
    // 避免的命名：不够描述性
    @Test
    fun testUser() { }
    
    @Test
    fun test1() { }
}
```

### 3. 测试数据构建
```kotlin
// 测试数据构建器
class UserTestDataBuilder {
    private var id: String = "default_id"
    private var name: String = "默认用户"
    private var email: String = "default@example.com"
    private var age: Int = 25
    
    fun withId(id: String) = apply { this.id = id }
    fun withName(name: String) = apply { this.name = name }
    fun withEmail(email: String) = apply { this.email = email }
    fun withAge(age: Int) = apply { this.age = age }
    
    fun build() = User(id, name, email)
}

class TestDataBuilderExample {
    
    @Test
    fun `should use test data builder`() {
        val user = UserTestDataBuilder()
            .withName("张三")
            .withEmail("zhang@example.com")
            .withAge(30)
            .build()
        
        assertEquals("张三", user.name)
        assertEquals("zhang@example.com", user.email)
    }
}
```

### 4. 异常测试
```kotlin
class ExceptionTestExample {
    
    @Test
    fun `should test exception with message`() {
        val exception = assertThrows<IllegalArgumentException> {
            validateAge(-1)
        }
        
        assertEquals("年龄不能为负数", exception.message)
    }
    
    @Test
    fun `should test multiple exceptions`() {
        assertAll(
            { assertThrows<IllegalArgumentException> { validateAge(-1) } },
            { assertThrows<IllegalArgumentException> { validateAge(200) } }
        )
    }
    
    private fun validateAge(age: Int) {
        when {
            age < 0 -> throw IllegalArgumentException("年龄不能为负数")
            age > 150 -> throw IllegalArgumentException("年龄不能超过150")
        }
    }
}
```

## 🔧 集成测试

### 测试配置
```kotlin
import org.junit.jupiter.api.TestInstance
import org.junit.jupiter.api.extension.ExtendWith

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(DatabaseExtension::class)
class IntegrationTest {
    
    @Test
    fun `should test database integration`() {
        // 集成测试代码
    }
}

// 自定义测试扩展
class DatabaseExtension : BeforeAllCallback, AfterAllCallback {
    override fun beforeAll(context: ExtensionContext) {
        // 启动测试数据库
    }
    
    override fun afterAll(context: ExtensionContext) {
        // 清理测试数据库
    }
}
```

## 📊 测试覆盖率

### JaCoCo 配置
```kotlin
// build.gradle.kts
plugins {
    jacoco
}

jacoco {
    toolVersion = "0.8.8"
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }
    
    finalizedBy(tasks.jacocoTestCoverageVerification)
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()  // 80% 覆盖率
            }
        }
    }
}

tasks.test {
    finalizedBy(tasks.jacocoTestReport)
}
```

## 🎯 实践练习

### 练习：银行账户测试
```kotlin
class BankAccount(private var balance: Double = 0.0) {
    
    fun deposit(amount: Double) {
        if (amount <= 0) throw IllegalArgumentException("存款金额必须大于0")
        balance += amount
    }
    
    fun withdraw(amount: Double) {
        if (amount <= 0) throw IllegalArgumentException("取款金额必须大于0")
        if (amount > balance) throw InsufficientFundsException("余额不足")
        balance -= amount
    }
    
    fun getBalance(): Double = balance
}

class InsufficientFundsException(message: String) : Exception(message)

class BankAccountTest {
    
    private lateinit var account: BankAccount
    
    @BeforeEach
    fun setUp() {
        account = BankAccount()
    }
    
    @Test
    fun `should start with zero balance`() {
        assertEquals(0.0, account.getBalance())
    }
    
    @Test
    fun `should deposit money correctly`() {
        account.deposit(100.0)
        assertEquals(100.0, account.getBalance())
    }
    
    @Test
    fun `should withdraw money correctly`() {
        account.deposit(100.0)
        account.withdraw(30.0)
        assertEquals(70.0, account.getBalance())
    }
    
    @Test
    fun `should throw exception for negative deposit`() {
        assertThrows<IllegalArgumentException> {
            account.deposit(-10.0)
        }
    }
    
    @Test
    fun `should throw exception for insufficient funds`() {
        account.deposit(50.0)
        assertThrows<InsufficientFundsException> {
            account.withdraw(100.0)
        }
    }
    
    @ParameterizedTest
    @ValueSource(doubles = [-1.0, 0.0])
    fun `should reject invalid withdrawal amounts`(amount: Double) {
        assertThrows<IllegalArgumentException> {
            account.withdraw(amount)
        }
    }
}
```

## 🎯 下一步

掌握测试后，您可以继续学习：

1. [最佳实践](./best-practices.md)
2. [性能优化](./performance.md)
3. [Android 开发](./android-development.md)

---

*良好的测试是高质量代码的保证，掌握测试技能将让您的代码更加可靠！*
