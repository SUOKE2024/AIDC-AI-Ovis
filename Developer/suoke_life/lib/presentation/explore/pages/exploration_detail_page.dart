import 'package:flutter/material.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/presentation/explore/providers/explore_providers.dart';
import 'package:suoke_life/presentation/explore/widgets/ai_agent_avatar.dart';

/// 探索项目详情页面
@RoutePage()
class ExplorationDetailPage extends ConsumerWidget {
  final ExplorationItem item;

  const ExplorationDetailPage({
    super.key,
    required this.item,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      body: CustomScrollView(
        slivers: [
          // 顶部大图和应用栏
          SliverAppBar(
            expandedHeight: screenSize.height * 0.35,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: _buildHeaderImage(context),
            ),
            leading: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withAlpha(50),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => context.router.maybePop(),
              ),
            ),
            actions: [
              // 分享按钮
              Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withAlpha(50),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.share, color: Colors.white),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('分享功能正在开发中')),
                    );
                  },
                ),
              ),
              // 收藏按钮
              Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withAlpha(50),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.favorite_border, color: Colors.white),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('收藏功能正在开发中')),
                    );
                  },
                ),
              ),
            ],
          ),

          // 内容区域
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // 标题
                Text(
                  item.title,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 12),

                // 标签
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: item.tags.map((tag) => _buildTag(tag)).toList(),
                ),

                const SizedBox(height: 24),

                // 详细描述
                Text(
                  _getExpandedDescription(),
                  style: const TextStyle(
                    fontSize: 16,
                    height: 1.6,
                  ),
                ),

                const SizedBox(height: 32),

                // 相关推荐标题
                const Text(
                  '相关推荐',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 16),

                // 相关推荐内容
                _buildRelatedItems(context),

                const SizedBox(height: 32),

                // 用户评论标题
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      '用户评论',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('评论功能正在开发中')),
                        );
                      },
                      child: const Text('查看全部'),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // 用户评论列表
                _buildCommentsList(),

                const SizedBox(height: 80), // 底部留空，防止内容被悬浮按钮遮挡
              ]),
            ),
          ),
        ],
      ),

      // 底部操作栏
      bottomNavigationBar: _buildBottomActionBar(context),

      // AI助手悬浮按钮
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 60),
        child: AIAgentAvatar(
          onTap: () => _showAIAssistantDialog(context),
        ),
      ),
    );
  }

  /// 构建顶部大图
  Widget _buildHeaderImage(BuildContext context) {
    if (item.imageUrl != null) {
      return Image.network(
        item.imageUrl!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _buildPlaceholderImage(context);
        },
      );
    } else {
      return _buildPlaceholderImage(context);
    }
  }

  /// 构建占位图片
  Widget _buildPlaceholderImage(BuildContext context) {
    // 根据标题生成随机颜色
    final int hashCode = item.title.hashCode;
    final color = Color(0xFF000000 + (hashCode % 0xFFFFFF));

    return Container(
      color: color.withAlpha(60),
      child: Center(
        child: Icon(
          _getIconForTitle(),
          size: 80,
          color: color.withAlpha(180),
        ),
      ),
    );
  }

  /// 根据标题获取图标
  IconData _getIconForTitle() {
    if (item.title.contains('知识')) {
      return Icons.psychology;
    } else if (item.title.contains('迷宫')) {
      return Icons.grid_goldenratio;
    } else if (item.title.contains('咖啡')) {
      return Icons.coffee;
    } else if (item.title.contains('美食')) {
      return Icons.restaurant;
    } else if (item.title.contains('花')) {
      return Icons.local_florist;
    } else if (item.title.contains('菌')) {
      return Icons.spa;
    } else if (item.title.contains('宿')) {
      return Icons.hotel;
    } else if (item.title.contains('打卡')) {
      return Icons.camera_alt;
    } else if (item.title.contains('游戏')) {
      return Icons.videogame_asset;
    } else {
      return Icons.explore;
    }
  }

  /// 构建标签组件
  Widget _buildTag(String tag) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: AppColors.primaryColor.withAlpha(30),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        '#$tag',
        style: TextStyle(
          fontSize: 12,
          color: AppColors.primaryColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  /// 构建相关推荐内容
  Widget _buildRelatedItems(BuildContext context) {
    // 模拟相关推荐数据
    final relatedItems = [
      {'title': '相关推荐1', 'image': Icons.spa},
      {'title': '相关推荐2', 'image': Icons.psychology},
      {'title': '相关推荐3', 'image': Icons.restaurant},
      {'title': '相关推荐4', 'image': Icons.hotel},
    ];

    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: relatedItems.length,
        itemBuilder: (context, index) {
          final relatedItem = relatedItems[index];
          return Container(
            width: 120,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(10),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  relatedItem['image'] as IconData,
                  color: AppColors.primaryColor,
                  size: 36,
                ),
                const SizedBox(height: 8),
                Text(
                  relatedItem['title'] as String,
                  style: const TextStyle(
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// 构建用户评论列表
  Widget _buildCommentsList() {
    // 模拟评论数据
    return Column(
      children: [
        _buildCommentItem(
          username: '用户1',
          avatar: Icons.person,
          comment: '很实用的内容，学到了很多！',
          time: '2小时前',
          rating: 5,
        ),
        _buildCommentItem(
          username: '用户2',
          avatar: Icons.person_outline,
          comment: '内容不错，但希望能有更多实践指导。',
          time: '1天前',
          rating: 4,
        ),
        _buildCommentItem(
          username: '用户3',
          avatar: Icons.person,
          comment: '值得推荐给朋友们！',
          time: '3天前',
          rating: 5,
        ),
      ],
    );
  }

  /// 构建单个评论项
  Widget _buildCommentItem({
    required String username,
    required IconData avatar,
    required String comment,
    required String time,
    required int rating,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.withAlpha(15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // 头像
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.primaryColor.withAlpha(40),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  avatar,
                  color: AppColors.primaryColor,
                  size: 20,
                ),
              ),

              const SizedBox(width: 12),

              // 用户名
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    username,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    time,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.withAlpha(180),
                    ),
                  ),
                ],
              ),

              const Spacer(),

              // 评分
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    index < rating ? Icons.star : Icons.star_border,
                    color: AppColors.secondaryColor,
                    size: 16,
                  );
                }),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // 评论内容
          Text(
            comment,
            style: const TextStyle(
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  /// 构建底部操作栏
  Widget _buildBottomActionBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 12,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          // 评论按钮
          TextButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('评论功能正在开发中')),
              );
            },
            icon: const Icon(Icons.comment),
            label: const Text('评论'),
          ),

          const Spacer(),

          // 报名/参与按钮
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('您已成功报名参与"${item.title}"活动')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
            child: const Text('立即参与'),
          ),
        ],
      ),
    );
  }

  /// 显示AI助手对话框
  void _showAIAssistantDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('索克AI助手'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('我是索克AI助手，有关"${item.title}"的问题，我可以为您解答：'),
              const SizedBox(height: 16),
              ...item.tags
                  .map((tag) => ListTile(
                        leading: const Icon(Icons.question_answer),
                        title: Text('关于$tag的更多信息?'),
                        dense: true,
                        onTap: () {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('正在查询关于"$tag"的更多信息')),
                          );
                        },
                      ))
                  .toList(),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('关闭'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                // TODO: 实现AI助手对话功能
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('AI助手对话功能正在开发中')),
                );
              },
              child: const Text('开始对话'),
            ),
          ],
        );
      },
    );
  }

  /// 获取扩展的描述内容
  String _getExpandedDescription() {
    // 根据不同的项目类型返回不同的扩展描述
    if (item.title.contains('知识图谱')) {
      return '''${item.description}

中医知识图谱是一个结构化的知识体系，通过可视化的方式展示中医理论、诊断方法、治疗手段之间的关系网络。它将传统中医的复杂理论以直观的方式呈现，帮助人们更好地理解中医的整体观念和辨证施治原则。

在本知识图谱中，您可以看到：

1. 五行理论与脏腑的关系
2. 经络系统的分布和连接
3. 常见中药材的功效归类
4. 不同体质的特点和养生方法
5. 中医诊断方法的关联性

通过这个知识图谱，无论您是中医爱好者还是专业从业者，都能获得系统性的知识梳理，加深对中医理论的理解。''';
    } else if (item.title.contains('迷宫')) {
      return '''${item.description}

AR玉米迷宫探宝是一项结合现代科技与传统农业的创新活动。在真实的玉米田迷宫中，通过AR技术在手机上显示虚拟的中医宝藏和知识点，边探索迷宫边学习中医知识。

活动特点：

1. 真实的玉米迷宫提供沉浸式体验
2. AR技术展示虚拟中医宝藏和知识点
3. 游戏化的学习方式，寓教于乐
4. 集齐特定数量的宝藏可获得奖品
5. 适合全家人参与的健康户外活动

每个季节的迷宫主题和宝藏内容都会更新，让您每次都能获得新鲜的体验和知识。活动地点位于城市近郊的有机农场，每周末开放。''';
    } else if (item.title.contains('咖啡')) {
      return '''${item.description}

四季养生咖啡是将传统中医养生理念与现代咖啡文化相结合的创新饮品系列。根据春、夏、秋、冬四季的气候特点和人体需求，添加不同的中草药和食材，调配出既美味又有养生功效的特色咖啡。

春季咖啡：添加薄荷、菊花等清新食材，有助于舒肝解郁，对应春季养肝的养生要求。

夏季咖啡：加入金银花、荷叶等清热食材，有助于清热解暑，符合夏季养心的养生原则。

秋季咖啡：融入百合、山药等滋润食材，有助于润肺生津，满足秋季养肺的养生需求。

冬季咖啡：搭配红枣、枸杞等温补食材，有助于温肾固本，契合冬季养肾的养生宗旨。

每款咖啡都经过专业咖啡师和中医专家的精心调配，既保留了咖啡的醇香，又融入了中医的养生智慧。''';
    } else {
      // 默认描述，为原始描述的扩展版本
      return '''${item.description}

作为索克生活应用的精选内容，本探索项目旨在为用户提供健康、自然、可持续的生活方式指导。我们相信，通过结合传统智慧与现代科技，每个人都能找到适合自己的健康之道。

在这个快节奏的时代，重新连接自然、理解传统、珍视健康显得尤为重要。本项目提供的不仅是知识，更是一种生活态度和实践指南。

我们鼓励您亲身参与、实践体验，将学到的知识融入日常生活，感受健康生活方式带来的改变和益处。同时，也欢迎您在社区中分享自己的经验和收获，与更多志同道合的朋友一起成长。

索克生活，让我们一起探索更健康、更自然的生活方式！''';
    }
  }
}
