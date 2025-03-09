import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 偏好设置管理器
class PreferencesManager {
  final SharedPreferences _prefs;

  // 键名常量
  static const String _keyHasSeenWelcome = 'has_seen_welcome';
  static const String _keyLastLoginTime = 'last_login_time';

  PreferencesManager(this._prefs);

  /// 是否已经看过欢迎页面
  bool get hasSeenWelcome => _prefs.getBool(_keyHasSeenWelcome) ?? false;

  /// 设置是否已经看过欢迎页面
  Future<void> setHasSeenWelcome(bool value) async {
    await _prefs.setBool(_keyHasSeenWelcome, value);
  }

  /// 获取上次登录时间
  DateTime? get lastLoginTime {
    final timestamp = _prefs.getInt(_keyLastLoginTime);
    if (timestamp == null) return null;
    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }

  /// 设置上次登录时间
  Future<void> setLastLoginTime(DateTime time) async {
    await _prefs.setInt(_keyLastLoginTime, time.millisecondsSinceEpoch);
  }

  /// 清除所有偏好设置
  Future<void> clear() async {
    await _prefs.clear();
  }
}

/// 偏好设置管理器Provider
final preferencesManagerProvider = Provider<PreferencesManager>((ref) {
  throw UnimplementedError('需要在ProviderScope中覆盖此Provider');
});

/// 初始化偏好设置管理器
Future<PreferencesManager> initPreferencesManager() async {
  final prefs = await SharedPreferences.getInstance();
  return PreferencesManager(prefs);
}
