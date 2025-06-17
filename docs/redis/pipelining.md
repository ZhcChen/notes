# Redis 管道（Pipelining）

Redis 管道是一种优化技术，允许客户端一次性发送多个命令到服务器，然后一次性读取所有响应，大大减少网络往返时间，提高性能。

## 🎯 管道概述

### 什么是 Redis 管道？
管道是一种网络优化技术，允许客户端在不等待服务器响应的情况下发送多个命令，然后批量接收所有响应。

### 工作原理
```bash
# 普通模式（每个命令都需要等待响应）
客户端: SET key1 value1 -> 服务器
客户端: <- OK              服务器
客户端: SET key2 value2 -> 服务器  
客户端: <- OK              服务器
客户端: GET key1        -> 服务器
客户端: <- value1          服务器

# 管道模式（批量发送，批量接收）
客户端: SET key1 value1 -> 服务器
客户端: SET key2 value2 -> 服务器
客户端: GET key1        -> 服务器
客户端: <- OK              服务器
客户端: <- OK              服务器
客户端: <- value1          服务器
```

### 核心优势
- **减少网络延迟**：减少客户端与服务器间的往返次数
- **提高吞吐量**：批量处理命令，提高整体性能
- **保持原子性**：每个命令仍然是原子执行的
- **简单易用**：大多数 Redis 客户端都支持管道

### 适用场景
- 批量数据操作
- 初始化数据
- 批量查询
- 性能敏感的应用

## 📝 基本使用

### 命令行管道
```bash
# 使用 redis-cli 的管道功能
echo -e "SET key1 value1\nSET key2 value2\nGET key1\nGET key2" | redis-cli --pipe

# 从文件读取命令
cat commands.txt | redis-cli --pipe

# commands.txt 内容示例：
SET user:1001 "张三"
SET user:1002 "李四"
HSET user:1001:profile name "张三" age 25
HSET user:1002:profile name "李四" age 30
INCR stats:total_users
INCR stats:total_users
```

### 性能对比
```bash
# 测试普通模式性能
time for i in {1..1000}; do redis-cli SET key$i value$i; done

# 测试管道模式性能
time for i in {1..1000}; do echo "SET key$i value$i"; done | redis-cli --pipe

# 管道模式通常比普通模式快 5-10 倍
```

## 🔧 客户端实现

### Python 实现
```python
import redis
import time

# 连接 Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# 普通模式
def normal_operations():
    start_time = time.time()
    
    for i in range(1000):
        r.set(f'key:{i}', f'value:{i}')
        r.get(f'key:{i}')
    
    end_time = time.time()
    print(f"普通模式耗时: {end_time - start_time:.2f} 秒")

# 管道模式
def pipeline_operations():
    start_time = time.time()
    
    pipe = r.pipeline()
    for i in range(1000):
        pipe.set(f'key:{i}', f'value:{i}')
        pipe.get(f'key:{i}')
    
    results = pipe.execute()
    
    end_time = time.time()
    print(f"管道模式耗时: {end_time - start_time:.2f} 秒")
    print(f"返回结果数量: {len(results)}")

# 批量操作示例
def batch_user_creation():
    users = [
        {'id': 1001, 'name': '张三', 'email': 'zhangsan@example.com'},
        {'id': 1002, 'name': '李四', 'email': 'lisi@example.com'},
        {'id': 1003, 'name': '王五', 'email': 'wangwu@example.com'},
    ]
    
    pipe = r.pipeline()
    
    for user in users:
        # 设置用户基本信息
        pipe.hset(f"user:{user['id']}", mapping={
            'name': user['name'],
            'email': user['email']
        })
        
        # 添加到用户集合
        pipe.sadd('users:all', user['id'])
        
        # 增加用户计数
        pipe.incr('stats:total_users')
    
    results = pipe.execute()
    print(f"批量创建用户完成，执行了 {len(results)} 个命令")
```

### Node.js 实现
```javascript
const redis = require('redis');
const client = redis.createClient();

// 普通模式
async function normalOperations() {
    const start = Date.now();
    
    for (let i = 0; i < 1000; i++) {
        await client.set(`key:${i}`, `value:${i}`);
        await client.get(`key:${i}`);
    }
    
    const end = Date.now();
    console.log(`普通模式耗时: ${end - start} 毫秒`);
}

// 管道模式
async function pipelineOperations() {
    const start = Date.now();
    
    const pipeline = client.multi();
    
    for (let i = 0; i < 1000; i++) {
        pipeline.set(`key:${i}`, `value:${i}`);
        pipeline.get(`key:${i}`);
    }
    
    const results = await pipeline.exec();
    
    const end = Date.now();
    console.log(`管道模式耗时: ${end - start} 毫秒`);
    console.log(`返回结果数量: ${results.length}`);
}

// 批量数据处理
async function batchDataProcessing() {
    const pipeline = client.multi();
    
    // 批量设置用户数据
    const users = [
        {id: 1001, name: '张三', score: 100},
        {id: 1002, name: '李四', score: 200},
        {id: 1003, name: '王五', score: 150}
    ];
    
    users.forEach(user => {
        pipeline.hSet(`user:${user.id}`, {
            name: user.name,
            score: user.score
        });
        pipeline.zAdd('leaderboard', {
            score: user.score,
            value: user.id
        });
    });
    
    const results = await pipeline.exec();
    console.log('批量数据处理完成');
}
```

