import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        // Só o núcleo do React fica num bloco fixo (muda pouco, cache longo). O resto (PDF, mapa,
        // Socket.IO, animações...) segue a divisão natural: cada biblioteca vai junto da página que a usa
        // e o celular não baixa o que a tela aberta não precisa.
        manualChunks(id) {
          if (/node_modules[\/](react|react-dom|scheduler|react-router|react-router-dom)[\/]/.test(id)) return 'vendor-react';
        }
      }
    }
  }
});