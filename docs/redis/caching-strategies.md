# Redis 缓存策略

缓存策略是使用 Redis 作为缓存系统时的核心考虑因素，合理的缓存策略能够显著提升应用性能，减少数据库压力，改善用户体验。

## 🎯 缓存策略概述

### 什么是缓存策略？
缓存策略是指在应用程序中如何使用缓存来存储和管理数据的方法和规则，包括数据的读取、写入、更新和失效处理。

### 缓存的价值
- **提升性能**：减少数据库查询，提高响应速度
- **降低负载**：减轻数据库和后端服务压力
- **改善体验**：为用户提供更快的响应时间
- **节约成本**：减少昂贵的计算和I/O操作

### 缓存挑战
- **数据一致性**：缓存与数据源的数据同步
- **缓存穿透**：查询不存在的数据绕过缓存
- **缓存雪崩**：大量缓存同时失效
- **缓存击穿**：热点数据失效导致大量请求

## 📋 常见缓存模式

### 1. Cache-Aside（旁路缓存）
最常用的缓存模式，应用程序直接管理缓存。

```python
def get_user(user_id):
    # 1. 先查缓存
    cache_key = f"user:{user_id}"
    user = redis_client.get(cache_key)
    
    if user:
        return json.loads(user)  # 缓存命中
    
    # 2. 缓存未命中，查询数据库
    user = database.get_user(user_id)
    if user:
        # 3. 将数据写入缓存
        redis_client.setex(cache_key, 3600, json.dumps(user))
    
    return user

def update_user(user_id, user_data):
    # 1. 更新数据库
    database.update_user(user_id, user_data)
    
    # 2. 删除缓存（让下次读取时重新加载）
    cache_key = f"user:{user_id}"
    redis_client.delete(cache_key)
```

**优点**：
- 应用程序完全控制缓存逻辑
- 缓存故障不影响数据读取
- 适用于读多写少的场景

**缺点**：
- 需要应用程序管理缓存逻辑
- 可能出现缓存和数据库不一致

### 2. Read-Through（读穿透）
缓存层自动加载数据。

```python
class ReadThroughCache:
    def __init__(self, redis_client, database):
        self.redis = redis_client
        self.db = database
    
    def get(self, key, loader_func, ttl=3600):
        # 尝试从缓存获取
        value = self.redis.get(key)
        if value:
            return json.loads(value)
        
        # 缓存未命中，使用加载器函数获取数据
        value = loader_func()
        if value:
            self.redis.setex(key, ttl, json.dumps(value))
        
        return value

# 使用示例
cache = ReadThroughCache(redis_client, database)

def get_user(user_id):
    return cache.get(
        f"user:{user_id}",
        lambda: database.get_user(user_id),
        ttl=3600
    )
```

### 3. Write-Through（写穿透）
写操作同时更新缓存和数据库。

```python
def update_user_write_through(user_id, user_data):
    # 1. 同时更新数据库和缓存
    database.update_user(user_id, user_data)
    
    cache_key = f"user:{user_id}"
    redis_client.setex(cache_key, 3600, json.dumps(user_data))
    
    return user_data
```

### 4. Write-Behind（写回）
先写缓存，异步写数据库。

```python
import asyncio
from queue import Queue

class WriteBehindCache:
    def __init__(self, redis_client, database):
        self.redis = redis_client
        self.db = database
        self.write_queue = Queue()
        self.start_background_writer()
    
    def set(self, key, value, ttl=3600):
        # 1. 立即写入缓存
        self.redis.setex(key, ttl, json.dumps(value))
        
        # 2. 加入写队列，异步写数据库
        self.write_queue.put((key, value))
    
    def start_background_writer(self):
        def background_writer():
            while True:
                try:
                    key, value = self.write_queue.get(timeout=1)
                    # 异步写入数据库
                    self.db.update(key, value)
                except:
                    continue
        
        import threading
        thread = threading.Thread(target=background_writer, daemon=True)
        thread.start()
```

## 🛡️ 缓存问题解决方案

### 1. 缓存穿透
查询不存在的数据，导致每次都查询数据库。

