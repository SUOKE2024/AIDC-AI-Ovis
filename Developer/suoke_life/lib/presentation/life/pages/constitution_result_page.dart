import 'package:flutter/material.dart';
import 'package:auto_route/auto_route.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';
import 'package:suoke_life/core/theme/app_typography.dart';
import 'package:suoke_life/core/theme/tcm_chart_themes.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';
import 'package:suoke_life/core/widgets/app_widgets.dart' as app_widgets;
import 'package:suoke_life/core/widgets/tcm/element_radar_chart.dart';
import 'package:suoke_life/core/widgets/tcm/five_elements_chart.dart';
import 'package:suoke_life/core/widgets/tcm/models/five_elements_data.dart';
import 'package:suoke_life/core/widgets/tcm/models/radar_chart_data.dart';
import 'package:suoke_life/domain/entities/constitution/constitution_type.dart'
    as domain;
import 'package:suoke_life/presentation/life/models/constitution_type.dart';

@RoutePage()
class ConstitutionResultPage extends StatelessWidget {
  const ConstitutionResultPage({super.key});

  @override
  Widget build(BuildContext context) {
    // 获取主要体质类型（前三个匹配度最高的）
    // 模拟数据，实际应用中应该由评估算法计算得出
    final List<ConstitutionInfo> mainTypes = [
      ConstitutionInfo(
        type: ConstitutionType.qiDeficiency,
        name: '气虚质',
        description: '气虚质是指体内气息不足，气的推动、温煦和防御等功能减弱的体质状态。',
        characteristics: [
          '平素语音低弱，气短懒言',
          '容易疲劳，精神不振',
          '易出汗，尤其活动后汗出较多',
          '舌淡红，舌边有齿痕，脉弱'
        ],
        suggestions: ['饮食宜温补、清淡而富有营养', '适当参加体育锻炼，避免过度劳累', '保持乐观情绪，避免忧虑、悲伤'],
        elementType: ElementType.earth,
        color: Colors.amber,
        matchPercentage: 0.87,
      ),
      ConstitutionInfo(
        type: ConstitutionType.balanced,
        name: '平和质',
        description: '平和质是指阴阳气血调和，脏腑功能正常，对外界环境适应能力较强的体质状态。',
        characteristics: ['面色、肤色润泽', '精力充沛，耐受力强', '睡眠良好，胃纳佳', '大便正常，舌色淡红，苔薄白'],
        suggestions: ['继续保持良好的生活习惯', '均衡饮食，规律作息', '适量运动，保持心情舒畅'],
        elementType: ElementType.earth,
        color: Colors.green,
        matchPercentage: 0.65,
      ),
      ConstitutionInfo(
        type: ConstitutionType.yangDeficiency,
        name: '阳虚质',
        description: '阳虚质是指人体内阳气不足，温煦和推动功能减弱的体质状态。',
        characteristics: ['怕冷，手脚发凉', '面色苍白或萎黄', '喜热饮食，不喜冷食', '大便溏薄，小便清长'],
        suggestions: ['饮食宜温热，避免生冷食物', '注意保暖，避免受寒', '适当进行温阳运动，如太极拳'],
        elementType: ElementType.fire,
        color: Colors.red,
        matchPercentage: 0.45,
      ),
    ];

    // 获取所有体质类型
    final List<ConstitutionInfo> allTypes = mainTypes;

    return Scaffold(
      appBar: AppBar(
        title: const Text('体质评估结果'),
        backgroundColor: AppColors.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. 头部评估完成信息
            _buildHeaderSection(),

            const SizedBox(height: 24.0),

            // 2. 主要体质类型展示
            _buildMainConstitutionSection(mainTypes, context),

            const SizedBox(height: 24.0),

            // 3. 体质雷达图
            _buildRadarChartSection(allTypes, context),

            const SizedBox(height: 24.0),

            // 4. 个性化调理建议
            _buildSuggestionsSection(mainTypes[0], context),

            const SizedBox(height: 24.0),

            // 5. 底部操作按钮区域
            _buildActionButtons(context),

            const SizedBox(height: 40.0),
          ],
        ),
      ),
    );
  }

  // 头部评估完成信息
  Widget _buildHeaderSection() {
    return app_widgets.BasicCard(
      title: '体质评估完成',
      leadingIcon: Icons.check_circle,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '恭喜您完成了中医体质评估！根据您的回答，我们为您分析了您的体质类型。',
            style: TextStyle(height: 1.5),
          ),
          const SizedBox(height: 16.0),
          app_widgets.AnimatedPressButton(
            label: '查看评估详情',
            icon: Icons.bar_chart,
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  // 主要体质类型展示
  Widget _buildMainConstitutionSection(
      List<ConstitutionInfo> mainTypes, BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('您的主要体质类型', style: AppTypography.heading3Style),
        const SizedBox(height: 16.0),
        // 使用AnimatedGradientCard展示主体质
        app_widgets.AnimatedGradientCard(
          title: mainTypes[0].name,
          subtitle:
              '主要体质 · ${(mainTypes[0].matchPercentage * 100).toInt()}% 匹配',
          leadingIcon: Icons.verified,
          gradients: [
            [mainTypes[0].color, mainTypes[0].color.withAlpha(180)],
            [mainTypes[0].color.withAlpha(200), mainTypes[0].color],
          ],
          content: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8.0),
                Text(
                  mainTypes[0].description,
                  style: const TextStyle(color: Colors.white, height: 1.5),
                ),
                const SizedBox(height: 16.0),
                // 五行元素展示（如果有关联元素）
                if (mainTypes[0].elementType != null)
                  _buildElementVisual(mainTypes[0]),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16.0),
        // 次要体质展示
        Row(
          children: [
            Expanded(
              child: _buildSecondaryConstitution(mainTypes[1], context),
            ),
            const SizedBox(width: 16.0),
            Expanded(
              child: _buildSecondaryConstitution(mainTypes[2], context),
            ),
          ],
        ),
      ],
    );
  }

  // 次要体质卡片
  Widget _buildSecondaryConstitution(
      ConstitutionInfo constitution, BuildContext context) {
    return app_widgets.OutlineCard(
      title: constitution.name,
      subtitle: '${(constitution.matchPercentage * 100).toInt()}% 匹配',
      borderColor: constitution.color,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8.0),
          Text(
            constitution.characteristics.first,
            style: const TextStyle(height: 1.5),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8.0),
          app_widgets.AppTextButton(
            label: '查看详情',
            textColor: constitution.color,
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  // 五行元素视觉展示组件
  Widget _buildElementVisual(ConstitutionInfo constitution) {
    if (constitution.elementType == null) return const SizedBox.shrink();

    return Row(
      children: [
        app_widgets.FiveElementShape(
          elementType: constitution.elementType!,
          size: 60,
          enableBreathing: true,
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '关联五行: ${_getElementName(constitution.elementType!)}',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              '五行元素关联您的体质特征',
              style: TextStyle(color: Colors.white70),
            ),
          ],
        ),
      ],
    );
  }

  // 获取五行元素中文名称
  String _getElementName(ElementType type) {
    switch (type) {
      case ElementType.wood:
        return '木';
      case ElementType.fire:
        return '火';
      case ElementType.earth:
        return '土';
      case ElementType.metal:
        return '金';
      case ElementType.water:
        return '水';
    }
  }

  // 雷达图区域
  Widget _buildRadarChartSection(
      List<ConstitutionInfo> allTypes, BuildContext context) {
    return app_widgets.BasicCard(
      title: '体质雷达分析',
      leadingIcon: Icons.radar,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16.0),
          const Text(
            '以下雷达图展示了您各种体质类型的匹配程度，可点击查看详情。',
            style: TextStyle(height: 1.5),
          ),
          const SizedBox(height: 24.0),

          // 使用新的雷达图组件
          Center(
            child: SizedBox(
              height: 280,
              child: ElementRadarChart(
                data: _createRadarChartData(allTypes),
                showGrid: true,
                showAxis: true,
                showLabels: true,
                divisions: 4,
                onDataPointTap: (label) {
                  _showConstitutionDetail(context, label, allTypes);
                },
              ),
            ),
          ),

          const SizedBox(height: 24.0),

          // 添加五行关系图
          const Text(
            '五行关系与体质的联系',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 16.0),
          Center(
            child: SizedBox(
              height: 280,
              child: FiveElementsChart(
                data: _createFiveElementsData(allTypes),
                showGenerationCycle: true,
                showControlCycle: true,
                chartType: FiveElementsChartType.circular,
                elementSize: 45,
                onElementTap: (element) {
                  _showElementDetail(context, element);
                },
              ),
            ),
          ),

          const SizedBox(height: 16.0),
          const Text(
            '点击五行元素可查看更多信息，圆形连线代表相生关系，箭头连线代表相克关系。',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // 创建雷达图数据
  RadarChartData _createRadarChartData(List<ConstitutionInfo> constitutions) {
    final dataPoints = constitutions.map((constitution) {
      final label = constitution.type.toString().split('.').last;
      final convertedType = _convertToConstitutionType(constitution.type);

      return RadarDataPoint(
        label: label,
        value: constitution.matchPercentage * 10, // 转换为0-10的范围
        color: TCMChartThemes.getConstitutionColor(convertedType),
        tooltip: constitution.name,
      );
    }).toList();

    return RadarChartData(
      name: '体质分布',
      dataPoints: dataPoints,
      color: AppColors.primaryColor,
      lineWidth: 2.0,
    );
  }

  // 创建五行关系图数据
  FiveElementsData _createFiveElementsData(
      List<ConstitutionInfo> constitutions) {
    // 创建基础的五行数据
    final data = FiveElementsData.balanced();

    // 根据体质构成调整数值
    for (final constitution in constitutions) {
      if (constitution.elementType != null) {
        // 根据匹配度调整元素强度
        data.values[constitution.elementType!] = constitution.matchPercentage;
      }
    }

    // 创建相生相克关系
    data.generateRelationships();

    return data;
  }

  // 显示体质详情弹窗
  void _showConstitutionDetail(BuildContext context, String label,
      List<ConstitutionInfo> constitutions) {
    final constitution = constitutions.firstWhere(
      (c) => c.type.toString().split('.').last == label,
      orElse: () => constitutions.first,
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(constitution.name),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                constitution.description,
                style: const TextStyle(height: 1.5),
              ),
              const SizedBox(height: 16),
              const Text(
                '主要特征:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ...constitution.characteristics.map((c) => Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('• '),
                        Expanded(
                            child:
                                Text(c, style: const TextStyle(height: 1.5))),
                      ],
                    ),
                  )),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  // 显示五行元素详情弹窗
  void _showElementDetail(BuildContext context, ElementType element) {
    final elementName = _getElementName(element);
    final elementColor = FiveElements.getElementColor(element);
    final elementDescription = _getElementDescription(element);
    final elementAssociations = _getElementAssociations(element);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            app_widgets.FiveElementShape(
              elementType: element,
              size: 30,
              enableBreathing: true,
            ),
            const SizedBox(width: 12),
            Text('$elementName元素'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                elementDescription,
                style: const TextStyle(height: 1.5),
              ),
              const SizedBox(height: 16),
              const Text(
                '关联信息:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ...elementAssociations.map((a) => Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('• '),
                        Expanded(
                            child:
                                Text(a, style: const TextStyle(height: 1.5))),
                      ],
                    ),
                  )),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  // 获取元素相关描述
  String _getElementDescription(ElementType element) {
    switch (element) {
      case ElementType.wood:
        return '木为阳中之少阳，其性生发条达，升而不降，其情为仁，其性刚强，具有自强不息的特点。';
      case ElementType.fire:
        return '火为阳中之太阳，其性炎上，其情为礼，火性炎上是其特点，与木的升发条达不同。';
      case ElementType.earth:
        return '土为阴阳之中，其性敦厚，其情为信，中正持重，不偏不倚。以生养万物为功，具有载万物而不辞的特点。';
      case ElementType.metal:
        return '金为阴中之少阴，其性沉降，其情为义，清静肃杀，具有从革、刚劲、收敛的特点。';
      case ElementType.water:
        return '水为阴中之太阴，其性寒凉、润下，其情为智，具有静、凉、润、下、藏的特点。水润下的特性与火炎上的性质恰好相对。';
    }
  }

  // 获取元素相关联系
  List<String> _getElementAssociations(ElementType element) {
    switch (element) {
      case ElementType.wood:
        return ['五脏：肝', '五官：目', '五味：酸', '五色：青', '五气：风', '四季：春', '方位：东'];
      case ElementType.fire:
        return ['五脏：心', '五官：舌', '五味：苦', '五色：赤', '五气：热', '四季：夏', '方位：南'];
      case ElementType.earth:
        return ['五脏：脾', '五官：口', '五味：甘', '五色：黄', '五气：湿', '四季：长夏', '方位：中'];
      case ElementType.metal:
        return ['五脏：肺', '五官：鼻', '五味：辛', '五色：白', '五气：燥', '四季：秋', '方位：西'];
      case ElementType.water:
        return ['五脏：肾', '五官：耳', '五味：咸', '五色：黑', '五气：寒', '四季：冬', '方位：北'];
    }
  }

  // 将项目内部体质类型转换为领域体质类型
  domain.ConstitutionType _convertToConstitutionType(ConstitutionType type) {
    switch (type) {
      case ConstitutionType.balanced:
        return domain.ConstitutionType.balanced;
      case ConstitutionType.qiDeficiency:
        return domain.ConstitutionType.qiDeficiency;
      case ConstitutionType.yangDeficiency:
        return domain.ConstitutionType.yangDeficiency;
      case ConstitutionType.yinDeficiency:
        return domain.ConstitutionType.yinDeficiency;
      case ConstitutionType.phlegmDampness:
        return domain.ConstitutionType.phlegmDampness;
      case ConstitutionType.dampnessHeat:
        return domain.ConstitutionType.dampnessHeat;
      case ConstitutionType.bloodStasis:
        return domain.ConstitutionType.bloodStasis;
      case ConstitutionType.qiStagnation:
        return domain.ConstitutionType.qiStagnation;
      case ConstitutionType.allergic:
        return domain.ConstitutionType.allergic;
    }
  }

  // 个性化调理建议
  Widget _buildSuggestionsSection(
      ConstitutionInfo mainConstitution, BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('个性化调理建议', style: AppTypography.heading3Style),
        const SizedBox(height: 16.0),
        // 体质特点卡片
        app_widgets.BasicCard(
          title: '${mainConstitution.name}的特点',
          leadingIcon: Icons.psychology,
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8.0),
              ...mainConstitution.characteristics
                  .map((characteristic) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.circle,
                                size: 8, color: AppColors.primaryColor),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                characteristic,
                                style: const TextStyle(height: 1.5),
                              ),
                            ),
                          ],
                        ),
                      ))
                  .toList(),
            ],
          ),
        ),
        const SizedBox(height: 16.0),
        // 调理建议卡片
        app_widgets.GradientCard(
          title: '调理建议',
          leadingIcon: Icons.healing,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              mainConstitution.color,
              mainConstitution.color.withAlpha(180),
            ],
          ),
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8.0),
              ...mainConstitution.suggestions
                  .map((suggestion) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle,
                                size: 16, color: Colors.white),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                suggestion,
                                style: const TextStyle(
                                  color: Colors.white,
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ))
                  .toList(),
            ],
          ),
        ),
      ],
    );
  }

  // 底部操作按钮区域
  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        app_widgets.PrimaryButton(
          label: '获取个性化调理方案',
          prefixIcon: Icons.health_and_safety,
          isFullWidth: true,
          onPressed: () {
            // 主要体质类型是第一个匹配度最高的
            // 模拟数据，实际应用中应从评估结果获取
            final mainType = ConstitutionInfo(
              type: ConstitutionType.qiDeficiency,
              name: '气虚质',
              description: '气虚质是指体内气息不足，气的推动、温煦和防御等功能减弱的体质状态。',
              characteristics: [
                '平素语音低弱，气短懒言',
                '容易疲劳，精神不振',
                '易出汗，尤其活动后汗出较多',
                '舌淡红，舌边有齿痕，脉弱'
              ],
              suggestions: [
                '饮食宜温补、清淡而富有营养',
                '适当参加体育锻炼，避免过度劳累',
                '保持乐观情绪，避免忧虑、悲伤'
              ],
              elementType: ElementType.earth,
              color: Colors.amber,
              matchPercentage: 87,
            );
            context.router.pushNamed(
                '/life/health-regimen/${mainType.type.toString().split('.').last}');
          },
        ),
        const SizedBox(height: 16.0),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            app_widgets.OutlineButton(
              label: '分享结果',
              prefixIcon: Icons.share,
              onPressed: () {},
            ),
            const SizedBox(width: 16.0),
            app_widgets.OutlineButton(
              label: '保存报告',
              prefixIcon: Icons.save_alt,
              onPressed: () {},
            ),
          ],
        ),
      ],
    );
  }
}
