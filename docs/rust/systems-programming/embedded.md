# 嵌入式开发

## 🎯 嵌入式Rust概述

嵌入式开发是Rust的重要应用领域之一。Rust的零成本抽象、内存安全和无运行时开销的特性使其成为嵌入式系统的理想选择。

## 🔧 嵌入式开发环境

### 工具链安装
```bash
# 安装嵌入式开发工具
rustup target add thumbv7em-none-eabihf  # ARM Cortex-M4F
rustup target add thumbv6m-none-eabi     # ARM Cortex-M0/M0+
rustup target add thumbv7m-none-eabi     # ARM Cortex-M3

# 安装调试工具
cargo install cargo-embed
cargo install cargo-flash
cargo install probe-run

# 安装交叉编译工具
sudo apt-get install gcc-arm-none-eabi  # Ubuntu/Debian
```

### 项目配置
```toml
# Cargo.toml
[package]
name = "embedded-example"
version = "0.1.0"
edition = "2021"

[dependencies]
cortex-m = "0.7"
cortex-m-rt = "0.7"
panic-halt = "0.2"
nb = "1.0"

# 目标特定依赖
[dependencies.stm32f4xx-hal]
version = "0.14"
features = ["stm32f401", "rt"]

[[bin]]
name = "main"
test = false
bench = false

[profile.release]
debug = true
lto = true
opt-level = "s"  # 优化代码大小
```

```toml
# .cargo/config.toml
[target.thumbv7em-none-eabihf]
runner = "probe-run --chip STM32F401RETx"

[build]
target = "thumbv7em-none-eabihf"

[env]
DEFMT_LOG = "debug"
```

## 💡 基础嵌入式程序

### Hello World (LED闪烁)
```rust
#![no_std]
#![no_main]

use panic_halt as _;
use cortex_m_rt::entry;
use stm32f4xx_hal::{
    pac,
    prelude::*,
    timer::Timer,
};

#[entry]
fn main() -> ! {
    // 获取设备外设
    let dp = pac::Peripherals::take().unwrap();
    let cp = cortex_m::Peripherals::take().unwrap();
    
    // 配置时钟
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();
    
    // 配置GPIO
    let gpioa = dp.GPIOA.split();
    let mut led = gpioa.pa5.into_push_pull_output();
    
    // 配置定时器
    let mut timer = Timer::tim2(dp.TIM2, &clocks).counter_hz();
    timer.start(1.Hz()).unwrap();
    
    loop {
        // 等待定时器
        nb::block!(timer.wait()).unwrap();
        
        // 切换LED状态
        led.toggle();
    }
}
```

### 串口通信
```rust
#![no_std]
#![no_main]

use panic_halt as _;
use cortex_m_rt::entry;
use stm32f4xx_hal::{
    pac,
    prelude::*,
    serial::{Config, Serial},
};
use nb::block;

#[entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();
    
    // 配置串口引脚
    let gpioa = dp.GPIOA.split();
    let tx_pin = gpioa.pa2.into_alternate();
    let rx_pin = gpioa.pa3.into_alternate();
    
    // 配置串口
    let mut serial = Serial::new(
        dp.USART2,
        (tx_pin, rx_pin),
        Config::default().baudrate(115200.bps()),
        &clocks,
    ).unwrap();
    
    let (mut tx, mut rx) = serial.split();
    
    // 发送欢迎消息
    for byte in b"Hello, Embedded Rust!\r\n" {
        block!(tx.write(*byte)).unwrap();
    }
    
    loop {
        // 回显接收到的字符
        match block!(rx.read()) {
            Ok(byte) => {
                block!(tx.write(byte)).unwrap();
            }
            Err(_) => {
                // 处理错误
            }
        }
    }
}
```

## 🔌 硬件抽象层

### GPIO操作
```rust
use stm32f4xx_hal::{
    pac,
    prelude::*,
    gpio::{Input, Output, PushPull, PullUp},
};

struct HardwareInterface {
    led: stm32f4xx_hal::gpio::PA5<Output<PushPull>>,
    button: stm32f4xx_hal::gpio::PC13<Input<PullUp>>,
}

impl HardwareInterface {
    fn new(dp: pac::Peripherals) -> Self {
        let gpioa = dp.GPIOA.split();
        let gpioc = dp.GPIOC.split();
        
        let led = gpioa.pa5.into_push_pull_output();
        let button = gpioc.pc13.into_pull_up_input();
        
        HardwareInterface { led, button }
    }
    
    fn led_on(&mut self) {
        self.led.set_high();
    }
    
    fn led_off(&mut self) {
        self.led.set_low();
    }
    
    fn is_button_pressed(&self) -> bool {
        self.button.is_low()
    }
}

// 使用示例
fn gpio_example() {
    let dp = pac::Peripherals::take().unwrap();
    let mut hw = HardwareInterface::new(dp);
    
    loop {
        if hw.is_button_pressed() {
            hw.led_on();
        } else {
            hw.led_off();
        }
        
        // 防抖延迟
        cortex_m::asm::delay(1000);
    }
}
```