```python
def get_user_with_null_cache(user_id):
    cache_key = f"user:{user_id}"
    
    # 检查缓存
    cached_value = redis_client.get(cache_key)
    if cached_value is not None:
        if cached_value == "NULL":
            return None  # 缓存的空值
        return json.loads(cached_value)
    
    # 查询数据库
    user = database.get_user(user_id)
    
    if user:
        # 缓存真实数据
        redis_client.setex(cache_key, 3600, json.dumps(user))
    else:
        # 缓存空值，防止穿透
        redis_client.setex(cache_key, 300, "NULL")  # 较短的过期时间
    
    return user

# 布隆过滤器解决方案
import pybloom_live

class BloomFilterCache:
    def __init__(self, redis_client, database):
        self.redis = redis_client
        self.db = database
        self.bloom_filter = pybloom_live.BloomFilter(capacity=1000000, error_rate=0.1)
        self.init_bloom_filter()
    
    def init_bloom_filter(self):
        # 将所有存在的用户ID加入布隆过滤器
        existing_users = self.db.get_all_user_ids()
        for user_id in existing_users:
            self.bloom_filter.add(str(user_id))
    
    def get_user(self, user_id):
        # 先检查布隆过滤器
        if str(user_id) not in self.bloom_filter:
            return None  # 肯定不存在
        
        # 可能存在，继续正常的缓存逻辑
        return get_user_with_null_cache(user_id)
```

### 2. 缓存雪崩
大量缓存同时失效，导致数据库压力激增。

```python
import random

def set_cache_with_random_ttl(key, value, base_ttl=3600):
    # 添加随机时间，避免同时过期
    random_ttl = base_ttl + random.randint(0, 300)  # 0-5分钟的随机时间
    redis_client.setex(key, random_ttl, json.dumps(value))

def get_user_with_avalanche_protection(user_id):
    cache_key = f"user:{user_id}"
    
    user = redis_client.get(cache_key)
    if user:
        return json.loads(user)
    
    # 使用分布式锁防止缓存击穿
    lock_key = f"lock:user:{user_id}"
    if redis_client.set(lock_key, "1", nx=True, ex=10):
        try:
            # 获得锁，查询数据库
            user = database.get_user(user_id)
            if user:
                set_cache_with_random_ttl(cache_key, user)
            return user
        finally:
            redis_client.delete(lock_key)
    else:
        # 未获得锁，等待一下再重试
        import time
        time.sleep(0.1)
        return get_user_with_avalanche_protection(user_id)
```

### 3. 缓存击穿
热点数据失效，大量并发请求直接访问数据库。

```python
import threading

class HotKeyCache:
    def __init__(self, redis_client, database):
        self.redis = redis_client
        self.db = database
        self.local_locks = {}
        self.lock = threading.Lock()
    
    def get_hot_data(self, key, loader_func, ttl=3600):
        # 检查缓存
        value = self.redis.get(key)
        if value:
            return json.loads(value)
        
        # 获取本地锁
        with self.lock:
            if key not in self.local_locks:
                self.local_locks[key] = threading.Lock()
            local_lock = self.local_locks[key]
        
        with local_lock:
            # 双重检查
            value = self.redis.get(key)
            if value:
                return json.loads(value)
            
            # 加载数据
            data = loader_func()
            if data:
                self.redis.setex(key, ttl, json.dumps(data))
            
            return data

# 使用示例
hot_cache = HotKeyCache(redis_client, database)

def get_hot_product(product_id):
    return hot_cache.get_hot_data(
        f"product:{product_id}",
        lambda: database.get_product(product_id)
    )
```

## 🔄 缓存更新策略

### 1. TTL（Time To Live）过期
```python
def cache_with_ttl(key, value, ttl_seconds):
    redis_client.setex(key, ttl_seconds, json.dumps(value))

# 不同类型数据的TTL设置
CACHE_TTL = {
    'user_profile': 3600,      # 1小时
    'product_info': 1800,      # 30分钟
    'hot_data': 300,           # 5分钟
    'static_config': 86400,    # 24小时
}
```

### 2. 主动更新
```python
def update_user_profile(user_id, profile_data):
    # 1. 更新数据库
    database.update_user_profile(user_id, profile_data)
    
    # 2. 更新缓存
    cache_key = f"user:profile:{user_id}"
    redis_client.setex(cache_key, CACHE_TTL['user_profile'], json.dumps(profile_data))
    
    # 3. 通知其他相关缓存更新
    invalidate_related_cache(user_id)

def invalidate_related_cache(user_id):
    # 删除相关的缓存
    related_keys = [
        f"user:summary:{user_id}",
        f"user:permissions:{user_id}",
        f"user:preferences:{user_id}"
    ]
    redis_client.delete(*related_keys)
```

### 3. 版本控制
```python
def versioned_cache_set(key, value, version, ttl=3600):
    versioned_key = f"{key}:v{version}"
    redis_client.setex(versioned_key, ttl, json.dumps(value))
    redis_client.setex(f"{key}:version", ttl, str(version))

def versioned_cache_get(key):
    version = redis_client.get(f"{key}:version")
    if not version:
        return None
    
    versioned_key = f"{key}:v{version.decode()}"
    value = redis_client.get(versioned_key)
    return json.loads(value) if value else None
```

