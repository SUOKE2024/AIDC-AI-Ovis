import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';

/// 索克生活APP形状与阴影系统
/// 定义了圆角、边框、阴影等设计令牌
class AppShapes {
  // 圆角半径
  static const double radiusXS = 4.0;
  static const double radiusSM = 8.0; // 基础UI元素圆角
  static const double radiusMD = 12.0;
  static const double radiusLG = 16.0; // 卡片圆角
  static const double radiusXL = 24.0;
  static const double radiusCircular = 999.0; // 圆形

  // 边框宽度
  static const double borderWidthThin = 0.5;
  static const double borderWidthRegular = 1.0;
  static const double borderWidthThick = 2.0;

  // 预设圆角
  static BorderRadius get borderRadiusSM => BorderRadius.circular(radiusSM);
  static BorderRadius get borderRadiusMD => BorderRadius.circular(radiusMD);
  static BorderRadius get borderRadiusLG => BorderRadius.circular(radiusLG);
  static BorderRadius get borderRadiusXL => BorderRadius.circular(radiusXL);
  static BorderRadius get borderRadiusCircular =>
      BorderRadius.circular(radiusCircular);

  // 特殊形状
  static BorderRadius get bottomSheetRadius => const BorderRadius.only(
        topLeft: Radius.circular(radiusLG),
        topRight: Radius.circular(radiusLG),
      );

  static BorderRadius get topCardRadius => const BorderRadius.only(
        topLeft: Radius.circular(radiusLG),
        topRight: Radius.circular(radiusLG),
      );

  static BorderRadius get bottomCardRadius => const BorderRadius.only(
        bottomLeft: Radius.circular(radiusLG),
        bottomRight: Radius.circular(radiusLG),
      );
}

/// 阴影系统
class AppShadows {
  // 阴影预设
  static List<BoxShadow> get shadowSM => [
        BoxShadow(
          color: Colors.black.withAlpha(10),
          blurRadius: 4,
          offset: const Offset(0, 1),
        ),
      ];

  static List<BoxShadow> get shadowMD => [
        BoxShadow(
          color: Colors.black.withAlpha(16),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get shadowLG => [
        BoxShadow(
          color: Colors.black.withAlpha(24),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ];

  // 特殊效果阴影
  static List<BoxShadow> get primaryShadow => [
        BoxShadow(
          color: AppColors.primaryColor.withAlpha(40),
          blurRadius: 12,
          spreadRadius: 2,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get secondaryShadow => [
        BoxShadow(
          color: AppColors.secondaryColor.withAlpha(40),
          blurRadius: 12,
          spreadRadius: 2,
          offset: const Offset(0, 4),
        ),
      ];

  // 亮暗主题自适应阴影
  static List<BoxShadow> getAdaptiveShadow(BuildContext context,
      {bool isPrimary = true}) {
    final brightness = Theme.of(context).brightness;
    final alpha = brightness == Brightness.light ? 40 : 60;
    final color = isPrimary ? AppColors.primaryColor : AppColors.secondaryColor;

    return [
      BoxShadow(
        color: color.withAlpha(alpha),
        blurRadius: 12,
        spreadRadius: brightness == Brightness.light ? 2 : 1,
        offset: const Offset(0, 4),
      ),
    ];
  }
}
