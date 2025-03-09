import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_typography.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';

/// 徽章尺寸枚举
enum BadgeSize {
  /// 小尺寸
  small,

  /// 中等尺寸（默认）
  medium,

  /// 大尺寸
  large,
}

/// 徽章样式枚举
enum BadgeStyle {
  /// 填充样式
  filled,

  /// 描边样式
  outlined,

  /// 轻量样式
  light,

  /// 五行元素样式
  element,
}

/// 索克风格徽章组件
///
/// 用于状态展示、计数和提醒
/// 样例:
/// ```dart
/// AppBadge(
///   label: '新',
///   style: BadgeStyle.filled,
///   size: BadgeSize.small,
///   color: AppColors.primaryColor,
/// )
/// ```
class AppBadge extends StatelessWidget {
  /// 徽章标签文本
  final String? label;

  /// 徽章计数值
  final int? count;

  /// 最大计数显示值（超过则显示+）
  final int maxCount;

  /// 徽章颜色
  final Color? color;

  /// 徽章样式
  final BadgeStyle style;

  /// 徽章尺寸
  final BadgeSize size;

  /// 是否为圆点徽章
  final bool isDot;

  /// 关联的五行元素（仅当style为element时有效）
  final ElementType? elementType;

  /// 自定义内边距
  final EdgeInsetsGeometry? padding;

  /// 自定义字体样式
  final TextStyle? textStyle;

  /// 右上角偏移量
  final Offset? offset;

  /// 徽章位置（在包裹子组件时使用）
  final Alignment alignment;

  /// 子组件（可选，如需徽章附加在其他widget上）
  final Widget? child;

  const AppBadge({
    Key? key,
    this.label,
    this.count,
    this.maxCount = 99,
    this.color,
    this.style = BadgeStyle.filled,
    this.size = BadgeSize.medium,
    this.isDot = false,
    this.elementType,
    this.padding,
    this.textStyle,
    this.offset,
    this.alignment = Alignment.topRight,
    this.child,
  })  : assert(
          (label != null || count != null || isDot) || child != null,
          '必须提供label、count、isDot其中之一，或者提供child',
        ),
        assert(
          style != BadgeStyle.element || elementType != null,
          '五行元素样式必须指定elementType',
        ),
        super(key: key);

  @override
  Widget build(BuildContext context) {
    // 如果是单独的徽章（没有子组件）
    if (child == null) {
      return _buildBadge();
    }

    // 如果徽章需要附加在其他组件上
    return Stack(
      clipBehavior: Clip.none,
      children: [
        child!,
        Positioned(
          top: offset?.dy ?? -5,
          right: offset?.dx ?? -5,
          child: _buildBadge(),
        ),
      ],
    );
  }

  /// 构建徽章主体
  Widget _buildBadge() {
    // 计算文本内容
    final String text = _getBadgeText();

    // 徽章是否为空内容（只有dot才可能为空）
    final bool isEmpty = text.isEmpty && isDot;

    // 计算徽章尺寸
    final double badgeHeight = _getBadgeHeight();
    final double badgeMinWidth =
        isEmpty ? badgeHeight : (isDot ? badgeHeight : _getBadgeWidth());

    // 计算徽章内边距
    final EdgeInsetsGeometry badgePadding = padding ?? _getDefaultPadding();

    // 获取徽章颜色
    final Color badgeColor = _getBadgeColor();

    // 获取文本样式
    final TextStyle badgeTextStyle = _getTextStyle();

    // 构建徽章
    return Container(
      height: isEmpty ? badgeHeight : null,
      constraints: BoxConstraints(
        minWidth: badgeMinWidth,
        minHeight: badgeHeight,
      ),
      padding: isEmpty ? EdgeInsets.zero : badgePadding,
      decoration: _getBadgeDecoration(badgeColor),
      child: isEmpty
          ? null
          : Center(
              child: Text(
                text,
                style: badgeTextStyle,
                textAlign: TextAlign.center,
              ),
            ),
    );
  }

  /// 获取徽章文本
  String _getBadgeText() {
    if (isDot) return '';
    if (label != null) return label!;
    if (count != null) {
      return count! > maxCount ? '$maxCount+' : count.toString();
    }
    return '';
  }

  /// 获取徽章高度
  double _getBadgeHeight() {
    switch (size) {
      case BadgeSize.small:
        return 16.0;
      case BadgeSize.medium:
        return 20.0;
      case BadgeSize.large:
        return 24.0;
    }
  }

  /// 获取徽章最小宽度
  double _getBadgeWidth() {
    switch (size) {
      case BadgeSize.small:
        return 16.0;
      case BadgeSize.medium:
        return 20.0;
      case BadgeSize.large:
        return 24.0;
    }
  }

  /// 获取默认内边距
  EdgeInsetsGeometry _getDefaultPadding() {
    switch (size) {
      case BadgeSize.small:
        return const EdgeInsets.symmetric(horizontal: 4.0, vertical: 2.0);
      case BadgeSize.medium:
        return const EdgeInsets.symmetric(horizontal: 6.0, vertical: 2.0);
      case BadgeSize.large:
        return const EdgeInsets.symmetric(horizontal: 8.0, vertical: 3.0);
    }
  }

