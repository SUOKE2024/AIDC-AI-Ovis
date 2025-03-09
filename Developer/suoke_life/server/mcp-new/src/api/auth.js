/**
 * 身份验证API路由
 */

const express = require('express')
const router = express.Router()
const { Roles } = require('../lib/auth/auth-provider')
const {
  createAuthMiddleware,
  createRoleMiddleware
} = require('../lib/auth/auth-middleware')
const logger = require('../services/loggerService')

/**
 * 初始化认证路由
 * @param {Object} authProvider - 认证提供者
 * @returns {express.Router} 认证路由
 */
function createAuthRouter (authProvider) {
  // 管理员角色中间件
  const adminRequired = createRoleMiddleware([Roles.ADMIN])

  // 认证中间件
  const auth = createAuthMiddleware(authProvider)

  // 登录
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body

      if (!username || !password) {
        return res.status(400).json({
          error: {
            message: '用户名和密码是必需的',
            code: 'missing_credentials'
          }
        })
      }

      logger.info(`用户尝试登录: ${username}`)

      const authResult = await authProvider.verifyCredentials(username, password)

      if (!authResult.success) {
        return res.status(401).json({
          error: {
            message: authResult.message || '用户名或密码错误',
            code: 'invalid_credentials'
          }
        })
      }

      res.json({
        message: '登录成功',
        token: authResult.token,
        user: authResult.user
      })
    } catch (error) {
      logger.error(`登录处理错误: ${error.message}`)
      res.status(500).json({
        error: {
          message: '登录处理错误',
          code: 'login_error'
        }
      })
    }
  })

  // 验证令牌
  router.get('/verify', auth, (req, res) => {
    res.json({
      message: '令牌有效',
      user: {
        id: req.user.id,
        roles: req.user.roles
      }
    })
  })

  // 创建用户（仅管理员）
  router.post('/users', auth, adminRequired, async (req, res) => {
    try {
      const { username, password, name, email, roles, permissions } = req.body

      if (!username || !password) {
        return res.status(400).json({
          error: {
            message: '用户名和密码是必需的',
            code: 'missing_required_fields'
          }
        })
      }

      logger.info(`管理员正在创建新用户: ${username}`)

      const result = await authProvider.createUser({
        username,
        password,
        name,
        email,
        roles,
        permissions
      })

      if (!result.success) {
        return res.status(400).json({
          error: {
            message: result.message,
            code: 'user_creation_failed'
          }
        })
      }

      res.status(201).json({
        message: '用户创建成功',
        user: result.user
      })
    } catch (error) {
      logger.error(`创建用户错误: ${error.message}`)
      res.status(500).json({
        error: {
          message: '创建用户处理错误',
          code: 'user_creation_error'
        }
      })
    }
  })

  return router
}

module.exports = createAuthRouter
