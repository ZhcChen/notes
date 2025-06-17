import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "笔记本",
  description: "笔记本",

  // 构建配置
  vite: {
    build: {
      // 调整 chunk 大小警告阈值到 1.5MB，避免不必要的警告
      chunkSizeWarningLimit: 1500
    }
  },

  markdown: {
    // 配置 Shiki 语法高亮
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    // 语言别名配置
    languageAlias: {
      'caddyfile': 'nginx',
      'caddy': 'nginx',
      'Caddyfile': 'nginx',
      'dockerignore': 'txt',
      '.dockerignore': 'txt',
      'dockerfile': 'docker',
      'Dockerfile': 'docker',
      'docker-compose': 'yaml',
      'compose': 'yaml',
      'env': 'bash',
      '.env': 'bash'
    }
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    outline: {
      label: '本页目录'
    },
    search: {
      provider: 'local'
    },
    locales: {
      root: {
        label: '简体中文',
        lang: 'zh-CN'
      }
    },
    logo: '/logo.svg',
    nav: [
      { text: '🏠 首页', link: '/' },
      { text: 'AI导航', link: '/ai/nav' },
      {
        text: '编程语言',
        items: [
          {
            text: 'Rust',
            link: '/rust/introduction'
          },
          {
            text: 'Kotlin',
            link: '/kotlin/introduction'
          },
          {
            text: 'Android',
            link: '/android/introduction'
          },
          {
            text: 'Java',
            link: '/java/introduction'
          }
        ]
      },
      {
        text: '容器',
        items: [
          {
            text: 'Docker',
            link: '/docker/intro'
          }
        ]
      },
      {
        text: 'Web 服务器',
        items: [
          {
            text: 'Nginx',
            link: '/nginx/intro'
          },
          {
            text: 'Caddy2',
            link: '/caddy2/intro'
          }
        ]
      },
      {
        text: '数据库',
        items: [
          {
            text: 'Redis',
            link: '/redis/intro'
          }
        ]
      }
    ],

    sidebar: {
      '/docker/': [
        {
          text: '🚀 快速上手',
          items: [
            { text: 'Docker 简介', link: '/docker/intro' },
            { text: '环境安装', link: '/docker/install' },
            { text: '常用 Docker Compose 配置', link: '/docker/docker-compose-yaml' }
          ]
        },
        {
          text: '🛠️ Docker 基础',
          items: [
            { text: '基础命令', link: '/docker/commands' },
            { text: 'Dockerfile 指南', link: '/docker/dockerfile' },
            { text: '镜像管理', link: '/docker/images' }
          ]
        },
        {
          text: '🔧 Docker 进阶',
          items: [
            { text: '网络配置', link: '/docker/networking' },
            { text: '存储管理', link: '/docker/storage' },
            { text: '多阶段构建', link: '/docker/multi-stage' },
            { text: '容器编排', link: '/docker/orchestration' },
            { text: 'Docker Compose 进阶', link: '/docker/compose-advanced' }
          ]
        },
        {
          text: '📊 运维监控',
          items: [
            { text: '日志管理', link: '/docker/logging' },
            { text: '监控告警', link: '/docker/monitoring' },
            { text: '健康检查', link: '/docker/health-check' }
          ]
        },
        {
          text: '🏆 最佳实践',
          items: [
            { text: '安全实践', link: '/docker/security' },
            { text: '性能优化', link: '/docker/performance' },
            { text: '生产部署', link: '/docker/production' }
          ]
        }
      ],
      '/caddy2/': [
        {
          text: 'Caddy2 基础入门',
          items: [
            { text: '简介', link: '/caddy2/intro' },
            { text: '安装与配置', link: '/caddy2/install' },
            { text: '配置详解', link: '/caddy2/config' }
          ]
        },
        {
          text: 'Caddy2 核心功能',
          items: [
            { text: '静态文件服务', link: '/caddy2/static-files' },
            { text: '反向代理', link: '/caddy2/reverse-proxy' },
            { text: '自动 HTTPS', link: '/caddy2/https' },
            { text: '负载均衡', link: '/caddy2/load-balancing' }
          ]
        },
        {
          text: 'Caddy2 高级特性',
          items: [
            { text: '中间件使用', link: '/caddy2/middleware' },
            { text: '安全配置', link: '/caddy2/security' },
            { text: '性能优化', link: '/caddy2/performance' }
          ]
        },
        {
          text: 'Caddy2 部署运维',
          items: [
            { text: 'Docker 部署', link: '/caddy2/docker' },
            { text: '实战案例', link: '/caddy2/examples' }
          ]
        }
      ],
      '/nginx/': [
        {
          text: 'Nginx 基础入门',
          items: [
            { text: '简介', link: '/nginx/intro' },
            { text: '安装与配置', link: '/nginx/install' },
            { text: '配置文件详解', link: '/nginx/config' },
            { text: '基础使用', link: '/nginx/basic-usage' }
          ]
        },
        {
          text: 'Nginx 核心功能',
          items: [
            { text: '静态文件服务', link: '/nginx/static-files' },
            { text: '反向代理', link: '/nginx/reverse-proxy' },
            { text: '负载均衡', link: '/nginx/load-balancing' },
            { text: 'SSL/HTTPS', link: '/nginx/ssl-https' }
          ]
        },
        {
          text: 'Nginx 高级特性',
          items: [
            { text: '模块系统', link: '/nginx/modules' },
            { text: '安全配置', link: '/nginx/security' },
            { text: '性能优化', link: '/nginx/performance' },
            { text: '监控日志', link: '/nginx/monitoring' }
          ]
        },
        {
          text: 'Nginx 部署运维',
          items: [
            { text: 'Docker 部署', link: '/nginx/docker' },
            { text: '实战案例', link: '/nginx/examples' },
            { text: '迁移指南', link: '/nginx/migration' }
          ]
        }
      ],
      '/rust/': [
        {
          text: 'Rust 基础入门',
          items: [
            { text: '介绍', link: '/rust/introduction' },
            { text: '安装与环境配置', link: '/rust/installation' },
            { text: '第一个 Rust 程序', link: '/rust/hello-world' },
            { text: '基本语法', link: '/rust/basic-syntax' },
            { text: '变量与数据类型', link: '/rust/variables-types' },
            { text: '函数', link: '/rust/functions' }
          ]
        },
        {
          text: 'Rust 核心概念',
          items: [
            { text: '所有权系统', link: '/rust/ownership' },
            { text: '借用与引用', link: '/rust/borrowing' },
            { text: '切片', link: '/rust/slices' },
            { text: '结构体', link: '/rust/structs' },
            { text: '枚举与模式匹配', link: '/rust/enums' },
            { text: '模块系统', link: '/rust/modules' }
          ]
        },
        {
          text: 'Rust 进阶特性',
          items: [
            { text: '错误处理', link: '/rust/error-handling' },
            { text: '泛型', link: '/rust/generics' },
            { text: '特征 (Traits)', link: '/rust/traits' },
            { text: '生命周期', link: '/rust/lifetimes' },
            { text: '函数式编程', link: '/rust/functional' },
            { text: '智能指针', link: '/rust/smart-pointers' }
          ]
        },
        {
          text: 'Rust 实践应用',
          items: [
            { text: '并发编程', link: '/rust/concurrency' },
            { text: '异步编程', link: '/rust/async' },
            { text: '测试', link: '/rust/testing' },
            { text: '包管理 Cargo', link: '/rust/cargo' },
            { text: '宏编程', link: '/rust/macros' },
            { text: 'unsafe Rust', link: '/rust/unsafe' }
          ]
        },
        {
          text: 'Rust 生态与工具',
          items: [
            { text: '常用库推荐', link: '/rust/ecosystem' },
            { text: '开发工具', link: '/rust/tools' },
            { text: '性能优化', link: '/rust/performance' },
            { text: '最佳实践', link: '/rust/best-practices' },
            { text: 'Web 开发', link: '/rust/web-development' },
            {
              text: '系统编程',
              collapsed: false,
              items: [
                {
                  text: '系统编程概述',
                  link: '/rust/systems-programming/index'
                },
                {
                  text: '系统调用与接口',
                  link: '/rust/systems-programming/system-calls'
                },
                {
                  text: '内存管理',
                  link: '/rust/systems-programming/memory-management'
                },
                {
                  text: '文件系统操作',
                  link: '/rust/systems-programming/filesystem'
                },
                {
                  text: '指针与原始内存',
                  link: '/rust/systems-programming/raw-pointers'
                },
                {
                  text: 'FFI外部函数接口',
                  link: '/rust/systems-programming/ffi'
                },
                {
                  text: '内联汇编',
                  link: '/rust/systems-programming/inline-assembly'
                },
                {
                  text: '网络编程',
                  link: '/rust/systems-programming/networking'
                },
                {
                  text: '进程与线程管理',
                  link: '/rust/systems-programming/processes'
                },
                {
                  text: '信号处理',
                  link: '/rust/systems-programming/signals'
                },
                {
                  text: '嵌入式开发',
                  link: '/rust/systems-programming/embedded'
                },
                {
                  text: '操作系统开发',
                  link: '/rust/systems-programming/os-development'
                },
                {
                  text: '设备驱动开发',
                  link: '/rust/systems-programming/device-drivers'
                }
              ]
            }
          ]
        }
      ],
      '/kotlin/': [
        {
          text: 'Kotlin 基础入门',
          items: [
            { text: '介绍', link: '/kotlin/introduction' },
            { text: '安装与环境配置', link: '/kotlin/installation' },
            { text: '第一个 Kotlin 程序', link: '/kotlin/hello-world' },
            { text: 'Gradle 构建工具', link: '/kotlin/gradle' }
          ]
        },
        {
          text: 'Kotlin 基础语法',
          items: [
            { text: '变量与数据类型', link: '/kotlin/variables-types' },
            { text: '基础语法', link: '/kotlin/basic-syntax' },
            { text: '函数', link: '/kotlin/functions' },
            { text: '类与对象', link: '/kotlin/classes' },
            { text: '对象表达式与声明', link: '/kotlin/objects' }
          ]
        },
        {
          text: 'Kotlin 核心特性',
          items: [
            { text: '空安全', link: '/kotlin/null-safety' },
            { text: '集合框架', link: '/kotlin/collections' },
            { text: 'Lambda 表达式', link: '/kotlin/lambdas' },
            { text: '扩展函数', link: '/kotlin/extensions' }
          ]
        },
        {
          text: 'Kotlin 进阶特性',
          items: [
            { text: '泛型', link: '/kotlin/generics' },
            { text: '协程', link: '/kotlin/coroutines' },
            { text: '反射', link: '/kotlin/reflection' },
            { text: '注解', link: '/kotlin/annotations' }
          ]
        },
        {
          text: 'Kotlin 实践',
          items: [
            { text: '测试', link: '/kotlin/testing' },
            { text: '最佳实践', link: '/kotlin/best-practices' },
            { text: '性能优化', link: '/kotlin/performance' },
            { text: '开发工具', link: '/kotlin/tools' }
          ]
        },
        {
          text: 'Kotlin 应用开发',
          items: [
            { text: 'Android 开发', link: '/kotlin/android-development' },
            { text: 'Web 开发', link: '/kotlin/web-development' },
            { text: '多平台开发', link: '/kotlin/multiplatform' }
          ]
        }
      ],
      '/android/': [
        {
          text: 'Android 基础入门',
          items: [
            { text: '介绍', link: '/android/introduction' },
            { text: '开发环境搭建', link: '/android/environment-setup' },
            { text: '第一个 Android 应用', link: '/android/first-app' },
            { text: 'Android 项目结构', link: '/android/project-structure' },
            { text: 'Gradle 构建系统', link: '/android/gradle' }
          ]
        },
        {
          text: 'Android 基础开发',
          items: [
            { text: 'Activity 生命周期', link: '/android/activity-lifecycle' },
            { text: 'UI 布局基础', link: '/android/layouts' },
            { text: '常用 UI 组件', link: '/android/ui-components' },
            { text: '事件处理', link: '/android/event-handling' },
            { text: '资源管理', link: '/android/resources' },
            { text: 'Fragment 使用', link: '/android/fragments' }
          ]
        },
        {
          text: 'Android 核心特性',
          items: [
            { text: 'Intent 与组件通信', link: '/android/intents' },
            { text: '数据存储', link: '/android/data-storage' },
            { text: '网络请求', link: '/android/networking' },
            { text: '多媒体处理', link: '/android/multimedia' },
            { text: '权限管理', link: '/android/permissions' },
            { text: '服务与后台任务', link: '/android/services' }
          ]
        },
        {
          text: 'Android 进阶开发',
          items: [
            { text: '自定义 View', link: '/android/custom-views' },
            { text: '动画效果', link: '/android/animations' },
            { text: '架构模式 (MVVM/MVP)', link: '/android/architecture' },
            { text: 'Jetpack 组件', link: '/android/jetpack' },
            { text: '性能优化', link: '/android/performance' },
            { text: '内存管理', link: '/android/memory-management' }
          ]
        },
        {
          text: 'Android 实践应用',
          items: [
            { text: '调试技巧', link: '/android/debugging' },
            { text: '单元测试', link: '/android/testing' },
            { text: '应用发布', link: '/android/publishing' },
            { text: '最佳实践', link: '/android/best-practices' },
            { text: '常用第三方库', link: '/android/libraries' },
            { text: '开发工具推荐', link: '/android/tools' }
          ]
        }
      ],
      '/redis/': [
        {
          text: '🚀 基础入门',
          items: [
            { text: 'Redis 简介', link: '/redis/intro' },
            { text: '安装与配置', link: '/redis/install' },
            { text: '基础命令', link: '/redis/basic-commands' },
            { text: '配置文件详解', link: '/redis/config' }
          ]
        },
        {
          text: '🛠️ 数据结构',
          items: [
            { text: '字符串 (String)', link: '/redis/data-types/string' },
            { text: '哈希 (Hash)', link: '/redis/data-types/hash' },
            { text: '列表 (List)', link: '/redis/data-types/list' },
            { text: '集合 (Set)', link: '/redis/data-types/set' },
            { text: '有序集合 (Sorted Set)', link: '/redis/data-types/sorted-set' },
            { text: '高级数据结构', link: '/redis/advanced-data-types' }
          ]
        },
        {
          text: '🔧 核心功能',
          items: [
            { text: '持久化', link: '/redis/persistence' },
            { text: '事务', link: '/redis/transactions' },
            { text: '发布订阅', link: '/redis/pub-sub' },
            { text: 'Lua 脚本', link: '/redis/lua-scripts' },
            { text: '管道', link: '/redis/pipelining' }
          ]
        },
        {
          text: '🏗️ 高级特性',
          items: [
            { text: '主从复制', link: '/redis/replication' },
            { text: '哨兵模式', link: '/redis/sentinel' },
            { text: '集群模式', link: '/redis/cluster' },
            { text: '内存管理', link: '/redis/memory-optimization' },
            { text: '安全配置', link: '/redis/security' }
          ]
        },
        {
          text: '📊 监控运维',
          items: [
            { text: '性能调优', link: '/redis/performance-tuning' },
            { text: '日志分析', link: '/redis/logging' },
            { text: '备份与恢复', link: '/redis/backup-restore' },
            { text: '故障排除', link: '/redis/troubleshooting' }
          ]
        },
        {
          text: '🌐 实际应用与设计模式',
          items: [
            { text: '实际应用场景与设计模式', link: '/redis/use-cases' }
          ]
        },
        {
          text: '🔌 客户端库与集成',
          items: [
            { text: '客户端库与集成', link: '/redis/client-libraries' }
          ]
        },
        {
          text: '⚙️ 运维管理',
          items: [
            { text: '升级与维护', link: '/redis/upgrade-maintenance' }
          ]
        },
      ]
    '/java/': [
      {
        text: 'Java 文档',
        link: '/java/index'
      },
      {
        text: 'Java 简介',
        items: [
          { text: '什么是 Java？', link: '/java/introduction' },
          { text: 'Java 的历史、特性与优势', link: '/java/introduction' },
          { text: 'JVM、JRE 和 JDK 详解', link: '/java/jvm-jre-jdk' }
        ]
      },
      {
        text: '环境搭建',
        items: [
          { text: '安装 JDK', link: '/java/installation' },
          { text: '配置开发环境', link: '/java/environment-setup' },
          { text: '编写第一个 Java 程序', link: '/java/hello-world' }
        ]
      },
      {
        text: '基础语法与核心概念',
        items: [
          { text: '基本语法结构', link: '/java/basic-syntax' },
          { text: '变量与数据类型', link: '/java/variables-data-types' },
          { text: '运算符', link: '/java/operators' },
          { text: '控制流', link: '/java/control-flow' },
          { text: '方法', link: '/java/methods' },
          { text: '数组', link: '/java/arrays' }
        ]
      },
      {
        text: '面向对象编程 (OOP)',
        items: [
          { text: '类与对象', link: '/java/classes-objects' },
          { text: '构造器', link: '/java/constructors' },
          { text: '封装', link: '/java/encapsulation' },
          { text: '继承', link: '/java/inheritance' },
          { text: '多态', link: '/java/polymorphism' },
          { text: '抽象', link: '/java/abstraction' }
        ]
      },
      {
        text: '核心 API 与常用类',
        items: [
          { text: '字符串操作', link: '/java/string-manipulation' },
          { text: '包装类', link: '/java/wrapper-classes' },
          { text: '日期与时间 API', link: '/java/date-time-api' },
          { text: '文件 I/O 基础', link: '/java/file-io' }
        ]
      },
      {
        text: '集合框架 (Collections Framework)',
        items: [
          { text: '集合框架概览', link: '/java/collections-overview' },
          { text: 'List 接口', link: '/java/list' },
          { text: 'Set 接口', link: '/java/set' },
          { text: 'Map 接口', link: '/java/map' },
          { text: '迭代器', link: '/java/iterators' }
        ]
      },
      {
        text: '异常处理',
        items: [
          { text: '异常处理机制', link: '/java/exception-handling' },
          { text: 'try-catch-finally 语句', link: '/java/try-catch-finally' },
          { text: '自定义异常', link: '/java/custom-exceptions' }
        ]
      },
      {
        text: '并发与多线程',
        items: [
          { text: '并发编程简介', link: '/java/concurrency-intro' },
          { text: '线程的创建与管理', link: '/java/threads' },
          { text: '线程同步', link: '/java/synchronization' },
          { text: '线程池', link: '/java/thread-pools' }
        ]
      },
      {
        text: '泛型 (Generics)',
        items: [
          { text: '泛型基础与应用', link: '/java/generics' }
        ]
      },
      {
        text: '输入/输出 (I/O) 流',
        items: [
          { text: 'I/O 流分类与使用', link: '/java/io-streams' },
          { text: '对象序列化', link: '/java/serialization' }
        ]
      },
      {
        text: 'Java 数据库连接 (JDBC)',
        items: [
          { text: 'JDBC 基础与数据库操作', link: '/java/jdbc' }
        ]
      },
      {
        text: '构建工具',
        items: [
          { text: 'Maven', link: '/java/maven' },
          { text: 'Gradle', link: '/java/gradle' }
        ]
      },
      {
        text: '单元测试',
        items: [
          { text: 'JUnit 单元测试框架', link: '/java/junit' }
        ]
      },
      {
        text: '高级主题',
        items: [
          { text: '注解', link: '/java/annotations' },
          { text: '反射', link: '/java/reflection' },
          { text: 'Lambda 表达式与 Stream API', link: '/java/lambda-streams' },
          { text: '模块化系统', link: '/java/modules' },
          { text: '垃圾回收机制', link: '/java/garbage-collection' }
        ]
      },
      {
        text: 'Java Web 开发',
        items: [
          { text: 'Servlets 与 JSP 基础', link: '/java/servlets-jsp' },
          { text: 'Spring 框架', link: '/java/spring-framework' }
        ]
      },
      {
        text: '最佳实践与性能优化',
        items: [
          { text: 'Java 编程最佳实践', link: '/java/best-practices' },
          { text: '性能调优', link: '/java/performance-tuning' }
        ]
      }
    ]

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],

    // 页脚配置
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2025-present | <a href="https://beian.miit.gov.cn/" target="_blank">闽ICP备2025102426号-1</a>'
    }
  }
})
