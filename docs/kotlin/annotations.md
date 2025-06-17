# 🏷️ Kotlin 注解

注解是 Kotlin 中用于为代码添加元数据的机制，它们可以在编译时或运行时被处理，用于实现各种功能如验证、序列化、依赖注入等。

## 🎯 学习目标

- 掌握注解的定义和使用
- 理解注解的目标和保留策略
- 学会创建自定义注解
- 了解注解处理的实际应用

## 📝 注解基础

### 使用内置注解
```kotlin
// 常用的内置注解
class Example {
    
    @Deprecated("使用 newMethod() 替代", ReplaceWith("newMethod()"))
    fun oldMethod() {
        println("旧方法")
    }
    
    fun newMethod() {
        println("新方法")
    }
    
    @JvmStatic
    companion object {
        fun staticMethod() {
            println("静态方法")
        }
    }
    
    @JvmOverloads
    fun greet(name: String = "World", prefix: String = "Hello") {
        println("$prefix, $name!")
    }
    
    @Throws(IllegalArgumentException::class)
    fun validateAge(age: Int) {
        if (age < 0) throw IllegalArgumentException("年龄不能为负数")
    }
}

fun main() {
    val example = Example()
    
    // 使用被弃用的方法会有警告
    example.oldMethod()
    example.newMethod()
    
    // JvmOverloads 生成多个重载方法
    example.greet()
    example.greet("Kotlin")
    example.greet("Kotlin", "Hi")
    
    try {
        example.validateAge(-1)
    } catch (e: IllegalArgumentException) {
        println("捕获异常：${e.message}")
    }
}
```

### 注解语法
```kotlin
// 无参数注解
@Target(AnnotationTarget.CLASS)
annotation class Entity

// 带参数的注解
@Target(AnnotationTarget.PROPERTY)
annotation class Column(val name: String, val nullable: Boolean = true)

// 多个参数的注解
@Target(AnnotationTarget.FUNCTION)
annotation class ApiEndpoint(
    val path: String,
    val method: String = "GET",
    val description: String = ""
)

// 使用注解
@Entity
data class User(
    @Column("user_id", false)
    val id: String,
    
    @Column("user_name")
    val name: String,
    
    @Column("email_address")
    val email: String
) {
    
    @ApiEndpoint("/users", "POST", "创建新用户")
    fun create() {
        println("创建用户")
    }
    
    @ApiEndpoint("/users/{id}", "GET", "获取用户信息")
    fun getById() {
        println("获取用户信息")
    }
}
```

## 🎯 注解目标

### 注解目标类型
```kotlin
// 不同的注解目标
@Target(AnnotationTarget.CLASS)
annotation class ClassAnnotation

@Target(AnnotationTarget.FUNCTION)
annotation class FunctionAnnotation

@Target(AnnotationTarget.PROPERTY)
annotation class PropertyAnnotation

@Target(AnnotationTarget.FIELD)
annotation class FieldAnnotation

@Target(AnnotationTarget.VALUE_PARAMETER)
annotation class ParameterAnnotation

@Target(AnnotationTarget.CONSTRUCTOR)
annotation class ConstructorAnnotation

// 多个目标
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
annotation class MultiTargetAnnotation

// 使用示例
@ClassAnnotation
@MultiTargetAnnotation
class AnnotatedClass @ConstructorAnnotation constructor(
    @ParameterAnnotation val name: String
) {
    
    @PropertyAnnotation
    @FieldAnnotation
    val property: String = "value"
    
    @FunctionAnnotation
    @MultiTargetAnnotation
    fun method(@ParameterAnnotation param: String) {
        println(param)
    }
}
```

### 注解保留策略
```kotlin
// 不同的保留策略
@Retention(AnnotationRetention.SOURCE)  // 只在源码中保留
annotation class SourceAnnotation

@Retention(AnnotationRetention.BINARY)  // 在字节码中保留（默认）
annotation class BinaryAnnotation

@Retention(AnnotationRetention.RUNTIME) // 在运行时保留
annotation class RuntimeAnnotation

// 运行时注解示例
@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class Validate(val rule: String)

@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class Range(val min: Int, val max: Int)

data class Person(
    @Validate("not_empty")
    val name: String,
    
    @Range(0, 150)
    val age: Int
)
```

