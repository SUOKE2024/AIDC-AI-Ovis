/**
 * 推荐服务API路由
 * 提供健康方案、药食同源和调理计划的REST API接口
 */

const express = require('express')
const { RecommendationType } = require('../services/recommendationService')
const { createPermissionMiddleware, createAuthMiddleware } = require('../lib/auth/auth-middleware')
const logger = require('../services/loggerService')

/**
 * 创建推荐服务路由
 * @param {Object} options - 路由选项
 * @param {Object} options.recommendationService - 推荐服务
 * @param {Object} options.authProvider - 认证提供者
 * @returns {express.Router} Express路由
 */
function createRecommendationRouter (options) {
  const router = express.Router()
  const recommendationService = options.recommendationService
  const authProvider = options.authProvider

  // 认证中间件
  const requireAuth = createAuthMiddleware(authProvider)

  // 权限中间件
  const requirePermission = resource => createPermissionMiddleware(
    authProvider,
    'recommendation',
    resource
  )

  /**
   * @swagger
   * /api/recommendation/health-plan:
   *   post:
   *     summary: 生成健康方案
   *     description: 根据诊断结果生成个性化健康方案
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - diagnosticResult
   *             properties:
   *               diagnosticResult:
   *                 type: object
   *                 description: 诊断结果
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               preferences:
   *                 type: object
   *                 description: 用户偏好
   *               healthData:
   *                 type: object
   *                 description: 健康数据
   *               userProfile:
   *                 type: object
   *                 description: 用户健康档案（可选，如不提供将自动构建）
   *     responses:
   *       200:
   *         description: 健康方案
   *       400:
   *         description: 请求错误
   *       500:
   *         description: 服务器错误
   */
  router.post('/health-plan', requireAuth, async (req, res) => {
    try {
      const { diagnosticResult, userId, preferences, healthData, userProfile } = req.body

      if (!diagnosticResult) {
        return res.status(400).json({
          error: {
            message: '诊断结果不能为空'
          }
        })
      }

      // 如果提供了userId，验证请求用户是否有权限操作该用户数据
      if (userId && req.user.id !== userId && !req.user.hasRole('admin')) {
        return res.status(403).json({
          error: {
            message: '无权访问其他用户数据'
          }
        })
      }

      const result = await recommendationService.generateHealthPlan({
        diagnosticResult,
        userId: userId || req.user.id,
        preferences,
        healthData,
        userProfile
      })

      res.json(result)
    } catch (error) {
      logger.error('生成健康方案API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recommendation/herb-food:
   *   post:
   *     summary: 生成药食同源推荐
   *     description: 根据诊断结果生成药食同源推荐
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - diagnosticResult
   *             properties:
   *               diagnosticResult:
   *                 type: object
   *                 description: 诊断结果
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               preferences:
   *                 type: object
   *                 description: 用户偏好
   *               existingHerbs:
   *                 type: array
   *                 description: 已有药材列表
   *               userProfile:
   *                 type: object
   *                 description: 用户健康档案（可选，如不提供将自动构建）
   *     responses:
   *       200:
   *         description: 药食同源推荐
   *       400:
   *         description: 请求错误
   *       500:
   *         description: 服务器错误
   */
  router.post('/herb-food', requireAuth, async (req, res) => {
    try {
      const { diagnosticResult, userId, preferences, existingHerbs, userProfile } = req.body

      if (!diagnosticResult) {
        return res.status(400).json({
          error: {
            message: '诊断结果不能为空'
          }
        })
      }

      // 如果提供了userId，验证请求用户是否有权限操作该用户数据
      if (userId && req.user.id !== userId && !req.user.hasRole('admin')) {
        return res.status(403).json({
          error: {
            message: '无权访问其他用户数据'
          }
        })
      }

      const result = await recommendationService.generateHerbFoodRecommendation({
        diagnosticResult,
        userId: userId || req.user.id,
        preferences,
        existingHerbs,
        userProfile
      })

      res.json(result)
    } catch (error) {
      logger.error('生成药食同源推荐API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recommendation/treatment-plan:
   *   post:
   *     summary: 生成调理计划
   *     description: 根据诊断结果生成个性化调理计划
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - diagnosticResult
   *             properties:
   *               diagnosticResult:
   *                 type: object
   *                 description: 诊断结果
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               preferences:
   *                 type: object
   *                 description: 用户偏好
   *               healthData:
   *                 type: object
   *                 description: 健康数据
   *               durationWeeks:
   *                 type: number
   *                 description: 计划持续周数
   *               userProfile:
   *                 type: object
   *                 description: 用户健康档案（可选，如不提供将自动构建）
   *     responses:
   *       200:
   *         description: 调理计划
   *       400:
   *         description: 请求错误
   *       500:
   *         description: 服务器错误
   */
  router.post('/treatment-plan', requireAuth, async (req, res) => {
    try {
      const { diagnosticResult, userId, preferences, healthData, durationWeeks, userProfile } = req.body

      if (!diagnosticResult) {
        return res.status(400).json({
          error: {
            message: '诊断结果不能为空'
          }
        })
      }

      // 如果提供了userId，验证请求用户是否有权限操作该用户数据
      if (userId && req.user.id !== userId && !req.user.hasRole('admin')) {
        return res.status(403).json({
          error: {
            message: '无权访问其他用户数据'
          }
        })
      }

      const result = await recommendationService.generateTreatmentPlan({
        diagnosticResult,
        userId: userId || req.user.id,
        preferences,
        healthData,
        durationWeeks,
        userProfile
      })

      res.json(result)
    } catch (error) {
      logger.error('生成调理计划API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recommendation/user/{userId}/plans:
   *   get:
   *     summary: 获取用户推荐计划
   *     description: 获取特定用户的所有推荐计划
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: 用户ID
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: 推荐类型
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: 结果数量限制
   *     responses:
   *       200:
   *         description: 推荐计划列表
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.get('/user/:userId/plans', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params
      const { type, limit } = req.query

      // 权限检查
      if (userId !== req.user.id && !req.user.hasRole('admin')) {
        return res.status(403).json({
          error: {
            message: '无权访问其他用户数据'
          }
        })
      }

      // 获取用户推荐计划
      const plans = await recommendationService.getUserPlans({
        userId,
        type,
        limit: limit ? parseInt(limit) : undefined
      })

      res.json({ plans })
    } catch (error) {
      logger.error('获取用户推荐计划API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/recommendation/plan/{planId}:
   *   get:
   *     summary: 获取推荐计划详情
   *     description: 根据ID获取推荐计划详情
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: planId
   *         required: true
   *         schema:
   *           type: string
   *         description: 计划ID
   *     responses:
   *       200:
   *         description: 推荐计划详情
   *       404:
   *         description: 计划不存在
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.get('/plan/:planId', requireAuth, async (req, res) => {
    try {
      const { planId } = req.params

      // 获取计划详情
      const plan = await recommendationService.getPlanById(planId)

      if (!plan) {
        return res.status(404).json({
          error: {
            message: '推荐计划不存在'
          }
        })
      }

      // 权限检查
      if (plan.userId !== req.user.id && !req.user.hasRole('admin')) {
        return res.status(403).json({
          error: {
            message: '无权访问此推荐计划'
          }
        })
      }

      res.json(plan)
    } catch (error) {
      logger.error('获取推荐计划详情API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  return router
}

module.exports = createRecommendationRouter