### Java 实现
```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Pipeline;

public class RedisPipelineExample {
    
    public static void main(String[] args) {
        Jedis jedis = new Jedis("localhost", 6379);
        
        // 普通模式
        normalOperations(jedis);
        
        // 管道模式
        pipelineOperations(jedis);
        
        jedis.close();
    }
    
    // 普通模式
    public static void normalOperations(Jedis jedis) {
        long start = System.currentTimeMillis();
        
        for (int i = 0; i < 1000; i++) {
            jedis.set("key:" + i, "value:" + i);
            jedis.get("key:" + i);
        }
        
        long end = System.currentTimeMillis();
        System.out.println("普通模式耗时: " + (end - start) + " 毫秒");
    }
    
    // 管道模式
    public static void pipelineOperations(Jedis jedis) {
        long start = System.currentTimeMillis();
        
        Pipeline pipeline = jedis.pipelined();
        
        for (int i = 0; i < 1000; i++) {
            pipeline.set("key:" + i, "value:" + i);
            pipeline.get("key:" + i);
        }
        
        List<Object> results = pipeline.syncAndReturnAll();
        
        long end = System.currentTimeMillis();
        System.out.println("管道模式耗时: " + (end - start) + " 毫秒");
        System.out.println("返回结果数量: " + results.size());
    }
}
```

## 🎯 应用场景

### 1. 批量数据导入
```python
def import_products(products):
    """批量导入商品数据"""
    pipe = r.pipeline()
    
    for product in products:
        # 设置商品基本信息
        pipe.hset(f"product:{product['id']}", mapping={
            'name': product['name'],
            'price': product['price'],
            'category': product['category'],
            'stock': product['stock']
        })
        
        # 添加到分类集合
        pipe.sadd(f"category:{product['category']}", product['id'])
        
        # 添加到价格排序集合
        pipe.zadd('products:by_price', {product['id']: product['price']})
        
        # 更新统计
        pipe.incr('stats:total_products')
        pipe.incrby('stats:total_value', product['price'] * product['stock'])
    
    results = pipe.execute()
    return len(results)
```

### 2. 批量缓存预热
```python
def cache_warmup(user_ids):
    """批量预热用户缓存"""
    pipe = r.pipeline()
    
    for user_id in user_ids:
        # 从数据库获取用户数据（这里模拟）
        user_data = get_user_from_db(user_id)
        
        if user_data:
            # 缓存用户基本信息
            pipe.setex(f"cache:user:{user_id}", 3600, 
                      json.dumps(user_data))
            
            # 缓存用户权限
            pipe.setex(f"cache:permissions:{user_id}", 1800,
                      json.dumps(user_data['permissions']))
            
            # 记录缓存时间
            pipe.hset(f"cache:meta:{user_id}", 
                     'cached_at', int(time.time()))
    
    pipe.execute()
```

### 3. 批量统计更新
```python
def update_daily_stats(events):
    """批量更新每日统计"""
    pipe = r.pipeline()
    today = datetime.now().strftime('%Y-%m-%d')
    
    for event in events:
        # 更新用户活跃度
        pipe.sadd(f"active_users:{today}", event['user_id'])
        
        # 更新事件计数
        pipe.incr(f"events:{event['type']}:{today}")
        
        # 更新小时统计
        hour = datetime.now().strftime('%Y-%m-%d:%H')
        pipe.incr(f"events:hourly:{hour}")
        
        # 更新用户行为
        pipe.lpush(f"user_events:{event['user_id']}", 
                  json.dumps(event))
        pipe.ltrim(f"user_events:{event['user_id']}", 0, 99)  # 保留最近100条
    
    pipe.execute()
```

### 4. 批量清理过期数据
```python
def cleanup_expired_data():
    """批量清理过期数据"""
    pipe = r.pipeline()
    
    # 获取需要清理的键
    expired_sessions = r.keys('session:*')
    expired_cache = r.keys('cache:temp:*')
    
    for key in expired_sessions:
        # 检查是否过期
        ttl = r.ttl(key)
        if ttl == -1:  # 没有设置过期时间的旧数据
            pipe.delete(key)
    
    for key in expired_cache:
        # 清理临时缓存
        pipe.delete(key)
    
    # 清理过期的排行榜数据
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    pipe.delete(f"leaderboard:daily:{yesterday}")
    
    results = pipe.execute()
    return sum(1 for result in results if result)
```

