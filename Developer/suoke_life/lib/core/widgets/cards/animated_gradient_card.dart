import 'package:flutter/material.dart';
import 'dart:async';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';
import 'package:suoke_life/core/theme/app_shapes.dart';

/// 带动画渐变背景的卡片
///
/// 提供流畅的渐变色变换动画，增强视觉体验
/// 适用于突出显示重要内容或增加页面活力
class AnimatedGradientCard extends StatefulWidget {
  /// 卡片标题
  final String? title;

  /// 卡片子标题
  final String? subtitle;

  /// 卡片内容
  final Widget content;

  /// 卡片高度
  final double? height;

  /// 卡片宽度
  final double? width;

  /// 卡片圆角半径
  final double borderRadius;

  /// 渐变色列表
  final List<List<Color>> gradients;

  /// 渐变方向
  final GradientDirection direction;

  /// 动画持续时间
  final Duration animationDuration;

  /// 颜色停留时间
  final Duration colorChangeInterval;

  /// 标题文本颜色
  final Color titleColor;

  /// 副标题文本颜色
  final Color subtitleColor;

  /// 前导图标
  final IconData? leadingIcon;

  /// 前导图标颜色
  final Color? iconColor;

  /// 点击回调
  final VoidCallback? onTap;

  /// 阴影高度
  final double elevation;

  /// 内边距
  final EdgeInsetsGeometry padding;

  /// 外边距
  final EdgeInsetsGeometry? margin;

  /// 是否自动开始动画
  final bool autoStart;

  const AnimatedGradientCard({
    Key? key,
    this.title,
    this.subtitle,
    required this.content,
    this.height,
    this.width,
    this.borderRadius = 16.0,
    this.gradients = const [
      [Color(0xFF35BB78), Color(0xFF7FDCAA)], // 索克绿渐变
      [Color(0xFF7FDCAA), Color(0xFF35BB78)], // 反向索克绿渐变
      [Color(0xFFFF6800), Color(0xFFFFB74D)], // 索克橙渐变
      [Color(0xFFFFB74D), Color(0xFFFF6800)], // 反向索克橙渐变
    ],
    this.direction = GradientDirection.leftToRight,
    this.animationDuration = const Duration(seconds: 3),
    this.colorChangeInterval = const Duration(seconds: 5),
    this.titleColor = Colors.white,
    this.subtitleColor = Colors.white70,
    this.leadingIcon,
    this.iconColor,
    this.onTap,
    this.elevation = 4.0,
    this.padding = const EdgeInsets.all(16.0),
    this.margin,
    this.autoStart = true,
  }) : super(key: key);

  @override
  State<AnimatedGradientCard> createState() => _AnimatedGradientCardState();
}

