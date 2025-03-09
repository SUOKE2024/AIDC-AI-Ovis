import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_shapes.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';
import 'package:suoke_life/core/widgets/buttons/app_button.dart';

/// 对话框类型枚举
enum AppDialogType {
  /// 标准对话框
  standard,

  /// 操作确认对话框
  confirmation,

  /// 成功对话框
  success,

  /// 警告对话框
  warning,

  /// 错误对话框
  error,

  /// 信息对话框
  info,
}

/// 索克风格统一对话框组件
///
/// 提供统一样式的对话框组件，支持多种类型和自定义内容。
/// 使用示例:
/// ```dart
/// AppDialog.show(
///   context: context,
///   title: '标题',
///   content: '内容',
///   type: AppDialogType.standard,
/// );
/// ```
class AppDialog extends StatelessWidget {
  /// 对话框标题
  final String title;

  /// 对话框内容
  final String? content;

  /// 对话框类型
  final AppDialogType type;

  /// 自定义内容组件
  final Widget? customContent;

  /// 确认按钮文本
  final String confirmText;

  /// 取消按钮文本
  final String? cancelText;

  /// 确认按钮回调
  final VoidCallback? onConfirm;

  /// 取消按钮回调
  final VoidCallback? onCancel;

  /// 是否使用磨砂玻璃效果
  final bool useBlurEffect;

  /// 是否可通过点击外部关闭
  final bool barrierDismissible;

  /// 自定义图标
  final IconData? customIcon;

  /// 自定义图标颜色
  final Color? customIconColor;

  const AppDialog({
    super.key,
    required this.title,
    this.content,
    this.type = AppDialogType.standard,
    this.customContent,
    this.confirmText = '确定',
    this.cancelText,
    this.onConfirm,
    this.onCancel,
    this.useBlurEffect = true,
    this.barrierDismissible = true,
    this.customIcon,
    this.customIconColor,
  });

  /// 显示对话框的静态方法
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    String? content,
    AppDialogType type = AppDialogType.standard,
    Widget? customContent,
    String confirmText = '确定',
    String? cancelText,
    VoidCallback? onConfirm,
    VoidCallback? onCancel,
    bool useBlurEffect = true,
    bool barrierDismissible = true,
    IconData? customIcon,
    Color? customIconColor,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (BuildContext context) {
        return AppDialog(
          title: title,
          content: content,
          type: type,
          customContent: customContent,
          confirmText: confirmText,
          cancelText: cancelText,
          onConfirm: onConfirm ?? () => Navigator.of(context).pop(true),
          onCancel: onCancel ?? () => Navigator.of(context).pop(false),
          useBlurEffect: useBlurEffect,
          customIcon: customIcon,
          customIconColor: customIconColor,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    // 对话框内容
    Widget dialogContent = _buildDialogContent(context, isDarkMode);

    // 应用磨砂玻璃效果
    if (useBlurEffect) {
      dialogContent = BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: dialogContent,
      );
    }

    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: EdgeInsets.symmetric(
        horizontal: MediaQuery.of(context).size.width * 0.1,
        vertical: 24.0,
      ),
      child: dialogContent,
    );
  }

  /// 构建对话框内容
  Widget _buildDialogContent(BuildContext context, bool isDarkMode) {
    return Container(
      decoration: BoxDecoration(
        color: isDarkMode ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(AppShapes.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(30),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // 头部图标
          if (_shouldShowIcon()) ...[
            Padding(
              padding: EdgeInsets.only(
                top: AppSpacing.lg,
                bottom: AppSpacing.md,
              ),
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: _getIconBackgroundColor(isDarkMode).withAlpha(30),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  customIcon ?? _getTypeIcon(),
                  color: customIconColor ?? _getIconColor(isDarkMode),
                  size: 32,
                ),
              ),
            ),
          ],

          // 标题
          Padding(
            padding: EdgeInsets.only(
              left: AppSpacing.lg,
              right: AppSpacing.lg,
              top: _shouldShowIcon() ? AppSpacing.xs : AppSpacing.lg,
              bottom: (content != null || customContent != null)
                  ? AppSpacing.sm
                  : AppSpacing.md,
            ),
            child: Text(
              title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDarkMode
                    ? AppColors.darkTextPrimary
                    : AppColors.lightTextPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ),

          // 内容文本
          if (content != null)
            Padding(
              padding: EdgeInsets.only(
                left: AppSpacing.lg,
                right: AppSpacing.lg,
                bottom: AppSpacing.lg,
              ),
              child: Text(
                content!,
                style: TextStyle(
                  fontSize: 16,
                  color: isDarkMode
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ),

          // 自定义内容
          if (customContent != null)
            Padding(
              padding: EdgeInsets.only(
                left: AppSpacing.lg,
                right: AppSpacing.lg,
                bottom: AppSpacing.lg,
              ),
              child: customContent!,
            ),

          // 操作按钮
          _buildActionButtons(context, isDarkMode),
        ],
      ),
    );
  }

  /// 构建操作按钮
  Widget _buildActionButtons(BuildContext context, bool isDarkMode) {
    // 仅有确认按钮
    if (cancelText == null) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.only(top: 0),
        height: 56,
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: isDarkMode ? AppColors.darkBorder : AppColors.lightBorder,
              width: 0.5,
            ),
          ),
        ),
        child: _buildConfirmButton(context, isDarkMode, isFullWidth: true),
      );
    }

    // 确认和取消按钮
    return Container(
      height: 56,
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: isDarkMode ? AppColors.darkBorder : AppColors.lightBorder,
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        children: [
          // 取消按钮
          Expanded(
            child: _buildCancelButton(context, isDarkMode),
          ),

          // 分隔线
          Container(
            width: 0.5,
            height: 56,
            color: isDarkMode ? AppColors.darkBorder : AppColors.lightBorder,
          ),

          // 确认按钮
          Expanded(
            child: _buildConfirmButton(context, isDarkMode),
          ),
        ],
      ),
    );
  }

  /// 构建确认按钮
  Widget _buildConfirmButton(BuildContext context, bool isDarkMode,
      {bool isFullWidth = false}) {
    return InkWell(
      onTap: onConfirm,
      child: SizedBox(
        height: 56,
        child: Center(
          child: Text(
            confirmText,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: _getConfirmButtonColor(isDarkMode),
            ),
          ),
        ),
      ),
    );
  }

  /// 构建取消按钮
  Widget _buildCancelButton(BuildContext context, bool isDarkMode) {
    return InkWell(
      onTap: onCancel,
      child: SizedBox(
        height: 56,
        child: Center(
          child: Text(
            cancelText!,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: isDarkMode
                  ? AppColors.darkTextSecondary
                  : AppColors.lightTextSecondary,
            ),
          ),
        ),
      ),
    );
  }

  /// 获取类型图标
  IconData _getTypeIcon() {
    switch (type) {
      case AppDialogType.confirmation:
        return Icons.help_outline;
      case AppDialogType.success:
        return Icons.check_circle_outline;
      case AppDialogType.warning:
        return Icons.warning_amber;
      case AppDialogType.error:
        return Icons.error_outline;
      case AppDialogType.info:
        return Icons.info_outline;
      case AppDialogType.standard:
      default:
        return Icons.info_outline;
    }
  }

  /// 获取图标背景色
  Color _getIconBackgroundColor(bool isDarkMode) {
    switch (type) {
      case AppDialogType.confirmation:
        return AppColors.infoColor;
      case AppDialogType.success:
        return AppColors.successColor;
      case AppDialogType.warning:
        return AppColors.warningColor;
      case AppDialogType.error:
        return AppColors.errorColor;
      case AppDialogType.info:
        return AppColors.infoColor;
      case AppDialogType.standard:
      default:
        return AppColors.primaryColor;
    }
  }

  /// 获取图标颜色
  Color _getIconColor(bool isDarkMode) {
    return _getIconBackgroundColor(isDarkMode);
  }

  /// 获取确认按钮颜色
  Color _getConfirmButtonColor(bool isDarkMode) {
    switch (type) {
      case AppDialogType.error:
        return AppColors.errorColor;
      case AppDialogType.warning:
        return AppColors.warningColor;
      case AppDialogType.success:
        return AppColors.successColor;
      case AppDialogType.confirmation:
      case AppDialogType.info:
      case AppDialogType.standard:
      default:
        return AppColors.primaryColor;
    }
  }

  /// 是否应显示图标
  bool _shouldShowIcon() {
    return type != AppDialogType.standard || customIcon != null;
  }
}

