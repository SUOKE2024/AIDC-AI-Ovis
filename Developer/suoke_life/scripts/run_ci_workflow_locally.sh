#!/bin/bash

# 索克生活APP CI工作流本地运行脚本
# 该脚本用于在本地模拟CI环境运行工作流

# 显示帮助信息
show_help() {
  echo "索克生活APP CI工作流本地运行脚本"
  echo ""
  echo "用法: $0 [选项]"
  echo ""
  echo "选项:"
  echo "  -h, --help      显示此帮助信息"
  echo "  -c, --core      运行核心模块测试工作流"
  echo "  -d, --data      运行数据模块测试工作流"
  echo "  -m, --domain    运行领域模块测试工作流"
  echo "  -p, --presentation 运行表现层测试工作流"
  echo "  -a, --all       运行所有测试工作流"
  echo "  -r, --report    生成覆盖率报告"
  echo ""
  echo "示例: $0 --core --report"
}

# 运行核心模块工作流
run_core_workflow() {
  echo "==== 运行核心模块测试工作流 ===="
  
  MODULES=("network" "utils" "storage" "theme" "router" "error" "localization" "sync")
  
  # 创建临时目录存放覆盖率报告
  mkdir -p coverage_reports
  
  for module in "${MODULES[@]}"; do
    echo "--- 测试模块: $module ---"
    
    # 创建测试目录（如果不存在）
    mkdir -p "test/core/$module"
    
    # 运行测试
    if [ -d "test/core/$module" ] && [ "$(ls -A "test/core/$module")" ]; then
      flutter test "test/core/$module" --coverage
      if [ $? -ne 0 ]; then
        echo "模块 $module 测试失败！"
      else
        # 如果存在覆盖率文件，复制到模块专用目录
        if [ -f "coverage/lcov.info" ]; then
          cp coverage/lcov.info "coverage_reports/lcov_$module.info"
        fi
      fi
    else
      echo "模块 $module 没有测试文件，跳过"
    fi
  done
  
  echo "==== 核心模块测试完成 ===="
}

# 运行数据模块工作流
run_data_workflow() {
  echo "==== 运行数据模块测试工作流 ===="
  
  # 测试数据模型
  echo "--- 测试数据模型 ---"
  if [ -d "test/data/models" ] && [ "$(ls -A "test/data/models")" ]; then
    flutter test test/data/models --coverage
    if [ $? -ne 0 ]; then
      echo "数据模型测试失败！"
    else
      if [ -f "coverage/lcov.info" ]; then
        cp coverage/lcov.info "coverage_reports/lcov_data_models.info"
      fi
    fi
  else
    echo "数据模型没有测试文件，跳过"
  fi
  
  # 测试数据源
  echo "--- 测试数据源 ---"
  if [ -d "test/data/datasources" ] && [ "$(ls -A "test/data/datasources")" ]; then
    flutter test test/data/datasources --coverage
    if [ $? -ne 0 ]; then
      echo "数据源测试失败！"
    else
      if [ -f "coverage/lcov.info" ]; then
        cp coverage/lcov.info "coverage_reports/lcov_data_datasources.info"
      fi
    fi
  else
    echo "数据源没有测试文件，跳过"
  fi
  
  # 测试存储库
  echo "--- 测试存储库 ---"
  if [ -d "test/data/repositories" ] && [ "$(ls -A "test/data/repositories")" ]; then
    flutter test test/data/repositories --coverage
    if [ $? -ne 0 ]; then
      echo "存储库测试失败！"
    else
      if [ -f "coverage/lcov.info" ]; then
        cp coverage/lcov.info "coverage_reports/lcov_data_repositories.info"
      fi
    fi
  else
    echo "存储库没有测试文件，跳过"
  fi
  
  echo "==== 数据模块测试完成 ===="
}

# 运行领域模块工作流
run_domain_workflow() {
  echo "==== 运行领域模块测试工作流 ===="
  
  # 测试实体
  echo "--- 测试实体 ---"
  if [ -d "test/domain/entities" ] && [ "$(ls -A "test/domain/entities")" ]; then
    flutter test test/domain/entities --coverage
    if [ $? -ne 0 ]; then
      echo "实体测试失败！"
    else
      if [ -f "coverage/lcov.info" ]; then
        cp coverage/lcov.info "coverage_reports/lcov_domain_entities.info"
      fi
    fi
  else
    echo "实体没有测试文件，跳过"
  fi
  
  # 测试用例
  echo "--- 测试用例 ---"
  if [ -d "test/domain/usecases" ] && [ "$(ls -A "test/domain/usecases")" ]; then
    flutter test test/domain/usecases --coverage
    if [ $? -ne 0 ]; then
      echo "用例测试失败！"
    else
      if [ -f "coverage/lcov.info" ]; then
        cp coverage/lcov.info "coverage_reports/lcov_domain_usecases.info"
      fi
    fi
  else
    echo "用例没有测试文件，跳过"
  fi
  
  echo "==== 领域模块测试完成 ===="
}

