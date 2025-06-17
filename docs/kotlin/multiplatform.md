# 🌍 Kotlin 多平台开发

Kotlin Multiplatform 允许您在多个平台之间共享代码，包括 Android、iOS、Web、桌面和服务端，大大提高开发效率。

## 🎯 学习目标

- 理解 Kotlin 多平台的概念
- 掌握多平台项目结构
- 学会共享业务逻辑
- 了解平台特定实现

## 📱 多平台概述

### 支持的平台
```kotlin
// Kotlin Multiplatform 支持的目标平台
kotlin {
    // JVM 平台
    jvm()
    
    // Android 平台
    android()
    
    // iOS 平台
    iosX64()
    iosArm64()
    iosSimulatorArm64()
    
    // JavaScript 平台
    js(IR) {
        browser()
        nodejs()
    }
    
    // Native 平台
    linuxX64()
    macosX64()
    macosArm64()
    mingwX64()
    
    // WebAssembly
    wasm()
}
```

### 项目结构
```
multiplatform-project/
├── shared/                    # 共享模块
│   ├── src/
│   │   ├── commonMain/       # 通用代码
│   │   ├── commonTest/       # 通用测试
│   │   ├── androidMain/      # Android 特定代码
│   │   ├── iosMain/          # iOS 特定代码
│   │   ├── jvmMain/          # JVM 特定代码
│   │   └── jsMain/           # JavaScript 特定代码
│   └── build.gradle.kts
├── androidApp/               # Android 应用
├── iosApp/                   # iOS 应用
├── webApp/                   # Web 应用
└── desktopApp/              # 桌面应用
```

## 🔧 项目配置

### 构建配置
```kotlin
// shared/build.gradle.kts
plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
    id("com.android.library")
}

kotlin {
    android {
        compilations.all {
            kotlinOptions {
                jvmTarget = "1.8"
            }
        }
    }
    
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach {
        it.binaries.framework {
            baseName = "shared"
        }
    }
    
    js(IR) {
        browser {
            testTask {
                useKarma {
                    useChromeHeadless()
                    webpackConfig.cssSupport.enabled = true
                }
            }
        }
    }
    
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")
                implementation("io.ktor:ktor-client-core:2.3.5")
                implementation("io.ktor:ktor-client-content-negotiation:2.3.5")
                implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.5")
            }
        }
        
        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
            }
        }
        
        val androidMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-android:2.3.5")
            }
        }
        
        val iosMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-darwin:2.3.5")
            }
        }
        
        val jsMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-js:2.3.5")
            }
        }
    }
}

android {
    namespace = "com.example.shared"
    compileSdk = 34
    defaultConfig {
        minSdk = 24
    }
}
```

## 📊 共享业务逻辑

### 数据模型
```kotlin
// commonMain/kotlin/model/User.kt
import kotlinx.serialization.Serializable
import kotlinx.datetime.Instant

@Serializable
data class User(
    val id: String,
    val name: String,
    val email: String,
    val avatar: String? = null,
    val createdAt: Instant
)

@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String = ""
)
```

### 网络层
```kotlin
// commonMain/kotlin/network/ApiClient.kt
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

class ApiClient(private val baseUrl: String) {
    
    private val httpClient = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }
    }
    
    suspend fun getUsers(): Result<List<User>> {
        return try {
            val response = httpClient.get("$baseUrl/users")
            val apiResponse = response.body<ApiResponse<List<User>>>()
            
            if (apiResponse.success && apiResponse.data != null) {
                Result.success(apiResponse.data)
            } else {
                Result.failure(Exception(apiResponse.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createUser(request: CreateUserRequest): Result<User> {
        return try {
            val response = httpClient.post("$baseUrl/users") {
                contentType(ContentType.Application.Json)
                setBody(request)
            }
            val apiResponse = response.body<ApiResponse<User>>()
            
            if (apiResponse.success && apiResponse.data != null) {
                Result.success(apiResponse.data)
            } else {
                Result.failure(Exception(apiResponse.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getUserById(id: String): Result<User> {
        return try {
            val response = httpClient.get("$baseUrl/users/$id")
            val apiResponse = response.body<ApiResponse<User>>()
            
            if (apiResponse.success && apiResponse.data != null) {
                Result.success(apiResponse.data)
            } else {
                Result.failure(Exception(apiResponse.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 业务逻辑
```kotlin
// commonMain/kotlin/repository/UserRepository.kt
class UserRepository(private val apiClient: ApiClient) {
    
