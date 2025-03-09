import 'dart:math' as math;
import 'dart:ui';

/// 舌质特征
enum TongueBodyFeature {
  /// 淡白舌 - 气血不足
  pale,

  /// 淡红舌 - 正常
  normal,

  /// 红舌 - 热证
  red,

  /// 绛舌 - 热极或瘀血
  crimson,

  /// 青紫舌 - 寒或瘀血
  purple,

  /// 花剥舌 - 胃肠热盛
  flaked,

  /// 老嫩舌 - 体虚
  tender,
}

/// 舌苔特征
enum TongueCoatingFeature {
  /// 薄白苔 - 表证
  thinWhite,

  /// 白苔 - 寒证
  white,

  /// 厚白苔 - 寒湿
  thickWhite,

  /// 薄黄苔 - 里热轻
  thinYellow,

  /// 黄苔 - 里热重
  yellow,

  /// 厚黄苔 - 里热极重
  thickYellow,

  /// 灰黑苔 - 热极或寒极
  blackish,

  /// 腻苔 - 湿浊
  greasy,

  /// 干苔 - 津液不足
  dry,

  /// 无苔 - 胃气虚
  mirror,

  /// 剥苔 - 胃热伤阴
  peeled,
}

/// 舌形特征
enum TongueShapeFeature {
  /// 正常舌 - 舌形适中
  normal,

  /// 胖大舌 - 痰湿或气虚
  enlarged,

  /// 瘦薄舌 - 气血亏虚
  thin,

  /// 齿痕舌 - 脾虚湿盛
  toothMarked,

  /// 点刺舌 - 心热
  thorny,

  /// 裂纹舌 - 热伤津液
  cracked,

  /// 歪斜舌 - 风痰闭络
  deviated,

  /// 短缩舌 - 热盛伤津
  shortened,

  /// 颤动舌 - 肝风内动
  trembling,
}

/// 舌下络脉特征
enum TongueVeinFeature {
  /// 正常络脉 - 色淡红不怒张
  normal,

  /// 淡白络脉 - 气血不足
  pale,

  /// 青紫络脉 - 瘀血或寒凝
  purple,

  /// 怒张络脉 - 气滞血瘀
  swollen,
}

/// 舌诊特征
class TongueDiagnosisFeatures {
  /// 舌质特征
  final TongueBodyFeature bodyFeature;

  /// 舌质特征可信度（0-1）
  final double bodyConfidence;

  /// 舌苔特征
  final TongueCoatingFeature coatingFeature;

  /// 舌苔特征可信度（0-1）
  final double coatingConfidence;

  /// 舌形特征
  final TongueShapeFeature shapeFeature;

  /// 舌形特征可信度（0-1）
  final double shapeConfidence;

  /// 舌下络脉特征
  final TongueVeinFeature veinFeature;

  /// 舌下络脉特征可信度（0-1）
  final double veinConfidence;

  /// 构造函数
  const TongueDiagnosisFeatures({
    required this.bodyFeature,
    required this.bodyConfidence,
    required this.coatingFeature,
    required this.coatingConfidence,
    required this.shapeFeature,
    required this.shapeConfidence,
    required this.veinFeature,
    required this.veinConfidence,
  });

  /// 创建随机舌诊特征（用于测试）
  factory TongueDiagnosisFeatures.random() {
    final random = math.Random();

    // 随机特征
    final bodyFeature = TongueBodyFeature
        .values[random.nextInt(TongueBodyFeature.values.length)];
    final coatingFeature = TongueCoatingFeature
        .values[random.nextInt(TongueCoatingFeature.values.length)];
    final shapeFeature = TongueShapeFeature
        .values[random.nextInt(TongueShapeFeature.values.length)];
    final veinFeature = TongueVeinFeature
        .values[random.nextInt(TongueVeinFeature.values.length)];

    // 随机可信度（0.6-1.0范围内）
    final bodyConfidence = 0.6 + random.nextDouble() * 0.4;
    final coatingConfidence = 0.6 + random.nextDouble() * 0.4;
    final shapeConfidence = 0.6 + random.nextDouble() * 0.4;
    final veinConfidence = 0.6 + random.nextDouble() * 0.4;

    return TongueDiagnosisFeatures(
      bodyFeature: bodyFeature,
      bodyConfidence: bodyConfidence,
      coatingFeature: coatingFeature,
      coatingConfidence: coatingConfidence,
      shapeFeature: shapeFeature,
      shapeConfidence: shapeConfidence,
      veinFeature: veinFeature,
      veinConfidence: veinConfidence,
    );
  }

