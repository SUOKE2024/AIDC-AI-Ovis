import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/tcm_visuals/five_elements.dart';

/// 五行相互关系类型
enum ElementRelationType {
  /// 相生关系
  generating,

  /// 相克关系
  controlling,

  /// 被生关系
  generated,

  /// 被克关系
  controlled,

  /// 无关系
  none,
}

/// 五行元素关系数据
class ElementRelation {
  /// 源元素
  final ElementType source;

  /// 目标元素
  final ElementType target;

  /// 关系类型
  final ElementRelationType type;

  /// 关系强度 (0.0-1.0)
  final double strength;

  /// 构造函数
  const ElementRelation({
    required this.source,
    required this.target,
    required this.type,
    this.strength = 1.0,
  });

  /// 获取关系线颜色
  Color getRelationColor() {
    switch (type) {
      case ElementRelationType.generating:
      case ElementRelationType.generated:
        return AppColors.primaryColor;
      case ElementRelationType.controlling:
      case ElementRelationType.controlled:
        return AppColors.secondaryColor;
      case ElementRelationType.none:
        return Colors.grey;
    }
  }

  /// 获取关系线宽度
  double getRelationWidth(double baseWidth) {
    return baseWidth * strength;
  }

  /// 获取关系线样式
  StrokeCap getRelationCap() {
    switch (type) {
      case ElementRelationType.generating:
      case ElementRelationType.generated:
        return StrokeCap.round;
      case ElementRelationType.controlling:
      case ElementRelationType.controlled:
        return StrokeCap.square;
      case ElementRelationType.none:
        return StrokeCap.butt;
    }
  }
}

/// 五行元素数据
class FiveElementsData {
  /// 元素值映射（元素类型 -> 强度值 0.0-1.0）
  final Map<ElementType, double> values;

  /// 元素间关系列表
  final List<ElementRelation> relations;

  /// 构造函数
  const FiveElementsData({
    required this.values,
    required this.relations,
  });

  /// 创建空数据
  factory FiveElementsData.empty() {
    return FiveElementsData(
      values: {
        ElementType.wood: 0.0,
        ElementType.fire: 0.0,
        ElementType.earth: 0.0,
        ElementType.metal: 0.0,
        ElementType.water: 0.0,
      },
      relations: [],
    );
  }

  /// 创建平衡数据
  factory FiveElementsData.balanced() {
    return FiveElementsData(
      values: {
        ElementType.wood: 0.5,
        ElementType.fire: 0.5,
        ElementType.earth: 0.5,
        ElementType.metal: 0.5,
        ElementType.water: 0.5,
      },
      relations: _createAllRelations(0.5),
    );
  }

  /// 创建默认的相生关系
  static List<ElementRelation> createGenerationRelations(
      [double strength = 1.0]) {
    return [
      // 木生火
      ElementRelation(
        source: ElementType.wood,
        target: ElementType.fire,
        type: ElementRelationType.generating,
        strength: strength,
      ),
      // 火生土
      ElementRelation(
        source: ElementType.fire,
        target: ElementType.earth,
        type: ElementRelationType.generating,
        strength: strength,
      ),
      // 土生金
      ElementRelation(
        source: ElementType.earth,
        target: ElementType.metal,
        type: ElementRelationType.generating,
        strength: strength,
      ),
      // 金生水
      ElementRelation(
        source: ElementType.metal,
        target: ElementType.water,
        type: ElementRelationType.generating,
        strength: strength,
      ),
      // 水生木
      ElementRelation(
        source: ElementType.water,
        target: ElementType.wood,
        type: ElementRelationType.generating,
        strength: strength,
      ),
    ];
  }

  /// 创建默认的相克关系
  static List<ElementRelation> createControllingRelations(
      [double strength = 1.0]) {
    return [
      // 木克土
      ElementRelation(
        source: ElementType.wood,
        target: ElementType.earth,
        type: ElementRelationType.controlling,
        strength: strength,
      ),
      // 土克水
      ElementRelation(
        source: ElementType.earth,
        target: ElementType.water,
        type: ElementRelationType.controlling,
        strength: strength,
      ),
      // 水克火
      ElementRelation(
        source: ElementType.water,
        target: ElementType.fire,
        type: ElementRelationType.controlling,
        strength: strength,
      ),
      // 火克金
      ElementRelation(
        source: ElementType.fire,
        target: ElementType.metal,
        type: ElementRelationType.controlling,
        strength: strength,
      ),
      // 金克木
      ElementRelation(
        source: ElementType.metal,
        target: ElementType.wood,
        type: ElementRelationType.controlling,
        strength: strength,
      ),
    ];
  }

  /// 创建所有关系
  static List<ElementRelation> _createAllRelations(double strength) {
    List<ElementRelation> relations = [];
    relations.addAll(createGenerationRelations(strength));
    relations.addAll(createControllingRelations(strength));
    return relations;
  }

  /// 从体质类型创建五行数据
  factory FiveElementsData.fromConstitutionType(ElementType primaryElement,
      {double primaryStrength = 0.8}) {
    // 创建基础的值映射
    Map<ElementType, double> values = {
      ElementType.wood: 0.3,
      ElementType.fire: 0.3,
      ElementType.earth: 0.3,
      ElementType.metal: 0.3,
      ElementType.water: 0.3,
    };

    // 设置主要元素的强度
    values[primaryElement] = primaryStrength;

    // 根据相生关系增强下一个元素
    ElementType generatedElement = _getGeneratedElement(primaryElement);
    values[generatedElement] = (primaryStrength * 0.7).clamp(0.0, 1.0);

    // 根据相克关系减弱被克元素
    ElementType controlledElement = _getControlledElement(primaryElement);
    values[controlledElement] =
        (values[controlledElement]! * 0.6).clamp(0.0, 1.0);

    return FiveElementsData(
      values: values,
      relations: _createAllRelations(0.5),
    );
  }

