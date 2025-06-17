# 设备驱动开发

## 🎯 设备驱动概述

设备驱动是操作系统与硬件设备之间的桥梁。Rust的内存安全特性和零成本抽象使其成为编写可靠设备驱动的理想选择。

## 🔌 驱动程序基础

### 驱动程序结构
```rust
use core::ptr::{read_volatile, write_volatile};

pub struct DeviceDriver {
    base_address: usize,
    irq_number: u8,
    device_id: u16,
}

impl DeviceDriver {
    pub fn new(base_address: usize, irq_number: u8) -> Self {
        DeviceDriver {
            base_address,
            irq_number,
            device_id: 0,
        }
    }

    pub fn init(&mut self) -> Result<(), DriverError> {
        // 设备初始化
        self.reset_device()?;
        self.configure_device()?;
        self.enable_interrupts()?;
        
        // 读取设备ID验证
        self.device_id = self.read_device_id();
        
        Ok(())
    }

    fn reset_device(&self) -> Result<(), DriverError> {
        // 向控制寄存器写入复位命令
        unsafe {
            write_volatile((self.base_address + 0x00) as *mut u32, 0x01);
        }
        
        // 等待复位完成
        let mut timeout = 1000;
        while timeout > 0 {
            let status = unsafe {
                read_volatile((self.base_address + 0x04) as *const u32)
            };
            
            if status & 0x01 == 0 {
                return Ok(());
            }
            
            timeout -= 1;
            // 简单延迟
            for _ in 0..1000 {
                core::hint::spin_loop();
            }
        }
        
        Err(DriverError::Timeout)
    }

    fn configure_device(&self) -> Result<(), DriverError> {
        // 配置设备参数
        unsafe {
            // 设置工作模式
            write_volatile((self.base_address + 0x08) as *mut u32, 0x03);
            
            // 设置缓冲区大小
            write_volatile((self.base_address + 0x0C) as *mut u32, 4096);
        }
        
        Ok(())
    }

    fn enable_interrupts(&self) -> Result<(), DriverError> {
        unsafe {
            // 启用中断
            write_volatile((self.base_address + 0x10) as *mut u32, 0xFF);
        }
        Ok(())
    }

    fn read_device_id(&self) -> u16 {
        unsafe {
            read_volatile((self.base_address + 0x14) as *const u16)
        }
    }
}

#[derive(Debug)]
pub enum DriverError {
    Timeout,
    InvalidDevice,
    HardwareError,
    BufferFull,
    InvalidParameter,
}
```

## 🖥️ 显示驱动

### 简单的帧缓冲驱动
```rust
pub struct FramebufferDriver {
    buffer: *mut u8,
    width: usize,
    height: usize,
    bytes_per_pixel: usize,
    pitch: usize,
}

impl FramebufferDriver {
    pub fn new(
        buffer_addr: usize,
        width: usize,
        height: usize,
        bytes_per_pixel: usize,
    ) -> Self {
        let pitch = width * bytes_per_pixel;
        
        FramebufferDriver {
            buffer: buffer_addr as *mut u8,
            width,
            height,
            bytes_per_pixel,
            pitch,
        }
    }

    pub fn set_pixel(&self, x: usize, y: usize, color: u32) {
        if x >= self.width || y >= self.height {
            return;
        }

        let offset = y * self.pitch + x * self.bytes_per_pixel;
        
        unsafe {
            match self.bytes_per_pixel {
                3 => {
                    // RGB24
                    *self.buffer.add(offset) = (color & 0xFF) as u8;
                    *self.buffer.add(offset + 1) = ((color >> 8) & 0xFF) as u8;
                    *self.buffer.add(offset + 2) = ((color >> 16) & 0xFF) as u8;
                }
                4 => {
                    // RGBA32
                    *(self.buffer.add(offset) as *mut u32) = color;
                }
                _ => {}
            }
        }
    }

    pub fn fill_rect(&self, x: usize, y: usize, width: usize, height: usize, color: u32) {
        for dy in 0..height {
            for dx in 0..width {
                self.set_pixel(x + dx, y + dy, color);
            }
        }
    }

    pub fn clear_screen(&self, color: u32) {
        self.fill_rect(0, 0, self.width, self.height, color);
    }

    pub fn draw_char(&self, x: usize, y: usize, ch: char, color: u32) {
        // 简单的8x8字符绘制
        let font_data = get_font_data(ch);
        
        for row in 0..8 {
            for col in 0..8 {
                if font_data[row] & (1 << (7 - col)) != 0 {
                    self.set_pixel(x + col, y + row, color);
                }
            }
        }
    }

    pub fn scroll_up(&self, lines: usize) {
        let bytes_to_move = (self.height - lines) * self.pitch;
        let src = unsafe { self.buffer.add(lines * self.pitch) };
        
        unsafe {
            core::ptr::copy(src, self.buffer, bytes_to_move);
            
            // 清空底部
            let clear_start = self.buffer.add(bytes_to_move);
            core::ptr::write_bytes(clear_start, 0, lines * self.pitch);
        }
    }
}

fn get_font_data(ch: char) -> [u8; 8] {
    // 简化的字体数据
    match ch {
        'A' => [0x18, 0x3C, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x00],
        'B' => [0x7C, 0x66, 0x66, 0x7C, 0x66, 0x66, 0x7C, 0x00],
        _ => [0x00; 8], // 默认空字符
    }
}
```