## 🔧 自定义注解

### 验证注解
```kotlin
import kotlin.reflect.full.*

// 验证注解定义
@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class NotEmpty(val message: String = "不能为空")

@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class Min(val value: Int, val message: String = "值太小")

@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class Max(val value: Int, val message: String = "值太大")

@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class Email(val message: String = "邮箱格式无效")

// 验证器
object Validator {
    
    data class ValidationResult(
        val isValid: Boolean,
        val errors: List<String> = emptyList()
    )
    
    fun validate(obj: Any): ValidationResult {
        val errors = mutableListOf<String>()
        val kClass = obj::class
        
        kClass.memberProperties.forEach { property ->
            val value = property.get(obj)
            val propertyName = property.name
            
            // 检查 @NotEmpty
            property.annotations.filterIsInstance<NotEmpty>().forEach { annotation ->
                if (value is String && value.isEmpty()) {
                    errors.add("$propertyName: ${annotation.message}")
                }
            }
            
            // 检查 @Min
            property.annotations.filterIsInstance<Min>().forEach { annotation ->
                if (value is Int && value < annotation.value) {
                    errors.add("$propertyName: ${annotation.message} (最小值: ${annotation.value})")
                }
            }
            
            // 检查 @Max
            property.annotations.filterIsInstance<Max>().forEach { annotation ->
                if (value is Int && value > annotation.value) {
                    errors.add("$propertyName: ${annotation.message} (最大值: ${annotation.value})")
                }
            }
            
            // 检查 @Email
            property.annotations.filterIsInstance<Email>().forEach { annotation ->
                if (value is String && !value.contains("@")) {
                    errors.add("$propertyName: ${annotation.message}")
                }
            }
        }
        
        return ValidationResult(errors.isEmpty(), errors)
    }
}

// 使用验证注解
data class UserRegistration(
    @NotEmpty("用户名不能为空")
    val username: String,
    
    @Email("请输入有效的邮箱地址")
    val email: String,
    
    @Min(18, "年龄必须大于等于18岁")
    @Max(100, "年龄不能超过100岁")
    val age: Int
)

fun main() {
    // 有效数据
    val validUser = UserRegistration("张三", "zhang@example.com", 25)
    val validResult = Validator.validate(validUser)
    println("有效用户：${validResult.isValid}")
    
    // 无效数据
    val invalidUser = UserRegistration("", "invalid-email", 16)
    val invalidResult = Validator.validate(invalidUser)
    println("无效用户：${invalidResult.isValid}")
    println("错误信息：")
    invalidResult.errors.forEach { println("  - $it") }
}
```

### 序列化注解
```kotlin
import kotlin.reflect.full.*

// 序列化注解
@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class JsonProperty(val name: String)

@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class JsonIgnore

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class JsonSerializable

// 简单的 JSON 序列化器
object JsonSerializer {
    
    fun serialize(obj: Any): String {
        val kClass = obj::class
        
        // 检查是否有 @JsonSerializable 注解
        if (!kClass.annotations.any { it is JsonSerializable }) {
            throw IllegalArgumentException("类必须标注 @JsonSerializable")
        }
        
        val jsonPairs = mutableListOf<String>()
        
        kClass.memberProperties.forEach { property ->
            // 跳过标注了 @JsonIgnore 的属性
            if (property.annotations.any { it is JsonIgnore }) {
                return@forEach
            }
            
            val value = property.get(obj)
            
            // 获取 JSON 属性名
            val jsonName = property.annotations
                .filterIsInstance<JsonProperty>()
                .firstOrNull()?.name ?: property.name
            
            val jsonValue = when (value) {
                is String -> "\"$value\""
                is Number, is Boolean -> value.toString()
                null -> "null"
                else -> serialize(value)  // 递归序列化
            }
            
            jsonPairs.add("\"$jsonName\": $jsonValue")
        }
        
        return "{${jsonPairs.joinToString(", ")}}"
    }
}

// 使用序列化注解
@JsonSerializable
data class Product(
    @JsonProperty("product_id")
    val id: String,
    
    @JsonProperty("product_name")
    val name: String,
    
    val price: Double,
    
    @JsonIgnore
    val internalCode: String
)

fun main() {
    val product = Product("P001", "笔记本电脑", 5999.0, "INTERNAL_001")
    val json = JsonSerializer.serialize(product)
    println("序列化结果：$json")
    // 输出：{"product_id": "P001", "product_name": "笔记本电脑", "price": 5999.0}
}
```

