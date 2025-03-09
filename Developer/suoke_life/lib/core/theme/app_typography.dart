import 'package:flutter/material.dart';

/// 索克生活APP排版系统
/// 定义了文字大小、行高、字重等排版设计令牌
class AppTypography {
  // 基础字体大小
  static const double heading1 = 32.0;
  static const double heading2 = 24.0;
  static const double heading3 = 20.0;
  static const double heading4 = 18.0;
  static const double body1 = 16.0;
  static const double body2 = 14.0;
  static const double caption = 12.0;
  static const double small = 10.0;

  // 行高系数
  static const double lineHeightTight = 1.2;
  static const double lineHeightNormal = 1.5;
  static const double lineHeightRelaxed = 1.8;

  // 字重
  static const FontWeight lightWeight = FontWeight.w300;
  static const FontWeight regularWeight = FontWeight.w400;
  static const FontWeight mediumWeight = FontWeight.w500;
  static const FontWeight semiBoldWeight = FontWeight.w600;
  static const FontWeight boldWeight = FontWeight.w700;

  // 字体系列 - 后续可根据需要引入自定义字体
  static const String defaultFontFamily = 'PingFang SC'; // 使用苹方字体，符合Apple风格

  // 预设文本风格
  static TextStyle get heading1Style => const TextStyle(
        fontSize: heading1,
        fontWeight: semiBoldWeight,
        height: lineHeightTight,
        fontFamily: defaultFontFamily,
      );

  static TextStyle get heading2Style => const TextStyle(
        fontSize: heading2,
        fontWeight: semiBoldWeight,
        height: lineHeightTight,
        fontFamily: defaultFontFamily,
      );

  static TextStyle get heading3Style => const TextStyle(
        fontSize: heading3,
        fontWeight: semiBoldWeight,
        height: lineHeightTight,
        fontFamily: defaultFontFamily,
      );

  static TextStyle get heading4Style => const TextStyle(
        fontSize: heading4,
        fontWeight: mediumWeight,
        height: lineHeightTight,
        fontFamily: defaultFontFamily,
      );

  static TextStyle get body1Style => const TextStyle(
        fontSize: body1,
        fontWeight: regularWeight,
        height: lineHeightNormal,
        fontFamily: defaultFontFamily,
      );

  static TextStyle get body2Style => const TextStyle(
        fontSize: body2,
        fontWeight: regularWeight,
        height: lineHeightNormal,
        fontFamily: defaultFontFamily,
      );

  static TextStyle get captionStyle => const TextStyle(
        fontSize: caption,
        fontWeight: regularWeight,
        height: lineHeightNormal,
        fontFamily: defaultFontFamily,
      );

  static TextStyle get smallStyle => const TextStyle(
        fontSize: small,
        fontWeight: regularWeight,
        height: lineHeightNormal,
        fontFamily: defaultFontFamily,
      );

  // 主题适配文本样式
  static TextStyle getAdaptiveTextStyle({
    required BuildContext context,
    required TextStyle baseStyle,
    Color? lightModeColor,
    Color? darkModeColor,
  }) {
    final brightness = Theme.of(context).brightness;
    Color? textColor;

    if (lightModeColor != null && darkModeColor != null) {
      textColor =
          brightness == Brightness.light ? lightModeColor : darkModeColor;
    }

    return baseStyle.copyWith(color: textColor);
  }

  // 为兼容旧代码保留的样式名称
  static TextStyle get subtitle1 => const TextStyle(
        fontSize: body1,
        fontWeight: mediumWeight,
        height: lineHeightNormal,
        fontFamily: defaultFontFamily,
      );
}
