import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "笔记本",
  description: "笔记本",
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
    logo: 'logo.svg',
    nav: [
      { text: '🏠 首页', link: '/' },
      { text: 'AI导航', link: '/ai/nav' },
      {
        text: '编程语言',
        items: [
          {
            text: 'Rust',
            link: '/rust/introduction'
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
      }
    ],

    sidebar: {
      '/docker/': [
        {
          text: 'Docker 快速上手',
          items: [
            { text: '介绍', link: '/docker/intro' },
            { text: '安装', link: '/docker/install' },
            { text: '常用 docker-compose 配置', link: '/docker/docker-compose-yaml' }
          ]
        },
        {
          text: 'Docker 进阶',
          items: [
            { text: '介绍', link: '/docker/intro' },
            { text: '常用 docker-compose 配置', link: '/docker/docker-compose-yaml' }
          ]
        }
      ],
      '/caddy2/': [
        {
          text: 'Caddy2 快速上手',
          items: [
            { text: '介绍', link: '/caddy2/intro' },
            { text: '常用配置', link: '/caddy2/config' }
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
            { text: '系统编程', link: '/rust/systems-programming' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
