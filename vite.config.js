import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { glob } from 'glob';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// 自动扫描 src/css、src/js 所有文件生成 entry
function autoGetEntries() {
  const entries = {};
  // 扫描css
  glob.sync('src/css/**/*.css').forEach((file) => {
    const match = file.match(/src[\\/]css[\\/](.+)\.css$/); // file.match(/src\/css\/(.+)\.css$/)
    // 只有匹配成功才处理
    if (!match) return;
    const name = match[1].replaceAll('/', '-');

    entries[name] = resolve(__dirname, file);
  });
  // 扫描js
  glob.sync('src/js/**/*.js').forEach((file) => {
    const match = file.match(/src[\\/]js[\\/](.+)\.js$/); // file.match(/src\/js\/(.+)\.js$/)
    if (!match) return;
    const name = match[1].replaceAll('/', '-');
    entries[name] = resolve(__dirname, file);
  });
  return entries;
}

export default defineConfig(({ mode }) => {
  const isBuild = mode === 'production';
  const entries = autoGetEntries();
  // 项目根目录统一转成正斜杠，消除Windows/macOS路径差异
  const projectRoot = resolve().replace(/\\/g, '/');
  console.log(projectRoot);
  return {
    root: __dirname,
    //  设为根目录会导致根目录所有文件都被当成静态资源原样返回，可能覆盖 Vite 的编译处理。
    // publicDir: resolve(__dirname),
    server: {
      host: '127.0.0.1',
      port: 3000,
      fs: {
        allow: [__dirname],
      },
      configureServer(server) {
        const shopifyProxy = createProxyMiddleware({
          target: 'http://127.0.0.1:9292',
          changeOrigin: true,
          ws: true,
        });

        server.middlewares.use((req, res, next) => {
          // 这些路径交给 Vite 自己处理，不转发
          if (
            req.url.startsWith('/src/') ||
            req.url.startsWith('/@vite/') ||
            req.url.startsWith('/@fs/') ||
            req.url.startsWith('/node_modules/')
          ) {
            return next();
          }
          // 其余全部转发给 Shopify
          return shopifyProxy(req, res, next);
        });
      },
    },
    plugins: [
      tailwindcss(),
      ViteImageOptimizer({
        disable: !isBuild, // 开发环境关闭压缩，提速热更新
        cache: false,
        png: { quality: 80 },
        jpeg: { quality: 75 },
        webp: { quality: 70 },
        avif: { quality: 65 },
        svg: {
          plugins: [
            { name: 'removeComments' },
            { name: 'removeMetadata' },
            { name: 'removeUselessStrokeAndFill' },
            { name: 'removeUnusedNS' },
          ],
        },
        exclude: (f) => {
          const size = fs.statSync(f).size;
          // 小于4KB的小图自动跳过压缩
          return size < 1024 * 100;
        },
      }),
    ],
    // 开发环境直接丢弃build配置，不写入assets，解决死循环
    build: isBuild
      ? {
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
        }
      : undefined,
  };
});