### ADC读取
```rust
use stm32f4xx_hal::{
    pac,
    prelude::*,
    adc::{Adc, config::AdcConfig},
};

fn adc_example() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();
    
    // 配置ADC
    let gpioa = dp.GPIOA.split();
    let adc_pin = gpioa.pa0.into_analog();
    
    let mut adc = Adc::adc1(dp.ADC1, true, AdcConfig::default());
    
    loop {
        // 读取ADC值
        let sample: u16 = adc.read(&adc_pin).unwrap();
        
        // 转换为电压 (假设3.3V参考电压)
        let voltage = (sample as f32 / 4095.0) * 3.3;
        
        // 这里可以通过串口输出或其他方式显示
        // 在实际应用中，避免在嵌入式系统中使用浮点运算
        
        cortex_m::asm::delay(100_000);
    }
}
```

## ⏰ 定时器和中断

### 定时器中断
```rust
use stm32f4xx_hal::{
    pac::{self, interrupt, TIM2},
    prelude::*,
    timer::{Timer, Event},
};
use cortex_m::peripheral::NVIC;
use core::cell::RefCell;
use cortex_m::interrupt::Mutex;

// 全局变量需要使用Mutex保护
static TIMER: Mutex<RefCell<Option<Timer<TIM2>>>> = Mutex::new(RefCell::new(None));
static LED_STATE: Mutex<RefCell<bool>> = Mutex::new(RefCell::new(false));

#[entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    let mut cp = cortex_m::Peripherals::take().unwrap();
    
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();
    
    // 配置定时器
    let mut timer = Timer::tim2(dp.TIM2, &clocks).counter_hz();
    timer.start(2.Hz()).unwrap();
    timer.listen(Event::Update);
    
    // 将定时器移动到全局变量
    cortex_m::interrupt::free(|cs| {
        TIMER.borrow(cs).replace(Some(timer));
    });
    
    // 启用定时器中断
    unsafe {
        NVIC::unmask(interrupt::TIM2);
    }
    
    loop {
        // 主循环可以执行其他任务
        cortex_m::asm::wfi(); // 等待中断
    }
}

#[interrupt]
fn TIM2() {
    cortex_m::interrupt::free(|cs| {
        if let Some(ref mut timer) = TIMER.borrow(cs).borrow_mut().as_mut() {
            timer.clear_interrupt(Event::Update);
            
            // 切换LED状态
            let mut led_state = LED_STATE.borrow(cs).borrow_mut();
            *led_state = !*led_state;
            
            // 这里应该实际控制LED
            // led.set_state(*led_state);
        }
    });
}
```

## 📡 通信协议

### SPI通信
```rust
use stm32f4xx_hal::{
    pac,
    prelude::*,
    spi::{Spi, Mode, Phase, Polarity},
};

fn spi_example() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();
    
    // 配置SPI引脚
    let gpioa = dp.GPIOA.split();
    let sck = gpioa.pa5.into_alternate();
    let miso = gpioa.pa6.into_alternate();
    let mosi = gpioa.pa7.into_alternate();
    
    // 配置SPI
    let mut spi = Spi::new(
        dp.SPI1,
        (sck, miso, mosi),
        Mode {
            polarity: Polarity::IdleLow,
            phase: Phase::CaptureOnFirstTransition,
        },
        1.MHz(),
        &clocks,
    );
    
    loop {
        // 发送数据
        let tx_data = [0x01, 0x02, 0x03, 0x04];
        let mut rx_data = [0u8; 4];
        
        match spi.transfer(&mut rx_data, &tx_data) {
            Ok(_) => {
                // 处理接收到的数据
            }
            Err(_) => {
                // 处理错误
            }
        }
        
        cortex_m::asm::delay(1_000_000);
    }
}
```

