import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';
import 'dart:math';

/// 用户信息设置卡片
class UserInfoSetupCard extends StatefulWidget {
  final VoidCallback onInfoCompleted;

  const UserInfoSetupCard({
    super.key,
    required this.onInfoCompleted,
  });

  @override
  State<UserInfoSetupCard> createState() => _UserInfoSetupCardState();
}

class _UserInfoSetupCardState extends State<UserInfoSetupCard> {
  // 默认头像选项
  final List<Map<String, dynamic>> _avatarOptions = [
    {'id': 'male_1', 'icon': Icons.face, 'color': Colors.blue},
    {'id': 'male_2', 'icon': Icons.sports, 'color': Colors.indigo},
    {
      'id': 'female_1',
      'icon': Icons.face_retouching_natural,
      'color': Colors.pink
    },
    {'id': 'female_2', 'icon': Icons.self_improvement, 'color': Colors.purple},
    {'id': 'neutral_1', 'icon': Icons.emoji_people, 'color': Colors.amber},
    {'id': 'neutral_2', 'icon': Icons.psychology, 'color': Colors.teal},
  ];

  // 随机昵称列表
  final List<String> _randomNicknames = [
    '健康达人',
    '养生先锋',
    '活力四射',
    '阳光少年',
    '智慧长者',
    '悠然自得',
    '平衡之道',
    '索克达人',
    '生活家',
    '自然之友',
    '和谐之声',
    '活力之源',
  ];

  // 表单控制器
  final TextEditingController _nicknameController = TextEditingController();

  // 表单状态
  late Map<String, dynamic> _selectedAvatar; // 选中的头像
  String _selectedGender = '男'; // 默认性别
  DateTime _selectedDate =
      DateTime.now().subtract(const Duration(days: 365 * 25)); // 默认25岁
  bool _isCustomAvatar = false; // 是否使用自定义头像

  // 表单验证
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();

    // 随机选择一个头像
    final random = Random();
    _selectedAvatar = _avatarOptions[random.nextInt(_avatarOptions.length)];

