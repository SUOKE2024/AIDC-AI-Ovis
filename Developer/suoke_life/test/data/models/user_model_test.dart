import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
// 假设有一个用户模型类，如果项目中尚未定义，可以根据实际情况调整

class UserModel {
  final String id;
  final String name;
  final String email;
  final String? avatarUrl;
  final Map<String, dynamic> preferences;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.avatarUrl,
    required this.preferences,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      avatarUrl: json['avatar_url'] as String?,
      preferences: json['preferences'] as Map<String, dynamic>,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'avatar_url': avatarUrl,
      'preferences': preferences,
    };
  }
}

void main() {
  group('UserModel Tests', () {
    test('测试从JSON解析', () {
      // 给定有效的JSON数据
      final jsonMap = {
        'id': '12345',
        'name': '张三',
        'email': 'zhangsan@example.com',
        'avatar_url': 'https://example.com/avatar.png',
        'preferences': {
          'theme': 'dark',
          'notifications_enabled': true,
        },
      };

      // 解析为模型
      final userModel = UserModel.fromJson(jsonMap);

      // 验证字段
      expect(userModel.id, equals('12345'));
      expect(userModel.name, equals('张三'));
      expect(userModel.email, equals('zhangsan@example.com'));
      expect(userModel.avatarUrl, equals('https://example.com/avatar.png'));
      expect(userModel.preferences['theme'], equals('dark'));
      expect(userModel.preferences['notifications_enabled'], isTrue);
    });

    test('测试转换为JSON', () {
      // 创建模型实例
      final userModel = UserModel(
        id: '12345',
        name: '张三',
        email: 'zhangsan@example.com',
        avatarUrl: 'https://example.com/avatar.png',
        preferences: {
          'theme': 'dark',
          'notifications_enabled': true,
        },
      );

      // 转换为JSON
      final jsonMap = userModel.toJson();

      // 验证JSON数据
      expect(jsonMap['id'], equals('12345'));
      expect(jsonMap['name'], equals('张三'));
      expect(jsonMap['email'], equals('zhangsan@example.com'));
      expect(jsonMap['avatar_url'], equals('https://example.com/avatar.png'));
      expect(jsonMap['preferences']['theme'], equals('dark'));
      expect(jsonMap['preferences']['notifications_enabled'], isTrue);
    });

    test('测试可选字段为null', () {
      // 给定部分字段为null的JSON数据
      final jsonMap = {
        'id': '67890',
        'name': '李四',
        'email': 'lisi@example.com',
        'avatar_url': null,
        'preferences': {
          'theme': 'light',
        },
      };

      // 解析为模型
      final userModel = UserModel.fromJson(jsonMap);

      // 验证字段
      expect(userModel.id, equals('67890'));
      expect(userModel.name, equals('李四'));
      expect(userModel.email, equals('lisi@example.com'));
      expect(userModel.avatarUrl, isNull);
      expect(userModel.preferences['theme'], equals('light'));
    });

    test('测试JSON序列化和反序列化循环', () {
      // 原始JSON字符串
      final jsonString =
          '{"id":"12345","name":"张三","email":"zhangsan@example.com","avatar_url":"https://example.com/avatar.png","preferences":{"theme":"dark","notifications_enabled":true}}';

      // 解析为模型
      final userModel = UserModel.fromJson(json.decode(jsonString));

      // 再转回JSON字符串
      final resultJsonString = json.encode(userModel.toJson());

      // 验证原始JSON和结果JSON是否相同
      expect(json.decode(resultJsonString), equals(json.decode(jsonString)));
    });
  });
}