    private val _users = mutableListOf<User>()
    val users: List<User> get() = _users.toList()
    
    suspend fun loadUsers(): Result<List<User>> {
        val result = apiClient.getUsers()
        result.onSuccess { userList ->
            _users.clear()
            _users.addAll(userList)
        }
        return result
    }
    
    suspend fun createUser(name: String, email: String): Result<User> {
        // 客户端验证
        if (name.isBlank()) {
            return Result.failure(Exception("姓名不能为空"))
        }
        
        if (!email.contains("@")) {
            return Result.failure(Exception("邮箱格式无效"))
        }
        
        val request = CreateUserRequest(name, email)
        val result = apiClient.createUser(request)
        
        result.onSuccess { user ->
            _users.add(user)
        }
        
        return result
    }
    
    suspend fun getUserById(id: String): Result<User> {
        // 先从本地缓存查找
        val cachedUser = _users.find { it.id == id }
        if (cachedUser != null) {
            return Result.success(cachedUser)
        }
        
        // 从服务器获取
        return apiClient.getUserById(id)
    }
}

// commonMain/kotlin/usecase/UserUseCase.kt
class UserUseCase(private val userRepository: UserRepository) {
    
    suspend fun getUsers(): Result<List<User>> {
        return userRepository.loadUsers()
    }
    
    suspend fun createUser(name: String, email: String): Result<User> {
        return userRepository.createUser(name, email)
    }
    
    suspend fun searchUsers(query: String): List<User> {
        return userRepository.users.filter { user ->
            user.name.contains(query, ignoreCase = true) ||
            user.email.contains(query, ignoreCase = true)
        }
    }
    
    suspend fun getUserById(id: String): Result<User> {
        return userRepository.getUserById(id)
    }
}
```

## 🎯 平台特定实现

### expect/actual 机制
```kotlin
// commonMain/kotlin/platform/Platform.kt
expect class Platform() {
    val name: String
    val version: String
}

expect fun getPlatformInfo(): String

expect class Logger() {
    fun log(message: String)
    fun error(message: String, throwable: Throwable? = null)
}

// androidMain/kotlin/platform/Platform.kt
import android.os.Build
import android.util.Log

actual class Platform {
    actual val name: String = "Android"
    actual val version: String = Build.VERSION.RELEASE
}

actual fun getPlatformInfo(): String {
    return "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
}

actual class Logger {
    actual fun log(message: String) {
        Log.d("KMP", message)
    }
    
    actual fun error(message: String, throwable: Throwable?) {
        Log.e("KMP", message, throwable)
    }
}

// iosMain/kotlin/platform/Platform.kt
import platform.UIKit.UIDevice

actual class Platform {
    actual val name: String = "iOS"
    actual val version: String = UIDevice.currentDevice.systemVersion
}

actual fun getPlatformInfo(): String {
    return "iOS ${UIDevice.currentDevice.systemVersion}"
}

actual class Logger {
    actual fun log(message: String) {
        println("[LOG] $message")
    }
    
    actual fun error(message: String, throwable: Throwable?) {
        println("[ERROR] $message")
        throwable?.printStackTrace()
    }
}

// jsMain/kotlin/platform/Platform.kt
actual class Platform {
    actual val name: String = "JavaScript"
    actual val version: String = "ES2015"
}

actual fun getPlatformInfo(): String {
    return "JavaScript (Browser)"
}