## 📊 缓存监控

### 1. 缓存命中率监控
```python
class CacheMetrics:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def record_hit(self, cache_type):
        self.redis.incr(f"cache:hit:{cache_type}")
        self.redis.incr(f"cache:hit:total")
    
    def record_miss(self, cache_type):
        self.redis.incr(f"cache:miss:{cache_type}")
        self.redis.incr(f"cache:miss:total")
    
    def get_hit_rate(self, cache_type=None):
        if cache_type:
            hits = int(self.redis.get(f"cache:hit:{cache_type}") or 0)
            misses = int(self.redis.get(f"cache:miss:{cache_type}") or 0)
        else:
            hits = int(self.redis.get("cache:hit:total") or 0)
            misses = int(self.redis.get("cache:miss:total") or 0)
        
        total = hits + misses
        return hits / total if total > 0 else 0

# 使用示例
metrics = CacheMetrics(redis_client)

def monitored_cache_get(key, cache_type="default"):
    value = redis_client.get(key)
    if value:
        metrics.record_hit(cache_type)
        return json.loads(value)
    else:
        metrics.record_miss(cache_type)
        return None
```

### 2. 缓存性能监控
```python
import time
import functools

def cache_performance_monitor(cache_type):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            
            # 记录响应时间
            response_time = (end_time - start_time) * 1000  # 毫秒
            redis_client.lpush(f"cache:response_time:{cache_type}", response_time)
            redis_client.ltrim(f"cache:response_time:{cache_type}", 0, 999)  # 保留最近1000条
            
            return result
        return wrapper
    return decorator

@cache_performance_monitor("user_cache")
def get_user_with_monitoring(user_id):
    return get_user(user_id)
```

## 🛡️ 最佳实践

### 1. 缓存键设计
```python
# 使用有意义的命名空间
CACHE_KEYS = {
    'user_profile': 'user:profile:{user_id}',
    'product_detail': 'product:detail:{product_id}',
    'category_list': 'category:list:{parent_id}',
    'search_result': 'search:{query_hash}:{page}',
}

def build_cache_key(template, **kwargs):
    return template.format(**kwargs)

# 使用示例
user_key = build_cache_key(CACHE_KEYS['user_profile'], user_id=1001)
```

### 2. 缓存分层
```python
class LayeredCache:
    def __init__(self, l1_cache, l2_cache):
        self.l1 = l1_cache  # 本地缓存（如内存）
        self.l2 = l2_cache  # 分布式缓存（Redis）
    
    def get(self, key):
        # L1 缓存
        value = self.l1.get(key)
        if value:
            return value
        
        # L2 缓存
        value = self.l2.get(key)
        if value:
            self.l1.set(key, value, ttl=300)  # 在L1缓存5分钟
            return value
        
        return None
    
    def set(self, key, value, ttl=3600):
        self.l1.set(key, value, ttl=min(ttl, 300))
        self.l2.set(key, value, ttl=ttl)
```

### 3. 缓存预热
```python
def cache_warmup():
    """缓存预热"""
    # 预加载热点数据
    hot_products = database.get_hot_products(limit=100)
    for product in hot_products:
        cache_key = f"product:detail:{product['id']}"
        redis_client.setex(cache_key, 3600, json.dumps(product))
    
    # 预加载用户数据
    active_users = database.get_active_users(limit=1000)
    for user in active_users:
        cache_key = f"user:profile:{user['id']}"
        redis_client.setex(cache_key, 3600, json.dumps(user))

def scheduled_cache_refresh():
    """定时缓存刷新"""
    import schedule
    
    schedule.every(1).hours.do(cache_warmup)
    schedule.every(30).minutes.do(refresh_hot_data)
```

### 4. 缓存容量管理
```python
def cache_cleanup():
    """缓存清理"""
    # 清理过期的临时缓存
    temp_keys = redis_client.keys("temp:*")
    if temp_keys:
        redis_client.delete(*temp_keys)
    
    # 清理长时间未访问的缓存
    old_keys = redis_client.keys("cache:*")
    for key in old_keys:
        idle_time = redis_client.object("idletime", key)
        if idle_time and idle_time > 86400:  # 24小时未访问
            redis_client.delete(key)

# 设置内存淘汰策略
# redis.conf:
# maxmemory 2gb
# maxmemory-policy allkeys-lru
```

---

*合理的缓存策略是高性能应用的关键，需要根据具体业务场景选择合适的缓存模式和解决方案！*
