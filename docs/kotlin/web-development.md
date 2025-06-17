# 🌐 Kotlin Web 开发

Kotlin 不仅可以用于 Android 开发，还可以用于服务端和前端 Web 开发。本章将介绍使用 Kotlin 进行 Web 开发的各种方式。

## 🎯 学习目标

- 掌握 Kotlin 服务端开发
- 了解 Kotlin/JS 前端开发
- 学会使用主流 Web 框架
- 理解全栈 Kotlin 开发

## 🖥️ 服务端开发

### Spring Boot + Kotlin
```kotlin
// build.gradle.kts
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    
    runtimeOnly("com.h2database:h2")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

// 主应用类
@SpringBootApplication
class WebApplication

fun main(args: Array<String>) {
    runApplication<WebApplication>(*args)
}

// 数据模型
@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(nullable = false)
    val name: String,
    
    @Column(nullable = false, unique = true)
    val email: String,
    
    @Column(nullable = false)
    val age: Int
)

// Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByEmail(email: String): User?
    fun findByAgeGreaterThan(age: Int): List<User>
}

// Service
@Service
class UserService(private val userRepository: UserRepository) {
    
    fun createUser(userRequest: CreateUserRequest): User {
        val user = User(
            name = userRequest.name,
            email = userRequest.email,
            age = userRequest.age
        )
        return userRepository.save(user)
    }
    
    fun getUserById(id: Long): User? {
        return userRepository.findById(id).orElse(null)
    }
    
    fun getAllUsers(): List<User> {
        return userRepository.findAll()
    }
    
    fun updateUser(id: Long, userRequest: UpdateUserRequest): User? {
        val existingUser = userRepository.findById(id).orElse(null) ?: return null
        
        val updatedUser = existingUser.copy(
            name = userRequest.name ?: existingUser.name,
            email = userRequest.email ?: existingUser.email,
            age = userRequest.age ?: existingUser.age
        )
        
        return userRepository.save(updatedUser)
    }
    
    fun deleteUser(id: Long): Boolean {
        return if (userRepository.existsById(id)) {
            userRepository.deleteById(id)
            true
        } else {
            false
        }
    }
}

// DTO
data class CreateUserRequest(
    val name: String,
    val email: String,
    val age: Int
)

data class UpdateUserRequest(
    val name: String? = null,
    val email: String? = null,
    val age: Int? = null
)

data class UserResponse(
    val id: Long,
    val name: String,
    val email: String,
    val age: Int
) {
    companion object {
        fun from(user: User): UserResponse {
            return UserResponse(
                id = user.id,
                name = user.name,
                email = user.email,
                age = user.age
            )
        }
    }
}

// Controller
@RestController
@RequestMapping("/api/users")
class UserController(private val userService: UserService) {
    
    @PostMapping
    fun createUser(@RequestBody request: CreateUserRequest): ResponseEntity<UserResponse> {
        val user = userService.createUser(request)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(UserResponse.from(user))
    }
    
    @GetMapping("/{id}")
    fun getUserById(@PathVariable id: Long): ResponseEntity<UserResponse> {
        val user = userService.getUserById(id)
        return if (user != null) {
            ResponseEntity.ok(UserResponse.from(user))
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    @GetMapping
    fun getAllUsers(): ResponseEntity<List<UserResponse>> {
        val users = userService.getAllUsers()
        val responses = users.map { UserResponse.from(it) }
        return ResponseEntity.ok(responses)
    }
    
    @PutMapping("/{id}")
    fun updateUser(
        @PathVariable id: Long,
        @RequestBody request: UpdateUserRequest
    ): ResponseEntity<UserResponse> {
        val user = userService.updateUser(id, request)
        return if (user != null) {
            ResponseEntity.ok(UserResponse.from(user))
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    @DeleteMapping("/{id}")
    fun deleteUser(@PathVariable id: Long): ResponseEntity<Void> {
        val deleted = userService.deleteUser(id)
        return if (deleted) {
            ResponseEntity.noContent().build()
        } else {
            ResponseEntity.notFound().build()
        }
    }
}
```

