# Redis 发布订阅

Redis 发布订阅（Pub/Sub）是一种消息通信模式，发送者（发布者）发送消息，接收者（订阅者）接收消息，实现了消息的解耦传输。

## 🎯 发布订阅概述

### 什么是发布订阅？
发布订阅是一种消息传递模式，其中发送者（发布者）不直接将消息发送给特定的接收者（订阅者），而是将消息发布到频道，订阅者通过订阅频道来接收消息。

### 核心概念
- **发布者（Publisher）**：发送消息的客户端
- **订阅者（Subscriber）**：接收消息的客户端
- **频道（Channel）**：消息传递的媒介
- **模式（Pattern）**：支持通配符的频道匹配

### 特点
- **解耦性**：发布者和订阅者不需要知道彼此的存在
- **实时性**：消息实时传递，无需轮询
- **多对多**：一个频道可以有多个发布者和订阅者
- **无持久化**：消息不会被存储，离线订阅者会丢失消息

## 📝 基本操作

### 发布消息
```bash
# 发布消息到指定频道
PUBLISH channel message
PUBLISH news "今日头条：Redis 发布新版本"
PUBLISH chat:room1 "用户张三：大家好！"
PUBLISH notifications "系统维护通知"

# 返回值：接收到消息的订阅者数量
```

### 订阅频道
```bash
# 订阅一个或多个频道
SUBSCRIBE channel1 channel2 channel3
SUBSCRIBE news chat:room1 notifications

# 订阅后会收到确认消息：
# 1) "subscribe"
# 2) "news"
# 3) (integer) 1  # 当前订阅的频道数量

# 接收消息格式：
# 1) "message"
# 2) "news"  # 频道名
# 3) "今日头条：Redis 发布新版本"  # 消息内容
```

### 取消订阅
```bash
# 取消订阅指定频道
UNSUBSCRIBE channel1 channel2

# 取消订阅所有频道
UNSUBSCRIBE

# 取消订阅后会收到确认消息：
# 1) "unsubscribe"
# 2) "news"
# 3) (integer) 0  # 剩余订阅的频道数量
```

## 🔍 模式订阅

### 模式匹配订阅
```bash
# 使用通配符订阅多个频道
PSUBSCRIBE pattern1 pattern2

# 订阅所有以 "news:" 开头的频道
PSUBSCRIBE news:*

# 订阅所有聊天室频道
PSUBSCRIBE chat:room*

# 订阅用户相关的所有频道
PSUBSCRIBE user:*:notifications

# 复杂模式匹配
PSUBSCRIBE log:*:error    # 匹配 log:app:error, log:db:error 等
PSUBSCRIBE *.important    # 匹配 news.important, alert.important 等
```

### 取消模式订阅
```bash
# 取消指定模式订阅
PUNSUBSCRIBE pattern1 pattern2

# 取消所有模式订阅
PUNSUBSCRIBE
```

### 模式匹配规则
```bash
# 支持的通配符：
# * : 匹配任意数量的字符
# ? : 匹配单个字符
# [abc] : 匹配括号内的任意一个字符
# [a-z] : 匹配范围内的任意一个字符

# 示例：
PSUBSCRIBE user:*           # 匹配 user:1001, user:admin 等
PSUBSCRIBE log:?:error      # 匹配 log:1:error, log:a:error 等
PSUBSCRIBE event:[abc]:*    # 匹配 event:a:login, event:b:logout 等
```

## 🎯 应用场景

### 1. 实时聊天系统
```bash
# 聊天室实现
# 用户加入聊天室
SUBSCRIBE chat:room:general

# 用户发送消息
PUBLISH chat:room:general "张三: 大家好！"

# 私聊实现
SUBSCRIBE chat:private:1001:1002  # 用户1001和1002的私聊
PUBLISH chat:private:1001:1002 "张三对李四说：你好"

# 群聊实现
SUBSCRIBE chat:group:123
PUBLISH chat:group:123 "张三在群123中说：开会了"
```

