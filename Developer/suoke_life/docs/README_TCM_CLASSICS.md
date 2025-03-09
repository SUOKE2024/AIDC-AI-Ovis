# 索克生活APP - 中医经典文献模块

## 模块概述

中医经典文献模块是索克生活APP的重要组成部分，旨在为用户提供丰富的中医古籍资源，包括《黄帝内经》、《难经》、《伤寒杂病论》等经典著作。该模块与知识图谱紧密集成，支持文献内容的检索、注释和关联知识节点的功能。

## 功能特性

- **经典文献浏览**：按分类浏览中医经典文献
- **章节内容阅读**：阅读文献的详细章节内容
- **全文检索**：在文献内容中搜索关键词
- **注释系统**：查看和添加文献内容的注释
- **知识图谱关联**：将文献内容与知识图谱节点关联
- **多媒体支持**：支持文献原始图片的查看

## 技术架构

本模块严格遵循Clean Architecture架构模式，分为以下几层：

### 领域层 (Domain Layer)
- **实体 (Entities)**：
  - `TCMClassicBook`：中医经典文献实体
  - `TCMClassicChapter`：文献章节实体
  - `ChapterAnnotation`：章节注释实体

- **存储库接口 (Repository Interfaces)**：
  - `TCMClassicsRepository`：定义数据访问接口

- **用例 (Use Cases)**：
  - `GetAllClassicBooks`：获取所有文献
  - `SearchClassicBooks`：搜索文献
  - `GetChaptersByBookId`：获取章节
  - `SearchContentInBook`：搜索内容
  - `GetRelatedClassicBooks`：获取相关文献

### 数据层 (Data Layer)
- **数据模型 (Models)**：
  - `TCMClassicBookModel`：文献数据模型
  - `TCMClassicChapterModel`：章节数据模型
  - `ChapterAnnotationModel`：注释数据模型

- **数据源 (Data Sources)**：
  - `TCMClassicsLocalDataSource`：本地数据源
  - `TCMClassicsRemoteDataSource`：远程数据源

- **存储库实现 (Repository Implementations)**：
  - `TCMClassicsRepositoryImpl`：实现数据访问逻辑

### 表现层 (Presentation Layer)
- **页面 (Pages)**：
  - `TCMClassicsPage`：文献列表页面
  - `TCMClassicChapterPage`：章节详情页面

- **状态管理 (State Management)**：
  - 使用Riverpod管理状态
  - 提供各种Provider访问数据和状态

## 数据库结构

模块使用以下数据库表存储数据：

- `tcm_classic_books`：存储文献基本信息
- `tcm_classic_chapters`：存储章节内容
- `tcm_node_book_relations`：存储知识节点与文献的关联
- `tcm_node_chapter_relations`：存储知识节点与章节的关联

## 与知识图谱的集成

中医经典文献模块与知识图谱紧密集成，主要体现在以下方面：

1. **双向关联**：文献和章节可以与知识节点相互关联
2. **语义检索**：支持基于知识图谱的语义检索
3. **知识溯源**：从知识节点可以追溯到相关的经典文献出处
4. **内容丰富**：通过文献内容丰富知识图谱的信息

## 使用示例

```dart
// 获取所有中医经典文献
final classicBooksAsync = ref.watch(classicBooksProvider);

// 搜索中医经典文献
final searchParams = SearchClassicBooksParams(query: '脉学');
final searchResultsAsync = ref.watch(searchClassicBooksProvider(searchParams));

// 获取特定文献的章节
final chaptersAsync = ref.watch(chaptersProvider(bookId));

// 在文献中搜索内容
final contentSearchParams = SearchContentInBookParams(
  bookId: bookId,
  query: '阴阳',
);
final contentSearchResultsAsync = ref.watch(searchContentProvider(contentSearchParams));

// 获取与知识节点相关的文献
final relatedBooksAsync = ref.watch(relatedClassicBooksProvider(nodeId));
```

## 未来计划

1. 增加更多中医经典文献资源
2. 实现文献内容的多语言翻译
3. 添加文献内容的音频朗读功能
4. 开发文献内容的AR/VR可视化展示
5. 实现基于AI的文献内容理解和解读功能