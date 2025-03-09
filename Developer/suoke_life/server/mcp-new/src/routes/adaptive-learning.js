/**
 * 自适应学习服务路由
 */
const express = require('express')
const router = express.Router()

module.exports = function (dependencies) {
  const { adaptiveLearningService, authMiddleware } = dependencies

  /**
   * 记录用户交互数据
   * POST /api/adaptive-learning/interactions
   */
  router.post('/interactions', authMiddleware.requireAuth, async (req, res) => {
    try {
      const { interactionType, dataSource, data } = req.body

      if (!interactionType || !dataSource) {
        return res.status(400).json({ error: '缺少必要参数' })
      }

      const interactionData = {
        userId: req.user.id,
        interactionType,
        dataSource,
        data,
        sessionId: req.headers['x-session-id'] || null
      }

      const interactionId = await adaptiveLearningService.recordUserInteraction(interactionData)

      res.status(201).json({ success: true, interactionId })
    } catch (error) {
      console.error('记录用户交互失败:', error)
      res.status(500).json({ error: '服务器内部错误' })
    }
  })

  /**
   * 获取用户个性化健康洞察
   * GET /api/adaptive-learning/insights
   */
  router.get('/insights', authMiddleware.requireAuth, async (req, res) => {
    try {
      const userId = req.user.id
      const insights = await adaptiveLearningService.generatePersonalizedInsights(userId)

      res.json({ insights })
    } catch (error) {
      console.error('获取用户洞察失败:', error)
      res.status(500).json({ error: '服务器内部错误' })
    }
  })

  /**
   * 提交用户反馈
   * POST /api/adaptive-learning/feedback
   */
  router.post('/feedback', authMiddleware.requireAuth, async (req, res) => {
    try {
      const { feedbackType, targetId, rating, comments } = req.body

      if (!feedbackType || !targetId || rating === undefined) {
        return res.status(400).json({ error: '缺少必要参数' })
      }

      const interactionData = {
        userId: req.user.id,
        interactionType: 'feedback',
        dataSource: 'USER_FEEDBACK',
        data: {
          feedbackType,
          targetId,
          rating,
          comments,
          userId: req.user.id
        }
      }

      await adaptiveLearningService.recordUserInteraction(interactionData)

      res.status(201).json({ success: true })
    } catch (error) {
      console.error('提交用户反馈失败:', error)
      res.status(500).json({ error: '服务器内部错误' })
    }
  })

  /**
   * 提交专家验证
   * POST /api/adaptive-learning/expert-validation
   */
  router.post('/expert-validation', authMiddleware.requireExpertRole, async (req, res) => {
    try {
      const { targetId, validationType, validationResult, notes } = req.body

      if (!targetId || !validationType || !validationResult) {
        return res.status(400).json({ error: '缺少必要参数' })
      }

      const interactionData = {
        userId: req.user.id,
        interactionType: 'expert_validation',
        dataSource: 'EXPERT_VALIDATION',
        data: {
          expertId: req.user.id,
          targetId,
          validationType,
          validationResult,
          notes
        }
      }

      await adaptiveLearningService.recordUserInteraction(interactionData)

      res.status(201).json({ success: true })
    } catch (error) {
      console.error('提交专家验证失败:', error)
      res.status(500).json({ error: '服务器内部错误' })
    }
  })

  /**
   * 获取用户健康趋势
   * GET /api/adaptive-learning/health-trends
   */
  router.get('/health-trends', authMiddleware.requireAuth, async (req, res) => {
    try {
      const userId = req.user.id
      const trends = await adaptiveLearningService.getUserHealthTrends(userId)

      res.json({ trends })
    } catch (error) {
      console.error('获取用户健康趋势失败:', error)
      res.status(500).json({ error: '服务器内部错误' })
    }
  })

  return router
}
