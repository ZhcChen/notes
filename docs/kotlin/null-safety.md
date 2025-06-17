# 🛡️ Kotlin 空安全

空安全是 Kotlin 最重要的特性之一，它在编译时就能防止空指针异常（NullPointerException），让代码更加安全可靠。

## 🎯 学习目标

- 理解 Kotlin 的空安全机制
- 掌握可空类型和非空类型
- 学会使用安全调用操作符
- 了解空安全的最佳实践

## 🚫 空指针问题

### Java 中的空指针异常
```java
// Java 代码示例
String str = null;
int length = str.length();  // 运行时抛出 NullPointerException
```

### Kotlin 的解决方案
```kotlin
// Kotlin 编译时检查
val str: String = null  // 编译错误！
val str: String? = null // 正确：显式声明可空类型
```

## 📝 可空类型系统

### 类型声明
```kotlin
fun main() {
    // 非空类型（默认）
    var nonNullString: String = "Hello"
    // nonNullString = null  // 编译错误！
    
    // 可空类型（添加 ?）
    var nullableString: String? = "World"
    nullableString = null  // 正确
    
    // 基本类型的可空版本
    val nullableInt: Int? = null
    val nullableBoolean: Boolean? = null
    val nullableDouble: Double? = null
    
    // 集合的可空类型
    val nullableList: List<String>? = null
    val listOfNullables: List<String?> = listOf("a", null, "c")
    val nullableListOfNullables: List<String?>? = null
}
```

### 类型层次结构
```kotlin
fun main() {
    // Any 是所有非空类型的根类型
    val any: Any = "Hello"
    
    // Any? 是所有类型的根类型
    val anyNullable: Any? = null
    
    // Nothing 是所有类型的子类型
    fun fail(): Nothing = throw Exception("失败")
    
    // Nothing? 只有 null 一个值
    val nothingNullable: Nothing? = null
}
```

## 🔒 安全调用操作符

### ?. 操作符
```kotlin
fun main() {
    val nullableString: String? = null
    
    // 安全调用：如果对象为 null，整个表达式返回 null
    val length = nullableString?.length
    println("长度：$length")  // 输出：长度：null
    
    // 链式安全调用
    val result = nullableString?.uppercase()?.substring(0, 3)
    println("结果：$result")  // 输出：结果：null
    
    // 与非空值的对比
    val nonNullString = "Hello"
    val safeLength = nonNullString.length  // 直接调用
    println("非空长度：$safeLength")  // 输出：非空长度：5
}
```

### 安全调用的实际应用
```kotlin
data class Person(val name: String, val address: Address?)
data class Address(val street: String, val city: String)

fun main() {
    val person: Person? = Person("张三", null)
    
    // 安全访问嵌套属性
    val city = person?.address?.city
    println("城市：$city")  // 输出：城市：null
    
    // 安全调用方法
    val upperCaseName = person?.name?.uppercase()
    println("大写姓名：$upperCaseName")  // 输出：大写姓名：张三
}
```

## ⚡ Elvis 操作符

### ?: 操作符
```kotlin
fun main() {
    val nullableString: String? = null
    
    // Elvis 操作符：提供默认值
    val length = nullableString?.length ?: 0
    println("长度：$length")  // 输出：长度：0
    
    val message = nullableString ?: "默认消息"
    println("消息：$message")  // 输出：消息：默认消息
    
    // 复杂表达式
    val result = nullableString?.takeIf { it.isNotEmpty() }?.uppercase() ?: "空字符串"
    println("结果：$result")  // 输出：结果：空字符串
}
```

