/**
 * 中医知识库API路由
 * 提供中医知识的REST API接口
 */

const express = require('express')
const { TCMCategory, TCMKnowledgeService } = require('../services/tcmKnowledgeService')
const { createPermissionMiddleware } = require('../lib/auth/auth-middleware')
const logger = require('../services/loggerService')

/**
 * 创建中医知识库路由
 * @param {Object} options - 路由选项
 * @param {TCMKnowledgeService} options.tcmKnowledgeService - 中医知识库服务
 * @param {Object} options.authProvider - 认证提供者
 * @returns {express.Router} Express路由
 */
function createTCMKnowledgeRouter (options) {
  const router = express.Router()
  const tcmService = options.tcmKnowledgeService
  const authProvider = options.authProvider

  // 权限中间件
  const requirePermission = resource => createPermissionMiddleware(
    authProvider,
    'tcm-knowledge',
    resource
  )

  /**
   * @swagger
   * /api/tcm-knowledge/search:
   *   get:
   *     summary: 搜索中医知识
   *     description: 根据关键词搜索中医知识库
   *     parameters:
   *       - name: query
   *         in: query
   *         required: true
   *         description: 搜索关键词
   *         schema:
   *           type: string
   *       - name: category
   *         in: query
   *         required: false
   *         description: 知识分类
   *         schema:
   *           type: string
   *           enum: [theory, herb, formula, acupoint, disease, diagnostic, constitution, treatment]
   *       - name: limit
   *         in: query
   *         required: false
   *         description: 结果数量限制
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: 搜索结果
   *       400:
   *         description: 请求参数错误
   *       500:
   *         description: 服务器错误
   */
  router.get('/search', async (req, res) => {
    try {
      const { query, category, limit } = req.query

      if (!query) {
        return res.status(400).json({ error: '搜索关键词不能为空' })
      }

      const results = await tcmService.searchKnowledge({
        query,
        category,
        limit: limit ? parseInt(limit) : 10
      })

      res.json({ results })
    } catch (error) {
      logger.error('搜索中医知识失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/herbs:
   *   get:
   *     summary: 获取药材列表
   *     description: 获取所有中药材列表
   *     responses:
   *       200:
   *         description: 药材列表
   *       500:
   *         description: 服务器错误
   */
  router.get('/herbs', async (req, res) => {
    try {
      const herbs = await tcmService.getHerbList()
      res.json({ herbs })
    } catch (error) {
      logger.error('获取药材列表失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/herbs/{id}:
   *   get:
   *     summary: 获取药材详情
   *     description: 根据ID获取中药材详情
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: 药材ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 药材详情
   *       404:
   *         description: 药材不存在
   *       500:
   *         description: 服务器错误
   */
  router.get('/herbs/:id', async (req, res) => {
    try {
      const id = req.params.id
      const herb = await tcmService.getHerbById(id)

      if (!herb) {
        return res.status(404).json({ error: '药材不存在' })
      }

      res.json({ herb })
    } catch (error) {
      logger.error(`获取药材详情失败: ${req.params.id}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/formulas:
   *   get:
   *     summary: 获取方剂列表
   *     description: 获取所有中医方剂列表
   *     responses:
   *       200:
   *         description: 方剂列表
   *       500:
   *         description: 服务器错误
   */
  router.get('/formulas', async (req, res) => {
    try {
      const formulas = await tcmService.getFormulaList()
      res.json({ formulas })
    } catch (error) {
      logger.error('获取方剂列表失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/formulas/{id}:
   *   get:
   *     summary: 获取方剂详情
   *     description: 根据ID获取中医方剂详情
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: 方剂ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 方剂详情
   *       404:
   *         description: 方剂不存在
   *       500:
   *         description: 服务器错误
   */
  router.get('/formulas/:id', async (req, res) => {
    try {
      const id = req.params.id
      const formula = await tcmService.getFormulaById(id)

      if (!formula) {
        return res.status(404).json({ error: '方剂不存在' })
      }

      res.json({ formula })
    } catch (error) {
      logger.error(`获取方剂详情失败: ${req.params.id}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/theories:
   *   get:
   *     summary: 获取理论列表
   *     description: 获取所有中医理论列表
   *     responses:
   *       200:
   *         description: 理论列表
   *       500:
   *         description: 服务器错误
   */
  router.get('/theories', async (req, res) => {
    try {
      const theories = await tcmService.getTheoryList()
      res.json({ theories })
    } catch (error) {
      logger.error('获取理论列表失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/theories/{id}:
   *   get:
   *     summary: 获取理论详情
   *     description: 根据ID获取中医理论详情
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: 理论ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 理论详情
   *       404:
   *         description: 理论不存在
   *       500:
   *         description: 服务器错误
   */
  router.get('/theories/:id', async (req, res) => {
    try {
      const id = req.params.id
      const theory = await tcmService.getTheoryById(id)

      if (!theory) {
        return res.status(404).json({ error: '理论不存在' })
      }

      res.json({ theory })
    } catch (error) {
      logger.error(`获取理论详情失败: ${req.params.id}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/constitutions:
   *   get:
   *     summary: 获取体质类型列表
   *     description: 获取所有中医体质类型列表
   *     responses:
   *       200:
   *         description: 体质类型列表
   *       500:
   *         description: 服务器错误
   */
  router.get('/constitutions', async (req, res) => {
    try {
      const constitutions = await tcmService.getConstitutionList()
      res.json({ constitutions })
    } catch (error) {
      logger.error('获取体质类型列表失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/constitutions/{id}:
   *   get:
   *     summary: 获取体质类型详情
   *     description: 根据ID获取中医体质类型详情
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: 体质类型ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 体质类型详情
   *       404:
   *         description: 体质类型不存在
   *       500:
   *         description: 服务器错误
   */
  router.get('/constitutions/:id', async (req, res) => {
    try {
      const id = req.params.id
      const constitution = await tcmService.getConstitutionById(id)

      if (!constitution) {
        return res.status(404).json({ error: '体质类型不存在' })
      }

      res.json({ constitution })
    } catch (error) {
      logger.error(`获取体质类型详情失败: ${req.params.id}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/stats:
   *   get:
   *     summary: 获取知识库统计
   *     description: 获取中医知识库的统计信息
   *     responses:
   *       200:
   *         description: 统计信息
   *       500:
   *         description: 服务器错误
   */
  router.get('/stats', async (req, res) => {
    try {
      const stats = await tcmService.getStats()
      res.json({ stats })
    } catch (error) {
      logger.error('获取知识库统计失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge:
   *   post:
   *     summary: 添加知识条目
   *     description: 添加新的中医知识条目
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - category
   *               - title
   *               - content
   *             properties:
   *               category:
   *                 type: string
   *                 enum: [theory, herb, formula, acupoint, disease, diagnostic, constitution, treatment]
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *               metadata:
   *                 type: object
   *     responses:
   *       201:
   *         description: 知识条目创建成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.post('/', requirePermission('write'), async (req, res) => {
    try {
      const knowledge = req.body

      if (!knowledge.category || !knowledge.title || !knowledge.content) {
        return res.status(400).json({ error: '分类、标题和内容不能为空' })
      }

      const result = await tcmService.addKnowledge(knowledge)
      res.status(201).json(result)
    } catch (error) {
      logger.error('添加知识条目失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/{id}:
   *   put:
   *     summary: 更新知识条目
   *     description: 更新已有的中医知识条目
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: 知识条目ID
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: 知识条目更新成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       404:
   *         description: 知识条目不存在
   *       500:
   *         description: 服务器错误
   */
  router.put('/:id', requirePermission('write'), async (req, res) => {
    try {
      const id = req.params.id
      const updates = req.body

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: '更新内容不能为空' })
      }

      const result = await tcmService.updateKnowledge(id, updates)
      res.json(result)
    } catch (error) {
      logger.error(`更新知识条目失败: ${req.params.id}`, error)

      if (error.message.includes('不存在')) {
        return res.status(404).json({ error: error.message })
      }

      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/{id}:
   *   delete:
   *     summary: 删除知识条目
   *     description: 删除中医知识条目
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: 知识条目ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 知识条目删除成功
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       404:
   *         description: 知识条目不存在
   *       500:
   *         description: 服务器错误
   */
  router.delete('/:id', requirePermission('delete'), async (req, res) => {
    try {
      const id = req.params.id
      const result = await tcmService.deleteKnowledge(id)

      if (!result) {
        return res.status(404).json({ error: '知识条目不存在' })
      }

      res.json({ message: '知识条目删除成功' })
    } catch (error) {
      logger.error(`删除知识条目失败: ${req.params.id}`, error)
      res.status(500).json({ error: error.message })
    }
  })

  /**
   * @swagger
   * /api/tcm-knowledge/import:
   *   post:
   *     summary: 批量导入知识条目
   *     description: 批量导入中医知识条目
   *     security:
   *       - bearerAuth: []
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
   *                     - category
   *                     - title
   *                     - content
   *                   properties:
   *                     category:
   *                       type: string
   *                     title:
   *                       type: string
   *                     content:
   *                       type: string
   *                     tags:
   *                       type: array
   *                       items:
   *                         type: string
   *                     metadata:
   *                       type: object
   *     responses:
   *       200:
   *         description: 导入结果
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 权限不足
   *       500:
   *         description: 服务器错误
   */
  router.post('/import', requirePermission('import'), async (req, res) => {
    try {
      const { items } = req.body

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: '导入数据不能为空' })
      }

      const result = await tcmService.importKnowledge(items)
      res.json(result)
    } catch (error) {
      logger.error('批量导入知识条目失败', error)
      res.status(500).json({ error: error.message })
    }
  })

  return router
}

module.exports = createTCMKnowledgeRouter
