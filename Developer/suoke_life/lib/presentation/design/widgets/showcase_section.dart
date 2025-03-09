import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';
import 'package:suoke_life/core/theme/app_typography.dart';

/// 设计系统展示页面中的展示区块组件
///
/// 用于分隔不同类型的组件展示，包含标题、描述和内容区
class ShowcaseSection extends StatelessWidget {
  /// 区块标题
  final String title;

  /// 区块描述
  final String description;

  /// 内容组件
  final Widget child;

  /// 是否显示分隔线
  final bool showDivider;

  const ShowcaseSection({
    super.key,
    required this.title,
    required this.description,
    required this.child,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final screenWidth = MediaQuery.of(context).size.width;

    return LayoutBuilder(
      builder: (context, constraints) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 标题
            Text(
              title,
              style: AppTypography.heading2Style,
            ),

            SizedBox(height: AppSpacing.xs),

            // 描述
            Text(
              description,
              style: TextStyle(
                fontSize: 14,
                height: 1.4,
                color: isDarkMode
                    ? AppColors.darkTextSecondary
                    : AppColors.lightTextSecondary,
              ),
            ),

            SizedBox(height: AppSpacing.md),

            // 内容区
            Container(
              width: double.infinity,
              constraints: BoxConstraints(
                // 确保内容区有明确的宽度约束
                maxWidth: constraints.maxWidth,
                // 添加最小高度，但不限制最大高度
                minHeight: 100,
              ),
              padding: EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: isDarkMode ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDarkMode ? AppColors.darkBorder : AppColors.lightBorder,
                  width: 1,
                ),
              ),
              child: child,
            ),

            // 分隔线
            if (showDivider)
              Padding(
                padding: EdgeInsets.only(top: AppSpacing.md),
                child: Divider(
                  color: isDarkMode ? AppColors.darkBorder : AppColors.lightBorder,
                  height: 1,
                ),
              ),
          ],
        );
      }
    );
  }
}
