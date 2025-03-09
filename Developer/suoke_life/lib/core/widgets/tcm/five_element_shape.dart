import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';

/// 五行元素形状组件
///
/// 显示基于中医五行理论的特殊形状视觉元素
/// 支持木、火、土、金、水五种元素形状
class FiveElementShape extends StatelessWidget {
  /// 五行元素类型
  final ElementType elementType;

  /// 尺寸大小
  final double size;

  /// 填充颜色
  final Color? fillColor;

  /// 边框颜色
  final Color? borderColor;

  /// 边框宽度
  final double borderWidth;

  /// 旋转角度（弧度）
  final double rotation;

  /// 是否带阴影
  final bool hasShadow;

  /// 是否动画呼吸效果
  final bool enableBreathing;

  /// 背景颜色
  final Color? backgroundColor;

  /// 内边距
  final double padding;

  FiveElementShape({
    Key? key,
    required this.elementType,
    this.size = 100.0,
    this.fillColor,
    this.borderColor,
    this.borderWidth = 2.0,
    this.rotation = 0.0,
    this.hasShadow = true,
    this.enableBreathing = false,
    this.backgroundColor,
    this.padding = 4.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // 获取五行颜色
    final color = fillColor ?? FiveElements.getElementColor(elementType);
    final border = borderColor ?? color.withAlpha(200);

    // 创建基本容器
    Widget shape = _buildElementShape(color, border);

    // 添加旋转效果
    if (rotation != 0.0) {
      shape = Transform.rotate(
        angle: rotation,
        child: shape,
      );
    }

    // 添加背景和内边距（先处理这个，再处理动画）
    if (backgroundColor != null || padding > 0) {
      Widget paddedShape = Padding(
        padding: EdgeInsets.all(padding),
        child: shape,
      );

      if (backgroundColor != null) {
        // 使用ClipRRect代替BoxShape+borderRadius组合
        paddedShape = ClipRRect(
          borderRadius: BorderRadius.circular(size / 2),
          child: Container(
            color: backgroundColor,
            child: paddedShape,
          ),
        );
      }

      shape = paddedShape;
    }

    // 添加呼吸动画效果（放在最外层）
    if (enableBreathing) {
      shape = _BreathingAnimation(
        child: shape,
      );
    }

    return shape;
  }

  // 根据元素类型构建不同形状
  Widget _buildElementShape(Color fillColor, Color borderColor) {
    switch (elementType) {
      case ElementType.wood:
        return _buildWoodShape(fillColor, borderColor);
      case ElementType.fire:
        return _buildFireShape(fillColor, borderColor);
      case ElementType.earth:
        return _buildEarthShape(fillColor, borderColor);
      case ElementType.metal:
        return _buildMetalShape(fillColor, borderColor);
      case ElementType.water:
        return _buildWaterShape(fillColor, borderColor);
    }
  }

  // 木形（矩形/柱形）
  Widget _buildWoodShape(Color fillColor, Color borderColor) {
    // 使用ClipRRect代替BoxShape+borderRadius
    return ClipRRect(
      borderRadius: BorderRadius.circular(size * 0.2),
      child: Container(
        width: size,
        height: size,
        color: fillColor,
        foregroundDecoration: BoxDecoration(
          border: Border.all(
            color: borderColor,
            width: borderWidth,
          ),
          borderRadius: BorderRadius.circular(size * 0.2),
        ),
        child: hasShadow ? _buildShadowEffect(fillColor) : null,
      ),
    );
  }

  // 火形（三角形/火苗形）
  Widget _buildFireShape(Color fillColor, Color borderColor) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _FirePainter(
          fillColor: fillColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          hasShadow: hasShadow,
        ),
      ),
    );
  }

  // 土形（方形/矩形）
  Widget _buildEarthShape(Color fillColor, Color borderColor) {
    // 使用ClipRRect代替BoxShape+borderRadius
    return ClipRRect(
      borderRadius: BorderRadius.circular(size * 0.15),
      child: Container(
        width: size,
        height: size,
        color: fillColor,
        foregroundDecoration: BoxDecoration(
          border: Border.all(
            color: borderColor,
            width: borderWidth,
          ),
          borderRadius: BorderRadius.circular(size * 0.15),
        ),
        child: hasShadow ? _buildShadowEffect(fillColor) : null,
      ),
    );
  }

  // 金形（圆形/金属光泽）
  Widget _buildMetalShape(Color fillColor, Color borderColor) {
    // 使用ClipOval代替BoxShape.circle
    return ClipOval(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          gradient: RadialGradient(
            colors: [
              fillColor,
              fillColor.withAlpha(200),
              fillColor.withAlpha(150),
            ],
            stops: const [0.0, 0.7, 1.0],
          ),
        ),
        foregroundDecoration: BoxDecoration(
          border: Border.all(
            color: borderColor,
            width: borderWidth,
          ),
          shape: BoxShape.circle,
        ),
        child: hasShadow ? _buildCircularShadowEffect(fillColor) : null,
      ),
    );
  }

  // 水形（波浪形/圆形）
  Widget _buildWaterShape(Color fillColor, Color borderColor) {
    // 使用ClipOval代替BoxShape.circle
    return ClipOval(
      child: Container(
        width: size,
        height: size,
        color: fillColor,
        foregroundDecoration: BoxDecoration(
          border: Border.all(
            color: borderColor,
            width: borderWidth,
          ),
          shape: BoxShape.circle,
        ),
        child: Stack(
          children: [
            if (hasShadow) _buildCircularShadowEffect(fillColor),
            CustomPaint(
              painter: _WavePainter(
                fillColor: fillColor.withAlpha(180),
                borderColor: Colors.transparent,
                borderWidth: 0,
                hasShadow: false,
              ),
              size: Size(size, size),
            ),
          ],
        ),
      ),
    );
  }

  // 创建矩形阴影效果
  Widget _buildShadowEffect(Color color) {
    return Container(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: color.withAlpha(70),
            blurRadius: 8.0,
            spreadRadius: 2.0,
          ),
        ],
      ),
    );
  }

  // 创建圆形阴影效果
  Widget _buildCircularShadowEffect(Color color) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withAlpha(70),
            blurRadius: 8.0,
            spreadRadius: 2.0,
          ),
        ],
      ),
    );
  }
}

