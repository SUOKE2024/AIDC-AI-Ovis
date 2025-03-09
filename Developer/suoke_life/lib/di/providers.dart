import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suoke_life/core/router/app_router.dart';
import 'package:suoke_life/domain/repositories/auth_repository.dart';

/// 主Provider导出文件
/// 按需导出各功能模块的Provider

// 导出核心Provider
export 'providers/core_providers.dart';

// 导出探索频道Provider
export 'providers/explore_providers.dart';

// 导出TCM相关Provider
export 'providers/tcm_providers.dart';

/// 路由提供者
final appRouterProvider = Provider<AppRouter>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  return AppRouter(authGuard: AuthGuard(authRepository));
});
