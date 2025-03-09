import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suoke_life/app.dart';
import 'package:suoke_life/core/theme/app_theme.dart';
import 'package:suoke_life/di/providers.dart';
import 'package:suoke_life/core/storage/preferences_manager.dart';
import 'package:suoke_life/core/utils/permission_utils.dart';
import 'package:suoke_life/domain/repositories/auth_repository.dart';
import 'package:suoke_life/core/config/env_config.dart';
import 'package:suoke_life/core/config/app_config.dart';

void main() async {
  // 错误处理
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('应用发生错误: ${details.exception}');
  };

  // 确保Flutter绑定初始化
  WidgetsFlutterBinding.ensureInitialized();

  // 初始化环境和配置
  PreferencesManager preferencesManager;
  AppConfigNotifier? appConfigNotifier;
  
  try {
    final result = await initializeApp();
    preferencesManager = result['preferencesManager'] as PreferencesManager;
    appConfigNotifier = result['appConfigNotifier'] as AppConfigNotifier;
  } catch (e) {
    debugPrint('初始化过程中发生错误: $e');
    // 失败时创建一个空的PreferencesManager实例
    preferencesManager = PreferencesManager(await SharedPreferences.getInstance());
  }

  // 启动应用
  runApp(
    ProviderScope(
      overrides: [
        // 覆盖偏好设置管理器Provider
        preferencesManagerProvider.overrideWithValue(preferencesManager),
        // 如果有应用配置，覆盖应用配置Provider
        if (appConfigNotifier != null)
          appConfigProvider.overrideWith((ref) => appConfigNotifier!),
      ],
      child: const SuokeLifeApp(),
    ),
  );
}

/// 初始化应用所需的环境和配置
Future<Map<String, dynamic>> initializeApp() async {
  print('开始初始化应用...');
  
  // 初始化环境配置
  await EnvConfig().initialize();
  print('环境配置已初始化');
  
  // 初始化偏好设置管理器
  final preferencesManager = await initPreferencesManager();
  
  // 初始化应用配置
  final appConfigNotifier = AppConfigNotifier();
  // 等待配置加载完成
  await Future.delayed(const Duration(milliseconds: 100));
  print('应用配置已初始化: ${appConfigNotifier.debugState.themeMode}');
  
  // 重置欢迎页面显示状态，确保每次启动都显示欢迎页面
  await preferencesManager.setHasSeenWelcome(false);
  print('已重置欢迎页面状态: hasSeenWelcome = ${preferencesManager.hasSeenWelcome}');

  try {
    // 请求必要的权限
    await PermissionUtils.requestAllPermissions();
  } catch (e) {
    debugPrint('请求权限时发生错误: $e');
    // 继续执行，不中断初始化流程
  }

  // 强制登出用户，确保每次启动都需要重新登录
  final authRepository = MockAuthRepository();
  await authRepository.logout();
  print('已强制登出用户: isAuthenticated = ${authRepository.isAuthenticated}');

  // TODO: 初始化数据库
  // TODO: 初始化网络客户端
  // TODO: 初始化本地存储
  // TODO: 初始化AI代理
  // TODO: 加载用户配置
  // 可以在这里添加更多初始化逻辑

  return {
    'preferencesManager': preferencesManager,
    'appConfigNotifier': appConfigNotifier,
  };
}