actual class Logger {
    actual fun log(message: String) {
        console.log(message)
    }
    
    actual fun error(message: String, throwable: Throwable?) {
        console.error(message, throwable)
    }
}
```

### 存储抽象
```kotlin
// commonMain/kotlin/storage/Storage.kt
expect class Storage() {
    suspend fun save(key: String, value: String)
    suspend fun load(key: String): String?
    suspend fun remove(key: String)
    suspend fun clear()
}

// androidMain/kotlin/storage/Storage.kt
import android.content.Context
import android.content.SharedPreferences

actual class Storage(private val context: Context) {
    private val prefs: SharedPreferences = 
        context.getSharedPreferences("kmp_storage", Context.MODE_PRIVATE)
    
    actual suspend fun save(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }
    
    actual suspend fun load(key: String): String? {
        return prefs.getString(key, null)
    }
    
    actual suspend fun remove(key: String) {
        prefs.edit().remove(key).apply()
    }
    
    actual suspend fun clear() {
        prefs.edit().clear().apply()
    }
}

// iosMain/kotlin/storage/Storage.kt
import platform.Foundation.NSUserDefaults

actual class Storage {
    private val userDefaults = NSUserDefaults.standardUserDefaults
    
    actual suspend fun save(key: String, value: String) {
        userDefaults.setObject(value, key)
    }
    
    actual suspend fun load(key: String): String? {
        return userDefaults.stringForKey(key)
    }
    
    actual suspend fun remove(key: String) {
        userDefaults.removeObjectForKey(key)
    }
    
    actual suspend fun clear() {
        // iOS 没有直接的清除所有方法，需要遍历删除
        val keys = userDefaults.dictionaryRepresentation().keys
        keys.forEach { key ->
            userDefaults.removeObjectForKey(key as String)
        }
    }
}
```

## 📱 平台集成

### Android 集成
```kotlin
// androidApp/src/main/java/MainActivity.kt
class MainActivity : ComponentActivity() {
    
    private val userUseCase by lazy {
        UserUseCase(
            UserRepository(
                ApiClient("https://api.example.com")
            )
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            MyApplicationTheme {
                UserScreen(userUseCase)
            }
        }
    }
}

@Composable
fun UserScreen(userUseCase: UserUseCase) {
    var users by remember { mutableStateOf<List<User>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    
    LaunchedEffect(Unit) {
        loading = true
        userUseCase.getUsers().onSuccess { userList ->
            users = userList
        }
        loading = false
    }
    
    Column {
        if (loading) {
            CircularProgressIndicator()
        } else {
            LazyColumn {
                items(users) { user ->
                    UserItem(user = user)
                }
            }
        }
    }
}
```

### iOS 集成
```swift
// iosApp/ContentView.swift
import SwiftUI
import shared

struct ContentView: View {
    @StateObject private var viewModel = UserViewModel()
    
    var body: some View {
        NavigationView {
            List(viewModel.users, id: \.id) { user in
                UserRow(user: user)
            }
            .navigationTitle("用户列表")
            .onAppear {
                viewModel.loadUsers()
            }
        }
    }
}

class UserViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    
    private let userUseCase = UserUseCase(
        userRepository: UserRepository(
            apiClient: ApiClient(baseUrl: "https://api.example.com")
        )
    )
    
    func loadUsers() {
        isLoading = true
        
        userUseCase.getUsers { result, error in
            DispatchQueue.main.async {
                self.isLoading = false
                
                if let users = result {
                    self.users = users
                } else if let error = error {
                    print("加载用户失败: \(error)")
                }
            }
        }
    }
}

struct UserRow: View {
    let user: User
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(user.name)
                .font(.headline)
            Text(user.email)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}
