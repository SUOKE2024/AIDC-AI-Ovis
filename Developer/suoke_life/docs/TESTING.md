# 索克生活APP测试工作流指南

## 概述

本文档介绍索克生活APP的测试策略、测试工作流以及CI/CD集成方案，旨在保证代码质量和应用稳定性。

## 测试结构

索克生活APP的测试分为以下几类：

1. **单元测试**：测试独立的函数、类和方法
2. **Widget测试**：测试UI组件和页面
3. **集成测试**：测试多个组件之间的交互
4. **端到端测试**：模拟用户操作的完整流程测试

测试文件组织结构遵循与源代码相同的结构，位于`test/`目录下：

```
test/
  ├── core/                 # 核心模块测试
  │   ├── network/          # 网络相关测试
  │   ├── storage/          # 存储相关测试
  │   ├── router/           # 路由相关测试
  │   └── ...
  ├── data/                 # 数据层测试
  │   ├── datasources/      # 数据源测试
  │   ├── models/           # 数据模型测试
  │   └── repositories/     # 存储库实现测试
  ├── domain/               # 领域层测试
  │   ├── entities/         # 实体测试
  │   └── usecases/         # 用例测试
  ├── presentation/         # 表现层测试
  │   ├── home/             # 首页测试
  │   ├── suoke/            # SUOKE页测试
  │   └── ...
  ├── integration_test/     # 集成测试
  └── e2e/                  # 端到端测试
```

## 运行测试

### 本地运行测试

1. **运行所有测试**：

```bash
flutter test
```

2. **运行特定目录的测试**：

```bash
flutter test test/core/
```

3. **运行单个测试文件**：

```bash
flutter test test/core/network/api_client_test.dart
```

4. **带覆盖率的测试**：

```bash
flutter test --coverage
```

5. **生成HTML覆盖率报告**：

我们提供了一个便捷脚本来生成并打开HTML覆盖率报告：

```bash
./scripts/gen_coverage_report.sh
```

### CI/CD环境下的测试

我们的CI/CD系统使用GitHub Actions进行自动化测试和构建。工作流配置文件位于`.github/workflows/`目录。

主要的测试工作流包括：

1. **core_test.yml**：核心模块测试，使用矩阵策略并行测试多个核心模块
2. **data_test.yml**：数据层测试
3. **domain_test.yml**：领域层测试
4. **presentation_test.yml**：表现层测试
5. **integration_test.yml**：集成测试

## 测试优化策略

为提高测试效率和质量，我们采用以下优化策略：

### 1. 并行测试

使用矩阵策略在CI/CD环境中并行运行多个测试模块，显著减少测试时间。例如：

```yaml
strategy:
  matrix:
    module: [network, utils, storage, theme, router, error, localization, sync]
```

### 2. 依赖缓存

使用GitHub Actions的缓存功能，缓存Pub依赖，避免每次构建重新下载：

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

### 3. 增量测试

在本地开发中，可以只运行与更改相关的测试：

```bash
flutter test --name="should correctly handle API errors"
```

### 4. 测试覆盖率监控

CI/CD系统自动计算并监控测试覆盖率，确保代码质量：

```yaml
- name: 上传覆盖率报告
  uses: actions/upload-artifact@v3
  with:
    name: coverage-report
    path: coverage/html/
```

## 测试最佳实践

### 单元测试

1. 测试函数的输入输出，而不是实现细节
2. 使用模拟（Mock）对象隔离依赖
3. 测试边界条件和异常情况
4. 每个测试只测试一个特定行为

示例：

```dart
test('当网络请求失败时应返回NetworkFailure', () async {
  // Arrange
  when(mockHttpClient.get(any)).thenThrow(Exception('Network error'));
  
  // Act
  final result = await apiClient.fetchData();
  
  // Assert
  expect(result, isA<Failure>());
  expect((result as Failure).message, contains('网络错误'));
});
```

### Widget测试

1. 测试Widget的渲染和交互
2. 验证Widget的状态变化
3. 测试用户输入处理

示例：

```dart
testWidgets('当点击按钮时应显示加载指示器', (WidgetTester tester) async {
  // Arrange
  await tester.pumpWidget(MaterialApp(home: MyButton()));
  
  // Act
  await tester.tap(find.byType(ElevatedButton));
  await tester.pump();
  
  // Assert
  expect(find.byType(CircularProgressIndicator), findsOneWidget);
});
```

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