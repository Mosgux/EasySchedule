# Windows 环境设置指南

## 🪟 Windows 开发环境快速设置

### 系统要求

- Windows 10/11 或 Windows Server 2012 R2+
- Node.js 18.19.0+
- Git for Windows
- PowerShell 5.1+ (推荐 PowerShell 7)

### 方法一：使用 PowerShell 脚本（推荐）

1. **打开 PowerShell（管理员模式）**

   ```powershell
   # 以管理员身份运行 PowerShell
   ```

2. **允许脚本执行**

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **运行设置脚本**

   ```powershell
   cd D:\AICode\EasySchedule
   .\scripts\setup-dev.ps1
   ```

4. **启动开发服务器**
   ```powershell
   npm run dev
   ```

### 方法二：手动设置

#### 1. 安装 Node.js

```powershell
# 检查 Node.js 是否已安装
node --version

# 如果未安装，访问 https://nodejs.org 下载 LTS 版本
```

#### 2. 安装依赖

```powershell
# 在项目根目录
npm install

# 后端依赖
cd backend
npm install

# 前端依赖
cd ..\frontend
npm install

# 共享模块依赖
cd ..\shared
npm install

# 返回根目录
cd ..
```

#### 3. 配置环境变量

```powershell
# 复制环境配置文件
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

#### 4. 初始化数据库

```powershell
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

#### 5. 启动服务

```powershell
# 返回根目录
cd ..
npm run dev
```

## 🚀 Windows 生产环境部署

### 使用 IIS 部署

#### 1. 安装 IIS 和必要模块

```powershell
# 启用 IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirect

# 安装 URL Rewrite 模块
# 下载：https://www.iis.net/downloads/microsoft/url-rewrite
```

#### 2. 安装 Node.js 和 iisnode

```powershell
# 下载安装 iisnode
# https://github.com/azure/iisnode/releases
```

#### 3. 运行部署脚本

```powershell
# 以管理员身份运行 PowerShell
cd D:\AICode\EasySchedule
.\scripts\deploy.ps1
```

#### 4. 配置 IIS 站点

创建 `web.config` 文件：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="dist/index.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="EasySchedule">
          <match url="/*" />
          <action type="Rewrite" url="dist/index.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode
      node_env="production"
      nodeProcessCountPerApplication="1"
      maxConcurrentRequestsPerProcess="1024"
      maxNamedPipeConnectionRetry="3"
      namedPipeConnectionRetryDelay="2000"
      maxNamedPipeConnectionPoolSize="512"
      maxNamedPipePooledConnectionAge="30000"
      asyncCompletionThreadCount="0"
      initialRequestBufferSize="4096"
      maxRequestBufferSize="65536"
      watchedFiles="*.js;iisnode.yml"
      uncFileChangesPollingInterval="5000"
      gracefulShutdownTimeout="60000"
      loggingEnabled="true"
      logDirectory="logs"
      debuggingEnabled="false"
      devErrorsEnabled="false"
    />
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="30000000" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

### 使用 NGINX 部署

#### 1. 安装 NGINX

```powershell
# 使用 Chocolatey 安装
choco install nginx

# 或手动下载：http://nginx.org/en/download.html
```

#### 2. 配置 NGINX

创建 `nginx.conf`：

```nginx
worker_processes  1;
error_log  logs/error.log;
pid        logs/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # 前端静态文件
    server {
        listen       80;
        server_name  localhost;

        location /EasySchedule {
            alias C:/inetpub/easyschedule/frontend/dist;
            try_files $uri $uri/ /EasySchedule/index.html;

            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API 反向代理
        location /EasySchedule/api {
            proxy_pass http://127.0.0.1:4000/api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## 🛠️ Windows 开发工具

### PowerShell 常用命令

```powershell
# 查看进程
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# 终止进程
Stop-Process -Name "node" -Force

# 查看端口占用
netstat -ano | findstr :4000

# 查看服务状态
Get-Service | Where-Object {$_.Name -like "*nginx*"}

# 重启服务
Restart-Service nginx

# 查看事件日志
Get-EventLog -LogName Application -Source "Node.js" -Newest 10
```

### 文件权限设置

```powershell
# 设置目录权限
icacls "C:\inetpub\easyschedule" /grant IIS_IUSRS:(OI)(CI)F