### Ktor 框架
```kotlin
// build.gradle.kts
dependencies {
    implementation("io.ktor:ktor-server-core:2.3.5")
    implementation("io.ktor:ktor-server-netty:2.3.5")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.5")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.5")
    implementation("io.ktor:ktor-server-cors:2.3.5")
    implementation("io.ktor:ktor-server-call-logging:2.3.5")
    implementation("ch.qos.logback:logback-classic:1.4.11")
}

// 主应用
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        configureRouting()
        configureSerialization()
        configureCORS()
        configureLogging()
    }.start(wait = true)
}

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json()
    }
}

fun Application.configureCORS() {
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
    }
}

fun Application.configureLogging() {
    install(CallLogging)
}

// 数据模型
@Serializable
data class User(
    val id: Int,
    val name: String,
    val email: String,
    val age: Int
)

@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String,
    val age: Int
)

// 内存数据存储（实际应用中应使用数据库）
object UserStorage {
    private val users = mutableListOf<User>()
    private var nextId = 1
    
    fun addUser(request: CreateUserRequest): User {
        val user = User(
            id = nextId++,
            name = request.name,
            email = request.email,
            age = request.age
        )
        users.add(user)
        return user
    }
    
    fun getAllUsers(): List<User> = users.toList()
    
    fun getUserById(id: Int): User? = users.find { it.id == id }
    
    fun updateUser(id: Int, request: CreateUserRequest): User? {
        val index = users.indexOfFirst { it.id == id }
        return if (index != -1) {
            val updatedUser = User(id, request.name, request.email, request.age)
            users[index] = updatedUser
            updatedUser
        } else {
            null
        }
    }
    
    fun deleteUser(id: Int): Boolean {
        return users.removeIf { it.id == id }
    }
}

// 路由配置
fun Application.configureRouting() {
    routing {
        route("/api/users") {
            get {
                call.respond(UserStorage.getAllUsers())
            }
            
            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, "Invalid ID")
                    return@get
                }
                
                val user = UserStorage.getUserById(id)
                if (user != null) {
                    call.respond(user)
                } else {
                    call.respond(HttpStatusCode.NotFound, "User not found")
                }
            }
            
            post {
                val request = call.receive<CreateUserRequest>()
                val user = UserStorage.addUser(request)
                call.respond(HttpStatusCode.Created, user)
            }
            
            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, "Invalid ID")
                    return@put
                }
                
                val request = call.receive<CreateUserRequest>()
                val user = UserStorage.updateUser(id, request)
                if (user != null) {
                    call.respond(user)
                } else {
                    call.respond(HttpStatusCode.NotFound, "User not found")
                }
            }
            
            delete("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id == null) {
                    call.respond(HttpStatusCode.BadRequest, "Invalid ID")
                    return@delete
                }
                
                val deleted = UserStorage.deleteUser(id)
                if (deleted) {
                    call.respond(HttpStatusCode.NoContent)
                } else {
                    call.respond(HttpStatusCode.NotFound, "User not found")
                }
            }
        }
    }
}
```

## 🌐 前端开发 (Kotlin/JS)