    // 设置随机昵称
    _nicknameController.text = _getRandomNickname();
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    super.dispose();
  }

  /// 获取随机昵称
  String _getRandomNickname() {
    final random = Random();
    return _randomNicknames[random.nextInt(_randomNicknames.length)];
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: isDarkMode ? Colors.black.withAlpha(100) : Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 头像选择
              _buildAvatarSelection(),

              const SizedBox(height: 24),

              // 昵称输入
              TextFormField(
                controller: _nicknameController,
                decoration: InputDecoration(
                  labelText: '昵称',
                  hintText: '请输入昵称',
                  prefixIcon: const Icon(Icons.person),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.refresh),
                    tooltip: '随机昵称',
                    onPressed: () {
                      setState(() {
                        _nicknameController.text = _getRandomNickname();
                      });
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '请输入昵称';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 24),

              // 性别选择
              _buildGenderSelection(),

              const SizedBox(height: 24),

              // 生日选择
              _buildDateSelection(context),

              const SizedBox(height: 32),

              // 确认按钮
              _buildSubmitButton(),
            ],
          ),
        ),
      ),
    );
  }

  /// 构建头像选择组件
  Widget _buildAvatarSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // 当前选中头像
        Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: _selectedAvatar['color'].withAlpha(100),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: CircleAvatar(
            radius: 50,
            backgroundColor: _isCustomAvatar
                ? Colors.grey.withAlpha(50)
                : _selectedAvatar['color'].withAlpha(50),
            child: _isCustomAvatar
                ? const Icon(Icons.person, size: 60, color: Colors.grey)
                : Icon(
                    _selectedAvatar['icon'],
                    size: 60,
                    color: _selectedAvatar['color'],
                  ),
          ),
        ),

        const SizedBox(height: 16),

        // 头像选择提示
        const Text(
          '选择头像',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey,
          ),
        ),

        const SizedBox(height: 12),

        // 头像选项
        SizedBox(
          height: 80,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _avatarOptions.length + 1, // +1为自定义头像上传选项
            itemBuilder: (context, index) {
              if (index == _avatarOptions.length) {
                // 自定义头像上传选项
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: InkWell(
                    onTap: _handleAvatarUpload,
                    borderRadius: BorderRadius.circular(40),
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: _isCustomAvatar
                            ? AppColors.primaryColor.withAlpha(50)
                            : Colors.grey.withAlpha(40),
                        shape: BoxShape.circle,
                        border: _isCustomAvatar
                            ? Border.all(
                                color: AppColors.primaryColor,
                                width: 2,
                              )
                            : null,
                      ),
                      child: Icon(
                        Icons.add_a_photo,
                        color: _isCustomAvatar
                            ? AppColors.primaryColor
                            : Colors.grey,
                      ),
                    ),
                  ),
                );
              }

              // 预设头像选项
              final avatar = _avatarOptions[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: InkWell(
                  onTap: () => _handleAvatarSelected(avatar),
                  borderRadius: BorderRadius.circular(40),
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: _selectedAvatar['id'] == avatar['id'] &&
                              !_isCustomAvatar
                          ? avatar['color'].withAlpha(50)
                          : Colors.grey.withAlpha(40),
                      shape: BoxShape.circle,
                      border: _selectedAvatar['id'] == avatar['id'] &&
                              !_isCustomAvatar
                          ? Border.all(
                              color: avatar['color'],
                              width: 2,
                            )
                          : null,
                    ),
                    child: Icon(
                      avatar['icon'],
                      color: _selectedAvatar['id'] == avatar['id'] &&
                              !_isCustomAvatar
                          ? avatar['color']
                          : Colors.grey,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  /// 构建性别选择组件
  Widget _buildGenderSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '性别',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // 男性选项
            _buildGenderOption('男', Icons.male),

            const SizedBox(width: 24),

            // 女性选项
            _buildGenderOption('女', Icons.female),
          ],
        ),
      ],
    );
  }

  /// 构建单个性别选项
  Widget _buildGenderOption(String gender, IconData icon) {
    final isSelected = _selectedGender == gender;
    final color = gender == '男' ? Colors.blue : Colors.pink;

    return InkWell(
      onTap: () => _handleGenderSelected(gender),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 32,
          vertical: 12,
        ),
        decoration: BoxDecoration(
          color: isSelected ? color.withAlpha(50) : Colors.grey.withAlpha(30),
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? Border.all(
                  color: color,
                  width: 1,
                )
              : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? color : Colors.grey,
            ),
            const SizedBox(width: 8),
            Text(
              gender,
              style: TextStyle(
                color: isSelected ? color : Colors.grey,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建日期选择组件
  Widget _buildDateSelection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '出生日期',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        InkWell(
          onTap: () => _selectDate(context),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.black.withAlpha(50)
                  : Colors.grey.withAlpha(20),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: Colors.grey.withAlpha(50),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.calendar_today,
                  color: Colors.grey,
                  size: 20,
                ),
                const SizedBox(width: 16),
                Text(
                  '${_selectedDate.year}年${_selectedDate.month}月${_selectedDate.day}日',
                  style: const TextStyle(
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                const Icon(
                  Icons.arrow_drop_down,
                  color: Colors.grey,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// 构建提交按钮
  Widget _buildSubmitButton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryColor.withAlpha(50),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _handleSubmit,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: const Text(
          '确认',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  /// 处理日期选择
  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      helpText: '选择出生日期',
      cancelText: '取消',
      confirmText: '确定',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primaryColor,
              onPrimary: Colors.white,
              onSurface: Theme.of(context).textTheme.bodyLarge!.color!,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  /// 处理头像选择
  void _handleAvatarSelected(Map<String, dynamic> avatar) {
    setState(() {
      _selectedAvatar = avatar;
      _isCustomAvatar = false;
    });
  }

  /// 处理性别选择
  void _handleGenderSelected(String gender) {
    setState(() {
      _selectedGender = gender;
    });
  }

  /// 处理头像上传
  void _handleAvatarUpload() {
    // TODO: 实现实际的头像上传逻辑
    setState(() {
      _isCustomAvatar = true;
    });

    // 显示消息
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('此功能在实际应用中将允许上传自定义头像'),
      ),
    );
  }

  /// 处理表单提交
  void _handleSubmit() {
    if (_formKey.currentState!.validate()) {
      // 表单验证通过，调用完成回调
      widget.onInfoCompleted();
    }
  }
}
