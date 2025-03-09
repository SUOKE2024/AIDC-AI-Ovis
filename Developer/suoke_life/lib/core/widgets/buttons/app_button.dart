import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';
import 'package:suoke_life/core/theme/app_shapes.dart';

/// 按钮大小枚举
enum AppButtonSize {
  /// 小尺寸按钮 (高度: 32)
  small,

  /// 中等尺寸按钮 (高度: 44)
  medium,

  /// 大尺寸按钮 (高度: 56)
  large
}

/// 按钮变体枚举
enum AppButtonVariant {
  /// 主要按钮 - 使用主色背景
  primary,

  /// 次要按钮 - 使用次色背景
  secondary,

  /// 轮廓按钮 - 透明背景，带边框
  outline,

  /// 文本按钮 - 仅文字
  text,

  /// 危险按钮 - 使用警告色
  danger
}

/// 索克风格标准按钮组件
///
/// 统一的按钮组件，支持多种变体和尺寸。
/// 使用示例:
/// ```dart
/// AppButton(
///   label: '确认',
///   onPressed: () => print('按钮被点击'),
///   variant: AppButtonVariant.primary,
///   size: AppButtonSize.medium,
/// )
/// ```
class AppButton extends StatelessWidget {
  /// 按钮文本
  final String label;

  /// 点击回调函数
  final VoidCallback? onPressed;

  /// 按钮变体，决定颜色和样式
  final AppButtonVariant variant;

  /// 按钮尺寸
  final AppButtonSize size;

  /// 前缀图标
  final IconData? prefixIcon;

  /// 后缀图标
  final IconData? suffixIcon;

  /// 是否显示加载状态
  final bool isLoading;

  /// 自定义背景色，覆盖变体默认色
  final Color? backgroundColor;

  /// 自定义文本颜色，覆盖变体默认色
  final Color? textColor;

  /// 自定义边框颜色，用于轮廓变体
  final Color? borderColor;

  /// 是否填满父容器宽度
  final bool isFullWidth;

  /// 是否启用触感反馈
  final bool hapticFeedback;

  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.prefixIcon,
    this.suffixIcon,
    this.isLoading = false,
    this.backgroundColor,
    this.textColor,
    this.borderColor,
    this.isFullWidth = false,
    this.hapticFeedback = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    // 根据尺寸确定按钮高度和内边距
    final double height = _getButtonHeight();
    final EdgeInsets padding = _getButtonPadding();

    // 根据变体确定按钮颜色
    final buttonStyle = _getButtonStyle(context, isDarkMode);

    // 构建按钮内容
    final Widget buttonContent = _buildButtonContent(context, isDarkMode);

