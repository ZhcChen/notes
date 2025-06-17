# 🔄 Activity 生命周期

本章将深入介绍 Android Activity 的生命周期，这是 Android 开发中最重要的概念之一。

## 🎯 学习目标

- 理解 Activity 生命周期的各个阶段
- 掌握生命周期回调方法的使用
- 学会处理配置变更和状态保存
- 了解 Activity 栈的管理
- 掌握生命周期的最佳实践

## 📱 Activity 简介

Activity 是 Android 应用的基本组件之一，代表用户界面的单个屏幕。每个 Activity 都是一个 Java/Kotlin 类，继承自 `Activity` 或其子类（如 `AppCompatActivity`）。

### Activity 的特点

- **单一职责**: 每个 Activity 负责一个特定的用户界面
- **生命周期管理**: 系统自动管理 Activity 的创建、暂停、恢复和销毁
- **状态保存**: 支持保存和恢复用户界面状态
- **任务栈管理**: 通过任务栈管理 Activity 的导航

## 🔄 生命周期概览

Activity 生命周期包含以下主要状态：

```
Created → Started → Resumed → Paused → Stopped → Destroyed
    ↑                                                    ↓
    ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### 生命周期状态

| 状态 | 描述 | 用户可见 | 可交互 |
|------|------|----------|--------|
| **Created** | Activity 已创建但不可见 | ❌ | ❌ |
| **Started** | Activity 可见但不在前台 | ✅ | ❌ |
| **Resumed** | Activity 在前台且可交互 | ✅ | ✅ |
| **Paused** | Activity 部分被遮挡 | ✅ | ❌ |
| **Stopped** | Activity 完全不可见 | ❌ | ❌ |
| **Destroyed** | Activity 已销毁 | ❌ | ❌ |

## 🎭 生命周期回调方法

### 核心回调方法

```kotlin
class MainActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "MainActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "onCreate called")
        setContentView(R.layout.activity_main)
        
        // 初始化 UI 组件
        initViews()
        
        // 恢复保存的状态
        savedInstanceState?.let {
            restoreInstanceState(it)
        }
    }
    
    override fun onStart() {
        super.onStart()
        Log.d(TAG, "onStart called")
        
        // Activity 变为可见
        // 注册广播接收器
        registerReceivers()
    }
    
    override fun onResume() {
        super.onResume()
        Log.d(TAG, "onResume called")
        
        // Activity 获得焦点，用户可以交互
        // 开始动画、传感器监听等
        startAnimations()
        startLocationUpdates()
    }
    
    override fun onPause() {
        super.onPause()
        Log.d(TAG, "onPause called")
        
        // Activity 失去焦点，但仍可见
        // 暂停动画、传感器监听等
        pauseAnimations()
        stopLocationUpdates()
        
        // 保存用户输入的数据
        saveUserData()
    }
    
    override fun onStop() {
        super.onStop()
        Log.d(TAG, "onStop called")
        
        // Activity 不可见
        // 停止耗时操作
        stopBackgroundTasks()
        
        // 注销广播接收器
        unregisterReceivers()
    }
    
    override fun onRestart() {
        super.onRestart()
        Log.d(TAG, "onRestart called")
        
        // Activity 从 Stopped 状态重新启动
        // 刷新数据
        refreshData()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "onDestroy called")
        
        // Activity 被销毁
        // 释放资源
        releaseResources()
    }
}
```

### 回调方法详解

#### onCreate()
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // 1. 设置布局
    setContentView(R.layout.activity_main)
    
    // 2. 初始化 UI 组件
    val button = findViewById<Button>(R.id.button)
    val textView = findViewById<TextView>(R.id.textView)
    
    // 3. 设置监听器
    button.setOnClickListener {
        textView.text = "Button clicked!"
    }
    
    // 4. 初始化数据
    loadInitialData()
}
```

#### onStart()
```kotlin
override fun onStart() {
    super.onStart()
    
    // 注册广播接收器
    val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
    registerReceiver(batteryReceiver, filter)
    
    // 绑定服务
    bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE)
}
```

