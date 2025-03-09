import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suoke_life/core/theme/tcm_chart_themes.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';
import 'package:suoke_life/core/widgets/tcm/models/five_elements_data.dart';
import 'package:suoke_life/core/widgets/tcm/models/radar_chart_data.dart';
import 'package:suoke_life/domain/entities/constitution/constitution_type.dart';

/// 五行数据Provider
final fiveElementsDataProvider = Provider<FiveElementsData>((ref) {
  return FiveElementsData.balanced(); // 默认提供平衡的五行数据
});

/// 五行元素颜色Provider
final elementColorProvider =
    Provider.family<Color, ElementType>((ref, elementType) {
  return FiveElements.getElementColor(elementType);
});

/// 体质类型颜色Provider
final constitutionColorProvider =
    Provider.family<Color, ConstitutionType>((ref, type) {
  return TCMChartThemes.getConstitutionColor(type);
});

/// 体质雷达图数据Provider
final constitutionRadarDataProvider =
    Provider.family<RadarChartData, Map<ConstitutionType, double>>(
        (ref, scores) {
  final dataPoints = scores.entries.map((entry) {
    return RadarDataPoint(
      label: entry.key.toString().split('.').last,
      value: entry.value * 10, // 转换为0-10的范围
      color: TCMChartThemes.getConstitutionColor(entry.key),
      tooltip: _getConstitutionName(entry.key),
    );
  }).toList();

  return RadarChartData(
    name: '体质分布',
    dataPoints: dataPoints,
    color: Colors.blueAccent,
    lineWidth: 2.0,
  );
});

/// 获取体质类型名称
String _getConstitutionName(ConstitutionType type) {
  return type.name;
}
