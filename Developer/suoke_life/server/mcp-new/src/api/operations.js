const express = require('express')
const router = express.Router()
const loggerService = require('../services/loggerService')
const healthDataService = require('../services/healthDataService')
const tcmService = require('../services/tcmService')
const diagnosticService = require('../services/diagnosticService')

// MCP操作处理中心
router.post('/', async (req, res) => {
  try {
    const { resourceId, actionId, params } = req.body

    if (!resourceId || !actionId) {
      return res.status(400).json({
        error: '缺少必要参数',
        details: 'resourceId和actionId是必需的'
      })
    }

    loggerService.info(`处理MCP操作请求: ${resourceId}/${actionId}`, { params })

    // 根据资源ID和操作ID路由到相应的处理函数
    let result

    switch (resourceId) {
      case 'health-data':
        result = await handleHealthDataOperation(actionId, params)
        break
      case 'tcm-knowledge':
        result = await handleTcmKnowledgeOperation(actionId, params)
        break
      case 'diagnostic':
        result = await handleDiagnosticOperation(actionId, params)
        break
      default:
        return res.status(404).json({
          error: '资源不存在',
          details: `未找到资源: ${resourceId}`
        })
    }

    // 返回操作结果
    res.json({
      resourceId,
      actionId,
      status: 'success',
      result,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    loggerService.error('MCP操作处理失败', { error: err.message })
    res.status(500).json({
      error: '操作处理失败',
      details: err.message
    })
  }
})

// 处理健康数据操作
async function handleHealthDataOperation (actionId, params) {
  switch (actionId) {
    case 'get-user-health':
      if (!params.userId) {
        throw new Error('用户ID是必需的')
      }
      return await healthDataService.getUserHealthData(params.userId, {
        dataType: params.dataType,
        startDate: params.startDate,
        endDate: params.endDate
      })

    case 'update-user-health':
      if (!params.userId || !params.data) {
        throw new Error('用户ID和健康数据是必需的')
      }
      return await healthDataService.updateUserHealthData(params.userId, params.data)

    case 'get-constitutions':
      // 这个操作不需要参数
      return { constitutions: await getConstitutions() }

    case 'analyze-constitution':
      if (!params.userData) {
        throw new Error('用户数据是必需的')
      }
      return await healthDataService.analyzeConstitution(params.userData)

    default:
      throw new Error(`未知的健康数据操作: ${actionId}`)
  }
}

// 处理中医知识操作
async function handleTcmKnowledgeOperation (actionId, params) {
  switch (actionId) {
    case 'search':
      if (!params.query) {
        throw new Error('搜索关键词是必需的')
      }
      return await tcmService.searchKnowledge(params.query, {
        category: params.category,
        limit: params.limit
      })

    case 'get-herbs':
      return { herbs: await getHerbs(params.category, params.property, params.limit) }

    case 'get-formulas':
      return { formulas: await getFormulas(params.category, params.limit) }

    case 'get-theories':
      return { theories: await getTheories(params.category) }

    default:
      throw new Error(`未知的中医知识操作: ${actionId}`)
  }
}

// 处理诊断服务操作
async function handleDiagnosticOperation (actionId, params) {
  switch (actionId) {
    case 'analyze-tongue':
      if (!params.imageData) {
        throw new Error('舌象图像数据是必需的')
      }
      return await diagnosticService.analyzeTongue(params.imageData, params.userId)

    case 'analyze-pulse':
      if (!params.pulseData) {
        throw new Error('脉象数据是必需的')
      }
      return await diagnosticService.analyzePulse(params.pulseData, params.userId)

    case 'get-diagnostic-patterns':
      return await getDiagnosticPatterns(params.type)

    default:
      throw new Error(`未知的诊断服务操作: ${actionId}`)
  }
}

// 辅助函数：获取体质类型
async function getConstitutions () {
  const fs = require('fs')
  const path = require('path')

  const dataPath = path.join(__dirname, '../resources/health-data/data/constitutions.json')

  if (!fs.existsSync(dataPath)) {
    return []
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  return data.constitutions || []
}

// 辅助函数：获取药材
async function getHerbs (category, property, limit) {
  const fs = require('fs')
  const path = require('path')

  const dataPath = path.join(__dirname, '../resources/tcm/data/herbs.json')

  if (!fs.existsSync(dataPath)) {
    return []
  }

  let herbs = JSON.parse(fs.readFileSync(dataPath, 'utf8')).herbs || []

  // 根据查询条件筛选
  if (category) {
    herbs = herbs.filter(herb => herb.category === category)
  }

  if (property) {
    herbs = herbs.filter(herb => herb.property.includes(property))
  }

  // 限制返回数量
  if (limit && !isNaN(parseInt(limit))) {
    herbs = herbs.slice(0, parseInt(limit))
  }

  return herbs
}

// 辅助函数：获取方剂
async function getFormulas (category, limit) {
  const fs = require('fs')
  const path = require('path')

  const dataPath = path.join(__dirname, '../resources/tcm/data/formulas.json')

  if (!fs.existsSync(dataPath)) {
    return []
  }

  let formulas = JSON.parse(fs.readFileSync(dataPath, 'utf8')).formulas || []

  // 根据查询条件筛选
  if (category) {
    formulas = formulas.filter(formula => formula.category === category)
  }

  // 限制返回数量
  if (limit && !isNaN(parseInt(limit))) {
    formulas = formulas.slice(0, parseInt(limit))
  }

  return formulas
}

// 辅助函数：获取理论知识
async function getTheories (category) {
  const fs = require('fs')
  const path = require('path')

  const dataPath = path.join(__dirname, '../resources/tcm/data/theories.json')

  if (!fs.existsSync(dataPath)) {
    return []
  }

  let theories = JSON.parse(fs.readFileSync(dataPath, 'utf8')).theories || []

  // 根据查询条件筛选
  if (category) {
    theories = theories.filter(theory => theory.category === category)
  }

  return theories
}

// 辅助函数：获取诊断模式
async function getDiagnosticPatterns (type) {
  const fs = require('fs')
  const path = require('path')

  const dataPath = path.join(__dirname, '../resources/diagnostic/data/diagnostic.json')

  if (!fs.existsSync(dataPath)) {
    return { tonguePatterns: [], pulsePatterns: [] }
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

  if (type === 'tongue') {
    return { patterns: data.tonguePatterns || [] }
  } else if (type === 'pulse') {
    return { patterns: data.pulsePatterns || [] }
  } else {
    return {
      tonguePatterns: data.tonguePatterns || [],
      pulsePatterns: data.pulsePatterns || []
    }
  }
}

module.exports = router
