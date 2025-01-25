# Tron 交易扫描器
![Visitors](https://visitor-badge.laobi.icu/badge?page_id=laolaoshiren.tron-scanner)
![GitHub stars](https://img.shields.io/github/stars/laolaoshiren/tron-scanner?style=social)
![GitHub forks](https://img.shields.io/github/forks/laolaoshiren/tron-scanner?style=social)
![GitHub issues](https://img.shields.io/github/issues/laolaoshiren/tron-scanner)
![GitHub license](https://img.shields.io/github/license/laolaoshiren/tron-scanner)

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

## 常见问题

### 1. API 请求限制

如果遇到"获取最新区块失败：Request failed with status code 403"错误，这是由于 TRON 网络的 API 请求限制导致的。以下是完整的解决方案：

1. **使用智能限速功能**
   - 在设置中开启"智能限速"
   - 系统会自动调节请求频率，避免触发限制
   - 建议同时启用"自动重试"功能

2. **配置自己的节点**
   - 申请并使用自己的 TRON 节点（推荐方案）
   - 主网节点申请：[TRON 官方文档](https://developers.tron.network/)
   - 可以使用以下方式部署节点：
     * 使用 TRON 官方提供的云服务
     * 自行部署私有节点
     * 使用第三方节点服务提供商

3. **使用 API Key**
   - 在 TRON 官网申请 API Key
   - 配置 API Key 可以获得更高的请求限额
   - 支持设置多个 API Key 轮询使用

4. **优化请求策略**
   - 实现请求队列和延迟处理
   - 使用指数退避算法进行重试
   - 实现请求缓存机制
   - 按优先级处理请求

5. **负载均衡**
   - 配置多个节点地址
   - 系统自动在多个节点间切换
   - 支持节点健康检查
   - 自动剔除响应慢或不可用的节点

6. **调整扫描策略**
   - 减少并行扫描的线程数（建议 3-5 个）
   - 增加扫描间隔时间（建议 1-3 秒）
   - 避免频繁切换区块范围
   - 实现断点续传功能

7. **使用测试网**
   - 开发测试时使用 Shasta 或 Nile 测试网
   - 测试网没有严格的 API 限制
   - 可以用于功能验证和性能测试

8. **数据本地缓存**
   - 对已扫描的区块数据进行本地缓存
   - 支持离线查看历史数据
   - 减少重复请求
   - 定期清理过期缓存

### 最佳实践建议

1. **生产环境配置**
   - 部署私有节点
   - 使用多个 API Key
   - 配置负载均衡
   - 实现数据缓存

2. **开发测试配置**
   - 使用测试网
   - 启用智能限速
   - 控制并发数量
   - 实现请求重试

3. **大规模扫描**
   - 使用私有节点
   - 实现断点续传
   - 启用数据缓存
   - 多节点负载均衡

4. **实时监控**
   - 使用 API Key
   - 控制请求频率
   - 实现故障转移
   - 启用健康检查

### 2. 性能优化建议

1. **大范围扫描**
   - 建议分段扫描，每次不超过 10 万个区块
   - 使用 3-5 个并行线程
   - 开启智能限速功能

2. **实时监控**
   - 建议设置 3-5 秒的采集间隔
   - 关闭不必要的代币类型扫描
   - 适当设置过滤条件

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