  /// 获取被某元素所生的元素
  static ElementType _getGeneratedElement(ElementType source) {
    switch (source) {
      case ElementType.wood:
        return ElementType.fire;
      case ElementType.fire:
        return ElementType.earth;
      case ElementType.earth:
        return ElementType.metal;
      case ElementType.metal:
        return ElementType.water;
      case ElementType.water:
        return ElementType.wood;
    }
  }

  /// 获取被某元素所克的元素
  static ElementType _getControlledElement(ElementType source) {
    switch (source) {
      case ElementType.wood:
        return ElementType.earth;
      case ElementType.earth:
        return ElementType.water;
      case ElementType.water:
        return ElementType.fire;
      case ElementType.fire:
        return ElementType.metal;
      case ElementType.metal:
        return ElementType.wood;
    }
  }

  /// 生成五行相生相克关系
  void generateRelationships() {
    relations.clear();

    // 添加相生关系
    relations.addAll([
      // 木生火
      ElementRelation(
        source: ElementType.wood,
        target: ElementType.fire,
        type: ElementRelationType.generating,
        strength: values[ElementType.wood]! * 0.8,
      ),
      // 火生土
      ElementRelation(
        source: ElementType.fire,
        target: ElementType.earth,
        type: ElementRelationType.generating,
        strength: values[ElementType.fire]! * 0.8,
      ),
      // 土生金
      ElementRelation(
        source: ElementType.earth,
        target: ElementType.metal,
        type: ElementRelationType.generating,
        strength: values[ElementType.earth]! * 0.8,
      ),
      // 金生水
      ElementRelation(
        source: ElementType.metal,
        target: ElementType.water,
        type: ElementRelationType.generating,
        strength: values[ElementType.metal]! * 0.8,
      ),
      // 水生木
      ElementRelation(
        source: ElementType.water,
        target: ElementType.wood,
        type: ElementRelationType.generating,
        strength: values[ElementType.water]! * 0.8,
      ),
    ]);

    // 添加相克关系
    relations.addAll([
      // 木克土
      ElementRelation(
        source: ElementType.wood,
        target: ElementType.earth,
        type: ElementRelationType.controlling,
        strength: values[ElementType.wood]! * 0.6,
      ),
      // 土克水
      ElementRelation(
        source: ElementType.earth,
        target: ElementType.water,
        type: ElementRelationType.controlling,
        strength: values[ElementType.earth]! * 0.6,
      ),
      // 水克火
      ElementRelation(
        source: ElementType.water,
        target: ElementType.fire,
        type: ElementRelationType.controlling,
        strength: values[ElementType.water]! * 0.6,
      ),
      // 火克金
      ElementRelation(
        source: ElementType.fire,
        target: ElementType.metal,
        type: ElementRelationType.controlling,
        strength: values[ElementType.fire]! * 0.6,
      ),
      // 金克木
      ElementRelation(
        source: ElementType.metal,
        target: ElementType.wood,
        type: ElementRelationType.controlling,
        strength: values[ElementType.metal]! * 0.6,
      ),
    ]);

    // 添加被生关系
    relations.addAll([
      // 火被木生
      ElementRelation(
        source: ElementType.fire,
        target: ElementType.wood,
        type: ElementRelationType.generated,
        strength: values[ElementType.fire]! * 0.4,
      ),
      // 土被火生
      ElementRelation(
        source: ElementType.earth,
        target: ElementType.fire,
        type: ElementRelationType.generated,
        strength: values[ElementType.earth]! * 0.4,
      ),
      // 金被土生
      ElementRelation(
        source: ElementType.metal,
        target: ElementType.earth,
        type: ElementRelationType.generated,
        strength: values[ElementType.metal]! * 0.4,
      ),
      // 水被金生
      ElementRelation(
        source: ElementType.water,
        target: ElementType.metal,
        type: ElementRelationType.generated,
        strength: values[ElementType.water]! * 0.4,
      ),
      // 木被水生
      ElementRelation(
        source: ElementType.wood,
        target: ElementType.water,
        type: ElementRelationType.generated,
        strength: values[ElementType.wood]! * 0.4,
      ),
    ]);

    // 添加被克关系
    relations.addAll([
      // 土被木克
      ElementRelation(
        source: ElementType.earth,
        target: ElementType.wood,
        type: ElementRelationType.controlled,
        strength: values[ElementType.earth]! * 0.3,
      ),
      // 水被土克
      ElementRelation(
        source: ElementType.water,
        target: ElementType.earth,
        type: ElementRelationType.controlled,
        strength: values[ElementType.water]! * 0.3,
      ),
      // 火被水克
      ElementRelation(
        source: ElementType.fire,
        target: ElementType.water,
        type: ElementRelationType.controlled,
        strength: values[ElementType.fire]! * 0.3,
      ),
      // 金被火克
      ElementRelation(
        source: ElementType.metal,
        target: ElementType.fire,
        type: ElementRelationType.controlled,
        strength: values[ElementType.metal]! * 0.3,
      ),
      // 木被金克
      ElementRelation(
        source: ElementType.wood,
        target: ElementType.metal,
        type: ElementRelationType.controlled,
        strength: values[ElementType.wood]! * 0.3,
      ),
    ]);
  }
}
