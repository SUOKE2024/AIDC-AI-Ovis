/**
 * 健康数据API路由
 * 提供健康数据的REST API接口
 */

const express = require('express')
const { HealthDataType, HealthDataService } = require('../services/healthDataService')
const { createPermissionMiddleware, createAuthMiddleware } = require('../lib/auth/auth-middleware')
const logger = require('../services/loggerService')

/**
 * 创建健康数据路由
 * @param {Object} options - 路由选项
 * @param {HealthDataService} options.healthDataService - 健康数据服务
 * @param {Object} options.authProvider - 认证提供者
 * @returns {express.Router} Express路由
 */
function createHealthDataRouter (options) {
  const router = express.Router()
  const healthDataService = options.healthDataService
  const authProvider = options.authProvider

  // 认证中间件
  const requireAuth = createAuthMiddleware(authProvider)

  // 权限中间件
  const requirePermission = resource => createPermissionMiddleware(
    authProvider,
    'health-data',
    resource
  )

  /**
   * @swagger
   * /api/health-data/types:
   *   get:
   *     summary: 获取健康数据类型
   *     description: 获取系统支持的所有健康数据类型
   *     responses:
   *       200:
   *         description: 健康数据类型列表
   */
  router.get('/types', (req, res) => {
    const types = Object.entries(HealthDataType).map(([key, value]) => ({
      key,
      value,
      description: getDataTypeDescription(value)
    }))

    res.json({ types })
  })

  /**
   * @swagger
   * /api/health-data:
   *   post:
   *     summary: 添加健康数据
   *     description: 为指定用户添加新的健康数据
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - type
   *               - values
   *             properties:
   *               userId:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [body_metrics, vital_signs, blood_test, tongue, pulse, constitution, diet, sleep, activity, emotion, symptom, medication, treatment]
   *               values:
   *                 type: object
   *               timestamp:
   *                 type: string
   *                 format: date-time
   *               metadata:
   *                 type: object
   *     responses:
   *       201:
   *         description: 健康数据添加成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.post('/', requireAuth, async (req, res) => {
    try {
      const { userId, type, values, timestamp, metadata } = req.body

      // 检查是否有权限操作该用户数据
      const hasPermission = await authProvider.checkPermission(
        req.userId,
        'health-data',
        'write',
        { targetUserId: userId }
      )

      if (!hasPermission && req.userId !== userId) {
        return res.status(403).json({ error: '无权操作其他用户的健康数据' })
      }

      if (!userId || !type || !values) {
        return res.status(400).json({ error: '用户ID、数据类型和数据值不能为空' })
      }

      const result = await healthDataService.addHealthData(userId, {
        type,
        values,
        timestamp,
        metadata
      })

      res.status(201).json(result)
    } catch (error) {
      logger.error('添加健康数据失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/health-data/{userId}:
   *   get:
   *     summary: 获取用户健康数据
   *     description: 获取指定用户的健康数据列表
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
   *         description: 数据类型
   *         schema:
   *           type: string
   *       - name: startDate
   *         in: query
   *         required: false
   *         description: 开始日期
   *         schema:
   *           type: string
   *           format: date
   *       - name: endDate
   *         in: query
   *         required: false
   *         description: 结束日期
   *         schema:
   *           type: string
   *           format: date
   *       - name: limit
   *         in: query
   *         required: false
   *         description: 结果数量限制
   *         schema:
   *           type: integer
   *       - name: sort
   *         in: query
   *         required: false
   *         description: 排序方式
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *     responses:
   *       200:
   *         description: 健康数据列表
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.get('/:userId', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params
      const { type, startDate, endDate, limit, sort } = req.query

      // 检查是否有权限查看该用户数据
      const hasPermission = await authProvider.checkPermission(
        req.userId,
        'health-data',
        'read',
        { targetUserId: userId }
      )

      if (!hasPermission && req.userId !== userId) {
        return res.status(403).json({ error: '无权查看其他用户的健康数据' })
      }

      const data = await healthDataService.getUserHealthData(userId, {
        type,
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : undefined,
        sort
      })

      res.json({ userId, data })
    } catch (error) {
      logger.error(`获取用户健康数据失败: ${req.params.userId}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/health-data/{userId}/{dataId}:
   *   get:
   *     summary: 获取单条健康数据
   *     description: 获取指定用户的单条健康数据记录
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         description: 用户ID
   *         schema:
   *           type: string
   *       - name: dataId
   *         in: path
   *         required: true
   *         description: 数据ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 健康数据记录
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       404:
   *         description: 数据不存在
   *       500:
   *         description: 服务器错误
   */
  router.get('/:userId/:dataId', requireAuth, async (req, res) => {
    try {
      const { userId, dataId } = req.params

      // 检查是否有权限查看该用户数据
      const hasPermission = await authProvider.checkPermission(
        req.userId,
        'health-data',
        'read',
        { targetUserId: userId }
      )

      if (!hasPermission && req.userId !== userId) {
        return res.status(403).json({ error: '无权查看其他用户的健康数据' })
      }

      const data = await healthDataService.getHealthDataById(userId, dataId)

      if (!data) {
        return res.status(404).json({ error: '健康数据不存在' })
      }

      res.json(data)
    } catch (error) {
      logger.error(`获取单条健康数据失败: ${req.params.dataId}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/health-data/{userId}/{dataId}:
   *   put:
   *     summary: 更新健康数据
   *     description: 更新指定用户的单条健康数据记录
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         description: 用户ID
   *         schema:
   *           type: string
   *       - name: dataId
   *         in: path
   *         required: true
   *         description: 数据ID
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               values:
   *                 type: object
   *               timestamp:
   *                 type: string
   *                 format: date-time
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: 健康数据更新成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       404:
   *         description: 数据不存在
   *       500:
   *         description: 服务器错误
   */
  router.put('/:userId/:dataId', requireAuth, async (req, res) => {
    try {
      const { userId, dataId } = req.params
      const updates = req.body

      // 检查是否有权限操作该用户数据
      const hasPermission = await authProvider.checkPermission(
        req.userId,
        'health-data',
        'write',
        { targetUserId: userId }
      )

      if (!hasPermission && req.userId !== userId) {
        return res.status(403).json({ error: '无权修改其他用户的健康数据' })
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: '更新内容不能为空' })
      }

      const result = await healthDataService.updateHealthData(userId, dataId, updates)

      if (!result) {
        return res.status(404).json({ error: '健康数据不存在' })
      }

      res.json(result)
    } catch (error) {
      logger.error(`更新健康数据失败: ${req.params.dataId}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/health-data/{userId}/{dataId}:
   *   delete:
   *     summary: 删除健康数据
   *     description: 删除指定用户的单条健康数据记录
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         description: 用户ID
   *         schema:
   *           type: string
   *       - name: dataId
   *         in: path
   *         required: true
   *         description: 数据ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 健康数据删除成功
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       404:
   *         description: 数据不存在
   *       500:
   *         description: 服务器错误
   */
  router.delete('/:userId/:dataId', requireAuth, async (req, res) => {
    try {
      const { userId, dataId } = req.params

      // 检查是否有权限操作该用户数据
      const hasPermission = await authProvider.checkPermission(
        req.userId,
        'health-data',
        'delete',
        { targetUserId: userId }
      )

      if (!hasPermission && req.userId !== userId) {
        return res.status(403).json({ error: '无权删除其他用户的健康数据' })
      }

      const result = await healthDataService.deleteHealthData(userId, dataId)

      if (!result) {
        return res.status(404).json({ error: '健康数据不存在' })
      }

      res.json({ message: '健康数据删除成功' })
    } catch (error) {
      logger.error(`删除健康数据失败: ${req.params.dataId}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/health-data/{userId}/batch:
   *   post:
   *     summary: 批量添加健康数据
   *     description: 为指定用户批量添加健康数据记录
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         description: 用户ID
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - items
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - type
   *                     - values
   *                   properties:
   *                     type:
   *                       type: string
   *                     values:
   *                       type: object
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                     metadata:
   *                       type: object
   *     responses:
   *       200:
   *         description: 批量添加结果
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.post('/:userId/batch', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params
      const { items } = req.body

      // 检查是否有权限操作该用户数据
      const hasPermission = await authProvider.checkPermission(
        req.userId,
        'health-data',
        'write',
        { targetUserId: userId }
      )

      if (!hasPermission && req.userId !== userId) {
        return res.status(403).json({ error: '无权操作其他用户的健康数据' })
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: '批量数据项不能为空' })
      }

      const result = await healthDataService.batchAddHealthData(userId, items)

      res.json(result)
    } catch (error) {
      logger.error(`批量添加健康数据失败: ${req.params.userId}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/health-data/{userId}/stats:
   *   get:
   *     summary: 获取用户健康数据统计
   *     description: 获取指定用户的健康数据统计信息
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         description: 用户ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 健康数据统计
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.get('/:userId/stats', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params

      // 检查是否有权限查看该用户数据
      const hasPermission = await authProvider.checkPermission(
        req.userId,
        'health-data',
        'read',
        { targetUserId: userId }
      )

      if (!hasPermission && req.userId !== userId) {
        return res.status(403).json({ error: '无权查看其他用户的健康数据' })
      }

      const stats = await healthDataService.getUserHealthStats(userId)

      res.json({ userId, stats })
    } catch (error) {
      logger.error(`获取用户健康数据统计失败: ${req.params.userId}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/health-data/{userId}/trend/{type}/{metric}:
   *   get:
   *     summary: 分析健康数据趋势
   *     description: 分析指定用户特定指标的健康数据趋势
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
   *         in: path
   *         required: true
   *         description: 数据类型
   *         schema:
   *           type: string
   *       - name: metric
   *         in: path
   *         required: true
   *         description: 指标名称
   *         schema:
   *           type: string
   *       - name: startDate
   *         in: query
   *         required: false
   *         description: 开始日期
   *         schema:
   *           type: string
   *           format: date
   *       - name: endDate
   *         in: query
   *         required: false
   *         description: 结束日期
   *         schema:
   *           type: string
   *           format: date
   *       - name: interval
   *         in: query
   *         required: false
   *         description: 时间间隔
   *         schema:
   *           type: string
   *           enum: [day, week, month]
   *           default: day
   *     responses:
   *       200:
   *         description: 趋势分析结果
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.get('/:userId/trend/:type/:metric', requireAuth, async (req, res) => {
    try {
      const { userId, type, metric } = req.params
      const { startDate, endDate, interval } = req.query

      // 检查是否有权限查看该用户数据
      const hasPermission = await authProvider.checkPermission(
        req.userId,
        'health-data',
        'read',
        { targetUserId: userId }
      )

      if (!hasPermission && req.userId !== userId) {
        return res.status(403).json({ error: '无权查看其他用户的健康数据' })
      }

      // 验证类型是否有效
      if (!Object.values(HealthDataType).includes(type)) {
        return res.status(400).json({ error: '无效的数据类型' })
      }

      const trend = await healthDataService.analyzeHealthTrend(userId, type, metric, {
        startDate,
        endDate,
        interval
      })

      res.json(trend)
    } catch (error) {
      logger.error(`分析健康数据趋势失败: ${req.params.userId}/${req.params.type}/${req.params.metric}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  return router
}

/**
 * 获取数据类型描述
 * @param {string} type - 数据类型
 * @returns {string} 类型描述
 */
function getDataTypeDescription (type) {
  const descriptions = {
    [HealthDataType.BODY_METRICS]: '体格指标（身高、体重等）',
    [HealthDataType.VITAL_SIGNS]: '生命体征（血压、脉搏等）',
    [HealthDataType.BLOOD_TEST]: '血液检测',
    [HealthDataType.TONGUE]: '舌象',
    [HealthDataType.PULSE]: '脉象',
    [HealthDataType.CONSTITUTION]: '体质评估',
    [HealthDataType.DIET]: '饮食记录',
    [HealthDataType.SLEEP]: '睡眠记录',
    [HealthDataType.ACTIVITY]: '活动记录',
    [HealthDataType.EMOTION]: '情绪记录',
    [HealthDataType.SYMPTOM]: '症状记录',
    [HealthDataType.MEDICATION]: '用药记录',
    [HealthDataType.TREATMENT]: '治疗记录'
  }

  return descriptions[type] || '未知类型'
}

module.exports = createHealthDataRouter
