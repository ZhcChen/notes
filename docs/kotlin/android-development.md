# 📱 Kotlin Android 开发

Kotlin 是 Google 官方推荐的 Android 开发语言，本章将介绍如何使用 Kotlin 进行 Android 应用开发。

## 🎯 学习目标

- 掌握 Kotlin 在 Android 中的应用
- 学会使用 Jetpack Compose 构建 UI
- 了解 Android 架构组件
- 掌握协程在 Android 中的使用

## 🚀 Android 开发环境

### Android Studio 配置
```kotlin
// app/build.gradle.kts
android {
    compileSdk = 34
    
    defaultConfig {
        applicationId = "com.example.myapp"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = "1.8"
    }
    
    buildFeatures {
        compose = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.4"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    
    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    
    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

## 🎨 Jetpack Compose UI

### 基础 Compose
```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun GreetingScreen(name: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Hello, $name!",
            style = MaterialTheme.typography.headlineMedium
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = { /* 处理点击 */ }
        ) {
            Text("点击我")
        }
    }
}
```

### 状态管理
```kotlin
@Composable
fun CounterScreen() {
    var count by remember { mutableStateOf(0) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "计数: $count",
            style = MaterialTheme.typography.headlineLarge
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row {
            Button(onClick = { count-- }) {
                Text("-")
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Button(onClick = { count++ }) {
                Text("+")
            }
        }
    }
}
```

### 列表和导航
```kotlin
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.clickable

data class User(val id: String, val name: String, val email: String)

@Composable
fun UserListScreen(
    users: List<User>,
    onUserClick: (User) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(users) { user ->
            UserItem(
                user = user,
                onClick = { onUserClick(user) }
            )
        }
    }
}

@Composable
fun UserItem(
    user: User,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = user.name,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = user.email,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
```

## 🏗️ MVVM 架构

### ViewModel
```kotlin
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class UiState(
    val users: List<User> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class UserViewModel(
    private val userRepository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    init {
        loadUsers()
    }
    
    fun loadUsers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                val users = userRepository.getUsers()
                _uiState.value = _uiState.value.copy(
                    users = users,
                    isLoading = false,
                    error = null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }
    
    fun refreshUsers() {
        loadUsers()
    }
}
```

### Repository 模式
```kotlin
interface UserRepository {
    suspend fun getUsers(): List<User>
    suspend fun getUserById(id: String): User?
    suspend fun createUser(user: User): User
}

class UserRepositoryImpl(
    private val apiService: ApiService,
    private val userDao: UserDao
) : UserRepository {
    
    override suspend fun getUsers(): List<User> {
        return try {
            // 先尝试从网络获取
            val users = apiService.getUsers()
            // 缓存到本地数据库
            userDao.insertAll(users)
            users
        } catch (e: Exception) {
            // 网络失败时从本地数据库获取
            userDao.getAllUsers()
        }
    }
    
    override suspend fun getUserById(id: String): User? {
        return userDao.getUserById(id) ?: apiService.getUserById(id)
    }
    
    override suspend fun createUser(user: User): User {
        val createdUser = apiService.createUser(user)
        userDao.insert(createdUser)
        return createdUser
    }
}
```

## 🌐 网络请求

### Retrofit 配置
```kotlin
// 依赖配置
implementation("com.squareup.retrofit2:retrofit:2.9.0")
implementation("com.squareup.retrofit2:converter-gson:2.9.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

// API 接口定义
interface ApiService {
    @GET("users")
    suspend fun getUsers(): List<User>
    
    @GET("users/{id}")
    suspend fun getUserById(@Path("id") id: String): User
    
    @POST("users")
    suspend fun createUser(@Body user: User): User
    
    @PUT("users/{id}")
    suspend fun updateUser(@Path("id") id: String, @Body user: User): User
    
    @DELETE("users/{id}")
    suspend fun deleteUser(@Path("id") id: String)
}

// Retrofit 实例
object NetworkModule {
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()
    
    val apiService: ApiService = Retrofit.Builder()
        .baseUrl("https://api.example.com/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(ApiService::class.java)
}
```

### 网络状态处理
```kotlin
sealed class NetworkResult<T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error<T>(val message: String) : NetworkResult<T>()
    class Loading<T> : NetworkResult<T>()
}

class NetworkRepository {
    suspend fun <T> safeApiCall(
        apiCall: suspend () -> T
    ): NetworkResult<T> {
        return try {
            NetworkResult.Success(apiCall())
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "未知错误")
        }
    }
}

// 在 ViewModel 中使用
class UserViewModel(
    private val repository: NetworkRepository
) : ViewModel() {
    
    fun loadUsers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            when (val result = repository.safeApiCall { apiService.getUsers() }) {
                is NetworkResult.Success -> {
                    _uiState.value = _uiState.value.copy(
                        users = result.data,
                        isLoading = false,
                        error = null
                    )
                }
                is NetworkResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                is NetworkResult.Loading -> {
                    // 处理加载状态
                }
            }
        }
    }
}
```

## 💾 本地数据存储

### Room 数据库
```kotlin
// 依赖配置
implementation("androidx.room:room-runtime:2.6.1")
implementation("androidx.room:room-ktx:2.6.1")
kapt("androidx.room:room-compiler:2.6.1")

