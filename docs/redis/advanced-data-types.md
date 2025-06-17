# Redis 高级数据结构

除了基本的字符串、哈希、列表、集合和有序集合之外，Redis 还提供了一些高级数据结构，它们在特定场景下非常有用。

## 1. HyperLogLog (HLL)

HyperLogLog 是一种用于估算集合中唯一元素数量的概率性数据结构。它可以在内存占用极小的情况下，对大量元素进行基数（唯一元素数量）估算，标准误差约为 0.81%。

**主要命令**:
*   `PFADD key element [element ...]`: 添加一个或多个元素到 HyperLogLog。
*   `PFCOUNT key [key ...]`: 返回给定 HyperLogLog 的基数估算值。
*   `PFMERGE destkey sourcekey [sourcekey ...]`: 将多个 HyperLogLog 合并为一个。

**使用场景**:
*   统计网站的独立访客 (UV)。
*   统计文章的独立阅读量。
*   统计搜索关键词的独立数量。

**示例**:

```
PFADD website:uv user1 user2 user3 user1
PFCOUNT website:uv
# 输出: 3

PFADD website:uv user4 user5
PFCOUNT website:uv
# 输出: 5 (估算值，可能略有偏差)

PFADD page:uv:news user1 user6
PFADD page:uv:sports user2 user7
PFMERGE total:uv page:uv:news page:uv:sports
PFCOUNT total:uv
# 输出: 4 (user1, user6, user2, user7)
```

## 2. Geospatial (地理空间)

Redis 的地理空间功能允许您存储地理坐标（经度和纬度），并根据位置进行查询，例如查找给定半径内的所有点。

**主要命令**:
*   `GEOADD key longitude latitude member [longitude latitude member ...]`: 添加一个或多个地理空间项。
*   `GEODIST key member1 member2 [unit]`: 计算两个成员之间的距离。
*   `GEORADIUS key longitude latitude radius unit [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC] [STORE key] [STOREDIST key]`: 查找给定半径内的成员。
*   `GEORADIUSBYMEMBER key member radius unit [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC] [STORE key] [STOREDIST key]`: 查找给定成员周围半径内的成员。
*   `GEOHASH key member [member ...]`: 返回一个或多个成员的 GeoHash 字符串。
*   `GEOPOS key member [member ...]`: 返回一个或多个成员的经度和纬度。

**使用场景**:
*   查找附近的人或商店。
*   基于位置的服务 (LBS)。
*   地理围栏。

**示例**:

```
GEOADD cities 13.361389 38.115556 "Palermo" 15.087268 37.502669 "Catania"
GEODIST cities Palermo Catania km
# 输出: 166.2742

GEOADD places 116.4074 39.9042 "Beijing" 121.4737 31.2304 "Shanghai"
GEORADIUS places 116.4074 39.9042 100 km WITHDIST
# 输出:
# 1) 1) "Beijing"
#    2) "0.0000"
```

## 3. Streams (流)

Redis Streams 是一个只追加的数据结构，用于实现高性能、低延迟的日志、事件流和消息队列。它支持多消费者组，可以实现消息的持久化和消费者状态的跟踪。

**主要命令**:
*   `XADD key ID field value [field value ...]`: 添加新条目到流。
*   `XRANGE key start end [COUNT count]`: 获取指定范围内的条目。
*   `XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] ID [ID ...]`: 从一个或多个流中读取条目。
*   `XGROUP CREATE key groupname ID|$ [MKSTREAM]`: 创建消费者组。
*   `XREADGROUP GROUP groupname consumername [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] ID [ID ...]`: 从消费者组中读取条目。
*   `XACK key groupname ID [ID ...]`: 确认已处理的条目。
*   `XPENDING key groupname [start end count] [consumer]`: 查看待处理的条目。

**使用场景**:
*   消息队列。
*   事件溯源。
*   实时数据处理。
*   日志聚合。

**示例**:

```
XADD mystream * sensor_id 123 temperature 25.5
XADD mystream * sensor_id 124 temperature 26.1
XRANGE mystream - +
# 输出:
# 1) 1) "1678888888888-0"
#    2) 1) "sensor_id"
#       2) "123"
#       3) "temperature"
#       4) "25.5"
# 2) 1) "1678888888889-0"
#    2) 1) "sensor_id"
#       2) "124"
#       3) "temperature"
#       4) "26.1"

XGROUP CREATE mystream mygroup $ MKSTREAM
XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS mystream >
# 输出: (读取一条未消费的消息)
XACK mystream mygroup 1678888888888-0
```

## 4. Bitmaps (位图)

Bitmaps 实际上是字符串数据类型的一种特殊用法，它将字符串视为一个位数组。您可以对单个位进行设置、清除或计数。

**主要命令**:
*   `SETBIT key offset value`: 设置或清除指定偏移量上的位。
*   `GETBIT key offset`: 获取指定偏移量上的位值。
*   `BITCOUNT key [start end]`: 统计指定范围内设置为 1 的位的数量。
*   `BITOP operation destkey key [key ...]`: 对多个位图执行位操作 (AND, OR, XOR, NOT)。

**使用场景**:
*   用户签到统计 (例如，每月用户签到天数)。
*   用户在线状态。
*   布隆过滤器 (Bloom Filter) 的底层实现。

**示例**:

```
SETBIT user:1:signin 0 1   # 用户1在第1天签到
SETBIT user:1:signin 2 1   # 用户1在第3天签到
GETBIT user:1:signin 0
# 输出: 1
GETBIT user:1:signin 1
# 输出: 0
BITCOUNT user:1:signin
# 输出: 2 (用户1签到了2天)

SETBIT user:2:online 100 1 # 用户2在线
GETBIT user:2:online 100
# 输出: 1