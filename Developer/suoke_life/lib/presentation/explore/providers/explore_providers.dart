import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 探索页面状态
class ExploreState {
  final List<ExplorationItem> items;
  final List<String> popularTags;
  final String? selectedTag;
  final bool isLoading;
  final String? errorMessage;

  const ExploreState({
    required this.items,
    required this.popularTags,
    this.selectedTag,
    this.isLoading = false,
    this.errorMessage,
  });

  /// 创建初始状态
  factory ExploreState.initial() {
    return ExploreState(
      items: _mockExplorationItems,
      popularTags: _extractPopularTags(_mockExplorationItems),
      isLoading: false,
    );
  }

  /// 创建加载中状态
  ExploreState copyWithLoading() {
    return ExploreState(
      items: items,
      popularTags: popularTags,
      selectedTag: selectedTag,
      isLoading: true,
      errorMessage: null,
    );
  }

  /// 创建错误状态
  ExploreState copyWithError(String message) {
    return ExploreState(
      items: items,
      popularTags: popularTags,
      selectedTag: selectedTag,
      isLoading: false,
      errorMessage: message,
    );
  }

  /// 创建新状态
  ExploreState copyWith({
    List<ExplorationItem>? items,
    List<String>? popularTags,
    String? selectedTag,
    bool? isLoading,
    String? errorMessage,
  }) {
    return ExploreState(
      items: items ?? this.items,
      popularTags: popularTags ?? this.popularTags,
      selectedTag: selectedTag,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

/// 探索项目模型
class ExplorationItem {
  final String id;
  final String title;
  final String description;
  final double imageHeight;
  final String? imageUrl;
  final List<String> tags;

  const ExplorationItem({
    required this.id,
    required this.title,
    required this.description,
    required this.imageHeight,
    this.imageUrl,
    required this.tags,
  });
}

/// 探索页面状态控制器
class ExploreStateNotifier extends StateNotifier<ExploreState> {
  ExploreStateNotifier() : super(ExploreState.initial());

  /// 选择标签
  void selectTag(String? tag) {
    if (tag == state.selectedTag) {
      // 如果点击的是当前选中的标签，则取消选择
      state = state.copyWith(
        selectedTag: null,
        items: _mockExplorationItems,
      );
    } else {
      // 否则选择新标签并过滤内容
      final filteredItems = tag == null
          ? _mockExplorationItems
          : _mockExplorationItems
              .where((item) => item.tags.contains(tag))
              .toList();

      state = state.copyWith(
        selectedTag: tag,
        items: filteredItems,
      );
    }
  }

  /// 添加新的探索内容
  Future<void> addExplorationItem(ExplorationItem newItem) async {
    try {
      state = state.copyWithLoading();

      // 模拟网络请求延迟
      await Future.delayed(const Duration(seconds: 1));

      // 添加新项目到列表开头
      final updatedItems = [newItem, ...state.items];

      // 更新标签列表
      final updatedTags = _extractPopularTags(updatedItems);

      state = state.copyWith(
        items: updatedItems,
        popularTags: updatedTags,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWithError('添加内容失败: ${e.toString()}');
    }
  }

  /// 搜索探索内容
  Future<void> searchExplorationItems(String query) async {
    if (query.isEmpty) {
      // 如果查询为空，恢复原始列表
      state = state.copyWith(
        items: _mockExplorationItems,
        isLoading: false,
      );
      return;
    }

    try {
      state = state.copyWithLoading();

      // 模拟网络请求延迟
      await Future.delayed(const Duration(milliseconds: 500));

      // 过滤匹配的项目
      final filteredItems = _mockExplorationItems.where((item) {
        final titleMatch =
            item.title.toLowerCase().contains(query.toLowerCase());
        final descMatch =
            item.description.toLowerCase().contains(query.toLowerCase());
        final tagMatch = item.tags
            .any((tag) => tag.toLowerCase().contains(query.toLowerCase()));
        return titleMatch || descMatch || tagMatch;
      }).toList();

      state = state.copyWith(
        items: filteredItems,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWithError('搜索失败: ${e.toString()}');
    }
  }
}

/// 探索页面状态提供者
final exploreProvider =
    StateNotifierProvider<ExploreStateNotifier, ExploreState>((ref) {
  return ExploreStateNotifier();
});

/// 从探索项目中提取热门标签
List<String> _extractPopularTags(List<ExplorationItem> items) {
  // 统计标签出现次数
  final tagCounts = <String, int>{};
  for (final item in items) {
    for (final tag in item.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  // 按出现次数排序
  final sortedTags = tagCounts.keys.toList()
    ..sort((a, b) => tagCounts[b]!.compareTo(tagCounts[a]!));

  // 返回前10个热门标签
  return sortedTags.take(10).toList();
}

/// 模拟探索项目数据
final List<ExplorationItem> _mockExplorationItems = [
  ExplorationItem(
    id: '1',
    title: '中医知识图谱',
    description: '探索中医理论体系的知识图谱，了解经络、脏腑、药材之间的关系',
    imageHeight: 180,
    imageUrl: 'https://picsum.photos/id/237/400/180',
    tags: ['中医', '知识图谱', '经络', '脏腑'],
  ),
  ExplorationItem(
    id: '2',
    title: 'AR玉米迷宫探宝',
    description: '使用AR技术在玉米迷宫中寻找隐藏的中医宝藏，边玩边学习中医知识',
    imageHeight: 220,
    imageUrl: 'https://picsum.photos/id/238/400/220',
    tags: ['AR', '玉米迷宫', '游戏', '中医宝藏'],
  ),
  ExplorationItem(
    id: '3',
    title: '四季养生咖啡',
    description: '根据四季特点调配的养生咖啡配方，融合中医理念与现代咖啡工艺',
    imageHeight: 160,
    imageUrl: 'https://picsum.photos/id/239/400/160',
    tags: ['咖啡', '四季养生', '配方', '饮品'],
  ),
  ExplorationItem(
    id: '4',
    title: '节气美食指南',
    description: '24节气饮食养生指南，让你的餐桌与自然节律同步，增强身体健康',
    imageHeight: 200,
    imageUrl: 'https://picsum.photos/id/240/400/200',
    tags: ['节气', '美食', '养生', '饮食指南'],
  ),
  ExplorationItem(
    id: '5',
    title: '药用花卉种植',
    description: '在家种植常见药用花卉的指南，打造你的私人中药花园',
    imageHeight: 190,
    imageUrl: 'https://picsum.photos/id/241/400/190',
    tags: ['药用花卉', '种植', '中药', '家庭园艺'],
  ),
  ExplorationItem(
    id: '6',
    title: '食用菌培育技术',
    description: '食用菌家庭培育技术，简单易学，收获健康美味的菌菇',
    imageHeight: 170,
    imageUrl: 'https://picsum.photos/id/242/400/170',
    tags: ['食用菌', '培育', '家庭种植', '菌菇'],
  ),
  ExplorationItem(
    id: '7',
    title: '乡村民宿体验',
    description: '精选全国各地特色乡村民宿，体验不同地域的传统生活方式',
    imageHeight: 210,
    imageUrl: 'https://picsum.photos/id/243/400/210',
    tags: ['乡村民宿', '体验', '传统生活', '旅行'],
  ),
  ExplorationItem(
    id: '8',
    title: '中医药材打卡地',
    description: '全国著名中药材产地打卡指南，探索中药材的原产地和生长环境',
    imageHeight: 185,
    imageUrl: 'https://picsum.photos/id/244/400/185',
    tags: ['中药材', '打卡', '产地', '旅行'],
  ),
];