## 🖱️ 输入设备驱动

### 键盘驱动
```rust
use spin::Mutex;
use lazy_static::lazy_static;
use pc_keyboard::{layouts, DecodedKey, HandleControl, Keyboard, ScancodeSet1};

lazy_static! {
    static ref KEYBOARD: Mutex<Keyboard<layouts::Us104Key, ScancodeSet1>> =
        Mutex::new(Keyboard::new(
            layouts::Us104Key,
            ScancodeSet1,
            HandleControl::Ignore
        ));
}

pub struct KeyboardDriver {
    data_port: u16,
    status_port: u16,
}

impl KeyboardDriver {
    pub fn new() -> Self {
        KeyboardDriver {
            data_port: 0x60,
            status_port: 0x64,
        }
    }

    pub fn init(&self) -> Result<(), DriverError> {
        // 禁用设备
        self.send_command(0xAD)?;
        self.send_command(0xA7)?;

        // 清空输出缓冲区
        self.read_data();

        // 设置控制器配置
        self.send_command(0x20)?;
        let mut config = self.read_data();
        config &= !0x43; // 禁用中断和翻译
        self.send_command(0x60)?;
        self.send_data(config)?;

        // 启用设备
        self.send_command(0xAE)?;

        Ok(())
    }

    pub fn read_scancode(&self) -> Option<u8> {
        if self.output_buffer_full() {
            Some(self.read_data())
        } else {
            None
        }
    }

    pub fn process_scancode(&self, scancode: u8) -> Option<DecodedKey> {
        let mut keyboard = KEYBOARD.lock();
        
        if let Ok(Some(key_event)) = keyboard.add_byte(scancode) {
            keyboard.process_keyevent(key_event)
        } else {
            None
        }
    }

    fn send_command(&self, command: u8) -> Result<(), DriverError> {
        self.wait_input_buffer_empty()?;
        unsafe {
            x86_64::instructions::port::Port::new(self.status_port).write(command);
        }
        Ok(())
    }

    fn send_data(&self, data: u8) -> Result<(), DriverError> {
        self.wait_input_buffer_empty()?;
        unsafe {
            x86_64::instructions::port::Port::new(self.data_port).write(data);
        }
        Ok(())
    }

    fn read_data(&self) -> u8 {
        unsafe {
            x86_64::instructions::port::Port::new(self.data_port).read()
        }
    }

    fn output_buffer_full(&self) -> bool {
        let status: u8 = unsafe {
            x86_64::instructions::port::Port::new(self.status_port).read()
        };
        status & 0x01 != 0
    }

    fn wait_input_buffer_empty(&self) -> Result<(), DriverError> {
        let mut timeout = 1000;
        
        while timeout > 0 {
            let status: u8 = unsafe {
                x86_64::instructions::port::Port::new(self.status_port).read()
            };
            
            if status & 0x02 == 0 {
                return Ok(());
            }
            
            timeout -= 1;
        }
        
        Err(DriverError::Timeout)
    }
}
```