# 运行表现层工作流
run_presentation_workflow() {
  echo "==== 运行表现层测试工作流 ===="
  
  MODULES=("home" "suoke" "explore" "life" "profile")
  
  for module in "${MODULES[@]}"; do
    echo "--- 测试模块: $module ---"
    
    if [ -d "test/presentation/$module" ] && [ "$(ls -A "test/presentation/$module")" ]; then
      flutter test "test/presentation/$module" --coverage
      if [ $? -ne 0 ]; then
        echo "模块 $module 测试失败！"
      else
        if [ -f "coverage/lcov.info" ]; then
          cp coverage/lcov.info "coverage_reports/lcov_presentation_$module.info"
        fi
      fi
    else
      echo "模块 $module 没有测试文件，跳过"
    fi
  done
  
  echo "==== 表现层测试完成 ===="
}

# 生成综合覆盖率报告
generate_coverage_report() {
  echo "==== 生成综合覆盖率报告 ===="
  
  # 检查是否安装了lcov
  if ! command -v lcov &> /dev/null
  then
    echo "错误: 未安装lcov工具"
    echo "请执行: brew install lcov (Mac) 或 sudo apt-get install lcov (Linux)"
    return 1
  fi
  
  # 合并所有覆盖率报告
  if [ -d "coverage_reports" ] && [ "$(ls -A "coverage_reports")" ]; then
    # 创建空的lcov.info文件
    echo "" > coverage/lcov.info
    
    # 合并所有覆盖率报告
    lcov $(for f in coverage_reports/lcov_*.info; do echo "-a $f "; done) -o coverage/lcov.info
    
    # 过滤生成的代码
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
    echo "没有覆盖率报告可合并"
    return 1
  fi
  
  echo "==== 覆盖率报告生成完成 ===="
}

# 运行所有工作流
run_all_workflows() {
  run_core_workflow
  run_data_workflow
  run_domain_workflow
  run_presentation_workflow
}

# 清理工作
cleanup() {
  echo "--- 清理临时文件 ---"
  
  # 保留合并后的报告，删除临时文件
  if [ -d "coverage_reports" ]; then
    rm -rf coverage_reports
  fi
}

# 主函数
main() {
  # 创建临时目录
  mkdir -p coverage_reports
  
  # 参数解析
  RUN_CORE=false
  RUN_DATA=false
  RUN_DOMAIN=false
  RUN_PRESENTATION=false
  RUN_ALL=false
  GEN_REPORT=false
  
  # 解析命令行参数
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        exit 0
        ;;
      -c|--core)
        RUN_CORE=true
        shift
        ;;
      -d|--data)
        RUN_DATA=true
        shift
        ;;
      -m|--domain)
        RUN_DOMAIN=true
        shift
        ;;
      -p|--presentation)
        RUN_PRESENTATION=true
        shift
        ;;
      -a|--all)
        RUN_ALL=true
        shift
        ;;
      -r|--report)
        GEN_REPORT=true
        shift
        ;;
      *)
        echo "未知选项: $1"
        show_help
        exit 1
        ;;
    esac
  done
  
  # 如果没有指定任何选项，显示帮助
  if [[ $RUN_CORE == false && $RUN_DATA == false && $RUN_DOMAIN == false && $RUN_PRESENTATION == false && $RUN_ALL == false ]]; then
    show_help
    exit 0
  fi
  
  # 运行请求的工作流
  if [[ $RUN_ALL == true ]]; then
    run_all_workflows
  else
    if [[ $RUN_CORE == true ]]; then
      run_core_workflow
    fi
    
    if [[ $RUN_DATA == true ]]; then
      run_data_workflow
    fi
    
    if [[ $RUN_DOMAIN == true ]]; then
      run_domain_workflow
    fi
    
    if [[ $RUN_PRESENTATION == true ]]; then
      run_presentation_workflow
    fi
  fi
  
  # 生成覆盖率报告
  if [[ $GEN_REPORT == true ]]; then
    generate_coverage_report
  fi
  
  # 清理
  cleanup
  
  echo "==== 脚本执行完成 ===="
}

# 执行主函数
main "$@" 