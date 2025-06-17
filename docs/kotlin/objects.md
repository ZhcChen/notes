# 🎭 Kotlin 对象表达式与声明

Kotlin 提供了灵活的对象创建方式，包括对象表达式（匿名对象）和对象声明（单例对象），让您能够优雅地处理各种设计模式。

## 🎯 学习目标

- 掌握对象表达式的使用
- 理解对象声明和单例模式
- 学会使用伴生对象
- 了解对象的实际应用场景

## 🎨 对象表达式

### 匿名对象基础
```kotlin
fun main() {
    // 创建匿名对象
    val person = object {
        val name = "张三"
        val age = 25
        
        fun introduce() {
            println("我是 $name，今年 $age 岁")
        }
    }
    
    person.introduce()  // 我是 张三，今年 25 岁
    println("姓名：${person.name}")  // 姓名：张三
}
```

### 实现接口的对象表达式
```kotlin
interface ClickListener {
    fun onClick()
    fun onDoubleClick()
}

interface KeyListener {
    fun onKeyPressed(key: String)
}

fun main() {
    // 实现单个接口
    val clickListener = object : ClickListener {
        override fun onClick() {
            println("单击事件")
        }
        
        override fun onDoubleClick() {
            println("双击事件")
        }
    }
    
    // 实现多个接口
    val multiListener = object : ClickListener, KeyListener {
        override fun onClick() {
            println("点击")
        }
        
        override fun onDoubleClick() {
            println("双击")
        }
        
        override fun onKeyPressed(key: String) {
            println("按键：$key")
        }
    }
    
    clickListener.onClick()
    clickListener.onDoubleClick()
    
    multiListener.onClick()
    multiListener.onKeyPressed("Enter")
}
```

### 继承类的对象表达式
```kotlin
open class Animal(val name: String) {
    open fun makeSound() {
        println("$name 发出声音")
    }
}

fun main() {
    // 继承类并重写方法
    val dog = object : Animal("旺财") {
        override fun makeSound() {
            println("$name 汪汪叫")
        }
        
        fun fetch() {
            println("$name 去捡球")
        }
    }
    
    dog.makeSound()  // 旺财 汪汪叫
    dog.fetch()      // 旺财 去捡球
}
```

### 访问外部变量
```kotlin
fun main() {
    var counter = 0
    val maxCount = 5
    
    val incrementer = object {
        fun increment() {
            if (counter < maxCount) {
                counter++
                println("计数器：$counter")
            } else {
                println("已达到最大值：$maxCount")
            }
        }
        
        fun reset() {
            counter = 0
            println("计数器已重置")
        }
    }
    
    repeat(7) {
        incrementer.increment()
    }
    
    incrementer.reset()
    incrementer.increment()
}
```

## 🏛️ 对象声明

### 单例对象
```kotlin
// 单例对象声明
object DatabaseManager {
    private var isConnected = false
    private val connections = mutableListOf<String>()
    
    fun connect(url: String) {
        if (!isConnected) {
            println("连接到数据库：$url")
            connections.add(url)
            isConnected = true
        } else {
            println("数据库已连接")
        }
    }
    
    fun disconnect() {
        if (isConnected) {
            println("断开数据库连接")
            connections.clear()
            isConnected = false
        }
    }
    
    fun getConnectionCount(): Int = connections.size
    
    fun isConnected(): Boolean = isConnected
}

fun main() {
    // 直接使用对象名访问
    DatabaseManager.connect("jdbc:mysql://localhost:3306/mydb")
    println("连接状态：${DatabaseManager.isConnected()}")
    println("连接数量：${DatabaseManager.getConnectionCount()}")
    
    DatabaseManager.disconnect()
    println("连接状态：${DatabaseManager.isConnected()}")
}
```

### 实现接口的对象声明
```kotlin
interface Logger {
    fun log(message: String)
    fun error(message: String)
}

object ConsoleLogger : Logger {
    override fun log(message: String) {
        println("[LOG] $message")
    }
    
    override fun error(message: String) {
        println("[ERROR] $message")
    }
}

object FileLogger : Logger {
    private val logFile = "app.log"
    
    override fun log(message: String) {
        println("[FILE LOG] 写入 $logFile: $message")
    }
    
    override fun error(message: String) {
        println("[FILE ERROR] 写入 $logFile: $message")
    }
}

fun main() {
    val logger: Logger = ConsoleLogger
    logger.log("应用启动")
    logger.error("发生错误")
    
    val fileLogger: Logger = FileLogger
    fileLogger.log("用户登录")
    fileLogger.error("登录失败")
}
```

## 👥 伴生对象

