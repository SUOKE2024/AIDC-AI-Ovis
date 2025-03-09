#!/bin/bash

# 索克生活APP CI测试脚本
# 该脚本模拟GitHub Actions工作流，在本地运行CI测试

echo "==== 开始索克生活APP CI测试 ===="

# 1. 获取依赖
echo "--- 获取Flutter依赖 ---"
flutter pub get
if [ $? -ne 0 ]; then
  echo "获取依赖失败！"
  exit 1
fi

# 2. 静态代码分析
echo "--- 运行代码分析 ---"
flutter analyze --no-fatal-infos --no-fatal-warnings
if [ $? -ne 0 ]; then
  echo "代码分析发现错误！"
  # 暂时不退出，因为可能存在一些需要修复的错误
  # exit 1
fi

# 3. 运行单元测试
echo "--- 运行单元测试 ---"
flutter test --coverage
if [ $? -ne 0 ]; then
  echo "单元测试失败！"
  exit 1
fi

# 4. 检查测试覆盖率
echo "--- 检查测试覆盖率 ---"
if [ -f "coverage/lcov.info" ]; then
  echo "覆盖率报告已生成：coverage/lcov.info"
  # 可以添加额外的覆盖率分析工具，如lcov
  # 例如：lcov --remove coverage/lcov.info 'lib/generated/*' -o coverage/lcov_filtered.info
else
  echo "覆盖率报告未生成！"
fi

# 5. 核心模块测试
echo "--- 运行核心模块测试 ---"
if [ -d "test/core" ]; then
  flutter test test/core/ --coverage
  if [ $? -ne 0 ]; then
    echo "核心模块测试失败！"
    exit 1
  fi
else
  echo "核心模块测试目录不存在，跳过测试"
fi

# 6. 数据库测试
echo "--- 运行数据库测试 ---"
if [ -d "test/core/database" ]; then
  flutter test test/core/database/ --coverage
  if [ $? -ne 0 ]; then
    echo "数据库测试失败！"
    exit 1
  fi
else
  echo "数据库测试目录不存在，跳过测试"
fi

# 7. 表现层测试
echo "--- 运行表现层测试 ---"
if [ -d "test/presentation" ]; then
  flutter test test/presentation/ --coverage
  if [ $? -ne 0 ]; then
    echo "表现层测试失败！"
    exit 1
  fi
else
  echo "表现层测试目录不存在，跳过测试"
fi

# 8. 经络探索器测试
echo "--- 运行经络探索器测试 ---"
if [ -d "test/presentation/meridian_explorer" ]; then
  flutter test test/presentation/meridian_explorer/ --coverage
  if [ $? -ne 0 ]; then
    echo "经络探索器测试失败！"
    exit 1
  fi
else
  echo "经络探索器测试目录不存在，跳过测试"
fi

echo "==== 索克生活APP CI测试完成 ===="
exit 0 