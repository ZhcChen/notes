# 🔍 Kotlin 反射

反射是 Kotlin 的高级特性，允许在运行时检查和操作类、函数、属性等程序结构。本章将介绍 Kotlin 反射的基本概念和实际应用。

## 🎯 学习目标

- 理解反射的基本概念
- 掌握类反射和属性反射
- 学会函数反射和调用
- 了解反射的实际应用场景

## 📝 反射基础

### 获取类引用
```kotlin
import kotlin.reflect.*

class Person(val name: String, var age: Int) {
    fun greet() = "Hello, I'm $name"
    
    fun celebrateBirthday() {
        age++
        println("$name is now $age years old!")
    }
}

fun main() {
    // 获取类引用的几种方式
    val person = Person("张三", 25)
    
    // 1. 通过实例获取
    val kClass1 = person::class
    
    // 2. 通过类名获取
    val kClass2 = Person::class
    
    // 3. 通过 Java Class 获取
    val kClass3 = Person::class.java.kotlin
    
    println("类名：${kClass1.simpleName}")           // Person
    println("完全限定名：${kClass1.qualifiedName}")   // Person
    println("是否为数据类：${kClass1.isData}")        // false
    println("是否为抽象类：${kClass1.isAbstract}")    // false
    println("是否为 final：${kClass1.isFinal}")      // true
}
```

### 类信息检查
```kotlin
import kotlin.reflect.full.*

data class User(
    val id: String,
    val name: String,
    var email: String,
    var age: Int = 18
) {
    fun updateEmail(newEmail: String) {
        email = newEmail
    }
    
    fun getDisplayName(): String = "用户：$name"
}

fun main() {
    val userClass = User::class
    
    // 获取构造函数
    println("构造函数：")
    userClass.constructors.forEach { constructor ->
        println("  参数：${constructor.parameters.map { "${it.name}: ${it.type}" }}")
    }
    
    // 获取属性
    println("\n属性：")
    userClass.memberProperties.forEach { property ->
        println("  ${property.name}: ${property.returnType} (可变: ${property is KMutableProperty<*>})")
    }
    
    // 获取函数
    println("\n函数：")
    userClass.memberFunctions.forEach { function ->
        println("  ${function.name}(${function.parameters.drop(1).map { it.type }}): ${function.returnType}")
    }
    
    // 获取超类型
    println("\n超类型：")
    userClass.supertypes.forEach { supertype ->
        println("  $supertype")
    }
}
```

## 🏷️ 属性反射

### 访问和修改属性
```kotlin
import kotlin.reflect.full.*

class Product(var name: String, var price: Double, val category: String) {
    var inStock: Boolean = true
        private set
    
    fun setStock(stock: Boolean) {
        inStock = stock
    }
}

fun main() {
    val product = Product("笔记本电脑", 5999.0, "电子产品")
    val productClass = Product::class
    
    // 通过反射访问属性
    productClass.memberProperties.forEach { property ->
        val value = property.get(product)
        println("${property.name} = $value")
    }
    
    // 修改可变属性
    val nameProperty = productClass.memberProperties.find { it.name == "name" }
    if (nameProperty is KMutableProperty1<Product, *>) {
        nameProperty.set(product, "游戏笔记本")
        println("修改后的名称：${product.name}")
    }
    
    // 通过属性引用直接访问
    val priceProperty = Product::price
    println("价格：${priceProperty.get(product)}")
    priceProperty.set(product, 6999.0)
    println("修改后的价格：${product.price}")
}
```

### 属性元数据
```kotlin
import kotlin.reflect.full.*

class Employee(
    val id: String,
    val name: String,
    var salary: Double,
    var department: String
) {
    val isManager: Boolean
        get() = salary > 100000
    
    lateinit var manager: Employee
}

fun main() {
    val employeeClass = Employee::class
    
    employeeClass.memberProperties.forEach { property ->
        println("属性：${property.name}")
        println("  类型：${property.returnType}")
        println("  可见性：${property.visibility}")
        println("  是否可变：${property is KMutableProperty<*>}")
        println("  是否延迟初始化：${property.annotations.any { it is kotlin.jvm.JvmField }}")
        println()
    }
}
```

