import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_typography.dart';
import 'package:suoke_life/core/theme/app_shapes.dart';

/// 应用主题配置
/// 参考苹果设计系统风格
class AppTheme {
  // 私有构造函数，防止实例化
  AppTheme._();

  // iOS标准圆角值
  static const double _kCornerRadius = 10.0; // 标准圆角
  static const double _kButtonCornerRadius = 8.0; // 按钮圆角
  static const double _kCardCornerRadius = 16.0; // 卡片圆角
  static const double _kInputCornerRadius = 10.0; // 输入框圆角

  /// 亮色主题
  static ThemeData lightTheme() {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: AppColors.primaryColor,
      scaffoldBackgroundColor: AppColors.lightBackground,
      colorScheme: ColorScheme.light(
        primary: AppColors.primaryColor,
        secondary: AppColors.secondaryColor,
        background: AppColors.lightBackground,
        surface: AppColors.lightSurface,
        error: AppColors.errorColor,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onBackground: AppColors.lightTextPrimary,
        onSurface: AppColors.lightTextPrimary,
        onError: Colors.white,
      ),

      // 文本主题
      textTheme: TextTheme(
        displayLarge: AppTypography.heading1Style
            .copyWith(color: AppColors.lightTextPrimary),
        displayMedium: AppTypography.heading2Style
            .copyWith(color: AppColors.lightTextPrimary),
        displaySmall: AppTypography.heading3Style
            .copyWith(color: AppColors.lightTextPrimary),
        headlineMedium: AppTypography.heading4Style
            .copyWith(color: AppColors.lightTextPrimary),
        bodyLarge: AppTypography.body1Style
            .copyWith(color: AppColors.lightTextPrimary),
        bodyMedium: AppTypography.body2Style
            .copyWith(color: AppColors.lightTextPrimary),
        labelLarge: AppTypography.body2Style.copyWith(
            color: AppColors.lightTextPrimary, fontWeight: FontWeight.w500),
        bodySmall: AppTypography.captionStyle
            .copyWith(color: AppColors.lightTextSecondary),
        labelSmall: AppTypography.smallStyle
            .copyWith(color: AppColors.lightTextSecondary),
      ),

      // 卡片主题
      cardTheme: CardTheme(
        color: AppColors.lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppShapes.radiusLG),
        ),
        margin: EdgeInsets.zero,
      ),

      // 按钮主题
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
          ),
          elevation: 0,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
          ),
          side: BorderSide(color: AppColors.primaryColor),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
          ),
        ),
      ),

      // 输入框主题
      inputDecorationTheme: InputDecorationTheme(
        fillColor: AppColors.lightBackground,
        filled: true,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppShapes.radiusSM),
          borderSide: BorderSide(color: AppColors.lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppShapes.radiusSM),
          borderSide: BorderSide(color: AppColors.lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppShapes.radiusSM),
          borderSide: BorderSide(color: AppColors.primaryColor),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppShapes.radiusSM),
          borderSide: BorderSide(color: AppColors.errorColor),
        ),
      ),

      // 切换控件主题
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return AppColors.primaryColor;
          }
          return Colors.grey;
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return AppColors.primaryColor.withAlpha(100);
          }
          return Colors.grey.withAlpha(100);
        }),
      ),

      // 应用栏主题
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.lightSurface,
        foregroundColor: AppColors.lightTextPrimary,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: AppColors.lightTextPrimary),
      ),

      // 底部导航栏主题
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.lightSurface,
        selectedItemColor: AppColors.primaryColor,
        unselectedItemColor: AppColors.lightSystemGray,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }

  /// 暗色主题
  static ThemeData darkTheme() {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: AppColors.primaryColor,
      scaffoldBackgroundColor: AppColors.darkBackground,
      colorScheme: ColorScheme.dark(
        primary: AppColors.primaryColor,
        secondary: AppColors.secondaryColor,
        background: AppColors.darkBackground,
        surface: AppColors.darkSurface,
        error: AppColors.errorColor,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onBackground: AppColors.darkTextPrimary,
        onSurface: AppColors.darkTextPrimary,
        onError: Colors.white,
      ),

      // 文本主题
      textTheme: TextTheme(
        displayLarge: AppTypography.heading1Style
            .copyWith(color: AppColors.darkTextPrimary),
        displayMedium: AppTypography.heading2Style
            .copyWith(color: AppColors.darkTextPrimary),
        displaySmall: AppTypography.heading3Style
            .copyWith(color: AppColors.darkTextPrimary),
        headlineMedium: AppTypography.heading4Style
            .copyWith(color: AppColors.darkTextPrimary),
        bodyLarge:
            AppTypography.body1Style.copyWith(color: AppColors.darkTextPrimary),
        bodyMedium:
            AppTypography.body2Style.copyWith(color: AppColors.darkTextPrimary),
        bodySmall: AppTypography.captionStyle
            .copyWith(color: AppColors.darkTextSecondary),
        labelLarge: AppTypography.body2Style.copyWith(
            color: AppColors.darkTextPrimary, fontWeight: FontWeight.w500),
        labelSmall: AppTypography.smallStyle
            .copyWith(color: AppColors.darkTextSecondary),
      ),

      // 卡片主题
      cardTheme: CardTheme(
        color: AppColors.darkSurface,
        elevation: 0,
        margin: const EdgeInsets.all(8.0),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_kCardCornerRadius),
        ),
        shadowColor: Colors.black.withAlpha(50),
      ),

      // 对话框主题
      dialogTheme: DialogTheme(
        backgroundColor: AppColors.darkBlurTint,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_kCornerRadius),
        ),
      ),

      // 分割线主题
      dividerTheme: const DividerThemeData(
        color: AppColors.darkDivider,
        thickness: 0.5,
        space: 1,
      ),

      // 列表瓦片主题
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),

      // 进度指示器主题
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primaryColor,
        circularTrackColor: AppColors.darkSystemGray5,
        linearTrackColor: AppColors.darkSystemGray5,
      ),

      // 按钮主题
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: MaterialStateProperty.resolveWith((states) {
            if (states.contains(MaterialState.disabled)) {
              return AppColors.darkSystemGray5;
            }
            return AppColors.primaryColor;
          }),
          foregroundColor: MaterialStateProperty.resolveWith((states) {
            if (states.contains(MaterialState.disabled)) {
              return AppColors.darkSystemGray;
            }
            return Colors.white;
          }),
          elevation: MaterialStateProperty.all(0),
          padding: MaterialStateProperty.all(
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          shape: MaterialStateProperty.all(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(_kButtonCornerRadius),
            ),
          ),
          overlayColor: MaterialStateProperty.all(Colors.white.withAlpha(30)),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: ButtonStyle(
          foregroundColor: MaterialStateProperty.all(AppColors.primaryColor),
          padding: MaterialStateProperty.all(
            const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          ),
          shape: MaterialStateProperty.all(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(_kButtonCornerRadius),
            ),
          ),
          overlayColor:
              MaterialStateProperty.all(AppColors.primaryColor.withAlpha(20)),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          foregroundColor: MaterialStateProperty.all(AppColors.primaryColor),
          side: MaterialStateProperty.all(
            const BorderSide(
              color: AppColors.primaryColor,
              width: 1.0,
            ),
          ),
          padding: MaterialStateProperty.all(
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          shape: MaterialStateProperty.all(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(_kButtonCornerRadius),
            ),
          ),
          overlayColor:
              MaterialStateProperty.all(AppColors.primaryColor.withAlpha(20)),
        ),
      ),

      // 输入框主题
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkInputBackground,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_kInputCornerRadius),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_kInputCornerRadius),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_kInputCornerRadius),
          borderSide: const BorderSide(
            color: AppColors.primaryColor,
            width: 1,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_kInputCornerRadius),
          borderSide: const BorderSide(
            color: AppColors.errorColor,
            width: 1,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_kInputCornerRadius),
          borderSide: const BorderSide(
            color: AppColors.errorColor,
            width: 1,
          ),
        ),
        hintStyle: const TextStyle(
          color: AppColors.darkSystemGray,
          fontSize: 15,
        ),
        errorStyle: const TextStyle(
          color: AppColors.errorColor,
          fontSize: 13,
        ),
      ),
    );
  }
}
