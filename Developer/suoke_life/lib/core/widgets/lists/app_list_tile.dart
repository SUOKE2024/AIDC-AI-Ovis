import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_shapes.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';

/// 列表项变体枚举
enum AppListTileVariant {
  /// 标准样式 - 带背景和边距
  standard,

  /// 分割线样式 - 带底部分割线
  divided,

  /// 紧凑样式 - 减小内边距
  compact,

  /// 卡片样式 - 带圆角和阴影
  card,
}

/// 列表项尺寸枚举
enum AppListTileSize {
  /// 小尺寸
  small,

  /// 中等尺寸（默认）
  medium,

  /// 大尺寸
  large,
}

/// 索克风格标准列表项组件
///
/// 一个统一的列表项组件，提供一致的外观和交互。
/// 用例:
/// ```dart
/// AppListTile(
///   title: '项目标题',
///   subtitle: '项目详情说明',
///   leadingIcon: Icons.person,
///   onTap: () => print('点击了列表项'),
/// )
/// ```
class AppListTile extends StatelessWidget {
  /// 列表项标题
  final String title;

  /// 列表项副标题（可选）
  final String? subtitle;

  /// 前导图标（可选）
  final IconData? leadingIcon;

  /// 前导组件（可选，优先级高于图标）
  final Widget? leading;

  /// 尾随图标（可选）
  final IconData? trailingIcon;

  /// 尾随组件（可选，优先级高于图标）
  final Widget? trailing;

  /// 点击回调
  final VoidCallback? onTap;

  /// 长按回调
  final VoidCallback? onLongPress;

  /// 列表项变体
  final AppListTileVariant variant;

  /// 列表项尺寸
  final AppListTileSize size;

  /// 是否显示为选中状态
  final bool isSelected;

  /// 选中状态颜色
  final Color? selectedColor;

  /// 是否启用触觉反馈
  final bool enableFeedback;

  /// 自定义背景色
  final Color? backgroundColor;

  /// 自定义内容边距
  final EdgeInsetsGeometry? contentPadding;

  /// 自定义标题样式
  final TextStyle? titleStyle;

  /// 自定义副标题样式
  final TextStyle? subtitleStyle;

  /// 标题最大行数
  final int titleMaxLines;

  /// 副标题最大行数
  final int subtitleMaxLines;

  /// 自定义高度
  final double? height;

  const AppListTile({
    Key? key,
    required this.title,
    this.subtitle,
    this.leadingIcon,
    this.leading,
    this.trailingIcon,
    this.trailing,
    this.onTap,
    this.onLongPress,
    this.variant = AppListTileVariant.standard,
    this.size = AppListTileSize.medium,
    this.isSelected = false,
    this.selectedColor,
    this.enableFeedback = true,
    this.backgroundColor,
    this.contentPadding,
    this.titleStyle,
    this.subtitleStyle,
    this.titleMaxLines = 1,
    this.subtitleMaxLines = 1,
    this.height,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final Color effectiveSelectedColor =
        selectedColor ?? AppColors.primaryColor;

    // 构建列表项容器
    Widget tileContainer =
        _buildTileContent(context, isDarkMode, effectiveSelectedColor);

    // 应用不同变体样式
    switch (variant) {
      case AppListTileVariant.standard:
        tileContainer = _wrapWithStandardContainer(tileContainer, isDarkMode);
        break;
      case AppListTileVariant.divided:
        tileContainer = _wrapWithDividedContainer(tileContainer, isDarkMode);
        break;
      case AppListTileVariant.compact:
        // 紧凑型不需要额外包装
        break;
      case AppListTileVariant.card:
        tileContainer = _wrapWithCardContainer(tileContainer, isDarkMode);
        break;
    }

    // 添加触摸反馈
    if (onTap != null || onLongPress != null) {
      return InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        splashColor: effectiveSelectedColor.withAlpha(30),
        highlightColor: effectiveSelectedColor.withAlpha(20),
        enableFeedback: enableFeedback,
        borderRadius: variant == AppListTileVariant.card
            ? BorderRadius.circular(AppShapes.radiusMD)
            : null,
        child: tileContainer,
      );
    }

    return tileContainer;
  }