### 依赖注入注解
```kotlin
import kotlin.reflect.full.*

// 依赖注入注解
@Target(AnnotationTarget.CONSTRUCTOR, AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class Inject

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Component

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Service

// 简单的依赖注入容器
class DIContainer {
    private val instances = mutableMapOf<String, Any>()
    private val componentClasses = mutableSetOf<kotlin.reflect.KClass<*>>()
    
    fun registerComponent(kClass: kotlin.reflect.KClass<*>) {
        if (kClass.annotations.any { it is Component || it is Service }) {
            componentClasses.add(kClass)
        }
    }
    
    inline fun <reified T : Any> getInstance(): T {
        val className = T::class.qualifiedName!!
        
        instances[className]?.let { return it as T }
        
        val instance = createInstance(T::class)
        instances[className] = instance
        return instance
    }
    
    fun <T : Any> createInstance(kClass: kotlin.reflect.KClass<T>): T {
        val constructor = kClass.primaryConstructor
            ?: throw IllegalArgumentException("类必须有主构造函数")
        
        val args = constructor.parameters.map { param ->
            val paramClass = param.type.classifier as kotlin.reflect.KClass<*>
            getInstance(paramClass)
        }
        
        return constructor.call(*args.toTypedArray())
    }
    
    private fun getInstance(kClass: kotlin.reflect.KClass<*>): Any {
        val className = kClass.qualifiedName!!
        
        instances[className]?.let { return it }
        
        val instance = createInstance(kClass)
        instances[className] = instance
        return instance
    }
}

// 使用依赖注入注解
interface Logger {
    fun log(message: String)
}

@Component
class ConsoleLogger : Logger {
    override fun log(message: String) {
        println("[LOG] $message")
    }
}

interface UserRepository {
    fun findById(id: String): String?
}

@Component
class InMemoryUserRepository : UserRepository {
    private val users = mapOf("1" to "张三", "2" to "李四")
    
    override fun findById(id: String): String? = users[id]
}

@Service
class UserService @Inject constructor(
    private val userRepository: UserRepository,
    private val logger: Logger
) {
    fun getUser(id: String): String? {
        logger.log("查找用户：$id")
        return userRepository.findById(id)
    }
}

fun main() {
    val container = DIContainer()
    
    // 注册组件
    container.registerComponent(ConsoleLogger::class)
    container.registerComponent(InMemoryUserRepository::class)
    container.registerComponent(UserService::class)
    
    // 获取服务
    val userService = container.getInstance<UserService>()
    val user = userService.getUser("1")
    println("找到用户：$user")
}
```

## 🎯 注解处理器

### 编译时注解处理
```kotlin
// 编译时注解（示例）
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.SOURCE)
annotation class AutoValue

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.SOURCE)
annotation class Builder

// 这些注解通常由注解处理器在编译时处理
// 生成额外的代码文件

@AutoValue
abstract class Person {
    abstract fun name(): String
    abstract fun age(): Int
    
    @Builder
    abstract class Builder {
        abstract fun name(name: String): Builder
        abstract fun age(age: Int): Builder
        abstract fun build(): Person
    }
}
```

