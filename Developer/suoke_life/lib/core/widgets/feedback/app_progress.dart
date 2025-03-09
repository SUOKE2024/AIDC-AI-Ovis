import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_typography.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';

/// 进度指示器类型枚举
enum ProgressType {
  /// 线性进度条
  linear,

  /// 环形进度条
  circular,
}

/// 进度状态枚举
enum ProgressStatus {
  /// 进行中
  processing,

  /// 已完成
  completed,

  /// 警告
  warning,

  /// 错误
  error,
}

/// 索克风格进度指示器组件
///
/// 用于展示操作进度、加载状态和进度跟踪
/// 样例:
/// ```dart
/// AppProgress(
///   value: 0.75,
///   type: ProgressType.linear,
///   showLabel: true,
/// )
/// ```
class AppProgress extends StatelessWidget {
  /// 进度值（0.0到1.0）
  final double? value;

  /// 进度指示器类型
  final ProgressType type;

  /// 进度状态
  final ProgressStatus status;

  /// 是否显示标签
  final bool showLabel;

  /// 自定义标签格式化函数
  final String Function(double value)? labelFormatter;

  /// 进度条颜色
  final Color? color;

  /// 背景颜色
  final Color? backgroundColor;

  /// 关联的五行元素
  final ElementType? elementType;

  /// 线性进度条高度
  final double lineHeight;

  /// 环形进度条尺寸
  final double circularSize;

  /// 环形进度条粗细
  final double circularStrokeWidth;

  /// 动画持续时间
  final Duration animationDuration;

  /// 显示渐变效果
  final bool useGradient;

  /// 环形进度条中心内容构建器
  final Widget Function(double? value, ProgressStatus status)? centerBuilder;

  const AppProgress({
    Key? key,
    this.value,
    this.type = ProgressType.linear,
    this.status = ProgressStatus.processing,
    this.showLabel = false,
    this.labelFormatter,
    this.color,
    this.backgroundColor,
    this.elementType,
    this.lineHeight = 8.0,
    this.circularSize = 60.0,
    this.circularStrokeWidth = 6.0,
    this.animationDuration = const Duration(milliseconds: 300),
    this.useGradient = true,
    this.centerBuilder,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // 根据类型构建不同的进度指示器
    switch (type) {
      case ProgressType.linear:
        return _buildLinearProgress();
      case ProgressType.circular:
        return _buildCircularProgress();
    }
  }

  /// 构建线性进度条
  Widget _buildLinearProgress() {
    // 获取进度条颜色
    final progressColor = _getProgressColor();
    final bgColor = backgroundColor ?? progressColor.withAlpha(30);

    // 构建基础进度条
    Widget progressBar = Container(
      height: lineHeight,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(lineHeight / 2),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(lineHeight / 2),
        child: AnimatedContainer(
          duration: animationDuration,
          alignment: Alignment.centerLeft,
          child: value != null
              ? FractionallySizedBox(
                  widthFactor: value!.clamp(0.0, 1.0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: useGradient ? null : progressColor,
                      gradient: useGradient
                          ? LinearGradient(
                              colors: [
                                progressColor.withAlpha(200),
                                progressColor,
                              ],
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                            )
                          : null,
                    ),
                  ),
                )
              : _buildIndeterminateAnimation(progressColor),
        ),
      ),
    );

    // 如果需要显示标签，添加标签
    if (showLabel && value != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          progressBar,
          const SizedBox(height: 4.0),
          Text(
            _formatLabel(value!),
            style: AppTypography.captionStyle.copyWith(
              color: progressColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      );
    }

    return progressBar;
  }

  /// 构建环形进度条
  Widget _buildCircularProgress() {
    // 获取进度条颜色
    final progressColor = _getProgressColor();
    final bgColor = backgroundColor ?? progressColor.withAlpha(30);

    // 构建环形进度条
    return SizedBox(
      width: circularSize,
      height: circularSize,
      child: Stack(
        children: [
          // 背景圆环
          Center(
            child: SizedBox(
              width: circularSize,
              height: circularSize,
              child: CircularProgressIndicator(
                value: 1.0,
                strokeWidth: circularStrokeWidth,
                backgroundColor: bgColor,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.transparent),
              ),
            ),
          ),

          // 前景圆环（进度）
          Center(
            child: SizedBox(
              width: circularSize,
              height: circularSize,
              child: CircularProgressIndicator(
                value: value,
                strokeWidth: circularStrokeWidth,
                valueColor: AlwaysStoppedAnimation<Color>(progressColor),
              ),
            ),
          ),

          // 中心内容
          if (centerBuilder != null)
            Center(
              child: centerBuilder!(value, status),
            )
          else if (showLabel && value != null)
            Center(
              child: Text(
                _formatLabel(value!),
                style: AppTypography.body1Style.copyWith(
                  color: progressColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// 构建不确定进度的动画效果
  Widget _buildIndeterminateAnimation(Color color) {
    return LinearProgressIndicator(
      backgroundColor: Colors.transparent,
      valueColor: AlwaysStoppedAnimation<Color>(color),
      minHeight: lineHeight,
    );
  }

  /// 获取进度条颜色
  Color _getProgressColor() {
    // 如果提供了自定义颜色，优先使用
    if (color != null) return color!;

    // 根据状态确定颜色
    switch (status) {
      case ProgressStatus.processing:
        if (elementType != null) {
          // 使用五行元素颜色
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
        return AppColors.primaryColor;

      case ProgressStatus.completed:
        return AppColors.successColor;

      case ProgressStatus.warning:
        return AppColors.warningColor;

      case ProgressStatus.error:
        return AppColors.errorColor;
    }
  }

  /// 格式化标签文本
  String _formatLabel(double value) {
    if (labelFormatter != null) {
      return labelFormatter!(value);
    }

    // 默认格式化为百分比
    final percentage = (value * 100).round();
    return '$percentage%';
  }
}

/// 五行元素进度条
///
/// 根据五行元素风格定制的进度指示器
/// 样例:
/// ```dart
/// FiveElementProgress(
///   value: 0.75,
///   elementType: ElementType.wood,
/// )
/// ```
class FiveElementProgress extends StatelessWidget {
  /// 进度值（0.0到1.0）
  final double? value;

  /// 五行元素类型
  final ElementType elementType;

  /// 进度指示器类型
  final ProgressType type;

  /// 是否显示标签
  final bool showLabel;

  /// 线性进度条高度
  final double lineHeight;

  /// 环形进度条尺寸
  final double circularSize;

  FiveElementProgress({
    Key? key,
    this.value,
    required this.elementType,
    this.type = ProgressType.linear,
    this.showLabel = false,
    this.lineHeight = 8.0,
    this.circularSize = 60.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AppProgress(
      value: value,
      type: type,
      showLabel: showLabel,
      elementType: elementType,
      lineHeight: lineHeight,
      circularSize: circularSize,
      useGradient: true,
    );
  }
}