### React + Kotlin/JS
```kotlin
// build.gradle.kts
plugins {
    kotlin("js")
}

kotlin {
    js(IR) {
        browser {
            binaries.executable()
            webpackTask {
                cssSupport.enabled = true
            }
            runTask {
                cssSupport.enabled = true
            }
        }
    }
}

dependencies {
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react:18.2.0-pre.467")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react-dom:18.2.0-pre.467")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-emotion:11.10.5-pre.467")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}

// React 组件
import react.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.h1
import react.dom.html.ReactHTML.button
import react.dom.html.ReactHTML.input
import react.dom.html.ReactHTML.ul
import react.dom.html.ReactHTML.li
import kotlinx.coroutines.*

// 用户数据类
external interface User {
    var id: Int
    var name: String
    var email: String
    var age: Int
}

// 用户列表组件
val UserList = FC<Props> {
    var users by useState<Array<User>>(emptyArray())
    var loading by useState(false)
    
    // 获取用户列表
    val fetchUsers = {
        MainScope().launch {
            loading = true
            try {
                // 模拟 API 调用
                delay(1000)
                users = arrayOf(
                    js("{ id: 1, name: '张三', email: 'zhang@example.com', age: 25 }").unsafeCast<User>(),
                    js("{ id: 2, name: '李四', email: 'li@example.com', age: 30 }").unsafeCast<User>()
                )
            } finally {
                loading = false
            }
        }
    }
    
    useEffect {
        fetchUsers()
    }
    
    div {
        h1 { +"用户管理" }
        
        if (loading) {
            div { +"加载中..." }
        } else {
            ul {
                users.forEach { user ->
                    li {
                        key = user.id.toString()
                        +"${user.name} (${user.email}) - ${user.age}岁"
                    }
                }
            }
        }
        
        button {
            onClick = { fetchUsers() }
            +"刷新"
        }
    }
}

// 用户表单组件
val UserForm = FC<Props> {
    var name by useState("")
    var email by useState("")
    var age by useState("")
    
    val handleSubmit = { event: react.dom.events.FormEvent<*> ->
        event.preventDefault()
        console.log("提交用户：$name, $email, $age")
        // 这里可以调用 API 创建用户
        name = ""
        email = ""
        age = ""
    }
    
    div {
        h2 { +"添加用户" }
        
        form {
            onSubmit = handleSubmit
            
            div {
                input {
                    type = react.dom.html.InputType.text
                    placeholder = "姓名"
                    value = name
                    onChange = { event ->
                        name = event.target.value
                    }
                }
            }
            
            div {
                input {
                    type = react.dom.html.InputType.email
                    placeholder = "邮箱"
                    value = email
                    onChange = { event ->
                        email = event.target.value
                    }
                }
            }
            
            div {
                input {
                    type = react.dom.html.InputType.number
                    placeholder = "年龄"
                    value = age
                    onChange = { event ->
                        age = event.target.value
                    }
                }
            }
            
            button {
                type = react.dom.html.ButtonType.submit
                +"添加用户"
            }
        }
    }
}

// 主应用组件
val App = FC<Props> {
    div {
        UserForm()
        UserList()
    }
}
```

### HTML DSL
```kotlin
// 使用 kotlinx.html 构建 HTML
import kotlinx.html.*
import kotlinx.html.stream.createHTML

fun generateUserPage(users: List<User>): String {
    return createHTML().html {
        head {
            title { +"用户管理系统" }
            meta(charset = "UTF-8")
            style {
                +"""
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .user-card { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
                    .user-name { font-weight: bold; color: #333; }
                    .user-email { color: #666; }
                """.trimIndent()
            }
        }
        
        body {
            h1 { +"用户列表" }
            
            div {
                id = "user-list"
                
                users.forEach { user ->
                    div {
                        classes = setOf("user-card")
                        
                        div {
                            classes = setOf("user-name")
                            +user.name
                        }
                        
                        div {
                            classes = setOf("user-email")
                            +user.email
                        }
                        
                        div {
                            +"年龄：${user.age}"
                        }
                    }
                }
            }
            
            script {
                +"""
                    console.log('页面加载完成');
                    // 可以添加 JavaScript 代码
                """.trimIndent()
            }
        }
    }
}

// 在服务端使用
fun Application.configureTemplating() {
    routing {
        get("/users/page") {
            val users = UserStorage.getAllUsers()
            val html = generateUserPage(users)
            call.respondText(html, ContentType.Text.Html)
        }
    }
}
```

## 🔄 全栈开发

