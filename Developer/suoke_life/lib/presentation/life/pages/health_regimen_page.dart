import 'package:flutter/material.dart';
import 'package:auto_route/auto_route.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';
import 'package:suoke_life/core/theme/app_typography.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';
import 'package:suoke_life/core/widgets/app_widgets.dart' as app_widgets;
import 'package:suoke_life/presentation/life/models/constitution_type.dart';

@RoutePage()
class HealthRegimenPage extends StatefulWidget {
  @PathParam('constitutionType')
  final String constitutionTypeStr;

  const HealthRegimenPage({
    super.key,
    required this.constitutionTypeStr,
  });

  @override
  State<HealthRegimenPage> createState() => _HealthRegimenPageState();
}

class _HealthRegimenPageState extends State<HealthRegimenPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late ConstitutionInfo _constitutionInfo;
  late ConstitutionType _constitutionType;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);

    // 将字符串转换为枚举
    _constitutionType =
        _getConstitutionTypeFromString(widget.constitutionTypeStr);

    // 根据传入的体质类型获取相应的体质信息
    _constitutionInfo = ConstitutionInfo.getAllTypes()
        .firstWhere((info) => info.type == _constitutionType);
  }

  // 将字符串转换为体质类型枚举
  ConstitutionType _getConstitutionTypeFromString(String typeStr) {
    try {
      return ConstitutionType.values
          .firstWhere((e) => e.toString().split('.').last == typeStr);
    } catch (e) {
      // 默认返回平和质
      return ConstitutionType.balanced;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${_constitutionInfo.name}调理方案'),
        backgroundColor: _constitutionInfo.color,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(icon: Icon(Icons.restaurant), text: '饮食'),
            Tab(icon: Icon(Icons.directions_run), text: '运动'),
            Tab(icon: Icon(Icons.spa), text: '生活'),
            Tab(icon: Icon(Icons.psychology), text: '情绪'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDietTab(),
          _buildExerciseTab(),
          _buildLifestyleTab(),
          _buildMoodTab(),
        ],
      ),
      bottomNavigationBar: BottomAppBar(
        color: Colors.white,
        elevation: 8,
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: app_widgets.PrimaryButton(
            label: '生成完整调理计划',
            prefixIcon: Icons.health_and_safety,
            onPressed: () {
              // 显示生成中提示
              _showGeneratingPlanDialog(context);
            },
          ),
        ),
      ),
    );
  }

  // 饮食调理选项卡
  Widget _buildDietTab() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 饮食原则
            _buildSectionTitle('饮食原则', Icons.list_alt),
            _buildInfoCard(_getDietPrinciples()),

            SizedBox(height: AppSpacing.lg),

            // 推荐食物
            _buildSectionTitle('推荐食物', Icons.thumb_up),
            _buildFoodGrid(_getRecommendedFoods(), true),

            SizedBox(height: AppSpacing.lg),

            // 避免食物
            _buildSectionTitle('避免食物', Icons.thumb_down),
            _buildFoodGrid(_getAvoidFoods(), false),

            SizedBox(height: AppSpacing.lg),

            // 每日膳食举例
            _buildSectionTitle('每日膳食举例', Icons.calendar_today),
            _buildMealExample('早餐', _getBreakfastExample()),
            _buildMealExample('午餐', _getLunchExample()),
            _buildMealExample('晚餐', _getDinnerExample()),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          Icon(icon, color: _constitutionInfo.color, size: 24),
          SizedBox(width: 8),
          Text(
            title,
            style: AppTypography.heading4Style.copyWith(
              color: _constitutionInfo.color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(List<String> items) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: items
              .map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('•',
                            style: TextStyle(
                                fontSize: 18, fontWeight: FontWeight.bold)),
                        SizedBox(width: 8),
                        Expanded(
                            child: Text(item, style: AppTypography.body1Style)),
                      ],
                    ),
                  ))
              .toList(),
        ),
      ),
    );
  }

  // 构建膳食部分
  Widget _buildMealSection(String title, List<String> foods) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style:
                AppTypography.body1Style.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8.0),
          ...foods
              .map((food) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4.0),
                    child: Row(
                      children: [
                        const Icon(Icons.fiber_manual_record, size: 8),
                        const SizedBox(width: 8),
                        Text(food, style: AppTypography.body2Style),
                      ],
                    ),
                  ))
              .toList(),
        ],
      ),
    );
  }

  // 运动调理选项卡
  Widget _buildExerciseTab() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 运动原则
            _buildSectionTitle('运动原则', Icons.fitness_center),
            _buildInfoCard(_getExercisePrinciples()),

            SizedBox(height: AppSpacing.lg),

            // 推荐运动
            _buildSectionTitle('推荐运动', Icons.directions_run),
            _buildExerciseList(_getRecommendedExercises()),

            SizedBox(height: AppSpacing.lg),

            // 避免运动
            _buildSectionTitle('避免运动', Icons.block),
            _buildInfoCard(_getAvoidExercises()),

            SizedBox(height: AppSpacing.lg),

            // 每周运动计划
            _buildSectionTitle('每周运动计划', Icons.calendar_view_week),
            _buildWeeklyExercisePlan(),
          ],
        ),
      ),
    );
  }

  Widget _buildExerciseList(List<Map<String, dynamic>> exercises) {
    return Column(
      children: exercises.map((exercise) {
        return Card(
          elevation: 2,
          margin: EdgeInsets.only(bottom: 12),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  exercise['name'] as String,
                  style: AppTypography.heading4Style
                      .copyWith(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 4),
                Text(exercise['description'] as String,
                    style: AppTypography.body1Style),
                SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.timer, size: 16, color: Colors.grey),
                    SizedBox(width: 4),
                    Text(exercise['duration'] as String,
                        style: AppTypography.captionStyle),
                    SizedBox(width: 16),
                    Icon(Icons.fitness_center, size: 16, color: Colors.grey),
                    SizedBox(width: 4),
                    Text(exercise['intensity'] as String,
                        style: AppTypography.captionStyle),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildWeeklyExercisePlan() {
    final weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    final plan = _getWeeklyExercisePlan();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: weekdays.map((day) {
            final exercise = plan[day]!;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 50,
                    child: Text(
                      day,
                      style: AppTypography.body1Style
                          .copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exercise['name'] as String,
                          style: AppTypography.body1Style
                              .copyWith(fontWeight: FontWeight.w500),
                        ),
                        SizedBox(height: 2),
                        Text(
                          '${exercise['duration']} | ${exercise['intensity']}',
                          style: AppTypography.captionStyle,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  // 生活方式选项卡
  Widget _buildLifestyleTab() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 日常作息
            _buildSectionTitle('日常作息建议', Icons.wb_sunny),
            _buildLifestyleRoutine(),

            SizedBox(height: AppSpacing.lg),

            // 环境调适
            _buildSectionTitle('环境调适', Icons.home),
            _buildInfoCard(_getEnvironmentalAdjustments()),

            SizedBox(height: AppSpacing.lg),

            // 起居穿着
            _buildSectionTitle('起居穿着', Icons.checkroom),
            _buildInfoCard(_getClothingRecommendations()),

            SizedBox(height: AppSpacing.lg),

            // 日常保健
            _buildSectionTitle('日常保健方法', Icons.healing),
            _buildDailyHealthMethods(),
          ],
        ),
      ),
    );
  }

  Widget _buildLifestyleRoutine() {
    final routines = _getDailyRoutine();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: routines.map((routine) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.check_circle,
                      color: _constitutionInfo.color, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      routine,
                      style: AppTypography.body1Style,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildDailyHealthMethods() {
    final methods = _getHealthMethods();

    return Column(
      children: methods.map((method) {
        return Card(
          elevation: 2,
          margin: EdgeInsets.only(bottom: 12),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  method['name'],
                  style: AppTypography.heading4Style
                      .copyWith(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text(method['description'], style: AppTypography.body1Style),
                if (method['steps'] != null) ...[
                  SizedBox(height: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: (method['steps'] as List<String>).map((step) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('•',
                                style: TextStyle(
                                    fontSize: 18, fontWeight: FontWeight.bold)),
                            SizedBox(width: 8),
                            Expanded(
                                child: Text(step,
                                    style: AppTypography.body2Style)),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  // 情绪管理选项卡
  Widget _buildMoodTab() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 情绪特点
            _buildSectionTitle('情绪特点', Icons.psychology),
            _buildInfoCard(_getEmotionalCharacteristics()),

            SizedBox(height: AppSpacing.lg),

            // 情绪调节建议
            _buildSectionTitle('情绪调节建议', Icons.spa),
            _buildInfoCard(_getEmotionalRegulationTips()),

            SizedBox(height: AppSpacing.lg),

            // 放松技巧
            _buildSectionTitle('放松技巧', Icons.self_improvement),
            _buildRelaxationTechniques(),

            SizedBox(height: AppSpacing.lg),

            // 五行情绪调节
            _buildSectionTitle('五行情绪调节', Icons.balance),
            _buildFiveElementEmotionRegulation(),
          ],
        ),
      ),
    );
  }

  Widget _buildRelaxationTechniques() {
    final techniques = _getRelaxationTechniques();

    return Column(
      children: techniques.map((technique) {
        return Card(
          elevation: 2,
          margin: EdgeInsets.only(bottom: 12),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  technique['name'],
                  style: AppTypography.heading4Style
                      .copyWith(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 4),
                Text(technique['description'], style: AppTypography.body1Style),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFiveElementEmotionRegulation() {
    final relationsList = _getFiveElementEmotionRelation();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 10,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('五行情绪关系', style: AppTypography.heading4Style),
          const SizedBox(height: 16),
          ...relationsList.map((relation) {
            final elementName = relation['element'] as String;
            final emotion = relation['emotion'] as String;
            final description = relation['description'] as String;
            final regulation = relation['regulation'] as String;

            ElementType elementType;
            switch (elementName) {
              case '木':
                elementType = ElementType.wood;
                break;
              case '火':
                elementType = ElementType.fire;
                break;
              case '土':
                elementType = ElementType.earth;
                break;
              case '金':
                elementType = ElementType.metal;
                break;
              case '水':
                elementType = ElementType.water;
                break;
              default:
                elementType = ElementType.wood;
            }

            final color = _getElementColor(elementType);

            return Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(right: 12),
                    child: app_widgets.FiveElementShape(
                      elementType: elementType,
                      size: 40,
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          elementName,
                          style: AppTypography.body1Style.copyWith(
                            color: color,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '情绪：$emotion - $description',
                          style: AppTypography.body2Style,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '调节：$regulation',
                          style: AppTypography.body2Style,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  String _getElementName(ElementType element) {
    switch (element) {
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

  Color _getElementColor(ElementType element) {
    return FiveElements.getElementColor(element);
  }

  // 显示生成计划对话框
  void _showGeneratingPlanDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('正在生成调理计划'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            app_widgets.SkeletonLoading(
              width: double.infinity,
              height: 100,
              borderRadius: BorderRadius.circular(12),
            ),
            SizedBox(height: 16),
            Text('根据您的体质分析，为您定制个性化的健康调理方案...'),
          ],
        ),
      ),
    );

    // 模拟生成过程
    Future.delayed(Duration(seconds: 2), () {
      Navigator.of(context).pop(); // 关闭生成对话框
      _showPlanCompletedDialog(context); // 显示完成对话框
    });
  }

  void _showPlanCompletedDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 8),
            Text('调理计划已生成'),
          ],
        ),
        content: Text('您的个性化健康调理计划已经生成完毕，可以在「我的-健康管理」中查看完整计划并设置提醒。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('稍后查看'),
          ),
          app_widgets.PrimaryButton(
            label: '立即查看',
            onPressed: () {
              Navigator.of(context).pop();
              // 导航到完整计划页面
              // context.router.push(...);
            },
          ),
        ],
      ),
    );
  }

  // 根据体质类型获取相应的数据
  // 以下是各种数据获取方法，根据不同体质返回不同的建议内容

  List<String> _getDietPrinciples() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          '饮食有节，不偏不倚，平衡五味',
          '定时定量，不暴饮暴食',
          '食物多样化，荤素搭配',
          '少食生冷、油腻、过咸、过甜食物',
          '食物新鲜，少食加工食品',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '饮食温热，少食生冷',
          '多食补气食物，如黄芪、党参等',
          '少食耗气食物，如生冷、辛辣',
          '定时定量，不宜过饱或过饥',
          '宜细嚼慢咽，减轻脾胃负担',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '饮食温热，避免生冷',
          '多食温阳食物，如羊肉、韭菜等',
          '少食寒凉食物，如西瓜、绿豆等',
          '早餐宜丰富，温补阳气',
          '适量饮用姜茶，温暖脾胃',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '饮食清淡滋阴，避免燥热',
          '多食滋阴食物，如银耳、百合等',
          '少食辛辣、油炸、烧烤等燥热食物',
          '适量饮水，保持体内水分',
          '少食刺激性调味品，如辣椒、胡椒等',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '饮食清淡，少油少盐',
          '多食健脾祛湿食物，如薏米、红豆等',
          '少食黏腻、甜腻、生冷食物',
          '限制精制糖和碳水化合物的摄入',
          '适量饮用陈皮水、生姜水等',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '饮食清淡，忌油腻辛辣',
          '多食清热祛湿食物，如绿豆、苦瓜等',
          '少食油炸、烧烤、辛辣刺激性食物',
          '避免饮酒和浓茶、咖啡等刺激性饮料',
          '多饮水，但不宜过量或饮用冰水',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '饮食宜温不宜凉，忌食生冷',
          '多食活血化瘀食物，如红枣、桃仁等',
          '少食油腻、黏滞食物',
          '适量摄入优质蛋白质',
          '控制总热量摄入，保持体重适中',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '饮食有节，不宜过饱',
          '多食理气食物，如柑橘、玫瑰花茶等',
          '少食油腻、黏滞、不易消化食物',
          '进食环境宜安静舒适，心情愉悦',
          '定时进餐，细嚼慢咽',
        ];
      case ConstitutionType.allergic:
        return [
          '避免已知过敏原食物',
          '饮食清淡，少食辛辣刺激性食物',
          '多食抗过敏食物，如蜂蜜、苹果等',
          '食材新鲜，避免变质或霉变食物',
          '少食添加剂多的加工食品',
        ];
    }
  }

  List<Map<String, dynamic>> _getRecommendedFoods() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          {'name': '全谷物', 'benefit': '提供均衡营养和膳食纤维'},
          {'name': '应季蔬果', 'benefit': '补充多种维生素和矿物质'},
          {'name': '瘦肉鱼禽', 'benefit': '提供优质蛋白质'},
          {'name': '豆类坚果', 'benefit': '补充植物蛋白和健康脂肪'},
          {'name': '菌藻类', 'benefit': '增强免疫力和提供微量元素'},
          {'name': '乳制品', 'benefit': '补钙和提供优质蛋白'},
        ];
      case ConstitutionType.qiDeficiency:
        return [
          {'name': '山药', 'benefit': '健脾益肺，补气养阴'},
          {'name': '大枣', 'benefit': '补中益气，养血安神'},
          {'name': '小米', 'benefit': '健脾和胃，补气益肾'},
          {'name': '鸡肉', 'benefit': '温中补气，健脾胃'},
          {'name': '黄芪煲汤', 'benefit': '补气升阳，固表止汗'},
          {'name': '人参茶', 'benefit': '大补元气，复脉固脱'},
        ];
      case ConstitutionType.yangDeficiency:
        return [
          {'name': '羊肉', 'benefit': '补肾壮阳，温中祛寒'},
          {'name': '韭菜', 'benefit': '温肾助阳，理气活血'},
          {'name': '桂圆', 'benefit': '补益心脾，养血安神'},
          {'name': '干姜', 'benefit': '温中散寒，回阳通脉'},
          {'name': '肉桂', 'benefit': '温经散寒，补火助阳'},
          {'name': '黑豆', 'benefit': '温肾补阳，活血解毒'},
        ];
      case ConstitutionType.yinDeficiency:
        return [
          {'name': '银耳', 'benefit': '滋阴润肺，养胃生津'},
          {'name': '百合', 'benefit': '养阴润肺，清心安神'},
          {'name': '芝麻', 'benefit': '滋阴补肾，润肠通便'},
          {'name': '枸杞', 'benefit': '滋补肝肾，明目安神'},
          {'name': '甘蔗', 'benefit': '生津止渴，润肺清热'},
          {'name': '鸭肉', 'benefit': '滋阴养胃，利水消肿'},
        ];
      case ConstitutionType.phlegmDampness:
        return [
          {'name': '薏米', 'benefit': '健脾利湿，清热解毒'},
          {'name': '赤小豆', 'benefit': '利水消肿，祛湿解毒'},
          {'name': '冬瓜', 'benefit': '清热利水，消痰降逆'},
          {'name': '芡实', 'benefit': '健脾止泻，固肾止遗'},
          {'name': '白萝卜', 'benefit': '消食化痰，清热生津'},
          {'name': '荷叶', 'benefit': '清热解暑，升发清阳'},
        ];
      case ConstitutionType.dampnessHeat:
        return [
          {'name': '绿豆', 'benefit': '清热解毒，利水消肿'},
          {'name': '苦瓜', 'benefit': '清热泻火，明目解毒'},
          {'name': '莲子', 'benefit': '清心养神，健脾止泻'},
          {'name': '黄瓜', 'benefit': '清热利水，解毒消肿'},
          {'name': '芹菜', 'benefit': '清热利水，降血压'},
          {'name': '赤豆', 'benefit': '清热解毒，利水消肿'},
        ];
      case ConstitutionType.bloodStasis:
        return [
          {'name': '红枣', 'benefit': '补气养血，活血化瘀'},
          {'name': '桃仁', 'benefit': '活血祛瘀，润肠通便'},
          {'name': '红花', 'benefit': '活血通经，祛瘀止痛'},
          {'name': '醋', 'benefit': '活血化瘀，软坚散结'},
          {'name': '菜瓜', 'benefit': '清热解毒，活血化瘀'},
          {'name': '黑木耳', 'benefit': '活血化瘀，养血滋阴'},
        ];
      case ConstitutionType.qiStagnation:
        return [
          {'name': '柑橘', 'benefit': '理气化痰，和胃消食'},
          {'name': '玫瑰花', 'benefit': '理气解郁，和血调经'},
          {'name': '香橼', 'benefit': '理气宽中，舒肝和胃'},
          {'name': '佛手', 'benefit': '疏肝理气，温胃止痛'},
          {'name': '白萝卜', 'benefit': '顺气消食，降气化痰'},
          {'name': '薄荷', 'benefit': '疏散风热，清利头目'},
        ];
      case ConstitutionType.allergic:
        return [
          {'name': '蜂蜜', 'benefit': '补中益气，抗过敏'},
          {'name': '苹果', 'benefit': '健脾开胃，清热解毒'},
          {'name': '胡萝卜', 'benefit': '健脾消食，明目安神'},
          {'name': '茯苓', 'benefit': '健脾利湿，宁心安神'},
          {'name': '白木耳', 'benefit': '养阴润肺，滋胃明目'},
          {'name': '白果', 'benefit': '敛肺定喘，止带缩尿'},
        ];
    }
  }

  List<Map<String, dynamic>> _getAvoidFoods() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          {'name': '过油炸食物', 'benefit': '增加消化负担，易生湿热'},
          {'name': '过咸食物', 'benefit': '伤阴耗血，易引起高血压'},
          {'name': '过甜食物', 'benefit': '损伤脾胃，生痰生湿'},
          {'name': '烟熏烧烤', 'benefit': '含致癌物质，损伤肠胃'},
          {'name': '腌制食品', 'benefit': '含亚硝酸盐，损伤胃黏膜'},
          {'name': '酒精饮料', 'benefit': '伤肝耗气，易生湿热'},
        ];
      case ConstitutionType.qiDeficiency:
        return [
          {'name': '生冷瓜果', 'benefit': '损伤脾胃阳气，加重气虚'},
          {'name': '辛辣刺激', 'benefit': '耗散正气，加重气虚'},
          {'name': '甜腻食物', 'benefit': '损伤脾胃，生痰生湿'},
          {'name': '寒凉蔬菜', 'benefit': '损伤脾胃，加重气虚'},
          {'name': '白萝卜', 'benefit': '走气耗气，不宜气虚者多食'},
          {'name': '苦味食物', 'benefit': '过食会伤阴耗气'},
        ];
      case ConstitutionType.yangDeficiency:
        return [
          {'name': '西瓜', 'benefit': '性寒清热，损伤阳气'},
          {'name': '绿豆', 'benefit': '性凉清热，加重阳虚'},
          {'name': '苦瓜', 'benefit': '性寒苦泄，伤阳耗气'},
          {'name': '冷饮冰品', 'benefit': '寒凉伤脾，损伤阳气'},
          {'name': '生菜', 'benefit': '性凉生冷，加重阳虚'},
          {'name': '柚子', 'benefit': '性凉酸敛，不宜阳虚者'},
        ];
      case ConstitutionType.yinDeficiency:
        return [
          {'name': '辣椒', 'benefit': '辛热温燥，耗伤阴液'},
          {'name': '葱姜蒜', 'benefit': '辛温发散，助热伤阴'},
          {'name': '烧烤食品', 'benefit': '燥热助火，消耗阴液'},
          {'name': '浓茶咖啡', 'benefit': '刺激兴奋，耗伤阴液'},
          {'name': '白酒', 'benefit': '温热伤阴，助热生火'},
          {'name': '羊肉狗肉', 'benefit': '温补助热，耗伤阴液'},
        ];
      case ConstitutionType.phlegmDampness:
        return [
          {'name': '肥肉', 'benefit': '油腻助湿，加重痰湿'},
          {'name': '奶油', 'benefit': '甜腻滋补，生痰助湿'},
          {'name': '甜点', 'benefit': '甜腻伤脾，助湿生痰'},
          {'name': '糯米', 'benefit': '黏腻难消，易生痰湿'},
          {'name': '牛奶', 'benefit': '性腻滋补，易生痰湿'},
          {'name': '冷饮', 'benefit': '寒凉伤脾，助湿生痰'},
        ];
      case ConstitutionType.dampnessHeat:
        return [
          {'name': '油炸食品', 'benefit': '油腻增湿，加重湿热'},
          {'name': '辣椒', 'benefit': '辛热助火，加重湿热'},
          {'name': '酒类', 'benefit': '湿热助火，加重湿热'},
          {'name': '羊肉', 'benefit': '温热助火，不宜湿热者'},
          {'name': '海鲜', 'benefit': '易引动湿热，导致过敏'},
          {'name': '甜品', 'benefit': '甜腻助湿，加重湿热'},
        ];
      case ConstitutionType.bloodStasis:
        return [
          {'name': '生冷食物', 'benefit': '寒凝血脉，加重血瘀'},
          {'name': '油腻食物', 'benefit': '加重血瘀，影响血液循环'},
          {'name': '高脂肪食物', 'benefit': '增加血液黏稠度，加重血瘀'},
          {'name': '高糖食物', 'benefit': '增加血糖水平，影响血液循环'},
          {'name': '高盐食物', 'benefit': '增加血压，影响血液循环'},
          {'name': '酒类', 'benefit': '增加血液黏稠度，加重血瘀'},
          {'name': '动物内脏', 'benefit': '增加胆固醇，加重血瘀'},
          {'name': '辛辣食物', 'benefit': '刺激血管，加重血瘀'},
          {'name': '咖啡', 'benefit': '刺激中枢神经，影响血液循环'},
          {'name': '浓茶', 'benefit': '刺激血管，加重血瘀'},
        ];
      case ConstitutionType.qiStagnation:
        return [
          {'name': '油腻食物', 'benefit': '增加消化负担，加重气滞'},
          {'name': '生冷食物', 'benefit': '损伤脾胃，影响气机运行'},
          {'name': '辛辣刺激', 'benefit': '刺激肝胃，加重气滞'},
          {'name': '烟熏烧烤', 'benefit': '含致癌物质，加重肝气郁结'},
          {'name': '酒精饮料', 'benefit': '刺激肝脏，加重气滞'},
          {'name': '咖啡浓茶', 'benefit': '刺激神经，影响情绪稳定'},
        ];
      case ConstitutionType.allergic:
        return [
          {'name': '海鲜', 'benefit': '易引起过敏反应'},
          {'name': '牛奶', 'benefit': '常见过敏原，引起消化不适'},
          {'name': '小麦', 'benefit': '含麸质，易引起过敏反应'},
          {'name': '坚果', 'benefit': '常见过敏原，引起皮肤过敏'},
          {'name': '鸡蛋', 'benefit': '蛋白质易引起过敏反应'},
          {'name': '大豆', 'benefit': '常见过敏原，引起消化不适'},
        ];
    }
  }

  List<Map<String, String>> _getRecommendedExercises() {
    switch (_constitutionInfo.type) {
      case ConstitutionType.balanced:
        return [
          {'name': '慢跑', 'description': '每周3-4次，每次30分钟左右，保持中等强度'},
          {'name': '游泳', 'description': '全身性运动，每周1-2次，每次30-45分钟'},
          {'name': '健身操', 'description': '有氧运动，每周2-3次，每次45-60分钟'},
        ];
      case ConstitutionType.qiDeficiency:
        return [
          {'name': '太极拳', 'description': '柔和缓慢，能增强体质，每天晨练20-30分钟'},
          {'name': '散步', 'description': '轻缓有氧运动，每天晚饭后30分钟'},
          {'name': '八段锦', 'description': '中医养生功法，每天练习15-20分钟'},
        ];
      case ConstitutionType.yangDeficiency:
        return [
          {'name': '八段锦', 'description': '可温阳补气，每天晨练15-20分钟'},
          {'name': '慢走', 'description': '温和有氧运动，每天30分钟，注意保暖'},
          {'name': '易筋经', 'description': '增强阳气的功法，每天练习20分钟'},
        ];
      case ConstitutionType.yinDeficiency:
        return [
          {'name': '太极拳', 'description': '柔和缓慢，滋阴润燥，每天晨练或晚练20-30分钟'},
          {'name': '瑜伽', 'description': '舒缓放松，每周2-3次，每次30-45分钟'},
          {'name': '五禽戏', 'description': '中医养生功法，每天练习15-20分钟'},
        ];
      case ConstitutionType.phlegmDampness:
        return [
          {'name': '快走', 'description': '中强度有氧运动，每天45-60分钟'},
          {'name': '慢跑', 'description': '消耗脂肪，每周3-4次，每次30分钟'},
          {'name': '游泳', 'description': '全身运动，促进代谢，每周2-3次，每次30-45分钟'},
        ];
      case ConstitutionType.dampnessHeat:
        return [
          {'name': '游泳', 'description': '在水中运动可清热祛湿，每周2-3次，每次30-45分钟'},
          {'name': '瑜伽', 'description': '舒缓放松，排汗祛湿，每周2-3次，每次45分钟'},
          {'name': '慢跑', 'description': '有氧运动，促进排汗，每周3次，每次30分钟'},
        ];
      case ConstitutionType.bloodStasis:
        return [
          {'name': '快走', 'description': '促进血液循环，每天30-45分钟'},
          {'name': '太极拳', 'description': '活血通络，每天练习30分钟'},
          {'name': '慢跑', 'description': '中强度有氧运动，每周3次，每次30分钟'},
        ];
      case ConstitutionType.qiStagnation:
        return [
          {'name': '户外徒步', 'description': '接触自然，放松心情，每周1-2次，每次1-2小时'},
          {'name': '瑜伽', 'description': '放松身心，每周2-3次，每次45分钟'},
          {'name': '团体球类运动', 'description': '增加社交互动，缓解压力，每周1-2次'},
        ];
      case ConstitutionType.allergic:
        return [
          {'name': '室内健身', 'description': '避免接触过敏原，每周3-4次，每次30-45分钟'},
          {'name': '瑜伽', 'description': '增强免疫力，每周2-3次，每次30-45分钟'},
          {'name': '游泳', 'description': '全身运动，减少过敏原接触，每周1-2次，每次30分钟'},
        ];
    }
  }

  List<String> _getAvoidExercises() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          '过度剧烈的运动，如高强度间歇训练',
          '单一重复的运动方式，应保持多样化',
          '不适合的极限运动，量力而行',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '长时间高强度有氧运动，如马拉松',
          '大重量力量训练，过度消耗能量',
          '空腹进行剧烈运动，加重气虚',
          '快速减重的激烈运动，如高强度间歇训练',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '在寒冷环境中的运动，如冬泳',
          '出汗过多的运动，如蒸桑拿后运动',
          '消耗大量能量的长时间运动',
          '早晨或深夜的户外运动',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '高温环境下的运动，如热瑜伽',
          '大量出汗的剧烈运动，如长跑',
          '竞技性强、情绪激动的运动比赛',
          '午后阳气最盛时的户外运动',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '低强度、不出汗的运动',
          '水中久坐类活动，增加湿气',
          '过于静态的活动，如久坐冥想',
          '湿度大环境中的运动',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '高温高湿环境下的运动',
          '过度剧烈导致大量出汗的运动',
          '热瑜伽等增加体内热量的运动',
          '午后强烈阳光下的户外活动',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '剧烈冲击性运动，如跳跃、撞击类',
          '长时间保持一个姿势的运动',
          '突然起始的高强度运动，未充分热身',
          '寒冷环境中的静态活动',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '单调重复的运动，容易加重郁闷',
          '封闭空间内的孤独运动',
          '高度紧张的竞技性运动',
          '需要严格规则约束的运动',
        ];
      case ConstitutionType.allergic:
        return [
          '花粉季节的户外运动',
          '空气污染严重时的户外活动',
          '尘土多的环境中运动，如土操场',
          '可能接触过敏原的水域游泳',
        ];
    }
  }

  Map<String, Map<String, String>> _getWeeklyExercisePlan() {
    final exercises = _getRecommendedExercises();

    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return {
          '周一': {'name': '散步', 'duration': '30分钟', 'intensity': '中低强度'},
          '周二': {'name': '太极拳', 'duration': '40分钟', 'intensity': '低强度'},
          '周三': {'name': '游泳', 'duration': '30分钟', 'intensity': '中强度'},
          '周四': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周五': {'name': '散步', 'duration': '45分钟', 'intensity': '中低强度'},
          '周六': {'name': '太极拳', 'duration': '60分钟', 'intensity': '低强度'},
          '周日': {'name': '休息日', 'duration': '-', 'intensity': '-'},
        };
      case ConstitutionType.qiDeficiency:
        return {
          '周一': {'name': '八段锦', 'duration': '15分钟', 'intensity': '低强度'},
          '周二': {'name': '缓慢散步', 'duration': '20分钟', 'intensity': '低强度'},
          '周三': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周四': {'name': '气功', 'duration': '15分钟', 'intensity': '低强度'},
          '周五': {'name': '缓慢散步', 'duration': '30分钟', 'intensity': '低强度'},
          '周六': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周日': {'name': '八段锦', 'duration': '20分钟', 'intensity': '低强度'},
        };
      case ConstitutionType.yangDeficiency:
        return {
          '周一': {'name': '快走', 'duration': '20分钟', 'intensity': '中低强度'},
          '周二': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周三': {'name': '太阳浴步行', 'duration': '15分钟', 'intensity': '低强度'},
          '周四': {'name': '导引功', 'duration': '15分钟', 'intensity': '低强度'},
          '周五': {'name': '快走', 'duration': '30分钟', 'intensity': '中低强度'},
          '周六': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周日': {'name': '太阳浴步行', 'duration': '20分钟', 'intensity': '低强度'},
        };
      case ConstitutionType.yinDeficiency:
        return {
          '周一': {'name': '瑜伽', 'duration': '30分钟', 'intensity': '低强度'},
          '周二': {'name': '晨间散步', 'duration': '20分钟', 'intensity': '低强度'},
          '周三': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周四': {'name': '太极', 'duration': '30分钟', 'intensity': '低强度'},
          '周五': {'name': '晨间散步', 'duration': '30分钟', 'intensity': '低强度'},
          '周六': {'name': '瑜伽', 'duration': '45分钟', 'intensity': '低强度'},
          '周日': {'name': '休息日', 'duration': '-', 'intensity': '-'},
        };
      case ConstitutionType.phlegmDampness:
        return {
          '周一': {'name': '快走', 'duration': '30分钟', 'intensity': '中强度'},
          '周二': {'name': '健身操', 'duration': '30分钟', 'intensity': '中高强度'},
          '周三': {'name': '爬楼梯', 'duration': '15分钟', 'intensity': '中高强度'},
          '周四': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周五': {'name': '快走', 'duration': '45分钟', 'intensity': '中强度'},
          '周六': {'name': '健身操', 'duration': '30分钟', 'intensity': '中高强度'},
          '周日': {'name': '休息日', 'duration': '-', 'intensity': '-'},
        };
      case ConstitutionType.dampnessHeat:
        return {
          '周一': {'name': '游泳', 'duration': '30分钟', 'intensity': '中强度'},
          '周二': {'name': '舒缓瑜伽', 'duration': '30分钟', 'intensity': '低强度'},
          '周三': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周四': {'name': '慢跑', 'duration': '20分钟', 'intensity': '中强度'},
          '周五': {'name': '游泳', 'duration': '30分钟', 'intensity': '中强度'},
          '周六': {'name': '舒缓瑜伽', 'duration': '30分钟', 'intensity': '低强度'},
          '周日': {'name': '休息日', 'duration': '-', 'intensity': '-'},
        };
      case ConstitutionType.bloodStasis:
        return {
          '周一': {'name': '有氧舞蹈', 'duration': '30分钟', 'intensity': '中强度'},
          '周二': {'name': '太极拳', 'duration': '30分钟', 'intensity': '低强度'},
          '周三': {'name': '走-跑交替', 'duration': '30分钟', 'intensity': '中强度'},
          '周四': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周五': {'name': '有氧舞蹈', 'duration': '30分钟', 'intensity': '中强度'},
          '周六': {'name': '太极拳', 'duration': '40分钟', 'intensity': '低强度'},
          '周日': {'name': '休息日', 'duration': '-', 'intensity': '-'},
        };
      case ConstitutionType.qiStagnation:
        return {
          '周一': {'name': '广场舞', 'duration': '30分钟', 'intensity': '中强度'},
          '周二': {'name': '深呼吸散步', 'duration': '30分钟', 'intensity': '低强度'},
          '周三': {'name': '八段锦', 'duration': '15分钟', 'intensity': '低强度'},
          '周四': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周五': {'name': '广场舞', 'duration': '45分钟', 'intensity': '中强度'},
          '周六': {'name': '深呼吸散步', 'duration': '30分钟', 'intensity': '低强度'},
          '周日': {'name': '休息日', 'duration': '-', 'intensity': '-'},
        };
      case ConstitutionType.allergic:
        return {
          '周一': {'name': '室内健走', 'duration': '30分钟', 'intensity': '中低强度'},
          '周二': {'name': '室内瑜伽', 'duration': '30分钟', 'intensity': '低强度'},
          '周三': {'name': '休息日', 'duration': '-', 'intensity': '-'},
          '周四': {'name': '游泳', 'duration': '30分钟', 'intensity': '中强度'},
          '周五': {'name': '室内健走', 'duration': '30分钟', 'intensity': '中低强度'},
          '周六': {'name': '室内瑜伽', 'duration': '45分钟', 'intensity': '低强度'},
          '周日': {'name': '休息日', 'duration': '-', 'intensity': '-'},
        };
    }
  }

  List<String> _getSleepSuggestions() {
    switch (_constitutionInfo.type) {
      case ConstitutionType.balanced:
        return [
          '保持规律作息，晚11点前入睡',
          '睡前避免使用电子设备',
          '保持睡眠环境安静、舒适',
          '睡前可以泡脚放松',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '充分休息，保证7-8小时睡眠',
          '宜早睡晚起，避免熬夜',
          '午间可适当小憩30分钟',
          '睡前喝杯温热牛奶或红枣水有助于入睡',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '早睡早起，顺应自然规律',
          '保持卧室温暖，被褥厚实',
          '睡前用热水泡脚，促进血液循环',
          '避免在阴冷潮湿环境中久留',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '避免熬夜，早睡养阴',
          '保持卧室凉爽通风',
          '睡前避免情绪激动和剧烈运动',
          '可在睡前喝杯温热牛奶或蜂蜜水',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '早睡早起，避免懒散赖床',
          '睡觉时头部可稍微垫高，有利于痰液下行',
          '避免睡前大量饮水',
          '保持卧室通风干燥',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '保持规律作息，避免熬夜',
          '睡前洗个温水澡，促进身体散热',
          '保持卧室通风，但避免直接吹风',
          '选择透气性好的床上用品',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '保持规律作息，避免长时间卧床不起',
          '睡觉姿势宜舒展，避免蜷缩',
          '睡前可进行轻柔按摩，促进血液循环',
          '避免长时间保持一个姿势',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '保持规律作息，避免焦虑影响睡眠',
          '睡前做些放松活动，如听轻音乐',
          '睡前可进行腹式呼吸，帮助放松',
          '保持愉悦心情，避免情绪波动',
        ];
      case ConstitutionType.allergic:
        return [
          '保持卧室清洁，减少过敏原',
          '使用防过敏床上用品',
          '睡前洗澡，去除可能附着的过敏原',
          '必要时使用空气净化器',
        ];
    }
  }

  List<String> _getEnvironmentalAdjustments() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          '保持居室通风，空气流通',
          '室温适中，避免过冷过热',
          '光线充足但不刺眼',
          '环境整洁有序，避免杂乱',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '室温稍高，避免寒冷',
          '避免潮湿环境，保持干燥',
          '光线充足，增强活力',
          '减少噪音干扰，保持安静',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '室内温暖，冬季可增加加热设备',
          '床铺温暖，可使用电热毯',
          '避免在阴冷潮湿环境中久留',
          '沐浴水温适宜，不宜过凉',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '保持室内温度适中，避免过热',
          '保持环境湿润，可使用加湿器',
          '光线柔和，避免强光刺激',
          '居室安静，避免噪音刺激',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '保持居室干燥，避免潮湿',
          '定期开窗通风，保持空气流通',
          '可使用除湿设备减少湿气',
          '避免在下雨天气长时间户外活动',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '保持室内清凉干爽，避免闷热',
          '空调温度适宜，不宜过低',
          '保持环境通风，减少湿气积聚',
          '避免高温高湿环境',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '室温适中，避免过冷环境',
          '保持环境温暖但不燥热',
          '避免长时间处于空调环境中',
          '保持家居环境畅通，避免阻碍行走',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '居室宽敞明亮，给人舒展感',
          '多用明亮色彩装饰，如黄色、橙色',
          '室内可放置绿植，增加生机',
          '保持空气流通，避免封闭闷热',
        ];
      case ConstitutionType.allergic:
        return [
          '保持室内环境清洁，减少灰尘',
          '使用空气净化器，过滤过敏原',
          '床上用品勤换洗，避免尘螨滋生',
          '避免养宠物或减少宠物进入卧室',
        ];
    }
  }

  List<Map<String, dynamic>> _getHealthMethods() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          {
            'name': '八段锦',
            'description': '传统导引养生功法，平衡阴阳，调和气血，适合平和体质日常锻炼',
            'steps': [
              '清晨起床后，双手搓热',
              '从头部开始，依次拍打头面、颈部、肩膀、手臂',
              '继续拍打胸腹、背部、腰部、臀部、大腿、小腿',
              '每个部位拍打30-50次，力度适中，有微热感即可'
            ]
          },
          {
            'name': '按摩足三里穴',
            'description': '位于膝盖下方四横指，外膝眼直下，经常按摩可健脾胃，增强体质',
            'steps': [
              '取坐姿或站姿，放松身体',
              '用掌根或拳头轻拍大腿内侧脾经',
              '从上到下拍打，力度适中，皮肤微红即可',
              '每日1-2次，每次3-5分钟'
            ]
          },
          {
            'name': '梳头百遍',
            'description': '每天早晚用木梳梳头，从前发际梳到后脑勺，促进头部血液循环',
            'steps': ['取坐姿或站姿，放松身体', '用木梳从头顶向后脑勺梳，每次梳36下', '每日早晚各一次，每次3-5分钟']
          },
          {
            'name': '温水洗脸',
            'description': '早晚用温水洗脸，既能清洁面部，又能保护皮肤，维持面部气血通畅',
            'steps': ['取温水，用手轻轻拍打面部', '再用温水洗净，保持面部清洁', '每日早晚各一次，每次3-5分钟']
          },
        ];
      case ConstitutionType.qiDeficiency:
        return [
          {
            'name': '腹式呼吸',
            'description': '每天早晚各练习10分钟，吸气时腹部鼓起，呼气时腹部回落，增强肺功能和气血运行',
            'steps': ['取坐姿，放松身体', '吸气时腹部鼓起，呼气时腹部回落', '每次练习10分钟，每日早晚各一次']
          },
          {
            'name': '按摩气海穴',
            'description': '位于脐下1.5寸，每天早晚按摩5分钟，有助于补气培元',
            'steps': ['取坐姿，放松身体', '用拇指指腹轻轻按压气海穴，顺时针方向按摩5分钟', '每日早晚各一次，每次3-5分钟']
          },
          {
            'name': '太极拳',
            'description': '柔和缓慢的运动，适合气虚体质，能增强体质而不耗气',
            'steps': [
              '取站姿，双脚与肩同宽，双手自然下垂',
              '吸气时，双手缓缓向上抬起，至胸前与肩同高',
              '呼气时，双手缓缓放下，恢复自然站立',
              '每日早晚各一次，每次3-5分钟'
            ]
          },
          {
            'name': '艾灸关元穴',
            'description': '位于脐下3寸，适当艾灸可温补元气，增强体质',
            'steps': ['取坐姿，放松身体', '用拇指指腹轻轻按压关元穴，顺时针方向旋转5分钟', '每日早晚各一次，每次3-5分钟']
          },
        ];
      case ConstitutionType.yangDeficiency:
        return [
          {
            'name': '搓手心',
            'description': '双手相互摩擦至发热，然后按摩腹部，每天早晚各一次，可温阳散寒',
            'steps': ['双手掌心相对，快速摩擦至发热', '热掌贴于腹部，顺时针方向按摩5分钟', '每日早晚各一次，每次3-5分钟']
          },
          {
            'name': '艾灸命门穴',
            'description': '位于后背第二、三腰椎棘突间，艾灸可温补肾阳，增强阳气',
            'steps': ['取俯卧位，暴露后背', '用拇指指腹轻轻按压命门穴，顺时针方向旋转5分钟', '每日早晚各一次，每次3-5分钟']
          },
          {
            'name': '热水泡脚',
            'description': '每晚睡前用40℃左右的热水泡脚20分钟，可温通经络，改善睡眠',
            'steps': [
              '取温水，倒入足浴盆中',
              '水温控制在40℃左右，水量以没过脚踝为宜',
              '泡脚时可轻轻按摩脚底和脚背，促进血液循环',
              '每次泡脚20分钟，每日早晚各一次'
            ]
          },
          {
            'name': '按摩涌泉穴',
            'description': '位于足底前三分之一处凹陷中，每天早晚按摩可温肾助阳',
            'steps': ['取坐姿，放松脚部', '用拇指指腹轻轻按压涌泉穴，顺时针方向旋转5分钟', '每日早晚各一次，每次3-5分钟']
          },
        ];
      case ConstitutionType.yinDeficiency:
        return [
          {
            'name': '静坐冥想',
            'description': '每天找一个安静的时间，静坐15-20分钟，调息凝神，滋养阴精',
            'steps': [
              '找一个安静的地方，保持背部挺直',
              '闭上眼睛，放松身体，保持呼吸均匀',
              '吸气时，想象能量进入体内，呼气时，感受能量离开身体',
              '每次练习15-20分钟，每日早晚各一次'
            ]
          },
          {
            'name': '按摩太溪穴',
            'description': '位于内踝后方与跟腱之间的凹陷处，按摩可滋阴补肾',
            'steps': ['取坐姿，放松脚部', '用拇指指腹轻轻按压太溪穴，顺时针方向旋转5分钟', '每日早晚各一次，每次3-5分钟']
          },
          {
            'name': '温水洗浴',
            'description': '使用温水而非热水洗浴，避免过度耗损阴液',
            'steps': [
              '取温水，倒入浴盆中',
              '水温控制在38-40℃，水量以没过身体为宜',
              '沐浴时可轻轻按摩身体，促进血液循环',
              '每次沐浴20分钟，每日早晚各一次'
            ]
          },
          {
            'name': '睡前泡脚',
            'description': '睡前用温水泡脚15分钟，加入一些滋阴药材如枸杞，有助于安神助眠',
            'steps': [
              '取温水，倒入足浴盆中',
              '水温控制在38-40℃，水量以没过脚踝为宜',
              '泡脚时可轻轻按摩脚底和脚背，促进血液循环',
              '每次泡脚15分钟，加入适量枸杞，每日早晚各一次'
            ]
          },
        ];
      case ConstitutionType.phlegmDampness:
        return [
          {
            'name': '拍打身体',
            'description': '每天早晚用手掌轻拍全身，特别是四肢和腹部，促进气血循环，祛除湿气',
            'steps': [
              '取坐姿或站姿，放松身体',
              '用掌根或拳头轻拍全身，特别是四肢和腹部，力度适中，每次拍打3-5分钟',
              '每日早晚各一次，每次3-5分钟'
            ]
          },
          {
            'name': '按摩丰隆穴',
            'description': '位于小腿外侧，外踝尖上8寸，胫骨前缘外一横指处，按摩可化痰祛湿',
            'steps': [
              '取坐姿或站姿，放松小腿',
              '用拇指指腹轻轻按压丰隆穴，顺时针方向旋转5分钟',
              '每日早晚各一次，每次3-5分钟'
            ]
          },
          {
            'name': '六字诀呼吸法',
            'description': '吐纳呼吸法，特别是"呬"字诀，对祛除体内湿气和痰浊有帮助',
            'steps': [
              '取站姿，双脚与肩同宽，双手自然下垂',
              '吸气时，用鼻吸气，口呼气，同时腹部放松',
              '呼气时，用口呼气，鼻吸气，同时腹部收紧',
              '每次练习10-15次，每日早晚各一次'
            ]
          },
          {
            'name': '干刷皮肤',
            'description': '使用天然鬃毛刷，在洗澡前干刷全身皮肤，促进血液循环和淋巴排毒',
            'steps': [
              '取站姿，放松身体',
              '用天然鬃毛刷从上到下轻轻刷遍全身，特别是四肢和腹部',
              '每次干刷3-5分钟，每日早晚各一次'
            ]
          },
        ];
      case ConstitutionType.dampnessHeat:
        return [
          {
            'name': '刮痧',
            'description': '在背部和四肢刮痧，有助于散热祛湿，改善湿热症状',
            'steps': [
              '取坐姿或站姿，放松身体',
              '用刮痧板在背部和四肢刮拭，力度适中，每次刮拭3-5分钟',
              '每日1-2次，每次3-5分钟'
            ]
          },
          {
            'name': '按摩阴陵泉穴',
            'description': '位于小腿内侧，膝盖内侧凹陷下方，胫骨内侧缘后方，按摩可清利湿热',
            'steps': [
              '取坐姿或站姿，放松小腿',
              '用拇指指腹轻轻按压阴陵泉穴，顺时针方向旋转5分钟',
              '每日早晚各一次，每次3-5分钟'
            ]
          },
          {
            'name': '冷水洗脸',
            'description': '早晚用凉水洗脸，特别是在夏季，可清热降火',
            'steps': ['取凉水，用手轻轻拍打面部', '再用凉水洗净，保持面部清洁', '每日早晚各一次，每次3-5分钟']
          },
          {
            'name': '泡茶饮用',
            'description': '常饮绿茶、菊花茶等清热祛湿的茶饮，有助于清热利湿',
            'steps': ['取适量绿茶或菊花，用开水冲泡', '每日早晚各一次，每次3-5分钟']
          },
        ];
      case ConstitutionType.bloodStasis:
        return [
          {
            'name': '拔罐',
            'description': '在背部和疼痛部位拔罐，有助于活血化瘀，缓解疼痛',
            'steps': [
              '取俯卧位，暴露背部',
              '在疼痛部位拔罐，每次拔罐5-10分钟，间隔3-5天',
              '每日1-2次，每次3-5分钟'
            ]
          },
          {
            'name': '按摩血海穴',
            'description': '位于大腿内侧，膝盖上方，按摩可活血化瘀，改善血液循环',
            'steps': [
              '取坐姿或站姿，放松大腿',
              '用拇指指腹轻轻按压血海穴，顺时针方向旋转5分钟',
              '每日早晚各一次，每次3-5分钟'
            ]
          },
          {
            'name': '热敷',
            'description': '对疼痛部位进行热敷，促进局部血液循环，缓解疼痛',
            'steps': [
              '取热水，倒入热敷袋中',
              '水温控制在40-45℃，水量以没过疼痛部位为宜',
              '热敷10-15分钟，每日1-2次'
            ]
          },
          {
            'name': '八段锦',
            'description': '传统导引养生功法，特别是"两手攀足固肾腰"这一式，有助于活血化瘀',
            'steps': [
              '取俯卧位，暴露后背',
              '双手十指交叉，掌心向上，放在腰后',
              '吸气时，双手用力向上抬起，呼气时，双手放松',
              '重复10-15次，每日早晚各一次'
            ]
          },
        ];
      case ConstitutionType.qiStagnation:
        return [
          {
            'name': '深呼吸',
            'description': '每天进行几次深呼吸练习，吸气时腹部扩张，呼气时腹部收缩，有助于疏肝理气',
            'steps': [
              '取站姿，双脚与肩同宽，双手自然下垂',
              '吸气时，腹部扩张，呼气时，腹部收缩',
              '每次练习3-5次，每日早晚各一次'
            ]
          },
          {
            'name': '按摩太冲穴',
            'description': '位于足背第一、二跖骨结合部之前的凹陷处，按摩可疏肝解郁',
            'steps': ['取坐姿，放松脚部', '用拇指指腹轻轻按压太冲穴，顺时针方向旋转5分钟', '每日早晚各一次，每次3-5分钟']
          },
          {
            'name': '八段锦',
            'description': '传统导引养生功法，特别是"左右开弓似射雕"这一式，有助于疏肝理气',
            'steps': [
              '取站姿，双脚与肩同宽，双手自然下垂',
              '吸气时，双手向两侧平举，呼气时，双手收回',
              '重复10-15次，每日早晚各一次'
            ]
          },
          {
            'name': '腹部按摩',
            'description': '顺时针按摩腹部，有助于促进肠胃蠕动，缓解气滞',
            'steps': [
              '取坐姿，放松腹部',
              '用掌根或拳头顺时针方向按摩腹部，每次按摩3-5分钟',
              '每日早晚各一次，每次3-5分钟'
            ]
          },
        ];
      case ConstitutionType.allergic:
        return [
          {
            'name': '穴位按摩',
            'description': '按摩迎香穴（位于鼻翼两侧）和肺俞穴（位于背部第三胸椎棘突旁开1.5寸），有助于缓解过敏症状',
            'steps': [
              '用拇指指腹轻轻按压迎香穴（鼻翼两侧）',
              '再用拇指指腹轻轻按压肺俞穴（背部第三胸椎棘突旁开1.5寸）',
              '每次按压1-2分钟，力度适中，每日早晚各一次'
            ]
          },
          {
            'name': '盐水洗鼻',
            'description': '使用生理盐水清洗鼻腔，有助于清除过敏原，缓解鼻塞症状',
            'steps': ['取生理盐水，用棉签蘸取适量，轻轻涂抹鼻腔内壁', '每日早晚各一次，每次3-5分钟']
          },
          {
            'name': '蒸汽吸入',
            'description': '吸入温热蒸汽，有助于湿润呼吸道，缓解过敏症状',
            'steps': ['取温水，倒入杯中，加入适量菊花、枸杞等中药材', '用开水冲泡，待水温降至适宜温度，深吸蒸汽，每日早晚各一次']
          },
          {
            'name': '冷敷',
            'description': '对过敏部位进行冷敷，有助于减轻炎症和瘙痒',
            'steps': ['取凉水，倒入小碗中，加入适量冰块', '将小碗放在过敏部位，保持10-15分钟，每日早晚各一次']
          },
        ];
    }
  }

  // 放松技巧数据
  List<Map<String, dynamic>> _getRelaxationTechniques() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          {'name': '自然呼吸法', 'description': '每日进行10-15分钟的自然呼吸练习，保持呼吸均匀舒适'},
          {'name': '渐进放松法', 'description': '从脚部开始，逐渐向上放松全身各部位肌肉'},
          {'name': '正念冥想', 'description': '专注当下感受，接纳各种情绪和感觉，不加评判'},
        ];
      case ConstitutionType.qiDeficiency:
        return [
          {'name': '补气呼吸法', 'description': '吸气时想象能量进入体内，呼气时感受疲劳离开身体'},
          {'name': '温和自我按摩', 'description': '轻揉合谷、足三里、气海等穴位，补充能量'},
          {'name': '养生功', 'description': '进行简单的养生功法，如八段锦中的"两手托天理三焦"'},
        ];
      case ConstitutionType.yangDeficiency:
        return [
          {'name': '温阳呼吸法', 'description': '吸气时想象温暖阳光进入体内，呼气时感受寒气排出'},
          {'name': '温灸法', 'description': '适当对命门、关元等穴位进行艾灸温暖'},
          {'name': '搓手生热', 'description': '搓热双手后贴在丹田或腰部，感受热量传递'},
        ];
      case ConstitutionType.yinDeficiency:
        return [
          {'name': '滋阴呼吸法', 'description': '缓慢深长呼吸，呼气时间长于吸气，心中默念"静"字'},
          {'name': '月光冥想', 'description': '想象沐浴在柔和月光中，感受清凉滋润身心'},
          {'name': '内视冥想', 'description': '闭目内观，感受体内流动的能量，特别关注静心'},
        ];
      case ConstitutionType.phlegmDampness:
        return [
          {'name': '祛湿呼吸法', 'description': '呼气时想象湿气从体内排出，吸气时感受清爽空气进入'},
          {'name': '轻拍排痰', 'description': '轻拍胸背部，帮助松动痰湿'},
          {'name': '温阳散寒功', 'description': '进行简单的温阳散寒功法，如搓手、拍打等'},
        ];
      case ConstitutionType.dampnessHeat:
        return [
          {'name': '凉息法', 'description': '想象吸入清凉的气息，呼出炙热的浊气'},
          {'name': '莲花冥想', 'description': '想象自己如莲花般出淤泥而不染，清净自在'},
          {'name': '音乐放松', 'description': '聆听自然音乐，如流水声，消除心中烦躁'},
        ];
      case ConstitutionType.bloodStasis:
        return [
          {'name': '振动放松', 'description': '全身轻微抖动，如树叶摇曳，促进血液循环'},
          {'name': '流水冥想', 'description': '想象血液如流水般顺畅流动全身'},
          {'name': '轻柔拍打', 'description': '轻拍身体各部位，特别是四肢，活血化瘀'},
        ];
      case ConstitutionType.qiStagnation:
        return [
          {'name': '情绪宣泄', 'description': '在安全环境中表达压抑情绪，如大声喊叫、哭泣'},
          {'name': '胸部开展', 'description': '张开双臂，挺胸深呼吸，打开胸腔'},
          {'name': '笑声疗法', 'description': '每天大笑几分钟，放松横膈膜，疏通气机'},
        ];
      case ConstitutionType.allergic:
        return [
          {'name': '防护冥想', 'description': '想象体表形成保护层，阻挡外界致敏源'},
          {'name': '净化呼吸', 'description': '专注呼吸，想象呼入清新空气，呼出有害物质'},
          {'name': '身体扫描', 'description': '关注身体各部位感受，学习与不适感和平共处'},
        ];
    }
  }

  // 在类中添加 _buildFoodGrid 方法
  Widget _buildFoodGrid(List<Map<String, dynamic>> foods, bool isRecommended) {
    return GridView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 2.5,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: foods.length,
      itemBuilder: (context, index) {
        final food = foods[index];
        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          color: isRecommended
              ? Colors.green.withAlpha(30)
              : Colors.red.withAlpha(30),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  food['name'],
                  style: AppTypography.body1Style
                      .copyWith(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 4),
                Text(
                  food['benefit'],
                  style: AppTypography.captionStyle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // 添加 _buildMealExample 方法
  Widget _buildMealExample(String mealTime, Map<String, dynamic> meal) {
    return Card(
      elevation: 2,
      margin: EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  mealTime,
                  style: AppTypography.heading4Style.copyWith(
                    color: _constitutionInfo.color,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Divider(
                      thickness: 1,
                      color: _constitutionInfo.color.withAlpha(100)),
                ),
              ],
            ),
            SizedBox(height: 12),
            Text(meal['description'], style: AppTypography.body1Style),
            SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: (meal['foods'] as List<String>)
                  .map((food) => Chip(
                        label: Text(food),
                        backgroundColor: _constitutionInfo.color.withAlpha(50),
                      ))
                  .toList(),
            ),
            if (meal['note'] != null) ...[
              SizedBox(height: 8),
              Text(
                '提示：${meal['note']}',
                style: AppTypography.captionStyle
                    .copyWith(fontStyle: FontStyle.italic),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // 添加 _getClothingRecommendations 方法
  List<String> _getClothingRecommendations() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          '根据季节变化及时增减衣物',
          '选择透气、舒适的天然面料',
          '避免过紧束缚的衣物',
          '保持鞋袜干爽，避免潮湿',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '适当多穿一些，保暖为主',
          '避免单薄衣物，特别是背部和腹部',
          '保持颈部温暖，可戴围巾',
          '鞋袜宽松舒适，避免压迫',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '冬季多穿保暖衣物，分层穿着',
          '始终保持脚部温暖，穿保暖袜子',
          '室内外温差大时注意增减衣物',
          '颈部、腰部、膝盖注意保暖',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '夏季避免过于单薄的衣物',
          '选择棉麻等透气材质',
          '颜色以柔和淡雅为主',
          '避免紧身衣物，保持舒适',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '选择透气吸汗的面料',
          '勤换衣物，保持干爽',
          '雨天及时更换潮湿衣物',
          '鞋子透气防潮，避免脚部潮湿',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '选择轻薄透气的衣物',
          '颜色以浅色为主，减少吸热',
          '材质选择棉麻等透气面料',
          '避免穿着化纤类容易闷热的衣物',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '衣物宽松舒适，避免过紧',
          '避免长时间穿紧身衣、束腰带',
          '保持四肢温暖，促进血液循环',
          '冬季注意保暖，防寒保暖',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '选择宽松舒适的衣物，避免束缚感',
          '颜色明亮活泼，增添愉悦感',
          '注意胸腹部保暖，但不宜过热',
          '领口宽松，避免颈部压迫感',
        ];
      case ConstitutionType.allergic:
        return [
          '选择纯棉等天然面料，避免化纤',
          '新衣物穿前充分清洗，去除残留物',
          '避免过度装饰，减少化学物质接触',
        ];
    }
  }

  // 添加日常作息建议方法
  List<String> _getDailyRoutine() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          '早睡早起，保持充足睡眠',
          '三餐规律，定时定量',
          '适量运动，劳逸结合',
          '工作学习与休息的平衡',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '保持充足睡眠，午间小憩',
          '避免过度劳累，量力而行',
          '生活规律，早睡早起',
          '避免熬夜和过度用脑',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '早睡早起，睡前做些热敷或按摩',
          '避免过早起床，特别是寒冷季节',
          '午休习惯养成，中午小憩30分钟',
          '避免在阴冷潮湿环境中久留',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '保证充足睡眠，避免熬夜',
          '中午适当休息，避免过度疲劳',
          '避免长时间处于高温环境',
          '劳逸结合，避免过度紧张',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '早睡早起，保持规律作息',
          '避免久坐不动，定时活动',
          '适当增加活动量，促进代谢',
          '避免饭后立即休息或睡觉',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '保持规律作息，不熬夜',
          '夏季避免在正午高温时外出',
          '避免长时间呆在潮湿闷热环境',
          '保持轻松心态，避免急躁情绪',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '作息规律，避免过度劳累',
          '避免长时间保持一个姿势',
          '养成定时站起来活动的习惯',
          '保持情绪稳定，避免大喜大悲',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '保持规律作息，但不过分拘束',
          '安排愉快活动，保持心情舒畅',
          '工作间隙做深呼吸或小活动',
          '培养兴趣爱好，丰富生活内容',
        ];
      case ConstitutionType.allergic:
        return [
          '规律作息，增强身体抵抗力',
          '避免过度疲劳，影响免疫功能',
          '季节变化时注意调整作息',
          '保持室内环境清洁，定期通风',
        ];
    }
  }

  // 添加情绪特点方法
  List<String> _getEmotionalCharacteristics() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          '情绪稳定，不易波动',
          '心态积极乐观，适应能力强',
          '遇事冷静，理性思考',
          '人际关系和谐，善于沟通',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '容易感到疲惫，精神不足',
          '有时出现焦虑或担忧情绪',
          '面对压力容易感到力不从心',
          '需要更多休息和鼓励支持',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '性格偏内向，不喜欢冷环境',
          '遇寒冷天气情绪容易低落',
          '冬季可能出现季节性情绪变化',
          '喜温暖环境，在温暖中情绪更佳',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '性格偏急躁，易焦虑',
          '情绪波动较大，耐心较差',
          '对刺激较敏感，容易激动',
          '睡眠质量影响情绪稳定性',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '情绪反应偏缓慢',
          '思维灵活性较差，固执倾向',
          '情绪变化不明显，但持续时间长',
          '容易产生消极情绪，不易排解',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '容易烦躁不安，尤其在闷热环境',
          '情绪波动大，易怒易躁',
          '在凉爽环境中情绪明显改善',
          '压力下容易出现口干舌燥、心烦',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '情绪变化缓慢但持久',
          '对疼痛敏感，影响情绪',
          '容易忧郁或固执己见',
          '情绪低落时不易自我调整',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '情绪容易抑郁，喜忧参半',
          '情绪波动明显，喜怒无常',
          '容易感到胸闷气短、情绪不畅',
          '善于表达情绪有助改善状态',
        ];
      case ConstitutionType.allergic:
        return [
          '过敏发作时情绪烦躁',
          '对环境变化敏感，影响情绪',
          '季节交替时情绪波动较大',
          '环境舒适时情绪明显稳定',
        ];
    }
  }

  // 添加情绪调节建议方法
  List<String> _getEmotionalRegulationTips() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          '保持积极乐观的心态，学会放松自己',
          '合理安排工作和休息时间，避免过度劳累',
          '培养兴趣爱好，丰富生活内容',
          '与家人朋友沟通交流，减轻心理压力',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '适当增加休息时间，保证充足睡眠',
          '学会自我调节，保持平和心态',
          '进行适量的体育锻炼，增强体质',
          '保持良好的饮食习惯，避免辛辣刺激食物',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '增加户外活动，多晒太阳，补充阳气',
          '适当进行温阳运动，如太极拳、八段锦',
          '保持室内温暖，避免寒冷环境',
          '饮食中适当加入温阳食物，如羊肉、韭菜等',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '保持充足的睡眠，避免熬夜',
          '适当进行滋阴运动，如瑜伽、太极',
          '保持室内凉爽通风，避免过热',
          '饮食中适当加入滋阴食物，如银耳、百合等',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '保持良好的饮食习惯，避免油腻甜腻食物',
          '适当进行健脾祛湿运动，如快走、游泳',
          '保持室内干燥，避免潮湿环境',
          '饮食中适当加入健脾祛湿食物，如薏米、红豆等',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '保持良好的饮食习惯，避免辛辣刺激食物',
          '适当进行清热祛湿运动，如游泳、慢跑',
          '保持室内凉爽通风，避免闷热环境',
          '饮食中适当加入清热祛湿食物，如绿豆、苦瓜等',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '保持良好的饮食习惯，避免油腻食物',
          '适当进行活血化瘀运动，如慢跑、太极',
          '保持室内温暖，避免寒冷环境',
          '饮食中适当加入活血化瘀食物，如红枣、桃仁等',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '保持良好的情绪，避免郁闷不畅',
          '适当进行舒肝理气运动，如太极、八段锦',
          '保持室内通风，避免闷热环境',
          '饮食中适当加入舒肝理气食物，如柑橘、玫瑰花等',
        ];
      case ConstitutionType.allergic:
        return [
          '保持良好的饮食习惯，避免过敏食物',
          '适当进行增强免疫力运动，如慢跑、游泳',
          '保持室内清洁，避免过敏原',
          '饮食中适当加入增强免疫力食物，如蜂蜜、枸杞等',
        ];
    }
  }

  // 添加五行情绪关系方法
  List<Map<String, dynamic>> _getFiveElementEmotionRelation() {
    return [
      {
        'element': '木',
        'emotion': '怒',
        'description': '与肝胆相关，过度愤怒会伤肝，保持心情舒畅有助于肝气调和',
        'regulation': '深呼吸、散步、听轻音乐等方式舒缓情绪',
      },
      {
        'element': '火',
        'emotion': '喜',
        'description': '与心脏相关，过度兴奋会伤心，保持平和喜悦有助于心气调和',
        'regulation': '冥想、太极、瑜伽等方式平衡情绪',
      },
      {
        'element': '土',
        'emotion': '思',
        'description': '与脾胃相关，过度思虑会伤脾，保持思维清晰有助于脾气调和',
        'regulation': '规律作息、健康饮食、适度运动平衡思虑',
      },
      {
        'element': '金',
        'emotion': '忧',
        'description': '与肺相关，过度忧愁会伤肺，保持乐观开朗有助于肺气调和',
        'regulation': '深呼吸、户外活动、接触大自然舒缓忧愁',
      },
      {
        'element': '水',
        'emotion': '恐',
        'description': '与肾相关，过度恐惧会伤肾，保持勇敢自信有助于肾气调和',
        'regulation': '冥想、按摩、温水泡脚等方式缓解恐惧',
      },
    ];
  }

  Map<String, dynamic> _getBreakfastExample() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return {
          'description': '营养均衡的早餐，含优质蛋白质和复合碳水化合物，新鲜蔬果补充维生素',
          'foods': ['全麦面包', '煮鸡蛋', '牛奶', '水果沙拉'],
          'note': '可根据季节调整水果种类，保持多样化'
        };
      case ConstitutionType.qiDeficiency:
        return {
          'description': '温热易消化的早餐，补气健脾，避免生冷食物',
          'foods': ['小米粥', '蒸鸡蛋', '枣泥糕', '温热豆浆'],
          'note': '早餐宜温热，可适量加入大枣、枸杞等补气食材'
        };
      case ConstitutionType.yangDeficiency:
        return {
          'description': '温补阳气的早餐，温暖脾胃，提供持久能量',
          'foods': ['桂圆红枣粥', '核桃馒头', '姜枣茶', '煮熟的温热水果'],
          'note': '食物温热为佳，避免生冷食物，可加入适量生姜调味'
        };
      case ConstitutionType.yinDeficiency:
        return {
          'description': '滋阴润燥的早餐，避免燥热食物，保持营养均衡',
          'foods': ['银耳莲子粥', '全麦面包', '牛奶', '时令水果'],
          'note': '可在粥中加入一些滋阴食材，如百合、银耳等'
        };
      case ConstitutionType.phlegmDampness:
        return {
          'description': '清淡易消化的早餐，健脾祛湿，减少黏腻食物',
          'foods': ['薏米粥', '清蒸蛋', '低糖全麦面包', '温热茶水'],
          'note': '减少甜食和精制碳水化合物，避免油腻食物'
        };
      case ConstitutionType.dampnessHeat:
        return {
          'description': '清热祛湿的早餐，清淡易消化，减少热气积聚',
          'foods': ['绿豆粥', '蒸蛋', '全麦面包', '清热茶水'],
          'note': '食物清淡为主，避免辛辣刺激和油腻食物'
        };
      case ConstitutionType.bloodStasis:
        return {
          'description': '活血化瘀的早餐，促进血液循环，补充能量',
          'foods': ['红枣小米粥', '桃仁糕', '核桃', '温热果汁'],
          'note': '可适量加入活血食材，如红枣、黑木耳等'
        };
      case ConstitutionType.qiStagnation:
        return {
          'description': '理气和胃的早餐，增强消化功能，舒畅情绪',
          'foods': ['山楂小米粥', '柑橘', '全麦面包', '玫瑰花茶'],
          'note': '进食环境宜安静舒适，细嚼慢咽，保持愉悦心情'
        };
      case ConstitutionType.allergic:
        return {
          'description': '低致敏性早餐，避免常见过敏食物，增强免疫力',
          'foods': ['小米粥', '蒸蛋', '苹果', '蜂蜜水'],
          'note': '避免使用已知过敏食物，食材新鲜为宜'
        };
    }
  }

  Map<String, dynamic> _getLunchExample() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return {
          'description': '营养全面的午餐，荤素搭配，粗细粮结合，保持五味调和',
          'foods': ['糙米饭', '清炒时蔬', '蒸鱼', '番茄蛋汤'],
          'note': '注意食材多样化，七分饱为宜，饭后可适当休息'
        };
      case ConstitutionType.qiDeficiency:
        return {
          'description': '补气健脾的午餐，温热易消化，增强能量',
          'foods': ['山药粥', '炖鸡肉', '胡萝卜炒蛋', '黄芪汤'],
          'note': '食物宜温不宜凉，可适当增加蛋白质摄入'
        };
      case ConstitutionType.yangDeficiency:
        return {
          'description': '温阳补气的午餐，提供充足热量，温暖脾胃',
          'foods': ['糯米饭', '羊肉汤', '韭菜炒鸡蛋', '生姜红枣茶'],
          'note': '食物温热为主，可适量加入桂皮、生姜等温阳调料'
        };
      case ConstitutionType.yinDeficiency:
        return {
          'description': '滋阴润燥的午餐，清淡不燥热，增强水分摄入',
          'foods': ['米饭', '清蒸鲈鱼', '银耳炖雪梨', '百合汤'],
          'note': '烹调方式以蒸煮为主，避免煎炸烧烤等燥热做法'
        };
      case ConstitutionType.phlegmDampness:
        return {
          'description': '祛湿健脾的午餐，清淡少油，减少湿气产生',
          'foods': ['薏米饭', '清蒸鸡肉', '冬瓜汤', '炒苦瓜'],
          'note': '控制总量，七分饱为宜，减少精制糖和油脂摄入'
        };
      case ConstitutionType.dampnessHeat:
        return {
          'description': '清热祛湿的午餐，清淡易消化，增强排湿功能',
          'foods': ['绿豆粥', '清蒸鱼', '炒苦瓜', '莲子汤'],
          'note': '避免辛辣刺激和油腻食物，多饮水但不宜过量'
        };
      case ConstitutionType.bloodStasis:
        return {
          'description': '活血化瘀的午餐，增强血液循环，提供充足能量',
          'foods': ['糙米饭', '桃仁炒鸡丁', '红枣炖乌鸡', '黑木耳汤'],
          'note': '食物宜温不宜凉，可适量用醋调味以活血'
        };
      case ConstitutionType.qiStagnation:
        return {
          'description': '理气解郁的午餐，增加食欲，改善消化功能',
          'foods': ['薄荷蔬菜粥', '清蒸鱼', '炒豌豆', '山楂水'],
          'note': '进食环境宜安静愉悦，定时定量，不宜过饱'
        };
      case ConstitutionType.allergic:
        return {
          'description': '低致敏性午餐，新鲜健康，增强免疫功能',
          'foods': ['糙米饭', '清蒸鸡肉', '清炒蔬菜', '苹果汁'],
          'note': '食材新鲜，烹调简单，避免添加剂和复杂调味料'
        };
    }
  }

  Map<String, dynamic> _getDinnerExample() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return {
          'description': '清淡易消化的晚餐，蛋白质适量，减少碳水化合物，利于夜间消化吸收',
          'foods': ['糙米粥', '凉拌蔬菜', '清蒸鱼', '菌菇汤'],
          'note': '晚餐宜少食多样，睡前2小时完成进食'
        };
      case ConstitutionType.qiDeficiency:
        return {
          'description': '温补脾胃的晚餐，易消化吸收，不增加消化负担',
          'foods': ['小米粥', '蒸鸡胸肉', '清炒芦笋', '山药汤'],
          'note': '晚餐七分饱，避免过饱增加脾胃负担'
        };
      case ConstitutionType.yangDeficiency:
        return {
          'description': '温阳不伤阴的晚餐，温暖脾胃，提供修复能量',
          'foods': ['小米南瓜粥', '温炒韭菜', '蒸鲈鱼', '桂圆红枣汤'],
          'note': '晚餐量适中，保持温热但不过于燥热'
        };
      case ConstitutionType.yinDeficiency:
        return {
          'description': '滋阴润燥的晚餐，清淡易消化，补充水分',
          'foods': ['莲子百合粥', '清蒸豆腐', '凉拌黄瓜', '银耳汤'],
          'note': '晚餐宜清淡，避免辛辣油腻食物'
        };
      case ConstitutionType.phlegmDampness:
        return {
          'description': '健脾祛湿的晚餐，减少黏腻食物，易消化吸收',
          'foods': ['薏米粥', '香煎鲜鱼', '清炒芥蓝', '冬瓜汤'],
          'note': '晚餐宜少，避免睡前进食产生湿气'
        };
      case ConstitutionType.dampnessHeat:
        return {
          'description': '清热祛湿的晚餐，清淡为主，降低热气积聚',
          'foods': ['绿豆粥', '清蒸豆腐', '凉拌苦瓜', '莲子汤'],
          'note': '晚餐宜少食清淡，避免睡前进食导致湿热内生'
        };
      case ConstitutionType.bloodStasis:
        return {
          'description': '活血不伤胃的晚餐，易消化吸收，保护胃肠',
          'foods': ['小米粥', '清蒸鱼', '拌黑木耳', '玫瑰花茶'],
          'note': '晚餐宜少食，睡前适当活动促进血液循环'
        };
      case ConstitutionType.qiStagnation:
        return {
          'description': '舒肝理气的晚餐，易消化吸收，改善情绪',
          'foods': ['茯苓粥', '清蒸鱼', '凉拌芹菜', '陈皮茶'],
          'note': '晚餐宜少，进食环境舒适，保持愉悦心情'
        };
      case ConstitutionType.allergic:
        return {
          'description': '低致敏性晚餐，清淡易消化，降低过敏风险',
          'foods': ['薏米粥', '蒸鸡肉', '清炒西兰花', '蜂蜜水'],
          'note': '晚餐宜少，避免复杂配料和调味品'
        };
    }
  }

  List<String> _getExercisePrinciples() {
    switch (_constitutionType) {
      case ConstitutionType.balanced:
        return [
          '保持多样化运动，平衡力量和耐力训练',
          '每周进行3-5次中等强度有氧运动',
          '根据季节调整运动强度和方式',
          '注意劳逸结合，避免过度疲劳',
        ];
      case ConstitutionType.qiDeficiency:
        return [
          '选择温和、缓慢的运动方式',
          '运动量由小到大，循序渐进',
          '避免大强度、长时间运动',
          '运动后注意休息和恢复',
        ];
      case ConstitutionType.yangDeficiency:
        return [
          '选择能温阳的运动，如快走、慢跑',
          '避免在寒冷环境中长时间运动',
          '注意保暖，运动前充分热身',
          '运动量适中，避免过度消耗阳气',
        ];
      case ConstitutionType.yinDeficiency:
        return [
          '选择柔和平缓的运动，如太极、瑜伽',
          '避免大强度、高温环境下运动',
          '运动时间宜在早晨或傍晚凉爽时',
          '注意补充水分，避免过度出汗',
        ];
      case ConstitutionType.phlegmDampness:
        return [
          '选择有助排汗的有氧运动',
          '运动强度中等，时间可适当延长',
          '保持规律运动，每天至少30分钟',
          '避免在湿度大的环境中运动',
        ];
      case ConstitutionType.dampnessHeat:
        return [
          '选择有助排汗但不剧烈的运动',
          '避免在高温高湿环境中运动',
          '注意运动后及时擦干汗液，避免受凉',
          '运动期间充分补充水分',
        ];
      case ConstitutionType.bloodStasis:
        return [
          '选择促进血液循环的有氧运动',
          '运动前充分热身，避免突然运动',
          '运动强度适中，避免过度疲劳',
          '保持规律运动，不宜长期不动',
        ];
      case ConstitutionType.qiStagnation:
        return [
          '选择舒展性、放松性运动',
          '运动环境宜开阔、空气流通',
          '结合呼吸，注意情绪放松',
          '可尝试团体运动，增加社交互动',
        ];
      case ConstitutionType.allergic:
        return [
          '选择在污染少、过敏原少的环境中运动',
          '避免在花粉高发季节户外运动',
          '运动强度适中，避免过度运动降低免疫力',
          '注意观察身体反应，出现不适及时停止',
        ];
    }
  }
}
