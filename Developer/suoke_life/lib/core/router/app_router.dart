import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// 页面导入
import 'package:suoke_life/presentation/home/pages/home_page.dart';
import 'package:suoke_life/presentation/home/pages/chat_page.dart';
import 'package:suoke_life/presentation/suoke/pages/suoke_page.dart';
import 'package:suoke_life/presentation/suoke/pages/pulse_diagnosis_page.dart';
import 'package:suoke_life/presentation/suoke/pages/tongue_diagnosis_page.dart';
import 'package:suoke_life/presentation/explore/pages/explore_page.dart';
import 'package:suoke_life/presentation/explore/pages/exploration_detail_page.dart';
import 'package:suoke_life/presentation/life/pages/life_page.dart';
import 'package:suoke_life/presentation/profile/pages/profile_page.dart';
import 'package:suoke_life/presentation/home/pages/welcome_page.dart';
import 'package:suoke_life/presentation/auth/pages/login_page.dart';
import 'package:suoke_life/presentation/design/pages/design_system_showcase_page.dart';
import 'package:suoke_life/presentation/explore/providers/explore_providers.dart';
import 'package:suoke_life/presentation/life/pages/constitution_assessment_page.dart';
import 'package:suoke_life/presentation/life/pages/constitution_result_page.dart';
import 'package:suoke_life/presentation/life/pages/health_regimen_page.dart';
import 'package:suoke_life/presentation/profile/pages/theme_settings_page.dart';
import 'package:suoke_life/domain/repositories/auth_repository.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/presentation/life/models/constitution_type.dart';

part 'app_router.gr.dart';

/// 路由提供者
final appRouterProvider = Provider<AppRouter>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  return AppRouter(authGuard: AuthGuard(authRepository));
});

/// 应用程序路由配置
@AutoRouterConfig(replaceInRouteName: 'Page,Route')
class AppRouter extends _$AppRouter {
  final AuthGuard authGuard;

  AppRouter({required this.authGuard});

  @override
  List<AutoRoute> get routes => [
        // 欢迎页面
        AutoRoute(
          path: '/welcome',
          page: WelcomeRoute.page,
          initial: true,
        ),
        // 登录页面
        AutoRoute(
          path: '/login',
          page: LoginRoute.page,
        ),
        // 主仪表盘（包含底部导航）
        AutoRoute(
          path: '/',
          page: MainDashboardRoute.page,
          children: [
            // 首页（聊天）
            AutoRoute(
              path: 'home',
              page: HomeRoute.page,
              title: (context, data) => '聊天',
            ),
            // SUOKE页面
            AutoRoute(
              path: 'suoke',
              page: SuokeRoute.page,
              title: (context, data) => 'SUOKE',
            ),
            // 探索页面
            AutoRoute(
              path: 'explore',
              page: ExploreRoute.page,
              title: (context, data) => '探索',
            ),
            // LIFE页面
            AutoRoute(
              path: 'life',
              page: LifeRoute.page,
              title: (context, data) => 'LIFE',
            ),
            // 个人资料页面
            AutoRoute(
              path: 'profile',
              page: ProfileRoute.page,
              title: (context, data) => '我的',
              guards: [authGuard],
            ),
          ],
        ),
        // 探索详情页面
        AutoRoute(
          path: '/explore/detail/:id',
          page: ExplorationDetailRoute.page,
        ),
        // 体质评估页面
        AutoRoute(
          path: '/life/constitution-assessment',
          page: ConstitutionAssessmentRoute.page,
        ),
        // 体质评估结果页面
        AutoRoute(
          path: '/life/constitution-result',
          page: ConstitutionResultRoute.page,
        ),
        // 健康调理方案页面
        AutoRoute(
          path: '/life/health-regimen/:constitutionType',
          page: HealthRegimenRoute.page,
        ),
        // 脉诊服务页面
        AutoRoute(
          path: '/suoke/pulse-diagnosis',
          page: PulseDiagnosisRoute.page,
        ),
        // 舌诊服务页面
        AutoRoute(
          path: '/suoke/tongue-diagnosis',
          page: TongueDiagnosisRoute.page,
        ),
        // 主题设置页面
        AutoRoute(
          path: '/profile/theme-settings',
          page: ThemeSettingsRoute.page,
        ),
        // 聊天页面
        AutoRoute(
          path: '/home/chat',
          page: ChatRoute.page,
        ),
        // 404页面
        AutoRoute(
          path: '*',
          page: NotFoundRoute.page,
        ),
      ];
}

/// 身份验证路由守卫
class AuthGuard extends AutoRouteGuard {
  final AuthRepository authRepository;

  AuthGuard(this.authRepository);

  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) {
    if (authRepository.isAuthenticated) {
      // 已登录，允许导航
      resolver.next(true);
    } else {
      // 未登录，重定向到登录页面
      router.navigateNamed('/login');
      // 拒绝当前导航
      resolver.next(false);
    }
  }
}

/// 主仪表盘页面，包含底部导航栏
@RoutePage()
class MainDashboardPage extends StatelessWidget {
  const MainDashboardPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AutoTabsRouter(
      routes: const [
        HomeRoute(),
        SuokeRoute(),
        ExploreRoute(),
        LifeRoute(),
        ProfileRoute(),
      ],
      builder: (context, child) {
        final tabsRouter = AutoTabsRouter.of(context);

        return Scaffold(
          body: child,
          bottomNavigationBar: _buildBottomNavigationBar(context, tabsRouter),
        );
      },
    );
  }

  /// 构建底部导航栏
  Widget _buildBottomNavigationBar(
      BuildContext context, TabsRouter tabsRouter) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDarkMode ? AppColors.darkSurface : AppColors.lightSurface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 4,
            offset: const Offset(0, -1),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        child: BottomNavigationBar(
          currentIndex: tabsRouter.activeIndex,
          onTap: tabsRouter.setActiveIndex,
          backgroundColor:
              isDarkMode ? AppColors.darkSurface : AppColors.lightSurface,
          selectedItemColor: AppColors.primaryColor,
          unselectedItemColor:
              isDarkMode ? AppColors.darkSystemGray : AppColors.lightSystemGray,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.chat_bubble_outline),
              activeIcon: Icon(Icons.chat_bubble),
              label: '首页',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.health_and_safety_outlined),
              activeIcon: Icon(Icons.health_and_safety),
              label: 'SUOKE',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.explore_outlined),
              activeIcon: Icon(Icons.explore),
              label: '探索',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.spa_outlined),
              activeIcon: Icon(Icons.spa),
              label: 'LIFE',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: '我的',
            ),
          ],
        ),
      ),
    );
  }
}

/// 404 页面定义
@RoutePage()
class NotFoundPage extends StatelessWidget {
  const NotFoundPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('页面未找到'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            const Text(
              '404 - 页面未找到',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '您请求的页面不存在',
              style: TextStyle(
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                // 导航到主仪表盘页面
                context.router.navigate(const MainDashboardRoute());
              },
              child: const Text('返回首页'),
            ),
          ],
        ),
      ),
    );
  }
}
