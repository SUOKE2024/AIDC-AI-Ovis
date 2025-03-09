import 'package:flutter/material.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/widgets/app_widgets.dart';
import 'package:suoke_life/core/widgets/tcm/pulse/pulse_diagnosis_widget.dart';

/// 脉诊服务页面
@RoutePage()
class PulseDiagnosisPage extends ConsumerWidget {
  const PulseDiagnosisPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('脉诊分析'),
        centerTitle: true,
        backgroundColor: AppColors.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 页面标题和介绍
              const Text(
                '脉诊分析',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 16),

              const Text(
                '脉诊是中医诊断的重要方法之一，通过辨别脉象的变化，可以了解人体的健康状况。',
                style: TextStyle(
                  fontSize: 16,
                  height: 1.5,
                ),
              ),

              const SizedBox(height: 24),

              // 脉诊功能介绍卡片
              BasicCard(
                title: '脉诊功能简介',
                leadingIcon: Icons.info_outline,
                content: const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '本功能支持：',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text('• 模拟12种传统脉象（浮脉、沉脉、迟脉等）'),
                      Text('• 通过摄像头采集脉搏数据进行分析'),
                      Text('• 显示脉象波形图和特征'),
                      Text('• 提供脉象临床意义解读'),
                      Text('• 分析结果可保存至健康档案'),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // 脉诊组件
              const PulseDiagnosisWidget(),

              const SizedBox(height: 24),

              // 专家建议
              BasicCard(
                title: '专家建议',
                leadingIcon: Icons.person,
                content: const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    '脉诊是中医诊断的重要手段，但仅作为健康评估的辅助工具，不可完全代替专业中医师的面诊。如有明显不适，请及时就医咨询。',
                    style: TextStyle(height: 1.5),
                  ),
                ),
              ),

              const SizedBox(height: 40),

              // 预约专业中医师按钮
              Center(
                child: PrimaryButton(
                  label: '预约专业中医师面诊',
                  prefixIcon: Icons.calendar_today,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('预约功能即将上线，敬请期待')),
                    );
                  },
                ),
              ),

              // 脉诊操作指南卡片
              BasicCard(
                title: '操作指南',
                leadingIcon: Icons.help_outline,
                content: const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    '脉诊操作指南内容',
                    style: TextStyle(height: 1.5),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