```

## 🎯 最佳实践

### 1. 代码组织
```kotlin
// 按功能模块组织代码
shared/src/commonMain/kotlin/
├── data/
│   ├── model/          # 数据模型
│   ├── repository/     # 数据仓库
│   └── network/        # 网络层
├── domain/
│   ├── usecase/        # 业务用例
│   └── entity/         # 业务实体
├── platform/           # 平台抽象
└── utils/              # 工具类
```

### 2. 依赖注入
```kotlin
// commonMain/kotlin/di/CommonModule.kt
class CommonModule {
    
    fun provideApiClient(): ApiClient {
        return ApiClient("https://api.example.com")
    }
    
    fun provideUserRepository(apiClient: ApiClient): UserRepository {
        return UserRepository(apiClient)
    }
    
    fun provideUserUseCase(userRepository: UserRepository): UserUseCase {
        return UserUseCase(userRepository)
    }
}

// 平台特定的依赖注入
// androidMain/kotlin/di/AndroidModule.kt
class AndroidModule(private val context: Context) : CommonModule() {
    
    fun provideStorage(): Storage {
        return Storage(context)
    }
    
    fun provideLogger(): Logger {
        return Logger()
    }
}
```

### 3. 测试策略
```kotlin
// commonTest/kotlin/UserUseCaseTest.kt
class UserUseCaseTest {
    
    private val mockApiClient = MockApiClient()
    private val userRepository = UserRepository(mockApiClient)
    private val userUseCase = UserUseCase(userRepository)
    
    @Test
    fun `should return users when API call succeeds`() = runTest {
        // Given
        val expectedUsers = listOf(
            User("1", "张三", "zhang@example.com", null, Clock.System.now())
        )
        mockApiClient.setUsersResponse(Result.success(expectedUsers))
        
        // When
        val result = userUseCase.getUsers()
        
        // Then
        assertTrue(result.isSuccess)
        assertEquals(expectedUsers, result.getOrNull())
    }
    
    @Test
    fun `should return error when API call fails`() = runTest {
        // Given
        mockApiClient.setUsersResponse(Result.failure(Exception("网络错误")))
        
        // When
        val result = userUseCase.getUsers()
        
        // Then
        assertTrue(result.isFailure)
        assertEquals("网络错误", result.exceptionOrNull()?.message)
    }
}

class MockApiClient : ApiClient("") {
    private var usersResponse: Result<List<User>>? = null
    
    fun setUsersResponse(response: Result<List<User>>) {
        usersResponse = response
    }
    
    override suspend fun getUsers(): Result<List<User>> {
        return usersResponse ?: Result.failure(Exception("未设置响应"))
    }
}
```

### 4. 性能优化
```kotlin
// 使用惰性初始化
class SharedModule {
    val apiClient by lazy { ApiClient("https://api.example.com") }
    val userRepository by lazy { UserRepository(apiClient) }
    val userUseCase by lazy { UserUseCase(userRepository) }
}

// 缓存策略
class CachedUserRepository(
    private val apiClient: ApiClient,
    private val storage: Storage
) : UserRepository {
    
    private val cacheKey = "users_cache"
    private val cacheTimeout = 5 * 60 * 1000L // 5分钟
    
    override suspend fun loadUsers(): Result<List<User>> {
        // 先尝试从缓存加载
        val cachedData = loadFromCache()
        if (cachedData != null) {
            return Result.success(cachedData)
        }
        
        // 从网络加载
        val result = apiClient.getUsers()
        result.onSuccess { users ->
            saveToCache(users)
        }
        
        return result
    }
    
    private suspend fun loadFromCache(): List<User>? {
        // 实现缓存加载逻辑
        return null
    }
    
    private suspend fun saveToCache(users: List<User>) {
        // 实现缓存保存逻辑
    }
}
```

## 🎯 下一步

掌握多平台开发后，您可以继续学习：

1. [开发工具](./tools.md)
2. [部署与运维](./deployment.md)
3. [社区资源](./community.md)

---

*Kotlin Multiplatform 让您能够在多个平台之间共享代码，大大提高开发效率和代码一致性！*