#### onResume()
```kotlin
override fun onResume() {
    super.onResume()
    
    // 开始传感器监听
    sensorManager.registerListener(
        sensorListener,
        accelerometer,
        SensorManager.SENSOR_DELAY_NORMAL
    )
    
    // 开始位置更新
    if (hasLocationPermission()) {
        locationManager.requestLocationUpdates(
            LocationManager.GPS_PROVIDER,
            1000L,
            1f,
            locationListener
        )
    }
}
```

#### onPause()
```kotlin
override fun onPause() {
    super.onPause()
    
    // 停止传感器监听
    sensorManager.unregisterListener(sensorListener)
    
    // 停止位置更新
    locationManager.removeUpdates(locationListener)
    
    // 保存用户数据
    val editor = sharedPreferences.edit()
    editor.putString("user_input", editText.text.toString())
    editor.apply()
}
```

#### onStop()
```kotlin
override fun onStop() {
    super.onStop()
    
    // 注销广播接收器
    unregisterReceiver(batteryReceiver)
    
    // 解绑服务
    unbindService(serviceConnection)
    
    // 停止后台任务
    backgroundTask?.cancel()
}
```

#### onDestroy()
```kotlin
override fun onDestroy() {
    super.onDestroy()
    
    // 释放资源
    mediaPlayer?.release()
    database?.close()
    
    // 清理引用
    adapter = null
    viewModel = null
}
```

## 💾 状态保存与恢复

### 保存实例状态

```kotlin
override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    
    // 保存基本数据类型
    outState.putString("user_name", userName)
    outState.putInt("counter", counter)
    outState.putBoolean("is_logged_in", isLoggedIn)
    
    // 保存 Parcelable 对象
    outState.putParcelable("user_data", userData)
    
    // 保存 Serializable 对象
    outState.putSerializable("settings", settings)
    
    // 保存数组
    outState.putStringArray("items", itemsArray)
    
    Log.d(TAG, "Instance state saved")
}
```

### 恢复实例状态

```kotlin
override fun onRestoreInstanceState(savedInstanceState: Bundle) {
    super.onRestoreInstanceState(savedInstanceState)
    
    // 恢复数据
    userName = savedInstanceState.getString("user_name", "")
    counter = savedInstanceState.getInt("counter", 0)
    isLoggedIn = savedInstanceState.getBoolean("is_logged_in", false)
    
    // 恢复对象
    userData = savedInstanceState.getParcelable("user_data")
    settings = savedInstanceState.getSerializable("settings") as? Settings
    
    // 恢复数组
    itemsArray = savedInstanceState.getStringArray("items") ?: emptyArray()
    
    // 更新 UI
    updateUI()
    
    Log.d(TAG, "Instance state restored")
}
```

### 在 onCreate 中恢复状态

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    
    // 检查是否有保存的状态
    if (savedInstanceState != null) {
        // 恢复状态
        userName = savedInstanceState.getString("user_name", "")
        counter = savedInstanceState.getInt("counter", 0)
        
        Log.d(TAG, "Restored from saved state")
    } else {
        // 首次创建，初始化默认值
        userName = ""
        counter = 0
        
        Log.d(TAG, "First time creation")
    }
    
    initViews()
}
```

## 🔄 配置变更处理

### 常见配置变更

- **屏幕旋转**: orientation
- **语言变更**: locale
- **键盘状态**: keyboardHidden
- **屏幕尺寸**: screenSize

### 处理配置变更

#### 方法一：重新创建 Activity（默认）

```kotlin
// 系统会自动调用 onSaveInstanceState 和 onRestoreInstanceState
class MainActivity : AppCompatActivity() {
    
    private var currentData: String = ""
    
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString("current_data", currentData)
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // 恢复数据
        currentData = savedInstanceState?.getString("current_data") ?: ""
    }
}
```

#### 方法二：自己处理配置变更

```xml
<!-- AndroidManifest.xml -->
<activity
    android:name=".MainActivity"
    android:configChanges="orientation|screenSize|keyboardHidden"
    android:exported="true">