  /// 构建列表项内容
  Widget _buildTileContent(
      BuildContext context, bool isDarkMode, Color selectedColor) {
    return Container(
      height: height ?? _getDefaultHeight(),
      padding: contentPadding ?? _getDefaultPadding(),
      child: Row(
        children: [
          // 前导部分
          if (leading != null) ...[
            leading!,
            SizedBox(width: AppSpacing.sm),
          ] else if (leadingIcon != null) ...[
            _buildLeadingIcon(isDarkMode, selectedColor),
            SizedBox(width: AppSpacing.sm),
          ],

          // 标题和副标题
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: subtitle != null
                  ? MainAxisAlignment.center
                  : MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: _getTitleStyle(isDarkMode, selectedColor),
                  maxLines: titleMaxLines,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle != null) ...[
                  SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: _getSubtitleStyle(isDarkMode),
                    maxLines: subtitleMaxLines,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),

          // 尾随部分
          if (trailing != null) ...[
            SizedBox(width: AppSpacing.sm),
            trailing!,
          ] else if (trailingIcon != null) ...[
            SizedBox(width: AppSpacing.sm),
            _buildTrailingIcon(isDarkMode),
          ],
        ],
      ),
    );
  }

  /// 构建前导图标
  Widget _buildLeadingIcon(bool isDarkMode, Color selectedColor) {
    final iconColor = isSelected
        ? selectedColor
        : (isDarkMode ? AppColors.darkTextPrimary : AppColors.lightTextPrimary);

    final double iconSize = _getIconSize();

    return Icon(
      leadingIcon,
      color: iconColor,
      size: iconSize,
    );
  }

  /// 构建尾随图标
  Widget _buildTrailingIcon(bool isDarkMode) {
    final iconColor =
        isDarkMode ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final double iconSize = _getIconSize();

    return Icon(
      trailingIcon,
      color: iconColor,
      size: iconSize,
    );
  }

  /// 包装标准容器样式
  Widget _wrapWithStandardContainer(Widget child, bool isDarkMode) {
    return Container(
      color: _getBackgroundColor(isDarkMode),
      child: child,
    );
  }

  /// 包装分割线容器样式
  Widget _wrapWithDividedContainer(Widget child, bool isDarkMode) {
    return Container(
      decoration: BoxDecoration(
        color: _getBackgroundColor(isDarkMode),
        border: Border(
          bottom: BorderSide(
            color: isDarkMode ? AppColors.darkBorder : AppColors.lightBorder,
            width: 0.5,
          ),
        ),
      ),
      child: child,
    );
  }

  /// 包装卡片容器样式
  Widget _wrapWithCardContainer(Widget child, bool isDarkMode) {
    return Container(
      margin: EdgeInsets.symmetric(
        vertical: AppSpacing.xs,
        horizontal: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: _getBackgroundColor(isDarkMode),
        borderRadius: BorderRadius.circular(AppShapes.radiusMD),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: child,
    );
  }

  /// 获取默认高度
  double _getDefaultHeight() {
    switch (size) {
      case AppListTileSize.small:
        return subtitle != null ? 56.0 : 40.0;
      case AppListTileSize.medium:
        return subtitle != null ? 72.0 : 56.0;
      case AppListTileSize.large:
        return subtitle != null ? 88.0 : 64.0;
    }
  }

  /// 获取默认内边距
  EdgeInsetsGeometry _getDefaultPadding() {
    switch (variant) {
      case AppListTileVariant.compact:
        return EdgeInsets.symmetric(horizontal: AppSpacing.sm);
      case AppListTileVariant.card:
        return EdgeInsets.symmetric(horizontal: AppSpacing.md);
      case AppListTileVariant.standard:
      case AppListTileVariant.divided:
      default:
        return EdgeInsets.symmetric(horizontal: AppSpacing.md);
    }
  }

  /// 获取背景颜色
  Color _getBackgroundColor(bool isDarkMode) {
    if (backgroundColor != null) return backgroundColor!;

    if (isSelected) {
      return (selectedColor ?? AppColors.primaryColor).withAlpha(20);
    }

    switch (variant) {
      case AppListTileVariant.card:
        return isDarkMode ? AppColors.darkSurface : AppColors.lightSurface;
      case AppListTileVariant.standard:
      case AppListTileVariant.divided:
      case AppListTileVariant.compact:
      default:
        return Colors.transparent;
    }
  }

  /// 获取标题样式
  TextStyle _getTitleStyle(bool isDarkMode, Color selectedColor) {
    if (titleStyle != null) return titleStyle!;

    final defaultStyle = TextStyle(
      fontSize: _getTitleFontSize(),
      fontWeight: FontWeight.w500,
      color: isSelected
          ? selectedColor
          : (isDarkMode
              ? AppColors.darkTextPrimary
              : AppColors.lightTextPrimary),
    );

    return defaultStyle;
  }

  /// 获取副标题样式
  TextStyle _getSubtitleStyle(bool isDarkMode) {
    if (subtitleStyle != null) return subtitleStyle!;

    return TextStyle(
      fontSize: _getSubtitleFontSize(),
      color: isDarkMode
          ? AppColors.darkTextSecondary
          : AppColors.lightTextSecondary,
    );
  }

  /// 获取标题字体大小
  double _getTitleFontSize() {
    switch (size) {
      case AppListTileSize.small:
        return 14.0;
      case AppListTileSize.medium:
        return 16.0;
      case AppListTileSize.large:
        return 18.0;
    }
  }

  /// 获取副标题字体大小
  double _getSubtitleFontSize() {
    switch (size) {
      case AppListTileSize.small:
        return 12.0;
      case AppListTileSize.medium:
        return 14.0;
      case AppListTileSize.large:
        return 16.0;
    }
  }

  /// 获取图标大小
  double _getIconSize() {
    switch (size) {
      case AppListTileSize.small:
        return 16.0;
      case AppListTileSize.medium:
        return 20.0;
      case AppListTileSize.large:
        return 24.0;
    }
  }
}

