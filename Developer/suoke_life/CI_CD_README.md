# 索克生活APP CI/CD流程文档

## 简介

本文档详细介绍了索克生活APP的持续集成/持续部署(CI/CD)流程、配置和使用方法。我们使用GitHub Actions作为主要的CI/CD平台，结合自定义脚本实现自动化构建、测试和部署。

## 目录结构

```
.
├── .github/
│   └── workflows/          # GitHub Actions工作流配置文件
│       ├── lint_and_test.yml   # 代码质量检查和测试
│       ├── core_test.yml       # 核心模块测试（矩阵并行）
│       ├── data_test.yml       # 数据层测试
│       ├── domain_test.yml     # 领域层测试
│       ├── presentation_test.yml # 表现层测试
│       ├── build.yml           # 应用构建
│       ├── deploy.yml          # 应用部署
│       └── release.yml         # 版本发布
├── scripts/                # CI/CD辅助脚本
│   ├── prebuild.sh             # 构建前处理脚本
│   ├── build_check.sh          # 构建检查脚本
│   ├── update_repo_config.sh   # 仓库配置脚本
│   ├── server_deploy.sh        # 服务器部署脚本
│   ├── gen_coverage_report.sh  # 测试覆盖率报告生成脚本
│   └── run_ci_workflow_locally.sh # 本地运行CI工作流脚本
├── docker-compose.ci.yml   # 本地CI(持续集成)环境配置
└── docker-compose.cd.yml   # 本地CD(持续部署)环境配置
```

## 工作流程

### 1. 代码质量检查和测试

- **触发条件**: 
  - 推送到main或develop分支
  - 创建针对main或develop分支的PR

- **工作内容**:
  - 静态代码分析(lint检查)
  - 代码格式检查
  - 运行单元测试
  - 生成测试覆盖率报告

### 2. 模块化测试工作流

我们采用模块化测试策略，将测试分为多个独立的工作流。详细信息请参阅 [测试工作流指南](docs/TESTING_WORKFLOW.md)。

### 3. 应用构建

- **触发条件**:
  - 推送到main或develop分支
  - 推送带v前缀的标签(如v1.0.0)
  - 手动触发

- **工作内容**:
  - 构建Android应用(APK和AAB)
  - 构建iOS应用
  - 构建Web应用
  - 上传构建产物作为工作流制品

### 4. 应用部署

- **触发条件**:
  - 推送带v前缀的标签(如v1.0.0)
  - 手动触发(可选择部署环境)

- **工作内容**:
  - 部署Web应用到阿里云服务器
  - 部署Android应用到Google Play
  - 部署iOS应用到App Store

### 5. 版本发布

- **触发条件**:
  - 手动触发(需指定版本号和是否为预发布)

- **工作内容**:
  - 更新版本号(pubspec.yaml)
  - 更新版本更新日志(CHANGELOG.md)
  - 创建版本标签
  - 创建GitHub发布版本

## 密钥和环境变量

CI/CD流程需要设置以下密钥和环境变量:

### GitHub密钥

在GitHub仓库的Settings -> Secrets and variables -> Actions中添加:

1. **通用**
   - `GITHUB_TOKEN` - 自动提供，用于GitHub API访问

2. **Android构建**
   - `KEYSTORE_JKS_BASE64` - Base64编码的Android签名密钥库
   - `KEY_PROPERTIES` - Android签名配置

3. **iOS构建**
   - `P12_BASE64` - Base64编码的iOS签名证书
   - `P12_PASSWORD` - iOS证书密码
   - `PROVISIONING_PROFILE_BASE64` - Base64编码的Provisioning Profile

4. **服务器部署**
   - `ALIYUN_HOST` - 阿里云服务器IP地址
   - `ALIYUN_USERNAME` - 阿里云服务器用户名
   - `ALIYUN_SSH_KEY` - 阿里云服务器SSH私钥

5. **应用商店部署**
   - `GOOGLE_PLAY_SERVICE_ACCOUNT` - Google Play服务账号JSON
   - `APPSTORE_API_KEY` - App Store Connect API密钥
   - `APPSTORE_API_KEY_ID` - App Store Connect API密钥ID
   - `APPSTORE_API_KEY_ISSUER_ID` - App Store Connect API密钥发行者ID