</activity>
```

```kotlin
override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    
    when (newConfig.orientation) {
        Configuration.ORIENTATION_LANDSCAPE -> {
            Log.d(TAG, "Switched to landscape")
            // 处理横屏布局
        }
        Configuration.ORIENTATION_PORTRAIT -> {
            Log.d(TAG, "Switched to portrait")
            // 处理竖屏布局
        }
    }
}
```

## 📚 Activity 栈管理

### 任务栈概念

```
Task Stack (后进先出)
┌─────────────────┐
│   Activity C    │ ← 当前 Activity
├─────────────────┤
│   Activity B    │
├─────────────────┤
│   Activity A    │ ← 根 Activity
└─────────────────┘
```

### 启动模式

```xml
<!-- AndroidManifest.xml -->
<activity
    android:name=".MainActivity"
    android:launchMode="singleTop" />
```

#### 启动模式类型

1. **standard** (默认)
   - 每次启动都创建新实例
   
2. **singleTop**
   - 如果 Activity 在栈顶，则复用实例
   
3. **singleTask**
   - 在任务栈中只有一个实例
   
4. **singleInstance**
   - 在整个系统中只有一个实例

### Intent Flags

```kotlin
// 清除栈顶的 Activity
val intent = Intent(this, MainActivity::class.java)
intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP

// 创建新任务
intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK

// 清除任务栈
intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK

startActivity(intent)
```

## 🎯 最佳实践

### 1. 生命周期方法中的操作

```kotlin
class MainActivity : AppCompatActivity() {
    
    // ✅ 在 onCreate 中进行的操作
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // - 设置布局
        // - 初始化 UI 组件
        // - 设置监听器
        // - 初始化 ViewModel
    }
    
    // ✅ 在 onResume 中进行的操作
    override fun onResume() {
        super.onResume()
        // - 开始动画
        // - 注册传感器监听
        // - 开始位置更新
        // - 刷新数据
    }
    
    // ✅ 在 onPause 中进行的操作
    override fun onPause() {
        super.onPause()
        // - 暂停动画
        // - 停止传感器监听
        // - 保存用户数据
        // - 暂停视频播放
    }
    
    // ✅ 在 onDestroy 中进行的操作
    override fun onDestroy() {
        super.onDestroy()
        // - 释放资源
        // - 关闭数据库连接
        // - 取消网络请求
        // - 清理引用
    }
}
```

### 2. 避免内存泄漏

```kotlin
class MainActivity : AppCompatActivity() {
    
    private var handler: Handler? = null
    private var runnable: Runnable? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        handler = Handler(Looper.getMainLooper())
        runnable = Runnable {
            // 延时任务
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // 清理 Handler 回调
        handler?.removeCallbacks(runnable!!)
        handler = null
        runnable = null
    }
}
```

### 3. 使用 ViewModel 管理数据

```kotlin
class MainActivity : AppCompatActivity() {
    
    private lateinit var viewModel: MainViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // 使用 ViewModel 避免配置变更时数据丢失
        viewModel = ViewModelProvider(this)[MainViewModel::class.java]
        
        // 观察数据变化
        viewModel.userData.observe(this) { data ->
            updateUI(data)
        }
    }
}
```

## 🎉 总结

Activity 生命周期是 Android 开发的核心概念：

- ✅ **理解状态**: 掌握各个生命周期状态的含义
- ✅ **正确使用回调**: 在合适的回调方法中执行相应操作
- ✅ **状态保存**: 处理配置变更和状态恢复
- ✅ **资源管理**: 及时释放资源避免内存泄漏
- ✅ **最佳实践**: 遵循 Android 开发规范

掌握 Activity 生命周期将帮助您构建更稳定、高效的 Android 应用。

---

**下一步**: [UI 布局基础](./layouts.md) →
