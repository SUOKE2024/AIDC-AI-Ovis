import 'package:flutter/material.dart';
import 'dart:async';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_typography.dart';

/// Toast类型枚举
enum ToastType {
  /// 常规信息
  info,

  /// 成功提示
  success,

  /// 警告提示
  warning,

  /// 错误提示
  error,
}

/// Toast位置枚举
enum ToastPosition {
  /// 顶部
  top,

  /// 中间
  center,

  /// 底部
  bottom,
}

/// 索克风格Toast提示组件
///
/// 用于轻量级的用户反馈和消息通知
/// 使用方法:
/// ```dart
/// AppToast.show(
///   context: context,
///   message: '操作成功',
///   type: ToastType.success,
/// );
/// ```
class AppToast {
  /// 显示Toast提示
  static Future<void> show({
    required BuildContext context,
    required String message,
    ToastType type = ToastType.info,
    ToastPosition position = ToastPosition.bottom,
    Duration duration = const Duration(seconds: 2),
    IconData? customIcon,
    Color? backgroundColor,
    TextStyle? textStyle,
    double? width,
    VoidCallback? onDismiss,
  }) async {
    final OverlayState? overlayState = Overlay.of(context);
    if (overlayState == null) return;

    // 创建叠加层条目
    final OverlayEntry overlayEntry = OverlayEntry(
      builder: (BuildContext context) {
        return _ToastWidget(
          message: message,
          type: type,
          position: position,
          customIcon: customIcon,
          backgroundColor: backgroundColor,
          textStyle: textStyle,
          width: width,
        );
      },
    );

    // 显示Toast
    overlayState.insert(overlayEntry);

    // 设置定时器，自动移除Toast
    Timer(duration, () {
      overlayEntry.remove();
      onDismiss?.call();
    });
  }

  /// 显示成功Toast
  static Future<void> success(
    BuildContext context,
    String message, {
    ToastPosition position = ToastPosition.bottom,
    Duration duration = const Duration(seconds: 2),
    VoidCallback? onDismiss,
  }) async {
    return show(
      context: context,
      message: message,
      type: ToastType.success,
      position: position,
      duration: duration,
      onDismiss: onDismiss,
    );
  }

  /// 显示错误Toast
  static Future<void> error(
    BuildContext context,
    String message, {
    ToastPosition position = ToastPosition.bottom,
    Duration duration = const Duration(seconds: 2),
    VoidCallback? onDismiss,
  }) async {
    return show(
      context: context,
      message: message,
      type: ToastType.error,
      position: position,
      duration: duration,
      onDismiss: onDismiss,
    );
  }

  /// 显示警告Toast
  static Future<void> warning(
    BuildContext context,
    String message, {
    ToastPosition position = ToastPosition.bottom,
    Duration duration = const Duration(seconds: 2),
    VoidCallback? onDismiss,
  }) async {
    return show(
      context: context,
      message: message,
      type: ToastType.warning,
      position: position,
      duration: duration,
      onDismiss: onDismiss,
    );
  }

  /// 显示信息Toast
  static Future<void> info(
    BuildContext context,
    String message, {
    ToastPosition position = ToastPosition.bottom,
    Duration duration = const Duration(seconds: 2),
    VoidCallback? onDismiss,
  }) async {
    return show(
      context: context,
      message: message,
      type: ToastType.info,
      position: position,
      duration: duration,
      onDismiss: onDismiss,
    );
  }
}

/// Toast展示组件
class _ToastWidget extends StatefulWidget {
  final String message;
  final ToastType type;
  final ToastPosition position;
  final IconData? customIcon;
  final Color? backgroundColor;
  final TextStyle? textStyle;
  final double? width;

  const _ToastWidget({
    Key? key,
    required this.message,
    required this.type,
    required this.position,
    this.customIcon,
    this.backgroundColor,
    this.textStyle,
    this.width,
  }) : super(key: key);

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _opacityAnimation;
  late Animation<Offset> _positionAnimation;

  @override
  void initState() {
    super.initState();

    // 初始化动画控制器
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    // 透明度动画
    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeIn,
        reverseCurve: Curves.easeOut,
      ),
    );

    // 位置动画
    final Offset beginOffset = _getBeginOffset();
    _positionAnimation = Tween<Offset>(
      begin: beginOffset,
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOut,
      ),
    );

    // 开始动画
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  /// 获取动画起始位置
  Offset _getBeginOffset() {
    switch (widget.position) {
      case ToastPosition.top:
        return const Offset(0.0, -0.5);
      case ToastPosition.center:
        return const Offset(0.0, 0.3);
      case ToastPosition.bottom:
        return const Offset(0.0, 0.5);
    }
  }

  /// 获取Toast图标
  IconData _getToastIcon() {
    if (widget.customIcon != null) return widget.customIcon!;

    switch (widget.type) {
      case ToastType.info:
        return Icons.info_outline;
      case ToastType.success:
        return Icons.check_circle_outline;
      case ToastType.warning:
        return Icons.warning_amber_outlined;
      case ToastType.error:
        return Icons.error_outline;
    }
  }

  /// 获取Toast颜色
  Color _getToastColor() {
    if (widget.backgroundColor != null) return widget.backgroundColor!;

    switch (widget.type) {
      case ToastType.info:
        return AppColors.primaryColor;
      case ToastType.success:
        return AppColors.successColor;
      case ToastType.warning:
        return AppColors.warningColor;
      case ToastType.error:
        return AppColors.errorColor;
    }
  }

  /// 获取Toast位置
  AlignmentGeometry _getToastAlignment() {
    switch (widget.position) {
      case ToastPosition.top:
        return Alignment.topCenter;
      case ToastPosition.center:
        return Alignment.center;
      case ToastPosition.bottom:
        return Alignment.bottomCenter;
    }
  }

  /// 获取Toast边距
  EdgeInsets _getToastMargin() {
    switch (widget.position) {
      case ToastPosition.top:
        return const EdgeInsets.only(top: 60.0, left: 16.0, right: 16.0);
      case ToastPosition.center:
        return const EdgeInsets.symmetric(horizontal: 16.0);
      case ToastPosition.bottom:
        return const EdgeInsets.only(bottom: 60.0, left: 16.0, right: 16.0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final toastIcon = _getToastIcon();
    final toastColor = _getToastColor();
    final toastAlignment = _getToastAlignment();
    final toastMargin = _getToastMargin();

    return Positioned.fill(
      child: IgnorePointer(
        child: AnimatedBuilder(
          animation: _animationController,
          builder: (context, child) {
            return Opacity(
              opacity: _opacityAnimation.value,
              child: Container(
                alignment: toastAlignment,
                margin: toastMargin,
                child: FractionalTranslation(
                  translation: _positionAnimation.value,
                  child: Container(
                    width: widget.width,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 12.0,
                    ),
                    decoration: BoxDecoration(
                      color: toastColor,
                      borderRadius: BorderRadius.circular(8.0),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(30),
                          blurRadius: 8.0,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Icon(
                          toastIcon,
                          color: Colors.white,
                          size: 20.0,
                        ),
                        const SizedBox(width: 8.0),
                        Flexible(
                          child: Text(
                            widget.message,
                            style: widget.textStyle ??
                                AppTypography.body1Style.copyWith(
                                  color: Colors.white,
                                  fontSize: 14.0,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
