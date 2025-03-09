import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_typography.dart';

/// 空状态类型枚举
enum EmptyStateType {
  /// 无数据
  noData,

  /// 无搜索结果
  noSearchResults,

  /// 无收藏内容
  noFavorites,

  /// 无消息记录
  noMessages,

  /// 网络错误
  networkError,

  /// 权限错误
  permissionDenied,

  /// 等待中
  waiting,

  /// 自定义
  custom,
}

/// 索克风格空状态组件
///
/// 用于展示列表、搜索或内容区域为空时的友好提示
/// 样例:
/// ```dart
/// AppEmptyState(
///   type: EmptyStateType.noData,
///   title: '暂无数据',
///   subtitle: '您可以尝试刷新页面',
///   actionButton: ElevatedButton(
///     onPressed: () => refresh(),
///     child: Text('刷新'),
///   ),
/// )
/// ```
class AppEmptyState extends StatelessWidget {
  /// 空状态类型
  final EmptyStateType type;

  /// 标题文本
  final String? title;

  /// 副标题文本
  final String? subtitle;

  /// 自定义图标
  final IconData? icon;

  /// 自定义图片资源
  final String? imagePath;

  /// 操作按钮
  final Widget? actionButton;

  /// 次要操作按钮
  final Widget? secondaryAction;

  /// 自定义内容
  final Widget? customContent;

  /// 水平内边距
  final double horizontalPadding;

  /// 垂直内边距
  final double verticalPadding;

  /// 图片尺寸
  final double imageSize;

  /// 图标尺寸
  final double iconSize;

  /// 图标颜色
  final Color? iconColor;

  /// 布局方向
  final Axis direction;

  /// 紧凑模式
  final bool compact;