## 🔧 函数反射

### 调用函数
```kotlin
import kotlin.reflect.full.*

class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    fun multiply(a: Double, b: Double): Double = a * b
    fun greet(name: String = "World"): String = "Hello, $name!"
    
    companion object {
        fun staticAdd(a: Int, b: Int): Int = a + b
    }
}

fun main() {
    val calculator = Calculator()
    val calculatorClass = Calculator::class
    
    // 通过名称查找函数
    val addFunction = calculatorClass.memberFunctions.find { it.name == "add" }
    if (addFunction != null) {
        val result = addFunction.call(calculator, 5, 3)
        println("5 + 3 = $result")  // 8
    }
    
    // 通过函数引用调用
    val multiplyFunction = Calculator::multiply
    val multiplyResult = multiplyFunction.call(calculator, 2.5, 4.0)
    println("2.5 * 4.0 = $multiplyResult")  // 10.0
    
    // 调用有默认参数的函数
    val greetFunction = Calculator::greet
    val greetResult1 = greetFunction.call(calculator, "Kotlin")
    val greetResult2 = greetFunction.callBy(mapOf(greetFunction.instanceParameter!! to calculator))
    
    println(greetResult1)  // Hello, Kotlin!
    println(greetResult2)  // Hello, World!
    
    // 调用伴生对象函数
    val companionClass = Calculator.Companion::class
    val staticAddFunction = companionClass.memberFunctions.find { it.name == "staticAdd" }
    if (staticAddFunction != null) {
        val staticResult = staticAddFunction.call(Calculator.Companion, 10, 20)
        println("静态加法：$staticResult")  // 30
    }
}
```

### 函数参数检查
```kotlin
import kotlin.reflect.full.*

class UserService {
    fun createUser(
        name: String,
        email: String,
        age: Int = 18,
        isActive: Boolean = true
    ): String {
        return "创建用户：$name ($email), 年龄：$age, 活跃：$isActive"
    }
}

fun main() {
    val userServiceClass = UserService::class
    val createUserFunction = userServiceClass.memberFunctions.find { it.name == "createUser" }
    
    if (createUserFunction != null) {
        println("函数：${createUserFunction.name}")
        println("返回类型：${createUserFunction.returnType}")
        
        createUserFunction.parameters.forEach { parameter ->
            println("参数：${parameter.name}")
            println("  类型：${parameter.type}")
            println("  是否可选：${parameter.isOptional}")
            println("  是否可变参数：${parameter.isVararg}")
            println()
        }
        
        // 使用 callBy 调用函数
        val userService = UserService()
        val result = createUserFunction.callBy(mapOf(
            createUserFunction.instanceParameter!! to userService,
            createUserFunction.parameters[1] to "张三",
            createUserFunction.parameters[2] to "zhang@example.com",
            createUserFunction.parameters[3] to 25
            // age 和 isActive 使用默认值
        ))
        
        println("调用结果：$result")
    }
}
```

## 🎯 实际应用

