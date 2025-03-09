import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';

/// 五行元素类型枚举
enum ElementType {
  /// 木
  wood,

  /// 火
  fire,

  /// 土
  earth,

  /// 金
  metal,

  /// 水
  water,
}

/// 五行元素视觉系统
/// 定义了中医五行相关的视觉设计元素
class FiveElements {
  // 五行基础色彩 - 与AppColors中定义保持一致
  static const Color woodColor = AppColors.woodColor; // 木
  static const Color fireColor = AppColors.fireColor; // 火
  static const Color earthColor = AppColors.earthColor; // 土
  static const Color metalColor = AppColors.metalColor; // 金
  static const Color waterColor = AppColors.waterColor; // 水

  // 获取元素对应的颜色
  static Color getElementColor(ElementType type) {
    switch (type) {
      case ElementType.wood:
        return woodColor;
      case ElementType.fire:
        return fireColor;
      case ElementType.earth:
        return earthColor;
      case ElementType.metal:
        return metalColor;
      case ElementType.water:
        return waterColor;
    }
  }

  // 五行渐变色
  static LinearGradient get woodGradient => LinearGradient(
        colors: [woodColor, woodColor.withAlpha(160)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );

  static LinearGradient get fireGradient => LinearGradient(
        colors: [fireColor, fireColor.withAlpha(160)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      );

  static LinearGradient get earthGradient => LinearGradient(
        colors: [earthColor, earthColor.withAlpha(160)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      );

  static LinearGradient get metalGradient => LinearGradient(
        colors: [metalColor, metalColor.withAlpha(160)],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      );

  static LinearGradient get waterGradient => LinearGradient(
        colors: [waterColor, waterColor.withAlpha(160)],
        begin: Alignment.bottomCenter,
        end: Alignment.topCenter,
      );

  // 五行图标
  static IconData get woodIcon => Icons.eco; // 木 - 生长
  static IconData get fireIcon => Icons.whatshot; // 火 - 热力
  static IconData get earthIcon => Icons.terrain; // 土 - 大地
  static IconData get metalIcon => Icons.trip_origin; // 金 - 金属
  static IconData get waterIcon => Icons.water; // 水 - 流动

  // 五行装饰形状生成器
  static ShapeBorder getElementShape(String element) {
    switch (element) {
      case 'wood':
        return RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        );
      case 'fire':
        return const StarBorder(
          points: 5,
          innerRadiusRatio: 0.6,
        );
      case 'earth':
        return RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        );
      case 'metal':
        return const CircleBorder();
      case 'water':
        return const StadiumBorder();
      default:
        return RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        );
    }
  }
}

/// 星形边框 - 用于火元素装饰
class StarBorder extends ShapeBorder {
  final int points;
  final double innerRadiusRatio;

  const StarBorder({
    required this.points,
    this.innerRadiusRatio = 0.5,
  });

  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.zero;

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return getOuterPath(rect, textDirection: textDirection);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    final center = rect.center;
    final outerRadius =
        rect.width < rect.height ? rect.width / 2 : rect.height / 2;
    final innerRadius = outerRadius * innerRadiusRatio;

    final path = Path();
    const startAngle = -math.pi / 2;
    final angleStep = math.pi / points;

    for (int i = 0; i < points * 2; i++) {
      final radius = i.isEven ? outerRadius : innerRadius;
      final angle = startAngle + (i * angleStep);
      final point = Offset(
        center.dx + radius * math.cos(angle),
        center.dy + radius * math.sin(angle),
      );

      if (i == 0) {
        path.moveTo(point.dx, point.dy);
      } else {
        path.lineTo(point.dx, point.dy);
      }
    }

    path.close();
    return path;
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {}

  @override
  ShapeBorder scale(double t) => StarBorder(
        points: points,
        innerRadiusRatio: innerRadiusRatio,
      );
}
