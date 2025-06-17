# 🔄 Kotlin 泛型

泛型是 Kotlin 类型系统的重要组成部分，它提供了类型安全的同时保持了代码的灵活性和重用性。

## 🎯 学习目标

- 掌握泛型的基本概念和语法
- 理解型变（协变和逆变）
- 学会使用泛型约束
- 了解类型擦除和具体化类型参数

## 📝 泛型基础

### 泛型类
```kotlin
// 基本泛型类
class Box<T>(private var content: T) {
    fun get(): T = content
    fun set(value: T) {
        content = value
    }
    
    override fun toString(): String = "Box($content)"
}

// 多个类型参数
class Pair<T, U>(val first: T, val second: U) {
    override fun toString(): String = "($first, $second)"
}

// 泛型接口
interface Container<T> {
    fun add(item: T)
    fun get(index: Int): T
    fun size(): Int
}

fun main() {
    // 使用泛型类
    val stringBox = Box("Hello")
    val intBox = Box(42)
    
    println(stringBox.get())  // Hello
    println(intBox.get())     // 42
    
    stringBox.set("World")
    println(stringBox)        // Box(World)
    
    // 多类型参数
    val pair = Pair("Name", 25)
    println("姓名：${pair.first}，年龄：${pair.second}")
}
```

### 泛型函数
```kotlin
// 泛型函数
fun <T> singletonList(item: T): List<T> {
    return listOf(item)
}

fun <T> swap(pair: Pair<T, T>): Pair<T, T> {
    return Pair(pair.second, pair.first)
}

// 多个类型参数的函数
fun <T, R> transform(input: T, transformer: (T) -> R): R {
    return transformer(input)
}

// 扩展函数中的泛型
fun <T> List<T>.secondOrNull(): T? {
    return if (this.size >= 2) this[1] else null
}

fun main() {
    // 类型推断
    val stringList = singletonList("Hello")  // List<String>
    val intList = singletonList(42)          // List<Int>
    
    println(stringList)  // [Hello]
    println(intList)     // [42]
    
    // 显式指定类型
    val explicitList = singletonList<String>("World")
    
    // 使用泛型函数
    val originalPair = Pair(1, 2)
    val swappedPair = swap(originalPair)
    println("原始：$originalPair，交换后：$swappedPair")
    
    // 转换函数
    val result = transform("hello") { it.uppercase() }
    println(result)  // HELLO
    
    // 扩展函数
    val numbers = listOf(1, 2, 3)
    println("第二个元素：${numbers.secondOrNull()}")  // 2
}
```

## 🔒 泛型约束

### 上界约束
```kotlin
// 上界约束：T 必须是 Number 的子类型
fun <T : Number> sum(a: T, b: T): Double {
    return a.toDouble() + b.toDouble()
}

// 多个约束
interface Drawable {
    fun draw()
}

interface Clickable {
    fun click()
}

fun <T> useWidget(widget: T) where T : Drawable, T : Clickable {
    widget.draw()
    widget.click()
}

// 约束示例类
class Button : Drawable, Clickable {
    override fun draw() = println("绘制按钮")
    override fun click() = println("点击按钮")
}

// 比较函数
fun <T : Comparable<T>> max(a: T, b: T): T {
    return if (a > b) a else b
}

fun main() {
    // 数字约束
    println("整数求和：${sum(5, 3)}")        // 8.0
    println("浮点求和：${sum(2.5, 1.5)}")    // 4.0
    
    // 多约束
    val button = Button()
    useWidget(button)
    
    // 比较约束
    println("最大值：${max(10, 20)}")        // 20
    println("最大字符串：${max("apple", "banana")}")  // banana
}
```

### 下界约束（逆变）
```kotlin
// 使用 in 关键字表示逆变
interface Consumer<in T> {
    fun consume(item: T)
}

class StringConsumer : Consumer<String> {
    override fun consume(item: String) {
        println("消费字符串：$item")
    }
}

class AnyConsumer : Consumer<Any> {
    override fun consume(item: Any) {
        println("消费任意对象：$item")
    }
}

fun main() {
    val stringConsumer: Consumer<String> = StringConsumer()
    val anyConsumer: Consumer<Any> = AnyConsumer()
    
    // 逆变：Consumer<Any> 可以赋值给 Consumer<String>
    val consumer: Consumer<String> = anyConsumer
    consumer.consume("Hello")  // 消费任意对象：Hello
}
```

## 📊 型变（Variance）