  /// 创建正常舌诊特征
  factory TongueDiagnosisFeatures.normal() {
    return const TongueDiagnosisFeatures(
      bodyFeature: TongueBodyFeature.normal,
      bodyConfidence: 0.95,
      coatingFeature: TongueCoatingFeature.thinWhite,
      coatingConfidence: 0.9,
      shapeFeature: TongueShapeFeature.normal,
      shapeConfidence: 0.95,
      veinFeature: TongueVeinFeature.normal,
      veinConfidence: 0.9,
    );
  }

  /// 获取舌质特征描述
  static String getBodyFeatureDescription(TongueBodyFeature feature) {
    switch (feature) {
      case TongueBodyFeature.pale:
        return '淡白舌';
      case TongueBodyFeature.normal:
        return '淡红舌';
      case TongueBodyFeature.red:
        return '红舌';
      case TongueBodyFeature.crimson:
        return '绛舌';
      case TongueBodyFeature.purple:
        return '青紫舌';
      case TongueBodyFeature.flaked:
        return '花剥舌';
      case TongueBodyFeature.tender:
        return '老嫩舌';
    }
  }

  /// 获取舌苔特征描述
  static String getCoatingFeatureDescription(TongueCoatingFeature feature) {
    switch (feature) {
      case TongueCoatingFeature.thinWhite:
        return '薄白苔';
      case TongueCoatingFeature.white:
        return '白苔';
      case TongueCoatingFeature.thickWhite:
        return '厚白苔';
      case TongueCoatingFeature.thinYellow:
        return '薄黄苔';
      case TongueCoatingFeature.yellow:
        return '黄苔';
      case TongueCoatingFeature.thickYellow:
        return '厚黄苔';
      case TongueCoatingFeature.blackish:
        return '灰黑苔';
      case TongueCoatingFeature.greasy:
        return '腻苔';
      case TongueCoatingFeature.dry:
        return '干苔';
      case TongueCoatingFeature.mirror:
        return '光剥苔';
      case TongueCoatingFeature.peeled:
        return '剥苔';
    }
  }

  /// 获取舌形特征描述
  static String getShapeFeatureDescription(TongueShapeFeature feature) {
    switch (feature) {
      case TongueShapeFeature.normal:
        return '正常舌';
      case TongueShapeFeature.enlarged:
        return '胖大舌';
      case TongueShapeFeature.thin:
        return '瘦薄舌';
      case TongueShapeFeature.toothMarked:
        return '齿痕舌';
      case TongueShapeFeature.thorny:
        return '点刺舌';
      case TongueShapeFeature.cracked:
        return '裂纹舌';
      case TongueShapeFeature.deviated:
        return '歪斜舌';
      case TongueShapeFeature.shortened:
        return '短缩舌';
      case TongueShapeFeature.trembling:
        return '颤动舌';
    }
  }

  /// 获取舌下络脉特征描述
  static String getVeinFeatureDescription(TongueVeinFeature feature) {
    switch (feature) {
      case TongueVeinFeature.normal:
        return '正常舌下络脉';
      case TongueVeinFeature.pale:
        return '淡白舌下络脉';
      case TongueVeinFeature.purple:
        return '青紫舌下络脉';
      case TongueVeinFeature.swollen:
        return '怒张舌下络脉';
    }
  }

  /// 获取舌质特征临床意义
  static String getBodyFeatureClinicalMeaning(TongueBodyFeature feature) {
    switch (feature) {
      case TongueBodyFeature.pale:
        return '表示气血不足，多见于气血两虚、寒证';
      case TongueBodyFeature.normal:
        return '表示气血调和，为正常舌象';
      case TongueBodyFeature.red:
        return '表示有热证，多见于外感热病、内伤热证';
      case TongueBodyFeature.crimson:
        return '表示热极或瘀血，多见于热入营血、温毒炽盛';
      case TongueBodyFeature.purple:
        return '表示寒凝或瘀血，多见于寒凝血瘀、气滞血瘀';
      case TongueBodyFeature.flaked:
        return '表示胃肠热盛，多见于温热病中后期';
      case TongueBodyFeature.tender:
        return '表示体虚，多见于久病体弱、气血两虚';
    }
  }

