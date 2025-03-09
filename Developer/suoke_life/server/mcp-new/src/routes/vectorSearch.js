/**
 * 向量搜索路由
 * 提供向量搜索相关API
 */

const express = require('express')
const router = express.Router()
const { VectorSearchService } = require('../services/vectorSearchService')
const { authMiddleware } = require('../middleware/authMiddleware')
const logger = require('../services/loggerService')

// 创建向量搜索服务实例
const vectorSearchService = new VectorSearchService()

/**
 * @swagger
 * tags:
 *   name: 向量搜索
 *   description: 向量搜索相关API
 */

/**
 * @swagger
 * /api/vector-search/status:
 *   get:
 *     summary: 获取向量搜索服务状态
 *     tags: [向量搜索]
 *     responses:
 *       200:
 *         description: 成功获取状态信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "active"
 *                 documentCount:
 *                   type: number
 *                   example: 120
 *                 indexType:
 *                   type: string
 *                   example: "tfidf"
 */
router.get('/status', (req, res) => {
  try {
    res.json({
      status: 'active',
      documentCount: vectorSearchService.getDocumentCount(),
      indexType: vectorSearchService.indexType
    })
  } catch (error) {
    logger.error(`获取向量搜索状态失败: ${error.message}`)
    res.status(500).json({ error: '获取向量搜索状态失败' })
  }
})

/**
 * @swagger
 * /api/vector-search/documents:
 *   post:
 *     summary: 添加文档到向量库
 *     tags: [向量搜索]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *             properties:
 *               document:
 *                 type: object
 *                 description: 文档对象
 *     responses:
 *       200:
 *         description: 文档添加成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/documents', authMiddleware, async (req, res) => {
  try {
    const { document } = req.body

    if (!document) {
      return res.status(400).json({ error: '缺少必要的文档数据' })
    }

    const id = await vectorSearchService.addDocument(document)

    res.json({ id })
  } catch (error) {
    logger.error(`添加文档失败: ${error.message}`)
    res.status(500).json({ error: '添加文档失败' })
  }
})

/**
 * @swagger
 * /api/vector-search/documents/batch:
 *   post:
 *     summary: 批量添加文档到向量库
 *     tags: [向量搜索]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documents
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: 文档对象数组
 *     responses:
 *       200:
 *         description: 文档批量添加成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ids:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["f47ac10b-58cc-4372-a567-0e02b2c3d479", "f47ac10b-58cc-4372-a567-0e02b2c3d480"]
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/documents/batch', authMiddleware, async (req, res) => {
  try {
    const { documents } = req.body

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: '缺少必要的文档数据或格式错误' })
    }

    const ids = await vectorSearchService.addDocuments(documents)

    res.json({ ids })
  } catch (error) {
    logger.error(`批量添加文档失败: ${error.message}`)
    res.status(500).json({ error: '批量添加文档失败' })
  }
})

/**
 * @swagger
 * /api/vector-search/documents/{id}:
 *   get:
 *     summary: 根据ID获取文档
 *     tags: [向量搜索]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 文档ID
 *     responses:
 *       200:
 *         description: 成功获取文档
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: 文档不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params

    const document = await vectorSearchService.getDocumentById(id)

    if (!document) {
      return res.status(404).json({ error: '文档不存在' })
    }

    res.json(document)
  } catch (error) {
    logger.error(`获取文档失败: ${error.message}`)
    res.status(500).json({ error: '获取文档失败' })
  }
})

/**
 * @swagger
 * /api/vector-search/documents/{id}:
 *   delete:
 *     summary: 根据ID删除文档
 *     tags: [向量搜索]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 文档ID
 *     responses:
 *       200:
 *         description: 成功删除文档
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 未授权
 *       404:
 *         description: 文档不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/documents/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const success = await vectorSearchService.removeDocument(id)

    if (!success) {
      return res.status(404).json({ error: '文档不存在或删除失败' })
    }

    res.json({ success })
  } catch (error) {
    logger.error(`删除文档失败: ${error.message}`)
    res.status(500).json({ error: '删除文档失败' })
  }
})

/**
 * @swagger
 * /api/vector-search/search:
 *   post:
 *     summary: 根据文本搜索相似文档
 *     tags: [向量搜索]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: 查询文本
 *               limit:
 *                 type: number
 *                 description: 返回结果数量
 *                 default: 5
 *               minScore:
 *                 type: number
 *                 description: 最小相似度分数
 *                 default: 0.5
 *               filterType:
 *                 type: string
 *                 description: 过滤器类型
 *     responses:
 *       200:
 *         description: 成功搜索文档
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       document:
 *                         type: object
 *                       score:
 *                         type: number
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 5, minScore = 0.5, filterType } = req.body

    if (!query) {
      return res.status(400).json({ error: '缺少查询文本' })
    }

    // 定义过滤器
    let filter = null
    if (filterType) {
      filter = (doc) => doc.type === filterType
    }

    const results = await vectorSearchService.searchByText(query, {
      limit,
      minScore,
      filter
    })

    res.json({ results })
  } catch (error) {
    logger.error(`搜索文档失败: ${error.message}`)
    res.status(500).json({ error: '搜索文档失败' })
  }
})

module.exports = router