### 协变（Covariance）
```kotlin
// 使用 out 关键字表示协变
interface Producer<out T> {
    fun produce(): T
}

class StringProducer : Producer<String> {
    override fun produce(): String = "Hello"
}

class NumberProducer : Producer<Number> {
    override fun produce(): Number = 42
}

// 协变示例
open class Animal(val name: String)
class Dog(name: String) : Animal(name)
class Cat(name: String) : Animal(name)

class AnimalShelter<out T : Animal>(private val animals: List<T>) {
    fun getAnimal(index: Int): T = animals[index]
    fun getAllAnimals(): List<T> = animals
}

fun main() {
    val stringProducer: Producer<String> = StringProducer()
    // 协变：Producer<String> 可以赋值给 Producer<Any>
    val anyProducer: Producer<Any> = stringProducer
    println(anyProducer.produce())  // Hello
    
    // 动物收容所示例
    val dogShelter = AnimalShelter(listOf(Dog("旺财"), Dog("小白")))
    val animalShelter: AnimalShelter<Animal> = dogShelter  // 协变
    
    println("动物：${animalShelter.getAnimal(0).name}")  // 旺财
}
```

### 不变（Invariance）
```kotlin
// 默认情况下，泛型是不变的
class MutableBox<T>(private var content: T) {
    fun get(): T = content
    fun set(value: T) {
        content = value
    }
}

fun main() {
    val stringBox = MutableBox("Hello")
    // val anyBox: MutableBox<Any> = stringBox  // 编译错误！不变
    
    // 必须使用相同的类型
    val anotherStringBox: MutableBox<String> = stringBox  // 正确
}
```

## 🌟 星号投影

### 使用星号投影
```kotlin
// 星号投影表示未知类型
fun printList(list: List<*>) {
    for (item in list) {
        println(item)  // item 的类型是 Any?
    }
}

fun getSize(list: List<*>): Int = list.size

// 更复杂的星号投影
class Container<T>(private val items: MutableList<T> = mutableListOf()) {
    fun add(item: T) = items.add(item)
    fun get(index: Int): T = items[index]
    fun size(): Int = items.size
}

fun processContainer(container: Container<*>) {
    // 只能调用不依赖类型参数的方法
    println("容器大小：${container.size()}")
    // container.add(item)  // 编译错误！无法添加未知类型
}

fun main() {
    val stringList = listOf("a", "b", "c")
    val intList = listOf(1, 2, 3)
    
    printList(stringList)  // a b c
    printList(intList)     // 1 2 3
    
    println("字符串列表大小：${getSize(stringList)}")  // 3
    println("整数列表大小：${getSize(intList)}")      // 3
    
    val stringContainer = Container<String>()
    stringContainer.add("Hello")
    processContainer(stringContainer)  // 容器大小：1
}
```

## 🔍 具体化类型参数

### reified 关键字
```kotlin
// 内联函数中的具体化类型参数
inline fun <reified T> isInstance(value: Any): Boolean {
    return value is T
}

inline fun <reified T> List<*>.filterIsInstance(): List<T> {
    return this.filter { it is T }.map { it as T }
}

// JSON 解析示例（伪代码）
inline fun <reified T> String.parseJson(): T {
    // 在运行时可以访问 T 的类型信息
    println("解析为类型：${T::class.simpleName}")
    // 实际的 JSON 解析逻辑...
    TODO("实现 JSON 解析")
}

fun main() {
    val value: Any = "Hello"
    
    println("是否为字符串：${isInstance<String>(value)}")  // true
    println("是否为整数：${isInstance<Int>(value)}")      // false
    
    val mixedList = listOf("a", 1, "b", 2, "c", 3)
    val strings = mixedList.filterIsInstance<String>()
    val numbers = mixedList.filterIsInstance<Int>()
    
    println("字符串：$strings")  // [a, b, c]
    println("数字：$numbers")    // [1, 2, 3]
    
    // JSON 解析示例
    // val user = """{"name":"张三","age":25}""".parseJson<User>()
}
```

## 🎯 实际应用

### 泛型数据结构
```kotlin
// 泛型栈实现
class Stack<T> {
    private val items = mutableListOf<T>()
    
    fun push(item: T) {
        items.add(item)
    }
    
    fun pop(): T? {
        return if (items.isNotEmpty()) items.removeAt(items.size - 1) else null
    }
    
    fun peek(): T? {
        return items.lastOrNull()
    }
    
    fun isEmpty(): Boolean = items.isEmpty()
    
    fun size(): Int = items.size
    
    override fun toString(): String = "Stack($items)"
}

// 泛型结果类
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    object Loading : Result<Nothing>()
    
    fun <R> map(transform: (T) -> R): Result<R> {
        return when (this) {
            is Success -> Success(transform(data))
            is Error -> this
            is Loading -> this
        }
    }
    
    fun getOrNull(): T? {
        return when (this) {
            is Success -> data
            else -> null
        }
    }
}

fun main() {
    // 使用泛型栈
    val stringStack = Stack<String>()
    stringStack.push("第一个")
    stringStack.push("第二个")
    stringStack.push("第三个")
    
    println("栈：$stringStack")
    println("弹出：${stringStack.pop()}")  // 第三个
    println("查看：${stringStack.peek()}")  // 第二个
    
    // 使用结果类
    val successResult: Result<String> = Result.Success("数据")
    val errorResult: Result<String> = Result.Error(RuntimeException("错误"))
    
    val mappedResult = successResult.map { it.uppercase() }
    println("映射结果：${mappedResult.getOrNull()}")  // 数据
}
```

