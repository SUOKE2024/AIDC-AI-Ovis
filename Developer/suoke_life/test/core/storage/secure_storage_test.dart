import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'secure_storage_test.mocks.dart';

// 模拟安全存储
@GenerateMocks([FlutterSecureStorage])
void main() {
  group('SecureStorage Tests', () {
    late MockFlutterSecureStorage mockStorage;

    setUp(() {
      mockStorage = MockFlutterSecureStorage();
    });

    test('测试保存数据', () async {
      // 设置预期行为
      when(mockStorage.write(key: 'test_key', value: 'test_value'))
          .thenAnswer((_) async {});

      // 调用测试方法
      await mockStorage.write(key: 'test_key', value: 'test_value');

      // 验证调用
      verify(mockStorage.write(key: 'test_key', value: 'test_value')).called(1);
    });

    test('测试读取数据', () async {
      // 设置预期行为
      when(mockStorage.read(key: 'test_key'))
          .thenAnswer((_) async => 'test_value');

      // 调用测试方法
      final result = await mockStorage.read(key: 'test_key');

      // 验证结果
      expect(result, equals('test_value'));
      verify(mockStorage.read(key: 'test_key')).called(1);
    });

    test('测试删除数据', () async {
      // 设置预期行为
      when(mockStorage.delete(key: 'test_key')).thenAnswer((_) async {});

      // 调用测试方法
      await mockStorage.delete(key: 'test_key');

      // 验证调用
      verify(mockStorage.delete(key: 'test_key')).called(1);
    });

    test('测试数据不存在时的行为', () async {
      // 设置预期行为
      when(mockStorage.read(key: 'non_existent_key'))
          .thenAnswer((_) async => null);

      // 调用测试方法
      final result = await mockStorage.read(key: 'non_existent_key');

      // 验证结果
      expect(result, isNull);
      verify(mockStorage.read(key: 'non_existent_key')).called(1);
    });
  });
}
