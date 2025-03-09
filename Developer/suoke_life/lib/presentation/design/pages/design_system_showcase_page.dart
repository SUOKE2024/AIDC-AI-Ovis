import 'dart:async';
import 'dart:math' as math;
import 'dart:collection';
import 'dart:typed_data';
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:auto_route/auto_route.dart';
import 'package:suoke_life/core/router/app_router.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';
import 'package:suoke_life/core/theme/app_typography.dart';
import 'package:suoke_life/core/theme/tcm_chart_themes.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';
import 'package:suoke_life/core/widgets/app_widgets.dart' as app_widgets;
import 'package:suoke_life/presentation/design/widgets/showcase_section.dart';
import 'package:suoke_life/presentation/design/widgets/color_palette_item.dart';

// 暂存脉象和节气生成速度，Web平台下降低渲染频率
const int _kWebUpdatesPerSecond = 10; // Web平台每秒更新10次
const int _kNativeUpdatesPerSecond = 30; // 原生平台每秒更新30次

/// 错误边界组件，用于捕获子组件中的渲染错误
class _ErrorBoundary extends StatefulWidget {
  final Widget child;

  const _ErrorBoundary({required this.child});

  @override
  State<_ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<_ErrorBoundary> {
  bool _hasError = false;
  Object? _error;
  String? _errorDetails;

  @override
  void initState() {
    super.initState();
    // 设置自定义错误处理器
    FlutterError.onError = (FlutterErrorDetails details) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _error = details.exception;
          _errorDetails = details.toString();
        });
      }
    };
  }

  @override
  void dispose() {
    // 恢复默认错误处理器
    FlutterError.onError = FlutterError.presentError;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      // 错误显示
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline,
                color: Colors.red,
                size: 48,
              ),
              const SizedBox(height: 16),
              const Text(
                '设计系统渲染错误',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Flexible(
                child: SingleChildScrollView(
                  child: Text(
                    '错误信息: ${_error?.toString() ?? "未知错误"}\n\n详细信息仅供开发使用:\n${_errorDetails ?? ""}',
                    style: const TextStyle(fontSize: 12),
                    textAlign: TextAlign.left,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _hasError = false;
                        _error = null;
                        _errorDetails = null;
                      });
                    },
                    child: const Text('刷新页面'),
                  ),
                  const SizedBox(width: 16),
                  OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                    },
                    child: const Text('返回上一页'),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    // 用错误捕获包装子组件
    return Builder(
      builder: (context) {
        try {
          return widget.child;
        } catch (e, stack) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                _hasError = true;
                _error = e;
                _errorDetails = stack.toString();
              });
            }
          });
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
      },
    );
  }
}

/// 设计系统展示页面
@RoutePage()
class DesignSystemShowcasePage extends StatefulWidget {
  const DesignSystemShowcasePage({super.key});

  @override
  State<DesignSystemShowcasePage> createState() => _DesignSystemShowcasePageState();
}

class _DesignSystemShowcasePageState extends State<DesignSystemShowcasePage> {
  // 控制哪些部分可见
  final Map<String, bool> _visibleSections = {
    'colors': true,      // 始终显示基础色彩
    'buttons': true,     // 始终显示按钮
    'cards': true,       // 始终显示卡片
    'textfields': false, // 按需显示
    'dialogs': false,    // 按需显示
    'listtiles': false,  // 按需显示
    'skeletons': false,  // 按需显示
    'tcmvisuals': false, // 按需显示
    'pulsediagnosis': false, // 按需显示
    'badges': false,     // 按需显示
    'feedback': false,   // 按需显示
    'tonguediagnosis': false, // 按需显示
    'tcmicons': false,   // 按需显示
    'patterns': false,   // 按需显示
    'solarterms': false, // 按需显示
  };

  // 默认显示的组件类别
  static const List<String> _basicComponents = ['colors', 'buttons', 'cards'];
  
  // 可能导致渲染问题的复杂组件
  static const List<String> _complexComponents = [
    'tcmvisuals', 'pulsediagnosis', 'tonguediagnosis', 
    'tcmicons', 'patterns', 'solarterms'
  ];

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('索克生活设计系统'),
        backgroundColor: AppColors.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: '刷新页面',
            onPressed: () {
              setState(() {
                // 刷新会保持当前选择的组件不变
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.help_outline),
            tooltip: '使用指南',
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('设计系统展示页面使用指南'),
                  content: const SingleChildScrollView(
                    child: Text(
                      '本页面展示了所有设计系统组件，包括基础组件和复杂组件。\n\n'
                      '• 您可以使用顶部的筛选器选择要查看的组件类别\n'
                      '• 基础组件（绿色标签）不会导致渲染问题\n'
                      '• 复杂组件（橙色标签）可能导致渲染问题，建议一次只选择一个\n'
                      '• 如果页面出现错误，您可以使用刷新按钮或重新选择组件\n'
                      '• 大多数组件是可交互的，您可以点击查看效果\n\n'
                      '如果页面持续出现渲染错误，请尝试：\n'
                      '1. 仅选择基础组件\n'
                      '2. 刷新页面\n'
                      '3. 重新启动应用\n'
                    ),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('了解'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      // 使用SafeArea包装内容，但不使用整体_ErrorBoundary
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: EdgeInsets.all(AppSpacing.md),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - AppSpacing.md * 2,
                  maxWidth: constraints.maxWidth,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 设计系统介绍
                    _ErrorBoundary(
                      child: app_widgets.BasicCard(
                        title: '设计系统介绍',
                        content: const Text(
                          '索克生活APP设计系统是一套完整的设计规范和组件库，旨在提供一致的用户体验和视觉语言，'
                          '融合中医理念与现代设计美学，创建独特而协调的产品体验。',
                          style: TextStyle(fontSize: 16, height: 1.5),
                        ),
                      ),
                    ),

                    SizedBox(height: AppSpacing.lg),

                    // 导航菜单 - 单独使用_ErrorBoundary
                    _ErrorBoundary(
                      child: _buildNavigationMenu(),
                    ),

                    SizedBox(height: AppSpacing.lg),

                    // 内容区
                    if (_areAllSectionsHidden())
                      _ErrorBoundary(
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(AppSpacing.xxl),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.visibility_off,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: AppSpacing.sm),
                                Text(
                                  '请从上方选择要查看的组件',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                    // 色彩系统 - 单独使用_ErrorBoundary
                    if (_visibleSections['colors']!)
                      _ErrorBoundary(
                        child: const ShowcaseSection(
                          title: '色彩系统',
                          description: '索克生活应用的色彩系统基于品牌主色调（索克绿）和辅助色调（索克橙）构建，'
                              '包含功能色、中性色和五行元素色。',
                          child: _ColorShowcase(),
                        ),
                      ),

                    if (_visibleSections['colors']!)
                      SizedBox(height: AppSpacing.lg),

                    // 按钮组件 - 单独使用_ErrorBoundary
                    if (_visibleSections['buttons']!)
                      _ErrorBoundary(
                        child: const ShowcaseSection(
                          title: '按钮',
                          description: '索克生活应用的按钮系统提供多种变体和尺寸，满足不同交互场景需求。',
                          child: _ButtonShowcase(),
                        ),
                      ),

                    if (_visibleSections['buttons']!)
                      SizedBox(height: AppSpacing.lg),

                    // 卡片组件 - 单独使用_ErrorBoundary
                    if (_visibleSections['cards']!)
                      _ErrorBoundary(
                        child: const ShowcaseSection(
                          title: '卡片',
                          description: '卡片是应用中重要的信息容器，提供多种风格以适应不同的内容展示需求。',
                          child: _CardShowcase(),
                        ),
                      ),

                    if (_visibleSections['cards']!)
                      SizedBox(height: AppSpacing.lg),

                    // 输入框组件 - 单独使用_ErrorBoundary
                    if (_visibleSections['textfields']!)
                      _ErrorBoundary(
                        child: const ShowcaseSection(
                          title: '输入框',
                          description: '输入框组件用于收集用户输入，提供多种变体以适应不同的输入场景。',
                          child: _TextFieldShowcase(),
                        ),
                      ),

                    if (_visibleSections['textfields']!)
                      SizedBox(height: AppSpacing.lg),

                    // 对话框组件 - 单独使用_ErrorBoundary
                    if (_visibleSections['dialogs']!)
                      _ErrorBoundary(
                        child: ShowcaseSection(
                          title: '对话框',
                          description: '对话框用于重要信息的展示和用户交互确认。',
                          child: _DialogShowcase(context: context),
                        ),
                      ),

                    if (_visibleSections['dialogs']!)
                      SizedBox(height: AppSpacing.lg),

                    // 列表组件 - 单独使用_ErrorBoundary
                    if (_visibleSections['listtiles']!)
                      _ErrorBoundary(
                        child: const ShowcaseSection(
                          title: '列表项',
                          description: '列表项用于展示结构化数据，支持多种变体和交互方式。',
                          child: _ListTileShowcase(),
                        ),
                      ),

                    if (_visibleSections['listtiles']!)
                      SizedBox(height: AppSpacing.lg),

                    // 骨架屏加载 - 单独使用_ErrorBoundary
                    if (_visibleSections['skeletons']!)
                      _ErrorBoundary(
                        child: const ShowcaseSection(
                          title: '骨架屏加载',
                          description: '骨架屏加载组件用于数据加载时显示内容占位符，提升用户体验。',
                          child: _SkeletonLoadingShowcase(),
                        ),
                      ),

                    if (_visibleSections['skeletons']!)
                      SizedBox(height: AppSpacing.lg),

                    // 中医视觉元素 - 单独使用_ErrorBoundary + 高度限制
                    if (_visibleSections['tcmvisuals']!)
                      _ErrorBoundary(
                        child: ShowcaseSection(
                          title: '中医视觉元素',
                          description: '中医视觉元素基于五行学说，提供独特的视觉语言，体现中医特色。',
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              maxHeight: constraints.maxHeight * 0.6,
                              maxWidth: constraints.maxWidth,
                            ),
                            child: const _TCMVisualsShowcase(),
                          ),
                        ),
                      ),

                    if (_visibleSections['tcmvisuals']!)
                      SizedBox(height: AppSpacing.lg),

                    // 脉诊组件 - 单独使用_ErrorBoundary + 高度限制
                    if (_visibleSections['pulsediagnosis']!)
                      _ErrorBoundary(
                        child: ShowcaseSection(
                          title: '脉诊组件',
                          description: '实现脉象识别和分析功能，支持多种传统脉象类型，可进行临床意义解读，集成摄像头实时分析。',
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              maxHeight: constraints.maxHeight * 0.6,
                              maxWidth: constraints.maxWidth,
                            ),
                            child: const _PulseDiagnosisShowcase(),
                          ),
                        ),
                      ),

                    if (_visibleSections['pulsediagnosis']!)
                      SizedBox(height: AppSpacing.lg),

                    // 新增：徽章和标签组件 - 单独使用_ErrorBoundary
                    if (_visibleSections['badges']!)
                      _ErrorBoundary(
                        child: const ShowcaseSection(
                          title: '徽章和标签组件',
                          description: '徽章用于状态展示、计数和提醒，标签用于内容分类和筛选。两者均支持五行元素风格。',
                          child: _BadgeAndTagShowcase(),
                        ),
                      ),

                    if (_visibleSections['badges']!)
                      SizedBox(height: AppSpacing.lg),

                    // 新增：反馈组件 - 单独使用_ErrorBoundary
                    if (_visibleSections['feedback']!)
                      _ErrorBoundary(
                        child: const ShowcaseSection(
                          title: '反馈组件',
                          description: '用于提供轻量级的用户反馈、展示操作进度和空状态占位。',
                          child: _FeedbackComponentsShowcase(),
                        ),
                      ),

                    if (_visibleSections['feedback']!)
                      SizedBox(height: AppSpacing.lg),
                    
                    // 舌诊组件展示 - 单独使用_ErrorBoundary + 高度限制
                    if (_visibleSections['tonguediagnosis']!)
                      _ErrorBoundary(
                        child: ShowcaseSection(
                          title: '舌诊组件',
                          description: '舌诊组件用于分析舌相特征，支持多种舌质舌苔状态识别，具备实时分析功能。',
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              maxHeight: constraints.maxHeight * 0.6,
                              maxWidth: constraints.maxWidth,
                            ),
                            child: const _TongueDiagnosisShowcase(),
                          ),
                        ),
                      ),

                    if (_visibleSections['tonguediagnosis']!)
                      SizedBox(height: AppSpacing.lg),

                    // 自定义图标展示 - 单独使用_ErrorBoundary + 高度限制
                    if (_visibleSections['tcmicons']!)
                      _ErrorBoundary(
                        child: ShowcaseSection(
                          title: '中医自定义图标',
                          description: '基于中医五行理念设计的自定义图标系统，支持不同样式和尺寸。',
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              maxHeight: constraints.maxHeight * 0.6,
                              maxWidth: constraints.maxWidth,
                            ),
                            child: const _TCMIconsShowcase(),
                          ),
                        ),
                      ),

                    if (_visibleSections['tcmicons']!)
                      SizedBox(height: AppSpacing.lg),

                    // 传统纹样展示 - 单独使用_ErrorBoundary + 高度限制
                    if (_visibleSections['patterns']!)
                      _ErrorBoundary(
                        child: ShowcaseSection(
                          title: '传统纹样',
                          description: '简化版中国传统纹样，适用于背景和装饰元素。',
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              maxHeight: constraints.maxHeight * 0.6,
                              maxWidth: constraints.maxWidth,
                            ),
                            child: const _TraditionalPatternShowcase(),
                          ),
                        ),
                      ),

                    if (_visibleSections['patterns']!)
                      SizedBox(height: AppSpacing.lg),

                    // 节气元素展示 - 单独使用_ErrorBoundary + 高度限制
                    if (_visibleSections['solarterms']!)
                      _ErrorBoundary(
                        child: ShowcaseSection(
                          title: '24节气元素',
                          description: '基于二十四节气设计的季节性视觉元素，支持动态效果。',
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              maxHeight: constraints.maxHeight * 0.6,
                              maxWidth: constraints.maxWidth,
                            ),
                            child: const _SolarTermsShowcase(),
                          ),
                        ),
                      ),

                    SizedBox(height: AppSpacing.xxl),
                  ],
                ),
              ),
            );
          }
        ),
      ),
    );
  }
  
  // 检查是否所有部分都被隐藏
  bool _areAllSectionsHidden() {
    return !_visibleSections.values.contains(true);
  }

  // 构建导航菜单
  Widget _buildNavigationMenu() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '选择要查看的组件',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '提示：同时打开多个复杂组件可能导致渲染问题，建议一次只选择少量组件查看',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 16),
            
            // 快速选择按钮
            Row(
              children: [
                OutlinedButton.icon(
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('基础组件'),
                  onPressed: () => _selectPreset(_basicComponents),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primaryColor,
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  icon: const Icon(Icons.highlight_off),
                  label: const Text('清除所有'),
                  onPressed: () => _clearAllSelections(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.grey[700],
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  icon: const Icon(Icons.warning_amber),
                  label: const Text('慎选复杂组件'),
                  onPressed: () => _showComplexComponentsWarning(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.orange[700],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildCategoryChip('基础色彩', 'colors', isBasic: true),
                _buildCategoryChip('按钮组件', 'buttons', isBasic: true),
                _buildCategoryChip('卡片组件', 'cards', isBasic: true),
                _buildCategoryChip('输入框', 'textfields'),
                _buildCategoryChip('对话框', 'dialogs'),
                _buildCategoryChip('列表项', 'listtiles'),
                _buildCategoryChip('骨架屏', 'skeletons'),
                _buildCategoryChip('中医元素', 'tcmvisuals', isComplex: true),
                _buildCategoryChip('脉诊组件', 'pulsediagnosis', isComplex: true),
                _buildCategoryChip('徽章标签', 'badges'),
                _buildCategoryChip('反馈组件', 'feedback'),
                _buildCategoryChip('舌诊组件', 'tonguediagnosis', isComplex: true),
                _buildCategoryChip('中医图标', 'tcmicons', isComplex: true),
                _buildCategoryChip('传统纹样', 'patterns', isComplex: true),
                _buildCategoryChip('节气元素', 'solarterms', isComplex: true),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // 构建类别选择芯片
  Widget _buildCategoryChip(String label, String key, {bool isBasic = false, bool isComplex = false}) {
    Color chipColor;
    if (isComplex) {
      chipColor = Colors.orange[100]!;
    } else if (isBasic) {
      chipColor = Colors.lightGreen[100]!;
    } else {
      chipColor = Colors.blue[50]!;
    }
    
    return FilterChip(
      label: Text(label),
      selected: _visibleSections[key]!,
      onSelected: (selected) {
        setState(() {
          _visibleSections[key] = selected;
          
          // 如果选择了复杂组件，确保警告用户
          if (selected && _complexComponents.contains(key)) {
            _warnAboutComplexComponent();
          }
        });
      },
      selectedColor: _visibleSections[key]! 
          ? (isComplex ? Colors.orange[300] : AppColors.primaryColor.withAlpha(80))
          : chipColor,
      checkmarkColor: isComplex ? Colors.deepOrange : AppColors.primaryColor,
      tooltip: isComplex ? "此组件渲染复杂，可能导致性能问题" : null,
    );
  }
  
  // 选择预设组件组合
  void _selectPreset(List<String> components) {
    setState(() {
      // 先清除所有选择
      _visibleSections.updateAll((key, value) => false);
      
      // 然后启用指定的组件
      for (var component in components) {
        _visibleSections[component] = true;
      }
    });
  }
  
  // 清除所有选择
  void _clearAllSelections() {
    setState(() {
      _visibleSections.updateAll((key, value) => false);
    });
  }
  
  // 显示复杂组件警告
  void _showComplexComponentsWarning() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('复杂组件渲染警告'),
        content: const Text(
          '复杂组件（如中医视觉元素、脉诊组件、舌诊组件等）包含自定义绘制和复杂布局，同时加载多个可能导致渲染错误或性能问题。\n\n'
          '建议一次只加载一个复杂组件，或者与基础组件搭配使用。'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('了解'),
          ),
        ],
      ),
    );
  }
  
  // 警告关于复杂组件
  void _warnAboutComplexComponent() {
    // 计算已启用的复杂组件数量
    int enabledComplexComponents = _complexComponents
        .where((component) => _visibleSections[component] == true)
        .length;
    
    // 如果超过一个复杂组件启用，显示提示
    if (enabledComplexComponents > 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('警告：同时启用多个复杂组件可能导致渲染问题'),
          duration: Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

class _ColorShowcase extends StatelessWidget {
  const _ColorShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 品牌色
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.xs),
          child: Text('品牌色', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            ColorPaletteItem(
              color: AppColors.primaryColor,
              name: '索克绿',
              colorCode: '#35BB78',
            ),
            ColorPaletteItem(
              color: AppColors.secondaryColor,
              name: '索克橙',
              colorCode: '#FF6800',
            ),
            ColorPaletteItem(
              color: AppColors.primaryLight,
              name: '浅索克绿',
              colorCode: '#7FDCAA',
            ),
            ColorPaletteItem(
              color: AppColors.primaryDark,
              name: '深索克绿',
              colorCode: '#1A9A5E',
            ),
          ],
        ),

        // 功能色
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.md),
          child: Text('功能色', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            ColorPaletteItem(
              color: AppColors.successColor,
              name: '成功色',
              colorCode: '#4CAF50',
            ),
            ColorPaletteItem(
              color: AppColors.errorColor,
              name: '错误色',
              colorCode: '#E53935',
            ),
            ColorPaletteItem(
              color: AppColors.warningColor,
              name: '警告色',
              colorCode: '#FFB74D',
            ),
            ColorPaletteItem(
              color: AppColors.infoColor,
              name: '信息色',
              colorCode: '#4FC3F7',
            ),
          ],
        ),

        // 中性色
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.md),
          child: Text('中性色（当前主题）', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            ColorPaletteItem(
              color: Theme.of(context).colorScheme.background,
              name: '背景色',
              colorCode: '',
            ),
            ColorPaletteItem(
              color: Theme.of(context).colorScheme.surface,
              name: '表面色',
              colorCode: '',
            ),
            ColorPaletteItem(
              color:
                  Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black,
              name: '主要文本',
              colorCode: '',
            ),
            ColorPaletteItem(
              color:
                  Theme.of(context).textTheme.bodySmall?.color ?? Colors.grey,
              name: '次要文本',
              colorCode: '',
            ),
          ],
        ),
      ],
    );
  }
}

