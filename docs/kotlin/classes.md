# 🏗️ Kotlin 类与对象

类是面向对象编程的基础，Kotlin 提供了简洁而强大的类系统，支持数据类、密封类、内联类等多种类型。

## 🎯 学习目标

- 掌握类的定义和实例化
- 理解构造函数和属性
- 学会使用继承和多态
- 了解数据类和密封类

## 📝 基本类定义

### 类的声明
```kotlin
// 基本类定义
class Person {
    var name: String = ""
    var age: Int = 0
    
    fun introduce() {
        println("我是 $name，今年 $age 岁")
    }
}

// 使用类
fun main() {
    val person = Person()
    person.name = "张三"
    person.age = 25
    person.introduce()  // 我是 张三，今年 25 岁
}
```

### 构造函数
```kotlin
// 主构造函数
class Person(firstName: String, lastName: String) {
    val fullName = "$firstName $lastName"
    
    init {
        println("创建了一个人：$fullName")
    }
}

// 带默认值的构造函数
class User(
    val name: String,
    val age: Int = 18,
    val email: String = ""
) {
    fun getInfo(): String {
        return "姓名：$name，年龄：$age，邮箱：$email"
    }
}

// 次构造函数
class Rectangle {
    var width: Double = 0.0
    var height: Double = 0.0
    
    // 主构造函数
    constructor(width: Double, height: Double) {
        this.width = width
        this.height = height
    }
    
    // 次构造函数
    constructor(side: Double) : this(side, side)  // 正方形
    
    fun area(): Double = width * height
}

fun main() {
    val person = Person("张", "三")
    val user = User("李四", 30, "li@example.com")
    
    val rectangle = Rectangle(5.0, 3.0)
    val square = Rectangle(4.0)  // 使用次构造函数
    
    println(user.getInfo())
    println("矩形面积：${rectangle.area()}")
    println("正方形面积：${square.area()}")
}
```

## 🔧 属性和字段

### 属性定义
```kotlin
class Person {
    // 可变属性
    var name: String = ""
        get() = field.uppercase()  // 自定义 getter
        set(value) {
            field = value.trim()   // 自定义 setter
        }
    
    // 只读属性
    val id: String = generateId()
    
    // 计算属性（没有后备字段）
    val displayName: String
        get() = "用户：$name"
    
    // 延迟初始化属性
    lateinit var database: String
    
    // 惰性属性
    val expensiveProperty: String by lazy {
        println("计算昂贵属性...")
        "计算结果"
    }
    
    private fun generateId(): String = "user_${System.currentTimeMillis()}"
}

fun main() {
    val person = Person()
    person.name = "  张三  "
    println(person.name)        //张三（自动转大写和去空格）
    println(person.displayName) // 用户：张三
    println(person.expensiveProperty) // 第一次访问时计算
}
```

### 可见性修饰符
```kotlin
class BankAccount {
    // public（默认）
    val accountNumber: String = "123456"
    
    // private：只在类内部可见
    private var balance: Double = 0.0
    
    // protected：在类及其子类中可见
    protected var transactionHistory: MutableList<String> = mutableListOf()
    
    // internal：在同一模块内可见
    internal var internalId: String = "internal_123"
    
    fun deposit(amount: Double) {
        if (amount > 0) {
            balance += amount
            transactionHistory.add("存款：$amount")
        }
    }
    
    fun getBalance(): Double = balance
    
    private fun validateTransaction(amount: Double): Boolean {
        return amount > 0 && amount <= 10000
    }
}
```

## 🔄 继承

### 基本继承
```kotlin
// 基类（必须用 open 关键字）
open class Animal(val name: String) {
    open fun makeSound() {
        println("$name 发出声音")
    }
    
    open val species: String = "未知物种"
}

// 派生类
class Dog(name: String) : Animal(name) {
    override fun makeSound() {
        println("$name 汪汪叫")
    }
    
    override val species: String = "犬科"
    
    fun fetch() {
        println("$name 去捡球")
    }
}

class Cat(name: String) : Animal(name) {
    override fun makeSound() {
        println("$name 喵喵叫")
    }
    
    override val species: String = "猫科"
    
    fun climb() {
        println("$name 爬树")
    }
}

fun main() {
    val dog = Dog("旺财")
    val cat = Cat("咪咪")
    
    dog.makeSound()  // 旺财 汪汪叫
    cat.makeSound()  // 咪咪 喵喵叫
    
    dog.fetch()      // 旺财 去捡球
    cat.climb()      // 咪咪 爬树
    
    // 多态
    val animals: List<Animal> = listOf(dog, cat)
    animals.forEach { it.makeSound() }
}
```

