import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Theme Tests', () {
    test('测试索克绿色值', () {
      // 索克绿色值
      const Color suokeGreen = Color(0xFF35BB78);

      // 验证颜色值 - 使用推荐的颜色属性
      expect(suokeGreen.red, equals(0x35));
      expect(suokeGreen.green, equals(0xBB));
      expect(suokeGreen.blue, equals(0x78));
    });

    test('测试索克橙色值', () {
      // 索克橙色值
      const Color suokeOrange = Color(0xFFFF6800);

      // 验证颜色值 - 使用推荐的颜色属性
      expect(suokeOrange.red, equals(0xFF));
      expect(suokeOrange.green, equals(0x68));
      expect(suokeOrange.blue, equals(0x00));
    });

    test('测试不透明度', () {
      // 使用withAlpha代替withOpacity
      const Color baseColor = Color(0xFF35BB78);
      final Color transparentColor = baseColor.withAlpha(127);

      // 验证不透明度 - 直接使用alpha而不是a
      expect(transparentColor.alpha, equals(127));
    });
  });
}
