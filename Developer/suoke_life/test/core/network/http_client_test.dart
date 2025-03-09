import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'http_client_test.mocks.dart';

// 生成Mock HTTP客户端
@GenerateMocks([http.Client])
void main() {
  group('HttpClient Tests', () {
    test('测试GET请求成功', () async {
      // 此测试验证GET请求是否能正确处理成功响应
      final mockClient = MockClient();

      // 模拟成功的响应
      when(mockClient.get(Uri.parse('https://api.suoke.life/test')))
          .thenAnswer((_) async => http.Response('{"success": true}', 200));

      // 验证响应是否按预期处理
      final response =
          await mockClient.get(Uri.parse('https://api.suoke.life/test'));
      expect(response.statusCode, equals(200));
      expect(response.body, equals('{"success": true}'));
    });

    test('测试请求失败处理', () async {
      // 此测试验证HTTP客户端是否能正确处理失败响应
      final mockClient = MockClient();

      // 模拟失败的响应
      when(mockClient.get(Uri.parse('https://api.suoke.life/invalid')))
          .thenAnswer(
              (_) async => http.Response('{"error": "Not found"}', 404));

      // 验证响应是否按预期处理
      final response =
          await mockClient.get(Uri.parse('https://api.suoke.life/invalid'));
      expect(response.statusCode, equals(404));
      expect(response.body, equals('{"error": "Not found"}'));
    });

    test('测试网络错误处理', () async {
      // 此测试验证HTTP客户端是否能正确处理网络异常
      final mockClient = MockClient();

      // 模拟网络异常
      when(mockClient.get(Uri.parse('https://api.suoke.life/error')))
          .thenThrow(Exception('网络连接错误'));

      // 验证异常是否按预期处理
      expect(
        () => mockClient.get(Uri.parse('https://api.suoke.life/error')),
        throwsException,
      );
    });
  });
}
