import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';

/// 体质类型
enum ConstitutionType {
  /// 平和质 - 理想体质
  balanced,

  /// 气虚质 - 气虚体质 (金)
  qiDeficiency,

  /// 阳虚质 - 阳虚体质 (水)
  yangDeficiency,

  /// 阴虚质 - 阴虚体质 (火)
  yinDeficiency,

  /// 痰湿质 - 痰湿体质 (土)
  phlegmDampness,

  /// 湿热质 - 湿热体质 (火/土)
  dampnessHeat,

  /// 血瘀质 - 血瘀体质 (水/木)
  bloodStasis,

  /// 气郁质 - 气郁体质 (木)
  qiStagnation,

  /// 特禀质 - 特禀体质
  allergic,
}

/// 体质信息
class ConstitutionInfo {
  /// 体质类型
  final ConstitutionType type;

  /// 体质名称
  final String name;

  /// 体质描述
  final String description;

  /// 体质特点
  final List<String> characteristics;

  /// 体质调理建议
  final List<String> suggestions;

  /// 关联五行元素类型
  final ElementType? elementType;

  /// 关联颜色
  final Color color;

  /// 体质匹配度百分比
  final double matchPercentage;

  const ConstitutionInfo({
    required this.type,
    required this.name,
    required this.description,
    required this.characteristics,
    required this.suggestions,
    this.elementType,
    required this.color,
    required this.matchPercentage,
  });