### JSON 序列化框架
```kotlin
import kotlin.reflect.full.*

// 简单的 JSON 序列化示例
object SimpleJsonSerializer {
    
    fun serialize(obj: Any): String {
        val kClass = obj::class
        val properties = kClass.memberProperties
        
        val jsonPairs = properties.map { property ->
            val value = property.get(obj)
            val jsonValue = when (value) {
                is String -> "\"$value\""
                is Number, is Boolean -> value.toString()
                null -> "null"
                else -> serialize(value)  // 递归序列化
            }
            "\"${property.name}\": $jsonValue"
        }
        
        return "{${jsonPairs.joinToString(", ")}}"
    }
    
    inline fun <reified T : Any> deserialize(json: String): T {
        // 简化的反序列化实现（实际应用中需要更复杂的解析）
        val kClass = T::class
        val constructor = kClass.primaryConstructor
            ?: throw IllegalArgumentException("类必须有主构造函数")
        
        // 这里应该解析 JSON 字符串，简化为直接创建对象
        val args = constructor.parameters.map { param ->
            when (param.type.classifier) {
                String::class -> "默认字符串"
                Int::class -> 0
                Double::class -> 0.0
                Boolean::class -> false
                else -> null
            }
        }
        
        return constructor.call(*args.toTypedArray())
    }
}

data class Person(val name: String, val age: Int, val isActive: Boolean)

fun main() {
    val person = Person("张三", 25, true)
    
    // 序列化
    val json = SimpleJsonSerializer.serialize(person)
    println("序列化结果：$json")
    
    // 反序列化
    val deserializedPerson = SimpleJsonSerializer.deserialize<Person>("{}")
    println("反序列化结果：$deserializedPerson")
}
```

### 依赖注入容器
```kotlin
import kotlin.reflect.full.*

// 简单的依赖注入容器
class DIContainer {
    private val instances = mutableMapOf<KClass<*>, Any>()
    private val factories = mutableMapOf<KClass<*>, () -> Any>()
    
    inline fun <reified T : Any> register(instance: T) {
        instances[T::class] = instance
    }
    
    inline fun <reified T : Any> register(noinline factory: () -> T) {
        factories[T::class] = factory
    }
    
    inline fun <reified T : Any> get(): T {
        val kClass = T::class
        
        // 先查找已注册的实例
        instances[kClass]?.let { return it as T }
        
        // 再查找工厂方法
        factories[kClass]?.let { 
            val instance = it() as T
            instances[kClass] = instance
            return instance
        }
        
        // 尝试自动创建
        return createInstance()
    }
    
    inline fun <reified T : Any> createInstance(): T {
        val kClass = T::class
        val constructor = kClass.primaryConstructor
            ?: throw IllegalArgumentException("无法创建实例：${kClass.simpleName}")
        
        val args = constructor.parameters.map { param ->
            val paramType = param.type.classifier as? KClass<*>
                ?: throw IllegalArgumentException("不支持的参数类型")
            
            // 递归解析依赖
            instances[paramType] ?: factories[paramType]?.invoke()
            ?: throw IllegalArgumentException("无法解析依赖：${paramType.simpleName}")
        }
        
        return constructor.call(*args.toTypedArray())
    }
}

// 示例类
interface Logger {
    fun log(message: String)
}

class ConsoleLogger : Logger {
    override fun log(message: String) {
        println("[LOG] $message")
    }
}

class UserService(private val logger: Logger) {
    fun createUser(name: String): String {
        logger.log("创建用户：$name")
        return "用户 $name 已创建"
    }
}

fun main() {
    val container = DIContainer()
    
    // 注册依赖
    container.register<Logger>(ConsoleLogger())
    container.register<UserService> { UserService(container.get()) }
    
    // 获取服务
    val userService = container.get<UserService>()
    val result = userService.createUser("张三")
    println(result)
}
```