  const AppEmptyState({
    Key? key,
    this.type = EmptyStateType.noData,
    this.title,
    this.subtitle,
    this.icon,
    this.imagePath,
    this.actionButton,
    this.secondaryAction,
    this.customContent,
    this.horizontalPadding = 32.0,
    this.verticalPadding = 24.0,
    this.imageSize = 120.0,
    this.iconSize = 60.0,
    this.iconColor,
    this.direction = Axis.vertical,
    this.compact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // 如果是自定义内容，直接返回
    if (type == EmptyStateType.custom && customContent != null) {
      return Padding(
        padding: EdgeInsets.symmetric(
          horizontal: horizontalPadding,
          vertical: verticalPadding,
        ),
        child: customContent!,
      );
    }

    // 根据方向构建布局
    if (direction == Axis.horizontal) {
      return _buildHorizontalLayout(context);
    } else {
      return _buildVerticalLayout(context);
    }
  }

  /// 构建垂直布局
  Widget _buildVerticalLayout(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // 图标或图片
          _buildImage(),

          SizedBox(height: compact ? 8.0 : 16.0),

          // 标题
          if (_getTitle() != null)
            Text(
              _getTitle()!,
              style: compact
                  ? AppTypography.body1Style.copyWith(
                      fontWeight: FontWeight.bold,
                    )
                  : AppTypography.heading4Style,
              textAlign: TextAlign.center,
            ),

          // 副标题
          if (_getSubtitle() != null) ...[
            SizedBox(height: compact ? 4.0 : 8.0),
            Text(
              _getSubtitle()!,
              style: compact
                  ? AppTypography.captionStyle
                  : AppTypography.body2Style,
              textAlign: TextAlign.center,
            ),
          ],

          // 操作按钮
          if (actionButton != null) ...[
            SizedBox(height: compact ? 12.0 : 24.0),
            actionButton!,
          ],

          // 次要操作
          if (secondaryAction != null) ...[
            SizedBox(height: compact ? 8.0 : 12.0),
            secondaryAction!,
          ],
        ],
      ),
    );
  }

  /// 构建水平布局
  Widget _buildHorizontalLayout(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // 图标或图片
          _buildImage(size: compact ? imageSize * 0.7 : imageSize * 0.8),

          SizedBox(width: compact ? 12.0 : 24.0),

          // 文本和按钮
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 标题
                if (_getTitle() != null)
                  Text(
                    _getTitle()!,
                    style: compact
                        ? AppTypography.body1Style.copyWith(
                            fontWeight: FontWeight.bold,
                          )
                        : AppTypography.heading4Style,
                  ),

                // 副标题
                if (_getSubtitle() != null) ...[
                  SizedBox(height: compact ? 4.0 : 8.0),
                  Text(
                    _getSubtitle()!,
                    style: compact
                        ? AppTypography.captionStyle
                        : AppTypography.body2Style,
                  ),
                ],

                // 操作按钮
                if (actionButton != null) ...[
                  SizedBox(height: compact ? 12.0 : 16.0),
                  actionButton!,
                ],

                // 次要操作
                if (secondaryAction != null) ...[
                  SizedBox(height: compact ? 8.0 : 12.0),
                  secondaryAction!,
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 构建图像部分
  Widget _buildImage({double? size}) {
    // 如果提供了自定义图片，优先使用
    if (imagePath != null) {
      return Image.asset(
        imagePath!,
        width: size ?? imageSize,
        height: size ?? imageSize,
      );
    }

    // 否则使用图标
    return Icon(
      icon ?? _getDefaultIcon(),
      size: size != null ? size * 0.5 : iconSize,
      color: iconColor ?? _getDefaultIconColor(),
    );
  }

  /// 获取默认标题
  String? _getTitle() {
    if (title != null) return title;

    switch (type) {
      case EmptyStateType.noData:
        return '暂无数据';
      case EmptyStateType.noSearchResults:
        return '无搜索结果';
      case EmptyStateType.noFavorites:
        return '暂无收藏内容';
      case EmptyStateType.noMessages:
        return '暂无消息';
      case EmptyStateType.networkError:
        return '网络连接错误';
      case EmptyStateType.permissionDenied:
        return '权限受限';
      case EmptyStateType.waiting:
        return '等待中';
      case EmptyStateType.custom:
        return null;
    }
  }

  /// 获取默认副标题
  String? _getSubtitle() {
    if (subtitle != null) return subtitle;

    switch (type) {
      case EmptyStateType.noData:
        return '暂时没有可显示的数据';
      case EmptyStateType.noSearchResults:
        return '尝试使用其他关键词搜索';
      case EmptyStateType.noFavorites:
        return '您可以收藏感兴趣的内容';
      case EmptyStateType.noMessages:
        return '没有新消息';
      case EmptyStateType.networkError:
        return '请检查网络连接后重试';
      case EmptyStateType.permissionDenied:
        return '您没有权限访问此内容';
      case EmptyStateType.waiting:
        return '请耐心等待...';
      case EmptyStateType.custom:
        return null;
    }
  }

  /// 获取默认图标
  IconData _getDefaultIcon() {
    switch (type) {
      case EmptyStateType.noData:
        return Icons.inbox_outlined;
      case EmptyStateType.noSearchResults:
        return Icons.search_off_outlined;
      case EmptyStateType.noFavorites:
        return Icons.favorite_border;
      case EmptyStateType.noMessages:
        return Icons.chat_bubble_outline;
      case EmptyStateType.networkError:
        return Icons.wifi_off_outlined;
      case EmptyStateType.permissionDenied:
        return Icons.lock_outline;
      case EmptyStateType.waiting:
        return Icons.hourglass_empty;
      case EmptyStateType.custom:
        return Icons.info_outline;
    }
  }

  /// 获取默认图标颜色
  Color _getDefaultIconColor() {
    switch (type) {
      case EmptyStateType.noData:
      case EmptyStateType.noSearchResults:
      case EmptyStateType.noFavorites:
      case EmptyStateType.noMessages:
      case EmptyStateType.waiting:
        return AppColors.lightSystemGray;
      case EmptyStateType.networkError:
        return AppColors.warningColor;
      case EmptyStateType.permissionDenied:
        return AppColors.errorColor;
      case EmptyStateType.custom:
        return AppColors.primaryColor;
    }
  }
}

/// 占位符空状态
///
/// 用于加载中或暂无内容的情况
/// 样例:
/// ```dart
/// LoadingPlaceholder(
///   isLoading: isLoading,
///   emptyState: AppEmptyState(
///     type: EmptyStateType.noData,
///   ),
///   isEmpty: () => list.isEmpty,
///   child: YourListView(),
/// )
/// ```
class LoadingPlaceholder extends StatelessWidget {
  /// 是否正在加载
  final bool isLoading;

  /// 加载指示器
  final Widget? loadingIndicator;

  /// 内容为空时显示的组件
  final Widget emptyState;

  /// 内容是否为空的判断函数
  final bool Function() isEmpty;

  /// 子组件
  final Widget child;

  const LoadingPlaceholder({
    Key? key,
    required this.isLoading,
    this.loadingIndicator,
    required this.emptyState,
    required this.isEmpty,
    required this.child,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(
        child: loadingIndicator ?? const CircularProgressIndicator(),
      );
    }

    if (isEmpty()) {
      return emptyState;
    }

    return child;
  }
}