  /// 获取所有体质信息
  static List<ConstitutionInfo> getAllTypes() {
    return [
      ConstitutionInfo(
        type: ConstitutionType.balanced,
        name: '平和质',
        description: '平和体质是相对于偏颇体质而言的，是一种理想的健康状态，各方面机能都比较完善，病邪不易侵入。',
        characteristics: [
          '面色红润有光泽',
          '精力充沛',
          '睡眠良好',
          '体形匀称',
          '气色好，精神好',
        ],
        suggestions: [
          '均衡饮食，保持良好作息',
          '适度运动，增强体质',
          '保持心情舒畅',
          '注意四季养生',
        ],
        color: AppColors.primaryColor,
        matchPercentage: 0.85,
      ),
      ConstitutionInfo(
        type: ConstitutionType.qiDeficiency,
        name: '气虚质',
        description: '气虚体质是指以元气不足为主要特征的体质状态，常表现为少气懒言、易疲乏等。',
        characteristics: [
          '说话声音低弱无力',
          '容易疲劳',
          '平时说话声音低弱',
          '舌淡胖嫩，舌边有齿痕',
          '动则汗出',
        ],
        suggestions: [
          '饮食宜温补，选择健脾益气食物',
          '起居有常，避免过度劳累',
          '适宜散步、太极拳等轻缓运动',
          '忌食生冷食物',
        ],
        elementType: ElementType.metal,
        color: AppColors.metalColor,
        matchPercentage: 0.67,
      ),
      ConstitutionInfo(
        type: ConstitutionType.yangDeficiency,
        name: '阳虚质',
        description: '阳虚体质是指以阳气虚弱为主要特征的体质状态，常表现为怕冷、手足不温等。',
        characteristics: [
          '手脚发凉',
          '喜温怕冷',
          '面色苍白',
          '大便溏薄',
          '小便清长',
        ],
        suggestions: [
          '饮食宜温热，避免寒凉食物',
          '适当食用温阳食物如羊肉、生姜',
          '保暖防寒，避免受凉',
          '适宜温阳运动，如慢跑、八段锦',
        ],
        elementType: ElementType.water,
        color: AppColors.waterColor,
        matchPercentage: 0.42,
      ),
      ConstitutionInfo(
        type: ConstitutionType.yinDeficiency,
        name: '阴虚质',
        description: '阴虚体质是指以阴液亏少为主要特征的体质状态，常表现为手足心热、口干咽燥等。',
        characteristics: [
          '手足心热',
          '口干咽燥',
          '面部偏红',
          '容易失眠多梦',
          '大便干燥',
        ],
        suggestions: [
          '饮食宜清淡滋润，避免辛辣刺激',
          '适当食用滋阴食物如银耳、百合',
          '充分休息，保证睡眠',
          '适宜缓和运动，如太极、瑜伽',
        ],
        elementType: ElementType.fire,
        color: AppColors.fireColor,
        matchPercentage: 0.32,
      ),
      ConstitutionInfo(
        type: ConstitutionType.phlegmDampness,
        name: '痰湿质',
        description: '痰湿体质是指以痰湿内停为主要特征的体质状态，常表现为胸闷、痰多、体形肥胖等。',
        characteristics: [
          '容易感到胸闷',
          '痰多',
          '体形肥胖',
          '腹部肥满松软',
          '面部皮肤油脂较多',
        ],
        suggestions: [
          '饮食宜清淡，少食多餐',
          '避免高脂肪、高糖分食物',
          '适当食用利湿食物如薏米、赤小豆',
          '加强有氧运动，如快走、慢跑',
        ],
        elementType: ElementType.earth,
        color: AppColors.earthColor,
        matchPercentage: 0.28,
      ),
      ConstitutionInfo(
        type: ConstitutionType.dampnessHeat,
        name: '湿热质',
        description: '湿热体质是指以湿热内蕴为主要特征的体质状态，常表现为面垢油光、口苦黏腻等。',
        characteristics: [
          '面垢油光',
          '口苦黏腻',
          '大便黏滞不爽',
          '小便色黄',
          '容易生痤疮',
        ],
        suggestions: [
          '饮食宜清淡，少食油腻辛辣',
          '多饮水，适当食用清热利湿食物',
          '保持情绪舒畅，避免暴怒',
          '适宜游泳、散步等舒缓运动',
        ],
        elementType: ElementType.fire,
        color: AppColors.secondaryColor,
        matchPercentage: 0.25,
      ),
      ConstitutionInfo(
        type: ConstitutionType.bloodStasis,
        name: '血瘀质',
        description: '血瘀体质是指以血行不畅为主要特征的体质状态，常表现为肤色晦暗、舌下脉络青紫等。',
        characteristics: [
          '肤色晦暗',
          '容易出现瘀斑',
          '口唇颜色偏暗',
          '舌下脉络青紫',
          '经行不畅',
        ],
        suggestions: [
          '饮食宜温热活血',
          '避免过度寒凉食物',
          '保持情绪舒畅',
          '适宜中等强度有氧运动',
        ],
        elementType: ElementType.water,
        color: AppColors.errorColor,
        matchPercentage: 0.18,
      ),
      ConstitutionInfo(
        type: ConstitutionType.qiStagnation,
        name: '气郁质',
        description: '气郁体质是指以情志不畅，气机郁滞为主要特征的体质状态，常表现为情绪波动大、忧郁等。',
        characteristics: [
          '情绪波动大',
          '容易焦虑',
          '胸胁胀闷',
          '喜欢叹气',
          '感到闷闷不乐',
        ],
        suggestions: [
          '保持情绪舒畅，避免抑郁',
          '饮食宜疏肝理气',
          '适宜郊外活动，接触大自然',
          '可参加瑜伽、太极等放松身心的活动',
        ],
        elementType: ElementType.wood,
        color: AppColors.woodColor,
        matchPercentage: 0.15,
      ),
      ConstitutionInfo(
        type: ConstitutionType.allergic,
        name: '特禀质',
        description: '特禀体质是指以过敏反应为主要特征的体质状态，容易对特定物质过敏。',
        characteristics: [
          '容易过敏',
          '对药物或食物过敏',
          '容易起荨麻疹',
          '鼻塞或打喷嚏',
          '皮肤容易出现过敏反应',
        ],
        suggestions: [
          '注意避免接触过敏原',
          '饮食宜清淡，忌食辛辣刺激',
          '保持室内空气流通',
          '按时作息，避免过度疲劳',
        ],
        color: Colors.purple,
        matchPercentage: 0.12,
      ),
    ];
  }

  /// 获取主要体质信息（默认按匹配度排序）
  static List<ConstitutionInfo> getMainTypes({bool sortByMatch = true}) {
    final allTypes = getAllTypes();
    if (sortByMatch) {
      allTypes.sort((a, b) => b.matchPercentage.compareTo(a.matchPercentage));
    }
    return allTypes.take(3).toList();
  }
}
