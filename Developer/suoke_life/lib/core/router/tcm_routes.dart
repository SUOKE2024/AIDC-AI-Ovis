import 'package:auto_route/auto_route.dart';
import 'package:suoke_life/core/widgets/tcm/pulse/pulse_diagnosis_widget.dart';
import 'package:suoke_life/core/widgets/tcm/tongue/tongue_diagnosis_widget.dart';

/// TCM相关路由定义类
/// 这个类不会直接使用，仅用于组织路由
class TCMRoutes {
  // 私有构造函数，防止实例化
  TCMRoutes._();

  // 脉诊路由
  static const String pulseDiagnosisPath = '/tcm/pulse-diagnosis';
  static const String pulseDiagnosisName = 'PulseDiagnosisRoute';
  
  // 舌诊路由
  static const String tongueDiagnosisPath = '/tcm/tongue-diagnosis';
  static const String tongueDiagnosisName = 'TongueDiagnosisRoute';
}