### 抽象类
```kotlin
abstract class Shape {
    abstract val name: String
    abstract fun area(): Double
    abstract fun perimeter(): Double
    
    // 具体方法
    fun describe() {
        println("这是一个 $name，面积：${area()}，周长：${perimeter()}")
    }
}

class Circle(private val radius: Double) : Shape() {
    override val name: String = "圆形"
    
    override fun area(): Double = Math.PI * radius * radius
    
    override fun perimeter(): Double = 2 * Math.PI * radius
}

class Rectangle(private val width: Double, private val height: Double) : Shape() {
    override val name: String = "矩形"
    
    override fun area(): Double = width * height
    
    override fun perimeter(): Double = 2 * (width + height)
}

fun main() {
    val shapes: List<Shape> = listOf(
        Circle(5.0),
        Rectangle(4.0, 6.0)
    )
    
    shapes.forEach { it.describe() }
}
```

## 📦 数据类

### 数据类定义
```kotlin
// 数据类自动生成 equals、hashCode、toString、copy
data class User(
    val id: String,
    val name: String,
    val email: String,
    val age: Int = 18
)

fun main() {
    val user1 = User("1", "张三", "zhang@example.com", 25)
    val user2 = User("2", "李四", "li@example.com")
    
    // 自动生成的 toString
    println(user1)  // User(id=1, name=张三, email=zhang@example.com, age=25)
    
    // 自动生成的 equals
    val user1Copy = user1.copy()
    println(user1 == user1Copy)  // true
    
    // copy 方法
    val olderUser = user1.copy(age = 30)
    println(olderUser)  // User(id=1, name=张三, email=zhang@example.com, age=30)
    
    // 解构声明
    val (id, name, email, age) = user1
    println("ID: $id, 姓名: $name, 邮箱: $email, 年龄: $age")
}
```

### 数据类的限制和用法
```kotlin
// 数据类必须有至少一个主构造函数参数
// data class Empty()  // 编译错误

// 数据类不能是 abstract、open、sealed 或 inner
// abstract data class AbstractUser()  // 编译错误

// 数据类的实际应用
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String = ""
)

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val userId: String,
    val expiresAt: Long
)

fun main() {
    val loginRequest = LoginRequest("user123", "password")
    
    val successResponse = ApiResponse(
        success = true,
        data = LoginResponse("token123", "user123", System.currentTimeMillis() + 3600000)
    )
    
    val errorResponse = ApiResponse<LoginResponse>(
        success = false,
        data = null,
        message = "用户名或密码错误"
    )
    
    println(successResponse)
    println(errorResponse)
}
```

## 🔒 密封类

### 密封类定义
```kotlin
// 密封类：限制继承层次
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

// 网络请求状态
sealed class NetworkState {
    object Idle : NetworkState()
    object Loading : NetworkState()
    data class Success(val data: String) : NetworkState()
    data class Error(val message: String) : NetworkState()
}

fun main() {
    val result: Result<String> = Result.Success("数据加载成功")
    
    // when 表达式自动穷尽所有情况
    val message = when (result) {
        is Result.Success -> "成功：${result.data}"
        is Result.Error -> "错误：${result.exception.message}"
        is Result.Loading -> "加载中..."
    }
    
    println(message)
    
    // 处理网络状态
    fun handleNetworkState(state: NetworkState) {
        when (state) {
            is NetworkState.Idle -> println("空闲状态")
            is NetworkState.Loading -> println("加载中...")
            is NetworkState.Success -> println("成功：${state.data}")
            is NetworkState.Error -> println("错误：${state.message}")
        }
    }
    
    handleNetworkState(NetworkState.Loading)
    handleNetworkState(NetworkState.Success("用户数据"))
    handleNetworkState(NetworkState.Error("网络连接失败"))
}
```

## 🎭 对象表达式和对象声明

### 对象表达式（匿名对象）
```kotlin
interface ClickListener {
    fun onClick()
    fun onLongClick()
}

fun main() {
    // 对象表达式
    val clickListener = object : ClickListener {
        override fun onClick() {
            println("点击事件")
        }
        
        override fun onLongClick() {
            println("长按事件")
        }
    }
    
    clickListener.onClick()
    clickListener.onLongClick()
    
    // 匿名对象可以访问外部变量
    var count = 0
    val counter = object {
        fun increment() {
            count++
            println("计数：$count")
        }
    }
    
    counter.increment()  // 计数：1
    counter.increment()  // 计数：2
}
```

### 对象声明（单例）
```kotlin
// 单例对象
object DatabaseManager {
    private var isConnected = false
    
    fun connect() {
        if (!isConnected) {
            println("连接数据库...")
            isConnected = true
        }
    }
    
    fun disconnect() {
        if (isConnected) {
            println("断开数据库连接...")
            isConnected = false
        }
    }
    
    fun isConnected(): Boolean = isConnected
}

// 伴生对象
class User private constructor(val id: String, val name: String) {
    companion object Factory {
        private var nextId = 1
        
        fun create(name: String): User {
            return User("user_${nextId++}", name)
        }
        
        fun fromJson(json: String): User {
            // 解析 JSON 创建用户
            return User("parsed_id", "parsed_name")
        }
        
        const val MAX_NAME_LENGTH = 50
    }
    
    override fun toString(): String = "User(id=$id, name=$name)"
}

fun main() {
    // 使用单例对象
    DatabaseManager.connect()
    println("数据库连接状态：${DatabaseManager.isConnected()}")
    DatabaseManager.disconnect()
    
    // 使用伴生对象
    val user1 = User.create("张三")
    val user2 = User.create("李四")
    val user3 = User.fromJson("{\"name\":\"王五\"}")
    
    println(user1)  // User(id=user_1, name=张三)
    println(user2)  // User(id=user_2, name=李四)
    println(user3)  // User(id=parsed_id, name=parsed_name)
    
    println("最大姓名长度：${User.MAX_NAME_LENGTH}")
}
```

