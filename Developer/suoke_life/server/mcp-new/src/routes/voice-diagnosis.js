/**
 * 声诊分析API路由
 */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const { authenticateUser, validateToken } = require('../middleware/auth')
const { validateRequest } = require('../middleware/validator')
const { v4: uuidv4 } = require('uuid')

// 音频文件上传配置
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'voice')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`
    cb(null, uniqueFilename)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/ogg']
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

/**
 * @swagger
 * /api/voice-diagnosis/analyze:
 *   post:
 *     summary: 分析语音文件
 *     description: 上传并分析语音文件，获取声音特征和潜在的健康问题
 *     tags: [Voice Diagnosis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audioFile:
 *                 type: string
 *                 format: binary
 *                 description: 语音文件(支持WAV, MP3, OGG)
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               additionalInfo:
 *                 type: string
 *                 description: 额外信息，JSON格式
 *     responses:
 *       200:
 *         description: 分析结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 dominantTone:
 *                   type: string
 *                   description: 主导五音
 *                 associatedOrgan:
 *                   type: string
 *                   description: 关联脏腑
 *                 timbreAnalysis:
 *                   type: object
 *                   description: 音色分析
 *                 potentialDisharmonies:
 *                   type: array
 *                   description: 潜在失调
 *                 recommendations:
 *                   type: array
 *                   description: 建议
 */
router.post('/analyze', validateToken, upload.single('audioFile'), async (req, res) => {
  try {
    const { file } = req
    if (!file) {
      return res.status(400).json({ success: false, error: '请上传音频文件' })
    }

    // 获取声诊分析服务
    const voiceDiagnosisService = req.app.get('voiceDiagnosisService')
    if (!voiceDiagnosisService) {
      return res.status(500).json({ success: false, error: '声诊分析服务不可用' })
    }

    // 解析额外信息
    let additionalInfo = {}
    if (req.body.additionalInfo) {
      try {
        additionalInfo = JSON.parse(req.body.additionalInfo)
      } catch (e) {
        req.app.get('logger').warn('无法解析额外信息', e)
      }
    }

    // 创建用户上下文
    const userContext = {
      userId: req.body.userId || req.user.id,
      ...additionalInfo
    }

    // 读取上传的音频文件
    const audioData = await fs.readFile(file.path)

    // 分析语音
    const result = await voiceDiagnosisService.analyzeVoice(audioData, userContext)

    // 可选：完成后删除文件
    // await fs.unlink(file.path);

    // 保存结果到诊断结果服务
    const diagnosticResultService = req.app.get('diagnosticResultService')
    if (diagnosticResultService) {
      await diagnosticResultService.saveResult({
        userId: userContext.userId,
        type: 'voice',
        content: result,
        createdAt: new Date()
      })
    }

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    req.app.get('logger').error('声音分析失败', error)
    res.status(500).json({
      success: false,
      error: '声音分析失败: ' + error.message
    })
  }
})

/**
 * @swagger
 * /api/voice-diagnosis/history:
 *   get:
 *     summary: 获取声诊分析历史
 *     description: 获取用户的声诊分析历史记录
 *     tags: [Voice Diagnosis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回结果数量限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 分页偏移量
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序顺序
 *     responses:
 *       200:
 *         description: 分析历史记录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 metadata:
 *                   type: object
 */
router.get('/history', validateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const {
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // 获取诊断结果服务
    const diagnosticResultService = req.app.get('diagnosticResultService')
    if (!diagnosticResultService) {
      return res.status(500).json({ success: false, error: '诊断结果服务不可用' })
    }

    // 获取历史记录
    const results = await diagnosticResultService.getResultsByUser({
      userId,
      type: 'voice',
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    })

    res.json({
      success: true,
      ...results
    })
  } catch (error) {
    req.app.get('logger').error('获取声诊历史失败', error)
    res.status(500).json({
      success: false,
      error: '获取声诊历史失败: ' + error.message
    })
  }
})

/**
 * @swagger
 * /api/voice-diagnosis/clinical-validation:
 *   post:
 *     summary: 提交临床验证案例
 *     description: 上传声诊分析的临床验证案例
 *     tags: [Voice Diagnosis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: 案例创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/clinical-validation', authenticateUser(), validateRequest({
  body: {
    patientInfo: { type: 'object', required: true },
    traditionalDiagnosis: { type: 'object', required: true },
    voiceDiagnosis: { type: 'object', required: true },
    concordanceAnalysis: { type: 'object', required: true },
    followUpResults: { type: 'object', optional: true },
    educationalValue: { type: 'object', optional: true }
  }
}), async (req, res, next) => {
  try {
    const validationManager = req.app.get('clinicalValidationManager')

    // 生成案例ID
    const caseId = await validationManager.createCase(req.body)

    res.status(201).json({
      success: true,
      caseId,
      message: '临床验证案例提交成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/voice-diagnosis/clinical-validation:
 *   get:
 *     summary: 获取临床验证案例列表
 *     tags: [Voice Diagnosis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: diagnosis
 *         schema:
 *           type: string
 *         description: 按诊断筛选
 *     responses:
 *       200:
 *         description: 验证案例列表
 */
router.get('/clinical-validation', authenticateUser(), validateRequest({
  query: {
    limit: { type: 'number', optional: true, default: 10 },
    offset: { type: 'number', optional: true, default: 0 },
    diagnosis: { type: 'string', optional: true }
  }
}), async (req, res, next) => {
  try {
    const { limit, offset, diagnosis } = req.query

    const validationManager = req.app.get('clinicalValidationManager')

    const cases = await validationManager.getCases({
      limit,
      offset,
      diagnosis
    })

    res.json(cases)
  } catch (error) {
    next(error)
  }
})

module.exports = router