## 本地开发流程

### 使用Docker Compose模拟CI/CD环境

我们提供了两个Docker Compose配置文件，分别用于模拟CI和CD环境:

#### 1. 持续集成(CI)环境

```bash
docker-compose -f docker-compose.ci.yml up
```

这将在本地模拟完整的CI构建流程，包括:
- 获取依赖
- 代码分析
- 单元测试
- 构建应用
- 构建检查

#### 2. 持续部署(CD)环境

```bash
docker-compose -f docker-compose.cd.yml up
```

这将在本地模拟完整的CD部署流程，包括:
- Web应用部署
- Android应用部署
- iOS应用部署
- 版本发布管理

您也可以选择只运行特定的服务:

```bash
# 只模拟Web部署
docker-compose -f docker-compose.cd.yml up deploy-web

# 只模拟版本发布
docker-compose -f docker-compose.cd.yml up release-manager -e VERSION=1.2.3
```

> **注意**: 本地CD环境默认只进行模拟，不会执行实际的部署操作。如需执行实际部署，请查看docker-compose.cd.yml中的注释说明。

### 本地运行测试工作流

我们提供了便捷脚本，帮助开发者在本地运行测试和生成覆盖率报告：

```bash
# 生成测试覆盖率报告
./scripts/gen_coverage_report.sh

# 本地运行CI工作流
./scripts/run_ci_workflow_locally.sh --core --report
```

详细信息请参阅 [测试工作流指南](docs/TESTING_WORKFLOW.md)。

### 手动触发工作流

1. 访问GitHub仓库的Actions标签页
2. 选择要运行的工作流
3. 点击"Run workflow"
4. 根据需要设置参数(如部署环境、版本号等)
5. 确认执行

## 常见问题解决

### 构建失败

- **问题**: Android构建失败，出现签名相关错误
- **解决方案**: 检查`KEYSTORE_JKS_BASE64`和`KEY_PROPERTIES`密钥是否正确设置

### 部署失败

- **问题**: 无法连接到阿里云服务器
- **解决方案**: 
  1. 确认`ALIYUN_SSH_KEY`格式正确
  2. 检查服务器防火墙设置
  3. 验证服务器用户权限

### 版本发布问题

- **问题**: 版本标签推送失败
- **解决方案**: 确保GitHub Actions有足够的仓库权限

### 本地Docker环境问题

- **问题**: docker-compose.cd.yml中的iOS部署容器无法启动
- **解决方案**: iOS构建需要macOS环境，在大多数本地环境中无法正常运行，仅作为模拟参考

## 最佳实践

1. **分支策略**:
   - `main`: 生产环境代码，只接受来自`develop`的合并
   - `develop`: 开发环境代码，功能开发完成后合并
   - `feature/*`: 功能开发分支
   - `bugfix/*`: 错误修复分支
   - `release/*`: 版本准备分支

2. **提交规范**:
   - `feat`: 新功能
   - `fix`: 错误修复
   - `docs`: 文档变更
   - `style`: 不影响代码运行的格式变化
   - `refactor`: 代码重构
   - `perf`: 性能优化
   - `test`: 测试相关
   - `chore`: 构建过程或辅助工具变动

3. **版本号规范**:
   - 遵循语义化版本(Semantic Versioning)
   - 格式: 主版本.次版本.修订号(如1.0.0)

## 联系与支持

如遇到CI/CD流程问题，请联系:

- **开发团队**: dev@suoke.life
- **CI/CD维护**: ci@suoke.life

## 相关文档

- [测试工作流指南](docs/TESTING_WORKFLOW.md) - 详细的测试工作流和最佳实践
- [测试指南](docs/TESTING.md) - 测试编写指南和规范

## 更新日志

- **2023-08-01**: 初始版本
- **2023-09-15**: 添加iOS自动部署
- **2023-10-20**: 优化构建脚本
- **2024-06-01**: 添加本地CD环境模拟
- **2024-06-15**: 添加模块化测试工作流 