class _ButtonShowcase extends StatelessWidget {
  const _ButtonShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 按钮变体
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: Text('按钮变体', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: [
            app_widgets.PrimaryButton(
              label: '主要按钮',
              onPressed: () {},
            ),
            app_widgets.SecondaryButton(
              label: '次要按钮',
              onPressed: () {},
            ),
            app_widgets.OutlineButton(
              label: '轮廓按钮',
              onPressed: () {},
            ),
            app_widgets.AppTextButton(
              label: '文本按钮',
              onPressed: () {},
            ),
            app_widgets.DangerButton(
              label: '危险按钮',
              onPressed: () {},
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),

        // 按钮尺寸
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('按钮尺寸', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            app_widgets.PrimaryButton(
              label: '小尺寸',
              size: app_widgets.AppButtonSize.small,
              onPressed: () {},
            ),
            app_widgets.PrimaryButton(
              label: '中等尺寸',
              size: app_widgets.AppButtonSize.medium,
              onPressed: () {},
            ),
            app_widgets.PrimaryButton(
              label: '大尺寸',
              size: app_widgets.AppButtonSize.large,
              onPressed: () {},
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),

        // 带图标的按钮
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('带图标的按钮', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: [
            app_widgets.PrimaryButton(
              label: '前缀图标',
              prefixIcon: Icons.add,
              onPressed: () {},
            ),
            app_widgets.SecondaryButton(
              label: '后缀图标',
              suffixIcon: Icons.arrow_forward,
              onPressed: () {},
            ),
            app_widgets.OutlineButton(
              label: '双图标',
              prefixIcon: Icons.cloud_download,
              suffixIcon: Icons.arrow_drop_down,
              onPressed: () {},
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),

        // 特殊状态
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('特殊状态', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: [
            const app_widgets.PrimaryButton(
              label: '加载状态',
              isLoading: true,
              onPressed: null,
            ),
            const app_widgets.PrimaryButton(
              label: '禁用状态',
              onPressed: null,
            ),
            app_widgets.PrimaryButton(
              label: '全宽按钮',
              isFullWidth: true,
              onPressed: () {},
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),

        // 3D按压按钮
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('3D按压按钮', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          alignment: WrapAlignment.start,
          children: [
            app_widgets.AnimatedPressButton(
              label: '标准3D按钮',
              icon: Icons.touch_app,
              onPressed: () {},
            ),
            app_widgets.AnimatedPressButton(
              label: '较深效果',
              icon: Icons.arrow_downward,
              backgroundColor: AppColors.secondaryColor,
              depth: 8.0,
              onPressed: () {},
            ),
            app_widgets.AnimatedPressButton(
              label: '禁用状态',
              icon: Icons.block,
              isDisabled: true,
              onPressed: () {},
            ),
          ],
        ),
      ],
    );
  }
}

class _CardShowcase extends StatelessWidget {
  const _CardShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 标准卡片
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: Text('标准卡片', style: AppTypography.subtitle1),
        ),
        app_widgets.BasicCard(
          title: '标准卡片',
          content: const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text(
              '这是标准卡片的内容区域，用于展示主要信息。标准卡片是最常用的卡片类型，适用于大多数信息展示场景。\n带阴影的基础卡片组件',
              style: TextStyle(height: 1.5),
            ),
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 磨砂卡片
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('磨砂卡片', style: AppTypography.subtitle1),
        ),
        app_widgets.FrostedCard(
          title: '磨砂卡片',
          subtitle: '带模糊效果的卡片',
          leadingIcon: Icons.blur_on,
          content: const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text(
              '磨砂卡片适用于需要一定透明度的场景，能够让背景隐约可见，同时保持内容的清晰可读。',
              style: TextStyle(height: 1.5),
            ),
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 渐变卡片
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('渐变卡片', style: AppTypography.subtitle1),
        ),
        app_widgets.GradientCard(
          title: '渐变卡片',
          subtitle: '带渐变背景的卡片',
          leadingIcon: Icons.gradient,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primaryColor,
              AppColors.primaryColor.withAlpha(180),
            ],
          ),
          content: const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text(
              '渐变卡片适用于需要强调或突出显示的内容，能够增加视觉吸引力和层次感。',
              style: TextStyle(height: 1.5, color: Colors.white),
            ),
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 轮廓卡片
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('轮廓卡片', style: AppTypography.subtitle1),
        ),
        app_widgets.OutlineCard(
          title: '轮廓卡片',
          subtitle: '仅带边框的卡片',
          leadingIcon: Icons.border_all,
          content: const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text(
              '轮廓卡片适用于视觉层次较轻的场景，仅使用边框勾勒出卡片区域，不使用阴影和背景色。',
              style: TextStyle(height: 1.5),
            ),
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 动画渐变卡片
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('动画渐变卡片', style: AppTypography.subtitle1),
        ),
        SizedBox(
          height: 200,
          child: Row(
            children: [
              Expanded(
                child: app_widgets.AnimatedGradientCard(
                  title: '索克绿渐变卡片',
                  subtitle: '自动颜色变换',
                  leadingIcon: Icons.auto_awesome,
                  gradients: const [
                    [Color(0xFF35BB78), Color(0xFF7FDCAA)], // 索克绿渐变
                    [Color(0xFF7FDCAA), Color(0xFF35BB78)], // 反向索克绿渐变
                  ],
                  direction: app_widgets.GradientDirection.diagonal,
                  content: const Center(
                    child: Text(
                      '点击切换颜色',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: app_widgets.AnimatedGradientCard(
                  title: '索克橙渐变卡片',
                  subtitle: '自动颜色变换',
                  leadingIcon: Icons.hotel_class,
                  gradients: const [
                    [Color(0xFFFF6800), Color(0xFFFFB74D)], // 索克橙渐变
                    [Color(0xFFFFB74D), Color(0xFFFF6800)], // 反向索克橙渐变
                  ],
                  direction: app_widgets.GradientDirection.bottomToTop,
                  content: const Center(
                    child: Text(
                      '点击切换颜色',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 五行元素渐变卡片
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('五行元素渐变卡片', style: AppTypography.subtitle1),
        ),
        SizedBox(
          height: 160,
          child: app_widgets.AnimatedGradientCard(
            title: '五行元素渐变',
            subtitle: '木、火、土、金、水',
            leadingIcon: Icons.blur_on,
            gradients: const [
              [Color(0xFF4CAF50), Color(0xFF8BC34A)], // 木
              [Color(0xFFF44336), Color(0xFFFF9800)], // 火
              [Color(0xFFFFEB3B), Color(0xFFFFC107)], // 土
              [Color(0xFFB0BEC5), Color(0xFF78909C)], // 金
              [Color(0xFF2196F3), Color(0xFF03A9F4)], // 水
            ],
            direction: app_widgets.GradientDirection.diagonal,
            animationDuration: const Duration(seconds: 2),
            colorChangeInterval: const Duration(seconds: 4),
            content: const Center(
              child: Text(
                '中医五行渐变效果',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _TextFieldShowcase extends StatelessWidget {
  const _TextFieldShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 填充式输入框
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: Text('填充式输入框', style: AppTypography.subtitle1),
        ),
        const app_widgets.FilledTextField(
          label: '用户名',
          hintText: '请输入用户名',
          prefixIcon: Icons.person,
        ),

        SizedBox(height: AppSpacing.md),

        // 轮廓式输入框
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('轮廓式输入框', style: AppTypography.subtitle1),
        ),
        const app_widgets.OutlinedTextField(
          label: '密码',
          hintText: '请输入密码',
          prefixIcon: Icons.lock,
          obscureText: true,
          showClearButton: true,
        ),

        SizedBox(height: AppSpacing.md),

        // 底部线条式输入框
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('底部线条式输入框', style: AppTypography.subtitle1),
        ),
        const app_widgets.UnderlinedTextField(
          label: '验证码',
          hintText: '请输入验证码',
          helperText: '验证码已发送至您的手机',
          prefixIcon: Icons.sms,
          keyboardType: TextInputType.number,
        ),

        SizedBox(height: AppSpacing.md),

        // 特殊状态
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('特殊状态', style: AppTypography.subtitle1),
        ),
        const app_widgets.FilledTextField(
          label: '错误状态',
          hintText: '请输入正确的邮箱',
          prefixIcon: Icons.email,
          errorText: '邮箱格式不正确',
        ),

        SizedBox(height: AppSpacing.sm),

        const app_widgets.FilledTextField(
          label: '禁用状态',
          hintText: '此字段不可编辑',
          prefixIcon: Icons.block,
          enabled: false,
        ),

        SizedBox(height: AppSpacing.sm),

        const app_widgets.FilledTextField(
          label: '多行文本',
          hintText: '请输入详细描述',
          maxLines: 3,
          showCounter: true,
          maxLength: 100,
        ),
      ],
    );
  }
}

class _DialogShowcase extends StatelessWidget {
  final BuildContext context;

  const _DialogShowcase({required this.context});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: Text('对话框类型', style: AppTypography.subtitle1),
        ),
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: [
            app_widgets.PrimaryButton(
              label: '标准对话框',
              onPressed: () {
                app_widgets.AppDialog.show(
                  context: context,
                  title: '标准对话框',
                  content: '这是一个标准对话框，用于展示一般信息和简单操作。',
                  confirmText: '确定',
                  cancelText: '取消',
                );
              },
            ),
            app_widgets.PrimaryButton(
              label: '确认对话框',
              onPressed: () {
                app_widgets.ConfirmationDialog.show(
                  context: context,
                  title: '确认操作',
                  content: '您确定要执行此操作吗？此操作不可撤销。',
                  confirmText: '确认',
                  cancelText: '取消',
                );
              },
            ),
            app_widgets.PrimaryButton(
              label: '成功对话框',
              onPressed: () {
                app_widgets.ResultDialog.show(
                  context: context,
                  title: '操作成功',
                  content: '您的操作已成功完成！',
                  type: app_widgets.AppDialogType.success,
                  buttonText: '知道了',
                );
              },
            ),
            app_widgets.PrimaryButton(
              label: '错误对话框',
              onPressed: () {
                app_widgets.ResultDialog.show(
                  context: context,
                  title: '操作失败',
                  content: '很抱歉，操作失败，请稍后重试。',
                  type: app_widgets.AppDialogType.error,
                  buttonText: '关闭',
                );
              },
            ),
            app_widgets.PrimaryButton(
              label: '警告对话框',
              onPressed: () {
                app_widgets.ResultDialog.show(
                  context: context,
                  title: '注意',
                  content: '此操作可能导致数据丢失，请谨慎操作。',
                  type: app_widgets.AppDialogType.warning,
                  buttonText: '我知道了',
                );
              },
            ),
          ],
        ),
      ],
    );
  }
}

class _ListTileShowcase extends StatelessWidget {
  const _ListTileShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 标准列表项
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: Text('标准列表项', style: AppTypography.subtitle1),
        ),
        Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              app_widgets.StandardListTile(
                title: '标准列表项',
                subtitle: '带图标和箭头的标准列表项',
                leadingIcon: Icons.settings,
                trailingIcon: Icons.arrow_forward_ios,
                onTap: () {},
              ),
              app_widgets.DividedListTile(
                title: '分割线列表项',
                subtitle: '带底部分割线的列表项',
                leadingIcon: Icons.person,
                trailingIcon: Icons.arrow_forward_ios,
                onTap: () {},
              ),
              app_widgets.DividedListTile(
                title: '另一个分割线列表项',
                subtitle: '适合用于设置菜单',
                leadingIcon: Icons.notifications,
                trailingIcon: Icons.arrow_forward_ios,
                onTap: () {},
              ),
            ],
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 紧凑列表项
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('紧凑列表项', style: AppTypography.subtitle1),
        ),
        Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              app_widgets.CompactListTile(
                title: '紧凑列表项 1',
                leadingIcon: Icons.star,
                onTap: () {},
              ),
              app_widgets.CompactListTile(
                title: '紧凑列表项 2',
                leadingIcon: Icons.favorite,
                onTap: () {},
              ),
              app_widgets.CompactListTile(
                title: '紧凑列表项 3',
                leadingIcon: Icons.bookmark,
                onTap: () {},
              ),
            ],
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 卡片列表项
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('卡片列表项', style: AppTypography.subtitle1),
        ),
        app_widgets.CardListTile(
          title: '卡片列表项',
          subtitle: '带圆角和阴影的卡片式列表项',
          leadingIcon: Icons.credit_card,
          trailingIcon: Icons.arrow_forward_ios,
          onTap: () {},
        ),

        SizedBox(height: AppSpacing.xs),

        app_widgets.CardListTile(
          title: '另一个卡片列表项',
          subtitle: '适合突出显示重要内容',
          leadingIcon: Icons.lightbulb,
          trailingIcon: Icons.arrow_forward_ios,
          onTap: () {},
        ),
      ],
    );
  }
}

