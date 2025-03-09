import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'package:suoke_life/core/theme/app_shapes.dart';
import 'package:suoke_life/core/theme/app_spacing.dart';

/// 输入框大小枚举
enum AppTextFieldSize {
  /// 小尺寸输入框
  small,

  /// 中等尺寸输入框
  medium,

  /// 大尺寸输入框
  large
}

/// 输入框变体枚举
enum AppTextFieldVariant {
  /// 填充式输入框
  filled,

  /// 轮廓式输入框
  outlined,

  /// 底部线条式输入框
  underlined,

  /// 简约式输入框
  minimal
}

/// 索克风格统一输入框组件
///
/// 提供统一样式的输入框组件，支持多种变体和尺寸。
/// 包含前缀/后缀图标，错误提示，字数统计等功能。
class AppTextField extends StatefulWidget {
  /// 控制器
  final TextEditingController? controller;

  /// 焦点节点
  final FocusNode? focusNode;

  /// 输入框标签
  final String? label;

  /// 占位文本
  final String? hintText;

  /// 帮助文本
  final String? helperText;

  /// 错误文本
  final String? errorText;

  /// 前缀图标
  final IconData? prefixIcon;

  /// 后缀图标
  final IconData? suffixIcon;

  /// 后缀组件
  final Widget? suffix;

  /// 清除按钮
  final bool showClearButton;

  /// 是否隐藏文本 (密码)
  final bool obscureText;

  /// 键盘类型
  final TextInputType keyboardType;

  /// 文本输入动作
  final TextInputAction textInputAction;

  /// 最大行数
  final int? maxLines;

  /// 最小行数
  final int? minLines;

  /// 最大长度
  final int? maxLength;

  /// 是否显示字数统计
  final bool showCounter;

  /// 输入框变体
  final AppTextFieldVariant variant;

  /// 输入框尺寸
  final AppTextFieldSize size;

  /// 是否自动获取焦点
  final bool autofocus;

  /// 是否只读
  final bool readOnly;

  /// 是否禁用
  final bool enabled;

  /// 输入格式化器
  final List<TextInputFormatter>? inputFormatters;

  /// 内容变化回调
  final ValueChanged<String>? onChanged;

  /// 提交回调
  final ValueChanged<String>? onSubmitted;

  /// 点击回调
  final VoidCallback? onTap;

  /// 自定义填充颜色
  final Color? fillColor;

  /// 自定义边框颜色
  final Color? borderColor;

  /// 自定义文本样式
  final TextStyle? textStyle;

  const AppTextField({
    super.key,
    this.controller,
    this.focusNode,
    this.label,
    this.hintText,
    this.helperText,
    this.errorText,
    this.prefixIcon,
    this.suffixIcon,
    this.suffix,
    this.showClearButton = false,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.done,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.showCounter = false,
    this.variant = AppTextFieldVariant.filled,
    this.size = AppTextFieldSize.medium,
    this.autofocus = false,
    this.readOnly = false,
    this.enabled = true,
    this.inputFormatters,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.fillColor,
    this.borderColor,
    this.textStyle,
  });

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  bool _obscureText = false;
  bool _hasFocus = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _focusNode = widget.focusNode ?? FocusNode();
    _obscureText = widget.obscureText;

