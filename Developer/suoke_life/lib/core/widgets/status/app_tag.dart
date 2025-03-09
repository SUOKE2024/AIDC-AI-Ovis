import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_typography.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';

/// 标签尺寸枚举
enum TagSize {
  /// 小尺寸
  small,

  /// 中等尺寸（默认）
  medium,

  /// 大尺寸
  large,
}

/// 标签样式枚举
enum TagStyle {
  /// 填充样式
  filled,

  /// 描边样式
  outlined,

  /// 轻量样式（淡色背景）
  light,

  /// 五行元素样式
  element,
}

/// 索克风格标签组件
///
/// 用于内容分类和筛选
/// 样例:
/// ```dart
/// AppTag(
///   label: '中医养生',
///   style: TagStyle.filled,
///   size: TagSize.medium,
///   color: AppColors.primaryColor,
/// )
/// ```
class AppTag extends StatelessWidget {
  /// 标签文本
  final String label;

  /// 标签颜色
  final Color? color;

  /// 标签样式
  final TagStyle style;

  /// 标签尺寸
  final TagSize size;

  /// 是否可关闭
  final bool closable;

  /// 标签前图标
  final IconData? icon;

  /// 关联的五行元素（仅当style为element时有效）
  final ElementType? elementType;

  /// 自定义内边距
  final EdgeInsetsGeometry? padding;

  /// 自定义字体样式
  final TextStyle? textStyle;

  /// 点击回调
  final VoidCallback? onTap;

  /// 关闭回调
  final VoidCallback? onClose;

  /// 是否选中
  final bool selected;

  /// 选中时的颜色
  final Color? selectedColor;

  const AppTag({
    Key? key,
    required this.label,
    this.color,
    this.style = TagStyle.filled,
    this.size = TagSize.medium,
    this.closable = false,
    this.icon,
    this.elementType,
    this.padding,
    this.textStyle,
    this.onTap,
    this.onClose,
    this.selected = false,
    this.selectedColor,
  })  : assert(
          style != TagStyle.element || elementType != null,
          '五行元素样式必须指定elementType',
        ),
        super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool isInteractive = onTap != null;
    final Color tagColor = _getTagColor();

    // 构建标签内容
    final Widget tagContent = _buildTagContent(tagColor);