class _AnimatedGradientCardState extends State<AnimatedGradientCard>
    with SingleTickerProviderStateMixin {
  // 动画控制器
  late AnimationController _animationController;

  // 颜色切换定时器
  Timer? _colorChangeTimer;

  // 当前渐变色索引
  int _currentGradientIndex = 0;

  // 下一个渐变色索引
  int _nextGradientIndex = 1;

  // 动画值
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();

    // 初始化动画控制器
    _animationController = AnimationController(
      vsync: this,
      duration: widget.animationDuration,
    );

    // 创建动画
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );

    // 监听动画完成事件
    _animationController.addStatusListener(_onAnimationStatusChanged);

    // 如果设置了自动开始，则启动颜色切换定时器
    if (widget.autoStart) {
      _startColorChangeTimer();
    }
  }

  @override
  void dispose() {
    _animationController.removeStatusListener(_onAnimationStatusChanged);
    _animationController.dispose();
    _colorChangeTimer?.cancel();
    super.dispose();
  }

  // 监听动画状态变化
  void _onAnimationStatusChanged(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      // 动画完成后，更新当前渐变色索引
      setState(() {
        _currentGradientIndex = _nextGradientIndex;
        _nextGradientIndex = (_nextGradientIndex + 1) % widget.gradients.length;
      });

      // 重置动画控制器
      _animationController.reset();
    }
  }

  // 启动颜色切换定时器
  void _startColorChangeTimer() {
    // 先取消已有的定时器
    _colorChangeTimer?.cancel();

    // 创建新的定时器
    _colorChangeTimer = Timer.periodic(widget.colorChangeInterval, (timer) {
      if (mounted) {
        // 更新下一个渐变色索引
        setState(() {
          _nextGradientIndex =
              (_currentGradientIndex + 1) % widget.gradients.length;
        });

        // 启动动画
        _animationController.forward();
      }
    });
  }

  // 手动切换到下一个渐变色
  void _moveToNextGradient() {
    if (_animationController.isAnimating) return;

    setState(() {
      _nextGradientIndex =
          (_currentGradientIndex + 1) % widget.gradients.length;
    });

    _animationController.forward();
  }

  @override
  Widget build(BuildContext context) {
    // 获取当前和下一个渐变色
    final List<Color> currentGradient = widget.gradients[_currentGradientIndex];
    final List<Color> nextGradient = widget.gradients[_nextGradientIndex];

    // 创建插值渐变色
    List<Color> interpolatedGradient = [];
    for (int i = 0; i < currentGradient.length; i++) {
      interpolatedGradient.add(
        Color.lerp(
          currentGradient[i],
          nextGradient[i],
          _animation.value,
        )!,
      );
    }

    // 根据方向设置渐变
    Alignment begin;
    Alignment end;

    switch (widget.direction) {
      case GradientDirection.leftToRight:
        begin = Alignment.centerLeft;
        end = Alignment.centerRight;
        break;
      case GradientDirection.rightToLeft:
        begin = Alignment.centerRight;
        end = Alignment.centerLeft;
        break;
      case GradientDirection.topToBottom:
        begin = Alignment.topCenter;
        end = Alignment.bottomCenter;
        break;
      case GradientDirection.bottomToTop:
        begin = Alignment.bottomCenter;
        end = Alignment.topCenter;
        break;
      case GradientDirection.diagonal:
        begin = Alignment.topLeft;
        end = Alignment.bottomRight;
        break;
      case GradientDirection.diagonalReverse:
        begin = Alignment.bottomRight;
        end = Alignment.topLeft;
        break;
    }

    // 创建渐变背景
    final LinearGradient gradient = LinearGradient(
      begin: begin,
      end: end,
      colors: interpolatedGradient,
    );

    // 构建卡片内容
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return GestureDetector(
          onTap: widget.onTap ?? _moveToNextGradient,
          child: Container(
            width: widget.width,
            height: widget.height,
            margin: widget.margin,
            decoration: BoxDecoration(
              gradient: gradient,
              borderRadius: BorderRadius.circular(widget.borderRadius),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(50),
                  blurRadius: widget.elevation * 2,
                  offset: Offset(0, widget.elevation),
                ),
              ],
            ),
            child: child,
          ),
        );
      },
      child: Padding(
        padding: widget.padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 标题行
            if (widget.title != null || widget.leadingIcon != null) ...[
              Row(
                children: [
                  // 前导图标
                  if (widget.leadingIcon != null) ...[
                    Icon(
                      widget.leadingIcon,
                      color: widget.iconColor ?? widget.titleColor,
                      size: 24,
                    ),
                    SizedBox(width: AppSpacing.sm),
                  ],

                  // 标题和副标题
                  if (widget.title != null)
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.title!,
                            style: TextStyle(
                              color: widget.titleColor,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (widget.subtitle != null) ...[
                            SizedBox(height: 2),
                            Text(
                              widget.subtitle!,
                              style: TextStyle(
                                color: widget.subtitleColor,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                ],
              ),
              SizedBox(height: AppSpacing.sm),
            ],

            // 内容
            Expanded(child: widget.content),
          ],
        ),
      ),
    );
  }
}

/// 渐变方向枚举
enum GradientDirection {
  /// 从左到右
  leftToRight,

  /// 从右到左
  rightToLeft,

  /// 从上到下
  topToBottom,

  /// 从下到上
  bottomToTop,

  /// 对角线（左上到右下）
  diagonal,

  /// 反向对角线（右下到左上）
  diagonalReverse,
}