    _focusNode.addListener(_handleFocusChange);
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.removeListener(_handleFocusChange);
      _focusNode.dispose();
    }

    if (widget.controller == null) {
      _controller.dispose();
    }

    super.dispose();
  }

  void _handleFocusChange() {
    if (_focusNode.hasFocus != _hasFocus) {
      setState(() {
        _hasFocus = _focusNode.hasFocus;
      });
    }
  }

  void _handleClear() {
    _controller.clear();
    if (widget.onChanged != null) {
      widget.onChanged!('');
    }
  }

  void _toggleObscureText() {
    setState(() {
      _obscureText = !_obscureText;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    // 构建输入装饰
    final InputDecoration decoration = _buildInputDecoration(isDarkMode);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // 标签 (如果在输入框上方显示)
        if (widget.label != null &&
            widget.variant != AppTextFieldVariant.filled) ...[
          Text(
            widget.label!,
            style: TextStyle(
              fontSize: _getLabelFontSize(),
              fontWeight: FontWeight.w500,
              color: widget.errorText != null
                  ? AppColors.errorColor
                  : _hasFocus
                      ? AppColors.primaryColor
                      : (isDarkMode
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary),
            ),
          ),
          SizedBox(height: AppSpacing.xs),
        ],

        // 输入框
        TextField(
          controller: _controller,
          focusNode: _focusNode,
          decoration: decoration,
          style: widget.textStyle ?? _getTextStyle(isDarkMode),
          obscureText: _obscureText,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          maxLines: widget.obscureText ? 1 : widget.maxLines,
          minLines: widget.minLines,
          maxLength: widget.showCounter ? widget.maxLength : null,
          buildCounter: widget.showCounter && widget.maxLength != null
              ? (context,
                  {required currentLength, required isFocused, maxLength}) {
                  return Text(
                    '$currentLength/$maxLength',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDarkMode
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                  );
                }
              : null,
          enabled: widget.enabled,
          readOnly: widget.readOnly,
          autofocus: widget.autofocus,
          inputFormatters: widget.inputFormatters,
          onChanged: widget.onChanged,
          onSubmitted: widget.onSubmitted,
          onTap: widget.onTap,
        ),

        // 辅助文本或错误文本
        if (widget.errorText != null || widget.helperText != null) ...[
          SizedBox(height: AppSpacing.xs),
          Text(
            widget.errorText ?? widget.helperText!,
            style: TextStyle(
              fontSize: 12,
              color: widget.errorText != null
                  ? AppColors.errorColor
                  : (isDarkMode
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary),
            ),
          ),
        ],
      ],
    );
  }

  /// 构建输入装饰
  InputDecoration _buildInputDecoration(bool isDarkMode) {
    // 基础装饰
    InputDecoration decoration = InputDecoration(
      hintText: widget.hintText,
      hintStyle: TextStyle(
        color: isDarkMode
            ? AppColors.darkTextSecondary
            : AppColors.lightTextSecondary,
        fontSize: _getInputFontSize(),
      ),
      errorText: null, // 错误文本单独显示
      errorStyle: const TextStyle(height: 0, fontSize: 0),
      helperText: null, // 辅助文本单独显示
      helperStyle: const TextStyle(height: 0, fontSize: 0),
      contentPadding: _getContentPadding(),
      isDense: true,
      filled: widget.variant == AppTextFieldVariant.filled,
      fillColor: widget.fillColor ?? _getFillColor(isDarkMode),

      // 前缀图标
      prefixIcon: widget.prefixIcon != null
          ? Icon(
              widget.prefixIcon,
              color: widget.errorText != null
                  ? AppColors.errorColor
                  : (isDarkMode
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary),
              size: _getIconSize(),
            )
          : null,

      // 后缀图标/组件
      suffixIcon: _buildSuffixIcon(isDarkMode),

      // 计数器文字样式
      counterStyle: const TextStyle(height: 0, fontSize: 0),

      // 浮动标签 (仅用于filled变体)
      labelText:
          widget.variant == AppTextFieldVariant.filled ? widget.label : null,
      labelStyle: TextStyle(
        color: widget.errorText != null
            ? AppColors.errorColor
            : _hasFocus
                ? AppColors.primaryColor
                : (isDarkMode
                    ? AppColors.darkTextSecondary
                    : AppColors.lightTextSecondary),
        fontSize: _getLabelFontSize(),
      ),
      floatingLabelBehavior: FloatingLabelBehavior.auto,
    );

    // 根据变体样式调整边框
    decoration = _applyBorderStyle(decoration, isDarkMode);

    return decoration;
  }

  /// 构建后缀图标
  Widget? _buildSuffixIcon(bool isDarkMode) {
    List<Widget> suffixWidgets = [];

    // 清除按钮
    if (widget.showClearButton && _controller.text.isNotEmpty) {
      suffixWidgets.add(
        InkWell(
          onTap: _handleClear,
          borderRadius: BorderRadius.circular(16),
          child: Icon(
            Icons.clear,
            color: isDarkMode
                ? AppColors.darkTextSecondary
                : AppColors.lightTextSecondary,
            size: _getIconSize(),
          ),
        ),
      );
    }

    // 密码可见性切换
    if (widget.obscureText) {
      suffixWidgets.add(
        InkWell(
          onTap: _toggleObscureText,
          borderRadius: BorderRadius.circular(16),
          child: Icon(
            _obscureText ? Icons.visibility_off : Icons.visibility,
            color: isDarkMode
                ? AppColors.darkTextSecondary
                : AppColors.lightTextSecondary,
            size: _getIconSize(),
          ),
        ),
      );
    }

    // 自定义后缀图标
    if (widget.suffixIcon != null) {
      suffixWidgets.add(
        Icon(
          widget.suffixIcon,
          color: widget.errorText != null
              ? AppColors.errorColor
              : (isDarkMode
                  ? AppColors.darkTextSecondary
                  : AppColors.lightTextSecondary),
          size: _getIconSize(),
        ),
      );
    }

    // 自定义后缀组件
    if (widget.suffix != null) {
      suffixWidgets.add(widget.suffix!);
    }

    if (suffixWidgets.isEmpty) {
      return null;
    } else if (suffixWidgets.length == 1) {
      return suffixWidgets.first;
    } else {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: suffixWidgets,
      );
    }
  }

  /// 应用边框样式
  InputDecoration _applyBorderStyle(
      InputDecoration decoration, bool isDarkMode) {
    switch (widget.variant) {
      case AppTextFieldVariant.filled:
        return decoration.copyWith(
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
            borderSide: BorderSide(
              color: widget.borderColor ?? AppColors.primaryColor,
              width: 1.5,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
            borderSide: BorderSide(
              color: AppColors.errorColor,
              width: 1.5,
            ),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
            borderSide: BorderSide(
              color: AppColors.errorColor,
              width: 1.5,
            ),
          ),
        );

      case AppTextFieldVariant.outlined:
        return decoration.copyWith(
          filled: false,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
            borderSide: BorderSide(
              color: widget.borderColor ??
                  (isDarkMode ? AppColors.darkBorder : AppColors.lightBorder),
              width: 1.0,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
            borderSide: BorderSide(
              color: widget.borderColor ?? AppColors.primaryColor,
              width: 1.5,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
            borderSide: BorderSide(
              color: AppColors.errorColor,
              width: 1.5,
            ),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppShapes.radiusSM),
            borderSide: BorderSide(
              color: AppColors.errorColor,
              width: 1.5,
            ),
          ),
        );

      case AppTextFieldVariant.underlined:
        return decoration.copyWith(
          filled: false,
          enabledBorder: UnderlineInputBorder(
            borderSide: BorderSide(
              color: widget.borderColor ??
                  (isDarkMode ? AppColors.darkBorder : AppColors.lightBorder),
              width: 1.0,
            ),
          ),
          focusedBorder: UnderlineInputBorder(
            borderSide: BorderSide(
              color: widget.borderColor ?? AppColors.primaryColor,
              width: 2.0,
            ),
          ),
          errorBorder: UnderlineInputBorder(
            borderSide: BorderSide(
              color: AppColors.errorColor,
              width: 1.0,
            ),
          ),
          focusedErrorBorder: UnderlineInputBorder(
            borderSide: BorderSide(
              color: AppColors.errorColor,
              width: 2.0,
            ),
          ),
        );

      case AppTextFieldVariant.minimal:
        return decoration.copyWith(
          filled: false,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          focusedErrorBorder: InputBorder.none,
        );
    }
  }

  /// 获取填充颜色
  Color _getFillColor(bool isDarkMode) {
    if (widget.errorText != null) {
      return AppColors.errorColor.withAlpha(20);
    }

    return isDarkMode
        ? AppColors.darkInputBackground
        : AppColors.lightInputBackground;
  }

  /// 获取内容内边距
  EdgeInsetsGeometry _getContentPadding() {
    switch (widget.size) {
      case AppTextFieldSize.small:
        return EdgeInsets.symmetric(
          horizontal:
              (widget.prefixIcon != null || widget.suffixIcon != null) ? 4 : 10,
          vertical: 8,
        );
      case AppTextFieldSize.medium:
        return EdgeInsets.symmetric(
          horizontal:
              (widget.prefixIcon != null || widget.suffixIcon != null) ? 8 : 16,
          vertical: 12,
        );
      case AppTextFieldSize.large:
        return EdgeInsets.symmetric(
          horizontal: (widget.prefixIcon != null || widget.suffixIcon != null)
              ? 12
              : 20,
          vertical: 16,
        );
    }
  }

  /// 获取标签字体大小
  double _getLabelFontSize() {
    switch (widget.size) {
      case AppTextFieldSize.small:
        return 12.0;
      case AppTextFieldSize.medium:
        return 14.0;
      case AppTextFieldSize.large:
        return 16.0;
    }
  }

  /// 获取输入字体大小
  double _getInputFontSize() {
    switch (widget.size) {
      case AppTextFieldSize.small:
        return 14.0;
      case AppTextFieldSize.medium:
        return 16.0;
      case AppTextFieldSize.large:
        return 18.0;
    }
  }

  /// 获取图标大小
  double _getIconSize() {
    switch (widget.size) {
      case AppTextFieldSize.small:
        return 16.0;
      case AppTextFieldSize.medium:
        return 20.0;
      case AppTextFieldSize.large:
        return 24.0;
    }
  }

  /// 获取文本样式
  TextStyle _getTextStyle(bool isDarkMode) {
    return TextStyle(
      fontSize: _getInputFontSize(),
      color:
          isDarkMode ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
    );
  }
}

