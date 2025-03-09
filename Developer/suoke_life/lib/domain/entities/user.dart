/// 用户实体类
class User {
  /// 用户ID
  final String id;

  /// 用户名
  final String username;

  /// 电子邮件
  final String email;

  /// 显示名称
  final String displayName;

  /// 头像URL
  final String? avatar;

  /// 创建时间
  final DateTime createdAt;

  /// 最后登录时间
  final DateTime? lastLoginAt;

  /// 用户偏好设置
  final Map<String, dynamic>? preferences;

  /// 用户角色
  final List<String>? roles;

  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.displayName,
    this.avatar,
    required this.createdAt,
    this.lastLoginAt,
    this.preferences,
    this.roles,
  });

  /// 创建副本并更新字段
  User copyWith({
    String? id,
    String? username,
    String? email,
    String? displayName,
    String? avatar,
    DateTime? createdAt,
    DateTime? lastLoginAt,
    Map<String, dynamic>? preferences,
    List<String>? roles,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      avatar: avatar ?? this.avatar,
      createdAt: createdAt ?? this.createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      preferences: preferences ?? this.preferences,
      roles: roles ?? this.roles,
    );
  }
}
