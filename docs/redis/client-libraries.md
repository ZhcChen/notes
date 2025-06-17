# Redis 客户端库与集成

Redis 提供了对多种编程语言的官方和第三方客户端库支持，使得在应用程序中集成 Redis 变得非常方便。本节将介绍一些常用语言的客户端库及其基本使用示例。

## 1. Python

**客户端库**: `redis-py`

**安装**:

```bash
pip install redis
```

**基本使用示例**:

```python
import redis

# 连接到 Redis 服务器
# 默认连接到 localhost:6379
r = redis.Redis(host='localhost', port=6379, db=0)

# 设置键值对
r.set('mykey', 'Hello from Python!')

# 获取键值对
value = r.get('mykey')
print(value.decode('utf-8')) # 输出: Hello from Python!

# 使用哈希
r.hset('user:100', mapping={
    'name': 'Alice',
    'email': 'alice@example.com'
})
user_name = r.hget('user:100', 'name')
print(user_name.decode('utf-8')) # 输出: Alice

# 使用列表
r.rpush('mylist', 'item1', 'item2', 'item3')
list_items = r.lrange('mylist', 0, -1)
for item in list_items:
    print(item.decode('utf-8'))
# 输出:
# item1
# item2
# item3
```

## 2. Node.js

**客户端库**: `ioredis` (推荐), `node-redis`

**安装**:

```bash
npm install ioredis
# 或者
# npm install redis
```

**基本使用示例 (ioredis)**:

```javascript
const Redis = require('ioredis');
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 0
});

(async () => {
  // 设置键值对
  await redis.set('mykey', 'Hello from Node.js!');

  // 获取键值对
  const value = await redis.get('mykey');
  console.log(value); // 输出: Hello from Node.js!

  // 使用哈希
  await redis.hset('product:101', 'name', 'Laptop', 'price', '1200');
  const productName = await redis.hget('product:101', 'name');
  console.log(productName); // 输出: Laptop

  // 使用集合
  await redis.sadd('myset', 'apple', 'banana', 'orange');
  const setMembers = await redis.smembers('myset');
  console.log(setMembers); // 输出: [ 'apple', 'banana', 'orange' ]

  redis.quit();
})();
```

## 3. Java

**客户端库**: `Jedis` (推荐), `Lettuce`

**安装 (Maven 示例)**:

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>5.0.2</version> <!-- 使用最新版本 -->
</dependency>
```

**基本使用示例 (Jedis)**:

```java
import redis.clients.jedis.Jedis;
import java.util.Map;

public class JedisExample {
    public static void main(String[] args) {
        // 连接到 Redis 服务器
        Jedis jedis = new Jedis("localhost", 6379);
        System.out.println("Connection to server sucessfully");

        // 检查是否连接成功
        System.out.println("Server is running: " + jedis.ping());

        // 设置键值对
        jedis.set("mykey", "Hello from Java!");
        System.out.println("Stored string in redis:: " + jedis.get("mykey"));

        // 使用哈希
        jedis.hset("book:1", "title", "Redis in Action");
        jedis.hset("book:1", "author", "Josiah L. Carlson");
        Map<String, String> book = jedis.hgetAll("book:1");
        System.out.println("Book title: " + book.get("title")); // 输出: Redis in Action

        // 使用列表
        jedis.lpush("tutorial-list", "Redis", "Mongodb", "Mysql");
        System.out.println("Stored list: " + jedis.lrange("tutorial-list", 0, -1));

        jedis.close(); // 关闭连接
    }
}
```

## 4. Go

**客户端库**: `go-redis` (推荐)

**安装**:

```bash
go get github.com/go-redis/redis/v8
```

**基本使用示例**:

```go
package main

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379", // Redis 地址
		Password: "",               // 没有密码，默认
		DB:       0,                // 默认数据库
	})

	// Ping Redis
	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		fmt.Println("Could not connect to Redis:", err)
		return
	}
	fmt.Println("Connected to Redis:", pong)

	// 设置键值对
	err = rdb.Set(ctx, "mykey", "Hello from Go!", 0).Err()
	if err != nil {
		panic(err)
	}

	// 获取键值对
	val, err := rdb.Get(ctx, "mykey").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println("mykey:", val) // 输出: mykey: Hello from Go!

	// 使用哈希
	err = rdb.HSet(ctx, "user:200", "name", "Bob", "age", "30").Err()
	if err != nil {
		panic(err)
	}
	userName := rdb.HGet(ctx, "user:200", "name").Val()
	fmt.Println("User name:", userName) // 输出: User name: Bob

	// 使用列表
	err = rdb.LPush(ctx, "tasks", "task1", "task2", "task3").Err()
	if err != nil {
		panic(err)
	}
	tasks := rdb.LRange(ctx, "tasks", 0, -1).Val()
	fmt.Println("Tasks:", tasks) // 输出: Tasks: [task3 task2 task1]

	// 设置带过期时间的键
	err = rdb.Set(ctx, "expire_key", "This will expire", 10*time.Second).Err()
	if err != nil {
		panic(err)
	}
	fmt.Println("expire_key set with expiry.")
}