/// 骨架屏加载组件展示
class _SkeletonLoadingShowcase extends StatelessWidget {
  const _SkeletonLoadingShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 基础骨架组件
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm),
          child: Text('基础骨架组件', style: AppTypography.subtitle1),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Column(
              children: [
                app_widgets.SkeletonLoading(
                  width: 80,
                  height: 80,
                  shape: app_widgets.SkeletonShape.rectangle,
                ),
                SizedBox(height: AppSpacing.xs),
                Text('矩形', style: AppTypography.captionStyle),
              ],
            ),
            Column(
              children: [
                app_widgets.SkeletonLoading(
                  width: 80,
                  height: 80,
                  shape: app_widgets.SkeletonShape.rounded,
                ),
                SizedBox(height: AppSpacing.xs),
                Text('圆角矩形', style: AppTypography.captionStyle),
              ],
            ),
            Column(
              children: [
                app_widgets.SkeletonLoading(
                  width: 80,
                  height: 80,
                  shape: app_widgets.SkeletonShape.circle,
                ),
                SizedBox(height: AppSpacing.xs),
                Text('圆形', style: AppTypography.captionStyle),
              ],
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),

        // 文本骨架
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('文本骨架', style: AppTypography.subtitle1),
        ),
        app_widgets.SkeletonText(
          lines: 4,
          lineHeight: 16,
          spacing: 8,
        ),

        SizedBox(height: AppSpacing.md),

        // 列表项骨架
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('列表项骨架', style: AppTypography.subtitle1),
        ),
        Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              app_widgets.SkeletonListTile(
                hasLeading: true,
                hasSubtitle: true,
                hasTrailing: true,
              ),
              app_widgets.SkeletonListTile(
                hasLeading: true,
                hasSubtitle: true,
                hasTrailing: false,
              ),
              app_widgets.SkeletonListTile(
                hasLeading: false,
                hasSubtitle: true,
                hasTrailing: true,
              ),
            ],
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 卡片骨架
        Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.sm, top: AppSpacing.sm),
          child: Text('卡片骨架', style: AppTypography.subtitle1),
        ),
        SizedBox(
          height: 200,
          child: Row(
            children: [
              Expanded(
                child: app_widgets.SkeletonCard(
                  hasImage: true,
                  hasTitle: true,
                  contentLines: 2,
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: app_widgets.SkeletonCard(
                  hasImage: false,
                  hasTitle: true,
                  contentLines: 4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// TCM可视化组件展示
class _TCMVisualsShowcase extends StatelessWidget {
  const _TCMVisualsShowcase({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 五行关系图组件
        _buildShowcaseItem(
          title: '五行关系图',
          description: '展示五行元素之间的相生相克关系，支持环形、星形和线性布局，可定制元素大小和关系线条样式。',
          child: SizedBox(
            height: 340,
            child: Column(
              children: [
                Expanded(
                  child: app_widgets.FiveElementsChart(
                    data: _createSampleFiveElementsData(),
                    showGenerationCycle: true,
                    showControlCycle: true,
                    chartType: app_widgets.FiveElementsChartType.circular,
                    elementSize: 45,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildLegendItem(AppColors.primaryColor, '相生关系'),
                    const SizedBox(width: 16),
                    _buildLegendItem(AppColors.secondaryColor, '相克关系'),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 24),

        // 体质雷达图组件
        _buildShowcaseItem(
          title: '体质雷达图',
          description: '展示体质评估结果的雷达图，支持多维数据展示，包含网格、轴线和标签，可定制颜色和动画效果。',
          child: SizedBox(
            height: 340,
            child: app_widgets.ElementRadarChart(
              data: _createSampleRadarChartData(),
              showGrid: true,
              showAxis: true,
              showLabels: true,
              divisions: 4,
            ),
          ),
        ),
      ],
    );
  }

  // 构建图例项
  Widget _buildLegendItem(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 2,
          color: color,
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  // 构建展示项
  Widget _buildShowcaseItem({
    required String title,
    required String description,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTypography.subtitle1,
        ),
        const SizedBox(height: 4),
        Text(
          description,
          style: const TextStyle(
            fontSize: 14,
            color: Colors.grey,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(10),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: child,
        ),
      ],
    );
  }

  // 创建示例五行数据
  app_widgets.FiveElementsData _createSampleFiveElementsData() {
    // 创建不均衡的五行数据
    final data = app_widgets.FiveElementsData(
      values: {
        ElementType.wood: 0.8,
        ElementType.fire: 0.6,
        ElementType.earth: 0.5,
        ElementType.metal: 0.4,
        ElementType.water: 0.7,
      },
      relations: [],
    );

    // 生成相生相克关系
    final relations = <app_widgets.ElementRelation>[];

    // 添加相生关系
    relations.addAll([
      // 木生火
      app_widgets.ElementRelation(
        source: ElementType.wood,
        target: ElementType.fire,
        type: app_widgets.ElementRelationType.generating,
        strength: data.values[ElementType.wood]! * 0.8,
      ),
      // 火生土
      app_widgets.ElementRelation(
        source: ElementType.fire,
        target: ElementType.earth,
        type: app_widgets.ElementRelationType.generating,
        strength: data.values[ElementType.fire]! * 0.8,
      ),
      // 土生金
      app_widgets.ElementRelation(
        source: ElementType.earth,
        target: ElementType.metal,
        type: app_widgets.ElementRelationType.generating,
        strength: data.values[ElementType.earth]! * 0.8,
      ),
      // 金生水
      app_widgets.ElementRelation(
        source: ElementType.metal,
        target: ElementType.water,
        type: app_widgets.ElementRelationType.generating,
        strength: data.values[ElementType.metal]! * 0.8,
      ),
      // 水生木
      app_widgets.ElementRelation(
        source: ElementType.water,
        target: ElementType.wood,
        type: app_widgets.ElementRelationType.generating,
        strength: data.values[ElementType.water]! * 0.8,
      ),
    ]);

    // 添加相克关系
    relations.addAll([
      // 木克土
      app_widgets.ElementRelation(
        source: ElementType.wood,
        target: ElementType.earth,
        type: app_widgets.ElementRelationType.controlling,
        strength: data.values[ElementType.wood]! * 0.6,
      ),
      // 土克水
      app_widgets.ElementRelation(
        source: ElementType.earth,
        target: ElementType.water,
        type: app_widgets.ElementRelationType.controlling,
        strength: data.values[ElementType.earth]! * 0.6,
      ),
      // 水克火
      app_widgets.ElementRelation(
        source: ElementType.water,
        target: ElementType.fire,
        type: app_widgets.ElementRelationType.controlling,
        strength: data.values[ElementType.water]! * 0.6,
      ),
      // 火克金
      app_widgets.ElementRelation(
        source: ElementType.fire,
        target: ElementType.metal,
        type: app_widgets.ElementRelationType.controlling,
        strength: data.values[ElementType.fire]! * 0.6,
      ),
      // 金克木
      app_widgets.ElementRelation(
        source: ElementType.metal,
        target: ElementType.wood,
        type: app_widgets.ElementRelationType.controlling,
        strength: data.values[ElementType.metal]! * 0.6,
      ),
    ]);

    return app_widgets.FiveElementsData(
      values: data.values,
      relations: relations,
    );
  }

  // 创建示例雷达图数据
  app_widgets.RadarChartData _createSampleRadarChartData() {
    final dataPoints = [
      app_widgets.RadarDataPoint(
        label: 'balanced',
        value: 5.0,
        color: Colors.green,
        tooltip: '平和体质',
      ),
      app_widgets.RadarDataPoint(
        label: 'qiDeficiency',
        value: 7.5,
        color: Colors.orange,
        tooltip: '气虚体质',
      ),
      app_widgets.RadarDataPoint(
        label: 'yangDeficiency',
        value: 3.5,
        color: Colors.blue,
        tooltip: '阳虚体质',
      ),
      app_widgets.RadarDataPoint(
        label: 'yinDeficiency',
        value: 8.0,
        color: Colors.red,
        tooltip: '阴虚体质',
      ),
      app_widgets.RadarDataPoint(
        label: 'phlegmDampness',
        value: 4.0,
        color: Colors.amber,
        tooltip: '痰湿体质',
      ),
      app_widgets.RadarDataPoint(
        label: 'dampnessHeat',
        value: 6.5,
        color: Colors.deepOrange,
        tooltip: '湿热体质',
      ),
      app_widgets.RadarDataPoint(
        label: 'bloodStasis',
        value: 5.5,
        color: Colors.purple,
        tooltip: '血瘀体质',
      ),
      app_widgets.RadarDataPoint(
        label: 'qiStagnation',
        value: 4.5,
        color: Colors.teal,
        tooltip: '气郁体质',
      ),
      app_widgets.RadarDataPoint(
        label: 'allergic',
        value: 3.0,
        color: Colors.pink,
        tooltip: '过敏体质',
      ),
    ];

    return app_widgets.RadarChartData(
      name: '体质分布',
      dataPoints: dataPoints,
      color: AppColors.primaryColor,
      lineWidth: 2.0,
    );
  }
}

/// 徽章和标签组件展示
class _BadgeAndTagShowcase extends StatelessWidget {
  const _BadgeAndTagShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('徽章组件', style: AppTypography.subtitle1),
        SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: [
            // 不同样式的徽章
            const app_widgets.AppBadge(
              label: '新',
              style: app_widgets.BadgeStyle.filled,
              size: app_widgets.BadgeSize.small,
              color: AppColors.primaryColor,
            ),
            const app_widgets.AppBadge(
              count: 8,
              style: app_widgets.BadgeStyle.outlined,
              size: app_widgets.BadgeSize.medium,
              color: AppColors.warningColor,
            ),
            const app_widgets.AppBadge(
              label: 'VIP',
              style: app_widgets.BadgeStyle.light,
              size: app_widgets.BadgeSize.large,
              color: AppColors.goldColor,
            ),
            const app_widgets.AppBadge(
              isDot: true,
              color: AppColors.errorColor,
            ),

            // 五行元素徽章
            app_widgets.AppBadge(
              label: '木',
              style: app_widgets.BadgeStyle.element,
              elementType: ElementType.wood,
            ),
            app_widgets.AppBadge(
              label: '火',
              style: app_widgets.BadgeStyle.element,
              elementType: ElementType.fire,
            ),
            app_widgets.AppBadge(
              label: '土',
              style: app_widgets.BadgeStyle.element,
              elementType: ElementType.earth,
            ),
            app_widgets.AppBadge(
              label: '金',
              style: app_widgets.BadgeStyle.element,
              elementType: ElementType.metal,
            ),
            app_widgets.AppBadge(
              label: '水',
              style: app_widgets.BadgeStyle.element,
              elementType: ElementType.water,
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),

        // 带有子组件的徽章
        Container(
          padding: EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.withAlpha(100)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const app_widgets.AppBadge(
            count: 5,
            color: AppColors.primaryColor,
            child: Icon(Icons.notifications, size: 36),
          ),
        ),

        SizedBox(height: AppSpacing.md),
        Text('标签组件', style: AppTypography.subtitle1),
        SizedBox(height: AppSpacing.sm),

        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: [
            // 不同样式的标签
            const app_widgets.AppTag(
              label: '中医养生',
              style: app_widgets.TagStyle.filled,
              size: app_widgets.TagSize.small,
              color: AppColors.primaryColor,
            ),
            app_widgets.AppTag(
              label: '食疗推荐',
              style: app_widgets.TagStyle.outlined,
              size: app_widgets.TagSize.medium,
              color: AppColors.secondaryColor,
              onTap: () {},
            ),
            const app_widgets.AppTag(
              label: '热门话题',
              style: app_widgets.TagStyle.light,
              size: app_widgets.TagSize.large,
              color: AppColors.tertiaryColor,
              selected: true,
            ),

            // 带图标的标签
            const app_widgets.AppTag(
              label: '季节养生',
              icon: Icons.eco,
              style: app_widgets.TagStyle.filled,
              color: AppColors.woodColor,
            ),

            // 可关闭的标签
            app_widgets.AppTag(
              label: '可关闭',
              style: app_widgets.TagStyle.outlined,
              closable: true,
              onClose: () {},
            ),

            // 五行元素标签
            app_widgets.AppTag(
              label: '木元素标签',
              style: app_widgets.TagStyle.element,
              elementType: ElementType.wood,
            ),
            app_widgets.AppTag(
              label: '火元素标签',
              style: app_widgets.TagStyle.element,
              elementType: ElementType.fire,
            ),
            app_widgets.AppTag(
              label: '土元素标签',
              style: app_widgets.TagStyle.element,
              elementType: ElementType.earth,
            ),
            app_widgets.AppTag(
              label: '金元素标签',
              style: app_widgets.TagStyle.element,
              elementType: ElementType.metal,
            ),
            app_widgets.AppTag(
              label: '水元素标签',
              style: app_widgets.TagStyle.element,
              elementType: ElementType.water,
            ),
          ],
        ),
      ],
    );
  }
}

/// 反馈组件展示
class _FeedbackComponentsShowcase extends StatelessWidget {
  const _FeedbackComponentsShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('进度指示器', style: AppTypography.subtitle1),
        SizedBox(height: AppSpacing.sm),

        // 线性进度条
        Row(
          children: [
            SizedBox(
              width: 150,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('线性进度条:', style: AppTypography.body2Style),
                  SizedBox(height: AppSpacing.xs),
                  const app_widgets.AppProgress(
                    value: 0.65,
                    showLabel: true,
                  ),
                ],
              ),
            ),
            SizedBox(width: AppSpacing.md),
            SizedBox(
              width: 150,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('五行元素进度条:', style: AppTypography.body2Style),
                  SizedBox(height: AppSpacing.xs),
                  app_widgets.FiveElementProgress(
                    value: 0.8,
                    elementType: ElementType.fire,
                    showLabel: true,
                  ),
                ],
              ),
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),

        // 环形进度条
        Row(
          children: [
            Column(
              children: [
                Text('环形进度条:', style: AppTypography.body2Style),
                SizedBox(height: AppSpacing.xs),
                const app_widgets.AppProgress(
                  value: 0.75,
                  type: app_widgets.ProgressType.circular,
                  showLabel: true,
                  circularSize: 80,
                ),
              ],
            ),
            SizedBox(width: AppSpacing.lg),
            Column(
              children: [
                Text('不确定进度条:', style: AppTypography.body2Style),
                SizedBox(height: AppSpacing.xs),
                const app_widgets.AppProgress(
                  type: app_widgets.ProgressType.circular,
                  circularSize: 80,
                ),
              ],
            ),
          ],
        ),

        SizedBox(height: AppSpacing.md),
        Text('空状态占位组件', style: AppTypography.subtitle1),
        SizedBox(height: AppSpacing.sm),

        // 各种空状态展示
        Container(
          padding: EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.withAlpha(100)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: SizedBox(
            height: 180,
            child: Center(
              child: const app_widgets.AppEmptyState(
                type: app_widgets.EmptyStateType.noData,
                compact: true,
                actionButton: app_widgets.SecondaryButton(
                  label: '刷新',
                  prefixIcon: Icons.refresh,
                  onPressed: null,
                ),
              ),
            ),
          ),
        ),

        SizedBox(height: AppSpacing.md),

        // 不同类型的空状态（水平展示）
        SizedBox(
          height: 100,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              app_widgets.AppEmptyState(
                type: app_widgets.EmptyStateType.noSearchResults,
                compact: true,
                direction: Axis.horizontal,
              ),
              SizedBox(width: 16),
              app_widgets.AppEmptyState(
                type: app_widgets.EmptyStateType.networkError,
                compact: true,
                direction: Axis.horizontal,
              ),
              SizedBox(width: 16),
              app_widgets.AppEmptyState(
                type: app_widgets.EmptyStateType.waiting,
                compact: true,
                direction: Axis.horizontal,
              ),
            ],
          ),
        ),

        SizedBox(height: AppSpacing.md),
        Text('Toast提示按钮', style: AppTypography.subtitle1),
        SizedBox(height: AppSpacing.sm),

        // Toast提示组件（使用按钮触发）
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          children: [
            app_widgets.PrimaryButton(
              label: '显示普通Toast',
              onPressed: () {
                app_widgets.AppToast.info(
                  context,
                  '这是一条普通提示信息',
                );
              },
            ),
            app_widgets.SecondaryButton(
              label: '显示成功Toast',
              onPressed: () {
                app_widgets.AppToast.success(
                  context,
                  '操作成功完成',
                );
              },
            ),
            app_widgets.OutlineButton(
              label: '显示警告Toast',
              onPressed: () {
                app_widgets.AppToast.warning(
                  context,
                  '请注意操作风险',
                );
              },
            ),
            app_widgets.DangerButton(
              label: '显示错误Toast',
              onPressed: () {
                app_widgets.AppToast.error(
                  context,
                  '系统发生错误，请稍后重试',
                );
              },
            ),
          ],
        ),
      ],
    );
  }
}

/// 脉诊组件展示
class _PulseDiagnosisShowcase extends ConsumerStatefulWidget {
  const _PulseDiagnosisShowcase({Key? key}) : super(key: key);

  @override
  ConsumerState<_PulseDiagnosisShowcase> createState() => _PulseDiagnosisShowcaseState();
}

class _PulseDiagnosisShowcaseState extends ConsumerState<_PulseDiagnosisShowcase> {
  bool _enableAnimation = false;
  bool _showFullFunctionality = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 控制面板
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12.0),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text(
                    '渲染优化选项',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    icon: const Icon(Icons.warning_amber, size: 16),
                    label: const Text('渲染压力大', style: TextStyle(fontSize: 12)),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.orange[700],
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('脉诊组件使用大量动画和复杂绘制，可能导致性能问题'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 16,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Switch(
                        value: _enableAnimation,
                        onChanged: (value) {
                          setState(() {
                            _enableAnimation = value;
                          });
                        },
                        activeColor: AppColors.primaryColor,
                      ),
                      const Text('启用动画', style: TextStyle(fontSize: 13)),
                    ],
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Switch(
                        value: _showFullFunctionality,
                        onChanged: (value) {
                          setState(() {
                            _showFullFunctionality = value;
                          });
                        },
                        activeColor: AppColors.primaryColor,
                      ),
                      const Text('显示全部功能', style: TextStyle(fontSize: 13)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // 介绍
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: AppColors.infoColor.withAlpha(30),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                '脉诊是中医诊断的重要方法',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              SizedBox(height: 8),
              Text(
                '脉诊组件支持以下功能：\n'
                '• 模拟12种传统脉象，包括浮脉、沉脉、滑脉等\n'
                '• 支持摄像头采集脉象数据并分析\n'
                '• 提供脉象波形可视化和分析结果展示\n'
                '• 包含详细的临床意义解读',
                style: TextStyle(height: 1.5),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // 脉诊组件 - 使用优化后的配置
        app_widgets.PulseDiagnosisWidget(
          enableAnimationByDefault: _enableAnimation,
          enableCamera: false, // Web平台不启用相机
          showPulseSelector: _showFullFunctionality,
          showAnalysisResult: _showFullFunctionality,
          initialPulseType: app_widgets.PulseDiagnosisWidget.defaultPulseType,
        ),

        const SizedBox(height: 24),

        // 使用说明
        if (_showFullFunctionality) ... [
          Text('使用说明', style: AppTypography.subtitle1),
          const SizedBox(height: 8),
          const Text(
            '1. 【脉象模拟】按钮：选择要模拟的脉象类型，系统会生成对应波形并分析\n'
            '2. 【相机分析】按钮：启动摄像头，将手指放在摄像头上进行实时脉象采集和分析（Web平台不支持）\n'
            '3. 分析结果会显示主要脉象类型及匹配度，并提供临床解读',
            style: TextStyle(height: 1.5),
          ),
        ],
      ],
    );
  }
}