### 鼠标驱动
```rust
pub struct MouseDriver {
    data_port: u16,
    status_port: u16,
    packet_buffer: [u8; 3],
    packet_index: usize,
}

#[derive(Debug, Clone, Copy)]
pub struct MouseState {
    pub x: i16,
    pub y: i16,
    pub left_button: bool,
    pub right_button: bool,
    pub middle_button: bool,
}

impl MouseDriver {
    pub fn new() -> Self {
        MouseDriver {
            data_port: 0x60,
            status_port: 0x64,
            packet_buffer: [0; 3],
            packet_index: 0,
        }
    }

    pub fn init(&self) -> Result<(), DriverError> {
        // 启用辅助设备
        self.send_command(0xA8)?;

        // 获取状态
        self.send_command(0x20)?;
        let mut status = self.read_data();
        status |= 0x02; // 启用辅助设备中断
        self.send_command(0x60)?;
        self.send_data(status)?;

        // 发送命令到鼠标
        self.send_mouse_command(0xF6)?; // 设置默认值
        self.send_mouse_command(0xF4)?; // 启用数据报告

        Ok(())
    }

    pub fn process_packet(&mut self, byte: u8) -> Option<MouseState> {
        self.packet_buffer[self.packet_index] = byte;
        self.packet_index += 1;

        if self.packet_index >= 3 {
            self.packet_index = 0;
            
            let flags = self.packet_buffer[0];
            let x_delta = self.packet_buffer[1] as i8 as i16;
            let y_delta = self.packet_buffer[2] as i8 as i16;

            // 检查数据包有效性
            if flags & 0x08 == 0 {
                return None; // 无效数据包
            }

            Some(MouseState {
                x: x_delta,
                y: -y_delta, // Y轴通常需要反转
                left_button: flags & 0x01 != 0,
                right_button: flags & 0x02 != 0,
                middle_button: flags & 0x04 != 0,
            })
        } else {
            None
        }
    }

    fn send_mouse_command(&self, command: u8) -> Result<(), DriverError> {
        self.send_command(0xD4)?; // 发送到辅助设备
        self.send_data(command)?;
        
        // 等待ACK
        let response = self.read_data();
        if response != 0xFA {
            return Err(DriverError::HardwareError);
        }
        
        Ok(())
    }

    fn send_command(&self, command: u8) -> Result<(), DriverError> {
        // 与键盘驱动相同的实现
        Ok(())
    }

    fn send_data(&self, data: u8) -> Result<(), DriverError> {
        // 与键盘驱动相同的实现
        Ok(())
    }

    fn read_data(&self) -> u8 {
        // 与键盘驱动相同的实现
        0
    }
}
```

## 💾 存储设备驱动

