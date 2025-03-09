/**
 * 身份验证中间件
 * 用于HTTP API的认证和授权
 */

const logger = require('../../services/loggerService')

/**
 * 创建身份验证中间件
 * @param {Object} authProvider - 认证提供者
 * @returns {Function} Express中间件
 */
function createAuthMiddleware (authProvider) {
  /**
   * 身份验证中间件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  return async function authMiddleware (req, res, next) {
    try {
      // 从请求头获取令牌
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            message: '未提供认证令牌',
            code: 'missing_token'
          }
        })
      }

      // 提取令牌
      const token = authHeader.substring(7)

      // 验证令牌
      const authResult = await authProvider.authenticate(token)

      if (!authResult.success) {
        return res.status(401).json({
          error: {
            message: authResult.message || '无效的令牌',
            code: 'invalid_token'
          }
        })
      }

      // 将用户信息添加到请求对象
      req.user = {
        id: authResult.userId,
        roles: authResult.roles,
        permissions: authResult.permissions
      }

      // 继续请求
      next()
    } catch (error) {
      logger.error(`认证中间件错误: ${error.message}`)
      res.status(500).json({
        error: {
          message: '认证服务错误',
          code: 'auth_service_error'
        }
      })
    }
  }
}

/**
 * 创建基于角色的授权中间件
 * @param {string[]} allowedRoles - 允许的角色列表
 * @returns {Function} Express中间件
 */
function createRoleMiddleware (allowedRoles) {
  /**
   * 角色授权中间件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  return function roleMiddleware (req, res, next) {
    // 检查请求是否已经过认证
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: '未经认证',
          code: 'unauthenticated'
        }
      })
    }

    // 检查用户是否有所需角色
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role))

    if (!hasRole) {
      return res.status(403).json({
        error: {
          message: '没有足够的权限',
          code: 'insufficient_role'
        }
      })
    }

    // 继续请求
    next()
  }
}

/**
 * 创建基于权限的授权中间件
 * @param {Object} authProvider - 认证提供者
 * @param {string} resource - 资源名称
 * @param {string} action - 操作名称
 * @returns {Function} Express中间件
 */
function createPermissionMiddleware (authProvider, resource, action) {
  /**
   * 权限授权中间件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  return async function permissionMiddleware (req, res, next) {
    // 检查请求是否已经过认证
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: '未经认证',
          code: 'unauthenticated'
        }
      })
    }

    try {
      // 检查用户是否有所需权限
      const hasPermission = await authProvider.checkPermission(
        req.user.id,
        resource,
        action
      )

      if (!hasPermission) {
        return res.status(403).json({
          error: {
            message: '没有足够的权限',
            code: 'insufficient_permission'
          }
        })
      }

      // 继续请求
      next()
    } catch (error) {
      logger.error(`权限检查错误: ${error.message}`)
      res.status(500).json({
        error: {
          message: '权限服务错误',
          code: 'permission_service_error'
        }
      })
    }
  }
}

/**
 * 创建可选的认证中间件
 * 不强制要求认证，但如果提供了令牌则会验证
 * @param {Object} authProvider - 认证提供者
 * @returns {Function} Express中间件
 */
function createOptionalAuthMiddleware (authProvider) {
  /**
   * 可选认证中间件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  return async function optionalAuthMiddleware (req, res, next) {
    try {
      // 从请求头获取令牌
      const authHeader = req.headers.authorization

      // 如果没有提供令牌，继续请求
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next()
      }

      // 提取令牌
      const token = authHeader.substring(7)

      // 验证令牌
      const authResult = await authProvider.authenticate(token)

      // 如果验证成功，将用户信息添加到请求对象
      if (authResult.success) {
        req.user = {
          id: authResult.userId,
          roles: authResult.roles,
          permissions: authResult.permissions
        }
      }

      // 继续请求
      next()
    } catch (error) {
      // 处理错误但不阻止请求
      logger.error(`可选认证中间件错误: ${error.message}`)
      next()
    }
  }
}

module.exports = {
  createAuthMiddleware,
  createRoleMiddleware,
  createPermissionMiddleware,
  createOptionalAuthMiddleware
}
