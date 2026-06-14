import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

const deleteOldCss = {
  buildStart() {
    const cssPath = path.resolve(__dirname, 'assets/tailwind.min.css');
    if (fs.existsSync(cssPath)) {
      fs.unlinkSync(cssPath);
    }
  },
};

export default defineConfig({
  plugins: [deleteOldCss, tailwindcss()],
  build: {
    emptyOutDir: false,
    outDir: 'assets',
    rollupOptions: {
      input: './src/css/tailwind.css',
      output: {
        assetFileNames: 'tailwind.min.css',
      },
    },
  },
});