### 简单的ATA/IDE驱动
```rust
pub struct AtaDriver {
    primary_base: u16,
    primary_ctrl: u16,
    secondary_base: u16,
    secondary_ctrl: u16,
}

impl AtaDriver {
    pub fn new() -> Self {
        AtaDriver {
            primary_base: 0x1F0,
            primary_ctrl: 0x3F6,
            secondary_base: 0x170,
            secondary_ctrl: 0x376,
        }
    }

    pub fn init(&self) -> Result<(), DriverError> {
        // 检测驱动器
        self.identify_drive(0, true)?; // Primary Master
        self.identify_drive(0, false)?; // Primary Slave
        
        Ok(())
    }

    pub fn read_sectors(
        &self,
        drive: u8,
        lba: u32,
        sector_count: u8,
        buffer: &mut [u8]
    ) -> Result<(), DriverError> {
        if buffer.len() < sector_count as usize * 512 {
            return Err(DriverError::InvalidParameter);
        }

        let base = if drive < 2 { self.primary_base } else { self.secondary_base };
        let drive_select = if drive % 2 == 0 { 0xE0 } else { 0xF0 };

        // 等待驱动器就绪
        self.wait_ready(base)?;

        // 设置参数
        unsafe {
            // 驱动器选择和LBA高位
            x86_64::instructions::port::Port::new(base + 6)
                .write(drive_select | ((lba >> 24) & 0x0F) as u8);
            
            // 扇区数量
            x86_64::instructions::port::Port::new(base + 2).write(sector_count);
            
            // LBA地址
            x86_64::instructions::port::Port::new(base + 3).write(lba as u8);
            x86_64::instructions::port::Port::new(base + 4).write((lba >> 8) as u8);
            x86_64::instructions::port::Port::new(base + 5).write((lba >> 16) as u8);
            
            // 发送读命令
            x86_64::instructions::port::Port::new(base + 7).write(0x20);
        }

        // 读取数据
        for sector in 0..sector_count {
            self.wait_data_ready(base)?;
            
            let sector_offset = sector as usize * 512;
            for word in 0..256 {
                let data: u16 = unsafe {
                    x86_64::instructions::port::Port::new(base).read()
                };
                
                let byte_offset = sector_offset + word * 2;
                buffer[byte_offset] = data as u8;
                buffer[byte_offset + 1] = (data >> 8) as u8;
            }
        }

        Ok(())
    }

    pub fn write_sectors(
        &self,
        drive: u8,
        lba: u32,
        sector_count: u8,
        buffer: &[u8]
    ) -> Result<(), DriverError> {
        if buffer.len() < sector_count as usize * 512 {
            return Err(DriverError::InvalidParameter);
        }

        let base = if drive < 2 { self.primary_base } else { self.secondary_base };
        let drive_select = if drive % 2 == 0 { 0xE0 } else { 0xF0 };

        // 等待驱动器就绪
        self.wait_ready(base)?;

        // 设置参数
        unsafe {
            x86_64::instructions::port::Port::new(base + 6)
                .write(drive_select | ((lba >> 24) & 0x0F) as u8);
            x86_64::instructions::port::Port::new(base + 2).write(sector_count);
            x86_64::instructions::port::Port::new(base + 3).write(lba as u8);
            x86_64::instructions::port::Port::new(base + 4).write((lba >> 8) as u8);
            x86_64::instructions::port::Port::new(base + 5).write((lba >> 16) as u8);
            
            // 发送写命令
            x86_64::instructions::port::Port::new(base + 7).write(0x30);
        }

        // 写入数据
        for sector in 0..sector_count {
            self.wait_data_ready(base)?;
            
            let sector_offset = sector as usize * 512;
            for word in 0..256 {
                let byte_offset = sector_offset + word * 2;
                let data = buffer[byte_offset] as u16 | 
                          ((buffer[byte_offset + 1] as u16) << 8);
                
                unsafe {
                    x86_64::instructions::port::Port::new(base).write(data);
                }
            }
        }

        // 刷新缓存
        unsafe {
            x86_64::instructions::port::Port::new(base + 7).write(0xE7);
        }
        self.wait_ready(base)?;

        Ok(())
    }

    fn identify_drive(&self, channel: u8, is_master: bool) -> Result<(), DriverError> {
        let base = if channel == 0 { self.primary_base } else { self.secondary_base };
        let drive_select = if is_master { 0xA0 } else { 0xB0 };

        unsafe {
            // 选择驱动器
            x86_64::instructions::port::Port::new(base + 6).write(drive_select);
            
            // 清空寄存器
            x86_64::instructions::port::Port::new(base + 2).write(0);
            x86_64::instructions::port::Port::new(base + 3).write(0);
            x86_64::instructions::port::Port::new(base + 4).write(0);
            x86_64::instructions::port::Port::new(base + 5).write(0);
            
            // 发送IDENTIFY命令
            x86_64::instructions::port::Port::new(base + 7).write(0xEC);
        }

        // 检查状态
        let status: u8 = unsafe {
            x86_64::instructions::port::Port::new(base + 7).read()
        };

        if status == 0 {
            return Err(DriverError::InvalidDevice);
        }

        self.wait_data_ready(base)?;

        // 读取识别数据
        let mut identify_data = [0u16; 256];
        for i in 0..256 {
            identify_data[i] = unsafe {
                x86_64::instructions::port::Port::new(base).read()
            };
        }

        Ok(())
    }

    fn wait_ready(&self, base: u16) -> Result<(), DriverError> {
        let mut timeout = 10000;
        
        while timeout > 0 {
            let status: u8 = unsafe {
                x86_64::instructions::port::Port::new(base + 7).read()
            };
            
            if status & 0x80 == 0 && status & 0x40 != 0 {
                return Ok(());
            }
            
            timeout -= 1;
        }
        
        Err(DriverError::Timeout)
    }

    fn wait_data_ready(&self, base: u16) -> Result<(), DriverError> {
        let mut timeout = 10000;
        
        while timeout > 0 {
            let status: u8 = unsafe {
                x86_64::instructions::port::Port::new(base + 7).read()
            };
            
            if status & 0x08 != 0 {
                return Ok(());
            }
            
            timeout -= 1;
        }
        
        Err(DriverError::Timeout)
    }
}
```