### Elvis 操作符的高级用法
```kotlin
fun main() {
    // 与 return 结合
    fun processString(input: String?): String {
        val trimmed = input?.trim() ?: return "输入为空"
        return "处理结果：$trimmed"
    }
    
    println(processString(null))      // 输出：输入为空
    println(processString("  hello  "))  // 输出：处理结果：hello
    
    // 与 throw 结合
    fun validateInput(input: String?) {
        val validated = input ?: throw IllegalArgumentException("输入不能为空")
        println("验证通过：$validated")
    }
    
    try {
        validateInput(null)
    } catch (e: IllegalArgumentException) {
        println("验证失败：${e.message}")
    }
}
```

## ❗ 非空断言操作符

### !! 操作符
```kotlin
fun main() {
    val nullableString: String? = "Hello"
    
    // 非空断言：确定不为 null 时使用
    val length = nullableString!!.length
    println("长度：$length")  // 输出：长度：5
    
    // 危险用法（会抛出异常）
    val nullString: String? = null
    try {
        val unsafeLength = nullString!!.length  // 抛出 KotlinNullPointerException
    } catch (e: Exception) {
        println("异常：${e.javaClass.simpleName}")
    }
}
```

### 何时使用非空断言
```kotlin
fun main() {
    // 1. 从 Java 代码返回的值（确定不为 null）
    val javaString = System.getProperty("java.version")!!
    
    // 2. 延迟初始化后的访问
    lateinit var database: String
    database = "MySQL"
    val dbName = database  // 不需要 !!，lateinit 自动处理
    
    // 3. 平台类型转换
    val platformString: String = javaString  // 平台类型自动转换
}
```

## 🔍 安全转换

### as? 操作符
```kotlin
fun main() {
    val obj: Any = "Hello"
    
    // 安全转换：失败时返回 null
    val str = obj as? String
    println("字符串：$str")  // 输出：字符串：Hello
    
    val number = obj as? Int
    println("数字：$number")  // 输出：数字：null
    
    // 与 Elvis 操作符结合
    val length = (obj as? String)?.length ?: 0
    println("长度：$length")  // 输出：长度：5
    
    // 实际应用
    fun processValue(value: Any) {
        when (val converted = value as? String) {
            null -> println("不是字符串类型")
            else -> println("字符串长度：${converted.length}")
        }
    }
    
    processValue("Hello")  // 输出：字符串长度：5
    processValue(123)      // 输出：不是字符串类型
}
```

## 🔧 空安全函数

### let 函数
```kotlin
fun main() {
    val nullableString: String? = "Hello"
    
    // let：仅在非空时执行
    nullableString?.let { str ->
        println("字符串长度：${str.length}")
        println("大写：${str.uppercase()}")
    }
    
    // 简化写法
    nullableString?.let {
        println("处理：$it")
    }
    
    // 链式调用
    val result = nullableString
        ?.takeIf { it.isNotEmpty() }
        ?.let { it.uppercase() }
        ?.let { "处理结果：$it" }
    
    println(result)  // 输出：处理结果：HELLO
}
```

### run 函数
```kotlin
fun main() {
    val nullableString: String? = "Hello"
    
    // run：在对象上下文中执行代码块
    val result = nullableString?.run {
        println("原始字符串：$this")
        uppercase()
    }
    
    println("结果：$result")  // 输出：结果：HELLO
}
```

### also 和 apply 函数
```kotlin
fun main() {
    val nullableString: String? = "Hello"
    
    // also：执行额外操作，返回原对象
    val processed = nullableString?.also {
        println("处理前：$it")
    }?.uppercase()
    
    println("处理后：$processed")  // 输出：处理后：HELLO
    
    // apply：在对象上下文中配置对象
    data class Person(var name: String, var age: Int)
    
    val person: Person? = Person("", 0)
    person?.apply {
        name = "张三"
        age = 25
    }
    
    println("配置后：$person")  // 输出：配置后：Person(name=张三, age=25)
}
```

## 📋 集合的空安全

