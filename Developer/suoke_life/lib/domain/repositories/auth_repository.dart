import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suoke_life/domain/entities/user.dart';

/// 认证存储库接口
abstract class AuthRepository {
  /// 当前用户
  User? get currentUser;

  /// 是否已认证
  bool get isAuthenticated;

  /// 登录
  Future<User> login(String username, String password);

  /// 使用手机号码登录
  Future<User> loginWithPhoneNumber(String phoneNumber);

  /// 使用第三方登录
  Future<User> loginWithThirdParty(String provider);

  /// 注册
  Future<User> register(String username, String password, String email);

  /// 登出
  Future<void> logout();

  /// 发送密码重置邮件
  Future<void> sendPasswordResetEmail(String email);

  /// 重置密码
  Future<void> resetPassword(String token, String newPassword);

  /// 更新用户信息
  Future<User> updateUser(User user);

  /// 获取用户信息
  Future<User> getUserInfo();
}

/// 认证存储库Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  // 这里应该返回实际的认证存储库实现
  return MockAuthRepository();
});

/// 模拟认证存储库实现（用于开发阶段）
class MockAuthRepository implements AuthRepository {
  User? _currentUser;

  @override
  User? get currentUser => _currentUser;

  @override
  bool get isAuthenticated => _currentUser != null;

  @override
  Future<User> login(String username, String password) async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(seconds: 1));

    // 简单的验证逻辑
    if (username == 'test' && password == 'password') {
      _currentUser = User(
        id: '1',
        username: username,
        email: 'test@example.com',
        displayName: '测试用户',
        avatar: 'https://via.placeholder.com/150',
        createdAt: DateTime.now(),
      );
      return _currentUser!;
    } else {
      throw Exception('用户名或密码错误');
    }
  }

  @override
  Future<User> loginWithPhoneNumber(String phoneNumber) async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(seconds: 1));

    // 在实际应用中，这里应该验证手机号码
    _currentUser = User(
      id: '4',
      username: 'phone_user',
      email: 'phone_user@example.com',
      displayName: '手机用户',
      avatar: 'https://via.placeholder.com/150',
      createdAt: DateTime.now(),
    );
    return _currentUser!;
  }

  @override
  Future<User> loginWithThirdParty(String provider) async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(seconds: 1));

    _currentUser = User(
      id: '2',
      username: 'third_party_user',
      email: 'third_party@example.com',
      displayName: '第三方用户',
      avatar: 'https://via.placeholder.com/150',
      createdAt: DateTime.now(),
    );
    return _currentUser!;
  }

  @override
  Future<User> register(String username, String password, String email) async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(seconds: 1));

    _currentUser = User(
      id: '3',
      username: username,
      email: email,
      displayName: '新用户',
      avatar: 'https://via.placeholder.com/150',
      createdAt: DateTime.now(),
    );
    return _currentUser!;
  }

  @override
  Future<void> logout() async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(milliseconds: 500));

    _currentUser = null;
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(milliseconds: 500));

    // 在实际应用中，这里会发送重置邮件
    print('发送密码重置邮件到: $email');
  }

  @override
  Future<void> resetPassword(String token, String newPassword) async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(milliseconds: 500));

    // 在实际应用中，这里会验证token并重置密码
    print('使用token "$token" 重置密码为: $newPassword');
  }

  @override
  Future<User> updateUser(User user) async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(milliseconds: 500));

    _currentUser = user;
    return _currentUser!;
  }

  @override
  Future<User> getUserInfo() async {
    // 模拟网络请求延迟
    await Future.delayed(const Duration(milliseconds: 500));

    if (_currentUser != null) {
      return _currentUser!;
    } else {
      throw Exception('用户未登录');
    }
  }
}
