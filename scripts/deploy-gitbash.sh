#!/bin/bash

# EasySchedule Deployment Script for Windows Git Bash
# 简化版部署脚本，适用于 Windows Git Bash 环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}EasySchedule 部署脚本${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未安装 Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}[信息] Node.js 版本: $(node -v)${NC}"
echo -e "${GREEN}[信息] npm 版本: $(npm -v)${NC}"
echo ""

# 构建共享模块
echo -e "${YELLOW}[信息] 构建共享模块...${NC}"
cd shared
npm ci --silent --no-audit --no-fund
npm run build
cd "$PROJECT_ROOT"
echo -e "${GREEN}[成功] 共享模块构建完成${NC}"
echo ""

# 构建后端
echo -e "${YELLOW}[信息] 构建后端...${NC}"
cd backend
npm ci --silent --no-audit --no-fund
npm run build
cd "$PROJECT_ROOT"
echo -e "${GREEN}[成功] 后端构建完成${NC}"
echo ""

# 构建前端
echo -e "${YELLOW}[信息] 构建前端...${NC}"
cd frontend
npm ci --silent --no-audit --no-fund
npm run build
cd "$PROJECT_ROOT"
echo -e "${GREEN}[成功] 前端构建完成${NC}"
echo ""

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}[成功] 所有模块构建完成！${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo "启动项目："
echo "  npm run dev"
echo ""