/// 标准列表项
///
/// 标准样式的列表项，常用于设置等列表场景
class StandardListTile extends AppListTile {
  const StandardListTile({
    super.key,
    required super.title,
    super.subtitle,
    super.leadingIcon,
    super.leading,
    super.trailingIcon,
    super.trailing,
    super.onTap,
    super.onLongPress,
    super.size = AppListTileSize.medium,
    super.isSelected = false,
    super.selectedColor,
    super.enableFeedback = true,
    super.backgroundColor,
    super.contentPadding,
    super.titleStyle,
    super.subtitleStyle,
    super.titleMaxLines = 1,
    super.subtitleMaxLines = 1,
    super.height,
  }) : super(variant: AppListTileVariant.standard);
}

/// 分割线列表项
///
/// 带底部分割线的列表项，适用于长列表
class DividedListTile extends AppListTile {
  const DividedListTile({
    super.key,
    required super.title,
    super.subtitle,
    super.leadingIcon,
    super.leading,
    super.trailingIcon,
    super.trailing,
    super.onTap,
    super.onLongPress,
    super.size = AppListTileSize.medium,
    super.isSelected = false,
    super.selectedColor,
    super.enableFeedback = true,
    super.backgroundColor,
    super.contentPadding,
    super.titleStyle,
    super.subtitleStyle,
    super.titleMaxLines = 1,
    super.subtitleMaxLines = 1,
    super.height,
  }) : super(variant: AppListTileVariant.divided);
}

/// 紧凑列表项
///
/// 较小内边距的列表项，适用于空间有限场景
class CompactListTile extends AppListTile {
  const CompactListTile({
    super.key,
    required super.title,
    super.subtitle,
    super.leadingIcon,
    super.leading,
    super.trailingIcon,
    super.trailing,
    super.onTap,
    super.onLongPress,
    super.size = AppListTileSize.small,
    super.isSelected = false,
    super.selectedColor,
    super.enableFeedback = true,
    super.backgroundColor,
    super.contentPadding,
    super.titleStyle,
    super.subtitleStyle,
    super.titleMaxLines = 1,
    super.subtitleMaxLines = 1,
    super.height,
  }) : super(variant: AppListTileVariant.compact);
}

/// 卡片列表项
///
/// 带圆角和阴影的卡片式列表项，适用于突出显示
class CardListTile extends AppListTile {
  const CardListTile({
    super.key,
    required super.title,
    super.subtitle,
    super.leadingIcon,
    super.leading,
    super.trailingIcon,
    super.trailing,
    super.onTap,
    super.onLongPress,
    super.size = AppListTileSize.medium,
    super.isSelected = false,
    super.selectedColor,
    super.enableFeedback = true,
    super.backgroundColor,
    super.contentPadding,
    super.titleStyle,
    super.subtitleStyle,
    super.titleMaxLines = 1,
    super.subtitleMaxLines = 1,
    super.height,
  }) : super(variant: AppListTileVariant.card);
}