### 可空集合处理
```kotlin
fun main() {
    // 可空集合
    val nullableList: List<String>? = null
    val emptyList: List<String> = emptyList()
    val listWithNulls: List<String?> = listOf("a", null, "c")
    
    // 安全访问集合元素
    val firstElement = nullableList?.firstOrNull()
    println("第一个元素：$firstElement")  // 输出：第一个元素：null
    
    // 过滤空值
    val nonNullElements = listWithNulls.filterNotNull()
    println("非空元素：$nonNullElements")  // 输出：非空元素：[a, c]
    
    // 安全的集合操作
    val sizes = nullableList?.map { it.length } ?: emptyList()
    println("长度列表：$sizes")  // 输出：长度列表：[]
}
```

### Map 的空安全
```kotlin
fun main() {
    val map: Map<String, String?> = mapOf(
        "key1" to "value1",
        "key2" to null,
        "key3" to "value3"
    )
    
    // 安全获取值
    val value1 = map["key1"]  // String?
    val value2 = map["key2"]  // String? (null)
    val value3 = map["key4"]  // String? (null, key 不存在)
    
    // 使用 Elvis 操作符提供默认值
    val safeValue = map["key2"] ?: "默认值"
    println("安全值：$safeValue")  // 输出：安全值：默认值
    
    // 过滤非空值
    val nonNullValues = map.values.filterNotNull()
    println("非空值：$nonNullValues")  // 输出：非空值：[value1, value3]
}
```

## 🎯 最佳实践

### 1. 优先使用非空类型
```kotlin
// 好的做法
fun processName(name: String) {
    println("处理姓名：$name")
}

// 避免不必要的可空类型
fun processNameBad(name: String?) {
    name?.let { println("处理姓名：$it") }
}
```

### 2. 合理使用默认值
```kotlin
fun main() {
    // 使用有意义的默认值
    fun getUserName(user: User?): String {
        return user?.name ?: "匿名用户"
    }
    
    // 使用空集合而不是 null
    fun getItems(): List<String> {
        return emptyList()  // 而不是返回 null
    }
}

data class User(val name: String)
```

### 3. 避免过度使用非空断言
```kotlin
fun main() {
    val input: String? = getInput()
    
    // 不好的做法
    val length1 = input!!.length
    
    // 好的做法
    val length2 = input?.length ?: 0
    
    // 或者使用 let
    input?.let { str ->
        println("输入长度：${str.length}")
    }
}

fun getInput(): String? = "test"
```

### 4. 使用 lateinit 和 lazy
```kotlin
class DatabaseManager {
    // 延迟初始化
    lateinit var connection: String
    
    // 惰性初始化
    val config: String by lazy {
        loadConfiguration()
    }
    
    fun initialize() {
        connection = "database://localhost"
    }
    
    private fun loadConfiguration(): String {
        return "config"
    }
}
```

## 🔧 实际应用示例

### 用户信息处理
```kotlin
data class User(
    val id: String,
    val name: String?,
    val email: String?,
    val profile: Profile?
)

data class Profile(
    val avatar: String?,
    val bio: String?
)

fun main() {
    val user: User? = User(
        id = "123",
        name = null,
        email = "user@example.com",
        profile = Profile(avatar = null, bio = "Hello")
    )
    
    // 安全访问嵌套属性
    val displayName = user?.name ?: "匿名用户"
    val bio = user?.profile?.bio ?: "暂无简介"
    val avatar = user?.profile?.avatar ?: "default_avatar.png"
    
    println("用户：$displayName")
    println("简介：$bio")
    println("头像：$avatar")
    
    // 安全的邮箱验证
    user?.email?.let { email ->
        if (email.contains("@")) {
            println("有效邮箱：$email")
        } else {
            println("无效邮箱格式")
        }
    } ?: println("邮箱为空")
}
```

## 🎯 下一步

掌握空安全后，您可以继续学习：

1. [函数](./functions.md)
2. [类与对象](./classes.md)
3. [集合框架](./collections.md)

---

*空安全是 Kotlin 的核心特性，掌握它将让您的代码更加安全可靠！*
