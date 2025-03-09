import 'package:flutter/material.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/router/app_router.dart';
import 'package:suoke_life/presentation/explore/providers/explore_providers.dart';
import 'package:suoke_life/presentation/explore/widgets/exploration_card.dart';
import 'package:suoke_life/presentation/explore/widgets/ai_agent_avatar.dart';
import 'package:suoke_life/presentation/explore/pages/exploration_detail_page.dart';
import 'package:suoke_life/core/widgets/app_widgets.dart' as app_widgets;
import 'dart:ui';

/// 探索页面（探索频道）
@RoutePage()
class ExplorePage extends ConsumerStatefulWidget {
  const ExplorePage({super.key});

  @override
  ConsumerState<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends ConsumerState<ExplorePage> {
  // 搜索关键字
  final TextEditingController _searchController = TextEditingController();

  // 知识卡片数据
  final List<Map<String, dynamic>> _knowledgeCards = [
    {
      'title': '中医体质养生指南',
      'description': '根据九种体质类型的特点，提供个性化养生建议',
      'icon': Icons.spa,
      'color': AppColors.primaryColor,
    },
    {
      'title': '四季养生宝典',
      'description': '应季饮食指南，传统节气养生方法',
      'icon': Icons.wb_sunny,
      'color': Colors.orange,
    },
    {
      'title': '情绪与健康',
      'description': '探索情绪对身体健康的影响及调节方法',
      'icon': Icons.mood,
      'color': Colors.blue,
    },
    {
      'title': '食疗方案库',
      'description': '常见病症的食疗方案，日常食补建议',
      'icon': Icons.restaurant,
      'color': Colors.green,
    },
  ];

  // 热门话题数据
  final List<Map<String, dynamic>> _hotTopics = [
    {
      'title': '中医体质辨识',
      'tags': ['养生', '体质', '中医'],
      'views': '1520',
      'color': Colors.indigo,
    },
    {
      'title': '春季过敏应对策略',
      'tags': ['过敏', '春季', '预防'],
      'views': '843',
      'color': Colors.teal,
    },
    {
      'title': '提高睡眠质量的方法',
      'tags': ['睡眠', '健康', '生活方式'],
      'views': '1102',
      'color': Colors.purple,
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      appBar: AppBar(
        title: const Text('探索'),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),

                // 页面标题
                Text(
                  '探索知识',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isDarkMode
                            ? AppColors.darkTextPrimary
                            : AppColors.lightTextPrimary,
                      ),
                ),

                const SizedBox(height: 8),

                Text(
                  '发现健康生活的奥秘',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: isDarkMode
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                ),

                const SizedBox(height: 32),

                // 搜索框
                _buildSearchBar(),

                const SizedBox(height: 32),

                // 知识库标题
                Text(
                  '知识库',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isDarkMode
                            ? AppColors.darkTextPrimary
                            : AppColors.lightTextPrimary,
                      ),
                ),

                const SizedBox(height: 16),

                // 知识卡片网格
                GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: EdgeInsets.zero,
                  children: _knowledgeCards
                      .map((card) => _buildKnowledgeCard(card))
                      .toList(),
                ),

                const SizedBox(height: 32),

