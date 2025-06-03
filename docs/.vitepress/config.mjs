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
      { text: 'Home', link: '/' },
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
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