// 三角形绘制器（火形）
class _TrianglePainter extends CustomPainter {
  final Color fillColor;
  final Color borderColor;
  final double borderWidth;
  final bool hasShadow;

  _TrianglePainter({
    required this.fillColor,
    required this.borderColor,
    required this.borderWidth,
    required this.hasShadow,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final Paint fillPaint = Paint()
      ..color = fillColor
      ..style = PaintingStyle.fill;

    final Paint borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final path = Path();
    path.moveTo(size.width / 2, 0);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    // 绘制阴影
    if (hasShadow) {
      canvas.drawShadow(path, fillColor.withAlpha(70), 6.0, true);
    }

    // 绘制填充
    canvas.drawPath(path, fillPaint);

    // 绘制边框
    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// 波浪形状绘制器
class _WavePainter extends CustomPainter {
  final Color fillColor;
  final Color borderColor;
  final double borderWidth;
  final bool hasShadow;

  _WavePainter({
    required this.fillColor,
    required this.borderColor,
    required this.borderWidth,
    required this.hasShadow,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final radius = size.width / 2;
    final center = Offset(size.width / 2, size.height / 2);

    // 波浪的路径
    final Path wavePath = Path();

    // 设定波浪的参数
    final waveHeight = size.height * 0.15; // 波浪高度
    final waveCount = 2; // 波浪数量

    // 绘制波浪路径
    wavePath.moveTo(0, size.height * 0.6);

    for (int i = 0; i <= size.width; i++) {
      // 使用正弦函数创建波浪效果
      final double x = i.toDouble();
      final double normalizedX = x / size.width; // 归一化的x值(0到1)
      final double y = size.height * 0.6 +
          math.sin(normalizedX * math.pi * waveCount) * waveHeight;

      wavePath.lineTo(x, y);
    }

    // 完成路径
    wavePath.lineTo(size.width, size.height);
    wavePath.lineTo(0, size.height);
    wavePath.close();

    // 创建画笔
    final Paint wavePaint = Paint()
      ..color = fillColor
      ..style = PaintingStyle.fill;

    final Paint borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    // 限制绘制区域在圆内
    final Path clipPath = Path()
      ..addOval(
          Rect.fromCircle(center: center, radius: radius - borderWidth / 2));
    canvas.clipPath(clipPath);

    // 绘制波浪
    canvas.drawPath(wavePath, wavePaint);

    // 如果需要阴影（通常在外部容器上添加）
    if (hasShadow) {
      canvas.drawShadow(wavePath, fillColor.withAlpha(70), 8.0, true);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// 呼吸动画包装组件
class _BreathingAnimation extends StatefulWidget {
  final Widget child;

  const _BreathingAnimation({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  _BreathingAnimationState createState() => _BreathingAnimationState();
}

class _BreathingAnimationState extends State<_BreathingAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.scale(
          scale: _animation.value,
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// 五行元素组展示
///
/// 显示五行元素的组合，按照相生或相克顺序排列
class FiveElementGroup extends StatelessWidget {
  /// 尺寸
  final double elementSize;

  /// 是否按照相生顺序排列
  final bool generationCycle;

  /// 旋转角度（弧度）
  final double rotation;

  /// 是否启用呼吸效果
  final bool enableBreathing;

  /// 容器大小
  final double? containerSize;

  /// 自定义颜色
  final Map<ElementType, Color>? customColors;

  /// 边框宽度
  final double borderWidth;

  FiveElementGroup({
    Key? key,
    this.elementSize = 40.0,
    this.generationCycle = true,
    this.rotation = 0.0,
    this.enableBreathing = false,
    this.containerSize,
    this.customColors,
    this.borderWidth = 2.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // 决定元素顺序
    // 相生顺序：木→火→土→金→水→木
    // 相克顺序：木→土→水→火→金→木
    List<ElementType> elementOrder = generationCycle
        ? [
            ElementType.wood,
            ElementType.fire,
            ElementType.earth,
            ElementType.metal,
            ElementType.water
          ]
        : [
            ElementType.wood,
            ElementType.earth,
            ElementType.water,
            ElementType.fire,
            ElementType.metal
          ];

    // 计算容器大小
    final double effectiveSize = containerSize ?? (elementSize * 3.5);

    return SizedBox(
      width: effectiveSize,
      height: effectiveSize,
      child: Stack(
        clipBehavior: Clip.none, // 允许子元素溢出边界
        children: [
          // 中心线（可选）
          if (false) // 设置为true以调试位置
            Positioned.fill(
              child: CustomPaint(
                painter: _CenterLinesPainter(),
              ),
            ),

          // 根据元素类型和位置放置形状
          ...List.generate(5, (index) {
            final element = elementOrder[index];
            final angle = (2 * math.pi / 5) * index + rotation;
            final radius = effectiveSize * 0.38;

            // 计算位置
            final x = effectiveSize / 2 + radius * math.cos(angle);
            final y = effectiveSize / 2 + radius * math.sin(angle);

            // 获取颜色，添加安全检查
            final color =
                (customColors != null && customColors!.containsKey(element))
                    ? customColors![element]
                    : FiveElements.getElementColor(element);

            // 安全校正位置，避免溢出
            final safeLeft = math.max(0.0,
                math.min(effectiveSize - elementSize, x - elementSize / 2));
            final safeTop = math.max(0.0,
                math.min(effectiveSize - elementSize, y - elementSize / 2));

            return Positioned(
              left: safeLeft,
              top: safeTop,
              width: elementSize,
              height: elementSize,
              child: FiveElementShape(
                elementType: element,
                size: elementSize,
                fillColor: color,
                enableBreathing: enableBreathing,
                borderWidth: borderWidth,
                // 移除其他可能导致BoxDecoration问题的属性
                backgroundColor: null,
                padding: 0,
              ),
            );
          }),
        ],
      ),
    );
  }
}

// 辅助绘制器，用于调试中心线
class _CenterLinesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = Colors.grey.withAlpha(100)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // 绘制十字中心线
    canvas.drawLine(
      Offset(0, size.height / 2),
      Offset(size.width, size.height / 2),
      paint,
    );

    canvas.drawLine(
      Offset(size.width / 2, 0),
      Offset(size.width / 2, size.height),
      paint,
    );

    // 绘制中心圆
    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width * 0.38,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// 火苗形状绘制器
class _FirePainter extends CustomPainter {
  final Color fillColor;
  final Color borderColor;
  final double borderWidth;
  final bool hasShadow;

  _FirePainter({
    required this.fillColor,
    required this.borderColor,
    required this.borderWidth,
    required this.hasShadow,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final Paint fillPaint = Paint()
      ..color = fillColor
      ..style = PaintingStyle.fill;

    final Paint borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    // 绘制一个火苗形状
    Path path = Path();

    // 火苗底部的起点
    path.moveTo(size.width * 0.5, size.height);

    // 左侧曲线
    path.quadraticBezierTo(size.width * 0.2, size.height * 0.7,
        size.width * 0.25, size.height * 0.5);
    path.quadraticBezierTo(size.width * 0.3, size.height * 0.3,
        size.width * 0.5, size.height * 0.1);

    // 右侧曲线
    path.quadraticBezierTo(size.width * 0.7, size.height * 0.3,
        size.width * 0.75, size.height * 0.5);
    path.quadraticBezierTo(
        size.width * 0.8, size.height * 0.7, size.width * 0.5, size.height);

    path.close();

    // 绘制阴影
    if (hasShadow) {
      canvas.drawShadow(path, fillColor.withAlpha(70), 8.0, true);
    }

    // 填充和描边
    canvas.drawPath(path, fillPaint);
    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