/// 填充式输入框
class FilledTextField extends AppTextField {
  const FilledTextField({
    super.key,
    super.controller,
    super.focusNode,
    super.label,
    super.hintText,
    super.helperText,
    super.errorText,
    super.prefixIcon,
    super.suffixIcon,
    super.suffix,
    super.showClearButton = false,
    super.obscureText = false,
    super.keyboardType = TextInputType.text,
    super.textInputAction = TextInputAction.done,
    super.maxLines = 1,
    super.minLines,
    super.maxLength,
    super.showCounter = false,
    super.size = AppTextFieldSize.medium,
    super.autofocus = false,
    super.readOnly = false,
    super.enabled = true,
    super.inputFormatters,
    super.onChanged,
    super.onSubmitted,
    super.onTap,
    super.fillColor,
    super.textStyle,
  }) : super(variant: AppTextFieldVariant.filled);
}

/// 轮廓式输入框
class OutlinedTextField extends AppTextField {
  const OutlinedTextField({
    super.key,
    super.controller,
    super.focusNode,
    super.label,
    super.hintText,
    super.helperText,
    super.errorText,
    super.prefixIcon,
    super.suffixIcon,
    super.suffix,
    super.showClearButton = false,
    super.obscureText = false,
    super.keyboardType = TextInputType.text,
    super.textInputAction = TextInputAction.done,
    super.maxLines = 1,
    super.minLines,
    super.maxLength,
    super.showCounter = false,
    super.size = AppTextFieldSize.medium,
    super.autofocus = false,
    super.readOnly = false,
    super.enabled = true,
    super.inputFormatters,
    super.onChanged,
    super.onSubmitted,
    super.onTap,
    super.borderColor,
    super.textStyle,
  }) : super(variant: AppTextFieldVariant.outlined);
}

/// 底部线条式输入框
class UnderlinedTextField extends AppTextField {
  const UnderlinedTextField({
    super.key,
    super.controller,
    super.focusNode,
    super.label,
    super.hintText,
    super.helperText,
    super.errorText,
    super.prefixIcon,
    super.suffixIcon,
    super.suffix,
    super.showClearButton = false,
    super.obscureText = false,
    super.keyboardType = TextInputType.text,
    super.textInputAction = TextInputAction.done,
    super.maxLines = 1,
    super.minLines,
    super.maxLength,
    super.showCounter = false,
    super.size = AppTextFieldSize.medium,
    super.autofocus = false,
    super.readOnly = false,
    super.enabled = true,
    super.inputFormatters,
    super.onChanged,
    super.onSubmitted,
    super.onTap,
    super.borderColor,
    super.textStyle,
  }) : super(variant: AppTextFieldVariant.underlined);
}
