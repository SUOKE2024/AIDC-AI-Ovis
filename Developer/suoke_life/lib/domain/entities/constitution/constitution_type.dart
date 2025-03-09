/// 中医体质类型枚举
///
/// 根据中国中医科学院《中医体质分类与判定》标准，定义9种体质类型
enum ConstitutionType {
  /// 平和质
  balanced,

  /// 气虚质
  qiDeficiency,

  /// 阳虚质
  yangDeficiency,

  /// 阴虚质
  yinDeficiency,

  /// 痰湿质
  phlegmDampness,

  /// 湿热质
  dampnessHeat,

  /// 血瘀质
  bloodStasis,

  /// 气郁质
  qiStagnation,

  /// 过敏质
  allergic
}

/// 体质类型名称映射
extension ConstitutionTypeExtension on ConstitutionType {
  /// 获取体质类型的中文名称
  String get name {
    switch (this) {
      case ConstitutionType.balanced:
        return '平和体质';
      case ConstitutionType.qiDeficiency:
        return '气虚体质';
      case ConstitutionType.yangDeficiency:
        return '阳虚体质';
      case ConstitutionType.yinDeficiency:
        return '阴虚体质';
      case ConstitutionType.phlegmDampness:
        return '痰湿体质';
      case ConstitutionType.dampnessHeat:
        return '湿热体质';
      case ConstitutionType.bloodStasis:
        return '血瘀体质';
      case ConstitutionType.qiStagnation:
        return '气郁体质';
      case ConstitutionType.allergic:
        return '过敏体质';
    }
  }

  /// 获取体质类型的英文名称
  String get englishName {
    switch (this) {
      case ConstitutionType.balanced:
        return 'Balanced Constitution';
      case ConstitutionType.qiDeficiency:
        return 'Qi Deficiency Constitution';
      case ConstitutionType.yangDeficiency:
        return 'Yang Deficiency Constitution';
      case ConstitutionType.yinDeficiency:
        return 'Yin Deficiency Constitution';
      case ConstitutionType.phlegmDampness:
        return 'Phlegm-Dampness Constitution';
      case ConstitutionType.dampnessHeat:
        return 'Dampness-Heat Constitution';
      case ConstitutionType.bloodStasis:
        return 'Blood Stasis Constitution';
      case ConstitutionType.qiStagnation:
        return 'Qi Stagnation Constitution';
      case ConstitutionType.allergic:
        return 'Allergic Constitution';
    }
  }

  /// 获取体质类型的简短描述
  String get shortDescription {
    switch (this) {
      case ConstitutionType.balanced:
        return '阴阳气血调和，脏腑功能正常，对外界环境适应能力较强的体质状态。';
      case ConstitutionType.qiDeficiency:
        return '体内气息不足，气的推动、温煦和防御等功能减弱的体质状态。';
      case ConstitutionType.yangDeficiency:
        return '人体内阳气不足，温煦和推动功能减弱的体质状态。';
      case ConstitutionType.yinDeficiency:
        return '人体内阴液亏少，滋润和濡养功能失调的体质状态。';
      case ConstitutionType.phlegmDampness:
        return '体内水液代谢障碍，痰湿内停所形成的体质状态。';
      case ConstitutionType.dampnessHeat:
        return '体内湿热互结，湿热内蕴所形成的体质状态。';
      case ConstitutionType.bloodStasis:
        return '体内血液运行不畅，瘀滞所形成的体质状态。';
      case ConstitutionType.qiStagnation:
        return '体内气机郁滞，气的疏泄功能失调所形成的体质状态。';
      case ConstitutionType.allergic:
        return '对某些物质或刺激过敏反应的体质状态。';
    }
  }
}