                // 热门话题标题
                Text(
                  '热门话题',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isDarkMode
                            ? AppColors.darkTextPrimary
                            : AppColors.lightTextPrimary,
                      ),
                ),

                const SizedBox(height: 16),

                // 热门话题列表
                Column(
                  children: _hotTopics
                      .map((topic) => _buildTopicCard(topic))
                      .toList(),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),

          // 浮动按钮 - 生成内容
          Positioned(
            bottom: 80,
            right: 16,
            child: FloatingActionButton(
              heroTag: 'add_exploration',
              backgroundColor: AppColors.secondaryColor,
              onPressed: _handleAddExploration,
              child: const Icon(Icons.add),
            ),
          ),

          // AI助手头像
          Positioned(
            bottom: 16,
            right: 16,
            child: AIAgentAvatar(
              onTap: _handleAIAgentTap,
            ),
          ),
        ],
      ),
    );
  }

  // 构建搜索栏
  Widget _buildSearchBar() {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: 54,
      decoration: BoxDecoration(
        color: isDarkMode
            ? Colors.grey.shade800.withAlpha(150)
            : Colors.grey.shade200.withAlpha(150),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: '搜索健康知识...',
              hintStyle: TextStyle(
                color: isDarkMode ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
              prefixIcon: Icon(
                Icons.search,
                color: isDarkMode ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
              suffixIcon: IconButton(
                icon: Icon(
                  Icons.mic,
                  color:
                      isDarkMode ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
                onPressed: () {
                  // 语音搜索功能
                },
              ),
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            onSubmitted: (value) {
              // 处理搜索提交
            },
          ),
        ),
      ),
    );
  }

  // 构建知识卡片
  Widget _buildKnowledgeCard(Map<String, dynamic> card) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return app_widgets.BasicCard(
      title: card['title'],
      height: 160,
      trailingIcon: Icons.arrow_forward_ios,
      onTap: () {
        // 处理卡片点击
      },
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text(
            card['description'],
            style: TextStyle(
              fontSize: 12,
              color: isDarkMode
                  ? AppColors.darkTextSecondary
                  : AppColors.lightTextSecondary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: card['color'].withAlpha(30),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              card['icon'],
              color: card['color'],
              size: 20,
            ),
          ),
        ],
      ),
    );
  }

  // 构建话题卡片
  Widget _buildTopicCard(Map<String, dynamic> topic) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: app_widgets.BasicCard(
        title: topic['title'],
        trailingIcon: Icons.arrow_forward_ios,
        onTap: () {
          // 处理话题点击
        },
        height: 120,
        content: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 话题标签
            Wrap(
              spacing: 8,
              children: (topic['tags'] as List<String>).map((tag) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: topic['color'].withAlpha(30),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '#$tag',
                    style: TextStyle(
                      fontSize: 12,
                      color: topic['color'],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                );
              }).toList(),
            ),

            const Spacer(),

            // 浏览量
            Row(
              children: [
                Icon(
                  Icons.visibility,
                  size: 16,
                  color: isDarkMode
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  '${topic['views']}次浏览',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDarkMode
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// 处理添加探索内容
  void _handleAddExploration() {
    // 显示添加内容对话框
    showDialog(
      context: context,
      builder: (context) {
        final titleController = TextEditingController();
        final descriptionController = TextEditingController();
        final tagsController = TextEditingController();

        return AlertDialog(
          title: const Text('创建探索内容'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: '标题',
                    hintText: '输入探索内容标题',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descriptionController,
                  decoration: const InputDecoration(
                    labelText: '描述',
                    hintText: '输入探索内容描述',
                  ),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: tagsController,
                  decoration: const InputDecoration(
                    labelText: '标签',
                    hintText: '输入标签，用逗号分隔',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                // 验证输入
                if (titleController.text.isEmpty ||
                    descriptionController.text.isEmpty ||
                    tagsController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('请填写所有字段'),
                    ),
                  );
                  return;
                }

                // 创建新的探索内容
                final newItem = ExplorationItem(
                  id: DateTime.now().millisecondsSinceEpoch.toString(),
                  title: titleController.text,
                  description: descriptionController.text,
                  imageHeight: 180 + (titleController.text.length % 5) * 10,
                  imageUrl: null, // 使用占位图片
                  tags: tagsController.text
                      .split(',')
                      .map((e) => e.trim())
                      .where((e) => e.isNotEmpty)
                      .toList(),
                );

                // 添加到状态
                ref.read(exploreProvider.notifier).addExplorationItem(newItem);

                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('探索内容已创建'),
                  ),
                );
              },
              child: const Text('创建'),
            ),
          ],
        );
      },
    );
  }

  /// 处理AI助手点击
  void _handleAIAgentTap() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('索克AI助手'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('我是索克AI助手，有什么可以帮助您的吗？'),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.psychology),
                title: const Text('推荐适合我的探索内容'),
                dense: true,
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('正在为您分析适合的探索内容...')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.search),
                title: const Text('帮我搜索特定主题'),
                dense: true,
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('请告诉我您想搜索的主题')),
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.question_answer),
                title: const Text('回答我关于探索内容的问题'),
                dense: true,
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('您有什么问题想问我？')),
                  );
                },
              ),
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
}