  /// 获取舌苔特征临床意义
  static String getCoatingFeatureClinicalMeaning(TongueCoatingFeature feature) {
    switch (feature) {
      case TongueCoatingFeature.thinWhite:
        return '表示表证或轻微寒湿，多见于外感初期';
      case TongueCoatingFeature.white:
        return '表示寒证，多见于外感风寒、胃肠寒证';
      case TongueCoatingFeature.thickWhite:
        return '表示寒湿较重，多见于寒湿停滞胃肠';
      case TongueCoatingFeature.thinYellow:
        return '表示里热较轻，多见于外感风热或热证初期';
      case TongueCoatingFeature.yellow:
        return '表示里热较重，多见于热病传里、胃肠热盛';
      case TongueCoatingFeature.thickYellow:
        return '表示里热极重，多见于热病深入、胃肠湿热';
      case TongueCoatingFeature.blackish:
        return '表示热极或寒极，多见于热深入营血或寒邪内闭';
      case TongueCoatingFeature.greasy:
        return '表示湿浊内停，多见于痰湿、食积';
      case TongueCoatingFeature.dry:
        return '表示津液不足，多见于热病伤津、阴虚';
      case TongueCoatingFeature.mirror:
        return '表示胃气虚弱，多见于慢性胃炎、脾胃虚弱';
      case TongueCoatingFeature.peeled:
        return '表示胃热伤阴，多见于胃阴不足、温热病后期';
    }
  }

  /// 获取舌形特征临床意义
  static String getShapeFeatureClinicalMeaning(TongueShapeFeature feature) {
    switch (feature) {
      case TongueShapeFeature.normal:
        return '舌形适中，柔软灵活，为正常舌象';
      case TongueShapeFeature.enlarged:
        return '表示痰湿内盛或气虚，多见于水湿内停、脾肾阳虚';
      case TongueShapeFeature.thin:
        return '表示气血亏虚，多见于久病体弱、血虚';
      case TongueShapeFeature.toothMarked:
        return '表示脾虚湿盛，多见于脾胃虚弱、水湿内停';
      case TongueShapeFeature.thorny:
        return '表示心热，多见于热入心包、温热病';
      case TongueShapeFeature.cracked:
        return '表示热伤津液，多见于热盛伤阴、阴虚内热';
      case TongueShapeFeature.deviated:
        return '表示风痰闭络，多见于中风、肝风内动';
      case TongueShapeFeature.shortened:
        return '表示热盛伤津，多见于温热病后期、热病亡阴';
      case TongueShapeFeature.trembling:
        return '表示肝风内动，多见于内风症、癫痫';
    }
  }

  /// 获取舌下络脉特征临床意义
  static String getVeinFeatureClinicalMeaning(TongueVeinFeature feature) {
    switch (feature) {
      case TongueVeinFeature.normal:
        return '舌下络脉色淡红，不怒张，为正常舌象';
      case TongueVeinFeature.pale:
        return '表示气血不足，多见于贫血、气血两虚';
      case TongueVeinFeature.purple:
        return '表示瘀血或寒凝，多见于血瘀、寒凝血瘀';
      case TongueVeinFeature.swollen:
        return '表示气滞血瘀，多见于心脉瘀阻、心血瘀滞';
    }
  }

  /// 获取舌质特征颜色
  static Color getBodyFeatureColor(TongueBodyFeature feature) {
    switch (feature) {
      case TongueBodyFeature.pale:
        return Color(0xFFF9E2E2);
      case TongueBodyFeature.normal:
        return Color(0xFFF8C7C7);
      case TongueBodyFeature.red:
        return Color(0xFFF86D6D);
      case TongueBodyFeature.crimson:
        return Color(0xFFE61E1E);
      case TongueBodyFeature.purple:
        return Color(0xFFC175E6);
      case TongueBodyFeature.flaked:
        return Color(0xFFFF9D9D);
      case TongueBodyFeature.tender:
        return Color(0xFFFFD9D9);
    }
  }

