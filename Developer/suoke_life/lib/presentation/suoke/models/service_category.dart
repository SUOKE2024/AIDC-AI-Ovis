import 'package:flutter/material.dart';

/// 服务类别模型
class ServiceCategory {
  /// 类别ID
  final String id;

  /// 类别名称
  final String name;

  /// 类别图标
  final IconData icon;

  /// 类别颜色
  final Color? color;

  const ServiceCategory({
    required this.id,
    required this.name,
    required this.icon,
    this.color,
  });
}
