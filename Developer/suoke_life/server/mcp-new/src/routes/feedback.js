/**
 * 用户反馈API路由
 * 提供用户反馈收集和分析的REST API接口
 */

const express = require('express')
const { createPermissionMiddleware, createAuthMiddleware } = require('../lib/auth/auth-middleware')
const logger = require('../services/loggerService')

/**
 * 创建用户反馈路由
 * @param {Object} options - 路由选项
 * @param {Object} options.userHealthProfileService - 用户健康画像服务
 * @param {Object} options.adaptiveLearningService - 自适应学习服务
 * @param {Object} options.authProvider - 认证提供者
 * @returns {express.Router} Express路由
 */
function createFeedbackRouter (options) {
  const router = express.Router()
  const userHealthProfileService = options.userHealthProfileService
  const adaptiveLearningService = options.adaptiveLearningService
  const authProvider = options.authProvider

  // 认证中间件
  const requireAuth = createAuthMiddleware(authProvider)

  // 权限中间件
  const requirePermission = resource => createPermissionMiddleware(
    authProvider,
    'feedback',
    resource
  )

  /**
   * @swagger
   * /api/feedback/record:
   *   post:
   *     summary: 记录用户反馈
   *     description: 记录用户对推荐结果的反馈
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - recommendationId
   *               - feedbackType
   *             properties:
   *               recommendationId:
   *                 type: string
   *                 description: 推荐ID
   *               feedbackType:
   *                 type: string
   *                 description: 反馈类型(like/dislike/neutral)
   *               details:
   *                 type: object
   *                 description: 反馈详情
   *     responses:
   *       200:
   *         description: 反馈记录成功
   *       400:
   *         description: 请求错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  router.post('/record', requireAuth, async (req, res) => {
    try {
      const { recommendationId, feedbackType, details } = req.body
      const userId = req.user.id

      if (!recommendationId || !feedbackType) {
        return res.status(400).json({
          error: {
            message: '推荐ID和反馈类型不能为空'
          }
        })
      }

      // 验证反馈类型
      if (!['like', 'dislike', 'neutral'].includes(feedbackType)) {
        return res.status(400).json({
          error: {
            message: '反馈类型无效，必须是like、dislike或neutral'
          }
        })
      }

      // 记录反馈
      const feedback = await userHealthProfileService.recordFeedback(
        userId,
        recommendationId,
        feedbackType,
        details || {}
      )

      // 更新自适应学习模型
      await adaptiveLearningService.updateModel(userId, feedback)

      res.status(200).json({
        success: true,
        message: '反馈记录成功',
        feedback: {
          id: feedback.id,
          createdAt: feedback.createdAt
        }
      })
    } catch (error) {
      logger.error('记录用户反馈API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/feedback/preferences:
   *   get:
   *     summary: 获取用户偏好分析
   *     description: 分析用户的反馈历史，提取用户偏好
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 用户偏好分析结果
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  router.get('/preferences', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id

      // 分析用户偏好
      const preferences = await userHealthProfileService.analyzeUserPreferences(userId)

      res.status(200).json(preferences)
    } catch (error) {
      logger.error('获取用户偏好分析API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/feedback/history:
   *   get:
   *     summary: 获取用户反馈历史
   *     description: 获取用户的反馈历史记录
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: 限制返回条数
   *       - in: query
   *         name: feedbackType
   *         schema:
   *           type: string
   *         description: 反馈类型过滤
   *     responses:
   *       200:
   *         description: 用户反馈历史
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  router.get('/history', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id
      const { limit, feedbackType } = req.query

      // 获取用户反馈历史
      const options = {}
      if (limit) {
        options.limit = parseInt(limit)
      }
      if (feedbackType) {
        options.feedbackType = feedbackType
      }

      const history = await userHealthProfileService.getUserFeedback(userId, options)

      res.status(200).json(history)
    } catch (error) {
      logger.error('获取用户反馈历史API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/feedback/update-preferences:
   *   post:
   *     summary: 更新用户偏好
   *     description: 手动更新用户偏好设置
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               foods:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 喜好的食材
   *               herbs:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 喜好的药材
   *               methods:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 喜好的调理方法
   *     responses:
   *       200:
   *         description: 偏好更新成功
   *       400:
   *         description: 请求错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  router.post('/update-preferences', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id
      const { foods, herbs, methods } = req.body

      // 更新用户偏好
      const preferences = {}

      if (foods && Array.isArray(foods)) {
        preferences.foods = foods
      }

      if (herbs && Array.isArray(herbs)) {
        preferences.herbs = herbs
      }

      if (methods && Array.isArray(methods)) {
        preferences.methods = methods
      }

      // 验证是否有有效偏好
      if (Object.keys(preferences).length === 0) {
        return res.status(400).json({
          error: {
            message: '至少需要一种偏好数据'
          }
        })
      }

      // 更新用户偏好
      const updatedProfile = await userHealthProfileService.updatePreferences(userId, preferences)

      res.status(200).json({
        success: true,
        message: '偏好更新成功',
        preferences: updatedProfile.preferences
      })
    } catch (error) {
      logger.error('更新用户偏好API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  return router
}

module.exports = createFeedbackRouter
