import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';

/// 探索卡片组件
class ExplorationCard extends StatelessWidget {
  final String title;
  final String description;
  final double imageHeight;
  final String? imageUrl;
  final List<String> tags;
  final VoidCallback onTap;

  const ExplorationCard({
    super.key,
    required this.title,
    required this.description,
    required this.imageHeight,
    this.imageUrl,
    required this.tags,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(10),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 图片
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: SizedBox(
                height: imageHeight,
                width: double.infinity,
                child: _buildImage(),
              ),
            ),

            // 内容
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 标题
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 6),

                  // 描述
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.withAlpha(200),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 12),

                  // 标签
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: tags.map((tag) => _buildTag(tag)).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建图片组件
  Widget _buildImage() {
    if (imageUrl != null) {
      // 使用实际图片
      return Image.network(
        imageUrl!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _buildPlaceholderImage();
        },
      );
    } else {
      // 使用占位图片
      return _buildPlaceholderImage();
    }
  }

  /// 构建占位图片
  Widget _buildPlaceholderImage() {
    // 根据标题生成随机颜色
    final int hashCode = title.hashCode;
    final color = Color(0xFF000000 + (hashCode % 0xFFFFFF));

    return Container(
      color: color.withAlpha(40),
      child: Center(
        child: Icon(
          _getIconForTitle(),
          size: 48,
          color: color.withAlpha(150),
        ),
      ),
    );
  }

  /// 根据标题获取图标
  IconData _getIconForTitle() {
    if (title.contains('知识')) {
      return Icons.psychology;
    } else if (title.contains('迷宫')) {
      return Icons.grid_goldenratio;
    } else if (title.contains('咖啡')) {
      return Icons.coffee;
    } else if (title.contains('美食')) {
      return Icons.restaurant;
    } else if (title.contains('花')) {
      return Icons.local_florist;
    } else if (title.contains('菌')) {
      return Icons.spa;
    } else if (title.contains('宿')) {
      return Icons.hotel;
    } else if (title.contains('打卡')) {
      return Icons.camera_alt;
    } else if (title.contains('游戏')) {
      return Icons.videogame_asset;
    } else {
      return Icons.explore;
    }
  }

  /// 构建标签组件
  Widget _buildTag(String tag) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: AppColors.primaryColor.withAlpha(30),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        tag,
        style: TextStyle(
          fontSize: 10,
          color: AppColors.primaryColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
