import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
   plugins: [react()],
   server: {
      host: 'localhost',
      port: 8080,
      watch: {
         usePolling: true,
      },
      proxy: {
         '/api': {
            target: process.env.VITE_SERVER_URL,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
         },
      },
   },
   resolve: {
      alias: {
         source: './source',
         components: './source/components',
         assets: './source/assets',
         hooks: './source/hooks',
         screens: './source/screens',

         bufferutil: 'bufferutil',
         'utf-8-validate': 'utf-8-validate',
      },
   },
});