  /// 获取舌苔特征颜色
  static Color getCoatingFeatureColor(TongueCoatingFeature feature) {
    switch (feature) {
      case TongueCoatingFeature.thinWhite:
        return Color(0xFFF1F1F1);
      case TongueCoatingFeature.white:
        return Color(0xFFFFFFFF);
      case TongueCoatingFeature.thickWhite:
        return Color(0xFFEFEFEF);
      case TongueCoatingFeature.thinYellow:
        return Color(0xFFFFF2C4);
      case TongueCoatingFeature.yellow:
        return Color(0xFFFFE485);
      case TongueCoatingFeature.thickYellow:
        return Color(0xFFFFD624);
      case TongueCoatingFeature.blackish:
        return Color(0xFF5A5A5A);
      case TongueCoatingFeature.greasy:
        return Color(0xFFD8D8D8);
      case TongueCoatingFeature.dry:
        return Color(0xFFE6E6E6);
      case TongueCoatingFeature.mirror:
        return Color(0xFFFFC6C6);
      case TongueCoatingFeature.peeled:
        return Color(0xFFFFBDBD);
    }
  }
}

/// 舌诊分析结果模型
class TongueDiagnosisResult {
  /// 舌诊特征
  final TongueDiagnosisFeatures features;

  /// 分析文本
  final String analysisText;

  /// 主要证候列表
  final List<String> syndromes;

  /// 相关体质列表
  final List<String> constitutions;

  /// 调理建议列表
  final List<String> suggestions;

  /// 构造函数
  const TongueDiagnosisResult({
    required this.features,
    required this.analysisText,
    required this.syndromes,
    required this.constitutions,
    required this.suggestions,
  });

  /// 从特征创建结果
  factory TongueDiagnosisResult.fromFeatures(TongueDiagnosisFeatures features) {
    // 根据特征生成分析文本
    final analysisText = _generateAnalysisText(features);

    // 根据特征推导证候
    final syndromes = _deriveSyndromes(features);

    // 根据特征推导体质
    final constitutions = _deriveConstitutions(features);

    // 根据特征提供调理建议
    final suggestions = _deriveSuggestions(features);

    return TongueDiagnosisResult(
      features: features,
      analysisText: analysisText,
      syndromes: syndromes,
      constitutions: constitutions,
      suggestions: suggestions,
    );
  }

  /// 生成分析文本
  static String _generateAnalysisText(TongueDiagnosisFeatures features) {
    final bodyDesc =
        TongueDiagnosisFeatures.getBodyFeatureDescription(features.bodyFeature);
    final coatingDesc = TongueDiagnosisFeatures.getCoatingFeatureDescription(
        features.coatingFeature);
    final shapeDesc = TongueDiagnosisFeatures.getShapeFeatureDescription(
        features.shapeFeature);
    final veinDesc =
        TongueDiagnosisFeatures.getVeinFeatureDescription(features.veinFeature);

    return '舌诊显示您的舌象为$bodyDesc、$coatingDesc、$shapeDesc，舌下络脉为$veinDesc。'
        '${_getBodyFeatureMeaning(features.bodyFeature)}'
        '${_getCoatingFeatureMeaning(features.coatingFeature)}'
        '${_getShapeFeatureMeaning(features.shapeFeature)}'
        '${_getVeinFeatureMeaning(features.veinFeature)}';
  }