    // 根据是否可交互添加不同的包装
    if (isInteractive) {
      return GestureDetector(
        onTap: onTap,
        child: tagContent,
      );
    } else {
      return tagContent;
    }
  }

  /// 构建标签内容
  Widget _buildTagContent(Color tagColor) {
    // 计算内边距
    final EdgeInsetsGeometry tagPadding = padding ?? _getDefaultPadding();

    // 获取字体样式
    final TextStyle tagTextStyle = _getTextStyle();

    return Container(
      padding: tagPadding,
      decoration: _getTagDecoration(tagColor),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // 前置图标
          if (icon != null) ...[
            Icon(
              icon,
              size: _getIconSize(),
              color: _getIconColor(tagColor),
            ),
            SizedBox(width: size == TagSize.small ? 4.0 : 6.0),
          ],

          // 标签文本
          Text(
            label,
            style: tagTextStyle,
          ),

          // 关闭按钮
          if (closable) ...[
            SizedBox(width: size == TagSize.small ? 4.0 : 6.0),
            GestureDetector(
              onTap: onClose,
              child: Icon(
                Icons.close,
                size: _getIconSize() * 0.8,
                color: _getIconColor(tagColor),
              ),
            ),
          ],
        ],
      ),
    );
  }

  /// 获取标签颜色
  Color _getTagColor() {
    // 如果是选中状态且有指定选中颜色，则使用选中颜色
    if (selected && selectedColor != null) return selectedColor!;
    if (color != null) return color!;

    // 为五行元素样式获取颜色
    if (style == TagStyle.element && elementType != null) {
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

  /// 获取图标颜色
  Color _getIconColor(Color tagColor) {
    switch (style) {
      case TagStyle.filled:
        return Colors.white;
      case TagStyle.outlined:
      case TagStyle.light:
        return tagColor;
      case TagStyle.element:
        return style == TagStyle.filled ? Colors.white : tagColor;
    }
  }

  /// 获取默认内边距
  EdgeInsetsGeometry _getDefaultPadding() {
    switch (size) {
      case TagSize.small:
        return const EdgeInsets.symmetric(horizontal: 6.0, vertical: 2.0);
      case TagSize.medium:
        return const EdgeInsets.symmetric(horizontal: 10.0, vertical: 4.0);
      case TagSize.large:
        return const EdgeInsets.symmetric(horizontal: 14.0, vertical: 6.0);
    }
  }

  /// 获取图标尺寸
  double _getIconSize() {
    switch (size) {
      case TagSize.small:
        return 12.0;
      case TagSize.medium:
        return 16.0;
      case TagSize.large:
        return 20.0;
    }
  }

  /// 获取文本样式
  TextStyle _getTextStyle() {
    final baseStyle = textStyle ?? _getDefaultTextStyle();

    // 对不同样式应用不同文本颜色
    switch (style) {
      case TagStyle.filled:
        return baseStyle.copyWith(color: Colors.white);
      case TagStyle.outlined:
        return baseStyle.copyWith(color: _getTagColor());
      case TagStyle.light:
        return baseStyle.copyWith(color: _getTagColor());
      case TagStyle.element:
        return baseStyle.copyWith(
            color: style == TagStyle.filled ? Colors.white : _getTagColor());
    }
  }

  /// 获取默认文本样式
  TextStyle _getDefaultTextStyle() {
    switch (size) {
      case TagSize.small:
        return AppTypography.captionStyle.copyWith(
          fontSize: 10.0,
        );
      case TagSize.medium:
        return AppTypography.captionStyle.copyWith(
          fontSize: 12.0,
        );
      case TagSize.large:
        return AppTypography.body1Style.copyWith(
          fontSize: 14.0,
        );
    }
  }

  /// 获取标签装饰
  BoxDecoration _getTagDecoration(Color color) {
    double radius;
    switch (size) {
      case TagSize.small:
        radius = 4.0;
        break;
      case TagSize.medium:
        radius = 6.0;
        break;
      case TagSize.large:
        radius = 8.0;
        break;
    }

    switch (style) {
      case TagStyle.filled:
        return BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(radius),
        );
      case TagStyle.outlined:
        return BoxDecoration(
          color: selected ? color.withAlpha(40) : Colors.transparent,
          border: Border.all(color: color, width: 1.0),
          borderRadius: BorderRadius.circular(radius),
        );
      case TagStyle.light:
        return BoxDecoration(
          color: color.withAlpha(selected ? 80 : 40),
          borderRadius: BorderRadius.circular(radius),
        );
      case TagStyle.element:
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
    final bool isFilled = style == TagStyle.filled;
    final bool isOutlined = style == TagStyle.outlined;

    // 获取基本样式（填充或描边）
    final Color bgColor = isFilled
        ? color
        : (selected ? color.withAlpha(80) : color.withAlpha(40));
    final Border? border =
        isOutlined ? Border.all(color: color, width: 1.0) : null;

    switch (elementType!) {
      case ElementType.wood:
        // 木：左侧有绿色竖条
        return BoxDecoration(
          color: bgColor,
          border: border,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: selected
              ? [BoxShadow(color: color.withAlpha(100), blurRadius: 2)]
              : null,
          gradient: isFilled
              ? LinearGradient(
                  colors: [color.withAlpha(200), color],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                )
              : null,
        );

      case ElementType.fire:
        // 火：上部微红色渐变
        return BoxDecoration(
          color: bgColor,
          border: border,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: selected
              ? [BoxShadow(color: color.withAlpha(100), blurRadius: 2)]
              : null,
          gradient: isFilled
              ? LinearGradient(
                  colors: [color, color.withAlpha(200)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                )
              : null,
        );

      case ElementType.earth:
        // 土：四边均匀
        return BoxDecoration(
          color: bgColor,
          border: border,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: selected
              ? [BoxShadow(color: color.withAlpha(100), blurRadius: 2)]
              : null,
        );

      case ElementType.metal:
        // 金：带金属光泽（渐变）
        return BoxDecoration(
          color: bgColor,
          border: border,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: selected
              ? [BoxShadow(color: color.withAlpha(100), blurRadius: 2)]
              : null,
          gradient: isFilled
              ? LinearGradient(
                  colors: [color.withAlpha(200), color, color.withAlpha(230)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
        );

      case ElementType.water:
        // 水：波浪形下边缘
        return BoxDecoration(
          color: bgColor,
          border: border,
          borderRadius: BorderRadius.circular(radius),
          boxShadow: selected
              ? [BoxShadow(color: color.withAlpha(100), blurRadius: 2)]
              : null,
          gradient: isFilled
              ? LinearGradient(
                  colors: [color.withAlpha(180), color],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                )
              : null,
        );
    }
  }
}
