import 'package:flutter/material.dart';
import 'package:auto_route/auto_route.dart';
import 'package:suoke_life/core/router/app_router.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';
import 'package:suoke_life/core/theme/app_typography.dart';
import 'package:suoke_life/core/widgets/app_widgets.dart' as app_widgets;
import 'package:suoke_life/presentation/life/models/constitution_type.dart';

@RoutePage()
class ConstitutionAssessmentPage extends StatefulWidget {
  const ConstitutionAssessmentPage({super.key});

  @override
  State<ConstitutionAssessmentPage> createState() =>
      _ConstitutionAssessmentPageState();
}

class _ConstitutionAssessmentPageState
    extends State<ConstitutionAssessmentPage> {
  // 当前问题索引
  int _currentQuestionIndex = 0;

  // 问题回答进度
  double get _progress => (_currentQuestionIndex + 1) / _questions.length;

  // 用户回答记录
  final Map<int, int> _userAnswers = {};

  // 模拟评估问题列表
  final List<AssessmentQuestion> _questions = [
    // 一、平和质相关问题
    AssessmentQuestion(
      '您的精力如何？',
      '平和体质的人通常精力充沛',
      relatedType: ConstitutionType.balanced,
      options: [
        '精力充沛，耐力好',
        '精力一般，有时会感到疲乏',
        '精力较差，容易疲劳',
        '非常容易疲劳，没有精神',
      ],
    ),
    AssessmentQuestion(
      '您的睡眠质量如何？',
      '平和体质的人通常睡眠良好',
      relatedType: ConstitutionType.balanced,
      options: [
        '睡眠质量好，一觉到天亮',
        '睡眠一般，偶尔会醒来',
        '睡眠较差，容易醒来或做梦',
        '严重失眠，难以入睡',
      ],
    ),

    // 二、气虚质相关问题
    AssessmentQuestion(
      '您说话时的声音如何？',
      '气虚体质的人通常说话声音较弱',
      relatedType: ConstitutionType.qiDeficiency,
      options: [
        '声音洪亮有力',
        '声音正常',
        '声音较弱，不愿多说话',
        '声音非常低弱，说话很费力',
      ],
    ),
    AssessmentQuestion(
      '您运动后出汗情况如何？',
      '气虚体质的人通常活动后易出汗',
      relatedType: ConstitutionType.qiDeficiency,
      options: [
        '正常出汗，停止活动后很快就不出汗了',
        '出汗较多，但停止活动后会慢慢停止',
        '稍微活动就大量出汗',
        '不活动时也容易出汗',
      ],
    ),

    // 三、阳虚质相关问题
    AssessmentQuestion(
      '您对寒冷的耐受程度如何？',
      '阳虚体质的人通常怕冷',
      relatedType: ConstitutionType.yangDeficiency,
      options: [
        '不怕冷，耐寒性好',
        '稍怕冷，但可以适应',
        '怕冷，需要比别人穿得多',
        '非常怕冷，即使天气不冷也感到冷',
      ],
    ),
    AssessmentQuestion(
      '您的手脚温度如何？',
      '阳虚体质的人通常手脚发凉',
      relatedType: ConstitutionType.yangDeficiency,
      options: [
        '手脚温暖',
        '手脚温度正常',
        '手脚经常发凉',
        '手脚总是冰凉',
      ],
    ),

    // 四、阴虚质相关问题
    AssessmentQuestion(
      '您是否经常感到口干舌燥？',
      '阴虚体质的人通常口干舌燥',
      relatedType: ConstitutionType.yinDeficiency,
      options: [
        '从不或极少感到口干',
        '偶尔感到口干',
        '经常感到口干，需要喝水',
        '总是感到口干，即使喝水也无法缓解',
      ],
    ),
    AssessmentQuestion(
      '您的手足心是否发热？',
      '阴虚体质的人通常手足心发热',
      relatedType: ConstitutionType.yinDeficiency,
      options: [
        '手足心凉爽',
        '手足心温度正常',
        '手足心经常发热',
        '手足心灼热，特别是晚上',
      ],
    ),

    // 五、痰湿质相关问题
    AssessmentQuestion(
      '您的体形如何？',
      '痰湿体质的人通常体形肥胖',
      relatedType: ConstitutionType.phlegmDampness,
      options: [
        '体形匀称',
        '略微偏胖',
        '明显肥胖',
        '非常肥胖，腹部松软',
      ],
    ),
    AssessmentQuestion(
      '您是否感到胸闷或痰多？',
      '痰湿体质的人通常胸闷痰多',
      relatedType: ConstitutionType.phlegmDampness,
      options: [
        '从不感到胸闷，痰很少',
        '偶尔感到胸闷或有痰',
        '经常感到胸闷，痰多',
        '总是感到胸闷气短，痰多黏稠',
      ],
    ),

    // 六、湿热质相关问题
    AssessmentQuestion(
      '您的面部皮肤油腻程度如何？',
      '湿热体质的人通常面部油腻',
      relatedType: ConstitutionType.dampnessHeat,
      options: [
        '面部干爽，不油腻',
        '面部略微油腻',
        '面部经常油腻发亮',
        '面部非常油腻，容易长痘痘',
      ],
    ),
    AssessmentQuestion(
      '您是否有口苦或口黏的感觉？',
      '湿热体质的人通常口苦口黏',
      relatedType: ConstitutionType.dampnessHeat,
      options: [
        '从不感到口苦或口黏',
        '偶尔感到口苦或口黏',
        '经常感到口苦或口黏',
        '总是感到口苦口黏，特别是早晨',
      ],
    ),

    // 七、血瘀质相关问题
    AssessmentQuestion(
      '您的面色如何？',
      '血瘀体质的人通常面色晦暗',
      relatedType: ConstitutionType.bloodStasis,
      options: [
        '面色红润有光泽',
        '面色正常',
        '面色略显晦暗',
        '面色晦暗或有色斑',
      ],
    ),
    AssessmentQuestion(
      '您是否容易出现瘀斑？',
      '血瘀体质的人通常容易出现瘀斑',
      relatedType: ConstitutionType.bloodStasis,
      options: [
        '从不或极少出现瘀斑',
        '轻微碰撞后可能出现瘀斑',
        '稍微碰撞就会出现瘀斑',
        '不碰撞也会出现不明原因的瘀斑',
      ],
    ),

    // 八、气郁质相关问题
    AssessmentQuestion(
      '您的情绪波动如何？',
      '气郁体质的人通常情绪波动大',
      relatedType: ConstitutionType.qiStagnation,
      options: [
        '情绪稳定，少有波动',
        '情绪基本稳定，偶有波动',
        '情绪波动较大',
        '情绪非常不稳定，容易焦虑忧郁',
      ],
    ),
    AssessmentQuestion(
      '您是否经常感到胸胁胀闷？',
      '气郁体质的人通常胸胁胀闷',
      relatedType: ConstitutionType.qiStagnation,
      options: [
        '从不感到胸胁胀闷',
        '偶尔感到胸胁胀闷',
        '经常感到胸胁胀闷，喜欢叹气',
        '总是感到胸胁胀闷，郁闷不舒',
      ],
    ),

    // 九、特禀质相关问题
    AssessmentQuestion(
      '您是否容易过敏？',
      '特禀体质的人通常容易过敏',
      relatedType: ConstitutionType.allergic,
      options: [
        '从不过敏',
        '偶尔对某些物质过敏',
        '对多种物质过敏',
        '严重过敏体质，经常发作',
      ],
    ),
    AssessmentQuestion(
      '您是否有家族过敏史？',
      '特禀体质的人通常有家族过敏史',
      relatedType: ConstitutionType.allergic,
      options: [
        '没有家族过敏史',
        '家族中有人偶尔过敏',
        '家族中有人经常过敏',
        '多位家族成员都有过敏史',
      ],
    ),
  ];

  // 获取当前问题
  AssessmentQuestion get _currentQuestion => _questions[_currentQuestionIndex];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('中医体质评估'),
        backgroundColor: AppColors.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // 进度条
          LinearProgressIndicator(
            value: _progress,
            backgroundColor: Colors.grey[200],
            valueColor:
                const AlwaysStoppedAnimation<Color>(AppColors.primaryColor),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 问题卡片
                  _buildQuestionCard(),

                  const SizedBox(height: 24.0),

                  // 选项按钮组
                  _buildOptionButtons(),

                  const SizedBox(height: 24.0),

                  // 导航按钮
                  _buildNavigationButtons(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 构建问题卡片
  Widget _buildQuestionCard() {
    return app_widgets.BasicCard(
      title: '问题 ${_currentQuestionIndex + 1}/${_questions.length}',
      leadingIcon: Icons.help_outline,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _currentQuestion.question,
            style: AppTypography.body1Style,
          ),
          const SizedBox(height: 8.0),
          Text(
            _currentQuestion.description,
            style: AppTypography.captionStyle.copyWith(
              color: AppColors.lightTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  // 构建选项按钮组
  Widget _buildOptionButtons() {
    return Column(
      children: List.generate(
        _currentQuestion.options.length,
        (index) => Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: app_widgets.RadioOptionButton(
            text: _currentQuestion.options[index],
            isSelected: _userAnswers[_currentQuestionIndex] == index,
            onTap: () {
              setState(() {
                _userAnswers[_currentQuestionIndex] = index;
              });
            },
          ),
        ),
      ),
    );
  }

  // 构建导航按钮
  Widget _buildNavigationButtons() {
    final bool isLastQuestion = _currentQuestionIndex == _questions.length - 1;
    final bool canContinue = _userAnswers.containsKey(_currentQuestionIndex);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // 上一步按钮
        if (_currentQuestionIndex > 0)
          app_widgets.OutlineButton(
            label: '上一题',
            prefixIcon: Icons.arrow_back,
            onPressed: _goToPreviousQuestion,
          )
        else
          const SizedBox(width: 120),

        // 下一步或完成按钮
        app_widgets.PrimaryButton(
          label: isLastQuestion ? '完成评估' : '下一题',
          prefixIcon: isLastQuestion ? Icons.check : Icons.arrow_forward,
          onPressed: canContinue
              ? (isLastQuestion ? _completeAssessment : _goToNextQuestion)
              : null,
        ),
      ],
    );
  }

  // 跳转到下一题
  void _goToNextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
      });
    }
  }

  // 跳转到上一题
  void _goToPreviousQuestion() {
    if (_currentQuestionIndex > 0) {
      setState(() {
        _currentQuestionIndex--;
      });
    }
  }

  // 完成评估并计算结果
  void _completeAssessment() {
    // 在实际应用中，这里应该计算各体质的分数
    // 并存储到数据库或状态管理中

    // 计算每种体质类型的分数
    Map<ConstitutionType, double> scores = {};

    // 遍历所有问题和回答
    for (int i = 0; i < _questions.length; i++) {
      // 如果用户回答了该问题
      if (_userAnswers.containsKey(i)) {
        final question = _questions[i];
        final answerIndex = _userAnswers[i]!;

        // 添加分数，答案索引越高，表示越符合该体质类型
        // 0-3分对应的权重为0.1, 0.4, 0.7, 1.0
        final score = 0.1 + 0.3 * answerIndex;

        // 累加到对应体质类型的总分
        scores[question.relatedType] =
            (scores[question.relatedType] ?? 0) + score;
      }
    }

    // 归一化分数，每种体质类型的分数范围为0-1
    scores.forEach((type, score) {
      // 每种体质有2个问题，满分为2.0
      scores[type] = score / 2.0;
    });

    // 处理未被评估的体质类型，给予一个默认低分
    ConstitutionType.values.forEach((type) {
      scores[type] ??= 0.05;
    });

    // 在实际应用中，这里应该存储计算结果
    // 此处简化处理，直接跳转到结果页面

    context.router.push(const ConstitutionResultRoute());
  }
}

/// 评估问题模型
class AssessmentQuestion {
  final String question;
  final String description;
  final ConstitutionType relatedType;
  final List<String> options;

  AssessmentQuestion(
    this.question,
    this.description, {
    required this.relatedType,
    required this.options,
  });
}