# 查看权限
icacls "C:\inetpub\easyschedule"
```

## 🔧 故障排除

### 常见问题

#### 1. PowerShell 脚本无法执行

```powershell
# 解决方案：设置执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. 端口被占用

```powershell
# 查看占用端口的进程
netstat -ano | findstr :4000

# 终止进程
taskkill /PID <进程ID> /F
```

#### 3. Node.js 版本问题

```powershell
# 使用 nvm-windows 管理版本
# 下载：https://github.com/coreybutler/nvm-windows

# 安装特定版本
nvm install 18.19.0
nvm use 18.19.0
```

#### 4. 数据库权限问题

```powershell
# 检查文件夹权限
icacls "backend\data"

# 修改权限
icacls "backend\data" /grant Users:(OI)(CI)F
```

#### 5. IIS 配置问题

```powershell
# 重置 IIS
%windir%\system32\inetsrv\appcmd recycle apppool "EasySchedule"

# 检查配置
%windir%\system32\inetsrv\appcmd list config
```

### 日志查看

#### 应用程序日志

```powershell
# 查看应用程序事件日志
Get-EventLog -LogName Application -Newest 20

# 筛选特定来源
Get-EventLog -LogName Application -Source "iisnode" -Newest 10
```

#### IIS 日志

```powershell
# IIS 日志通常位于
# C:\inetpub\logs\LogFiles\W3SVC1\

# 查看最新的日志文件
Get-ChildItem "C:\inetpub\logs\LogFiles\W3SVC1\" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 20
```

#### Node.js 应用日志

```powershell
# 查看应用日志
Get-Content "backend\logs\app.log" -Tail 50 -Wait

# 查看错误日志
Get-Content "backend\logs\error.log" -Tail 20
```

## 📊 性能监控

### Windows 性能监视器

```powershell
# 打开性能监视器
perfmon

# 添加计数器：
# - Processor\% Processor Time
# - Memory\Available MBytes
# - Network Interface\Bytes Total/sec
```

### 资源监控脚本

```powershell
# 创建资源监控脚本
while ($true) {
    Clear-Host
    Write-Host "EasySchedule 资源监控 - $(Get-Date)" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Gray

    # CPU 使用率
    $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue
    if ($cpu) {
        Write-Host "CPU 使用率: $($cpu.CounterSamples.CookedValue)%" -ForegroundColor Yellow
    }

    # 内存使用
    $memory = Get-Counter '\Memory\Available MBytes' -ErrorAction SilentlyContinue
    if ($memory) {
        $totalMemory = (Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1MB
        $usedMemory = $totalMemory - $memory.CounterSamples.CookedValue
        Write-Host "内存使用: $([math]::Round($usedMemory))MB / $([math]::Round($totalMemory))MB ($([math]::Round($usedMemory/$totalMemory*100))%)" -ForegroundColor Yellow
    }

    # Node.js 进程
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "Node.js 进程数: $($nodeProcesses.Count)" -ForegroundColor Cyan
        foreach ($process in $nodeProcesses) {
            Write-Host "  PID: $($process.Id), CPU: $([math]::Round($process.CPU))s, 内存: $([math]::Round($process.WorkingSet64/1MB))MB" -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host "按 Ctrl+C 停止监控..." -ForegroundColor Gray

    Start-Sleep -Seconds 5
}
```

## 🔄 自动化任务

### 使用 Windows 任务计划程序

```powershell
# 创建定时清理任务
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\inetpub\easyschedule\scripts\cleanup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
Register-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -TaskName "EasySchedule Cleanup" -Description "EasySchedule 定时清理任务" -User "SYSTEM"
```

### 备份脚本

```powershell
# backup.ps1
$source = "C:\inetpub\easyschedule"
$destination = "D:\backups\easyschedule_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$exclude = @("*.log", "node_modules", "*.tmp")

# 创建备份
Robocopy $source $destination /E /XD "node_modules" "logs" /XF *.log *.tmp /R:2 /W:5

# 清理旧备份（保留7天）
Get-ChildItem "D:\backups" | Where-Object {$_.CreationTime -lt (Get-Date).AddDays(-7)} | Remove-Item -Recurse -Force
```

---

这份 Windows 设置指南涵盖了从开发环境到生产部署的完整流程，针对 Windows 环境提供了专门的解决方案和故障排除方法。