### 2. 实时通知系统
```bash
# 系统通知
PUBLISH notifications:system "系统将在10分钟后维护"

# 用户个人通知
PUBLISH notifications:user:1001 "您有新的私信"
PUBLISH notifications:user:1001 "您的订单已发货"

# 按类型订阅通知
PSUBSCRIBE notifications:*        # 订阅所有通知
PSUBSCRIBE notifications:user:*   # 订阅所有用户通知
SUBSCRIBE notifications:system    # 只订阅系统通知
```

### 3. 实时数据推送
```bash
# 股票价格推送
PUBLISH stock:AAPL "150.25"
PUBLISH stock:GOOGL "2800.50"

# 订阅特定股票
SUBSCRIBE stock:AAPL stock:GOOGL

# 订阅所有股票
PSUBSCRIBE stock:*

# 传感器数据推送
PUBLISH sensor:temperature:room1 "25.5"
PUBLISH sensor:humidity:room1 "60"
PSUBSCRIBE sensor:*:room1  # 订阅房间1的所有传感器数据
```

### 4. 缓存失效通知
```bash
# 缓存失效通知
PUBLISH cache:invalidate:user:1001 "profile_updated"
PUBLISH cache:invalidate:product:123 "price_changed"

# 应用服务器订阅缓存失效事件
PSUBSCRIBE cache:invalidate:*

# 处理缓存失效
# 当收到消息时，清理本地缓存
```

### 5. 微服务间通信
```bash
# 订单服务发布事件
PUBLISH events:order:created '{"order_id": 12345, "user_id": 1001, "amount": 99.99}'

# 库存服务订阅订单事件
SUBSCRIBE events:order:created

# 邮件服务订阅订单事件
SUBSCRIBE events:order:created

# 用户服务发布用户事件
PUBLISH events:user:registered '{"user_id": 1001, "email": "user@example.com"}'
```

### 6. 日志收集系统
```bash
# 应用日志推送
PUBLISH logs:app:error "数据库连接失败"
PUBLISH logs:app:info "用户1001登录成功"
PUBLISH logs:nginx:access "GET /api/users 200"

# 日志收集器订阅
PSUBSCRIBE logs:*:error    # 收集所有错误日志
PSUBSCRIBE logs:app:*      # 收集应用的所有日志
SUBSCRIBE logs:nginx:access # 收集Nginx访问日志
```

## 📊 监控和管理

### 查看发布订阅状态
```bash
# 查看活跃的频道
PUBSUB CHANNELS [pattern]
PUBSUB CHANNELS           # 所有活跃频道
PUBSUB CHANNELS news:*    # 匹配模式的活跃频道

# 查看频道的订阅者数量
PUBSUB NUMSUB channel1 channel2
PUBSUB NUMSUB news chat:room1

# 查看模式订阅数量
PUBSUB NUMPAT
```

### 发布订阅统计
```bash
# 查看发布订阅相关统计
INFO replication | grep pubsub
INFO stats | grep pubsub

# 关键指标：
# pubsub_channels: 当前活跃频道数
# pubsub_patterns: 当前模式订阅数
```

## 🔧 客户端实现示例

### Python 实现
```python
import redis
import threading
import json

class RedisPubSub:
    def __init__(self, host='localhost', port=6379):
        self.redis_client = redis.Redis(host=host, port=port, decode_responses=True)
        self.pubsub = self.redis_client.pubsub()
    
    def publish(self, channel, message):
        """发布消息"""
        return self.redis_client.publish(channel, message)
    
    def subscribe(self, channels, callback):
        """订阅频道"""
        self.pubsub.subscribe(**{channel: callback for channel in channels})
        
        # 启动监听线程
        thread = threading.Thread(target=self._listen)
        thread.daemon = True
        thread.start()
        return thread
    
    def psubscribe(self, patterns, callback):
        """模式订阅"""
        self.pubsub.psubscribe(**{pattern: callback for pattern in patterns})
        
        thread = threading.Thread(target=self._listen)
        thread.daemon = True
        thread.start()
        return thread
    
    def _listen(self):
        """监听消息"""
        for message in self.pubsub.listen():
            if message['type'] == 'message':
                print(f"收到消息: {message['channel']} -> {message['data']}")
            elif message['type'] == 'pmessage':
                print(f"收到模式消息: {message['pattern']} -> {message['channel']} -> {message['data']}")

# 使用示例
pubsub = RedisPubSub()

# 订阅频道
def handle_news(message):
    print(f"新闻: {message['data']}")

pubsub.subscribe(['news', 'alerts'], handle_news)

# 发布消息
pubsub.publish('news', '重要新闻：Redis 7.0 发布')
```