  /// 推导证候
  static List<String> _deriveSyndromes(TongueDiagnosisFeatures features) {
    final syndromes = <String>[];

    // 根据舌质判断证候
    switch (features.bodyFeature) {
      case TongueBodyFeature.pale:
        syndromes.add('气血不足');
        syndromes.add('阳虚');
        break;
      case TongueBodyFeature.red:
        syndromes.add('热证');
        break;
      case TongueBodyFeature.crimson:
        syndromes.add('热极');
        syndromes.add('瘀血');
        break;
      case TongueBodyFeature.purple:
        syndromes.add('寒凝血瘀');
        syndromes.add('瘀血');
        break;
      case TongueBodyFeature.flaked:
        syndromes.add('胃肠热盛');
        break;
      case TongueBodyFeature.tender:
        syndromes.add('体虚');
        break;
      case TongueBodyFeature.normal:
        // 正常舌质无特殊证候
        break;
    }

    // 根据舌苔判断证候
    switch (features.coatingFeature) {
      case TongueCoatingFeature.thinWhite:
        syndromes.add('表证');
        break;
      case TongueCoatingFeature.white:
        syndromes.add('寒证');
        break;
      case TongueCoatingFeature.thickWhite:
        syndromes.add('寒湿');
        break;
      case TongueCoatingFeature.thinYellow:
        syndromes.add('里热轻');
        break;
      case TongueCoatingFeature.yellow:
        syndromes.add('里热');
        break;
      case TongueCoatingFeature.thickYellow:
        syndromes.add('里热重');
        break;
      case TongueCoatingFeature.blackish:
        syndromes.add('热极');
        break;
      case TongueCoatingFeature.greasy:
        syndromes.add('湿浊');
        break;
      case TongueCoatingFeature.dry:
        syndromes.add('津液不足');
        break;
      case TongueCoatingFeature.mirror:
        syndromes.add('胃气虚');
        break;
      case TongueCoatingFeature.peeled:
        syndromes.add('胃热伤阴');
        break;
    }

    // 根据舌形判断证候
    switch (features.shapeFeature) {
      case TongueShapeFeature.enlarged:
        syndromes.add('痰湿内蕴');
        syndromes.add('气虚');
        break;
      case TongueShapeFeature.thin:
        syndromes.add('气血亏虚');
        break;
      case TongueShapeFeature.toothMarked:
        syndromes.add('脾虚湿盛');
        break;
      case TongueShapeFeature.thorny:
        syndromes.add('心热');
        break;
      case TongueShapeFeature.cracked:
        syndromes.add('热伤津液');
        break;
      case TongueShapeFeature.deviated:
        syndromes.add('风痰闭络');
        break;
      case TongueShapeFeature.shortened:
        syndromes.add('热盛伤津');
        break;
      case TongueShapeFeature.trembling:
        syndromes.add('肝风内动');
        break;
      case TongueShapeFeature.normal:
        // 正常舌形无特殊证候
        break;
    }

    // 根据舌下络脉判断证候
    switch (features.veinFeature) {
      case TongueVeinFeature.pale:
        syndromes.add('气血不足');
        break;
      case TongueVeinFeature.purple:
        syndromes.add('瘀血');
        syndromes.add('寒凝');
        break;
      case TongueVeinFeature.swollen:
        syndromes.add('气滞血瘀');
        break;
      case TongueVeinFeature.normal:
        // 正常舌下络脉无特殊证候
        break;
    }

    // 如果没有任何证候，添加一个正常的提示
    if (syndromes.isEmpty) {
      syndromes.add('正常');
    }

    // 去重
    return syndromes.toSet().toList();
  }

  /// 推导体质
  static List<String> _deriveConstitutions(TongueDiagnosisFeatures features) {
    final constitutions = <String>[];

    // 根据舌象综合判断体质
    // 气虚质
    if (features.bodyFeature == TongueBodyFeature.pale ||
        features.shapeFeature == TongueShapeFeature.enlarged ||
        features.shapeFeature == TongueShapeFeature.toothMarked) {
      constitutions.add('气虚质');
    }

    // 阳虚质
    if (features.bodyFeature == TongueBodyFeature.pale ||
        features.coatingFeature == TongueCoatingFeature.white ||
        features.coatingFeature == TongueCoatingFeature.thickWhite) {
      constitutions.add('阳虚质');
    }

    // 阴虚质
    if (features.bodyFeature == TongueBodyFeature.red ||
        features.coatingFeature == TongueCoatingFeature.dry ||
        features.coatingFeature == TongueCoatingFeature.mirror ||
        features.coatingFeature == TongueCoatingFeature.peeled) {
      constitutions.add('阴虚质');
    }

    // 痰湿质
    if (features.coatingFeature == TongueCoatingFeature.greasy ||
        features.coatingFeature == TongueCoatingFeature.thickWhite ||
        features.shapeFeature == TongueShapeFeature.enlarged ||
        features.shapeFeature == TongueShapeFeature.toothMarked) {
      constitutions.add('痰湿质');
    }

    // 湿热质
    if (features.bodyFeature == TongueBodyFeature.red ||
        features.coatingFeature == TongueCoatingFeature.yellow ||
        features.coatingFeature == TongueCoatingFeature.thickYellow ||
        features.coatingFeature == TongueCoatingFeature.greasy) {
      constitutions.add('湿热质');
    }

    // 血瘀质
    if (features.bodyFeature == TongueBodyFeature.purple ||
        features.bodyFeature == TongueBodyFeature.crimson ||
        features.veinFeature == TongueVeinFeature.purple ||
        features.veinFeature == TongueVeinFeature.swollen) {
      constitutions.add('血瘀质');
    }

    // 气郁质
    if (features.shapeFeature == TongueShapeFeature.deviated ||
        features.veinFeature == TongueVeinFeature.swollen) {
      constitutions.add('气郁质');
    }

    // 特禀质
    if (features.shapeFeature == TongueShapeFeature.thorny ||
        features.shapeFeature == TongueShapeFeature.trembling) {
      constitutions.add('特禀质');
    }

    // 平和质
    if (features.bodyFeature == TongueBodyFeature.normal &&
        (features.coatingFeature == TongueCoatingFeature.thinWhite ||
            features.coatingFeature == TongueCoatingFeature.white) &&
        features.shapeFeature == TongueShapeFeature.normal &&
        features.veinFeature == TongueVeinFeature.normal) {
      constitutions.add('平和质');
    }

    // 如果没有任何体质，添加一个平和质
    if (constitutions.isEmpty) {
      constitutions.add('平和质');
    }

    // 限制体质数量，最多3个
    if (constitutions.length > 3) {
      constitutions.sort((a, b) => a.compareTo(b));
      return constitutions.sublist(0, 3);
    }

    return constitutions;
  }

