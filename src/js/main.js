// src/js/main.js
import Alpine from 'alpinejs'
// 常用插件按需引入
import focus from '@alpinejs/focus'

// 挂载全局，调试面板可直接访问
window.Alpine = Alpine

// 注册插件
Alpine.plugin(focus)


// 开发环境配置
if(import.meta.env.mode === 'development') {
  // 屏蔽Shopify cart-sync CDN跨域脚本
  window.Shop = {
    loadFeatures: function() { return Promise.resolve() }
  }
  window.ShopifyAnalytics = {
    meta: { customer: { cart_sync: false } }
  } 
}

// 全局状态示例（购物车、弹窗通用）
document.addEventListener('alpine:init', () => {
  // 全局弹窗状态
  Alpine.store('ui', {
    drawerOpen: false,
    modalOpen: false
  })

  // 购物车全局状态示例
  Alpine.store('cart', {
    items: [],
    count: 0,
    async refresh() {
      const res = await fetch('/cart.js')
      const cart = await res.json()
      console.log('cart', cart)
      this.items = cart.items
      this.count = cart.item_count
    }
  })
})
// 启动Alpine，仅执行一次
Alpine.start()

// 其他业务JS、Shopify事件监听写下方
document.addEventListener('shopify:section:load', () => {
  // Shopify主题编辑器拖拽区块后自动重渲染Alpine
  Alpine.initTree(document.body)
})