### Node.js 实现
```javascript
const redis = require('redis');

class RedisPubSub {
    constructor() {
        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();
    }
    
    async publish(channel, message) {
        return await this.publisher.publish(channel, message);
    }
    
    subscribe(channels, callback) {
        this.subscriber.subscribe(channels);
        this.subscriber.on('message', (channel, message) => {
            callback(channel, message);
        });
    }
    
    psubscribe(patterns, callback) {
        this.subscriber.psubscribe(patterns);
        this.subscriber.on('pmessage', (pattern, channel, message) => {
            callback(pattern, channel, message);
        });
    }
}

// 使用示例
const pubsub = new RedisPubSub();

// 订阅消息
pubsub.subscribe(['chat:room1'], (channel, message) => {
    console.log(`收到消息 [${channel}]: ${message}`);
});

// 发布消息
pubsub.publish('chat:room1', 'Hello, World!');
```

## ⚠️ 注意事项和限制

### 消息丢失问题
```bash
# 发布订阅的限制：
# 1. 消息不持久化，服务器重启会丢失
# 2. 订阅者离线时会丢失消息
# 3. 网络中断可能导致消息丢失
# 4. 订阅者处理速度慢可能导致消息积压

# 解决方案：
# 1. 结合 Redis Streams 实现可靠消息传递
# 2. 使用专业的消息队列（RabbitMQ、Kafka）
# 3. 实现消息确认机制
# 4. 添加消息重试逻辑
```

### 性能考虑
```bash
# 性能影响因素：
# 1. 订阅者数量：订阅者越多，性能影响越大
# 2. 消息频率：高频消息发布会影响性能
# 3. 消息大小：大消息会增加网络传输开销
# 4. 模式匹配：复杂模式匹配会影响性能

# 优化建议：
# 1. 合理设计频道结构
# 2. 避免过于复杂的模式匹配
# 3. 控制消息大小
# 4. 监控订阅者处理性能
```

### 内存使用
```bash
# 内存使用情况：
# 1. 每个订阅者连接会占用内存
# 2. 消息缓冲区会占用内存
# 3. 频道信息会占用内存

# 监控命令：
INFO clients
INFO memory
PUBSUB CHANNELS
PUBSUB NUMPAT
```

## 🛡️ 最佳实践

### 1. 频道设计
```bash
# 使用层次化的频道命名
news:sports:football
news:tech:ai
user:1001:notifications
chat:room:general

# 避免过深的层次
# 不好：app:module:submodule:feature:action:type
# 好：app:feature:action
```

### 2. 错误处理
```python
# 实现重连机制
def subscribe_with_retry(channels, callback, max_retries=3):
    retries = 0
    while retries < max_retries:
        try:
            pubsub.subscribe(channels, callback)
            break
        except redis.ConnectionError:
            retries += 1
            time.sleep(2 ** retries)  # 指数退避
```

### 3. 消息格式标准化
```bash
# 使用 JSON 格式的消息
PUBLISH events:user:login '{"user_id": 1001, "timestamp": "2024-01-15T10:00:00Z", "ip": "192.168.1.100"}'

# 包含消息元数据
{
    "event_type": "user_login",
    "timestamp": "2024-01-15T10:00:00Z",
    "data": {
        "user_id": 1001,
        "ip": "192.168.1.100"
    }
}
```

### 4. 监控和告警
```bash
# 监控关键指标：
# - 活跃频道数量
# - 订阅者数量
# - 消息发布频率
# - 连接数量

# 设置告警：
# - 订阅者连接异常断开
# - 消息积压
# - 内存使用过高
```

---

*Redis 发布订阅是实现实时通信的强大工具，但需要注意其限制并结合具体业务需求选择合适的消息传递方案！*
