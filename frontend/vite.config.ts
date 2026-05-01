import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { normalizeLegacyEasyScheduleRequestPath } from './src/utils/easy_schedule_path';

function legacyEasySchedulePathRedirectPlugin(): Plugin {
  const handleRedirect = (
    url: string | undefined,
    res: {
      statusCode: number;
      setHeader(name: string, value: string): void;
      end(): void;
    },
    next: () => void
  ) => {
    if (!url) {
      next();
      return;
    }

    const normalizedUrl = normalizeLegacyEasyScheduleRequestPath(url);
    if (!normalizedUrl || normalizedUrl === url) {
      next();
      return;
    }

    res.statusCode = 302;
    res.setHeader('Location', normalizedUrl);
    res.end();
  };

  return {
    name: 'legacy-easy-schedule-path-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleRedirect(req.url, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handleRedirect(req.url, res, next);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), legacyEasySchedulePathRedirectPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
  base: '/',
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'www.neemo.tech',
      'neemo.tech',
      'schedule.neemo.tech',
      'localhost',
      '127.0.0.1',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
}));
