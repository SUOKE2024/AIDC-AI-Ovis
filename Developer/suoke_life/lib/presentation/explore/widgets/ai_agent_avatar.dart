import 'package:flutter/material.dart';
import 'package:suoke_life/core/theme/app_colors.dart';

/// AI代理头像组件
class AIAgentAvatar extends StatefulWidget {
  final VoidCallback onTap;
  final double size;
  final bool showPulse;

  const AIAgentAvatar({
    super.key,
    required this.onTap,
    this.size = 60,
    this.showPulse = true,
  });

  @override
  State<AIAgentAvatar> createState() => _AIAgentAvatarState();
}

class _AIAgentAvatarState extends State<AIAgentAvatar>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();

    // 初始化脉冲动画控制器
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    // 创建脉冲动画
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(
        parent: _pulseController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: widget.showPulse ? _buildPulsingAvatar() : _buildAvatar(),
    );
  }

  /// 构建带脉冲效果的头像
  Widget _buildPulsingAvatar() {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: _buildAvatar(),
        );
      },
    );
  }

  /// 构建AI代理头像
  Widget _buildAvatar() {
    return Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primaryColor,
            AppColors.primaryColor.withAlpha(200),
            AppColors.secondaryColor,
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryColor.withAlpha(100),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Center(
        child: Icon(
          Icons.psychology,
          color: Colors.white,
          size: widget.size * 0.6,
        ),
      ),
    );
  }
}
