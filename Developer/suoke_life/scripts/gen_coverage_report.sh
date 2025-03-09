#!/bin/bash

# 索克生活APP测试覆盖率报告生成脚本
# 该脚本用于生成测试覆盖率报告并打开HTML查看器

echo "==== 生成索克生活APP测试覆盖率报告 ===="

# 检查是否安装了lcov
if ! command -v lcov &> /dev/null
then
    echo "错误: 未安装lcov工具"
    echo "请执行: brew install lcov (Mac) 或 sudo apt-get install lcov (Linux)"
    exit 1
fi

# 运行测试并生成覆盖率数据
echo "--- 运行所有测试并生成覆盖率数据 ---"
flutter test --coverage
if [ $? -ne 0 ]; then
  echo "测试运行失败！"
  exit 1
fi

# 生成HTML报告
echo "--- 生成HTML覆盖率报告 ---"
if [ -f "coverage/lcov.info" ]; then
  # 清理生成的文件
  rm -rf coverage/html
  
  # 过滤掉生成的代码
  echo "--- 过滤生成的代码 ---"
  lcov --remove coverage/lcov.info 'lib/generated/*' -o coverage/lcov_filtered.info
  
  # 生成HTML报告
  genhtml coverage/lcov_filtered.info -o coverage/html
  
  # 计算覆盖率
  COVERAGE=$(lcov --summary coverage/lcov_filtered.info | grep "lines" | awk '{print $4}' | cut -d'%' -f1)
  echo "测试覆盖率: ${COVERAGE}%"
  
  # 打开HTML报告
  echo "--- 打开覆盖率报告 ---"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open coverage/html/index.html
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open coverage/html/index.html
  else
    echo "无法自动打开报告，请手动打开: coverage/html/index.html"
  fi
else
  echo "覆盖率数据文件不存在"
  exit 1
fi

echo "==== 覆盖率报告生成完成 ====" 