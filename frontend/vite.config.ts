import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const EASY_SCHEDULE_BASE_PATH = '/EasySchedule';
const EASY_SCHEDULE_PUBLIC_BASE_PATH = `${EASY_SCHEDULE_BASE_PATH}/`;

function normalizeEasyScheduleRequestPath(requestPath: string): string | null {
  const [pathname, search = ''] = requestPath.split('?', 2);
  const match = pathname.match(/^\/easyschedule(?:\/+(.*))?\/?$/i);

  if (!match) {
    return null;
  }

  const rawRemainder = match[1] ?? '';
  const normalizedRemainder = rawRemainder.split('/').filter(Boolean).join('/');

  const normalizedPath = normalizedRemainder
    ? `${EASY_SCHEDULE_BASE_PATH}/${normalizedRemainder}`
    : EASY_SCHEDULE_PUBLIC_BASE_PATH;

  return search ? `${normalizedPath}?${search}` : normalizedPath;
}

function easySchedulePathRedirectPlugin(): Plugin {
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

    const normalizedUrl = normalizeEasyScheduleRequestPath(url);
    if (!normalizedUrl || normalizedUrl === url) {
      next();
      return;
    }

    res.statusCode = 302;
    res.setHeader('Location', normalizedUrl);
    res.end();
  };

  return {
    name: 'easy-schedule-path-redirect',
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
export default defineConfig({
  plugins: [react(), easySchedulePathRedirectPlugin()],
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
  base: EASY_SCHEDULE_PUBLIC_BASE_PATH,
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['www.neemo.tech', 'neemo.tech', 'localhost', '127.0.0.1'],
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
    sourcemap: true,
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
});