## 🎯 实践练习

### 练习：图书管理系统
```kotlin
// 基础类
abstract class Publication(
    val title: String,
    val author: String,
    val publishYear: Int
) {
    abstract fun getType(): String
    abstract fun getDescription(): String
    
    override fun toString(): String {
        return "${getType()}: $title by $author ($publishYear)"
    }
}

// 具体实现类
class Book(
    title: String,
    author: String,
    publishYear: Int,
    val pages: Int,
    val isbn: String
) : Publication(title, author, publishYear) {
    
    override fun getType(): String = "书籍"
    
    override fun getDescription(): String {
        return "$title - $pages 页，ISBN: $isbn"
    }
}

class Magazine(
    title: String,
    author: String,
    publishYear: Int,
    val issue: Int,
    val month: String
) : Publication(title, author, publishYear) {
    
    override fun getType(): String = "杂志"
    
    override fun getDescription(): String {
        return "$title - 第 $issue 期，$month 月刊"
    }
}

// 数据类
data class Member(
    val id: String,
    val name: String,
    val email: String,
    val joinDate: String
)

// 密封类表示借阅状态
sealed class BorrowStatus {
    object Available : BorrowStatus()
    data class Borrowed(val member: Member, val dueDate: String) : BorrowStatus()
    object Reserved : BorrowStatus()
}

// 图书馆管理系统
object Library {
    private val publications = mutableListOf<Publication>()
    private val members = mutableListOf<Member>()
    private val borrowStatus = mutableMapOf<Publication, BorrowStatus>()
    
    fun addPublication(publication: Publication) {
        publications.add(publication)
        borrowStatus[publication] = BorrowStatus.Available
        println("添加出版物：${publication.getDescription()}")
    }
    
    fun addMember(member: Member) {
        members.add(member)
        println("添加会员：${member.name}")
    }
    
    fun borrowPublication(publication: Publication, member: Member, dueDate: String): Boolean {
        return when (borrowStatus[publication]) {
            is BorrowStatus.Available -> {
                borrowStatus[publication] = BorrowStatus.Borrowed(member, dueDate)
                println("${member.name} 借阅了 ${publication.title}")
                true
            }
            is BorrowStatus.Borrowed -> {
                println("${publication.title} 已被借阅")
                false
            }
            is BorrowStatus.Reserved -> {
                println("${publication.title} 已被预订")
                false
            }
            null -> {
                println("出版物不存在")
                false
            }
        }
    }
    
    fun returnPublication(publication: Publication): Boolean {
        return when (val status = borrowStatus[publication]) {
            is BorrowStatus.Borrowed -> {
                borrowStatus[publication] = BorrowStatus.Available
                println("${status.member.name} 归还了 ${publication.title}")
                true
            }
            else -> {
                println("该出版物未被借阅")
                false
            }
        }
    }
    
    fun getStatus(publication: Publication) {
        when (val status = borrowStatus[publication]) {
            is BorrowStatus.Available -> println("${publication.title} 可借阅")
            is BorrowStatus.Borrowed -> println("${publication.title} 已借给 ${status.member.name}，归还日期：${status.dueDate}")
            is BorrowStatus.Reserved -> println("${publication.title} 已预订")
            null -> println("出版物不存在")
        }
    }
}

fun main() {
    // 创建出版物
    val book = Book("Kotlin 编程", "张三", 2023, 300, "978-1234567890")
    val magazine = Magazine("科技月刊", "李四", 2023, 12, "12")
    
    // 创建会员
    val member1 = Member("M001", "王五", "wang@example.com", "2023-01-01")
    val member2 = Member("M002", "赵六", "zhao@example.com", "2023-02-01")
    
    // 添加到图书馆
    Library.addPublication(book)
    Library.addPublication(magazine)
    Library.addMember(member1)
    Library.addMember(member2)
    
    // 借阅操作
    Library.borrowPublication(book, member1, "2023-12-31")
    Library.borrowPublication(book, member2, "2023-12-31")  // 应该失败
    
    // 查看状态
    Library.getStatus(book)
    Library.getStatus(magazine)
    
    // 归还
    Library.returnPublication(book)
    Library.getStatus(book)
}
```

## 🎯 下一步

掌握类与对象后，您可以继续学习：

1. [扩展函数](./extensions.md)
2. [泛型](./generics.md)
3. [集合框架](./collections.md)

---

*类与对象是面向对象编程的核心，掌握它们将为您的 Kotlin 编程打下坚实基础！*
