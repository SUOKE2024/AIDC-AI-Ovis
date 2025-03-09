import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';
import 'package:suoke_life/core/widgets/tcm/models/radar_chart_data.dart';
import 'package:suoke_life/domain/entities/constitution/constitution_type.dart';

/// TCM体质雷达图组件
///
/// 用于展示体质评估结果，以雷达图形式呈现多维体质数据
class ElementRadarChart extends StatefulWidget {
  /// 雷达图数据
  final RadarChartData data;

  /// 图表尺寸
  final double size;

  /// 轴线数量（同心圆数量）
  final int divisions;

  /// 是否显示数值标签
  final bool showLabels;

  /// 是否显示网格
  final bool showGrid;

  /// 是否显示轴线
  final bool showAxis;

  /// 是否启用动画
  final bool animated;

  /// 点击数据点回调
  final Function(String)? onDataPointTap;

  /// 构造函数
  const ElementRadarChart({
    Key? key,
    required this.data,
    this.size = 300,
    this.divisions = 4,
    this.showLabels = true,
    this.showGrid = true,
    this.showAxis = true,
    this.animated = true,
    this.onDataPointTap,
  }) : super(key: key);

  @override
  State<ElementRadarChart> createState() => _ElementRadarChartState();
}

class _ElementRadarChartState extends State<ElementRadarChart>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;

  // 选中的数据点索引
  int? _selectedIndex;

  @override
  void initState() {
    super.initState();

    // 初始化动画
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    );

    if (widget.animated) {
      _animationController.forward();
    } else {
      _animationController.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(ElementRadarChart oldWidget) {
    super.didUpdateWidget(oldWidget);

    // 当数据变化时重新执行动画
    if (oldWidget.data != widget.data) {
      if (widget.animated) {
        _animationController.reset();
        _animationController.forward();
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Stack(
        children: [
          // 雷达图主体
          AnimatedBuilder(
            animation: _animation,
            builder: (context, _) {
              return CustomPaint(
                size: Size(widget.size, widget.size),
                painter: _RadarChartPainter(
                  data: widget.data,
                  animation: _animation.value,
                  divisions: widget.divisions,
                  showGrid: widget.showGrid,
                  showAxis: widget.showAxis,
                  selectedIndex: _selectedIndex,
                ),
              );
            },
          ),

          // 数据点触摸区域
          _buildTouchAreas(),

          // 标签层
          if (widget.showLabels) _buildLabels(),
        ],
      ),
    );
  }

  // 构建触摸区域
  Widget _buildTouchAreas() {
    final dataPoints = widget.data.dataPoints;
    final center = Offset(widget.size / 2, widget.size / 2);
    final radius = widget.size / 2 * 0.85; // 稍微缩小一点，以适应标签

    // 构建每个数据点的可点击区域
    return Stack(
      children: List.generate(dataPoints.length, (i) {
        final angle = 2 * math.pi * i / dataPoints.length - math.pi / 2;
        final x = center.dx + radius * math.cos(angle);
        final y = center.dy + radius * math.sin(angle);

        // 触摸区域大小
        const touchSize = 40.0;

        return Positioned(
          left: x - touchSize / 2,
          top: y - touchSize / 2,
          child: GestureDetector(
            onTap: () {
              if (widget.onDataPointTap != null) {
                widget.onDataPointTap!(dataPoints[i].label);
              }
              setState(() {
                // 切换选中状态
                _selectedIndex = _selectedIndex == i ? null : i;
              });
            },
            child: Container(
              width: touchSize,
              height: touchSize,
              decoration: BoxDecoration(
                color: Colors.transparent,
                shape: BoxShape.circle,
              ),
            ),
          ),
        );
      }),
    );
  }

  // 构建标签
  Widget _buildLabels() {
    final dataPoints = widget.data.dataPoints;
    final center = Offset(widget.size / 2, widget.size / 2);
    final labelRadius = widget.size / 2 * 0.85; // 稍微缩小一点

    return Stack(
      children: List.generate(dataPoints.length, (i) {
        final angle = 2 * math.pi * i / dataPoints.length - math.pi / 2;
        final isLeft = angle > math.pi / 2 && angle < 3 * math.pi / 2;

        // 标签位置偏移量
        final labelOffset = 20.0;
        final x = center.dx + (labelRadius + labelOffset) * math.cos(angle);
        final y = center.dy + (labelRadius + labelOffset) * math.sin(angle);

        // 获取体质类型颜色
        Color textColor = Colors.black87;
        final label = dataPoints[i].label;
        ElementType? elementType;

        // 尝试将标签转换为体质类型
        try {
          final constitutionType = ConstitutionType.values
              .firstWhere((type) => type.toString().split('.').last == label);

          // 如果找到匹配的体质类型，获取对应的元素类型
          elementType = _getElementForConstitution(constitutionType);
        } catch (_) {
          // 如果没有匹配的体质类型，使用默认值
        }

        if (elementType != null) {
          textColor = FiveElements.getElementColor(elementType);
        }

        // 根据选中状态调整文字样式
        final isSelected = _selectedIndex == i;
        final textStyle = TextStyle(
          color: isSelected ? textColor : textColor.withAlpha(200),
          fontSize: isSelected ? 14.0 : 12.0,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        );

        return Positioned(
          left: x,
          top: y,
          child: Transform.translate(
            offset: Offset(
              isLeft ? -80 : 0, // 左侧标签向左偏移
              -10, // 所有标签上移一点
            ),
            child: SizedBox(
              width: 80,
              child: Text(
                _getLocalizedLabel(dataPoints[i].label),
                textAlign: isLeft ? TextAlign.right : TextAlign.left,
                style: textStyle,
              ),
            ),
          ),
        );
      }),
    );
  }

  // 获取体质对应的五行元素
  ElementType? _getElementForConstitution(ConstitutionType type) {
    switch (type) {
      case ConstitutionType.balanced:
        return ElementType.earth;
      case ConstitutionType.qiDeficiency:
        return ElementType.metal;
      case ConstitutionType.yangDeficiency:
        return ElementType.water;
      case ConstitutionType.yinDeficiency:
        return ElementType.fire;
      case ConstitutionType.phlegmDampness:
        return ElementType.earth;
      case ConstitutionType.dampnessHeat:
        return ElementType.fire;
      case ConstitutionType.bloodStasis:
        return ElementType.water;
      case ConstitutionType.qiStagnation:
        return ElementType.wood;
      case ConstitutionType.allergic:
        return ElementType.metal;
      default:
        return null;
    }
  }

  // 获取本地化标签
  String _getLocalizedLabel(String label) {
    // 将蛇形命名转换为更易读的格式
    // 例如: qiDeficiency -> 气虚体质
    switch (label) {
      case 'balanced':
        return '平和体质';
      case 'qiDeficiency':
        return '气虚体质';
      case 'yangDeficiency':
        return '阳虚体质';
      case 'yinDeficiency':
        return '阴虚体质';
      case 'phlegmDampness':
        return '痰湿体质';
      case 'dampnessHeat':
        return '湿热体质';
      case 'bloodStasis':
        return '血瘀体质';
      case 'qiStagnation':
        return '气郁体质';
      case 'allergic':
        return '过敏体质';
      default:
        return label;
    }
  }
}

/// 雷达图绘制器
class _RadarChartPainter extends CustomPainter {
  final RadarChartData data;
  final double animation;
  final int divisions;
  final bool showGrid;
  final bool showAxis;
  final int? selectedIndex;

  _RadarChartPainter({
    required this.data,
    required this.animation,
    required this.divisions,
    required this.showGrid,
    required this.showAxis,
    this.selectedIndex,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 * 0.85; // 稍微缩小一点，以适应标签

    final dataPoints = data.dataPoints;
    final maxValue = data.maxValue;
    final minValue = data.minValue;
    final dataRange = maxValue - minValue;

    // 如果数据为空，不绘制
    if (dataPoints.isEmpty) return;

    // 绘制背景网格
    if (showGrid) {
      _drawGrid(canvas, center, radius, dataPoints.length, divisions);
    }

    // 绘制轴线
    if (showAxis) {
      _drawAxes(canvas, center, radius, dataPoints.length);
    }

    // 绘制数据多边形
    _drawDataPolygon(canvas, center, radius, dataPoints, dataRange, maxValue);

    // 绘制数据点
    _drawDataPoints(canvas, center, radius, dataPoints, dataRange, maxValue);

    // 绘制选中点的高亮效果
    if (selectedIndex != null && selectedIndex! < dataPoints.length) {
      _drawSelectedPoint(canvas, center, radius, dataPoints[selectedIndex!],
          dataRange, maxValue);
    }
  }

  // 绘制背景网格
  void _drawGrid(
      Canvas canvas, Offset center, double radius, int sides, int divisions) {
    final gridPaint = Paint()
      ..color = Colors.grey.withAlpha(50)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // 绘制同心多边形
    for (int i = 1; i <= divisions; i++) {
      final path = Path();
      final divRadius = radius * i / divisions;

      for (int j = 0; j < sides; j++) {
        final angle = 2 * math.pi * j / sides - math.pi / 2;
        final x = center.dx + divRadius * math.cos(angle);
        final y = center.dy + divRadius * math.sin(angle);

        if (j == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }

      path.close();
      canvas.drawPath(path, gridPaint);
    }
  }

  // 绘制轴线
  void _drawAxes(Canvas canvas, Offset center, double radius, int sides) {
    final axisPaint = Paint()
      ..color = Colors.grey.withAlpha(80)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (int i = 0; i < sides; i++) {
      final angle = 2 * math.pi * i / sides - math.pi / 2;
      final x = center.dx + radius * math.cos(angle);
      final y = center.dy + radius * math.sin(angle);

      canvas.drawLine(center, Offset(x, y), axisPaint);
    }
  }

  // 绘制数据多边形
  void _drawDataPolygon(Canvas canvas, Offset center, double radius,
      List<RadarDataPoint> dataPoints, double dataRange, double maxValue) {
    // 数据面积填充画笔
    final fillPaint = Paint()
      ..color = data.color.withAlpha((50 * animation).toInt())
      ..style = PaintingStyle.fill;

    // 数据边界线画笔
    final strokePaint = Paint()
      ..color = data.color.withAlpha((180 * animation).toInt())
      ..style = PaintingStyle.stroke
      ..strokeWidth = data.lineWidth;

    final path = Path();

    for (int i = 0; i < dataPoints.length; i++) {
      final angle = 2 * math.pi * i / dataPoints.length - math.pi / 2;

      // 计算标准化值（0-1范围）
      final normalizedValue = (dataPoints[i].value - data.minValue) / dataRange;

      // 应用动画值
      final animatedValue = normalizedValue * animation;

      // 计算点在雷达图上的位置
      final x = center.dx + radius * animatedValue * math.cos(angle);
      final y = center.dy + radius * animatedValue * math.sin(angle);

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    path.close();

    // 绘制填充和边界
    canvas.drawPath(path, fillPaint);
    canvas.drawPath(path, strokePaint);
  }

  // 绘制数据点
  void _drawDataPoints(Canvas canvas, Offset center, double radius,
      List<RadarDataPoint> dataPoints, double dataRange, double maxValue) {
    for (int i = 0; i < dataPoints.length; i++) {
      final angle = 2 * math.pi * i / dataPoints.length - math.pi / 2;

      // 计算标准化值（0-1范围）
      final normalizedValue = (dataPoints[i].value - data.minValue) / dataRange;

      // 应用动画值
      final animatedValue = normalizedValue * animation;

      // 计算点在雷达图上的位置
      final x = center.dx + radius * animatedValue * math.cos(angle);
      final y = center.dy + radius * animatedValue * math.sin(angle);

      // 绘制点
      final pointColor = dataPoints[i].color ?? Colors.grey;
      final pointPaint = Paint()
        ..color = pointColor.withAlpha((220 * animation).toInt())
        ..style = PaintingStyle.fill;

      // 外圈
      canvas.drawCircle(
        Offset(x, y),
        5.0 * animation,
        pointPaint,
      );

      // 内圈（白色）
      canvas.drawCircle(
        Offset(x, y),
        2.0 * animation,
        Paint()
          ..color = Colors.white.withAlpha((220 * animation).toInt())
          ..style = PaintingStyle.fill,
      );
    }
  }

  // 绘制选中点的高亮效果
  void _drawSelectedPoint(Canvas canvas, Offset center, double radius,
      RadarDataPoint dataPoint, double dataRange, double maxValue) {
    final i = selectedIndex!;
    final angle = 2 * math.pi * i / data.dataPoints.length - math.pi / 2;

    // 计算标准化值（0-1范围）
    final normalizedValue = (dataPoint.value - data.minValue) / dataRange;

    // 应用动画值
    final animatedValue = normalizedValue * animation;

    // 计算点在雷达图上的位置
    final x = center.dx + radius * animatedValue * math.cos(angle);
    final y = center.dy + radius * animatedValue * math.sin(angle);

    // 获取颜色（处理null值）
    final pointColor = dataPoint.color ?? Colors.blueAccent;

    // 绘制点
    final pointPaint = Paint()
      ..color = pointColor
      ..style = PaintingStyle.fill;

    // 绘制线到中心的连接线
    final linePaint = Paint()
      ..color = pointColor.withAlpha(150)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    canvas.drawLine(center, Offset(x, y), linePaint);

    // 外圈光晕
    canvas.drawCircle(
      Offset(x, y),
      12.0,
      Paint()
        ..color = pointColor.withAlpha(50)
        ..style = PaintingStyle.fill,
    );

    // 外圈
    canvas.drawCircle(
      Offset(x, y),
      8.0,
      pointPaint,
    );

    // 内圈（白色）
    canvas.drawCircle(
      Offset(x, y),
      3.0,
      Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill,
    );

    // 绘制数值文本
    final textPainter = TextPainter(
      text: TextSpan(
        text: dataPoint.value.toStringAsFixed(1),
        style: TextStyle(
          color: pointColor,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    );

    textPainter.layout();

    // 计算文本位置（垂直于轴线）
    final textOffset = 20.0;
    final textX = x + textOffset * math.cos(angle);
    final textY = y + textOffset * math.sin(angle) - textPainter.height / 2;

    textPainter.paint(canvas, Offset(textX, textY));
  }

  @override
  bool shouldRepaint(_RadarChartPainter oldDelegate) {
    return oldDelegate.data != data ||
        oldDelegate.animation != animation ||
        oldDelegate.divisions != divisions ||
        oldDelegate.showGrid != showGrid ||
        oldDelegate.showAxis != showAxis ||
        oldDelegate.selectedIndex != selectedIndex;
  }
}