/// 确认对话框
///
/// 用于用户操作确认，如删除、退出等重要操作。
class ConfirmationDialog extends StatelessWidget {
  /// 对话框标题
  final String title;

  /// 对话框内容
  final String content;

  /// 确认按钮文本
  final String confirmText;

  /// 取消按钮文本
  final String cancelText;

  /// 确认操作危险性
  final bool isDangerous;

  /// 自定义图标
  final IconData? customIcon;

  const ConfirmationDialog({
    super.key,
    required this.title,
    required this.content,
    this.confirmText = '确认',
    this.cancelText = '取消',
    this.isDangerous = false,
    this.customIcon,
  });

  /// 显示确认对话框
  static Future<bool?> show({
    required BuildContext context,
    required String title,
    required String content,
    String confirmText = '确认',
    String cancelText = '取消',
    bool isDangerous = false,
    IconData? customIcon,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => ConfirmationDialog(
        title: title,
        content: content,
        confirmText: confirmText,
        cancelText: cancelText,
        isDangerous: isDangerous,
        customIcon: customIcon,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppDialog(
      title: title,
      content: content,
      type: isDangerous ? AppDialogType.warning : AppDialogType.confirmation,
      confirmText: confirmText,
      cancelText: cancelText,
      onConfirm: () => Navigator.of(context).pop(true),
      onCancel: () => Navigator.of(context).pop(false),
      customIcon: customIcon,
    );
  }
}

/// 操作结果对话框
///
/// 用于显示操作结果，如成功、失败、警告等。
class ResultDialog extends StatelessWidget {
  /// 对话框标题
  final String title;

  /// 对话框内容
  final String? content;

  /// 对话框类型
  final AppDialogType type;

  /// 按钮文本
  final String buttonText;

  /// 自定义按钮操作
  final VoidCallback? onButtonPressed;

  const ResultDialog({
    super.key,
    required this.title,
    this.content,
    required this.type,
    this.buttonText = '确定',
    this.onButtonPressed,
  });

  /// 显示操作结果对话框
  static Future<void> show({
    required BuildContext context,
    required String title,
    String? content,
    required AppDialogType type,
    String buttonText = '确定',
    VoidCallback? onButtonPressed,
  }) {
    return showDialog<void>(
      context: context,
      builder: (context) => ResultDialog(
        title: title,
        content: content,
        type: type,
        buttonText: buttonText,
        onButtonPressed: onButtonPressed ?? () => Navigator.of(context).pop(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppDialog(
      title: title,
      content: content,
      type: type,
      confirmText: buttonText,
      onConfirm: onButtonPressed ?? () => Navigator.of(context).pop(),
    );
  }
}