  /// 获取徽章颜色
  Color _getBadgeColor() {
    if (color != null) return color!;

    // 为五行元素样式获取颜色
    if (style == BadgeStyle.element && elementType != null) {
      switch (elementType!) {
        case ElementType.wood:
          return AppColors.woodColor;
        case ElementType.fire:
          return AppColors.fireColor;
        case ElementType.earth:
          return AppColors.earthColor;
        case ElementType.metal:
          return AppColors.metalColor;
        case ElementType.water:
          return AppColors.waterColor;
      }
    }

    // 默认颜色
    return AppColors.primaryColor;
  }

  /// 获取文本样式
  TextStyle _getTextStyle() {
    final baseStyle = textStyle ?? _getDefaultTextStyle();

    // 对不同样式应用不同文本颜色
    switch (style) {
      case BadgeStyle.filled:
        return baseStyle.copyWith(color: Colors.white);
      case BadgeStyle.outlined:
        return baseStyle.copyWith(color: _getBadgeColor());
      case BadgeStyle.light:
        return baseStyle.copyWith(color: _getBadgeColor());
      case BadgeStyle.element:
        return baseStyle.copyWith(
            color:
                style == BadgeStyle.filled ? Colors.white : _getBadgeColor());
    }
  }

  /// 获取默认文本样式
  TextStyle _getDefaultTextStyle() {
    switch (size) {
      case BadgeSize.small:
        return AppTypography.captionStyle.copyWith(
          fontSize: 10.0,
          fontWeight: FontWeight.bold,
        );
      case BadgeSize.medium:
        return AppTypography.captionStyle.copyWith(
          fontSize: 12.0,
          fontWeight: FontWeight.bold,
        );
      case BadgeSize.large:
        return AppTypography.captionStyle.copyWith(
          fontSize: 14.0,
          fontWeight: FontWeight.bold,
        );
    }
  }

  /// 获取徽章装饰
  BoxDecoration _getBadgeDecoration(Color color) {
    final bool isCircular = isDot || (label == null && count != null);
    final double radius =
        isCircular ? _getBadgeHeight() / 2 : _getBadgeHeight() / 3;

    switch (style) {
      case BadgeStyle.filled:
        return BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(radius),
        );
      case BadgeStyle.outlined:
        return BoxDecoration(
          color: Colors.transparent,
          border: Border.all(color: color, width: 1.5),
          borderRadius: BorderRadius.circular(radius),
        );
      case BadgeStyle.light:
        return BoxDecoration(
          color: color.withAlpha(40),
          borderRadius: BorderRadius.circular(radius),
        );
      case BadgeStyle.element:
        if (elementType == null) {
          return BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(radius),
          );
        }

        // 五行元素特殊样式
        return _getElementDecoration(color, radius);
    }
  }

  /// 获取五行元素装饰
  BoxDecoration _getElementDecoration(Color color, double radius) {
    switch (elementType!) {
      case ElementType.wood:
        // 木：矩形带上部微尖角
        return BoxDecoration(
          color: style == BadgeStyle.filled ? color : color.withAlpha(40),
          border:
              style == BadgeStyle.outlined ? Border.all(color: color) : null,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(8),
            bottom: Radius.circular(4),
          ),
        );
      case ElementType.fire:
        // 火：上部尖角三角形
        return BoxDecoration(
          color: style == BadgeStyle.filled ? color : color.withAlpha(40),
          border:
              style == BadgeStyle.outlined ? Border.all(color: color) : null,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(radius * 0.5),
            topRight: Radius.circular(radius * 0.5),
            bottomLeft: Radius.circular(radius),
            bottomRight: Radius.circular(radius),
          ),
        );
      case ElementType.earth:
        // 土：方形
        return BoxDecoration(
          color: style == BadgeStyle.filled ? color : color.withAlpha(40),
          border:
              style == BadgeStyle.outlined ? Border.all(color: color) : null,
          borderRadius: BorderRadius.circular(radius * 0.5),
        );
      case ElementType.metal:
        // 金：圆形
        return BoxDecoration(
          color: style == BadgeStyle.filled ? color : color.withAlpha(40),
          border:
              style == BadgeStyle.outlined ? Border.all(color: color) : null,
          shape: BoxShape.circle,
        );
      case ElementType.water:
        // 水：波浪形（用圆角模拟）
        return BoxDecoration(
          color: style == BadgeStyle.filled ? color : color.withAlpha(40),
          border:
              style == BadgeStyle.outlined ? Border.all(color: color) : null,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(radius * 1.5),
            topRight: Radius.circular(radius * 0.5),
            bottomLeft: Radius.circular(radius * 0.5),
            bottomRight: Radius.circular(radius * 1.5),
          ),
        );
    }
  }
}