  /// 推导调理建议
  static List<String> _deriveSuggestions(TongueDiagnosisFeatures features) {
    final suggestions = <String>[];

    // 根据舌质提供建议
    switch (features.bodyFeature) {
      case TongueBodyFeature.pale:
        suggestions.add('建议食用具有补气养血作用的食物，如红枣、桂圆、阿胶等');
        suggestions.add('适当增加优质蛋白质的摄入，如瘦肉、鸡蛋、鱼类等');
        break;
      case TongueBodyFeature.red:
        suggestions.add('建议清淡饮食，避免辛辣刺激性食物');
        suggestions.add('可食用具有清热作用的食物，如绿豆、莲子、百合等');
        break;
      case TongueBodyFeature.crimson:
        suggestions.add('建议严格控制辛辣刺激性食物，多喝水');
        suggestions.add('可食用具有清热凉血作用的食物，如生地、荸荠、芦根等');
        break;
      case TongueBodyFeature.purple:
        suggestions.add('建议食用具有活血化瘀作用的食物，如红花、丹参、桃仁等');
        suggestions.add('保持情绪稳定，避免过度劳累');
        break;
      case TongueBodyFeature.flaked:
        suggestions.add('建议清淡饮食，避免辛辣油腻食物');
        suggestions.add('可食用具有健脾清热作用的食物，如薏米、山药、扁豆等');
        break;
      case TongueBodyFeature.tender:
        suggestions.add('建议食用具有健脾益气作用的食物，如山药、大枣、党参等');
        suggestions.add('注意避免过度劳累，保持充足休息');
        break;
      case TongueBodyFeature.normal:
        suggestions.add('建议保持均衡饮食，多吃新鲜蔬菜水果');
        break;
    }

    // 根据舌苔提供建议
    switch (features.coatingFeature) {
      case TongueCoatingFeature.thickWhite:
      case TongueCoatingFeature.white:
        suggestions.add('建议注意保暖，避免受寒');
        suggestions.add('可食用具有温中散寒作用的食物，如生姜、肉桂、韭菜等');
        break;
      case TongueCoatingFeature.yellow:
      case TongueCoatingFeature.thickYellow:
        suggestions.add('建议清淡饮食，避免油腻辛辣食物');
        suggestions.add('可食用具有清热解毒作用的食物，如苦瓜、菊花、芦根等');
        break;
      case TongueCoatingFeature.greasy:
        suggestions.add('建议清淡饮食，避免过食甜腻油腻食物');
        suggestions.add('可食用具有健脾祛湿作用的食物，如薏米、扁豆、茯苓等');
        break;
      case TongueCoatingFeature.blackish:
        suggestions.add('建议及时就医，详细检查身体状况');
        break;
      case TongueCoatingFeature.dry:
      case TongueCoatingFeature.mirror:
      case TongueCoatingFeature.peeled:
        suggestions.add('建议多喝水，保持充分的休息');
        suggestions.add('可食用具有滋阴养津作用的食物，如百合、银耳、芝麻等');
        break;
      case TongueCoatingFeature.thinWhite:
      default:
        if (!suggestions.contains('建议保持均衡饮食，多吃新鲜蔬菜水果')) {
          suggestions.add('建议保持均衡饮食，多吃新鲜蔬菜水果');
        }
        break;
    }

    // 通用建议
    suggestions.add('建议保持良好的作息习惯，避免熬夜');
    suggestions.add('建议适当进行体育锻炼，增强体质');

    return suggestions;
  }

