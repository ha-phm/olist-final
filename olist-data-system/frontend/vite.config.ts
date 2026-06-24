import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),  // ✅ Fix alias
        'react': path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
    },
    server: {
      port: 5173,
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            host: 'localhost',  // ✅ Chỉ định rõ host cho WebSocket
            port: 5173,
            protocol: 'ws',
          },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
      
        }
      }
    },
  };
});