// Entity
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String,
    val createdAt: Long = System.currentTimeMillis()
)

// DAO
@Dao
interface UserDao {
    @Query("SELECT * FROM users")
    suspend fun getAllUsers(): List<UserEntity>
    
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getUserById(id: String): UserEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(users: List<UserEntity>)
    
    @Delete
    suspend fun delete(user: UserEntity)
    
    @Query("DELETE FROM users")
    suspend fun deleteAll()
}

// Database
@Database(
    entities = [UserEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
```

### SharedPreferences
```kotlin
class PreferencesManager(context: Context) {
    private val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
    
    var userId: String?
        get() = prefs.getString("user_id", null)
        set(value) = prefs.edit().putString("user_id", value).apply()
    
    var isFirstLaunch: Boolean
        get() = prefs.getBoolean("is_first_launch", true)
        set(value) = prefs.edit().putBoolean("is_first_launch", value).apply()
    
    var theme: String
        get() = prefs.getString("theme", "system") ?: "system"
        set(value) = prefs.edit().putString("theme", value).apply()
    
    fun clear() {
        prefs.edit().clear().apply()
    }
}
```

## ⚡ 协程在 Android 中的应用

### 生命周期感知的协程
```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 使用 lifecycleScope
        lifecycleScope.launch {
            // 在 Activity 生命周期内执行
            val data = loadData()
            updateUI(data)
        }
        
        // 使用 repeatOnLifecycle
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    // 只在 STARTED 状态时收集
                    updateUI(state)
                }
            }
        }
    }
    
    private suspend fun loadData(): String {
        return withContext(Dispatchers.IO) {
            // IO 操作
            "数据"
        }
    }
    
    private fun updateUI(data: Any) {
        // 更新 UI
    }
}
```

### ViewModel 中的协程
```kotlin
class UserViewModel : ViewModel() {
    private val _users = MutableLiveData<List<User>>()
    val users: LiveData<List<User>> = _users
    
    fun loadUsers() {
        viewModelScope.launch {
            try {
                val userList = withContext(Dispatchers.IO) {
                    userRepository.getUsers()
                }
                _users.value = userList
            } catch (e: Exception) {
                // 处理错误
            }
        }
    }
    
    // 自动取消的协程
    fun startPeriodicUpdate() {
        viewModelScope.launch {
            while (true) {
                delay(30000) // 30秒
                loadUsers()
            }
        }
    }
}
```

## 🧪 Android 测试

### 单元测试
```kotlin
// 测试依赖
testImplementation("junit:junit:4.13.2")
testImplementation("org.mockito:mockito-core:5.1.1")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
testImplementation("androidx.arch.core:core-testing:2.2.0")

@RunWith(MockitoJUnitRunner::class)
class UserViewModelTest {
    
    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()
    
    @Mock
    private lateinit var userRepository: UserRepository
    
    private lateinit var viewModel: UserViewModel
    
    @Before
    fun setup() {
        viewModel = UserViewModel(userRepository)
    }
    
