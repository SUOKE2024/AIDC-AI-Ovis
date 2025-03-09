import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';
import 'package:suoke_life/domain/entities/constitution/constitution_type.dart';

/// TCM图表主题类
///
/// 提供中医图表相关的颜色、样式和主题定义
class TCMChartThemes {
  TCMChartThemes._(); // 私有构造函数，防止实例化

  /// 获取体质类型颜色
  static Color getConstitutionColor(ConstitutionType type) {
    switch (type) {
      case ConstitutionType.balanced:
        return FiveElements.getElementColor(ElementType.earth).withAlpha(220);
      case ConstitutionType.qiDeficiency:
        return FiveElements.getElementColor(ElementType.metal).withAlpha(220);
      case ConstitutionType.yangDeficiency:
        return FiveElements.getElementColor(ElementType.water).withAlpha(220);
      case ConstitutionType.yinDeficiency:
        return FiveElements.getElementColor(ElementType.fire).withAlpha(220);
      case ConstitutionType.phlegmDampness:
        return FiveElements.getElementColor(ElementType.earth).withAlpha(220);
      case ConstitutionType.dampnessHeat:
        return FiveElements.getElementColor(ElementType.fire).withAlpha(220);
      case ConstitutionType.bloodStasis:
        return FiveElements.getElementColor(ElementType.water).withAlpha(220);
      case ConstitutionType.qiStagnation:
        return FiveElements.getElementColor(ElementType.wood).withAlpha(220);
      case ConstitutionType.allergic:
        return FiveElements.getElementColor(ElementType.metal).withAlpha(220);
    }
  }

  /// 获取体质类型图标
  static IconData getConstitutionIcon(ConstitutionType type) {
    switch (type) {
      case ConstitutionType.balanced:
        return Icons.balance;
      case ConstitutionType.qiDeficiency:
        return Icons.air;
      case ConstitutionType.yangDeficiency:
        return Icons.wb_sunny_outlined;
      case ConstitutionType.yinDeficiency:
        return Icons.nightlight_round;
      case ConstitutionType.phlegmDampness:
        return Icons.water_drop;
      case ConstitutionType.dampnessHeat:
        return Icons.whatshot;
      case ConstitutionType.bloodStasis:
        return Icons.opacity;
      case ConstitutionType.qiStagnation:
        return Icons.compress;
      case ConstitutionType.allergic:
        return Icons.coronavirus;
    }
  }

  /// 五行图表主题
  static const fiveElementsTheme = FiveElementsChartTheme(
    generatingLineColor: AppColors.primaryColor,
    controllingLineColor: AppColors.secondaryColor,
    baseElementSize: 50.0,
    animationDuration: Duration(milliseconds: 1000),
  );

  /// 雷达图主题
  static const radarChartTheme = RadarChartTheme(
    gridColor: Color(0xFFEEEEEE),
    axisColor: Color(0xFFCCCCCC),
    labelColor: Color(0xFF333333),
    tooltipBackgroundColor: Colors.white,
    divisions: 4,
    labelFontSize: 12.0,
    valueFontSize: 10.0,
    animationDuration: Duration(milliseconds: 1200),
  );

  /// 脉诊图表主题
  static const pulseChartTheme = PulseChartTheme(
    waveColor: AppColors.primaryColor,
    gridColor: Color(0xFFEEEEEE),
    labelColor: Color(0xFF333333),
    backgroundColor: Colors.white,
    waveThickness: 2.0,
    gridThickness: 0.5,
    animationDuration: Duration(milliseconds: 800),
  );

  /// 舌诊图表主题
  static const tongueChartTheme = TongueChartTheme(
    outlineColor: Color(0xFF888888),
    fillColor: Color(0xFFFAE3D9),
    coatingColor: Color(0xFFFFFAF0),
    markersColor: Color(0xFFE57373),
    labelColor: Color(0xFF333333),
    animationDuration: Duration(milliseconds: 600),
  );
}

/// 五行图表主题
class FiveElementsChartTheme {
  /// 相生关系线颜色
  final Color generatingLineColor;

  /// 相克关系线颜色
  final Color controllingLineColor;

  /// 元素基础尺寸
  final double baseElementSize;

  /// 动画时长
  final Duration animationDuration;

  /// 构造函数
  const FiveElementsChartTheme({
    required this.generatingLineColor,
    required this.controllingLineColor,
    required this.baseElementSize,
    required this.animationDuration,
  });
}

/// 雷达图主题
class RadarChartTheme {
  /// 网格颜色
  final Color gridColor;

  /// 轴线颜色
  final Color axisColor;

  /// 标签颜色
  final Color labelColor;

  /// 提示框背景色
  final Color tooltipBackgroundColor;

  /// 网格分段数
  final int divisions;

  /// 标签字体大小
  final double labelFontSize;

  /// 数值字体大小
  final double valueFontSize;

  /// 动画时长
  final Duration animationDuration;

  /// 构造函数
  const RadarChartTheme({
    required this.gridColor,
    required this.axisColor,
    required this.labelColor,
    required this.tooltipBackgroundColor,
    required this.divisions,
    required this.labelFontSize,
    required this.valueFontSize,
    required this.animationDuration,
  });
}

/// 脉诊图表主题
class PulseChartTheme {
  /// 波形颜色
  final Color waveColor;

  /// 网格颜色
  final Color gridColor;

  /// 标签颜色
  final Color labelColor;

  /// 背景颜色
  final Color backgroundColor;

  /// 波形线条粗细
  final double waveThickness;

  /// 网格线条粗细
  final double gridThickness;

  /// 动画时长
  final Duration animationDuration;

  /// 构造函数
  const PulseChartTheme({
    required this.waveColor,
    required this.gridColor,
    required this.labelColor,
    required this.backgroundColor,
    required this.waveThickness,
    required this.gridThickness,
    required this.animationDuration,
  });
}

/// 舌诊图表主题
class TongueChartTheme {
  /// 舌体轮廓颜色
  final Color outlineColor;

  /// 舌体填充颜色
  final Color fillColor;

  /// 舌苔颜色
  final Color coatingColor;

  /// 标记点颜色
  final Color markersColor;

  /// 标签颜色
  final Color labelColor;

  /// 动画时长
  final Duration animationDuration;

  /// 构造函数
  const TongueChartTheme({
    required this.outlineColor,
    required this.fillColor,
    required this.coatingColor,
    required this.markersColor,
    required this.labelColor,
    required this.animationDuration,
  });
}
