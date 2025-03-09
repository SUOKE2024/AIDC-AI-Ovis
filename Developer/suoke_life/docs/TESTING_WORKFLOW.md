# 索克生活APP测试工作流指南

## 概述

本文档详细介绍了索克生活APP的测试工作流、CI集成和本地测试运行方法，旨在帮助开发团队高效地进行测试和质量保证工作。

## 测试工作流架构

我们采用模块化测试策略，将测试分为多个独立的工作流，以实现并行测试和更快的反馈循环：

```
.github/workflows/
├── core_test.yml       # 核心模块测试（矩阵并行）
├── data_test.yml       # 数据层测试
├── domain_test.yml     # 领域层测试
└── presentation_test.yml # 表现层测试
```

### 1. 核心模块测试 (core_test.yml)

核心模块测试工作流使用矩阵策略并行测试多个核心模块，显著提高测试效率。

**主要特点：**

- **矩阵并行测试**：同时测试多个核心模块
  ```yaml
  strategy:
    matrix:
      module: [network, utils, storage, theme, router, error, localization, sync]
  ```

- **依赖缓存**：使用GitHub Actions缓存机制加速构建
  ```yaml
  - name: 缓存Pub依赖
    uses: actions/cache@v3
    with:
      path: |
        ~/.pub-cache
        .dart_tool
      key: ${{ runner.os }}-pub-${{ hashFiles('pubspec.lock') }}
      restore-keys: ${{ runner.os }}-pub-
  ```

- **覆盖率报告合并**：自动合并各模块的覆盖率报告，生成统一的HTML报告

### 2. 数据层测试 (data_test.yml)

数据层测试工作流专注于测试应用的数据层组件。

**测试范围：**

- 数据模型 (`test/data/models/`)
- 数据源 (`test/data/datasources/`)
- 存储库实现 (`test/data/repositories/`)

### 3. 领域层测试 (domain_test.yml)

领域层测试工作流专注于测试应用的业务逻辑和领域规则。

**测试范围：**

- 领域实体 (`test/domain/entities/`)
- 用例 (`test/domain/usecases/`)

### 4. 表现层测试 (presentation_test.yml)

表现层测试工作流专注于测试应用的UI组件和页面。

**测试范围：**

- 首页模块 (`test/presentation/home/`)
- SUOKE模块 (`test/presentation/suoke/`)
- 探索模块 (`test/presentation/explore/`)
- LIFE模块 (`test/presentation/life/`)
- 个人设置模块 (`test/presentation/profile/`)

## 本地运行测试

我们提供了两个便捷脚本，帮助开发者在本地运行测试和生成覆盖率报告：

### 1. 生成测试覆盖率报告

```bash
./scripts/gen_coverage_report.sh
```

该脚本会：
- 运行所有测试
- 生成覆盖率数据
- 过滤掉生成的代码
- 生成HTML覆盖率报告
- 自动打开报告

### 2. 本地运行CI工作流

```bash
./scripts/run_ci_workflow_locally.sh [选项]
```

**选项：**
- `-h, --help`：显示帮助信息
- `-c, --core`：运行核心模块测试工作流
- `-d, --data`：运行数据模块测试工作流
- `-m, --domain`：运行领域模块测试工作流
- `-p, --presentation`：运行表现层测试工作流
- `-a, --all`：运行所有测试工作流
- `-r, --report`：生成覆盖率报告

**示例：**

```bash
# 运行核心模块测试并生成覆盖率报告
./scripts/run_ci_workflow_locally.sh --core --report

# 运行所有测试工作流
./scripts/run_ci_workflow_locally.sh --all
```

## 测试优化策略

为提高测试效率和质量，我们采用以下优化策略：

### 1. 并行测试

使用矩阵策略在CI/CD环境中并行运行多个测试模块，显著减少测试时间。

### 2. 依赖缓存

使用GitHub Actions的缓存功能，缓存Pub依赖，避免每次构建重新下载。

### 3. 增量测试

在本地开发中，可以只运行与更改相关的测试：

```bash
flutter test --name="should correctly handle API errors"
```

### 4. 测试覆盖率监控

CI/CD系统自动计算并监控测试覆盖率，确保代码质量。

## 测试最佳实践

### 单元测试

1. 测试函数的输入输出，而不是实现细节
2. 使用模拟（Mock）对象隔离依赖
3. 测试边界条件和异常情况
4. 每个测试只测试一个特定行为

### Widget测试

1. 测试Widget的渲染和交互
2. 验证Widget的状态变化
3. 测试用户输入处理

## 持续改进

我们致力于持续改进测试流程和质量：

1. 定期审查测试覆盖率报告，增加低覆盖率区域的测试
2. 引入新特性时同步编写测试
3. 在代码审查中验证测试质量
4. 参与团队培训，提高测试技能

## 常见问题

### 测试覆盖率不准确

如果发现测试覆盖率不准确，可能是因为生成的代码被包含在覆盖率计算中。使用我们的覆盖率报告脚本可以过滤掉生成的代码：

```bash
./scripts/gen_coverage_report.sh
```

### 测试运行缓慢

1. 优先运行相关模块的测试
2. 使用并行测试功能
3. 确保模拟对象正确配置，避免不必要的实际网络请求

### 集成测试失败但单元测试通过

这通常表明组件之间的集成出现问题：

1. 检查依赖注入配置
2. 验证数据流和状态管理
3. 确保模拟对象的行为与实际组件一致 