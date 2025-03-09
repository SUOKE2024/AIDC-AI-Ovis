import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';

/// 色彩展示项组件
///
/// 用于在设计系统色彩部分显示单个颜色，包括颜色展示、名称和颜色代码
class ColorPaletteItem extends StatelessWidget {
  /// 要展示的颜色
  final Color color;

  /// 颜色名称
  final String name;

  /// 颜色代码（十六进制）
  final String colorCode;

  /// 是否显示复制图标
  final bool showCopyIcon;

  /// 是否使用圆形显示
  final bool isCircular;

  /// 大小
  final double size;

  const ColorPaletteItem({
    super.key,
    required this.color,
    required this.name,
    this.colorCode = '',
    this.showCopyIcon = true,
    this.isCircular = false,
    this.size = 80,
  });

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final isBrightColor = _isBrightColor(color);
    final labelColor = isBrightColor ? Colors.black : Colors.white;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 颜色展示区
        InkWell(
          onTap: () => _copyColorCode(context),
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: color,
              shape: isCircular ? BoxShape.circle : BoxShape.rectangle,
              borderRadius: isCircular ? null : BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(20),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: showCopyIcon
                ? Center(
                    child: Icon(
                      Icons.content_copy,
                      color: labelColor.withAlpha(120),
                      size: 24,
                    ),
                  )
                : null,
          ),
        ),

        SizedBox(height: AppSpacing.xs),

        // 颜色名称
        Text(
          name,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isDarkMode
                ? AppColors.darkTextPrimary
                : AppColors.lightTextPrimary,
          ),
        ),

        // 颜色代码
        if (colorCode.isNotEmpty)
          Text(
            colorCode,
            style: TextStyle(
              fontSize: 12,
              color: isDarkMode
                  ? AppColors.darkTextSecondary
                  : AppColors.lightTextSecondary,
            ),
          ),
      ],
    );
  }

  /// 检查颜色是否为亮色
  bool _isBrightColor(Color color) {
    // 使用相对亮度公式: 0.299*R + 0.587*G + 0.114*B
    final double brightness =
        (0.299 * color.red + 0.587 * color.green + 0.114 * color.blue) / 255;
    return brightness > 0.6; // 亮度大于0.6认为是亮色
  }

  /// 复制颜色代码到剪贴板
  void _copyColorCode(BuildContext context) {
    String textToCopy = colorCode.isNotEmpty
        ? colorCode
        : '#${color.value.toRadixString(16).padLeft(8, '0').substring(2)}';

    Clipboard.setData(ClipboardData(text: textToCopy));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('已复制颜色代码: $textToCopy'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
