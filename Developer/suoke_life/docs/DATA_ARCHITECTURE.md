# 索克生活APP数据架构设计文档

## 目录

1. [概述](#概述)
2. [整体架构](#整体架构)
3. [数据分层](#数据分层)
4. [本地数据库](#本地数据库)
5. [远程数据库和API](#远程数据库和api)
6. [数据同步机制](#数据同步机制)
7. [数据集与训练集](#数据集与训练集)
8. [知识库与知识图谱](#知识库与知识图谱)
9. [RAG系统架构](#rag系统架构)
10. [数据流与关系图](#数据流与关系图)
11. [安全与隐私](#安全与隐私)
12. [最佳实践](#最佳实践)

## 概述

索克生活APP采用Clean Architecture架构，实现了本地数据库与远程服务器的无缝集成，并通过知识库、知识图谱和RAG系统增强AI功能。该架构设计旨在提供离线支持、数据安全和智能交互能力。

## 整体架构

索克生活APP的数据架构分为以下几个主要组件：

1. **本地数据库**：基于SQLite，存储用户数据、健康记录和知识图谱
2. **远程数据库**：基于MySQL的服务器端数据库
3. **数据同步系统**：确保本地和远程数据一致性
4. **知识库系统**：包括文档索引、向量存储和检索
5. **知识图谱**：存储结构化知识和关系
6. **RAG系统**：检索增强生成，提高AI回复质量

## 数据分层

遵循Clean Architecture原则，数据相关代码按以下层次组织：

```
lib/
├── core/                           # 核心功能
│   ├── config/                     # 配置文件
│   ├── database/                   # 数据库核心组件
│   ├── network/                    # 网络请求组件
│   ├── storage/                    # 存储相关组件
│   └── sync/                       # 数据同步组件
├── data/                           # 数据层
│   ├── datasources/                # 数据源
│   │   ├── local/                  # 本地数据源
│   │   └── remote/                 # 远程数据源
│   ├── models/                     # 数据模型
│   └── repositories/               # 存储库实现
├── domain/                         # 领域层
│   ├── entities/                   # 领域实体
│   └── repositories/               # 存储库接口
└── ai_agents/                      # AI代理
    ├── models/                     # AI模型定义
    ├── rag/                        # 检索增强生成
    └── core/                       # AI核心组件
```

### 核心组件描述

- **领域实体(Entity)**：表示核心业务概念，不依赖框架
- **存储库接口(Repository Interface)**：定义数据操作的抽象接口
- **数据模型(Model)**：实现JSON序列化和与实体的转换
- **数据源(DataSource)**：提供数据访问功能，分为本地和远程
- **存储库实现(Repository Implementation)**：协调本地和远程数据源

## 本地数据库

### 数据库管理组件

- **DatabaseHelper**(`lib/core/database/database_helper.dart`)：
  - 数据库初始化和连接管理
  - 版本升级和数据迁移
  - 单例模式实现

- **DatabaseSchema**(`lib/core/database/database_schema.dart`)：
  - 表结构定义
  - SQL创建语句
  - 版本升级脚本

- **DatabaseService**(`lib/core/storage/database_service.dart`)：
  - 提供CRUD操作接口
  - 事务支持
  - 批量操作支持

### 主要数据表

1. **用户表(users)**
   ```sql
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     username TEXT NOT NULL,
     email TEXT,
     phone TEXT,
     avatar_url TEXT,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL,
     last_login INTEGER,
     account_type TEXT NOT NULL,
     sync_status TEXT DEFAULT 'pending'
   )
   ```

2. **健康数据表(health_data)**
   ```sql
   CREATE TABLE health_data (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     type TEXT NOT NULL,
     value REAL NOT NULL,
     unit TEXT NOT NULL,
     timestamp INTEGER NOT NULL,
     source TEXT,
     metadata TEXT,
     tags TEXT,
     notes TEXT,
     synced INTEGER NOT NULL DEFAULT 0,
     is_deleted INTEGER NOT NULL DEFAULT 0,
     FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
   )
   ```

3. **知识节点表(knowledge_nodes)**
   ```sql
   CREATE TABLE knowledge_nodes (
     id TEXT PRIMARY KEY,
     type TEXT NOT NULL,
     title TEXT NOT NULL,
     description TEXT,
     content TEXT,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL,
     metadata TEXT,
     embedding BLOB,
     language TEXT DEFAULT 'zh-CN'
   )
   ```

4. **节点关系表(node_relations)**
   ```sql
   CREATE TABLE node_relations (
     id TEXT PRIMARY KEY,
     source_node_id TEXT NOT NULL,
     target_node_id TEXT NOT NULL,
     relation_type TEXT NOT NULL,
     weight REAL,
     metadata TEXT,
     FOREIGN KEY (source_node_id) REFERENCES knowledge_nodes (id) ON DELETE CASCADE,
     FOREIGN KEY (target_node_id) REFERENCES knowledge_nodes (id) ON DELETE CASCADE
   )
   ```

5. **聊天消息表(chat_messages)**
   ```sql
   CREATE TABLE chat_messages (
     id TEXT PRIMARY KEY,
     chat_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     content TEXT NOT NULL,
     timestamp INTEGER NOT NULL,
     is_user INTEGER NOT NULL DEFAULT 1,
     message_type TEXT DEFAULT 'text',
     metadata TEXT,
     synced INTEGER NOT NULL DEFAULT 0,
     FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
   )
   ```

6. **聊天会话表(chat_history)**
   ```sql
   CREATE TABLE chat_history (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     title TEXT NOT NULL,
     agent_id TEXT,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL,
     is_pinned INTEGER DEFAULT 0,
     is_archived INTEGER DEFAULT 0,
     metadata TEXT
   )
   ```

## 远程数据库和API

索克生活APP通过RESTful API与后端服务器交互，主要组件：

### API客户端

- **ApiClient**(`lib/core/network/api_client.dart`)：
  - 基于Dio的HTTP客户端
  - 统一错误处理和请求拦截
  - 自动重试和身份验证

### 主要API端点

```dart
class ApiEndpoints {
  static const String baseUrl = 'http://118.31.223.213/api';
  static const String healthData = '/health-data';
  static const String users = '/users';
  static const String knowledge = '/knowledge';
  static const String chat = '/chat';
  static const String sync = '/sync';
}
```

### 远程数据源

- **远程健康数据源**(`lib/data/datasources/remote/health_data_remote_source.dart`)
- **远程知识库数据源**(`lib/data/datasources/remote/knowledge_remote_data_source.dart`)

### 环境配置

- **环境管理**(`lib/core/config/environment.dart`)
  ```dart
  enum EnvironmentType {
    dev,
    staging,
    prod,
  }
  ```

## 数据同步机制

### 同步管理器

- **SyncManager**(`lib/core/sync/sync_manager`)
  - 管理本地和远程数据同步
  - 支持多种同步触发机制
  - 处理冲突和错误

### 同步配置

```dart
class SyncConfig {
  final Duration interval;
  final int retryCount;
  final Duration retryDelay;
  final bool syncOnStartup;
  final bool syncOnNetworkChange;
}
```

### 同步流程

1. 初始化同步管理器
2. 监听网络变化
3. 设置定时同步
4. 检查未同步数据
5. 执行同步操作
6. 处理冲突和错误
7. 更新同步状态

## 数据集与训练集

索克生活APP使用多种高质量数据集进行知识图谱构建、模型训练和迭代升级。为支持这些功能，我们专门设计了数据集与训练集管理规范。

### 数据集类型

- **中医特色数据集**：包括四诊合参数据、中医知识体系和临床案例
- **多模态数据集**：包括生物声学数据、医学影像和方言文本数据
- **训练集与验证集**：用于AI模型微调和性能评估

### 表结构支持

为支持多模态数据集，数据库架构中增加了以下表结构：

```sql
CREATE TABLE datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,     -- 'tcm', 'western', 'multimodal', etc.
  sample_count INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata TEXT               -- 数据集详细信息
);

CREATE TABLE multimodal_data_samples (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  sample_type TEXT NOT NULL,  -- 'audio', 'image', 'text', 'sensor', etc.
  metadata TEXT NOT NULL,     -- JSON格式的详细元数据
  features TEXT,              -- 预提取的特征向量
  embedding BLOB,             -- 向量化表示
  storage_path TEXT NOT NULL, -- 文件存储路径
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  quality_score REAL,         -- 质量评分
  FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE
);
```

### 数据集与知识图谱的关系

多模态数据集为知识图谱提供了丰富的数据源，使知识图谱能够：

1. 将图像、声音等多模态数据与文本知识节点关联
2. 支持基于多模态输入的相似度检索
3. 为RAG系统提供更全面的知识背景

### 详细规范

关于数据集与训练集的详细管理规范，请参考 [数据集与训练集规范](DATASETS.md)，其中包含：

- 各类数据集的详细描述与规格
- 训练集构建方法
- 数据处理流程
- 质量控制措施
- 更新与版本控制

## 知识库与知识图谱

### 知识库架构

- **KnowledgeRepository**(`lib/domain/repositories/knowledge_repository.dart`)
  - 文档索引和检索
  - 文本嵌入向量生成
  - 相似度搜索

### 知识图谱架构

- **KnowledgeGraphRepository**(`lib/domain/repositories/knowledge_graph_repository.dart`)
  - 节点和关系管理
  - 图谱查询和遍历
  - 知识推理

### 向量存储

- **VectorStoreRepository**(`lib/domain/repositories/vector_store_repository.dart`)
  - 文档向量化存储
  - 相似度搜索
  - 集合管理

## RAG系统架构

### RAG服务

- **RAGService**(`lib/ai_agents/rag/rag_service.dart`)
  - 检索增强生成
  - 多种检索策略
  - 查询分解和优化

### RAG类型

```dart
enum RAGType {
  directRetrieval,      // 单步检索
  decompositionRetrieval, // 分解检索
  feedbackRetrieval,    // 反馈检索
  multiHop,             // 多跳检索
}
```

### RAG流程

1. 接收用户查询
2. 生成查询嵌入向量
3. 从向量存储中检索相关文档
4. 结合相关文档和原始查询
5. 生成增强回复

## 数据流与关系图

### 数据流图

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  用户界面层     │      │    领域层       │      │    数据层       │
│  (UI Layer)     │<─────┤  (Domain Layer) │<─────┤  (Data Layer)   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │                        │
                                 │                        │
                                 ▼                        ▼
                         ┌─────────────────┐      ┌─────────────────┐
                         │   存储库接口    │      │   存储库实现    │
                         │  (Repositories) │<─────┤  (Repositories) │
                         └─────────────────┘      └─────────────────┘
                                                         │
                                                         │
                                                         ▼
                                               ┌─────────────────────┐
                                               │      数据源         │
                                               │   (Data Sources)    │
                                               └─────────────────────┘
                                                 /               \
                                                /                 \
                                               ▼                   ▼
                                    ┌─────────────────┐   ┌─────────────────┐
                                    │   本地数据源    │   │   远程数据源    │
                                    │ (Local Sources) │   │(Remote Sources) │
                                    └─────────────────┘   └─────────────────┘
                                              │                   │
                                              │                   │
                                              ▼                   ▼
                                    ┌─────────────────┐   ┌─────────────────┐
                                    │   SQLite数据库  │   │   REST API      │
                                    └─────────────────┘   └─────────────────┘
```

### 知识库与AI代理关系

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    用户查询     │      │    RAG服务      │      │   知识库存储库  │
│  (User Query)   │─────>│  (RAG Service)  │─────>│(Knowledge Repo) │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │                        │
                                 │                        │
                                 ▼                        ▼
                         ┌─────────────────┐      ┌─────────────────┐
                         │   向量存储库    │      │   文本嵌入      │
                         │(Vector Store)   │<─────┤  (Embeddings)   │
                         └─────────────────┘      └─────────────────┘
                                 │
                                 │
                                 ▼
                         ┌─────────────────┐      ┌─────────────────┐
                         │   AI代理        │      │   知识图谱      │
                         │  (AI Agents)    │<─────┤(Knowledge Graph)│
                         └─────────────────┘      └─────────────────┘
                                 │
                                 │
                                 ▼
                         ┌─────────────────┐
                         │   生成回复      │
                         │  (Response)     │
                         └─────────────────┘
```

### 数据库表关系

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │ health_data │       │ health_plans│
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │<──┐   │ id          │       │ id          │
│ username    │   │   │ user_id     │───┐   │ user_id     │───┐
│ email       │   │   │ type        │   │   │ title       │   │
│ avatar_url  │   │   │ value       │   │   │ start_date  │   │
└─────────────┘   │   └─────────────┘   │   └─────────────┘   │
                  │                     │                     │
                  │   ┌─────────────┐   │   ┌─────────────┐   │
                  │   │chat_messages│   │   │life_records │   │
                  │   ├─────────────┤   │   ├─────────────┤   │
                  └───┤ user_id     │   │   │ user_id     │───┘
                      │ content     │   │   │ record_type │
                      │ timestamp   │   │   │ timestamp   │
                      └─────────────┘   │   └─────────────┘
                                        │
┌─────────────┐       ┌─────────────┐   │
│knowledge_nodes      │node_relations    │
├─────────────┤       ├─────────────┤   │
│ id          │<──┐   │ id          │   │
│ type        │   │   │ source_id   │───┘
│ title       │   │   │ target_id   │───┐
│ content     │   │   │ relation_type   │
└─────────────┘   │   └─────────────┘   │
                  │                     │
                  └─────────────────────┘
```

## 安全与隐私

### 数据加密

- **敏感数据加密**：使用`flutter_secure_storage`存储敏感信息
- **网络传输加密**：使用HTTPS协议
- **数据库字段加密**：敏感字段单独加密

### 访问控制

- **用户认证**：使用JWT令牌
- **访问权限验证**：基于用户角色的访问控制
- **API访问限制**：限制请求频率和范围

## 最佳实践

### 数据访问模式

1. **优先本地**：始终优先尝试从本地获取数据
2. **后备远程**：本地获取失败时尝试远程
3. **后台同步**：从远程获取后异步保存到本地

### 离线支持

1. **队列化操作**：离线时将操作加入队列
2. **恢复连接检测**：自动检测网络恢复
3. **冲突解决策略**：采用时间戳比较和智能合并

### 性能优化

1. **批量操作**：使用事务和批处理
2. **懒加载**：按需加载数据
3. **缓存管理**：实现过期和清理策略
4. **索引优化**：为频繁查询字段创建索引 