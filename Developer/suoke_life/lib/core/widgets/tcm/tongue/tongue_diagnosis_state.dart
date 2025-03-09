import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suoke_life/core/widgets/tcm/models/tongue_diagnosis_data.dart';

/// 舌诊分析状态类，管理舌诊分析过程中的各种状态
class TongueDiagnosisState {
  /// 是否正在初始化
  final bool isInitializing;

  /// 是否正在分析
  final bool isAnalyzing;

  /// 相机控制器
  final CameraController? cameraController;

  /// 当前引导文本
  final String? guidanceText;

  /// 是否检测到舌头
  final bool tongueDetected;

  /// 舌诊特征
  final TongueDiagnosisFeatures? features;

  /// 舌诊结果
  final TongueDiagnosisResult? result;

  /// 舌头区域信息
  final Map<String, Map<String, double>>? regions;

  /// 区域颜色信息
  final Map<String, int>? regionColors;

  /// 历史记录ID - 当前分析保存后的ID
  final String? historyId;

  /// 错误信息
  final String? errorMessage;

  /// 当前相机图像
  final CameraImage? currentImage;

  /// 构造函数
  const TongueDiagnosisState({
    this.isInitializing = true,
    this.isAnalyzing = false,
    this.cameraController,
    this.guidanceText,
    this.tongueDetected = false,
    this.features,
    this.result,
    this.regions,
    this.regionColors,
    this.historyId,
    this.errorMessage,
    this.currentImage,
  });

  /// 创建初始状态
  factory TongueDiagnosisState.initial() {
    return const TongueDiagnosisState(
      isInitializing: true,
      isAnalyzing: false,
      guidanceText: '正在初始化相机...',
    );
  }

  /// 创建副本
  TongueDiagnosisState copyWith({
    bool? isInitializing,
    bool? isAnalyzing,
    CameraController? cameraController,
    String? guidanceText,
    bool? tongueDetected,
    TongueDiagnosisFeatures? features,
    TongueDiagnosisResult? result,
    Map<String, Map<String, double>>? regions,
    Map<String, int>? regionColors,
    String? historyId,
    String? errorMessage,
    CameraImage? currentImage,
  }) {
    return TongueDiagnosisState(
      isInitializing: isInitializing ?? this.isInitializing,
      isAnalyzing: isAnalyzing ?? this.isAnalyzing,
      cameraController: cameraController ?? this.cameraController,
      guidanceText: guidanceText ?? this.guidanceText,
      tongueDetected: tongueDetected ?? this.tongueDetected,
      features: features ?? this.features,
      result: result ?? this.result,
      regions: regions ?? this.regions,
      regionColors: regionColors ?? this.regionColors,
      historyId: historyId ?? this.historyId,
      errorMessage: errorMessage,
      currentImage: currentImage ?? this.currentImage,
    );
  }
}