// 舌诊组件展示
class _TongueDiagnosisShowcase extends StatelessWidget {
  const _TongueDiagnosisShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 舌诊组件示例
        Container(
          height: 300,
          alignment: Alignment.center,
          child: CustomPaint(
            size: Size(300, 300),
            painter: TongueDiagnosisPainter(),
          ),
        ),
      ],
    );
  }
}

/// 舌诊图绘制器
class TongueDiagnosisPainter extends CustomPainter {
  final Color tongueColor;
  final Color outlineColor;
  final bool isHealthy;
  
  TongueDiagnosisPainter({
    this.tongueColor = const Color(0xFFE57373),
    this.outlineColor = const Color(0xFF212121),
    this.isHealthy = true,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制舌头轮廓
    final tonguePath = Path()
      ..moveTo(width * 0.5, height * 0.1)
      ..quadraticBezierTo(width * 0.25, height * 0.2, width * 0.2, height * 0.4)
      ..quadraticBezierTo(width * 0.15, height * 0.6, width * 0.2, height * 0.8)
      ..quadraticBezierTo(width * 0.35, height * 0.9, width * 0.5, height * 0.9)
      ..quadraticBezierTo(width * 0.65, height * 0.9, width * 0.8, height * 0.8)
      ..quadraticBezierTo(width * 0.85, height * 0.6, width * 0.8, height * 0.4)
      ..quadraticBezierTo(width * 0.75, height * 0.2, width * 0.5, height * 0.1)
      ..close();
    
    // 绘制舌苔
    final coatingPath = Path()
      ..moveTo(width * 0.5, height * 0.2)
      ..quadraticBezierTo(width * 0.35, height * 0.3, width * 0.3, height * 0.4)
      ..quadraticBezierTo(width * 0.25, height * 0.6, width * 0.3, height * 0.75)
      ..quadraticBezierTo(width * 0.4, height * 0.85, width * 0.5, height * 0.85)
      ..quadraticBezierTo(width * 0.6, height * 0.85, width * 0.7, height * 0.75)
      ..quadraticBezierTo(width * 0.75, height * 0.6, width * 0.7, height * 0.4)
      ..quadraticBezierTo(width * 0.65, height * 0.3, width * 0.5, height * 0.2)
      ..close();
    
    // 绘制舌纹
    final crackPath = Path();
    if (!isHealthy) {
      crackPath.moveTo(width * 0.3, height * 0.3);
      crackPath.lineTo(width * 0.6, height * 0.5);
      
      crackPath.moveTo(width * 0.4, height * 0.6);
      crackPath.lineTo(width * 0.7, height * 0.4);
      
      crackPath.moveTo(width * 0.35, height * 0.7);
      crackPath.lineTo(width * 0.65, height * 0.65);
    }
    
    // 填充舌体
    final tongueFillPaint = Paint()
      ..color = tongueColor
      ..style = PaintingStyle.fill;
    canvas.drawPath(tonguePath, tongueFillPaint);
    
    // 填充舌苔
    final coatingFillPaint = Paint()
      ..color = isHealthy ? Colors.white.withOpacity(0.4) : Colors.white.withOpacity(0.7)
      ..style = PaintingStyle.fill;
    canvas.drawPath(coatingPath, coatingFillPaint);
    
    // 绘制轮廓
    final outlinePaint = Paint()
      ..color = outlineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawPath(tonguePath, outlinePaint);
    
    // 绘制舌纹
    if (!isHealthy) {
      final crackPaint = Paint()
        ..color = Colors.red.shade900
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;
      canvas.drawPath(crackPath, crackPaint);
    }
    
    // 绘制小点表示舌苔
    final random = math.Random(0); // 固定种子以保持一致
    final dotPaint = Paint()
      ..color = isHealthy ? Colors.white.withOpacity(0.6) : Colors.yellow.withOpacity(0.6)
      ..style = PaintingStyle.fill;
    
    for (int i = 0; i < 50; i++) {
      final x = width * (0.3 + random.nextDouble() * 0.4);
      final y = height * (0.3 + random.nextDouble() * 0.5);
      
      // 确保点在舌苔区域内
      if (coatingPath.contains(Offset(x, y))) {
        canvas.drawCircle(
          Offset(x, y),
          1.0 + random.nextDouble() * 1.5,
          dotPaint,
        );
      }
    }
  }
  
  @override
  bool shouldRepaint(covariant TongueDiagnosisPainter oldDelegate) {
    return oldDelegate.tongueColor != tongueColor ||
        oldDelegate.outlineColor != outlineColor ||
        oldDelegate.isHealthy != isHealthy;
  }
}

/// 针灸图标绘制
class AcupunctureIconPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  
  AcupunctureIconPainter({
    this.color = const Color(0xFF35BB78),
    this.strokeWidth = 2.0,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制人体轮廓（背面）
    final bodyPath = Path()
      // 头部
      ..addOval(Rect.fromCenter(
        center: Offset(width / 2, height * 0.15),
        width: width * 0.2,
        height: height * 0.2,
      ))
      // 躯干
      ..moveTo(width * 0.4, height * 0.25)
      ..lineTo(width * 0.4, height * 0.7)
      ..moveTo(width * 0.6, height * 0.25)
      ..lineTo(width * 0.6, height * 0.7)
      // 脊柱
      ..moveTo(width * 0.5, height * 0.25)
      ..lineTo(width * 0.5, height * 0.7)
      // 腿部
      ..moveTo(width * 0.4, height * 0.7)
      ..lineTo(width * 0.35, height * 0.9)
      ..moveTo(width * 0.6, height * 0.7)
      ..lineTo(width * 0.65, height * 0.9);
    
    // 绘制针灸针
    final needlePath = Path();
    // 第一根针
    needlePath.moveTo(width * 0.3, height * 0.3);
    needlePath.lineTo(width * 0.45, height * 0.4);
    // 第二根针
    needlePath.moveTo(width * 0.35, height * 0.5);
    needlePath.lineTo(width * 0.5, height * 0.5);
    // 第三根针
    needlePath.moveTo(width * 0.3, height * 0.6);
    needlePath.lineTo(width * 0.45, height * 0.55);
    // 第四根针
    needlePath.moveTo(width * 0.7, height * 0.3);
    needlePath.lineTo(width * 0.55, height * 0.4);
    // 第五根针
    needlePath.moveTo(width * 0.65, height * 0.5);
    needlePath.lineTo(width * 0.5, height * 0.5);
    // 第六根针
    needlePath.moveTo(width * 0.7, height * 0.6);
    needlePath.lineTo(width * 0.55, height * 0.55);
    
    // 绘制穴位点
    final acupointPath = Path();
    acupointPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.45, height * 0.4),
      width: width * 0.06,
      height: height * 0.06,
    ));
    acupointPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.5, height * 0.5),
      width: width * 0.06,
      height: height * 0.06,
    ));
    acupointPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.45, height * 0.55),
      width: width * 0.06,
      height: height * 0.06,
    ));
    acupointPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.55, height * 0.4),
      width: width * 0.06,
      height: height * 0.06,
    ));
    acupointPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.55, height * 0.55),
      width: width * 0.06,
      height: height * 0.06,
    ));
    
    canvas.drawPath(bodyPath, paint);
    canvas.drawPath(needlePath, paint);
    
    final acupointPaint = Paint()
      ..color = color.withOpacity(0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(acupointPath, acupointPaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 推拿图标绘制
class MassageIconPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  
  MassageIconPainter({
    this.color = const Color(0xFF35BB78),
    this.strokeWidth = 2.0,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制手掌
    final handPath = Path()
      // 手掌轮廓
      ..moveTo(width * 0.3, height * 0.6)
      ..quadraticBezierTo(width * 0.25, height * 0.4, width * 0.3, height * 0.3)
      ..quadraticBezierTo(width * 0.4, height * 0.15, width * 0.5, height * 0.2)
      ..quadraticBezierTo(width * 0.6, height * 0.15, width * 0.7, height * 0.3)
      ..quadraticBezierTo(width * 0.75, height * 0.4, width * 0.7, height * 0.6)
      ..quadraticBezierTo(width * 0.5, height * 0.75, width * 0.3, height * 0.6)
      
      // 手指分隔线
      ..moveTo(width * 0.4, height * 0.2)
      ..lineTo(width * 0.4, height * 0.5)
      ..moveTo(width * 0.5, height * 0.2)
      ..lineTo(width * 0.5, height * 0.55)
      ..moveTo(width * 0.6, height * 0.2)
      ..lineTo(width * 0.6, height * 0.5);
    
    // 绘制能量波纹
    final energyPath = Path();
    for (int i = 1; i <= 3; i++) {
      final radius = (i * 0.1) * width;
      energyPath.addOval(Rect.fromCenter(
        center: Offset(width * 0.5, height * 0.4),
        width: radius,
        height: radius,
      ));
    }
    
    // 绘制人体轮廓
    final bodyPath = Path()
      ..addRect(Rect.fromLTWH(
        width * 0.35, height * 0.75,
        width * 0.3, height * 0.2,
      ));
    
    canvas.drawPath(handPath, paint);
    
    final energyPaint = Paint()
      ..color = color.withOpacity(0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth / 2;
    canvas.drawPath(energyPath, energyPaint);
    
    final bodyPaint = Paint()
      ..color = color.withOpacity(0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(bodyPath, bodyPaint);
    canvas.drawPath(bodyPath, paint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 拔罐图标绘制
class CuppingIconPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  
  CuppingIconPainter({
    this.color = const Color(0xFF35BB78),
    this.strokeWidth = 2.0,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制背部轮廓
    final backPath = Path()
      ..moveTo(width * 0.2, height * 0.2)
      ..lineTo(width * 0.8, height * 0.2)
      ..lineTo(width * 0.8, height * 0.8)
      ..lineTo(width * 0.2, height * 0.8)
      ..close();
    
    // 绘制拔罐杯
    final cup1Path = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.35, height * 0.35),
        width: width * 0.2,
        height: width * 0.2,
      ));
    
    final cup2Path = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.65, height * 0.35),
        width: width * 0.2,
        height: width * 0.2,
      ));
    
    final cup3Path = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.35, height * 0.65),
        width: width * 0.2,
        height: width * 0.2,
      ));
    
    final cup4Path = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.65, height * 0.65),
        width: width * 0.2,
        height: width * 0.2,
      ));
    
    // 绘制拔罐痕迹
    final markPath = Path();
    markPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.35, height * 0.35),
      width: width * 0.15,
      height: width * 0.15,
    ));
    markPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.65, height * 0.35),
      width: width * 0.15,
      height: width * 0.15,
    ));
    markPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.35, height * 0.65),
      width: width * 0.15,
      height: width * 0.15,
    ));
    markPath.addOval(Rect.fromCenter(
      center: Offset(width * 0.65, height * 0.65),
      width: width * 0.15,
      height: width * 0.15,
    ));
    
    canvas.drawPath(backPath, paint);
    canvas.drawPath(cup1Path, paint);
    canvas.drawPath(cup2Path, paint);
    canvas.drawPath(cup3Path, paint);
    canvas.drawPath(cup4Path, paint);
    
    final markPaint = Paint()
      ..color = Color(0xFFD32F2F).withOpacity(0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(markPath, markPaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 艾灸图标绘制
class MoxibustionIconPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  
  MoxibustionIconPainter({
    this.color = const Color(0xFF35BB78),
    this.strokeWidth = 2.0,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制艾条
    final moxaPath = Path()
      ..moveTo(width * 0.3, height * 0.2)
      ..lineTo(width * 0.4, height * 0.2)
      ..lineTo(width * 0.4, height * 0.8)
      ..lineTo(width * 0.3, height * 0.8)
      ..close();
    
    // 绘制燃烧中的艾条顶部
    final burningPath = Path()
      ..moveTo(width * 0.3, height * 0.2)
      ..quadraticBezierTo(width * 0.35, height * 0.15, width * 0.4, height * 0.2);
    
    // 绘制烟雾
    final smokePath = Path()
      ..moveTo(width * 0.35, height * 0.15)
      ..cubicTo(
        width * 0.3, height * 0.1,
        width * 0.4, height * 0.05,
        width * 0.35, height * 0.0
      );
    
    // 绘制身体部分
    final bodyPath = Path()
      ..addRect(Rect.fromLTWH(
        width * 0.5, height * 0.3,
        width * 0.4, height * 0.4,
      ));
    
    // 绘制热力线
    final heatPath = Path();
    for (int i = 1; i <= 3; i++) {
      final startX = width * 0.4;
      final endX = width * 0.5;
      final y = height * (0.3 + i * 0.1);
      heatPath.moveTo(startX, y);
      heatPath.lineTo(endX, y);
    }
    
    canvas.drawPath(moxaPath, paint);
    canvas.drawPath(burningPath, paint);
    
    final smokePaint = Paint()
      ..color = color.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth / 2;
    canvas.drawPath(smokePath, smokePaint);
    
    final bodyPaint = Paint()
      ..color = color.withOpacity(0.2)
      ..style = PaintingStyle.fill;
    canvas.drawPath(bodyPath, bodyPaint);
    canvas.drawPath(bodyPath, paint);
    
    final heatPaint = Paint()
      ..color = Color(0xFFFF6800)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth / 2
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(heatPath, heatPaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 木纹样绘制
class WoodPatternPainter extends CustomPainter {
  final Color color;
  final double opacity;
  
  WoodPatternPainter({
    this.color = const Color(0xFF35BB78),
    this.opacity = 0.8,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制自然的木纹生长线
    final random = math.Random(12345); // 固定随机种子以保证一致性
    
    // 主干
    final trunkPath = Path()
      ..moveTo(width * 0.5, height * 0.9)
      ..lineTo(width * 0.5, height * 0.2);
    
    // 树枝
    final branchesPath = Path();
    
    // 第一层分支
    _addBranch(branchesPath, Offset(width * 0.5, height * 0.4), 
              width * 0.25, -math.pi / 4, random);
    _addBranch(branchesPath, Offset(width * 0.5, height * 0.4), 
              width * 0.25, -math.pi * 3 / 4, random);
    
    // 第二层分支
    _addBranch(branchesPath, Offset(width * 0.5, height * 0.6), 
              width * 0.2, -math.pi / 6, random);
    _addBranch(branchesPath, Offset(width * 0.5, height * 0.6), 
              width * 0.2, -math.pi * 5 / 6, random);
    
    // 绘制叶片
    final leavesPath = Path();
    _addLeaf(leavesPath, Offset(width * 0.35, height * 0.25), width * 0.1, random);
    _addLeaf(leavesPath, Offset(width * 0.65, height * 0.25), width * 0.1, random);
    _addLeaf(leavesPath, Offset(width * 0.3, height * 0.45), width * 0.08, random);
    _addLeaf(leavesPath, Offset(width * 0.7, height * 0.45), width * 0.08, random);
    
    canvas.drawPath(trunkPath, paint);
    canvas.drawPath(branchesPath, paint);
    
    final leavesPaint = Paint()
      ..color = color.withOpacity(opacity * 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(leavesPath, leavesPaint);
    canvas.drawPath(leavesPath, paint..strokeWidth = 0.7);
  }
  
  void _addBranch(Path path, Offset start, double length, 
                 double angle, math.Random random) {
    final end = Offset(
      start.dx + length * math.cos(angle),
      start.dy + length * math.sin(angle),
    );
    
    path.moveTo(start.dx, start.dy);
    path.lineTo(end.dx, end.dy);
  }
  
  void _addLeaf(Path path, Offset center, double size, math.Random random) {
    path.addOval(Rect.fromCenter(
      center: center,
      width: size * (1 + random.nextDouble() * 0.4),
      height: size * 2 * (1 + random.nextDouble() * 0.3),
    ));
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 火纹样绘制
class FirePatternPainter extends CustomPainter {
  final Color color;
  final double opacity;
  
  FirePatternPainter({
    this.color = const Color(0xFFFF6800),
    this.opacity = 0.8,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制火焰
    final flamePath = Path();
    
    // 中央火焰
    flamePath.moveTo(width * 0.5, height * 0.9);
    flamePath.quadraticBezierTo(
      width * 0.4, height * 0.6,
      width * 0.5, height * 0.3
    );
    flamePath.quadraticBezierTo(
      width * 0.6, height * 0.6,
      width * 0.5, height * 0.9
    );
    
    // 左侧火焰
    flamePath.moveTo(width * 0.3, height * 0.9);
    flamePath.quadraticBezierTo(
      width * 0.2, height * 0.7,
      width * 0.3, height * 0.5
    );
    flamePath.quadraticBezierTo(
      width * 0.4, height * 0.7,
      width * 0.3, height * 0.9
    );
    
    // 右侧火焰
    flamePath.moveTo(width * 0.7, height * 0.9);
    flamePath.quadraticBezierTo(
      width * 0.8, height * 0.7,
      width * 0.7, height * 0.5
    );
    flamePath.quadraticBezierTo(
      width * 0.6, height * 0.7,
      width * 0.7, height * 0.9
    );
    
    // 添加内部纹理
    final texturePathOuter = Path();
    texturePathOuter.moveTo(width * 0.4, height * 0.8);
    texturePathOuter.quadraticBezierTo(
      width * 0.45, height * 0.7,
      width * 0.5, height * 0.6
    );
    texturePathOuter.quadraticBezierTo(
      width * 0.55, height * 0.7,
      width * 0.6, height * 0.8
    );
    
    final texturePathInner = Path();
    texturePathInner.moveTo(width * 0.45, height * 0.7);
    texturePathInner.quadraticBezierTo(
      width * 0.5, height * 0.6,
      width * 0.55, height * 0.7
    );
    
    final fillPaint = Paint()
      ..color = color.withOpacity(opacity * 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(flamePath, fillPaint);
    canvas.drawPath(flamePath, paint);
    
    final texturePaint = Paint()
      ..color = color.withOpacity(opacity * 0.7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;
    canvas.drawPath(texturePathOuter, texturePaint);
    canvas.drawPath(texturePathInner, texturePaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 土纹样绘制
class EarthPatternPainter extends CustomPainter {
  final Color color;
  final double opacity;
  
  EarthPatternPainter({
    this.color = const Color(0xFFFFB800),
    this.opacity = 0.8,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制土纹 - 回字纹样
    final outerRect = Path()
      ..addRect(Rect.fromLTWH(
        width * 0.1, height * 0.1,
        width * 0.8, height * 0.8,
      ));
    
    final middleRect = Path()
      ..addRect(Rect.fromLTWH(
        width * 0.25, height * 0.25,
        width * 0.5, height * 0.5,
      ));
    
    final innerRect = Path()
      ..addRect(Rect.fromLTWH(
        width * 0.4, height * 0.4,
        width * 0.2, height * 0.2,
      ));
    
    // 连接线
    final connectLinesPath = Path()
      // 上方连接线
      ..moveTo(width * 0.4, height * 0.25)
      ..lineTo(width * 0.4, height * 0.4)
      ..moveTo(width * 0.6, height * 0.25)
      ..lineTo(width * 0.6, height * 0.4)
      
      // 下方连接线
      ..moveTo(width * 0.4, height * 0.6)
      ..lineTo(width * 0.4, height * 0.75)
      ..moveTo(width * 0.6, height * 0.6)
      ..lineTo(width * 0.6, height * 0.75)
      
      // 左方连接线
      ..moveTo(width * 0.25, height * 0.4)
      ..lineTo(width * 0.4, height * 0.4)
      ..moveTo(width * 0.25, height * 0.6)
      ..lineTo(width * 0.4, height * 0.6)
      
      // 右方连接线
      ..moveTo(width * 0.6, height * 0.4)
      ..lineTo(width * 0.75, height * 0.4)
      ..moveTo(width * 0.6, height * 0.6)
      ..lineTo(width * 0.75, height * 0.6);
    
    canvas.drawPath(outerRect, paint);
    canvas.drawPath(middleRect, paint);
    canvas.drawPath(innerRect, paint);
    canvas.drawPath(connectLinesPath, paint);
    
    // 添加填充
    final fillPaint = Paint()
      ..color = color.withOpacity(opacity * 0.1)
      ..style = PaintingStyle.fill;
    canvas.drawPath(outerRect, fillPaint);
    
    final middleFillPaint = Paint()
      ..color = color.withOpacity(opacity * 0.2)
      ..style = PaintingStyle.fill;
    canvas.drawPath(middleRect, middleFillPaint);
    
    final innerFillPaint = Paint()
      ..color = color.withOpacity(opacity * 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(innerRect, innerFillPaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 金纹样绘制
class MetalPatternPainter extends CustomPainter {
  final Color color;
  final double opacity;
  
  MetalPatternPainter({
    this.color = const Color(0xFFE0E0E0),
    this.opacity = 0.8,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制云纹
    final cloudPath = Path();
    
    // 第一组云纹
    _drawCloudCurve(cloudPath, Offset(width * 0.1, height * 0.3), 
                   Offset(width * 0.9, height * 0.3), height * 0.1);
    
    // 第二组云纹
    _drawCloudCurve(cloudPath, Offset(width * 0.1, height * 0.5), 
                   Offset(width * 0.9, height * 0.5), height * 0.1);
    
    // 第三组云纹
    _drawCloudCurve(cloudPath, Offset(width * 0.1, height * 0.7), 
                   Offset(width * 0.9, height * 0.7), height * 0.1);
    
    canvas.drawPath(cloudPath, paint);
  }
  
  void _drawCloudCurve(Path path, Offset start, Offset end, double height) {
    final controlPoint1 = Offset(start.dx + (end.dx - start.dx) / 2, start.dy - height);
    final controlPoint2 = Offset(end.dx - (end.dx - start.dx) / 2, end.dy - height);
    
    path.moveTo(start.dx, start.dy);
    path.quadraticBezierTo(controlPoint1.dx, controlPoint1.dy, end.dx, end.dy);
    path.quadraticBezierTo(controlPoint2.dx, controlPoint2.dy, start.dx, start.dy);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 水纹样绘制
class WaterPatternPainter extends CustomPainter {
  final Color color;
  final double opacity;
  
  WaterPatternPainter({
    this.color = const Color(0xFF2B7CD9),
    this.opacity = 0.8,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制波浪纹
    final wavePath = Path();
    
    // 波浪参数
    final amplitude = height * 0.06; // 波浪振幅
    final frequency = 6.0; // 波浪频率
    final phaseShift1 = 0.0; // 第一层波浪相位
    final phaseShift2 = math.pi; // 第二层波浪相位
    final phaseShift3 = math.pi / 2; // 第三层波浪相位
    
    // 第一层波浪
    _drawWave(wavePath, width, height, amplitude, frequency, phaseShift1, 0.2);
    
    // 第二层波浪
    _drawWave(wavePath, width, height, amplitude * 0.7, frequency * 1.3, phaseShift2, 0.4);
    
    // 第三层波浪
    _drawWave(wavePath, width, height, amplitude * 0.5, frequency * 0.8, phaseShift3, 0.6);
    
    // 第四层波浪
    _drawWave(wavePath, width, height, amplitude * 0.3, frequency * 1.5, phaseShift1 + math.pi / 4, 0.8);
    
    canvas.drawPath(wavePath, paint);
    
    // 添加水滴
    final dropPath = Path();
    _addWaterDrop(dropPath, Offset(width * 0.3, height * 0.3), width * 0.1);
    _addWaterDrop(dropPath, Offset(width * 0.7, height * 0.5), width * 0.08);
    _addWaterDrop(dropPath, Offset(width * 0.4, height * 0.7), width * 0.06);
    
    final dropPaint = Paint()
      ..color = color.withOpacity(opacity * 0.4)
      ..style = PaintingStyle.fill;
    canvas.drawPath(dropPath, dropPaint);
    canvas.drawPath(dropPath, paint..strokeWidth = 0.8);
  }
  
  void _drawWave(Path path, double width, double height, double amplitude, 
                double frequency, double phaseShift, double verticalPosition) {
    final vertPos = height * verticalPosition;
    
    path.moveTo(0, vertPos);
    
    for (double x = 0; x <= width; x += 1) {
      final y = vertPos + amplitude * math.sin((x / width * frequency * math.pi * 2) + phaseShift);
      path.lineTo(x, y);
    }
  }
  
  void _addWaterDrop(Path path, Offset center, double size) {
    path.addPath(
      Path()
        ..moveTo(center.dx, center.dy - size * 0.6)
        ..quadraticBezierTo(
          center.dx + size * 0.6, center.dy, 
          center.dx, center.dy + size * 0.6
        )
        ..quadraticBezierTo(
          center.dx - size * 0.6, center.dy,
          center.dx, center.dy - size * 0.6
        ),
      Offset.zero
    );
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 经络纹样绘制
class MeridianPatternPainter extends CustomPainter {
  final Color color;
  final double opacity;
  
  MeridianPatternPainter({
    this.color = const Color(0xFF35BB78),
    this.opacity = 0.8,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 绘制主经络线
    final meridianPath = Path();
    
    // 中脉
    meridianPath.moveTo(width * 0.5, height * 0.1);
    meridianPath.lineTo(width * 0.5, height * 0.9);
    
    // 左侧经络
    _addMeridianLine(meridianPath, 
      Offset(width * 0.5, height * 0.2), 
      Offset(width * 0.2, height * 0.3)
    );
    
    _addMeridianLine(meridianPath, 
      Offset(width * 0.5, height * 0.4), 
      Offset(width * 0.2, height * 0.5)
    );
    
    _addMeridianLine(meridianPath, 
      Offset(width * 0.5, height * 0.6), 
      Offset(width * 0.2, height * 0.7)
    );
    
    // 右侧经络
    _addMeridianLine(meridianPath, 
      Offset(width * 0.5, height * 0.3), 
      Offset(width * 0.8, height * 0.2)
    );
    
    _addMeridianLine(meridianPath, 
      Offset(width * 0.5, height * 0.5), 
      Offset(width * 0.8, height * 0.4)
    );
    
    _addMeridianLine(meridianPath, 
      Offset(width * 0.5, height * 0.7), 
      Offset(width * 0.8, height * 0.6)
    );
    
    // 绘制穴位点
    final acupointPath = Path();
    
    // 中脉穴位
    _addAcupoint(acupointPath, Offset(width * 0.5, height * 0.2), width * 0.04);
    _addAcupoint(acupointPath, Offset(width * 0.5, height * 0.4), width * 0.04);
    _addAcupoint(acupointPath, Offset(width * 0.5, height * 0.6), width * 0.04);
    _addAcupoint(acupointPath, Offset(width * 0.5, height * 0.8), width * 0.04);
    
    // 侧脉穴位
    _addAcupoint(acupointPath, Offset(width * 0.2, height * 0.3), width * 0.035);
    _addAcupoint(acupointPath, Offset(width * 0.2, height * 0.5), width * 0.035);
    _addAcupoint(acupointPath, Offset(width * 0.2, height * 0.7), width * 0.035);
    
    _addAcupoint(acupointPath, Offset(width * 0.8, height * 0.2), width * 0.035);
    _addAcupoint(acupointPath, Offset(width * 0.8, height * 0.4), width * 0.035);
    _addAcupoint(acupointPath, Offset(width * 0.8, height * 0.6), width * 0.035);
    
    canvas.drawPath(meridianPath, paint);
    
    final acupointPaint = Paint()
      ..color = color.withOpacity(opacity * 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(acupointPath, acupointPaint);
    canvas.drawPath(acupointPath, paint..strokeWidth = 0.8);
  }
  
  void _addMeridianLine(Path path, Offset start, Offset end) {
    path.moveTo(start.dx, start.dy);
    
    final controlPoint = Offset(
      (start.dx + end.dx) / 2,
      (start.dy + end.dy) / 2 + (end.dy - start.dy) * 0.2
    );
    
    path.quadraticBezierTo(
      controlPoint.dx, controlPoint.dy,
      end.dx, end.dy
    );
  }
  
  void _addAcupoint(Path path, Offset center, double radius) {
    path.addOval(Rect.fromCenter(
      center: center,
      width: radius * 2,
      height: radius * 2,
    ));
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 药草纹样绘制
class HerbalPatternPainter extends CustomPainter {
  final Color color;
  final double opacity;
  
  HerbalPatternPainter({
    this.color = const Color(0xFF35BB78),
    this.opacity = 0.8,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    final random = math.Random(12345); // 固定随机种子
    
    // 绘制药草
    // 主要药草叶片
    final herb1 = Path();
    _drawHerbalLeaf(herb1, Offset(width * 0.3, height * 0.7), 
                   width * 0.15, height * 0.3, -math.pi / 6, random);
    
    final herb2 = Path();
    _drawHerbalLeaf(herb2, Offset(width * 0.5, height * 0.8), 
                   width * 0.2, height * 0.4, -math.pi / 2, random);
    
    final herb3 = Path();
    _drawHerbalLeaf(herb3, Offset(width * 0.7, height * 0.7), 
                   width * 0.15, height * 0.3, -math.pi * 5 / 6, random);
    
    // 绘制小花
    final flowersPath = Path();
    _drawFlower(flowersPath, Offset(width * 0.3, height * 0.3), width * 0.08, random);
    _drawFlower(flowersPath, Offset(width * 0.6, height * 0.4), width * 0.06, random);
    _drawFlower(flowersPath, Offset(width * 0.75, height * 0.25), width * 0.07, random);
    
    // 叶片填充
    final herbFillPaint = Paint()
      ..color = color.withOpacity(opacity * 0.2)
      ..style = PaintingStyle.fill;
      
    canvas.drawPath(herb1, herbFillPaint);
    canvas.drawPath(herb2, herbFillPaint);
    canvas.drawPath(herb3, herbFillPaint);
    
    // 叶片轮廓
    canvas.drawPath(herb1, paint);
    canvas.drawPath(herb2, paint);
    canvas.drawPath(herb3, paint);
    
    // 花朵
    final flowerFillPaint = Paint()
      ..color = Color(0xFFFF6800).withOpacity(opacity * 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(flowersPath, flowerFillPaint);
    
    final flowerStrokePaint = Paint()
      ..color = Color(0xFFFF6800).withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;
    canvas.drawPath(flowersPath, flowerStrokePaint);
  }
  
  void _drawHerbalLeaf(Path path, Offset base, double width, 
                      double height, double angle, math.Random random) {
    // 计算旋转后的方向向量
    final dirX = math.sin(angle);
    final dirY = -math.cos(angle);
    
    // 茎
    final stemEnd = Offset(
      base.dx + dirX * height,
      base.dy + dirY * height
    );
    
    path.moveTo(base.dx, base.dy);
    path.lineTo(stemEnd.dx, stemEnd.dy);
    
    // 创建叶片轮廓
    final leafVariation = random.nextDouble() * 0.3 + 0.85; // 叶片变化因子
    
    // 左侧叶片
    for (int i = 1; i <= 4; i++) {
      final t = i / 5.0; // 叶片位置比例
      final leafSize = width * leafVariation * math.sin(t * math.pi); // 叶片大小随位置变化
      
      final stemPoint = Offset(
        base.dx + dirX * height * t,
        base.dy + dirY * height * t
      );
      
      // 左侧叶片控制点
      final leftAngle = angle + math.pi/2;
      final leftDir = Offset(math.sin(leftAngle), -math.cos(leftAngle));
      
      final leftEnd = Offset(
        stemPoint.dx + leftDir.dx * leafSize,
        stemPoint.dy + leftDir.dy * leafSize
      );
      
      final leftControl = Offset(
        (stemPoint.dx + leftEnd.dx) / 2 + leftDir.dx * leafSize * 0.3,
        (stemPoint.dy + leftEnd.dy) / 2 + leftDir.dy * leafSize * 0.3
      );
      
      path.moveTo(stemPoint.dx, stemPoint.dy);
      path.quadraticBezierTo(leftControl.dx, leftControl.dy, leftEnd.dx, leftEnd.dy);
      path.quadraticBezierTo(
        (stemPoint.dx + leftEnd.dx) / 2 - leftDir.dx * leafSize * 0.1,
        (stemPoint.dy + leftEnd.dy) / 2 - leftDir.dy * leafSize * 0.1,
        stemPoint.dx, stemPoint.dy
      );
      
      // 右侧叶片
      if (i % 2 == 0) { // 只在偶数位置添加对侧叶片
        final rightAngle = angle - math.pi/2;
        final rightDir = Offset(math.sin(rightAngle), -math.cos(rightAngle));
        
        final rightEnd = Offset(
          stemPoint.dx + rightDir.dx * leafSize * 0.8,
          stemPoint.dy + rightDir.dy * leafSize * 0.8
        );
        
        final rightControl = Offset(
          (stemPoint.dx + rightEnd.dx) / 2 + rightDir.dx * leafSize * 0.3,
          (stemPoint.dy + rightEnd.dy) / 2 + rightDir.dy * leafSize * 0.3
        );
        
        path.moveTo(stemPoint.dx, stemPoint.dy);
        path.quadraticBezierTo(rightControl.dx, rightControl.dy, rightEnd.dx, rightEnd.dy);
        path.quadraticBezierTo(
          (stemPoint.dx + rightEnd.dx) / 2 - rightDir.dx * leafSize * 0.1,
          (stemPoint.dy + rightEnd.dy) / 2 - rightDir.dy * leafSize * 0.1,
          stemPoint.dx, stemPoint.dy
        );
      }
    }
  }
  
  void _drawFlower(Path path, Offset center, double radius, math.Random random) {
    final petalCount = 5; // 花瓣数量
    
    for (int i = 0; i < petalCount; i++) {
      final angle = i * (2 * math.pi / petalCount);
      final petalLength = radius * (0.8 + random.nextDouble() * 0.4);
      
      final petalEnd = Offset(
        center.dx + math.cos(angle) * petalLength,
        center.dy + math.sin(angle) * petalLength
      );
      
      final controlAngle1 = angle + math.pi / 8;
      final controlAngle2 = angle - math.pi / 8;
      
      final control1 = Offset(
        center.dx + math.cos(controlAngle1) * petalLength * 0.8,
        center.dy + math.sin(controlAngle1) * petalLength * 0.8
      );
      
      final control2 = Offset(
        center.dx + math.cos(controlAngle2) * petalLength * 0.8,
        center.dy + math.sin(controlAngle2) * petalLength * 0.8
      );
      
      path.moveTo(center.dx, center.dy);
      path.cubicTo(
        control1.dx, control1.dy,
        control2.dx, control2.dy,
        petalEnd.dx, petalEnd.dy
      );
      path.cubicTo(
        control2.dx, control2.dy,
        control1.dx, control1.dy,
        center.dx, center.dy
      );
    }
    
    // 添加花芯
    path.addOval(Rect.fromCenter(
      center: center,
      width: radius * 0.4,
      height: radius * 0.4
    ));
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 太极纹样绘制
class TaijiPatternPainter extends CustomPainter {
  final Color color;
  final double opacity;
  
  TaijiPatternPainter({
    this.color = const Color(0xFF35BB78),
    this.opacity = 0.8,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    
    final width = size.width;
    final height = size.height;
    
    // 外圆
    final outerCircle = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width / 2, height / 2),
        width: width * 0.8,
        height: height * 0.8,
      ));
    
    // 太极图形
    final taijiPath = Path();
    
    // 阴阳分界线
    taijiPath.moveTo(width * 0.1, height / 2);
    taijiPath.cubicTo(
      width * 0.1, height * 0.3,
      width * 0.4, height * 0.1,
      width / 2, height * 0.1
    );
    taijiPath.cubicTo(
      width * 0.6, height * 0.1,
      width * 0.9, height * 0.3,
      width * 0.9, height / 2
    );
    taijiPath.cubicTo(
      width * 0.9, height * 0.7,
      width * 0.6, height * 0.9,
      width / 2, height * 0.9
    );
    taijiPath.cubicTo(
      width * 0.4, height * 0.9,
      width * 0.1, height * 0.7,
      width * 0.1, height / 2
    );
    
    // 内部两个小圆
    final yinYangCircles = Path();
    
    // 阳中阴
    yinYangCircles.addOval(Rect.fromCenter(
      center: Offset(width * 0.3, height / 2),
      width: width * 0.16,
      height: height * 0.16,
    ));
    
    // 阴中阳
    yinYangCircles.addOval(Rect.fromCenter(
      center: Offset(width * 0.7, height / 2),
      width: width * 0.16,
      height: height * 0.16,
    ));
    
    // 绘制八卦符号
    final baguaPath = Path();
    
    // 上方乾卦 ☰
    _drawBaguaSymbol(baguaPath, Offset(width / 2, height * 0.15), width * 0.1, true, true, true);
    
    // 下方坤卦 ☷
    _drawBaguaSymbol(baguaPath, Offset(width / 2, height * 0.85), width * 0.1, false, false, false);
    
    // 左侧坎卦 ☵
    _drawBaguaSymbol(baguaPath, Offset(width * 0.15, height / 2), width * 0.1, false, true, false);
    
    // 右侧离卦 ☲
    _drawBaguaSymbol(baguaPath, Offset(width * 0.85, height / 2), width * 0.1, true, false, true);
    
    // 绘制
    canvas.drawPath(outerCircle, paint);
    canvas.drawPath(taijiPath, paint);
    
    final circleFillPaint = Paint()
      ..color = color.withOpacity(opacity * 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawPath(yinYangCircles, circleFillPaint);
    canvas.drawPath(yinYangCircles, paint);
    
    final baguaPaint = Paint()
      ..color = color.withOpacity(opacity * 0.7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawPath(baguaPath, baguaPaint);
  }
  
  void _drawBaguaSymbol(Path path, Offset center, double size, 
                       bool top, bool middle, bool bottom) {
    final lineLength = size;
    final lineSpacing = size / 3;
    
    // 上爻
    _drawYao(path, Offset(
      center.dx,
      center.dy - lineSpacing
    ), lineLength, top);
    
    // 中爻
    _drawYao(path, Offset(
      center.dx,
      center.dy
    ), lineLength, middle);
    
    // 下爻
    _drawYao(path, Offset(
      center.dx,
      center.dy + lineSpacing
    ), lineLength, bottom);
  }
  
  void _drawYao(Path path, Offset center, double length, bool isYang) {
    final halfLength = length / 2;
    
    if (isYang) {
      // 阳爻 —— 实线
      path.moveTo(center.dx - halfLength, center.dy);
      path.lineTo(center.dx + halfLength, center.dy);
    } else {
      // 阴爻 -- 两段虚线
      path.moveTo(center.dx - halfLength, center.dy);
      path.lineTo(center.dx - halfLength * 0.3, center.dy);
      
      path.moveTo(center.dx + halfLength * 0.3, center.dy);
      path.lineTo(center.dx + halfLength, center.dy);
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 立春图标绘制
class BeginningOfSpringPainter extends CustomPainter {
  final bool animated;
  
  BeginningOfSpringPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制土地
    final groundPaint = Paint()
      ..color = const Color(0xFF8B6038)
      ..style = PaintingStyle.fill;
    
    final groundPath = Path()
      ..moveTo(0, height * 0.7)
      ..lineTo(width, height * 0.7)
      ..lineTo(width, height)
      ..lineTo(0, height)
      ..close();
    
    canvas.drawPath(groundPath, groundPaint);
    
    // 绘制嫩芽
    final sproutPaint = Paint()
      ..color = const Color(0xFF35BB78)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;
    
    final sproutPath = Path()
      ..moveTo(width * 0.5, height * 0.7)
      ..quadraticBezierTo(
        width * 0.4, height * 0.5,
        width * 0.5, height * 0.3
      );
    
    final leafPath = Path()
      ..moveTo(width * 0.5, height * 0.5)
      ..quadraticBezierTo(
        width * 0.6, height * 0.45,
        width * 0.65, height * 0.5
      )
      ..quadraticBezierTo(
        width * 0.6, height * 0.55,
        width * 0.5, height * 0.5
      );
    
    canvas.drawPath(sproutPath, sproutPaint);
    
    final leafFillPaint = Paint()
      ..color = const Color(0xFF35BB78)
      ..style = PaintingStyle.fill;
    canvas.drawPath(leafPath, leafFillPaint);
    canvas.drawPath(leafPath, sproutPaint);
    
    // 绘制阳光
    final sunPaint = Paint()
      ..color = const Color(0xFFFFD700)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(width * 0.8, height * 0.2),
      width * 0.1,
      sunPaint
    );
    
    // 绘制阳光射线
    final rayPaint = Paint()
      ..color = const Color(0xFFFFD700)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    
    for (int i = 0; i < 8; i++) {
      final angle = i * math.pi / 4;
      final rayLength = width * 0.15;
      
      final start = Offset(
        width * 0.8 + math.cos(angle) * width * 0.12,
        height * 0.2 + math.sin(angle) * width * 0.12
      );
      
      final end = Offset(
        width * 0.8 + math.cos(angle) * (width * 0.12 + rayLength),
        height * 0.2 + math.sin(angle) * (width * 0.12 + rayLength)
      );
      
      canvas.drawLine(start, end, rayPaint);
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 雨水图标绘制
class RainWaterPainter extends CustomPainter {
  final bool animated;
  
  RainWaterPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制云朵
    final cloudPaint = Paint()
      ..color = const Color(0xFF999999)
      ..style = PaintingStyle.fill;
    
    final cloudPath = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.4, height * 0.3),
        width: width * 0.3,
        height: height * 0.25,
      ))
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.6, height * 0.25),
        width: width * 0.35,
        height: height * 0.2,
      ))
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.7, height * 0.35),
        width: width * 0.25,
        height: height * 0.25,
      ));
    
    canvas.drawPath(cloudPath, cloudPaint);
    
    // 绘制雨滴
    final rainPaint = Paint()
      ..color = const Color(0xFF4FC3F7)
      ..style = PaintingStyle.fill;
    
    final raindropPositions = [
      Offset(width * 0.3, height * 0.5),
      Offset(width * 0.45, height * 0.6),
      Offset(width * 0.6, height * 0.5),
      Offset(width * 0.75, height * 0.6),
    ];
    
    for (final position in raindropPositions) {
      final raindropPath = Path()
        ..moveTo(position.dx, position.dy)
        ..quadraticBezierTo(
          position.dx - width * 0.04, position.dy + height * 0.1,
          position.dx, position.dy + height * 0.2
        )
        ..quadraticBezierTo(
          position.dx + width * 0.04, position.dy + height * 0.1,
          position.dx, position.dy
        );
      
      canvas.drawPath(raindropPath, rainPaint);
    }
    
    // 绘制地面和小草
    final groundPaint = Paint()
      ..color = const Color(0xFF8B6038)
      ..style = PaintingStyle.fill;
    
    final groundPath = Path()
      ..moveTo(0, height * 0.8)
      ..lineTo(width, height * 0.8)
      ..lineTo(width, height)
      ..lineTo(0, height)
      ..close();
    
    canvas.drawPath(groundPath, groundPaint);
    
    // 绘制草
    final grassPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    
    final grassPositions = [
      width * 0.2, width * 0.4, width * 0.6, width * 0.8
    ];
    
    for (final x in grassPositions) {
      canvas.drawLine(
        Offset(x, height * 0.8),
        Offset(x - width * 0.05, height * 0.7),
        grassPaint
      );
      
      canvas.drawLine(
        Offset(x, height * 0.8),
        Offset(x + width * 0.05, height * 0.7),
        grassPaint
      );
      
      canvas.drawLine(
        Offset(x, height * 0.8),
        Offset(x, height * 0.65),
        grassPaint
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 惊蛰图标绘制
class InsectsAwakeningPainter extends CustomPainter {
  final bool animated;
  
  InsectsAwakeningPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制地面
    final groundPaint = Paint()
      ..color = const Color(0xFF8B6038)
      ..style = PaintingStyle.fill;
    
    final groundPath = Path()
      ..moveTo(0, height * 0.8)
      ..lineTo(width, height * 0.8)
      ..lineTo(width, height)
      ..lineTo(0, height)
      ..close();
    
    canvas.drawPath(groundPath, groundPaint);
    
    // 绘制雷电
    final lightningPaint = Paint()
      ..color = const Color(0xFFFFEB3B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    
    final lightningPath = Path()
      ..moveTo(width * 0.2, height * 0.1)
      ..lineTo(width * 0.3, height * 0.3)
      ..lineTo(width * 0.2, height * 0.4)
      ..lineTo(width * 0.4, height * 0.6);
    
    canvas.drawPath(lightningPath, lightningPaint);
    
    // 绘制云朵
    final cloudPaint = Paint()
      ..color = const Color(0xFF666666)
      ..style = PaintingStyle.fill;
    
    final cloudPath = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.3, height * 0.2),
        width: width * 0.25,
        height: height * 0.18,
      ))
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.15, height * 0.25),
        width: width * 0.2,
        height: height * 0.15,
      ));
    
    canvas.drawPath(cloudPath, cloudPaint);
    
    // 绘制昆虫
    final insectPaint = Paint()
      ..color = const Color(0xFF795548)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    
    // 第一只昆虫
    _drawInsect(canvas, insectPaint, Offset(width * 0.3, height * 0.7), width * 0.15);
    
    // 第二只昆虫
    _drawInsect(canvas, insectPaint, Offset(width * 0.7, height * 0.6), width * 0.12);
    
    // 第三只昆虫
    final thirdInsectPaint = Paint()
      ..color = const Color(0xFF795548)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(width * 0.5, height * 0.75),
      width * 0.03,
      thirdInsectPaint
    );
    
    canvas.drawCircle(
      Offset(width * 0.6, height * 0.72),
      width * 0.04,
      thirdInsectPaint
    );
    
    canvas.drawLine(
      Offset(width * 0.5, height * 0.75),
      Offset(width * 0.6, height * 0.72),
      insectPaint
    );
    
    // 绘制多条腿
    for (int i = 0; i < 6; i++) {
      final angle = math.pi / 6 + i * math.pi / 3;
      final legLength = width * 0.04;
      
      canvas.drawLine(
        Offset(width * 0.6, height * 0.72),
        Offset(
          width * 0.6 + math.cos(angle) * legLength,
          height * 0.72 + math.sin(angle) * legLength
        ),
        insectPaint
      );
    }
  }
  
  void _drawInsect(Canvas canvas, Paint paint, Offset position, double size) {
    // 绘制身体
    final bodyPath = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(position.dx - size * 0.25, position.dy),
        width: size * 0.5,
        height: size * 0.3,
      ))
      ..addOval(Rect.fromCenter(
        center: Offset(position.dx + size * 0.25, position.dy),
        width: size * 0.5,
        height: size * 0.3,
      ));
    
    canvas.drawPath(bodyPath, paint);
    
    // 绘制触角
    canvas.drawLine(
      Offset(position.dx - size * 0.4, position.dy),
      Offset(position.dx - size * 0.6, position.dy - size * 0.2),
      paint
    );
    
    canvas.drawLine(
      Offset(position.dx - size * 0.4, position.dy),
      Offset(position.dx - size * 0.6, position.dy - size * 0.2),
      paint
    );
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 春分图标绘制
class SpringEquinoxPainter extends CustomPainter {
  final bool animated;
  
  SpringEquinoxPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制背景，一半白天一半黑夜
    final dayPaint = Paint()
      ..color = const Color(0xFF87CEEB)
      ..style = PaintingStyle.fill;
    
    final nightPaint = Paint()
      ..color = const Color(0xFF1A237E)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width / 2, height),
      nightPaint
    );
    
    canvas.drawRect(
      Rect.fromLTWH(width / 2, 0, width / 2, height),
      dayPaint
    );
    
    // 绘制中线
    final centerLinePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0
      ..strokeCap = StrokeCap.round;
    
    canvas.drawLine(
      Offset(width / 2, 0),
      Offset(width / 2, height),
      centerLinePaint
    );
    
    // 绘制太阳和月亮
    final sunPaint = Paint()
      ..color = const Color(0xFFFFEB3B)
      ..style = PaintingStyle.fill;
    
    final moonPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    
    // 太阳
    canvas.drawCircle(
      Offset(width * 0.75, height * 0.3),
      width * 0.1,
      sunPaint
    );
    
    // 月亮
    final moonPath = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.25, height * 0.3),
        width: width * 0.18,
        height: width * 0.18,
      ));
    
    final moonCutoutPath = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(width * 0.3, height * 0.25),
        width: width * 0.15,
        height: width * 0.15,
      ));
    
    canvas.drawPath(
      Path.combine(PathOperation.difference, moonPath, moonCutoutPath),
      moonPaint
    );
    
    // 绘制星星
    final starPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    
    _drawStar(canvas, starPaint, Offset(width * 0.1, height * 0.2), width * 0.03);
    _drawStar(canvas, starPaint, Offset(width * 0.15, height * 0.5), width * 0.025);
    _drawStar(canvas, starPaint, Offset(width * 0.35, height * 0.45), width * 0.02);
    
    // 绘制地面
    final groundPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.fill;
    
    final groundPath = Path()
      ..moveTo(0, height * 0.7)
      ..lineTo(width, height * 0.7)
      ..lineTo(width, height)
      ..lineTo(0, height)
      ..close();
    
    canvas.drawPath(groundPath, groundPaint);
    
    // 绘制植物
    final plantPaint = Paint()
      ..color = const Color(0xFF2E7D32)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    
    // 左侧植物（夜晚侧）
    final leftPlantPath = Path()
      ..moveTo(width * 0.25, height * 0.7)
      ..lineTo(width * 0.25, height * 0.5)
      ..moveTo(width * 0.25, height * 0.6)
      ..lineTo(width * 0.15, height * 0.55)
      ..moveTo(width * 0.25, height * 0.55)
      ..lineTo(width * 0.35, height * 0.5);
    
    // 右侧植物（白天侧）
    final rightPlantPath = Path()
      ..moveTo(width * 0.75, height * 0.7)
      ..lineTo(width * 0.75, height * 0.45)
      ..moveTo(width * 0.75, height * 0.65)
      ..lineTo(width * 0.65, height * 0.6)
      ..moveTo(width * 0.75, height * 0.55)
      ..lineTo(width * 0.85, height * 0.5)
      ..moveTo(width * 0.75, height * 0.5)
      ..lineTo(width * 0.7, height * 0.4);
    
    canvas.drawPath(leftPlantPath, plantPaint);
    canvas.drawPath(rightPlantPath, plantPaint);
  }
  
  void _drawStar(Canvas canvas, Paint paint, Offset center, double radius) {
    final path = Path();
    final outerRadius = radius;
    final innerRadius = radius * 0.4;
    const numPoints = 5;
    
    for (int i = 0; i < numPoints * 2; i++) {
      final angle = math.pi / 2 + i * math.pi / numPoints;
      final currentRadius = i % 2 == 0 ? outerRadius : innerRadius;
      final x = center.dx + currentRadius * math.cos(angle);
      final y = center.dy + currentRadius * math.sin(angle);
      
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    
    path.close();
    canvas.drawPath(path, paint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 清明图标绘制
class PurebrightnessPainter extends CustomPainter {
  final bool animated;
  
  PurebrightnessPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制背景
    final skyPaint = Paint()
      ..color = const Color(0xFFB3E5FC)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, height * 0.7),
      skyPaint
    );
    
    // 绘制雨滴
    final rainPaint = Paint()
      ..color = const Color(0xFF1976D2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    for (int i = 0; i < 10; i++) {
      final x = width * (0.1 + i * 0.08);
      final startY = height * (0.1 + (i % 3) * 0.1);
      final endY = startY + height * 0.15;
      
      canvas.drawLine(
        Offset(x, startY),
        Offset(x + width * 0.03, endY),
        rainPaint
      );
    }
    
    // 绘制地面
    final groundPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, height * 0.7, width, height * 0.3),
      groundPaint
    );
    
    // 绘制油菜花
    _drawRapeseedFlower(canvas, Offset(width * 0.25, height * 0.75), width * 0.1);
    _drawRapeseedFlower(canvas, Offset(width * 0.5, height * 0.7), width * 0.12);
    _drawRapeseedFlower(canvas, Offset(width * 0.75, height * 0.77), width * 0.09);
    
    // 绘制坟墓（清明节扫墓）
    final tombPaint = Paint()
      ..color = const Color(0xFF9E9E9E)
      ..style = PaintingStyle.fill;
    
    final tombPath = Path()
      ..moveTo(width * 0.4, height * 0.88)
      ..lineTo(width * 0.6, height * 0.88)
      ..lineTo(width * 0.58, height * 0.7)
      ..lineTo(width * 0.42, height * 0.7)
      ..close();
    
    canvas.drawPath(tombPath, tombPaint);
    
    // 扫墓的香炉
    final incensePaint = Paint()
      ..color = const Color(0xFF5D4037)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(width * 0.47, height * 0.79, width * 0.06, height * 0.03),
      incensePaint
    );
    
    // 香火
    final incenseSmokePaint = Paint()
      ..color = const Color(0xFFBDBDBD)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    final smokePath = Path()
      ..moveTo(width * 0.5, height * 0.79)
      ..cubicTo(
        width * 0.48, height * 0.75,
        width * 0.52, height * 0.72,
        width * 0.5, height * 0.68
      );
    
    canvas.drawPath(smokePath, incenseSmokePaint);
  }
  
  void _drawRapeseedFlower(Canvas canvas, Offset position, double size) {
    // 绘制茎
    final stemPaint = Paint()
      ..color = const Color(0xFF2E7D32)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    
    canvas.drawLine(
      Offset(position.dx, position.dy),
      Offset(position.dx, position.dy - size * 1.2),
      stemPaint
    );
    
    // 绘制花瓣
    final petalPaint = Paint()
      ..color = const Color(0xFFFFEB3B)
      ..style = PaintingStyle.fill;
    
    for (int i = 0; i < 5; i++) {
      final angle = i * math.pi * 2 / 5;
      final petalPath = Path();
      
      final centerX = position.dx + math.cos(angle) * size * 0.3;
      final centerY = position.dy - size - math.sin(angle) * size * 0.3;
      
      petalPath.addOval(Rect.fromCenter(
        center: Offset(centerX, centerY),
        width: size * 0.4,
        height: size * 0.4,
      ));
      
      canvas.drawPath(petalPath, petalPaint);
    }
    
    // 绘制花心
    final centerPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(position.dx, position.dy - size),
      size * 0.15,
      centerPaint
    );
    
    // 绘制叶子
    final leafPaint = Paint()
      ..color = const Color(0xFF2E7D32)
      ..style = PaintingStyle.fill;
    
    final leafPath = Path()
      ..moveTo(position.dx, position.dy - size * 0.5)
      ..quadraticBezierTo(
        position.dx - size * 0.4, position.dy - size * 0.6,
        position.dx - size * 0.3, position.dy - size * 0.4
      )
      ..quadraticBezierTo(
        position.dx - size * 0.1, position.dy - size * 0.5,
        position.dx, position.dy - size * 0.5
      );
    
    canvas.drawPath(leafPath, leafPaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 谷雨图标绘制
class GrainRainPainter extends CustomPainter {
  final bool animated;
  
  GrainRainPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制天空
    final skyPaint = Paint()
      ..color = const Color(0xFF42A5F5)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, height * 0.6),
      skyPaint
    );
    
    // 绘制田地
    final fieldPaint = Paint()
      ..color = const Color(0xFF8D6E63)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, height * 0.6, width, height * 0.4),
      fieldPaint
    );
    
    // 绘制田地纹理线
    final linesPaint = Paint()
      ..color = const Color(0xFF5D4037)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    for (int i = 0; i < 4; i++) {
      final y = height * (0.65 + i * 0.08);
      
      canvas.drawLine(
        Offset(0, y),
        Offset(width, y),
        linesPaint
      );
    }
    
    // 绘制麦穗
    _drawWheatSpike(canvas, Offset(width * 0.2, height * 0.5), height * 0.25);
    _drawWheatSpike(canvas, Offset(width * 0.5, height * 0.45), height * 0.3);
    _drawWheatSpike(canvas, Offset(width * 0.8, height * 0.55), height * 0.22);
    
    // 绘制雨滴
    final rainPaint = Paint()
      ..color = const Color(0xFF1565C0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    
    for (int i = 0; i < 15; i++) {
      final startX = width * (0.1 + (i % 7) * 0.12);
      final startY = height * (0.1 + (i % 4) * 0.1);
      
      canvas.drawLine(
        Offset(startX, startY),
        Offset(startX + width * 0.03, startY + height * 0.08),
        rainPaint
      );
    }
  }
  
  void _drawWheatSpike(Canvas canvas, Offset base, double height) {
    // 麦秆
    final stemPaint = Paint()
      ..color = const Color(0xFFFFD54F)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    
    canvas.drawLine(
      Offset(base.dx, base.dy),
      Offset(base.dx, base.dy - height),
      stemPaint
    );
    
    // 麦穗
    final spikePaint = Paint()
      ..color = const Color(0xFFFFD54F)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    final grainPaint = Paint()
      ..color = const Color(0xFFFFD54F)
      ..style = PaintingStyle.fill;
    
    for (int i = 0; i < 8; i++) {
      final side = i % 2 == 0 ? 1 : -1;
      final y = base.dy - height * 0.3 - i * height * 0.08;
      
      // 绘制麦粒
      final grainPath = Path()
        ..addOval(Rect.fromCenter(
          center: Offset(base.dx + side * height * 0.06, y),
          width: height * 0.06,
          height: height * 0.1,
        ));
      
      canvas.drawPath(grainPath, grainPaint);
      
      // 绘制麦芒
      canvas.drawLine(
        Offset(base.dx + side * height * 0.08, y - height * 0.04),
        Offset(base.dx + side * height * 0.15, y - height * 0.09),
        spikePaint
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 立夏图标绘制
class BeginningOfSummerPainter extends CustomPainter {
  final bool animated;
  
  BeginningOfSummerPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制天空
    final skyPaint = Paint()
      ..color = const Color(0xFF29B6F6)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, height * 0.7),
      skyPaint
    );
    
    // 绘制地面
    final groundPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, height * 0.7, width, height * 0.3),
      groundPaint
    );
    
    // 绘制太阳
    final sunPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(width * 0.8, height * 0.2),
      width * 0.15,
      sunPaint
    );
    
    // 绘制太阳光芒
    final rayPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    
    for (int i = 0; i < 12; i++) {
      final angle = i * math.pi / 6;
      final innerRadius = width * 0.17;
      final outerRadius = width * 0.25;
      
      final startX = width * 0.8 + innerRadius * math.cos(angle);
      final startY = height * 0.2 + innerRadius * math.sin(angle);
      
      final endX = width * 0.8 + outerRadius * math.cos(angle);
      final endY = height * 0.2 + outerRadius * math.sin(angle);
      
      canvas.drawLine(
        Offset(startX, startY),
        Offset(endX, endY),
        rayPaint
      );
    }
    
    // 绘制盛开的花朵
    _drawFlower(canvas, Offset(width * 0.3, height * 0.65), width * 0.12, Color(0xFFE91E63));
    _drawFlower(canvas, Offset(width * 0.7, height * 0.8), width * 0.1, Color(0xFF9C27B0));
    
    // 绘制蝴蝶
    _drawButterfly(canvas, Offset(width * 0.5, height * 0.4), width * 0.1);
  }
  
  void _drawFlower(Canvas canvas, Offset center, double size, Color color) {
    final petalPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    
    final centerPaint = Paint()
      ..color = const Color(0xFFFFEB3B)
      ..style = PaintingStyle.fill;
    
    // 绘制花瓣
    for (int i = 0; i < 5; i++) {
      final angle = i * math.pi * 2 / 5;
      
      final petalPath = Path()
        ..moveTo(center.dx, center.dy)
        ..quadraticBezierTo(
          center.dx + math.cos(angle + 0.3) * size * 0.7,
          center.dy + math.sin(angle + 0.3) * size * 0.7,
          center.dx + math.cos(angle) * size,
          center.dy + math.sin(angle) * size
        )
        ..quadraticBezierTo(
          center.dx + math.cos(angle - 0.3) * size * 0.7,
          center.dy + math.sin(angle - 0.3) * size * 0.7,
          center.dx, center.dy
        );
      
      canvas.drawPath(petalPath, petalPaint);
    }
    
    // 绘制花心
    canvas.drawCircle(
      center,
      size * 0.25,
      centerPaint
    );
    
    // 绘制茎
    final stemPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    
    canvas.drawLine(
      Offset(center.dx, center.dy + size * 0.2),
      Offset(center.dx, center.dy + size * 1.5),
      stemPaint
    );
    
    // 绘制叶子
    final leafPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.fill;
    
    final leafPath = Path()
      ..moveTo(center.dx, center.dy + size * 0.8)
      ..quadraticBezierTo(
        center.dx - size * 0.5, center.dy + size * 0.7,
        center.dx - size * 0.3, center.dy + size * 1.1
      )
      ..quadraticBezierTo(
        center.dx - size * 0.1, center.dy + size * 0.9,
        center.dx, center.dy + size * 0.8
      );
    
    canvas.drawPath(leafPath, leafPaint);
  }
  
  void _drawButterfly(Canvas canvas, Offset center, double size) {
    final wingPaint = Paint()
      ..color = const Color(0xFFAB47BC)
      ..style = PaintingStyle.fill;
    
    final bodyPaint = Paint()
      ..color = const Color(0xFF6A1B9A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    
    // 绘制左翅膀
    final leftWingPath = Path()
      ..moveTo(center.dx, center.dy)
      ..quadraticBezierTo(
        center.dx - size * 0.5, center.dy - size * 0.3,
        center.dx - size, center.dy - size * 0.5
      )
      ..quadraticBezierTo(
        center.dx - size * 0.7, center.dy,
        center.dx - size * 0.8, center.dy + size * 0.5
      )
      ..quadraticBezierTo(
        center.dx - size * 0.3, center.dy + size * 0.2,
        center.dx, center.dy
      );
    
    // 绘制右翅膀
    final rightWingPath = Path()
      ..moveTo(center.dx, center.dy)
      ..quadraticBezierTo(
        center.dx + size * 0.5, center.dy - size * 0.3,
        center.dx + size, center.dy - size * 0.5
      )
      ..quadraticBezierTo(
        center.dx + size * 0.7, center.dy,
        center.dx + size * 0.8, center.dy + size * 0.5
      )
      ..quadraticBezierTo(
        center.dx + size * 0.3, center.dy + size * 0.2,
        center.dx, center.dy
      );
    
    // 绘制翅膀纹路
    final patternPaint = Paint()
      ..color = const Color(0xFF4A148C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    final leftPatternPath = Path()
      ..moveTo(center.dx - size * 0.3, center.dy - size * 0.1)
      ..quadraticBezierTo(
        center.dx - size * 0.6, center.dy - size * 0.2,
        center.dx - size * 0.8, center.dy - size * 0.3
      );
    
    final rightPatternPath = Path()
      ..moveTo(center.dx + size * 0.3, center.dy - size * 0.1)
      ..quadraticBezierTo(
        center.dx + size * 0.6, center.dy - size * 0.2,
        center.dx + size * 0.8, center.dy - size * 0.3
      );
    
    // 绘制身体
    final bodyPath = Path()
      ..moveTo(center.dx, center.dy - size * 0.3)
      ..lineTo(center.dx, center.dy + size * 0.5);
    
    // 绘制触角
    final antennaPath = Path()
      ..moveTo(center.dx, center.dy - size * 0.3)
      ..quadraticBezierTo(
        center.dx - size * 0.2, center.dy - size * 0.5,
        center.dx - size * 0.3, center.dy - size * 0.6
      )
      ..moveTo(center.dx, center.dy - size * 0.3)
      ..quadraticBezierTo(
        center.dx + size * 0.2, center.dy - size * 0.5,
        center.dx + size * 0.3, center.dy - size * 0.6
      );
    
    canvas.drawPath(leftWingPath, wingPaint);
    canvas.drawPath(rightWingPath, wingPaint);
    canvas.drawPath(leftPatternPath, patternPaint);
    canvas.drawPath(rightPatternPath, patternPaint);
    canvas.drawPath(bodyPath, bodyPaint);
    canvas.drawPath(antennaPath, bodyPaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 小满图标绘制
class GrainFullPainter extends CustomPainter {
  final bool animated;
  
  GrainFullPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制天空
    final skyPaint = Paint()
      ..color = const Color(0xFF29B6F6)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, height * 0.4),
      skyPaint
    );
    
    // 绘制麦田
    final fieldPaint = Paint()
      ..color = const Color(0xFFFFD54F)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, height * 0.4, width, height * 0.6),
      fieldPaint
    );
    
    // 绘制满满的麦穗
    for (int row = 0; row < 3; row++) {
      for (int col = 0; col < 5; col++) {
        final x = width * (0.1 + col * 0.2);
        final y = height * (0.5 + row * 0.15);
        
        _drawWheatSpike(canvas, Offset(x, y), height * 0.25);
      }
    }
    
    // 绘制太阳
    final sunPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(width * 0.8, height * 0.2),
      width * 0.1,
      sunPaint
    );
    
    // 绘制阳光
    final rayPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    
    for (int i = 0; i < 8; i++) {
      final angle = i * math.pi / 4;
      final startRadius = width * 0.12;
      final endRadius = width * 0.18;
      
      canvas.drawLine(
        Offset(
          width * 0.8 + startRadius * math.cos(angle),
          height * 0.2 + startRadius * math.sin(angle)
        ),
        Offset(
          width * 0.8 + endRadius * math.cos(angle),
          height * 0.2 + endRadius * math.sin(angle)
        ),
        rayPaint
      );
    }
  }
  
  void _drawWheatSpike(Canvas canvas, Offset base, double height) {
    // 麦秆
    final stemPaint = Paint()
      ..color = const Color(0xFFCD853F)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    
    canvas.drawLine(
      base,
      Offset(base.dx, base.dy - height),
      stemPaint
    );
    
    // 麦穗
    final spikePaint = Paint()
      ..color = const Color(0xFFCD853F)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    final grainPaint = Paint()
      ..color = const Color(0xFFCD853F)
      ..style = PaintingStyle.fill;
    
    for (int i = 0; i < 8; i++) {
      final side = i % 2 == 0 ? 1 : -1;
      final y = base.dy - height * 0.3 - i * height * 0.08;
      
      // 绘制麦粒
      final grainPath = Path()
        ..addOval(Rect.fromCenter(
          center: Offset(base.dx + side * height * 0.06, y),
          width: height * 0.06,
          height: height * 0.1,
        ));
      
      canvas.drawPath(grainPath, grainPaint);
      
      // 绘制麦芒
      canvas.drawLine(
        Offset(base.dx + side * height * 0.08, y - height * 0.04),
        Offset(base.dx + side * height * 0.15, y - height * 0.09),
        spikePaint
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 芒种图标绘制
class GrainInEarPainter extends CustomPainter {
  final bool animated;
  
  GrainInEarPainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制天空
    final skyPaint = Paint()
      ..color = const Color(0xFF29B6F6)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, height * 0.4),
      skyPaint
    );
    
    // 绘制田地
    final fieldPaint = Paint()
      ..color = const Color(0xFF8D6E63)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, height * 0.4, width, height * 0.6),
      fieldPaint
    );
    
    // 绘制播种的痕迹
    final seedLinePaint = Paint()
      ..color = const Color(0xFF5D4037)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    
    for (int i = 0; i < 4; i++) {
      final y = height * (0.5 + i * 0.1);
      
      canvas.drawLine(
        Offset(0, y),
        Offset(width, y),
        seedLinePaint
      );
    }
    
    // 绘制种子和新芽
    _drawSeedAndSprout(canvas, Offset(width * 0.2, height * 0.6));
    _drawSeedAndSprout(canvas, Offset(width * 0.5, height * 0.5));
    _drawSeedAndSprout(canvas, Offset(width * 0.8, height * 0.7));
    _drawSeedAndSprout(canvas, Offset(width * 0.35, height * 0.75));
    _drawSeedAndSprout(canvas, Offset(width * 0.65, height * 0.85));
    
    // 绘制农具
    _drawFarmingTool(canvas, Offset(width * 0.8, height * 0.3), width * 0.15);
    
    // 绘制太阳
    final sunPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(width * 0.2, height * 0.2),
      width * 0.08,
      sunPaint
    );
  }
  
  void _drawSeedAndSprout(Canvas canvas, Offset position) {
    // 种子
    final seedPaint = Paint()
      ..color = const Color(0xFFCD853F)
      ..style = PaintingStyle.fill;
    
    canvas.drawOval(
      Rect.fromCenter(
        center: position,
        width: 6,
        height: 8,
      ),
      seedPaint
    );
    
    // 新芽
    final sproutPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    
    canvas.drawLine(
      position,
      Offset(position.dx, position.dy - 12),
      sproutPaint
    );
    
    // 小叶子
    final leafPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.fill;
    
    final leafPath = Path()
      ..moveTo(position.dx, position.dy - 8)
      ..quadraticBezierTo(
        position.dx + 6, position.dy - 10,
        position.dx + 8, position.dy - 12
      )
      ..quadraticBezierTo(
        position.dx + 6, position.dy - 8,
        position.dx, position.dy - 8
      );
    
    canvas.drawPath(leafPath, leafPaint);
  }
  
  void _drawFarmingTool(Canvas canvas, Offset position, double size) {
    // 锄头柄
    final handlePaint = Paint()
      ..color = const Color(0xFF795548)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    
    canvas.drawLine(
      position,
      Offset(position.dx - size * 0.8, position.dy - size),
      handlePaint
    );
    
    // 锄头头部
    final headPaint = Paint()
      ..color = const Color(0xFF9E9E9E)
      ..style = PaintingStyle.fill;
    
    final headPath = Path()
      ..moveTo(position.dx - size * 0.8, position.dy - size)
      ..lineTo(position.dx - size * 0.9, position.dy - size * 1.1)
      ..lineTo(position.dx - size * 0.6, position.dy - size * 1.2)
      ..lineTo(position.dx - size * 0.5, position.dy - size * 1.1)
      ..close();
    
    canvas.drawPath(headPath, headPaint);
    canvas.drawPath(headPath, handlePaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 夏至图标绘制
class SummerSolsticePainter extends CustomPainter {
  final bool animated;
  
  SummerSolsticePainter({
    this.animated = false,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;
    
    // 绘制天空
    final skyPaint = Paint()
      ..color = const Color(0xFF29B6F6)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, height * 0.7),
      skyPaint
    );
    
    // 绘制地面
    final groundPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(0, height * 0.7, width, height * 0.3),
      groundPaint
    );
    
    // 绘制最强烈的太阳
    final sunGlowPaint = Paint()
      ..color = const Color(0xFFFFC107).withOpacity(0.3)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(width * 0.5, height * 0.3),
      width * 0.3,
      sunGlowPaint
    );
    
    final sunPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(width * 0.5, height * 0.3),
      width * 0.2,
      sunPaint
    );
    
    // 绘制太阳光芒
    final rayPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    
    for (int i = 0; i < 12; i++) {
      final angle = i * math.pi / 6;
      final innerRadius = width * 0.22;
      final outerRadius = width * 0.35;
      
      canvas.drawLine(
        Offset(
          width * 0.5 + innerRadius * math.cos(angle),
          height * 0.3 + innerRadius * math.sin(angle)
        ),
        Offset(
          width * 0.5 + outerRadius * math.cos(angle),
          height * 0.3 + outerRadius * math.sin(angle)
        ),
        rayPaint
      );
    }
    
    // 绘制热气浪
    final heatWavePaint = Paint()
      ..color = const Color(0xFFFF5722).withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    
    for (int i = 0; i < 5; i++) {
      final y = height * 0.6 - i * height * 0.05;
      final wavePath = Path();
      
      wavePath.moveTo(0, y);
      
      for (double x = 0; x <= width; x += width / 6) {
        final waveHeight = height * 0.02 * (i % 2 == 0 ? 1 : -1);
        
        if (x == 0) {
          wavePath.moveTo(x, y);
        } else {
          wavePath.quadraticBezierTo(
            x - width / 12, y + waveHeight,
            x, y
          );
        }
      }
      
      canvas.drawPath(wavePath, heatWavePaint);
    }
    
    // 绘制小树
    _drawTree(canvas, Offset(width * 0.2, height * 0.7), height * 0.25);
    _drawTree(canvas, Offset(width * 0.8, height * 0.7), height * 0.25);
  }
  
  void _drawTree(Canvas canvas, Offset base, double height) {
    // 树干
    final trunkPaint = Paint()
      ..color = const Color(0xFF795548)
      ..style = PaintingStyle.fill;
    
    canvas.drawRect(
      Rect.fromLTWH(
        base.dx - height * 0.05,
        base.dy - height * 0.3,
        height * 0.1,
        height * 0.3
      ),
      trunkPaint
    );
    
    // 树冠
    final leafPaint = Paint()
      ..color = const Color(0xFF2E7D32)
      ..style = PaintingStyle.fill;
    
    final leafPath = Path()
      ..addOval(Rect.fromCenter(
        center: Offset(base.dx, base.dy - height * 0.4),
        width: height * 0.6,
        height: height * 0.5,
      ));
    
    canvas.drawPath(leafPath, leafPaint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

/// 节气控制器
class SolarTermController extends ChangeNotifier {
  bool _isAnimating = false;
  bool get isAnimating => _isAnimating;
  
  SolarTerm _currentTerm = SolarTerm.beginningOfSpring; // 默认立春
  SolarTerm get currentTerm => _currentTerm;
  
  void toggleAnimation() {
    _isAnimating = !_isAnimating;
    notifyListeners();
  }
  
  void setTerm(SolarTerm term) {
    _currentTerm = term;
    notifyListeners();
  }
  
  // 根据日期获取节气
  void updateByDate(DateTime date) {
    // 简化的节气判断逻辑，实际应用中需要更精确的计算
    final month = date.month;
    final day = date.day;
    
    if (month == 2 && day >= 4) {
      _currentTerm = SolarTerm.beginningOfSpring;
    } else if (month == 2 && day >= 19) {
      _currentTerm = SolarTerm.rainWater;
    } else if (month == 3 && day >= 5) {
      _currentTerm = SolarTerm.awakeningOfInsects;
    } else if (month == 3 && day >= 20) {
      _currentTerm = SolarTerm.springEquinox;
    } else if (month == 4 && day >= 4) {
      _currentTerm = SolarTerm.purebrightness;
    } else if (month == 4 && day >= 20) {
      _currentTerm = SolarTerm.grainRain;
    } else if (month == 5 && day >= 5) {
      _currentTerm = SolarTerm.beginningOfSummer;
    } else if (month == 5 && day >= 21) {
      _currentTerm = SolarTerm.grainFull;
    } else if (month == 6 && day >= 5) {
      _currentTerm = SolarTerm.grainInEar;
    } else if (month == 6 && day >= 21) {
      _currentTerm = SolarTerm.summerSolstice;
    } else {
      _currentTerm = SolarTerm.beginningOfSpring; // 默认
    }
    
    notifyListeners();
  }
}

/// 节气枚举
enum SolarTerm {
  beginningOfSpring, // 立春
  rainWater, // 雨水
  awakeningOfInsects, // 惊蛰
  springEquinox, // 春分
  purebrightness, // 清明
  grainRain, // 谷雨
  beginningOfSummer, // 立夏
  grainFull, // 小满
  grainInEar, // 芒种
  summerSolstice, // 夏至
  slightHeat, // 小暑
  greatHeat, // 大暑
  beginningOfAutumn, // 立秋
  endOfHeat, // 处暑
  whiteDew, // 白露
  autumnEquinox, // 秋分
  coldDew, // 寒露
  frostDescent, // 霜降
  beginningOfWinter, // 立冬
  slightSnow, // 小雪
  greatSnow, // 大雪
  winterSolstice, // 冬至
  slightCold, // 小寒
  greatCold // 大寒
}

/// 中医图标展示组件
class _TCMIconsShowcase extends StatelessWidget {
  const _TCMIconsShowcase();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '中医基础图标',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                _buildTCMIcon(context, Icons.eco, '木', AppColors.woodColor),
                _buildTCMIcon(context, Icons.whatshot, '火', AppColors.fireColor),
                _buildTCMIcon(context, Icons.terrain, '土', AppColors.earthColor),
                _buildTCMIcon(context, Icons.trip_origin, '金', AppColors.metalColor),
                _buildTCMIcon(context, Icons.water_drop, '水', AppColors.waterColor),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              '经络与穴位图标',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                _buildTCMIcon(context, Icons.device_hub, '经络', Colors.purple),
                _buildTCMIcon(context, Icons.circle, '穴位', Colors.indigo),
                _buildTCMIcon(context, Icons.blur_circular, '气血', Colors.red[700]!),
                _buildTCMIcon(context, Icons.timeline, '脉象', Colors.blue[700]!),
                _buildTCMIcon(context, Icons.bubble_chart, '气机', Colors.teal),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              '中医诊断图标',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                _buildTCMIcon(context, Icons.remove_red_eye, '望诊', Colors.amber),
                _buildTCMIcon(context, Icons.record_voice_over, '闻诊', Colors.orange),
                _buildTCMIcon(context, Icons.question_answer, '问诊', Colors.cyan),
                _buildTCMIcon(context, Icons.touch_app, '切诊', Colors.deepPurple),
                _buildTCMIcon(context, Icons.format_align_center, '舌诊', Colors.pink),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTCMIcon(BuildContext context, IconData icon, String label, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: color.withAlpha(40),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            color: color,
            size: 32,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }
}

/// 传统纹样展示组件
class _TraditionalPatternShowcase extends StatelessWidget {
  const _TraditionalPatternShowcase();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '传统纹样',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _buildPatternItem(context, '回纹', _buildPatternBox(Colors.red[700]!, 'repeat')),
                _buildPatternItem(context, '云纹', _buildPatternBox(Colors.blue[600]!, 'wave')),
                _buildPatternItem(context, '如意纹', _buildPatternBox(Colors.green[700]!, 'curly')),
                _buildPatternItem(context, '锦纹', _buildPatternBox(Colors.purple[500]!, 'grid')),
                _buildPatternItem(context, '龙纹', _buildPatternBox(Colors.amber[800]!, 'dragon')),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              '装饰边框',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildBorderItem(context, Colors.red[700]!),
                  _buildBorderItem(context, Colors.green[700]!),
                  _buildBorderItem(context, Colors.amber[800]!),
                  _buildBorderItem(context, Colors.blue[700]!),
                  _buildBorderItem(context, Colors.purple[700]!),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPatternItem(BuildContext context, String name, Widget pattern) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        pattern,
        const SizedBox(height: 8),
        Text(
          name,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }

  Widget _buildPatternBox(Color color, String type) {
    BoxDecoration decoration;
    
    switch (type) {
      case 'repeat':
        decoration = BoxDecoration(
          color: color.withAlpha(40),
          border: Border.all(color: color, width: 2),
          borderRadius: BorderRadius.circular(4),
        );
        break;
      case 'wave':
        decoration = BoxDecoration(
          gradient: LinearGradient(
            colors: [color.withAlpha(60), color.withAlpha(120), color.withAlpha(60)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
        );
        break;
      case 'curly':
        decoration = BoxDecoration(
          color: color.withAlpha(40),
          border: Border.all(color: color, width: 1.5),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(4),
            bottomLeft: Radius.circular(4),
            bottomRight: Radius.circular(16),
          ),
        );
        break;
      case 'grid':
        decoration = BoxDecoration(
          color: color.withAlpha(30),
          border: Border.all(color: color, width: 2),
          boxShadow: [
            BoxShadow(
              color: color.withAlpha(60),
              blurRadius: 4,
              offset: Offset(2, 2),
            ),
          ],
        );
        break;
      case 'dragon':
        decoration = BoxDecoration(
          gradient: RadialGradient(
            colors: [color.withAlpha(120), color.withAlpha(40)],
            center: Alignment.center,
            radius: 0.8,
          ),
          border: Border.all(color: color, width: 2),
          borderRadius: BorderRadius.circular(8),
        );
        break;
      default:
        decoration = BoxDecoration(
          color: color.withAlpha(40),
          border: Border.all(color: color, width: 2),
        );
    }
    
    return Container(
      width: 80,
      height: 80,
      decoration: decoration,
    );
  }

  Widget _buildBorderItem(BuildContext context, Color color) {
    return Container(
      width: 180,
      height: 100,
      margin: EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        border: Border.all(color: color, width: 3),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: color.withAlpha(40),
            blurRadius: 4,
            offset: Offset(2, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          '传统边框',
          style: TextStyle(
            color: color,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

/// 节气元素展示组件
class _SolarTermsShowcase extends StatelessWidget {
  const _SolarTermsShowcase();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '二十四节气展示',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            Text(
              '春季节气',
              style: TextStyle(
                color: Colors.green[700],
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildSeason(
              context, 
              [
                _buildSolarTerm(context, '立春', Colors.green[100]!, Colors.green[700]!),
                _buildSolarTerm(context, '雨水', Colors.green[200]!, Colors.green[700]!),
                _buildSolarTerm(context, '惊蛰', Colors.green[300]!, Colors.green[700]!),
                _buildSolarTerm(context, '春分', Colors.green[400]!, Colors.green[700]!),
                _buildSolarTerm(context, '清明', Colors.green[500]!, Colors.green[700]!),
                _buildSolarTerm(context, '谷雨', Colors.green[600]!, Colors.green[700]!),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              '夏季节气',
              style: TextStyle(
                color: Colors.red[700],
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildSeason(
              context, 
              [
                _buildSolarTerm(context, '立夏', Colors.red[100]!, Colors.red[700]!),
                _buildSolarTerm(context, '小满', Colors.red[200]!, Colors.red[700]!),
                _buildSolarTerm(context, '芒种', Colors.red[300]!, Colors.red[700]!),
                _buildSolarTerm(context, '夏至', Colors.red[400]!, Colors.red[700]!),
                _buildSolarTerm(context, '小暑', Colors.red[500]!, Colors.red[700]!),
                _buildSolarTerm(context, '大暑', Colors.red[600]!, Colors.red[700]!),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              '秋季节气',
              style: TextStyle(
                color: Colors.amber[800],
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildSeason(
              context, 
              [
                _buildSolarTerm(context, '立秋', Colors.amber[100]!, Colors.amber[800]!),
                _buildSolarTerm(context, '处暑', Colors.amber[200]!, Colors.amber[800]!),
                _buildSolarTerm(context, '白露', Colors.amber[300]!, Colors.amber[800]!),
                _buildSolarTerm(context, '秋分', Colors.amber[400]!, Colors.amber[800]!),
                _buildSolarTerm(context, '寒露', Colors.amber[500]!, Colors.amber[800]!),
                _buildSolarTerm(context, '霜降', Colors.amber[600]!, Colors.amber[800]!),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              '冬季节气',
              style: TextStyle(
                color: Colors.blue[700],
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildSeason(
              context, 
              [
                _buildSolarTerm(context, '立冬', Colors.blue[100]!, Colors.blue[700]!),
                _buildSolarTerm(context, '小雪', Colors.blue[200]!, Colors.blue[700]!),
                _buildSolarTerm(context, '大雪', Colors.blue[300]!, Colors.blue[700]!),
                _buildSolarTerm(context, '冬至', Colors.blue[400]!, Colors.blue[700]!),
                _buildSolarTerm(context, '小寒', Colors.blue[500]!, Colors.blue[700]!),
                _buildSolarTerm(context, '大寒', Colors.blue[600]!, Colors.blue[700]!),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSeason(BuildContext context, List<Widget> terms) {
    return SizedBox(
      height: 90,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: terms,
      ),
    );
  }

  Widget _buildSolarTerm(BuildContext context, String name, Color bgColor, Color textColor) {
    return Container(
      width: 70,
      height: 90,
      margin: EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: textColor.withAlpha(40),
            blurRadius: 2,
            offset: Offset(1, 1),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            name,
            style: TextStyle(
              color: textColor,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(160),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _getSolarTermIcon(name),
              color: textColor,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getSolarTermIcon(String term) {
    switch (term) {
      case '立春': return Icons.eco;
      case '雨水': return Icons.water_drop;
      case '惊蛰': return Icons.bolt;
      case '春分': return Icons.compare_arrows; // 修改: 使用compare_arrows替换不存在的balance
      case '清明': return Icons.cloud;
      case '谷雨': return Icons.grass;
      case '立夏': return Icons.wb_sunny;
      case '小满': return Icons.grain;
      case '芒种': return Icons.agriculture;
      case '夏至': return Icons.brightness_7;
      case '小暑': return Icons.thermostat;
      case '大暑': return Icons.whatshot;
      case '立秋': return Icons.landscape; // 修改: 使用landscape替换不存在的fall
      case '处暑': return Icons.thermostat_outlined;
      case '白露': return Icons.opacity;
      case '秋分': return Icons.compare_arrows; // 修改: 使用compare_arrows替换不存在的balance
      case '寒露': return Icons.ac_unit;
      case '霜降': return Icons.beach_access;
      case '立冬': return Icons.cloud_queue; // 修改: 使用cloud_queue替换不存在的snowing
      case '小雪': return Icons.ac_unit; // 修改: 使用ac_unit替换不存在的cloudy_snowing
      case '大雪': return Icons.waves; // 修改: 使用waves替换不存在的weather_snowy
      case '冬至': return Icons.nightlight;
      case '小寒': return Icons.ac_unit;
      case '大寒': return Icons.snowmobile;
      default: return Icons.circle;
    }
  }
}
