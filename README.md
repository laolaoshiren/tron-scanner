# Tron 交易扫描器

一个功能强大的 Tron 区块链交易扫描工具，支持多网络、多代币类型的交易备注扫描。

## 在线访问

- 主要访问地址：[https://tron-scanner.pages.dev](https://tron-scanner.pages.dev)

## 主要功能

### 基础功能
- 支持多网络切换（主网、Shasta测试网、Nile测试网）
- 支持多种代币类型扫描（TRX、TRC20、TRC721、TRC1155、TRC10）
- 支持正序和倒序扫描
- 实时显示最新区块信息
- 支持自定义区块范围扫描

### 智能过滤
- 支持交易备注关键词过滤
- 支持仅显示中文备注选项
- 支持钱包地址白名单/黑名单过滤
- 支持按发送方/接收方地址过滤

### 高级功能
- 智能合约地址检测和标注
- 并行扫描支持（最高支持20线程）
- 智能限速功能，自动调节扫描速度
- 自动采集功能，持续监控新区块
- 支持快速时间范围选择（今日、昨日、近7天、近15天）
- 支持快速区块数量选择（最近100/1000/1万/5万/10万/50万/100万个区块）

### 结果展示
- 实时显示扫描进度和状态
- 详细的交易信息展示（区块号、时间、交易哈希、发送方、接收方、金额、代币类型、备注等）
- 支持一键添加地址到白名单/黑名单
- 支持一键复制地址
- 支持直接跳转到区块浏览器查看详情

## 本地开发

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/yourusername/tron-scanner.git
cd tron-scanner
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 部署说明

### Cloudflare Pages 部署

1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

2. 登录到 Cloudflare
```bash
wrangler login
```

3. 构建项目
```bash
npm run build
```

4. 部署到 Cloudflare Pages
```bash
wrangler pages deploy dist
```

### 自定义域名配置

1. 登录 Cloudflare 控制面板
2. 进入 Pages 项目设置
3. 在"自定义域"部分添加您的域名
4. 按照提示配置 DNS 记录

### 更新部署

当需要更新网站时，执行以下命令：
```bash
npm run build
wrangler pages deploy dist
```

## 技术栈

- Vue 3 - 前端框架
- Element Plus - UI 组件库
- TronWeb - TRON 区块链交互
- Vite - 构建工具
- Cloudflare Pages - 部署平台

## 注意事项

1. 建议开启智能限速功能，避免请求过于频繁
2. 大范围扫描时建议使用并行扫描功能
3. 自动采集功能会持续监控新区块，请根据需要设置合适的采集间隔
4. 所有设置（除自动采集相关）都会自动保存到本地
5. Cloudflare Pages 免费版有一定的限制，请合理使用

## 更新日志

### 2024-01-13
- 优化了自动采集功能，支持累计扫描统计
- 调整了功能设置区域布局，提升用户体验
- 移除了状态保存对自动采集的影响
- 完成了 Cloudflare Pages 部署支持
- 优化了界面样式和响应式布局

## 开发计划

- [ ] 支持导出扫描结果
- [ ] 添加更多代币信息显示
- [ ] 支持自定义显示列
- [ ] 添加更多过滤条件
- [ ] 优化大量数据时的性能
- [ ] 添加多语言支持
- [ ] 集成更多区块链浏览器

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情 