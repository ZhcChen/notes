# 切片

切片（Slice）是对集合中一段连续元素的引用。切片让您可以引用集合中的一部分元素，而不是整个集合。切片是一种不拥有所有权的数据类型。

## 字符串切片

### 基本字符串切片

```rust
fn main() {
    let s = String::from("hello world");
    
    let hello = &s[0..5];   // "hello"
    let world = &s[6..11];  // "world"
    
    println!("第一部分：{}", hello);
    println!("第二部分：{}", world);
    
    // 切片语法糖
    let hello2 = &s[..5];   // 等同于 &s[0..5]
    let world2 = &s[6..];   // 等同于 &s[6..11]
    let full = &s[..];      // 等同于 &s[0..11]
    
    println!("语法糖：{}, {}, {}", hello2, world2, full);
}
```

### 字符串切片类型

```rust
fn main() {
    let s = String::from("hello world");
    
    // 字符串切片的类型是 &str
    let slice: &str = &s[0..5];
    println!("切片：{}", slice);
    
    // 字符串字面量就是切片
    let literal: &str = "hello world";
    println!("字面量：{}", literal);
}
```

### 实际应用：查找第一个单词

```rust
fn main() {
    let mut s = String::from("hello world");
    
    let word = first_word(&s);
    println!("第一个单词：{}", word);
    
    // s.clear(); // 错误！不能在有不可变借用时修改
    
    // 使用完切片后才能修改
    println!("使用切片：{}", word);
    // 现在可以修改了（如果 word 不再被使用）
}

fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();
    
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    
    &s[..]
}
```

### 改进的函数签名

```rust
fn main() {
    let my_string = String::from("hello world");
    
    // first_word 适用于 String 的切片
    let word = first_word(&my_string[0..6]);
    let word = first_word(&my_string[..]);
    
    // first_word 也适用于 String 的引用，等同于整个 String 的切片
    let word = first_word(&my_string);
    
    let my_string_literal = "hello world";
    
    // first_word 适用于字符串字面量的切片
    let word = first_word(&my_string_literal[0..6]);
    let word = first_word(&my_string_literal[..]);
    
    // 因为字符串字面量本身就是字符串切片，这样写也可以！
    let word = first_word(my_string_literal);
    
    println!("第一个单词：{}", word);
}

// 更好的函数签名：接受 &str 而不是 &String
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    
    &s[..]
}
```

## 数组切片

### 基本数组切片

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];
    
    let slice = &a[1..4]; // [2, 3, 4]
    
    println!("原数组：{:?}", a);
    println!("切片：{:?}", slice);
    
    // 切片的类型是 &[i32]
    assert_eq!(slice, &[2, 3, 4]);
}
```

### 向量切片

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];
    
    let slice1 = &v[1..4];    // [2, 3, 4]
    let slice2 = &v[..3];     // [1, 2, 3]
    let slice3 = &v[2..];     // [3, 4, 5]
    let slice4 = &v[..];      // [1, 2, 3, 4, 5]
    
    println!("切片1：{:?}", slice1);
    println!("切片2：{:?}", slice2);
    println!("切片3：{:?}", slice3);
    println!("切片4：{:?}", slice4);
}
```

### 可变切片

```rust
fn main() {
    let mut a = [1, 2, 3, 4, 5];
    
    {
        let slice = &mut a[1..4];
        slice[0] = 10; // 修改切片中的元素
        println!("修改后的切片：{:?}", slice);
    }
    
    println!("修改后的数组：{:?}", a);
}
```

## 切片作为函数参数

### 处理数组切片

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let vec = vec![1, 2, 3, 4, 5];
    
    // 函数可以接受数组和向量的切片
    println!("数组总和：{}", sum(&arr));
    println!("向量总和：{}", sum(&vec));
    println!("部分总和：{}", sum(&arr[1..4]));
}

fn sum(slice: &[i32]) -> i32 {
    slice.iter().sum()
}
```

### 修改切片元素

```rust
fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];
    
    println!("修改前：{:?}", numbers);
    double_slice(&mut numbers[1..4]);
    println!("修改后：{:?}", numbers);
}

fn double_slice(slice: &mut [i32]) {
    for item in slice {
        *item *= 2;
    }
}
```

## 切片的内部表示

### 切片的结构

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let slice = &arr[1..4];
    
    // 切片包含指向数据的指针和长度
    println!("切片长度：{}", slice.len());
    println!("切片内容：{:?}", slice);
    
    // 切片的大小
    println!("切片的大小：{} 字节", std::mem::size_of_val(&slice));
    println!("指针的大小：{} 字节", std::mem::size_of::<*const i32>());
    println!("usize 的大小：{} 字节", std::mem::size_of::<usize>());
}
```

### 切片与数组的区别

```rust
fn main() {
    let arr: [i32; 5] = [1, 2, 3, 4, 5];  // 数组：编译时已知大小
    let slice: &[i32] = &arr[1..4];        // 切片：运行时确定大小
    
    println!("数组大小：{} 字节", std::mem::size_of_val(&arr));
    println!("切片大小：{} 字节", std::mem::size_of_val(&slice));
    
    // 数组长度在编译时已知
    const ARRAY_LEN: usize = 5;
    
    // 切片长度在运行时确定
    let slice_len = slice.len();
    
    println!("数组长度：{}", ARRAY_LEN);
    println!("切片长度：{}", slice_len);
}
```

