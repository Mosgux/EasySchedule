# SSL/HTTPS 配置指南

## 概述

本指南说明如何为 EasySchedule 配置 HTTPS 支持。

## 准备工作

1. 获取 SSL 证书（以下任一方式）：
   - 购买商业 SSL 证书
   - 使用 Let's Encrypt 免费证书
   - 生成自签名证书（仅用于测试）

## 目录结构

```
C:/apps/EasySchedule/
├── ssl/
│   ├── cert.pem      # SSL 证书文件
│   ├── key.pem       # SSL 私钥文件
│   └── chain.pem     # 证书链文件（如需要）
└── nginx/
    └── easyschedule.conf
```

## 生成自签名证书（测试用）

```bash
# 使用 OpenSSL 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout C:/apps/EasySchedule/ssl/key.pem \
    -out C:/apps/EasySchedule/ssl/cert.pem \
    -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
```

## 启用 HTTPS

1. 取消注释 `nginx/easyschedule.conf` 中的 HTTPS 配置
2. 修改域名配置：
   ```nginx
   server_name your-domain.com;
   ```
3. 更新证书路径：
   ```nginx
   ssl_certificate C:/apps/EasySchedule/ssl/cert.pem;
   ssl_certificate_key C:/apps/EasySchedule/ssl/key.pem;
   ```
4. 测试配置：
   ```bash
   nginx -t -c C:/apps/EasySchedule/nginx/easyschedule.conf
   ```
5. 重新加载 NGINX：
   ```bash
   nginx -s reload
   ```

## 常见问题

### 端口占用

如果 443 端口被占用，请检查：

```bash
netstat -an | findstr ":443 "
```

### 证书错误

- 确保证书文件存在且可读
- 检查证书格式是否正确（PEM）
- 验证私钥与证书匹配

### 浏览器警告

自签名证书会显示安全警告，这在测试环境中是正常的。

## 安全建议

1. 生产环境使用商业 SSL 证书
2. 定期更新证书
3. 使用强加密协议
4. 启用 HSTS（可选）

## 证书更新

当证书到期前，需要更新证书文件并重新加载 NGINX 配置。