## 📊 性能优化

### 管道大小优化
```python
def optimized_batch_operation(data, batch_size=100):
    """优化的批量操作，控制管道大小"""
    total_processed = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        pipe = r.pipeline()
        
        for item in batch:
            pipe.set(f"key:{item['id']}", item['value'])
            pipe.expire(f"key:{item['id']}", 3600)
        
        pipe.execute()
        total_processed += len(batch)
        
        # 可选：添加进度报告
        if total_processed % 1000 == 0:
            print(f"已处理 {total_processed} 条记录")
    
    return total_processed
```

### 错误处理
```python
def robust_pipeline_operation(operations):
    """带错误处理的管道操作"""
    pipe = r.pipeline()
    
    try:
        for operation in operations:
            if operation['type'] == 'set':
                pipe.set(operation['key'], operation['value'])
            elif operation['type'] == 'incr':
                pipe.incr(operation['key'])
            elif operation['type'] == 'sadd':
                pipe.sadd(operation['key'], *operation['members'])
        
        results = pipe.execute()
        return {'success': True, 'results': results}
        
    except redis.RedisError as e:
        return {'success': False, 'error': str(e)}
    except Exception as e:
        return {'success': False, 'error': f"Unexpected error: {str(e)}"}
```

## ⚠️ 注意事项

### 内存使用
```python
# 管道会在客户端缓存命令，大量命令会占用内存
# 建议控制管道大小
MAX_PIPELINE_SIZE = 1000

def safe_pipeline_operation(commands):
    results = []
    
    for i in range(0, len(commands), MAX_PIPELINE_SIZE):
        batch = commands[i:i + MAX_PIPELINE_SIZE]
        pipe = r.pipeline()
        
        for cmd in batch:
            getattr(pipe, cmd['method'])(*cmd['args'])
        
        batch_results = pipe.execute()
        results.extend(batch_results)
    
    return results
```

### 事务性考虑
```python
# 管道不保证事务性，如果需要事务，使用 MULTI/EXEC
def transactional_pipeline():
    pipe = r.pipeline(transaction=True)  # 启用事务模式
    
    pipe.multi()  # 开始事务
    pipe.set('key1', 'value1')
    pipe.incr('counter')
    pipe.set('key2', 'value2')
    
    try:
        results = pipe.execute()  # 原子执行
        return results
    except redis.WatchError:
        return None  # 事务被中断
```

## 🛡️ 最佳实践

### 1. 合理控制管道大小
```python
# 推荐的管道大小范围：100-1000 个命令
OPTIMAL_PIPELINE_SIZE = 500

def batch_process(items):
    for i in range(0, len(items), OPTIMAL_PIPELINE_SIZE):
        batch = items[i:i + OPTIMAL_PIPELINE_SIZE]
        process_batch(batch)
```

### 2. 监控和日志
```python
import logging

def monitored_pipeline_operation(operations):
    start_time = time.time()
    pipe = r.pipeline()
    
    for op in operations:
        pipe.set(op['key'], op['value'])
    
    results = pipe.execute()
    
    execution_time = time.time() - start_time
    logging.info(f"管道执行完成: {len(operations)} 个命令, "
                f"耗时: {execution_time:.3f} 秒")
    
    return results
```

### 3. 错误恢复
```python
def resilient_pipeline_operation(operations, max_retries=3):
    for attempt in range(max_retries):
        try:
            pipe = r.pipeline()
            for op in operations:
                getattr(pipe, op['method'])(*op['args'])
            
            return pipe.execute()
            
        except redis.ConnectionError:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # 指数退避
```

### 4. 性能监控
```python
def performance_aware_pipeline(operations):
    if len(operations) > 10000:
        logging.warning(f"大型管道操作: {len(operations)} 个命令")
    
    start_memory = psutil.Process().memory_info().rss
    start_time = time.time()
    
    # 执行管道操作
    results = execute_pipeline(operations)
    
    end_time = time.time()
    end_memory = psutil.Process().memory_info().rss
    
    logging.info(f"管道性能统计: "
                f"命令数: {len(operations)}, "
                f"耗时: {end_time - start_time:.3f}s, "
                f"内存增长: {(end_memory - start_memory) / 1024 / 1024:.2f}MB")
    
    return results
```

---

*Redis 管道是提高批量操作性能的重要工具，合理使用可以显著提升应用性能，但需要注意内存使用和错误处理！*