    // 根据宽度约束构建按钮
    Widget button = SizedBox(
      height: height,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: buttonStyle,
        child: buttonContent,
      ),
    );

    // 应用宽度约束
    if (isFullWidth) {
      return button;
    } else {
      return UnconstrainedBox(
        child: button,
      );
    }
  }

  /// 构建按钮内容
  Widget _buildButtonContent(BuildContext context, bool isDarkMode) {
    if (isLoading) {
      return SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(_getTextColor(isDarkMode)),
        ),
      );
    }

    List<Widget> children = [];

    // 添加前缀图标
    if (prefixIcon != null) {
      children.add(Icon(
        prefixIcon,
        size: _getIconSize(),
        color: _getTextColor(isDarkMode),
      ));
      children.add(SizedBox(width: AppSpacing.xs));
    }

    // 添加文本标签
    children.add(Text(
      label,
      style: TextStyle(
        fontSize: _getFontSize(),
        fontWeight: FontWeight.w500,
        color: _getTextColor(isDarkMode),
      ),
    ));

    // 添加后缀图标
    if (suffixIcon != null) {
      children.add(SizedBox(width: AppSpacing.xs));
      children.add(Icon(
        suffixIcon,
        size: _getIconSize(),
        color: _getTextColor(isDarkMode),
      ));
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: children,
    );
  }

  /// 获取按钮样式
  ButtonStyle _getButtonStyle(BuildContext context, bool isDarkMode) {
    return ButtonStyle(
      backgroundColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.disabled)) {
          return isDarkMode
              ? AppColors.darkSystemGray5
              : AppColors.lightSystemGray5;
        }
        return _getBackgroundColor(isDarkMode);
      }),
      foregroundColor: MaterialStateProperty.all(_getTextColor(isDarkMode)),
      padding: MaterialStateProperty.all(_getButtonPadding()),
      shape: MaterialStateProperty.all(_getBorderShape()),
      elevation: MaterialStateProperty.all(0),
      overlayColor: MaterialStateProperty.resolveWith((states) {
        final primaryColor = Theme.of(context).primaryColor;
        if (variant == AppButtonVariant.outline ||
            variant == AppButtonVariant.text) {
          return primaryColor.withAlpha(20);
        }
        return Colors.white.withAlpha(30);
      }),
      side: variant == AppButtonVariant.outline
          ? MaterialStateProperty.all(
              BorderSide(
                color: borderColor ?? _getBorderColor(isDarkMode),
                width: 1.5,
              ),
            )
          : null,
    );
  }

  /// 获取按钮高度
  double _getButtonHeight() {
    switch (size) {
      case AppButtonSize.small:
        return 32.0;
      case AppButtonSize.medium:
        return 44.0;
      case AppButtonSize.large:
        return 56.0;
    }
  }

  /// 获取按钮内边距
  EdgeInsets _getButtonPadding() {
    switch (size) {
      case AppButtonSize.small:
        return EdgeInsets.symmetric(horizontal: AppSpacing.sm);
      case AppButtonSize.medium:
        return EdgeInsets.symmetric(horizontal: AppSpacing.md);
      case AppButtonSize.large:
        return EdgeInsets.symmetric(horizontal: AppSpacing.lg);
    }
  }

  /// 获取按钮文字大小
  double _getFontSize() {
    switch (size) {
      case AppButtonSize.small:
        return 12.0;
      case AppButtonSize.medium:
        return 14.0;
      case AppButtonSize.large:
        return 16.0;
    }
  }

  /// 获取图标大小
  double _getIconSize() {
    switch (size) {
      case AppButtonSize.small:
        return 16.0;
      case AppButtonSize.medium:
        return 18.0;
      case AppButtonSize.large:
        return 20.0;
    }
  }

  /// 获取边框形状
  RoundedRectangleBorder _getBorderShape() {
    return RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppShapes.radiusSM),
    );
  }

  /// 获取背景颜色
  Color _getBackgroundColor(bool isDarkMode) {
    if (backgroundColor != null) return backgroundColor!;

    switch (variant) {
      case AppButtonVariant.primary:
        return AppColors.primaryColor;
      case AppButtonVariant.secondary:
        return AppColors.secondaryColor;
      case AppButtonVariant.outline:
      case AppButtonVariant.text:
        return Colors.transparent;
      case AppButtonVariant.danger:
        return AppColors.errorColor;
    }
  }

  /// 获取文本颜色
  Color _getTextColor(bool isDarkMode) {
    if (textColor != null) return textColor!;

    switch (variant) {
      case AppButtonVariant.primary:
      case AppButtonVariant.secondary:
      case AppButtonVariant.danger:
        return Colors.white;
      case AppButtonVariant.outline:
        return borderColor ?? AppColors.primaryColor;
      case AppButtonVariant.text:
        return AppColors.primaryColor;
    }
  }

  /// 获取边框颜色
  Color _getBorderColor(bool isDarkMode) {
    if (borderColor != null) return borderColor!;

    switch (variant) {
      case AppButtonVariant.outline:
        return AppColors.primaryColor;
      default:
        return Colors.transparent;
    }
  }
}

/// 主要按钮
///
/// 使用主色背景的标准按钮
class PrimaryButton extends AppButton {
  const PrimaryButton({
    super.key,
    required super.label,
    required super.onPressed,
    super.size = AppButtonSize.medium,
    super.prefixIcon,
    super.suffixIcon,
    super.isLoading = false,
    super.isFullWidth = false,
    super.hapticFeedback = true,
  }) : super(variant: AppButtonVariant.primary);
}

/// 次要按钮
///
/// 使用次色背景的标准按钮
class SecondaryButton extends AppButton {
  const SecondaryButton({
    super.key,
    required super.label,
    required super.onPressed,
    super.size = AppButtonSize.medium,
    super.prefixIcon,
    super.suffixIcon,
    super.isLoading = false,
    super.isFullWidth = false,
    super.hapticFeedback = true,
  }) : super(variant: AppButtonVariant.secondary);
}

/// 轮廓按钮
///
/// 透明背景带边框的标准按钮
class OutlineButton extends AppButton {
  const OutlineButton({
    super.key,
    required super.label,
    required super.onPressed,
    super.size = AppButtonSize.medium,
    super.prefixIcon,
    super.suffixIcon,
    super.isLoading = false,
    super.borderColor,
    super.textColor,
    super.isFullWidth = false,
    super.hapticFeedback = true,
  }) : super(variant: AppButtonVariant.outline);
}

/// 文本按钮
///
/// 无背景无边框的纯文本按钮
class AppTextButton extends AppButton {
  const AppTextButton({
    super.key,
    required super.label,
    required super.onPressed,
    super.size = AppButtonSize.medium,
    super.prefixIcon,
    super.suffixIcon,
    super.isLoading = false,
    super.textColor,
    super.isFullWidth = false,
    super.hapticFeedback = true,
  }) : super(variant: AppButtonVariant.text);
}

/// 危险按钮
///
/// 使用警告色的标准按钮，用于危险操作
class DangerButton extends AppButton {
  const DangerButton({
    super.key,
    required super.label,
    required super.onPressed,
    super.size = AppButtonSize.medium,
    super.prefixIcon,
    super.suffixIcon,
    super.isLoading = false,
    super.isFullWidth = false,
    super.hapticFeedback = true,
  }) : super(variant: AppButtonVariant.danger);
}
