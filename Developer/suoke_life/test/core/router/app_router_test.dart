import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// 简化版路由器
abstract class SimpleRouter {
  Future<void> pushNamed(String routeName);
  Future<void> replaceNamed(String routeName);
  Future<bool> pop();
}

class MockSimpleRouter extends Mock implements SimpleRouter {}

// 定义简单的路由服务接口
class RouterService {
  Future<void> pushNamed(String routeName) async {}
  Future<void> replaceNamed(String routeName) async {}
  Future<bool> pop() async => true;
}

// 使用mocktail创建mock
class MockRouterService extends Mock implements RouterService {}

void main() {
  group('Router Tests', () {
    late MockRouterService mockRouter;

    setUp(() {
      mockRouter = MockRouterService();
    });

    test('测试路由跳转', () async {
      // 设置预期行为
      when(() => mockRouter.pushNamed(any())).thenAnswer((_) async {});

      // 执行路由操作
      await mockRouter.pushNamed('SomePage');

      // 验证是否调用了正确的方法
      verify(() => mockRouter.pushNamed('SomePage')).called(1);
    });

    test('测试路由替换', () async {
      // 设置预期行为
      when(() => mockRouter.replaceNamed(any())).thenAnswer((_) async {});

      // 执行路由操作
      await mockRouter.replaceNamed('SomePage');

      // 验证是否调用了正确的方法
      verify(() => mockRouter.replaceNamed('SomePage')).called(1);
    });

    test('测试路由返回', () async {
      // 设置预期行为
      when(() => mockRouter.pop()).thenAnswer((_) async => true);

      // 执行路由操作
      final result = await mockRouter.pop();

      // 验证结果和调用
      expect(result, isTrue);
      verify(() => mockRouter.pop()).called(1);
    });
  });
}