### 运行时注解处理
```kotlin
import kotlin.reflect.full.*

// 缓存注解
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Cacheable(val key: String = "", val ttl: Int = 300)

// 缓存代理
class CacheProxy {
    private val cache = mutableMapOf<String, Pair<Any?, Long>>()
    
    fun <T> invoke(obj: Any, method: kotlin.reflect.KFunction<*>, args: Array<Any?>): T? {
        val cacheableAnnotation = method.annotations.filterIsInstance<Cacheable>().firstOrNull()
        
        if (cacheableAnnotation != null) {
            val cacheKey = if (cacheableAnnotation.key.isNotEmpty()) {
                cacheableAnnotation.key
            } else {
                "${method.name}(${args.joinToString(",")})"
            }
            
            val now = System.currentTimeMillis()
            val cached = cache[cacheKey]
            
            // 检查缓存是否有效
            if (cached != null && (now - cached.second) < cacheableAnnotation.ttl * 1000) {
                println("缓存命中：$cacheKey")
                return cached.first as T?
            }
            
            // 执行方法并缓存结果
            val result = method.call(obj, *args)
            cache[cacheKey] = result to now
            println("缓存存储：$cacheKey")
            return result as T?
        }
        
        return method.call(obj, *args) as T?
    }
}

// 使用缓存注解
class DataService {
    
    @Cacheable("user_data", 60)
    fun getUserData(userId: String): String {
        println("从数据库获取用户数据：$userId")
        Thread.sleep(1000)  // 模拟数据库查询
        return "用户数据：$userId"
    }
    
    @Cacheable(ttl = 30)
    fun getSystemInfo(): String {
        println("获取系统信息")
        Thread.sleep(500)   // 模拟系统调用
        return "系统信息"
    }
}

fun main() {
    val dataService = DataService()
    val cacheProxy = CacheProxy()
    val getUserDataMethod = DataService::class.memberFunctions.find { it.name == "getUserData" }!!
    
    // 第一次调用
    val result1 = cacheProxy.invoke<String>(dataService, getUserDataMethod, arrayOf("123"))
    println("结果1：$result1")
    
    // 第二次调用（应该从缓存获取）
    val result2 = cacheProxy.invoke<String>(dataService, getUserDataMethod, arrayOf("123"))
    println("结果2：$result2")
}
```

## 🎯 最佳实践

### 1. 注解设计原则
```kotlin
// ✅ 好的注解设计
@Target(AnnotationTarget.PROPERTY)
@Retention(AnnotationRetention.RUNTIME)
annotation class Validate(
    val rule: String,
    val message: String = "",
    val groups: Array<String> = []
)

// ❌ 避免：过于复杂的注解
annotation class ComplexAnnotation(
    val param1: String,
    val param2: Int,
    val param3: Boolean,
    val param4: Array<String>,
    val param5: DoubleArray,
    // ... 太多参数
)
```

### 2. 性能考虑
```kotlin
// ✅ 缓存反射信息
object AnnotationCache {
    private val cache = mutableMapOf<kotlin.reflect.KClass<*>, List<Annotation>>()
    
    fun getAnnotations(kClass: kotlin.reflect.KClass<*>): List<Annotation> {
        return cache.getOrPut(kClass) {
            kClass.annotations
        }
    }
}

// ❌ 避免：重复的反射调用
fun badAnnotationProcessing(obj: Any) {
    obj::class.annotations.forEach { /* 处理 */ }  // 每次都重新获取
}
```

### 3. 错误处理
```kotlin
// ✅ 妥善处理注解处理中的异常
fun safeProcessAnnotations(obj: Any) {
    try {
        obj::class.memberProperties.forEach { property ->
            property.annotations.forEach { annotation ->
                // 处理注解
            }
        }
    } catch (e: Exception) {
        println("注解处理失败：${e.message}")
    }
}
```

## 🎯 下一步

掌握注解后，您可以继续学习：

1. [性能优化](./performance.md)
2. [开发工具](./tools.md)
3. [Web 开发](./web-development.md)

---

*注解是强大的元编程工具，合理使用能够大大简化代码并提高开发效率！*
