#!/bin/bash

# 修改Podfile中的iOS部署目标版本
sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET = 12.0/IPHONEOS_DEPLOYMENT_TARGET = 13.0/g' Podfile

# 修改项目配置文件
find . -name "*.pbxproj" -exec sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET = 12.0/IPHONEOS_DEPLOYMENT_TARGET = 13.0/g' {} \;

# 修改Pods项目配置文件
if [ -d "Pods" ]; then
  find Pods -name "*.pbxproj" -exec sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET = 12.0/IPHONEOS_DEPLOYMENT_TARGET = 13.0/g' {} \;
fi

echo "iOS部署目标版本已更新到13.0" 