## 🌐 网络设备驱动

### 简单的网卡驱动框架
```rust
pub struct NetworkDriver {
    base_address: usize,
    mac_address: [u8; 6],
    rx_buffer: *mut u8,
    tx_buffer: *mut u8,
}

impl NetworkDriver {
    pub fn new(base_address: usize) -> Self {
        NetworkDriver {
            base_address,
            mac_address: [0; 6],
            rx_buffer: core::ptr::null_mut(),
            tx_buffer: core::ptr::null_mut(),
        }
    }

    pub fn init(&mut self) -> Result<(), DriverError> {
        // 复位网卡
        self.reset()?;
        
        // 读取MAC地址
        self.read_mac_address()?;
        
        // 分配缓冲区
        self.allocate_buffers()?;
        
        // 配置网卡
        self.configure()?;
        
        // 启用中断
        self.enable_interrupts()?;
        
        Ok(())
    }

    pub fn send_packet(&self, data: &[u8]) -> Result<(), DriverError> {
        if data.len() > 1500 {
            return Err(DriverError::InvalidParameter);
        }

        // 等待发送缓冲区可用
        self.wait_tx_ready()?;

        // 复制数据到发送缓冲区
        unsafe {
            core::ptr::copy_nonoverlapping(
                data.as_ptr(),
                self.tx_buffer,
                data.len()
            );
        }

        // 设置数据包长度并发送
        self.write_register(0x10, data.len() as u32);
        self.write_register(0x14, 0x01); // 发送命令

        Ok(())
    }

    pub fn receive_packet(&self, buffer: &mut [u8]) -> Result<usize, DriverError> {
        // 检查是否有数据包
        let status = self.read_register(0x18);
        if status & 0x01 == 0 {
            return Ok(0); // 没有数据包
        }

        // 读取数据包长度
        let packet_length = self.read_register(0x1C) as usize;
        if packet_length > buffer.len() {
            return Err(DriverError::BufferFull);
        }

        // 复制数据包
        unsafe {
            core::ptr::copy_nonoverlapping(
                self.rx_buffer,
                buffer.as_mut_ptr(),
                packet_length
            );
        }

        // 标记数据包已处理
        self.write_register(0x18, 0x01);

        Ok(packet_length)
    }

    fn reset(&self) -> Result<(), DriverError> {
        self.write_register(0x00, 0x01);
        
        let mut timeout = 1000;
        while timeout > 0 {
            if self.read_register(0x00) & 0x01 == 0 {
                return Ok(());
            }
            timeout -= 1;
        }
        
        Err(DriverError::Timeout)
    }

    fn read_mac_address(&mut self) -> Result<(), DriverError> {
        for i in 0..6 {
            self.mac_address[i] = self.read_register(0x20 + i as u32) as u8;
        }
        Ok(())
    }

    fn allocate_buffers(&mut self) -> Result<(), DriverError> {
        // 简化实现：假设缓冲区已经分配
        self.rx_buffer = 0x100000 as *mut u8; // 1MB处
        self.tx_buffer = 0x101000 as *mut u8; // 1MB+4KB处
        Ok(())
    }

    fn configure(&self) -> Result<(), DriverError> {
        // 设置接收缓冲区地址
        self.write_register(0x30, self.rx_buffer as u32);
        
        // 设置发送缓冲区地址
        self.write_register(0x34, self.tx_buffer as u32);
        
        // 启用接收和发送
        self.write_register(0x38, 0x03);
        
        Ok(())
    }

    fn enable_interrupts(&self) -> Result<(), DriverError> {
        self.write_register(0x3C, 0xFF);
        Ok(())
    }

    fn wait_tx_ready(&self) -> Result<(), DriverError> {
        let mut timeout = 1000;
        while timeout > 0 {
            if self.read_register(0x14) & 0x01 == 0 {
                return Ok(());
            }
            timeout -= 1;
        }
        Err(DriverError::Timeout)
    }

    fn read_register(&self, offset: u32) -> u32 {
        unsafe {
            core::ptr::read_volatile((self.base_address + offset as usize) as *const u32)
        }
    }

    fn write_register(&self, offset: u32, value: u32) {
        unsafe {
            core::ptr::write_volatile((self.base_address + offset as usize) as *mut u32, value);
        }
    }
}
```

