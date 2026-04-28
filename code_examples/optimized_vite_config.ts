// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    plugins: [
      // 使用 SWC 替代 Babel，更快地编译
      react({
        devTarget: 'es2020',
        plugins: isDevelopment
          ? [
              // 开发环境启用 React DevTools
              '@swc/plugin-react-refresh',
            ]
          : [],
      }),

      // 生产环境打包分析
      isProduction &&
        visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),

    // 路径别名配置
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@features': resolve(__dirname, 'src/features'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@services': resolve(__dirname, 'src/services'),
        '@stores': resolve(__dirname, 'src/stores'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@types': resolve(__dirname, 'src/types'),
        '@assets': resolve(__dirname, 'src/assets'),
      },
    },

    // 构建优化
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',

      // 启用 CSS 代码分割
      cssCodeSplit: true,

      // 压缩配置
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info'] : [],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
      },

      // 代码分割策略
      rollupOptions: {
        output: {
          // 手动代码分割
          manualChunks: {
            // React 核心库
            'react-core': ['react', 'react-dom', 'react-dom/client'],

            // 路由相关
            router: ['react-router-dom', '@remix-run/router'],

            // 状态管理和数据获取
            'state-management': [
              '@tanstack/react-query',
              '@tanstack/react-query-devtools',
              'zustand',
            ],

            // UI 组件库
            'ui-components': [
              '@headlessui/react',
              '@heroicons/react',
              'clsx',
              'tailwind-merge',
            ],

            // 时间和日期处理
            'date-utils': ['date-fns', 'date-fns-tz'],

            // 可视化和虚拟化
            visualization: [
              'd3',
              'react-window',
              '@tanstack/react-virtual',
              'react-window-infinite-loader',
            ],

            // 工具库
            utils: ['lodash-es', 'uuid'],

            // 开发工具（仅在开发环境）
            ...(isDevelopment
              ? {}
              : {
                  'dev-tools': ['@tanstack/react-query-devtools'],
                }),
          },

          // 文件命名策略
          chunkFileNames: chunkInfo => {
            const facadeModuleId = chunkInfo.facadeModuleId;
            if (facadeModuleId) {
              const fileName = facadeModuleId
                .split('/')
                .pop()
                ?.replace('.tsx', '');
              return `chunks/${fileName}-[hash].js`;
            }
            return 'chunks/[name]-[hash].js';
          },

          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: assetInfo => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];

            if (
              /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name || '')
            ) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            if (ext === 'css') {
              return `assets/css/[name]-[hash][extname]`;
            }

            return `assets/[name]-[hash][extname]`;
          },
        },

        // 外部依赖配置（如果需要 CDN）
        external: isProduction ? [] : [],
      },

      // 压缩时生成 source map
      sourcemap: isDevelopment ? true : 'hidden',

      // 构建报告
      reportCompressedSize: true,

      // 警告阈值
      chunkSizeWarningLimit: 1000,

      // 优化依赖预构建
      commonjsOptions: {
        include: [/node_modules/],
      },
    },

    // 依赖优化
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'date-fns',
        'clsx',
      ],
      exclude: [
        // 排除不需要预构建的包
      ],
    },

    // 开发服务器配置
    server: {
      port: 3000,
      host: true,
      open: true,
      cors: true,

      // 代理配置
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          // 重写路径
          rewrite: path => path.replace(/^\/api/, ''),
        },
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:8080',
          ws: true,
          changeOrigin: true,
        },
      },

      // HMR 配置
      hmr: {
        overlay: true,
      },

      // 文件监听
      watch: {
        usePolling: false,
        interval: 100,
      },
    },

    // 预览服务器配置
    preview: {
      port: 4173,
      host: true,
      open: true,
      cors: true,
    },

    // CSS 配置
    css: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
          // 生产环境启用 CSS 压缩
          ...(isProduction ? [require('cssnano')] : []),
        ],
      },

      // CSS 模块配置
      modules: {
        localsConvention: 'camelCase',
      },

      // 开发环境启用 CSS source maps
      devSourcemap: isDevelopment,
    },

    // 环境变量配置
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: isDevelopment,
      __PROD__: isProduction,
    },

    // ESBuild 配置
    esbuild: {
      // 生产环境移除 console 和 debugger
      drop: isProduction ? ['console', 'debugger'] : [],

      // 语法目标
      target: 'es2020',

      // 代码压缩
      minify: isProduction,

      // 保留类名（用于调试）
      keepNames: isDevelopment,
    },

    // 预览配置
    preview: {
      port: 4173,
      open: true,
    },

    // 实验性功能
    experimental: {
      // 启用构建优化
      renderBuiltUrl: (filename, { hostType }) => {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },
  };
});