### 泛型工厂模式
```kotlin
// 泛型工厂接口
interface Factory<T> {
    fun create(): T
}

// 具体工厂实现
class UserFactory : Factory<User> {
    override fun create(): User = User("默认用户", 0)
}

class ProductFactory : Factory<Product> {
    override fun create(): Product = Product("默认产品", 0.0)
}

// 泛型工厂管理器
class FactoryManager {
    private val factories = mutableMapOf<Class<*>, Factory<*>>()
    
    fun <T> registerFactory(clazz: Class<T>, factory: Factory<T>) {
        factories[clazz] = factory
    }
    
    @Suppress("UNCHECKED_CAST")
    fun <T> create(clazz: Class<T>): T? {
        val factory = factories[clazz] as? Factory<T>
        return factory?.create()
    }
}

data class User(val name: String, val age: Int)
data class Product(val name: String, val price: Double)

fun main() {
    val manager = FactoryManager()
    
    // 注册工厂
    manager.registerFactory(User::class.java, UserFactory())
    manager.registerFactory(Product::class.java, ProductFactory())
    
    // 创建对象
    val user = manager.create(User::class.java)
    val product = manager.create(Product::class.java)
    
    println("用户：$user")      // User(name=默认用户, age=0)
    println("产品：$product")   // Product(name=默认产品, price=0.0)
}
```

## 🎯 高级泛型技巧

### 类型别名
```kotlin
// 为复杂的泛型类型创建别名
typealias StringMap<V> = Map<String, V>
typealias EventHandler<T> = (T) -> Unit
typealias Validator<T> = (T) -> Boolean
typealias Transformer<T, R> = (T) -> R

fun main() {
    // 使用类型别名
    val userMap: StringMap<User> = mapOf(
        "user1" to User("张三", 25),
        "user2" to User("李四", 30)
    )
    
    val clickHandler: EventHandler<String> = { event ->
        println("处理事件：$event")
    }
    
    val emailValidator: Validator<String> = { email ->
        email.contains("@")
    }
    
    val upperCaseTransformer: Transformer<String, String> = { text ->
        text.uppercase()
    }
    
    println("用户映射：$userMap")
    clickHandler("点击事件")
    println("邮箱验证：${emailValidator("test@example.com")}")
    println("转换结果：${upperCaseTransformer("hello")}")
}
```

### 泛型委托
```kotlin
// 泛型属性委托
class LazyProperty<T>(private val initializer: () -> T) {
    private var value: T? = null
    private var initialized = false
    
    operator fun getValue(thisRef: Any?, property: kotlin.reflect.KProperty<*>): T {
        if (!initialized) {
            value = initializer()
            initialized = true
        }
        return value!!
    }
}

fun <T> lazyProperty(initializer: () -> T) = LazyProperty(initializer)

class Example {
    val expensiveString by lazyProperty { 
        println("计算昂贵的字符串...")
        "计算结果"
    }
    
    val expensiveList by lazyProperty {
        println("创建昂贵的列表...")
        listOf(1, 2, 3, 4, 5)
    }
}

fun main() {
    val example = Example()
    
    println("第一次访问字符串：${example.expensiveString}")
    println("第二次访问字符串：${example.expensiveString}")
    
    println("访问列表：${example.expensiveList}")
}
```

## 🎯 最佳实践

### 1. 选择合适的型变
```kotlin
// ✅ 只读操作使用协变 (out)
interface ReadOnlyList<out T> {
    fun get(index: Int): T
    fun size(): Int
}

// ✅ 只写操作使用逆变 (in)
interface WriteOnlyList<in T> {
    fun add(item: T)
}

// ✅ 读写操作使用不变
interface MutableList<T> {
    fun get(index: Int): T
    fun add(item: T)
}
```

### 2. 合理使用泛型约束
```kotlin
// ✅ 使用有意义的约束
fun <T : Comparable<T>> sort(list: MutableList<T>) {
    list.sort()
}

// ✅ 多个约束时使用 where
fun <T> process(item: T) where T : Serializable, T : Comparable<T> {
    // 处理可序列化且可比较的对象
}
```

### 3. 避免过度泛型化
```kotlin
// ❌ 避免：不必要的泛型
class StringProcessor<T : String> {  // 没有意义
    fun process(input: T): T = input
}

// ✅ 好的做法：直接使用具体类型
class StringProcessor {
    fun process(input: String): String = input
}
```

## 🎯 下一步

掌握泛型后，您可以继续学习：

1. [反射](./reflection.md)
2. [注解](./annotations.md)
3. [性能优化](./performance.md)

---

*泛型是类型安全和代码重用的基础，掌握它将让您的 Kotlin 代码更加灵活和安全！*
