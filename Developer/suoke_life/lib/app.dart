import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:suoke_life/core/router/app_router.dart';
import 'package:suoke_life/core/theme/app_theme.dart';
import 'package:suoke_life/core/storage/preferences_manager.dart';
import 'package:suoke_life/core/config/app_config.dart';

/// 索克生活APP主体
class SuokeLifeApp extends ConsumerWidget {
  const SuokeLifeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 获取路由实例
    final appRouter = ref.watch(appRouterProvider);

    // 获取应用配置
    final appConfig = ref.watch(appConfigProvider);

    // 使用Builder包装，确保有适当的上下文和错误处理
    return Builder(
      builder: (context) {
        // 错误边界，捕获并显示应用错误
        return MaterialApp.router(
          title: '索克生活',
          debugShowCheckedModeBanner: false,

          // 主题配置
          theme: AppTheme.lightTheme(),
          darkTheme: AppTheme.darkTheme(),
          themeMode: appConfig.themeMode,
          
          // 错误处理
          builder: (context, widget) {
            // 添加全局错误处理和布局约束
            Widget errorWidget = widget ?? const SizedBox.shrink();
            
            // 确保文本缩放适当
            errorWidget = MediaQuery(
              // 限制文本缩放比例，防止布局溢出
              data: MediaQuery.of(context).copyWith(
                textScaleFactor: (appConfig.fontSize / 16.0).clamp(0.8, 1.2),
              ),
              child: errorWidget,
            );
            
            return errorWidget;
          },

          // 国际化配置
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [
            Locale('zh', 'CN'), // 中文简体
          ],

          // 路由配置
          routerDelegate: appRouter.delegate(),
          routeInformationParser: appRouter.defaultRouteParser(),
          routeInformationProvider: appRouter.routeInfoProvider(),
        );
      }
    );
  }
}
