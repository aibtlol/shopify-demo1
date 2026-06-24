// import { defineConfig } from 'vite';
// import tailwindcss from '@tailwindcss/vite';
// import fs from 'fs';
// import path from 'path';

// const deleteOldCss = {
//   buildStart() {
//     const cssPath = path.resolve(__dirname, 'assets/tailwind.min.css');
//     if (fs.existsSync(cssPath)) {
//       fs.unlinkSync(cssPath);
//     }
//   },
// };

// export default defineConfig({
//   plugins: [deleteOldCss, tailwindcss()],
//   build: {
//     emptyOutDir: false,
//     outDir: 'assets',
//     // cssCodeSplit: false,
//     rollupOptions: {
//       input: './src/css/tailwind.css',
//       output: {
//         assetFileNames: 'theme.min.css',
//       },
//     },
//     // rollupOptions: {
//     //   // 多CSS入口：key为输出文件名前缀，value为源文件路径
//     //   input: {
//     //     theme: resolve(__dirname, 'src/css/theme.css'),
//     //     product: resolve(__dirname, 'src/css/product.css'),
//     //     collection: resolve(__dirname, 'src/css/collection.css'),
//     //     cart: resolve(__dirname, 'src/css/cart.css'),
//     //   },
//     //   output: {
//     //     // 动态命名：[name] 取自input的key，生成 theme.min.css / product.min.css
//     //     assetFileNames: '[name].min.[ext]',
//     //     dir: resolve(__dirname, 'assets'),
//     //   },
//     // },
//   },
// });
import { defineConfig } from 'vite'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite';
import { createProxyMiddleware } from 'http-proxy-middleware'
import { glob } from 'glob'

// 自动扫描 src/css、src/js 所有文件生成 entry
function autoGetEntries() {
  const entries = {}
  // 扫描css
  glob.sync('src/css/**/*.css').forEach(file => {
    const match = file.match(/src[\\/]css[\\/](.+)\.css$/) // file.match(/src\/css\/(.+)\.css$/)
    // 只有匹配成功才处理
    if (!match) return
    const name = match[1].replaceAll('/', '-')

    entries[name] = resolve(__dirname, file)
  })
  // 扫描js
  glob.sync('src/js/**/*.js').forEach(file => {
    const match = file.match(/src[\\/]js[\\/](.+)\.js$/) // file.match(/src\/js\/(.+)\.js$/)
    if (!match) return
    const name = match[1].replaceAll('/', '-')
    entries[name] = resolve(__dirname, file)
  })
  return entries
}

export default defineConfig(({ mode }) => {
  const isBuild = mode === 'production'
  const entries = autoGetEntries()

  return {
    root: __dirname,
    //  设为根目录会导致根目录所有文件都被当成静态资源原样返回，可能覆盖 Vite 的编译处理。
    // publicDir: resolve(__dirname),
    publicDir: false,
    server: {
      host: '127.0.0.1',
      port: 3000,
      fs: {
        allow: [__dirname]
      },
      configureServer(server) {
        const shopifyProxy = createProxyMiddleware({
          target: 'http://127.0.0.1:9292',
          changeOrigin: true,
          ws: true
        })

        server.middlewares.use((req, res, next) => {
          // 这些路径交给 Vite 自己处理，不转发
          if (
            req.url.startsWith('/src/') ||
            req.url.startsWith('/@vite/') ||
            req.url.startsWith('/@fs/') ||
            req.url.startsWith('/node_modules/')
          ) {
            return next()
          }
          // 其余全部转发给 Shopify
          return shopifyProxy(req, res, next)
        })
      }
    },
    plugins: [tailwindcss()],
    // 开发环境直接丢弃build配置，不写入assets，解决死循环
    build: isBuild ? {
      emptyOutDir: false,
      outDir: resolve(__dirname, 'assets'),
      rollupOptions: {
        input: entries,
        output: {
          entryFileNames: '[name].min.js',
          // 输出：xxx.min.css / xxx.min.js
          assetFileNames: '[name].min.[ext]',
        },
        // 关闭JS公共代码拆分，不会生成chunk文件
        preserveModules: false,
        external: [],
      },
    } : undefined,
  }
})