## 🔧 驱动管理器

### 设备管理系统
```rust
use alloc::{vec::Vec, boxed::Box};
use spin::Mutex;

pub trait Device {
    fn device_type(&self) -> DeviceType;
    fn device_id(&self) -> u32;
    fn init(&mut self) -> Result<(), DriverError>;
    fn read(&self, buffer: &mut [u8]) -> Result<usize, DriverError>;
    fn write(&self, buffer: &[u8]) -> Result<usize, DriverError>;
    fn ioctl(&self, command: u32, arg: usize) -> Result<usize, DriverError>;
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum DeviceType {
    Block,
    Character,
    Network,
    Input,
    Display,
}

pub struct DeviceManager {
    devices: Mutex<Vec<Box<dyn Device + Send + Sync>>>,
}

impl DeviceManager {
    pub fn new() -> Self {
        DeviceManager {
            devices: Mutex::new(Vec::new()),
        }
    }

    pub fn register_device(&self, device: Box<dyn Device + Send + Sync>) {
        let mut devices = self.devices.lock();
        devices.push(device);
    }

    pub fn find_device(&self, device_type: DeviceType) -> Option<u32> {
        let devices = self.devices.lock();
        for (index, device) in devices.iter().enumerate() {
            if device.device_type() == device_type {
                return Some(index as u32);
            }
        }
        None
    }

    pub fn read_device(&self, device_id: u32, buffer: &mut [u8]) -> Result<usize, DriverError> {
        let devices = self.devices.lock();
        if let Some(device) = devices.get(device_id as usize) {
            device.read(buffer)
        } else {
            Err(DriverError::InvalidDevice)
        }
    }

    pub fn write_device(&self, device_id: u32, buffer: &[u8]) -> Result<usize, DriverError> {
        let devices = self.devices.lock();
        if let Some(device) = devices.get(device_id as usize) {
            device.write(buffer)
        } else {
            Err(DriverError::InvalidDevice)
        }
    }
}

// 全局设备管理器
lazy_static! {
    pub static ref DEVICE_MANAGER: DeviceManager = DeviceManager::new();
}
```

---

*设备驱动开发是系统编程的重要组成部分，Rust让驱动开发更加安全可靠！🔌*