### 基本伴生对象
```kotlin
class User private constructor(val id: String, val name: String) {
    
    companion object {
        private var nextId = 1
        
        fun create(name: String): User {
            return User("user_${nextId++}", name)
        }
        
        fun createAdmin(name: String): User {
            return User("admin_${nextId++}", name)
        }
        
        const val MAX_NAME_LENGTH = 50
        const val MIN_NAME_LENGTH = 2
    }
    
    override fun toString(): String = "User(id=$id, name=$name)"
}

fun main() {
    // 通过伴生对象创建实例
    val user1 = User.create("张三")
    val user2 = User.create("李四")
    val admin = User.createAdmin("管理员")
    
    println(user1)  // User(id=user_1, name=张三)
    println(user2)  // User(id=user_2, name=李四)
    println(admin)  // User(id=admin_3, name=管理员)
    
    // 访问常量
    println("最大姓名长度：${User.MAX_NAME_LENGTH}")
    println("最小姓名长度：${User.MIN_NAME_LENGTH}")
}
```

### 命名伴生对象
```kotlin
class MathUtils {
    companion object Calculator {
        fun add(a: Double, b: Double): Double = a + b
        fun subtract(a: Double, b: Double): Double = a - b
        fun multiply(a: Double, b: Double): Double = a * b
        fun divide(a: Double, b: Double): Double = if (b != 0.0) a / b else 0.0
        
        const val PI = 3.14159265359
        const val E = 2.71828182846
    }
}

fun main() {
    // 可以通过类名或伴生对象名访问
    println("加法：${MathUtils.add(5.0, 3.0)}")
    println("减法：${MathUtils.Calculator.subtract(5.0, 3.0)}")
    
    println("π = ${MathUtils.PI}")
    println("e = ${MathUtils.Calculator.E}")
}
```

### 实现接口的伴生对象
```kotlin
interface Factory<T> {
    fun create(): T
}

class Product(val name: String, val price: Double) {
    companion object : Factory<Product> {
        override fun create(): Product {
            return Product("默认产品", 0.0)
        }
        
        fun create(name: String, price: Double): Product {
            return Product(name, price)
        }
    }
    
    override fun toString(): String = "Product(name=$name, price=$price)"
}

fun main() {
    // 使用工厂方法
    val defaultProduct = Product.create()
    val customProduct = Product.create("笔记本电脑", 5999.0)
    
    println(defaultProduct)  // Product(name=默认产品, price=0.0)
    println(customProduct)   // Product(name=笔记本电脑, price=5999.0)
    
    // 作为工厂接口使用
    val factory: Factory<Product> = Product
    val factoryProduct = factory.create()
    println(factoryProduct)  // Product(name=默认产品, price=0.0)
}
```

## 🎯 实际应用场景

### 配置管理
```kotlin
object AppConfig {
    private val properties = mutableMapOf<String, String>()
    
    init {
        // 模拟加载配置
        properties["app.name"] = "我的应用"
        properties["app.version"] = "1.0.0"
        properties["database.url"] = "jdbc:mysql://localhost:3306/myapp"
        properties["api.timeout"] = "30000"
    }
    
    fun getString(key: String, defaultValue: String = ""): String {
        return properties[key] ?: defaultValue
    }
    
    fun getInt(key: String, defaultValue: Int = 0): Int {
        return properties[key]?.toIntOrNull() ?: defaultValue
    }
    
    fun setProperty(key: String, value: String) {
        properties[key] = value
    }
    
    fun getAllProperties(): Map<String, String> = properties.toMap()
}

fun main() {
    println("应用名称：${AppConfig.getString("app.name")}")
    println("应用版本：${AppConfig.getString("app.version")}")
    println("API 超时：${AppConfig.getInt("api.timeout")} ms")
    
    AppConfig.setProperty("debug.enabled", "true")
    println("调试模式：${AppConfig.getString("debug.enabled")}")
}
```

### 事件处理系统
```kotlin
interface EventListener {
    fun onEvent(event: String, data: Any?)
}

object EventBus {
    private val listeners = mutableMapOf<String, MutableList<EventListener>>()
    
    fun register(eventType: String, listener: EventListener) {
        listeners.getOrPut(eventType) { mutableListOf() }.add(listener)
        println("注册监听器：$eventType")
    }
    
    fun unregister(eventType: String, listener: EventListener) {
        listeners[eventType]?.remove(listener)
        println("取消注册监听器：$eventType")
    }
    
    fun emit(eventType: String, data: Any? = null) {
        listeners[eventType]?.forEach { listener ->
            listener.onEvent(eventType, data)
        }
    }
    
    fun getListenerCount(eventType: String): Int {
        return listeners[eventType]?.size ?: 0
    }
}

fun main() {
    // 创建事件监听器
    val userListener = object : EventListener {
        override fun onEvent(event: String, data: Any?) {
            println("用户监听器收到事件：$event，数据：$data")
        }
    }
    
    val logListener = object : EventListener {
        override fun onEvent(event: String, data: Any?) {
            println("日志监听器记录：$event - $data")
        }
    }
    
    // 注册监听器
    EventBus.register("user.login", userListener)
    EventBus.register("user.login", logListener)
    EventBus.register("user.logout", userListener)
    
    // 发送事件
    EventBus.emit("user.login", "张三")
    EventBus.emit("user.logout", "张三")
    
    println("登录事件监听器数量：${EventBus.getListenerCount("user.login")}")
}
```

