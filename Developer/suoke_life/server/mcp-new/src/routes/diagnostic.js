/**
 * 诊断服务API路由
 * 提供中医诊断服务的REST API接口
 */

const express = require('express')
const { DiagnosticType, DiagnosticService } = require('../services/diagnosticService')
const { createPermissionMiddleware, createAuthMiddleware } = require('../lib/auth/auth-middleware')
const logger = require('../services/loggerService')

/**
 * 创建诊断服务路由
 * @param {Object} options - 路由选项
 * @param {DiagnosticService} options.diagnosticService - 诊断服务
 * @param {Object} options.authProvider - 认证提供者
 * @returns {express.Router} Express路由
 */
function createDiagnosticRouter (options) {
  const router = express.Router()
  const diagnosticService = options.diagnosticService
  const authProvider = options.authProvider

  // 认证中间件
  const requireAuth = createAuthMiddleware(authProvider)

  // 权限中间件
  const requirePermission = resource => createPermissionMiddleware(
    authProvider,
    'diagnostic',
    resource
  )

  /**
   * @swagger
   * /api/diagnostic/types:
   *   get:
   *     summary: 获取诊断类型
   *     description: 获取系统支持的所有诊断类型
   *     responses:
   *       200:
   *         description: 诊断类型列表
   */
  router.get('/types', (req, res) => {
    const types = Object.entries(DiagnosticType).map(([key, value]) => ({
      key,
      value,
      description: getDiagnosticTypeDescription(value)
    }))

    res.json({ types })
  })

  /**
   * @swagger
   * /api/diagnostic/tongue:
   *   post:
   *     summary: 舌诊分析
   *     description: 分析舌象图像，提供中医诊断结果
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - imageData
   *             properties:
   *               imageData:
   *                 type: string
   *                 description: 舌象图像的Base64编码
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               metadata:
   *                 type: object
   *                 description: 元数据
   *     responses:
   *       200:
   *         description: 诊断结果
   *       400:
   *         description: 请求错误
   *       500:
   *         description: 服务器错误
   */
  router.post('/tongue', requireAuth, async (req, res) => {
    try {
      const { imageData, userId, metadata } = req.body

      if (!imageData) {
        return res.status(400).json({ error: '舌象图像数据不能为空' })
      }

      // 如果提供了userId，检查权限
      if (userId && userId !== req.userId) {
        const hasPermission = await authProvider.checkPermission(
          req.userId,
          'diagnostic',
          'write',
          { targetUserId: userId }
        )

        if (!hasPermission) {
          return res.status(403).json({ error: '无权为其他用户创建诊断记录' })
        }
      }

      const result = await diagnosticService.analyzeTongue({
        imageData,
        userId: userId || req.userId,
        metadata
      })

      res.json(result)
    } catch (error) {
      logger.error('舌诊分析请求失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/diagnostic/face:
   *   post:
   *     summary: 面诊分析
   *     description: 分析面部图像，提供中医诊断结果
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - imageData
   *             properties:
   *               imageData:
   *                 type: string
   *                 description: 面部图像的Base64编码
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               metadata:
   *                 type: object
   *                 description: 元数据
   *     responses:
   *       200:
   *         description: 诊断结果
   *       400:
   *         description: 请求错误
   *       500:
   *         description: 服务器错误
   */
  router.post('/face', requireAuth, async (req, res) => {
    try {
      const { imageData, userId, metadata } = req.body

      if (!imageData) {
        return res.status(400).json({
          error: {
            message: '面部图像数据不能为空'
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

      const result = await diagnosticService.analyzeFace({
        imageData,
        userId,
        metadata
      })

      res.json(result)
    } catch (error) {
      logger.error('面诊分析API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/diagnostic/voice:
   *   post:
   *     summary: 声诊分析
   *     description: 分析声音数据，提供中医诊断结果
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - audioData
   *             properties:
   *               audioData:
   *                 type: string
   *                 description: 声音数据的Base64编码
   *               voiceFeatures:
   *                 type: object
   *                 description: 预提取的声音特征
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               metadata:
   *                 type: object
   *                 description: 元数据
   *     responses:
   *       200:
   *         description: 诊断结果
   *       400:
   *         description: 请求错误
   *       500:
   *         description: 服务器错误
   */
  router.post('/voice', requireAuth, async (req, res) => {
    try {
      const { audioData, voiceFeatures, userId, metadata } = req.body

      if (!audioData && (!voiceFeatures || Object.keys(voiceFeatures).length === 0)) {
        return res.status(400).json({
          error: {
            message: '声音数据或声音特征不能为空'
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

      const result = await diagnosticService.analyzeVoice({
        audioData,
        voiceFeatures,
        userId,
        metadata
      })

      res.json(result)
    } catch (error) {
      logger.error('声诊分析API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  /**
   * @swagger
   * /api/diagnostic/pulse:
   *   post:
   *     summary: 脉诊分析
   *     description: 分析脉象数据，提供中医诊断结果
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pulseData
   *             properties:
   *               pulseData:
   *                 type: object
   *                 description: 脉象数据
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               metadata:
   *                 type: object
   *                 description: 元数据
   *     responses:
   *       200:
   *         description: 诊断结果
   *       400:
   *         description: 请求错误
   *       500:
   *         description: 服务器错误
   */
  router.post('/pulse', requireAuth, async (req, res) => {
    try {
      const { pulseData, userId, metadata } = req.body

      if (!pulseData) {
        return res.status(400).json({ error: '脉象数据不能为空' })
      }

      // 如果提供了userId，检查权限
      if (userId && userId !== req.userId) {
        const hasPermission = await authProvider.checkPermission(
          req.userId,
          'diagnostic',
          'write',
          { targetUserId: userId }
        )

        if (!hasPermission) {
          return res.status(403).json({ error: '无权为其他用户创建诊断记录' })
        }
      }

      const result = await diagnosticService.analyzePulse({
        pulseData,
        userId: userId || req.userId,
        metadata
      })

      res.json(result)
    } catch (error) {
      logger.error('脉诊分析请求失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/diagnostic/constitution:
   *   post:
   *     summary: 体质分析
   *     description: 进行中医体质分析
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userAnswers
   *             properties:
   *               userAnswers:
   *                 type: object
   *                 description: 用户问卷回答
   *               healthData:
   *                 type: object
   *                 description: 健康数据
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               metadata:
   *                 type: object
   *                 description: 元数据
   *     responses:
   *       200:
   *         description: 分析结果
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  router.post('/constitution', requireAuth, async (req, res) => {
    try {
      const { userAnswers, healthData, userId, metadata } = req.body

      if (!userAnswers || Object.keys(userAnswers).length === 0) {
        return res.status(400).json({ error: '用户问卷回答不能为空' })
      }

      // 如果提供了userId，检查权限
      if (userId && userId !== req.userId) {
        const hasPermission = await authProvider.checkPermission(
          req.userId,
          'diagnostic',
          'write',
          { targetUserId: userId }
        )

        if (!hasPermission) {
          return res.status(403).json({ error: '无权为其他用户创建诊断记录' })
        }
      }

      const result = await diagnosticService.analyzeConstitution({
        userAnswers,
        healthData,
        userId: userId || req.userId,
        metadata
      })

      res.json(result)
    } catch (error) {
      logger.error('体质分析请求失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/diagnostic/{userId}/history:
   *   get:
   *     summary: 获取用户诊断历史
   *     description: 获取指定用户的诊断历史记录
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         description: 用户ID
   *         schema:
   *           type: string
   *       - name: type
   *         in: query
   *         required: false
   *         description: 诊断类型
   *         schema:
   *           type: string
   *       - name: limit
   *         in: query
   *         required: false
   *         description: 结果数量限制
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: 诊断历史记录
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.get('/:userId/history', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params
      const { type, limit } = req.query

      // 检查是否有权限查看该用户的诊断历史
      if (userId !== req.userId) {
        const hasPermission = await authProvider.checkPermission(
          req.userId,
          'diagnostic',
          'read',
          { targetUserId: userId }
        )

        if (!hasPermission) {
          return res.status(403).json({ error: '无权查看其他用户的诊断历史' })
        }
      }

      const history = await diagnosticService.getUserDiagnosticHistory({
        userId,
        type,
        limit: limit ? parseInt(limit) : 10
      })

      res.json({ userId, history })
    } catch (error) {
      logger.error(`获取用户诊断历史失败: ${req.params.userId}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/diagnostic/patterns:
   *   get:
   *     summary: 获取诊断模式
   *     description: 获取诊断模式列表
   *     parameters:
   *       - name: type
   *         in: query
   *         required: false
   *         description: 诊断类型
   *         schema:
   *           type: string
   *       - name: category
   *         in: query
   *         required: false
   *         description: 模式类别
   *         schema:
   *           type: string
   *       - name: limit
   *         in: query
   *         required: false
   *         description: 结果数量限制
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: 诊断模式列表
   *       500:
   *         description: 服务器错误
   */
  router.get('/patterns', async (req, res) => {
    try {
      const { type, category, limit } = req.query

      const patterns = await diagnosticService.getDiagnosticPatterns({
        type,
        category,
        limit: limit ? parseInt(limit) : 50
      })

      res.json({ patterns })
    } catch (error) {
      logger.error('获取诊断模式失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/diagnostic/comprehensive:
   *   post:
   *     summary: 综合诊断分析
   *     description: 整合四诊合参，提供综合诊断结果
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *               tongueImageData:
   *                 type: string
   *                 description: 舌象图像的Base64编码
   *               pulseData:
   *                 type: object
   *                 description: 脉象数据
   *               faceImageData:
   *                 type: string
   *                 description: 面部图像的Base64编码
   *               audioData:
   *                 type: string
   *                 description: 声音数据的Base64编码
   *               voiceFeatures:
   *                 type: object
   *                 description: 预提取的声音特征
   *               userAnswers:
   *                 type: object
   *                 description: 用户问卷回答
   *               healthData:
   *                 type: object
   *                 description: 健康数据
   *               metadata:
   *                 type: object
   *                 description: 元数据
   *     responses:
   *       200:
   *         description: 综合诊断结果
   *       400:
   *         description: 请求错误
   *       500:
   *         description: 服务器错误
   */
  router.post('/comprehensive', requireAuth, async (req, res) => {
    try {
      const {
        userId,
        tongueImageData,
        pulseData,
        faceImageData,
        audioData,
        voiceFeatures,
        userAnswers,
        healthData,
        metadata
      } = req.body

      // 检查是否提供了足够的诊断数据
      const providedDataTypes = [
        tongueImageData,
        pulseData,
        faceImageData,
        voiceFeatures || audioData,
        userAnswers
      ].filter(data => data).length

      if (providedDataTypes < 2) {
        return res.status(400).json({
          error: {
            message: '综合诊断至少需要两种诊断数据'
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

      const result = await diagnosticService.analyzeComprehensive({
        userId,
        tongueImageData,
        pulseData,
        faceImageData,
        audioData,
        voiceFeatures,
        userAnswers,
        healthData,
        metadata
      })

      res.json(result)
    } catch (error) {
      logger.error('综合诊断分析API错误', error)
      res.status(500).json({
        error: {
          message: error.message
        }
      })
    }
  })

  return router
}

/**
 * 获取诊断类型描述
 * @param {string} type - 诊断类型
 * @returns {string} 类型描述
 */
function getDiagnosticTypeDescription (type) {
  const descriptions = {
    [DiagnosticType.TONGUE]: '舌诊',
    [DiagnosticType.PULSE]: '脉诊',
    [DiagnosticType.CONSTITUTION]: '体质辨识',
    [DiagnosticType.FACE]: '面诊',
    [DiagnosticType.VOICE]: '声诊',
    [DiagnosticType.COMPREHENSIVE]: '综合诊断'
  }

  return descriptions[type] || '未知诊断类型'
}

module.exports = createDiagnosticRouter
