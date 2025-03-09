const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const loggerService = require('../services/loggerService')
const healthDataService = require('../services/healthDataService')

// 获取体质类型列表
router.get('/constitutions', (req, res) => {
  try {
    loggerService.info('请求体质类型列表')
    const dataPath = path.join(__dirname, '../resources/health-data/data/constitutions.json')

    // 检查文件是否存在，如果不存在，创建目录并写入初始数据
    if (!fs.existsSync(dataPath)) {
      loggerService.info('体质类型数据文件不存在，创建初始数据')
      const dirPath = path.dirname(dataPath)

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      const initialData = {
        constitutions: [
          {
            id: 'constitution001',
            name: '平和质',
            description: '平和质是体质分类中最为理想的体质类型。表现为面色、肤色润泽，头发稠密有光泽，目光有神，鼻色明润，嗅觉通利，唇色红润，不易疲劳，精力充沛。',
            characteristics: ['面色、肤色润泽', '头发稠密有光泽', '体形匀称', '睡眠良好', '胃纳佳，二便正常', '性格随和开朗', '适应能力强'],
            healthAdvice: ['保持规律作息', '均衡饮食', '适度运动', '保持心情舒畅'],
            dietAdvice: ['清淡饮食', '荤素搭配', '少吃生冷食物']
          },
          {
            id: 'constitution002',
            name: '气虚质',
            description: '气虚质的主要特征是气息微弱，精神不振。表现为少气懒言，声音低弱，容易疲劳，自汗，舌淡苔白，脉弱。',
            characteristics: ['少气懒言', '声音低弱', '易疲劳', '自汗', '舌淡苔白', '脉弱', '容易感冒'],
            healthAdvice: ['适当休息', '避免过度劳累', '适度进行深呼吸锻炼', '保持情绪稳定'],
            dietAdvice: ['宜食用补气食物如黄芪炖肉', '山药、大枣、薏苡仁等', '少食生冷、油腻食物']
          },
          {
            id: 'constitution003',
            name: '阴虚质',
            description: '阴虚质的主要特征是阴液亏少，虚热内生。表现为手足心热，口干，睡眠不实，舌红少苔，脉细数。',
            characteristics: ['手足心热', '口干咽干', '睡眠不实', '舌红少苔', '脉细数', '性格急躁', '消瘦'],
            healthAdvice: ['保持充足睡眠', '避免情绪激动', '适当进行太极、瑜伽等柔和运动', '避免长时间暴露在高温环境'],
            dietAdvice: ['宜食用滋阴润燥食物', '如百合、银耳、梨、莲子', '忌辛辣刺激、煎炸食物']
          }
        ]
      }

      fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2))
    }

    const constitutionsData = fs.readFileSync(dataPath, 'utf8')
    const constitutions = JSON.parse(constitutionsData)

    res.json(constitutions)
  } catch (err) {
    loggerService.error('获取体质类型数据失败', { error: err.message })
    res.status(500).json({ error: '无法加载体质类型数据', details: err.message })
  }
})

// 获取用户健康数据
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { dataType, startDate, endDate } = req.query

    loggerService.info(`获取用户(${userId})健康数据`, { dataType, startDate, endDate })

    const result = await healthDataService.getUserHealthData(userId, { dataType, startDate, endDate })
    res.json(result)
  } catch (err) {
    loggerService.error(`获取用户(${req.params.userId})健康数据失败`, { error: err.message })
    res.status(500).json({ error: err.message })
  }
})

// 更新用户健康数据
router.post('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { data } = req.body

    if (!data) {
      return res.status(400).json({ error: '缺少健康数据' })
    }

    loggerService.info(`更新用户(${userId})健康数据`)

    const result = await healthDataService.updateUserHealthData(userId, data)
    res.json(result)
  } catch (err) {
    loggerService.error(`更新用户(${req.params.userId})健康数据失败`, { error: err.message })
    res.status(500).json({ error: err.message })
  }
})

// 分析用户体质
router.post('/analyze-constitution', async (req, res) => {
  try {
    const { userData } = req.body

    if (!userData) {
      return res.status(400).json({ error: '缺少用户数据' })
    }

    loggerService.info('分析用户体质')

    const result = await healthDataService.analyzeConstitution(userData)
    res.json(result)
  } catch (err) {
    loggerService.error('分析用户体质失败', { error: err.message })
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
