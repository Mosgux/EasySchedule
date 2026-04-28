# 部署配置和 Docker 文件

## 多阶段构建 Dockerfile

```dockerfile
# Dockerfile
# 多阶段构建，优化镜像大小和安全性
FROM node:18-alpine AS dependencies

# 安装构建依赖
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖和源代码
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine AS runner

# 安装运行时依赖
RUN apk add --no-cache curl

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY mime.types /etc/nginx/mime.types

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制环境变量脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 暴露端口
EXPOSE 80

# 使用非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# 启动脚本
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

## Nginx 配置文件

```nginx
# nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Brotli 压缩（如果支持）
    # brotli on;
    # brotli_comp_level 6;
    # brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 速率限制
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.example.com wss://api.example.com;" always;

    # 上游服务器配置
    upstream backend {
        server backend:8080;
        keepalive 32;
    }

    # 限流配置
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Cache-Status "STATIC";
            try_files $uri =404;
        }

        # HTML 文件不缓存
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            try_files $uri =404;
        }

        # API 代理
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 缓存配置
            proxy_cache_bypass $http_upgrade;
            proxy_no_cache $http_upgrade;

            # 超时配置
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket 代理
        location /ws/ {
            proxy_pass http://backend/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket 特殊配置
            proxy_buffering off;
            proxy_cache off;
        }

        # 登录接口限流
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;

            proxy_pass http://backend/auth/login;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Service Worker
        location /sw.js {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Service-Worker-Allowed "/";
            try_files $uri =404;
        }

        # Manifest 文件
        location /manifest.json {
            expires 1d;
            add_header Cache-Control "public";
            try_files $uri =404;
        }

        # SPA 路由支持
        location / {
            try_files $uri $uri/ /index.html;

            # 添加安全头
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header X-XSS-Protection "1; mode=block" always;
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # 错误页面
        error_page 404 /index.html;
        error_page 500 502 503 504 /50x.html;

        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

## Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端应用
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - '3000:80'
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://localhost:8080/api
      - VITE_WS_URL=ws://localhost:8080/ws
    depends_on:
      - backend
      - redis
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # 后端 API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - '8080:8080'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/easyschedule
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=http://localhost:3000
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/health']
      interval: 30s
      timeout: 10s
      retries: 3

  # 数据库
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=easyschedule
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U user -d easyschedule']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

  # Nginx 负载均衡器
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
      - backend
    networks:
      - app-network
    restart: unless-stopped

  # 监控 - Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - app-network
    restart: unless-stopped

  # 监控 - Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - '3001:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  app-network:
    driver: bridge
```

## 部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

# 配置变量
ENVIRONMENT=${1:-production}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo "🚀 开始部署 EasySchedule 到 $ENVIRONMENT 环境..."

# 检查必要的环境变量
check_env_vars() {
    local required_vars=("JWT_SECRET" "REDIS_PASSWORD" "GRAFANA_PASSWORD")

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ 错误: 环境变量 $var 未设置"
            exit 1
        fi
    done
}

# 构建和推送镜像
build_and_push() {
    echo "📦 构建 Docker 镜像..."

    # 构建应用镜像
    docker build -t $DOCKER_REGISTRY/easyschedule:$IMAGE_TAG .

    # 推送镜像
    echo "📤 推送镜像到仓库..."
    docker push $DOCKER_REGISTRY/easyschedule:$IMAGE_TAG

    echo "✅ 镜像构建和推送完成"
}

# 健康检查
health_check() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "🏥 检查 $service 健康状态..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f $url > /dev/null 2>&1; then
            echo "✅ $service 健康检查通过"
            return 0
        fi

        echo "⏳ $service 健康检查失败，重试 $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done

    echo "❌ $service 健康检查失败"
    return 1
}

# 部署到服务器
deploy() {
    echo "🎯 部署应用..."

    # 更新 docker-compose.yml 中的镜像标签
    sed -i "s|image: easyschedule:latest|image: $DOCKER_REGISTRY/easyschedule:$IMAGE_TAG|g" docker-compose.yml

    # 拉取最新镜像
    docker-compose -f docker-compose.yml pull

    # 停止旧容器
    docker-compose -f docker-compose.yml down

    # 启动新容器
    docker-compose -f docker-compose.yml up -d

    echo "⏳ 等待服务启动..."
    sleep 30

    # 健康检查
    health_check "前端应用" "http://localhost:3000/health"
    health_check "后端API" "http://localhost:8080/health"

    echo "✅ 部署完成"
}

# 清理旧镜像
cleanup() {
    echo "🧹 清理旧镜像..."

    # 清理悬空镜像
    docker image prune -f

    # 清理旧的构建缓存
    docker builder prune -f

    echo "✅ 清理完成"
}

# 回滚函数
rollback() {
    echo "🔄 开始回滚..."

    # 获取前一个镜像标签
    local previous_tag=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep easyschedule | head -2 | tail -1 | cut -d: -f2)

    if [ -z "$previous_tag" ]; then
        echo "❌ 找不到前一个镜像版本"
        exit 1
    fi

    echo "📦 回滚到版本: $previous_tag"

    # 更新 docker-compose.yml
    sed -i "s|image: $DOCKER_REGISTRY/easyschedule:.*|image: $DOCKER_REGISTRY/easyschedule:$previous_tag|g" docker-compose.yml

    # 重新部署
    docker-compose -f docker-compose.yml down
    docker-compose -f docker-compose.yml up -d

    echo "✅ 回滚完成"
}

# 主流程
main() {
    check_env_vars

    case $ENVIRONMENT in
        "production")
            build_and_push
            deploy
            cleanup
            ;;
        "rollback")
            rollback
            ;;
        *)
            echo "❌ 未知环境: $ENVIRONMENT"
            echo "用法: $0 [production|rollback]"
            exit 1
            ;;
    esac

    echo "🎉 EasySchedule 部署完成！"
    echo "🌐 前端地址: http://localhost:3000"
    echo "📊 监控面板: http://localhost:3001 (admin/GRAFANA_PASSWORD)"
}

# 错误处理
trap 'echo "❌ 部署失败"; exit 1' ERR

# 执行主流程
main "$@"
```

## 环境变量配置

```bash
# .env.production
# 应用配置
NODE_ENV=production
VITE_API_URL=https://api.easyschedule.com
VITE_WS_URL=wss://api.easyschedule.com/ws

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-here
REDIS_PASSWORD=your-redis-password-here
GRAFANA_PASSWORD=your-grafana-password-here

# 数据库配置
DATABASE_URL=postgresql://user:password@postgres:5432/easyschedule

# 邮件配置（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# 监控配置
SENTRY_DSN=https://your-sentry-dsn-here
PROMETHEUS_ENABLED=true

# SSL 配置（可选）
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

## Kubernetes 配置

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: easyschedule-frontend
  labels:
    app: easyschedule-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: easyschedule-frontend
  template:
    metadata:
      labels:
        app: easyschedule-frontend
    spec:
      containers:
        - name: frontend
          image: your-registry.com/easyschedule:latest
          ports:
            - containerPort: 80
          env:
            - name: NODE_ENV
              value: 'production'
            - name: VITE_API_URL
              value: 'https://api.easyschedule.com'
          resources:
            requests:
              memory: '64Mi'
              cpu: '50m'
            limits:
              memory: '128Mi'
              cpu: '100m'
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: easyschedule-frontend-service
spec:
  selector:
    app: easyschedule-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: easyschedule-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
    nginx.ingress.kubernetes.io/rate-limit-window: '1m'
spec:
  tls:
    - hosts:
        - easyschedule.com
      secretName: easyschedule-tls
  rules:
    - host: easyschedule.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: easyschedule-frontend-service
                port:
                  number: 80
```

这个完整的部署配置包含了从开发到生产环境的所有必要组件，确保应用的高可用性、安全性和可扩展性。