### 缓存系统
```kotlin
class Cache<K, V> private constructor() {
    private val cache = mutableMapOf<K, V>()
    private val accessTime = mutableMapOf<K, Long>()
    private val maxSize = 100
    
    companion object {
        @Volatile
        private var INSTANCE: Cache<Any, Any>? = null
        
        @Suppress("UNCHECKED_CAST")
        fun <K, V> getInstance(): Cache<K, V> {
            return INSTANCE as? Cache<K, V> ?: synchronized(this) {
                INSTANCE as? Cache<K, V> ?: Cache<K, V>().also { INSTANCE = it as Cache<Any, Any> }
            }
        }
    }
    
    fun put(key: K, value: V) {
        if (cache.size >= maxSize) {
            evictOldest()
        }
        cache[key] = value
        accessTime[key] = System.currentTimeMillis()
    }
    
    fun get(key: K): V? {
        accessTime[key] = System.currentTimeMillis()
        return cache[key]
    }
    
    fun remove(key: K): V? {
        accessTime.remove(key)
        return cache.remove(key)
    }
    
    fun size(): Int = cache.size
    
    fun clear() {
        cache.clear()
        accessTime.clear()
    }
    
    private fun evictOldest() {
        val oldestKey = accessTime.minByOrNull { it.value }?.key
        oldestKey?.let {
            cache.remove(it)
            accessTime.remove(it)
        }
    }
}

fun main() {
    val stringCache = Cache.getInstance<String, String>()
    val intCache = Cache.getInstance<String, Int>()
    
    // 使用字符串缓存
    stringCache.put("user:1", "张三")
    stringCache.put("user:2", "李四")
    
    println("用户1：${stringCache.get("user:1")}")
    println("缓存大小：${stringCache.size()}")
    
    // 使用整数缓存（实际上是同一个实例）
    intCache.put("count", 42)
    println("计数：${intCache.get("count")}")
}
```

## 🔄 对象表达式 vs 对象声明

### 对比总结
```kotlin
fun main() {
    // 对象表达式：每次都创建新实例
    val obj1 = object {
        val value = "实例1"
    }
    
    val obj2 = object {
        val value = "实例2"
    }
    
    println("对象表达式：${obj1 === obj2}")  // false，不同实例
    
    // 对象声明：单例，只有一个实例
    println("对象声明：${DatabaseManager === DatabaseManager}")  // true，同一实例
}

// 使用场景对比
interface Processor {
    fun process(data: String): String
}

// 对象声明：全局单例处理器
object GlobalProcessor : Processor {
    override fun process(data: String): String {
        return "全局处理：$data"
    }
}

fun createLocalProcessor(prefix: String): Processor {
    // 对象表达式：创建局部处理器
    return object : Processor {
        override fun process(data: String): String {
            return "$prefix：$data"
        }
    }
}

fun main() {
    val global = GlobalProcessor
    val local1 = createLocalProcessor("本地1")
    val local2 = createLocalProcessor("本地2")
    
    println(global.process("数据"))     // 全局处理：数据
    println(local1.process("数据"))    // 本地1：数据
    println(local2.process("数据"))    // 本地2：数据
}
```

## 🎯 最佳实践

### 1. 选择合适的对象类型
```kotlin
// ✅ 好的做法：单例用对象声明
object Logger {
    fun log(message: String) {
        println("[LOG] $message")
    }
}

// ✅ 好的做法：临时实现用对象表达式
fun setClickListener(button: Button) {
    button.setOnClickListener(object : OnClickListener {
        override fun onClick() {
            println("按钮被点击")
        }
    })
}

// ❌ 避免：不要用对象表达式创建单例
fun getBadSingleton() = object {
    fun doSomething() { }
}  // 每次调用都创建新实例
```

### 2. 伴生对象的使用
```kotlin
class ApiClient private constructor(private val baseUrl: String) {
    companion object {
        // ✅ 工厂方法
        fun create(baseUrl: String): ApiClient {
            return ApiClient(baseUrl)
        }
        
        // ✅ 常量
        const val DEFAULT_TIMEOUT = 30000
        
        // ✅ 默认实例
        val default by lazy { create("https://api.example.com") }
    }
    
    fun get(path: String): String {
        return "GET $baseUrl$path"
    }
}
```

## 🎯 下一步

掌握对象表达式与声明后，您可以继续学习：

1. [Lambda 表达式](./lambdas.md)
2. [扩展函数](./extensions.md)
3. [泛型](./generics.md)

---

*对象表达式和对象声明是 Kotlin 中强大的特性，掌握它们将让您能够优雅地实现各种设计模式！*