### 验证框架
```kotlin
import kotlin.reflect.full.*

// 验证注解
@Target(AnnotationTarget.PROPERTY)
annotation class NotEmpty

@Target(AnnotationTarget.PROPERTY)
annotation class Min(val value: Int)

@Target(AnnotationTarget.PROPERTY)
annotation class Email

// 验证结果
data class ValidationResult(
    val isValid: Boolean,
    val errors: List<String> = emptyList()
)

// 验证器
object Validator {
    
    fun validate(obj: Any): ValidationResult {
        val kClass = obj::class
        val errors = mutableListOf<String>()
        
        kClass.memberProperties.forEach { property ->
            val value = property.get(obj)
            val propertyName = property.name
            
            // 检查 @NotEmpty
            if (property.annotations.any { it is NotEmpty }) {
                if (value is String && value.isEmpty()) {
                    errors.add("$propertyName 不能为空")
                }
            }
            
            // 检查 @Min
            property.annotations.filterIsInstance<Min>().forEach { minAnnotation ->
                if (value is Int && value < minAnnotation.value) {
                    errors.add("$propertyName 不能小于 ${minAnnotation.value}")
                }
            }
            
            // 检查 @Email
            if (property.annotations.any { it is Email }) {
                if (value is String && !value.contains("@")) {
                    errors.add("$propertyName 必须是有效的邮箱地址")
                }
            }
        }
        
        return ValidationResult(errors.isEmpty(), errors)
    }
}

// 测试数据类
data class UserRegistration(
    @NotEmpty val name: String,
    @Email val email: String,
    @Min(18) val age: Int
)

fun main() {
    // 有效数据
    val validUser = UserRegistration("张三", "zhang@example.com", 25)
    val validResult = Validator.validate(validUser)
    println("有效用户验证：${validResult.isValid}")
    
    // 无效数据
    val invalidUser = UserRegistration("", "invalid-email", 16)
    val invalidResult = Validator.validate(invalidUser)
    println("无效用户验证：${invalidResult.isValid}")
    println("错误信息：${invalidResult.errors}")
}
```

## 🎯 性能考虑

### 反射性能优化
```kotlin
import kotlin.reflect.KClass
import kotlin.reflect.full.*

// 缓存反射信息
object ReflectionCache {
    private val classCache = mutableMapOf<KClass<*>, ClassInfo>()
    
    data class ClassInfo(
        val properties: List<KProperty1<Any, *>>,
        val functions: List<KFunction<*>>
    )
    
    fun getClassInfo(kClass: KClass<*>): ClassInfo {
        return classCache.getOrPut(kClass) {
            ClassInfo(
                properties = kClass.memberProperties.toList(),
                functions = kClass.memberFunctions.toList()
            )
        }
    }
}

// 性能测试
fun performanceTest() {
    val iterations = 10000
    val testClass = Person::class
    
    // 不使用缓存
    val startTime1 = System.currentTimeMillis()
    repeat(iterations) {
        testClass.memberProperties.toList()
        testClass.memberFunctions.toList()
    }
    val endTime1 = System.currentTimeMillis()
    
    // 使用缓存
    val startTime2 = System.currentTimeMillis()
    repeat(iterations) {
        ReflectionCache.getClassInfo(testClass)
    }
    val endTime2 = System.currentTimeMillis()
    
    println("不使用缓存：${endTime1 - startTime1}ms")
    println("使用缓存：${endTime2 - startTime2}ms")
}
```

## 🎯 最佳实践

### 1. 缓存反射信息
```kotlin
// ✅ 好的做法：缓存昂贵的反射操作
class PropertyAccessor<T : Any>(private val kClass: KClass<T>) {
    private val propertyCache = kClass.memberProperties.associateBy { it.name }
    
    fun getProperty(name: String) = propertyCache[name]
}

// ❌ 避免：每次都重新获取反射信息
fun badGetProperty(obj: Any, name: String) {
    obj::class.memberProperties.find { it.name == name }  // 每次都遍历
}
```

### 2. 异常处理
```kotlin
// ✅ 好的做法：妥善处理反射异常
fun safeGetProperty(obj: Any, propertyName: String): Any? {
    return try {
        val property = obj::class.memberProperties.find { it.name == propertyName }
        property?.get(obj)
    } catch (e: Exception) {
        println("获取属性失败：${e.message}")
        null
    }
}
```

### 3. 类型安全
```kotlin
// ✅ 好的做法：使用泛型保证类型安全
inline fun <reified T> getPropertyValue(obj: Any, propertyName: String): T? {
    val property = obj::class.memberProperties.find { it.name == propertyName }
    val value = property?.get(obj)
    return value as? T
}
```

## 🎯 下一步

掌握反射后，您可以继续学习：

1. [注解](./annotations.md)
2. [性能优化](./performance.md)
3. [开发工具](./tools.md)

---

*反射是强大的运行时特性，但要谨慎使用，注意性能影响和类型安全！*