### I2C通信
```rust
use stm32f4xx_hal::{
    pac,
    prelude::*,
    i2c::I2c,
};

fn i2c_example() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();
    
    // 配置I2C引脚
    let gpiob = dp.GPIOB.split();
    let scl = gpiob.pb8.into_alternate_open_drain();
    let sda = gpiob.pb9.into_alternate_open_drain();
    
    // 配置I2C
    let mut i2c = I2c::new(
        dp.I2C1,
        (scl, sda),
        400.kHz(),
        &clocks,
    );
    
    let device_address = 0x48; // 示例设备地址
    
    loop {
        // 写入数据
        let write_data = [0x01, 0x02];
        match i2c.write(device_address, &write_data) {
            Ok(_) => {
                // 写入成功
            }
            Err(_) => {
                // 处理错误
            }
        }
        
        // 读取数据
        let mut read_data = [0u8; 2];
        match i2c.read(device_address, &mut read_data) {
            Ok(_) => {
                // 处理读取的数据
            }
            Err(_) => {
                // 处理错误
            }
        }
        
        cortex_m::asm::delay(1_000_000);
    }
}
```

## 🔋 电源管理

### 低功耗模式
```rust
use stm32f4xx_hal::{
    pac,
    prelude::*,
    pwr::{Pwr, PowerMode},
};
use cortex_m::asm;

fn power_management_example() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    let cp = cortex_m::Peripherals::take().unwrap();
    
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();
    
    // 配置电源管理
    let pwr = Pwr::new(dp.PWR);
    
    loop {
        // 执行一些工作
        do_work();
        
        // 进入低功耗模式
        enter_sleep_mode(&pwr);
    }
}

fn do_work() {
    // 模拟工作负载
    for _ in 0..1000 {
        asm::nop();
    }
}

fn enter_sleep_mode(pwr: &Pwr) {
    // 配置唤醒源
    // 例如：外部中断、定时器等
    
    // 进入睡眠模式
    asm::wfi(); // Wait For Interrupt
    
    // 从睡眠模式唤醒后继续执行
}
```

## 🛠️ 调试和测试

### 调试配置
```rust
// 使用defmt进行日志记录
use defmt::{info, warn};
use defmt_rtt as _;
use panic_probe as _;

#[entry]
fn main() -> ! {
    info!("程序启动");

    let mut counter = 0;
    loop {
        counter += 1;
        if counter > 10000 {
            warn!("计数器过高: {}", counter);
        }
        cortex_m::asm::delay(1000);
    }
}
```

### 单元测试
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_sensor_reading() {
        // 模拟传感器读取
        let reading = simulate_sensor_reading(100);
        assert_eq!(reading, 100);
    }
    
    #[test]
    fn test_data_processing() {
        let input = [1, 2, 3, 4, 5];
        let result = process_sensor_data(&input);
        assert_eq!(result, 15); // 假设是求和
    }
}

fn simulate_sensor_reading(value: u16) -> u16 {
    value
}

fn process_sensor_data(data: &[u16]) -> u16 {
    data.iter().sum()
}

// 运行测试
// cargo test --target x86_64-unknown-linux-gnu
```

## 📚 最佳实践

### 内存管理
```rust
use heapless::{Vec, String, pool::{Pool, Node}};

// 使用heapless进行无堆内存管理
fn memory_management_example() {
    // 固定大小的向量
    let mut vec: Vec<u8, 32> = Vec::new();
    vec.push(1).unwrap();
    vec.push(2).unwrap();
    
    // 固定大小的字符串
    let mut string: String<64> = String::new();
    string.push_str("Hello").unwrap();
    
    // 内存池
    static mut MEMORY: [Node<[u8; 64]>; 16] = [Node::new(); 16];
    static POOL: Pool<[u8; 64]> = Pool::new();
    
    // 初始化内存池
    unsafe {
        POOL.grow(&mut MEMORY);
    }
    
    // 从池中分配内存
    if let Some(mut block) = POOL.alloc() {
        block[0] = 42;
        // 使用完毕后自动归还到池中
    }
}
```

### 错误处理
```rust
use nb;

#[derive(Debug)]
enum SensorError {
    CommunicationError,
    InvalidData,
    Timeout,
}

fn robust_sensor_reading() -> Result<u16, SensorError> {
    // 重试机制
    for attempt in 0..3 {
        match read_sensor_with_timeout() {
            Ok(value) => {
                if validate_sensor_data(value) {
                    return Ok(value);
                } else {
                    return Err(SensorError::InvalidData);
                }
            }
            Err(_) if attempt < 2 => {
                // 重试前等待
                cortex_m::asm::delay(10_000);
                continue;
            }
            Err(_) => return Err(SensorError::CommunicationError),
        }
    }
    
    Err(SensorError::Timeout)
}

fn read_sensor_with_timeout() -> Result<u16, ()> {
    // 模拟传感器读取
    Ok(42)
}

fn validate_sensor_data(value: u16) -> bool {
    // 验证数据范围
    value >= 0 && value <= 1000
}
```

---

*嵌入式Rust开发让您能够构建安全、高效的嵌入式系统，充分发挥Rust的优势！🔌*
