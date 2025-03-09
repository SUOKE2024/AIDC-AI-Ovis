import 'package:flutter_test/flutter_test.dart';

void main() {
  group('StringUtils Tests', () {
    test('测试字符串是否为空', () {
      // 给定一个空字符串
      const String emptyString = '';

      // 验证结果
      expect(emptyString.isEmpty, true);
    });

    test('测试字符串非空', () {
      // 给定一个非空字符串
      const String nonEmptyString = 'Suoke Life';

      // 验证结果
      expect(nonEmptyString.isNotEmpty, true);
    });

    test('测试字符串包含', () {
      // 给定一个字符串
      const String string = 'Suoke Life APP';

      // 验证结果
      expect(string.contains('Life'), true);
    });
  });
}
