import 'package:flutter/material.dart';
import 'package:suoke_life/presentation/life/models/constitution_type.dart';

/// 雷达图数据点
class RadarDataPoint {
  /// 标签名称
  final String label;

  /// 数值（0.0-1.0之间）
  final double value;

  /// 可选的颜色
  final Color? color;

  /// 可选的提示信息
  final String? tooltip;

  /// 构造函数
  const RadarDataPoint({
    required this.label,
    required this.value,
    this.color,
    this.tooltip,
  });

  /// 创建数据点副本
  RadarDataPoint copyWith({
    String? label,
    double? value,
    Color? color,
    String? tooltip,
  }) {
    return RadarDataPoint(
      label: label ?? this.label,
      value: value ?? this.value,
      color: color ?? this.color,
      tooltip: tooltip ?? this.tooltip,
    );
  }
}

/// 雷达图数据系列
class RadarChartData {
  /// 系列名称
  final String name;

  /// 数据点列表
  final List<RadarDataPoint> dataPoints;

  /// 系列颜色
  final Color color;

  /// 是否填充区域
  final bool fillArea;

  /// 区域填充透明度
  final double fillOpacity;

  /// 边线宽度
  final double lineWidth;

  /// 构造函数
  const RadarChartData({
    required this.name,
    required this.dataPoints,
    required this.color,
    this.fillArea = true,
    this.fillOpacity = 0.2,
    this.lineWidth = 2.0,
  });

  /// 从体质评分创建雷达图数据
  factory RadarChartData.fromConstitutionScores(
    Map<ConstitutionType, double> scores,
    String name,
    Color color, {
    bool fillArea = true,
    double fillOpacity = 0.2,
    double lineWidth = 2.0,
  }) {
    final dataPoints = scores.entries.map((entry) {
      final constitutionInfo = getConstitutionInfo(entry.key);
      return RadarDataPoint(
        label: constitutionInfo.name,
        value: entry.value,
        tooltip:
            '${constitutionInfo.name}: ${(entry.value * 100).toStringAsFixed(1)}%',
      );
    }).toList();

    return RadarChartData(
      name: name,
      dataPoints: dataPoints,
      color: color,
      fillArea: fillArea,
      fillOpacity: fillOpacity,
      lineWidth: lineWidth,
    );
  }

  /// 获取体质信息
  static ConstitutionInfo getConstitutionInfo(ConstitutionType type) {
    final allTypes = ConstitutionInfo.getAllTypes();
    return allTypes.firstWhere((info) => info.type == type);
  }

  /// 获取数据点最大值
  double get maxValue {
    if (dataPoints.isEmpty) return 10.0;
    return dataPoints.map((dp) => dp.value).reduce((a, b) => a > b ? a : b);
  }

  /// 获取数据点最小值
  double get minValue {
    if (dataPoints.isEmpty) return 0.0;
    return dataPoints.map((dp) => dp.value).reduce((a, b) => a < b ? a : b);
  }

  /// 创建数据系列副本
  RadarChartData copyWith({
    String? name,
    List<RadarDataPoint>? dataPoints,
    Color? color,
    bool? fillArea,
    double? fillOpacity,
    double? lineWidth,
  }) {
    return RadarChartData(
      name: name ?? this.name,
      dataPoints: dataPoints ?? this.dataPoints,
      color: color ?? this.color,
      fillArea: fillArea ?? this.fillArea,
      fillOpacity: fillOpacity ?? this.fillOpacity,
      lineWidth: lineWidth ?? this.lineWidth,
    );
  }
}
