import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';

/// 聊天列表项组件
class ChatListItem extends StatelessWidget {
  final String name;
  final String avatar;
  final String lastMessage;
  final String time;
  final bool isAI;
  final bool isGroup;
  final VoidCallback onTap;

  const ChatListItem({
    super.key,
    required this.name,
    required this.avatar,
    required this.lastMessage,
    required this.time,
    this.isAI = false,
    this.isGroup = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        child: Row(
          children: [
            // 头像
            _buildAvatar(),

            const SizedBox(width: 16),

            // 聊天内容
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 顶部行：名称和时间
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // 名称
                      Row(
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (isAI)
                            Container(
                              margin: const EdgeInsets.only(left: 4),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                                vertical: 1,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primaryColor,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'AI',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),

                      // 时间
                      Text(
                        time,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.withAlpha(200),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 4),

                  // 底部行：消息预览
                  Text(
                    lastMessage,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.withAlpha(200),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建头像组件
  Widget _buildAvatar() {
    // 使用图标作为头像，避免因缺少图片资产而导致错误
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: isAI
            ? AppColors.primaryColor.withAlpha(40)
            : isGroup
                ? AppColors.secondaryColor.withAlpha(40)
                : Colors.blue.withAlpha(40),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Icon(
          isAI
              ? Icons.smart_toy
              : isGroup
                  ? Icons.group
                  : Icons.person,
          color: isAI
              ? AppColors.primaryColor
              : isGroup
                  ? AppColors.secondaryColor
                  : Colors.blue,
          size: 24,
        ),
      ),
    );
  }
}
