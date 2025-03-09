const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const loggerService = require('../services/loggerService')
const diagnosticService = require('../services/diagnosticService')

// 获取诊断模式
router.get('/patterns', (req, res) => {
  try {
    const { type } = req.query
    loggerService.info('请求诊断模式', { type })

    const dataPath = path.join(__dirname, '../resources/diagnostic/data/diagnostic.json')

    // 检查文件是否存在，如果不存在，创建目录并写入初始数据
    if (!fs.existsSync(dataPath)) {
      loggerService.info('诊断数据文件不存在，创建初始数据')
      const dirPath = path.dirname(dataPath)

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      const initialData = {
        tonguePatterns: [
          {
            id: 'tongue001',
            name: '淡白舌',
            description: '舌质淡白，舌体胖嫩',
            indication: '多为气虚或阳虚证',
            imageUrl: '/images/diagnostic/tongue/pale.jpg'
          },
          {
            id: 'tongue002',
            name: '淡红舌',
            description: '舌色淡红，滋润有光泽',
            indication: '正常舌象或表示气血调和',
            imageUrl: '/images/diagnostic/tongue/normal.jpg'
          },
          {
            id: 'tongue003',
            name: '红舌',
            description: '舌色深红',
            indication: '热证，常见于热病',
            imageUrl: '/images/diagnostic/tongue/red.jpg'
          },
          {
            id: 'tongue004',
            name: '绛舌',
            description: '舌色深红如绛',
            indication: '热极，常见于热入营血或热入心包',
            imageUrl: '/images/diagnostic/tongue/crimson.jpg'
          },
          {
            id: 'tongue005',
            name: '青紫舌',
            description: '舌质青紫',
            indication: '寒凝血瘀或气滞血瘀',
            imageUrl: '/images/diagnostic/tongue/purple.jpg'
          }
        ],
        pulsePatterns: [
          {
            id: 'pulse001',
            name: '浮脉',
            description: '脉位浅表，轻取即得，重按则减',
            indication: '表证、阳证，常见于外感初起',
            audioUrl: '/audio/diagnostic/pulse/floating.mp3'
          },
          {
            id: 'pulse002',
            name: '沉脉',
            description: '脉位沉伏，轻取不应，重按始得',
            indication: '里证、阴证，常见于内伤杂病',
            audioUrl: '/audio/diagnostic/pulse/sinking.mp3'
          },
          {
            id: 'pulse003',
            name: '迟脉',
            description: '脉搏一息不足四至，约三至或更少',
            indication: '寒证或阳虚证',
            audioUrl: '/audio/diagnostic/pulse/slow.mp3'
          },
          {
            id: 'pulse004',
            name: '数脉',
            description: '脉搏一息五至以上',
            indication: '热证',
            audioUrl: '/audio/diagnostic/pulse/rapid.mp3'
          },
          {
            id: 'pulse005',
            name: '虚脉',
            description: '脉来软弱无力，按之空虚',
            indication: '气血亏虚',
            audioUrl: '/audio/diagnostic/pulse/deficient.mp3'
          }
        ]
      }

      fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2))
    }

    // 读取诊断数据
    const diagnosticData = fs.readFileSync(dataPath, 'utf8')
    const data = JSON.parse(diagnosticData)

    // 根据类型返回不同数据
    if (type === 'tongue') {
      res.json({ patterns: data.tonguePatterns || [] })
    } else if (type === 'pulse') {
      res.json({ patterns: data.pulsePatterns || [] })
    } else {
      // 返回所有数据
      res.json({
        tonguePatterns: data.tonguePatterns || [],
        pulsePatterns: data.pulsePatterns || []
      })
    }
  } catch (err) {
    loggerService.error('获取诊断模式数据失败', { error: err.message })
    res.status(500).json({ error: '无法加载诊断模式数据', details: err.message })
  }
})

// 舌诊分析
router.post('/analyze-tongue', async (req, res) => {
  try {
    const { imageData, userId } = req.body

    if (!imageData) {
      return res.status(400).json({ error: '缺少舌象图像数据' })
    }

    loggerService.info('进行舌诊分析', { userId })

    const result = await diagnosticService.analyzeTongue(imageData, userId)
    res.json(result)
  } catch (err) {
    loggerService.error('舌诊分析失败', { error: err.message })
    res.status(500).json({ error: err.message })
  }
})

// 脉诊分析
router.post('/analyze-pulse', async (req, res) => {
  try {
    const { pulseData, userId } = req.body

    if (!pulseData) {
      return res.status(400).json({ error: '缺少脉象数据' })
    }

    loggerService.info('进行脉诊分析', { userId })

    const result = await diagnosticService.analyzePulse(pulseData, userId)
    res.json(result)
  } catch (err) {
    loggerService.error('脉诊分析失败', { error: err.message })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