## 切片模式匹配

### 匹配切片

```rust
fn main() {
    let data = vec![1, 2, 3, 4, 5];
    
    match &data[..] {
        [] => println!("空切片"),
        [x] => println!("单元素切片：{}", x),
        [x, y] => println!("双元素切片：{}, {}", x, y),
        [first, .., last] => println!("首尾元素：{}, {}", first, last),
        _ => println!("其他情况"),
    }
    
    // 更复杂的模式
    analyze_slice(&data[..]);
}

fn analyze_slice(slice: &[i32]) {
    match slice {
        [] => println!("空"),
        [x] => println!("一个元素：{}", x),
        [x, y] => println!("两个元素：{}, {}", x, y),
        [x, y, z] => println!("三个元素：{}, {}, {}", x, y, z),
        [first, middle @ .., last] => {
            println!("首：{}，尾：{}，中间有 {} 个元素", 
                     first, last, middle.len());
        }
    }
}
```

## 字符串切片的高级用法

### UTF-8 和字符边界

```rust
fn main() {
    let s = String::from("你好世界");
    
    // 注意：中文字符占用多个字节
    println!("字符串长度（字节）：{}", s.len());
    println!("字符串长度（字符）：{}", s.chars().count());
    
    // 按字节切片（危险！可能切断字符）
    // let slice = &s[0..2]; // 可能 panic！
    
    // 安全的方式：按字符切片
    let chars: Vec<char> = s.chars().collect();
    let first_two: String = chars[0..2].iter().collect();
    println!("前两个字符：{}", first_two);
    
    // 或者使用字符串方法
    let first_char = s.chars().next().unwrap();
    println!("第一个字符：{}", first_char);
}
```

### 字符串切片方法

```rust
fn main() {
    let text = "  hello world  ";
    
    // 常用字符串切片方法
    println!("原始：'{}'", text);
    println!("去空格：'{}'", text.trim());
    println!("转大写：'{}'", text.to_uppercase());
    println!("转小写：'{}'", text.to_lowercase());
    
    // 检查方法
    println!("以 'hello' 开头：{}", text.trim().starts_with("hello"));
    println!("以 'world' 结尾：{}", text.trim().ends_with("world"));
    println!("包含 'lo'：{}", text.contains("lo"));
    
    // 分割
    let words: Vec<&str> = text.trim().split(' ').collect();
    println!("单词：{:?}", words);
}
```

## 切片的迭代

### 基本迭代

```rust
fn main() {
    let numbers = [1, 2, 3, 4, 5];
    let slice = &numbers[1..4];
    
    // 迭代值
    print!("值：");
    for value in slice {
        print!("{} ", value);
    }
    println!();
    
    // 迭代索引和值
    print!("索引和值：");
    for (index, value) in slice.iter().enumerate() {
        print!("{}:{} ", index, value);
    }
    println!();
}
```

### 可变迭代

```rust
fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];
    
    // 可变迭代
    for item in &mut numbers[1..4] {
        *item *= 2;
    }
    
    println!("修改后：{:?}", numbers);
}
```

## 实际应用示例

### 文本处理

```rust
fn main() {
    let text = "Rust is a systems programming language";
    
    let words = split_words(text);
    println!("单词：{:?}", words);
    
    let longest = find_longest_word(text);
    println!("最长单词：{}", longest);
}

fn split_words(text: &str) -> Vec<&str> {
    text.split_whitespace().collect()
}

fn find_longest_word(text: &str) -> &str {
    text.split_whitespace()
        .max_by_key(|word| word.len())
        .unwrap_or("")
}
```

### 数据处理

```rust
fn main() {
    let data = vec![1, 5, 3, 9, 2, 8, 4, 7, 6];
    
    println!("原始数据：{:?}", data);
    println!("前5个：{:?}", &data[..5]);
    println!("后5个：{:?}", &data[4..]);
    println!("中间3个：{:?}", &data[3..6]);
    
    let max_in_range = find_max(&data[2..7]);
    println!("索引2-6范围内的最大值：{}", max_in_range);
}

fn find_max(slice: &[i32]) -> i32 {
    *slice.iter().max().unwrap()
}
```

## 练习

### 练习 1：字符串处理
编写一个函数，接受一个字符串切片，返回去除标点符号后的单词数量。

### 练习 2：数组操作
编写一个函数，接受一个整数切片，返回所有偶数的和。

### 练习 3：切片分割
编写一个函数，将一个切片分割成两部分，返回两个切片。

### 练习 4：安全索引
编写一个安全的字符串切片函数，避免在字符边界处切割。

## 下一步

掌握了切片后，您可以继续学习：

1. [结构体](./structs.md) - 创建自定义数据类型
2. [枚举与模式匹配](./enums.md) - 强大的数据建模工具
3. [模块系统](./modules.md) - 代码组织和可见性

切片是 Rust 中非常重要的概念，它提供了安全、高效的方式来处理集合的部分数据！