    @Test
    fun `loadUsers should update uiState with users`() = runTest {
        // Given
        val expectedUsers = listOf(
            User("1", "张三", "zhang@example.com"),
            User("2", "李四", "li@example.com")
        )
        `when`(userRepository.getUsers()).thenReturn(expectedUsers)
        
        // When
        viewModel.loadUsers()
        
        // Then
        val uiState = viewModel.uiState.value
        assertEquals(expectedUsers, uiState.users)
        assertEquals(false, uiState.isLoading)
        assertEquals(null, uiState.error)
    }
}
```

### UI 测试
```kotlin
// UI 测试依赖
androidTestImplementation("androidx.compose.ui:ui-test-junit4")
androidTestImplementation("androidx.test.ext:junit:1.1.5")
androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")

@RunWith(AndroidJUnit4::class)
class UserListScreenTest {
    
    @get:Rule
    val composeTestRule = createComposeRule()
    
    @Test
    fun userListScreen_displaysUsers() {
        val users = listOf(
            User("1", "张三", "zhang@example.com"),
            User("2", "李四", "li@example.com")
        )
        
        composeTestRule.setContent {
            UserListScreen(
                users = users,
                onUserClick = { }
            )
        }
        
        // 验证用户显示
        composeTestRule.onNodeWithText("张三").assertIsDisplayed()
        composeTestRule.onNodeWithText("李四").assertIsDisplayed()
        composeTestRule.onNodeWithText("zhang@example.com").assertIsDisplayed()
    }
    
    @Test
    fun userListScreen_clickUser_triggersCallback() {
        var clickedUser: User? = null
        val users = listOf(User("1", "张三", "zhang@example.com"))
        
        composeTestRule.setContent {
            UserListScreen(
                users = users,
                onUserClick = { clickedUser = it }
            )
        }
        
        composeTestRule.onNodeWithText("张三").performClick()
        
        assertEquals(users[0], clickedUser)
    }
}
```

## 🎯 实践项目：待办事项应用

### 数据模型
```kotlin
@Entity(tableName = "todos")
data class Todo(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val title: String,
    val description: String = "",
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val dueDate: Long? = null
)

enum class TodoFilter {
    ALL, ACTIVE, COMPLETED
}
```

### ViewModel
```kotlin
class TodoViewModel(
    private val todoRepository: TodoRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TodoUiState())
    val uiState: StateFlow<TodoUiState> = _uiState.asStateFlow()
    
    private val _filter = MutableStateFlow(TodoFilter.ALL)
    
    init {
        viewModelScope.launch {
            combine(
                todoRepository.getAllTodos(),
                _filter
            ) { todos, filter ->
                val filteredTodos = when (filter) {
                    TodoFilter.ALL -> todos
                    TodoFilter.ACTIVE -> todos.filter { !it.isCompleted }
                    TodoFilter.COMPLETED -> todos.filter { it.isCompleted }
                }
                _uiState.value = _uiState.value.copy(
                    todos = filteredTodos,
                    filter = filter
                )
            }.collect()
        }
    }
    
    fun addTodo(title: String, description: String) {
        viewModelScope.launch {
            val todo = Todo(title = title, description = description)
            todoRepository.insertTodo(todo)
        }
    }
    
    fun toggleTodo(todo: Todo) {
        viewModelScope.launch {
            todoRepository.updateTodo(todo.copy(isCompleted = !todo.isCompleted))
        }
    }
    
    fun deleteTodo(todo: Todo) {
        viewModelScope.launch {
            todoRepository.deleteTodo(todo)
        }
    }
    
    fun setFilter(filter: TodoFilter) {
        _filter.value = filter
    }
}

data class TodoUiState(
    val todos: List<Todo> = emptyList(),
    val filter: TodoFilter = TodoFilter.ALL,
    val isLoading: Boolean = false
)
```

## 🎯 下一步

掌握 Android 开发后，您可以继续学习：

1. [多平台开发](./multiplatform.md)
2. [性能优化](./performance.md)
3. [Web 开发](./web-development.md)

---

*Kotlin 让 Android 开发变得更加简洁和安全，继续探索更多高级特性吧！*
