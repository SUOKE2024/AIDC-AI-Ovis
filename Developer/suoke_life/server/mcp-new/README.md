# 索克生活MCP服务器

基于Model Context Protocol的中医健康数据和知识管理服务

## 项目概述

索克生活MCP服务器是一个基于Node.js的微服务，提供中医健康数据和知识管理服务。它实现了Model Context Protocol (MCP)，统一了资源定义、API交互和数据模型。

主要功能模块包括：
- 健康数据服务：管理用户健康记录和体质信息
- 中医知识库：提供中医经典理论、方剂、药材等知识
- 诊断服务：提供舌诊、脉诊等中医诊断功能

## 安装与运行

### 环境要求
- Node.js 16+
- npm 8+

### 安装步骤
1. 克隆项目
```
git clone https://github.com/your-repo/suoke-mcp-server.git
cd suoke-mcp-server
```

2. 安装依赖
```
npm install
```

3. 配置环境变量
```
cp .env.example .env
```
根据需要修改`.env`文件中的配置

4. 运行服务
```
npm run dev  # 开发模式
npm start    # 生产模式
```

服务将在`http://localhost:3030`启动

## MCP资源和操作

### 资源发现
```
GET /mcp
```
返回可用资源列表

### 资源规范
```
GET /mcp/resources/{resourceId}
```
支持的资源：
- `health-data`: 健康数据服务
- `tcm-knowledge`: 中医知识库
- `diagnostic`: 诊断服务

### MCP统一操作接口
```
POST /mcp/operations
```

请求体示例：
```json
{
  "resourceId": "health-data",
  "actionId": "get-user-health",
  "params": {
    "userId": "123456",
    "dataType": "constitution"
  }
}
```

## API文档

### 健康数据服务
- `GET /health/constitutions` - 获取体质类型列表
- `GET /health/users/{userId}` - 获取用户健康数据
- `POST /health/users/{userId}` - 更新用户健康数据
- `POST /health/analyze-constitution` - 分析用户体质

### 中医知识库
- `GET /tcm/herbs` - 获取中药材列表
- `GET /tcm/formulas` - 获取方剂列表
- `GET /tcm/theories` - 获取理论知识
- `GET /tcm/search` - 搜索中医知识

### 诊断服务
- `GET /diagnostic/patterns` - 获取诊断模式
- `POST /diagnostic/analyze-tongue` - 舌诊分析
- `POST /diagnostic/analyze-pulse` - 脉诊分析

## 数据模型

### 用户健康数据
```json
{
  "userId": "string",
  "healthData": [
    {
      "id": "string",
      "type": "string",
      "value": "any",
      "timestamp": "string"
    }
  ]
}
```

### 体质信息
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "characteristics": ["string"],
  "healthAdvice": ["string"],
  "dietAdvice": ["string"]
}
```

## 开发与部署

### 项目结构
```
/src
  /api            - API路由定义
  /config         - 配置文件
  /controllers    - 业务逻辑控制器
  /lib            - 通用库和工具
  /resources      - 资源定义和数据
  /services       - 核心服务实现
  /utils          - 工具函数
  app.js          - 主程序入口
/logs             - 日志文件
```

### 贡献指南
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

仅供索克生活项目内部使用

## 联系方式

索克生活技术团队 - tech@suoke.life 