  /// 获取舌质特征临床意义
  static String _getBodyFeatureMeaning(TongueBodyFeature feature) {
    switch (feature) {
      case TongueBodyFeature.pale:
        return '淡白舌多见于气血不足或阳虚证。';
      case TongueBodyFeature.normal:
        return '淡红舌为正常舌色，表示体内脏腑功能平衡。';
      case TongueBodyFeature.red:
        return '红舌多见于热证，表示体内有热。';
      case TongueBodyFeature.crimson:
        return '绛舌多见于热极或瘀血，是严重热证的表现。';
      case TongueBodyFeature.purple:
        return '青紫舌多见于血瘀或寒凝血瘀证。';
      case TongueBodyFeature.flaked:
        return '花剥舌多见于胃肠热盛，消化系统功能紊乱。';
      case TongueBodyFeature.tender:
        return '老嫩舌多见于体虚，特别是脾胃虚弱。';
    }
  }

  /// 获取舌苔特征临床意义
  static String _getCoatingFeatureMeaning(TongueCoatingFeature feature) {
    switch (feature) {
      case TongueCoatingFeature.thinWhite:
        return '薄白苔多见于表证初起，为常见的正常舌苔。';
      case TongueCoatingFeature.white:
        return '白苔多见于寒证，表示体内有寒。';
      case TongueCoatingFeature.thickWhite:
        return '厚白苔多见于寒湿证，表示体内寒湿较重。';
      case TongueCoatingFeature.thinYellow:
        return '薄黄苔多见于里热轻证，表示体内有轻度热证。';
      case TongueCoatingFeature.yellow:
        return '黄苔多见于里热证，表示体内热证较明显。';
      case TongueCoatingFeature.thickYellow:
        return '厚黄苔多见于里热重证，表示体内热证较重。';
      case TongueCoatingFeature.blackish:
        return '灰黑苔多见于热极或寒极证，属于严重病证的表现。';
      case TongueCoatingFeature.greasy:
        return '腻苔多见于湿浊内蕴，表示体内湿浊较重。';
      case TongueCoatingFeature.dry:
        return '干苔多见于津液不足，表示体内缺乏津液。';
      case TongueCoatingFeature.mirror:
        return '光剥苔（无苔）多见于胃气虚弱，表示消化吸收功能减弱。';
      case TongueCoatingFeature.peeled:
        return '剥苔多见于胃热伤阴，表示胃阴受损。';
    }
  }

  /// 获取舌形特征临床意义
  static String _getShapeFeatureMeaning(TongueShapeFeature feature) {
    switch (feature) {
      case TongueShapeFeature.normal:
        return '舌体适中，不胖不瘦，为正常舌形。';
      case TongueShapeFeature.enlarged:
        return '胖大舌多见于痰湿内蕴或气虚，表示体内水湿停滞或气虚不足。';
      case TongueShapeFeature.thin:
        return '瘦薄舌多见于气血亏虚，表示体内气血不足。';
      case TongueShapeFeature.toothMarked:
        return '齿痕舌多见于脾虚湿盛，表示脾胃功能虚弱。';
      case TongueShapeFeature.thorny:
        return '点刺舌多见于心热，表示心火偏旺。';
      case TongueShapeFeature.cracked:
        return '裂纹舌多见于热伤津液，表示体内津液严重不足。';
      case TongueShapeFeature.deviated:
        return '歪斜舌多见于风痰闭络，是中风前兆或已患中风的表现。';
      case TongueShapeFeature.shortened:
        return '短缩舌多见于热盛伤津，是热邪伤津的严重表现。';
      case TongueShapeFeature.trembling:
        return '颤动舌多见于肝风内动，表示肝阳上亢或内风扰动。';
    }
  }

  /// 获取舌下络脉特征临床意义
  static String _getVeinFeatureMeaning(TongueVeinFeature feature) {
    switch (feature) {
      case TongueVeinFeature.normal:
        return '舌下络脉色淡红不怒张，为正常表现。';
      case TongueVeinFeature.pale:
        return '舌下络脉淡白多见于气血不足，表示气血亏虚。';
      case TongueVeinFeature.purple:
        return '舌下络脉青紫多见于瘀血或寒凝血瘀，表示血液运行不畅。';
      case TongueVeinFeature.swollen:
        return '舌下络脉怒张多见于气滞血瘀，表示气血瘀滞不通。';
    }
  }
}