### 共享代码
```kotlin
// 共享模块 (commonMain)
@Serializable
data class User(
    val id: Int,
    val name: String,
    val email: String,
    val age: Int
)

@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String,
    val age: Int
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String = ""
)

// 验证逻辑（共享）
object UserValidator {
    fun validateCreateRequest(request: CreateUserRequest): List<String> {
        val errors = mutableListOf<String>()
        
        if (request.name.isBlank()) {
            errors.add("姓名不能为空")
        }
        
        if (!request.email.contains("@")) {
            errors.add("邮箱格式无效")
        }
        
        if (request.age < 0 || request.age > 150) {
            errors.add("年龄必须在 0-150 之间")
        }
        
        return errors
    }
}

// API 客户端（前端使用）
class ApiClient(private val baseUrl: String) {
    
    suspend fun getUsers(): ApiResponse<List<User>> {
        // 实现 HTTP 请求
        return ApiResponse(true, emptyList())
    }
    
    suspend fun createUser(request: CreateUserRequest): ApiResponse<User> {
        val errors = UserValidator.validateCreateRequest(request)
        if (errors.isNotEmpty()) {
            return ApiResponse(false, message = errors.joinToString(", "))
        }
        
        // 实现 HTTP 请求
        return ApiResponse(true, User(1, request.name, request.email, request.age))
    }
}
```

### 构建配置
```kotlin
// build.gradle.kts (多平台项目)
plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
}

kotlin {
    jvm {
        withJava()
    }
    
    js(IR) {
        browser {
            binaries.executable()
        }
    }
    
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
            }
        }
        
        val jvmMain by getting {
            dependencies {
                implementation("io.ktor:ktor-server-core:2.3.5")
                implementation("io.ktor:ktor-server-netty:2.3.5")
                implementation("io.ktor:ktor-server-content-negotiation:2.3.5")
                implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.5")
            }
        }
        
        val jsMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlin-wrappers:kotlin-react:18.2.0-pre.467")
                implementation("org.jetbrains.kotlin-wrappers:kotlin-react-dom:18.2.0-pre.467")
            }
        }
    }
}
```

## 🎯 最佳实践

### 1. 项目结构
```
kotlin-web-app/
├── shared/                 # 共享代码
│   ├── src/commonMain/
│   └── build.gradle.kts
├── backend/               # 服务端
│   ├── src/main/kotlin/
│   └── build.gradle.kts
├── frontend/              # 前端
│   ├── src/main/kotlin/
│   └── build.gradle.kts
└── build.gradle.kts       # 根构建文件
```

### 2. API 设计
```kotlin
// RESTful API 设计
@RestController
@RequestMapping("/api/v1")
class ApiController {
    
    // 统一响应格式
    data class ApiResponse<T>(
        val success: Boolean,
        val data: T? = null,
        val message: String = "",
        val timestamp: Long = System.currentTimeMillis()
    )
    
    // 统一异常处理
    @ExceptionHandler(Exception::class)
    fun handleException(e: Exception): ResponseEntity<ApiResponse<Nothing>> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse(false, message = e.message ?: "未知错误"))
    }
}
```

### 3. 安全性
```kotlin
// JWT 认证
@Component
class JwtTokenProvider {
    
    fun generateToken(username: String): String {
        // 生成 JWT token
        return "jwt_token"
    }
    
    fun validateToken(token: String): Boolean {
        // 验证 JWT token
        return true
    }
    
    fun getUsernameFromToken(token: String): String {
        // 从 token 中提取用户名
        return "username"
    }
}

// 安全配置
@Configuration
@EnableWebSecurity
class SecurityConfig {
    
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .csrf { it.disable() }
            .authorizeHttpRequests { auth ->
                auth.requestMatchers("/api/auth/**").permitAll()
                    .anyRequest().authenticated()
            }
            .build()
    }
}
```

## 🎯 下一步

掌握 Web 开发后，您可以继续学习：

1. [多平台开发](./multiplatform.md)
2. [开发工具](./tools.md)
3. [部署与运维](./deployment.md)

---

*Kotlin 为 Web 开发提供了完整的解决方案，从后端到前端都能使用同一种语言！*
