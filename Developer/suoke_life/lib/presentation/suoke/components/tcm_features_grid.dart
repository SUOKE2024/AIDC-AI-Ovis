import 'package:flutter/material.dart';
import 'package:auto_route/auto_route.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/router/app_router.dart';

/// TCM功能网格组件
class TCMFeaturesGrid extends StatelessWidget {
  /// 构造函数
  const TCMFeaturesGrid({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      children: [
        _buildFeatureCard(
          context,
          title: '脉诊分析',
          description: '基于传统中医脉诊理论，通过智能技术分析脉象特征',
          icon: Icons.favorite,
          color: AppColors.primaryColor,
          onTap: () => context.router.push(const PulseDiagnosisRoute()),
        ),
        _buildFeatureCard(
          context,
          title: '舌诊分析',
          description: '融合现代图像识别技术与传统舌诊理论，分析舌象特征',
          icon: Icons.visibility,
          color: AppColors.secondaryColor,
          onTap: () => context.router.push(const TongueDiagnosisRoute()),
        ),
        _buildFeatureCard(
          context,
          title: '体质辨识',
          description: '九种体质辨识，定制个性化健康方案',
          icon: Icons.person,
          color: Colors.purple,
          onTap: () {
            // TODO: 实现体质辨识功能
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('体质辨识功能正在开发中')),
            );
          },
        ),
        _buildFeatureCard(
          context,
          title: '经络穴位',
          description: '精准定位经络穴位，了解功效与作用',
          icon: Icons.linear_scale,
          color: Colors.teal,
          onTap: () {
            // TODO: 实现经络穴位功能
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('经络穴位功能正在开发中')),
            );
          },
        ),
      ],
    );
  }

  Widget _buildFeatureCard(
    BuildContext context, {
    required String title,
    required String description,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withAlpha(50),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 32,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
