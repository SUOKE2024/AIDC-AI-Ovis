import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 核心服务Provider文件
/// 包含应用程序的核心服务Provider

// 示例：主题Provider
final isDarkModeProvider = StateProvider<bool>((ref) => false);
