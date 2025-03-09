const express = require('express')
const router = express.Router()
const loggerService = require('../services/loggerService')

// 诊断服务资源端点
router.get('/diagnostic', (req, res) => {
  loggerService.info('访问诊断服务资源端点')
  res.json({
    id: 'diagnostic',
    type: 'service',
    name: '诊断服务',
    description: '提供舌诊、脉诊等中医诊断功能',
    version: '1.0.0',
    actions: [
      {
        id: 'analyze-tongue',
        name: '舌诊分析',
        description: '分析舌象图像并生成诊断结果',
        endpoint: '/diagnostic/analyze-tongue',
        method: 'POST',
        params: [
          {
            name: 'imageData',
            type: 'string',
            format: 'base64',
            description: '舌象图像数据',
            required: true
          },
          {
            name: 'userId',
            type: 'string',
            description: '用户ID',
            required: false
          }
        ],
        returns: {
          type: 'object',
          properties: {
            diagnosis: { type: 'string', description: '诊断结果' },
            features: { type: 'array', description: '识别到的舌象特征' },
            recommendations: { type: 'array', description: '健康建议' }
          }
        }
      },
      {
        id: 'analyze-pulse',
        name: '脉诊分析',
        description: '分析脉象数据并生成诊断结果',
        endpoint: '/diagnostic/analyze-pulse',
        method: 'POST',
        params: [
          {
            name: 'pulseData',
            type: 'object',
            description: '脉象数据',
            required: true
          },
          {
            name: 'userId',
            type: 'string',
            description: '用户ID',
            required: false
          }
        ],
        returns: {
          type: 'object',
          properties: {
            diagnosis: { type: 'string', description: '诊断结果' },
            pulseType: { type: 'string', description: '脉象类型' },
            recommendations: { type: 'array', description: '健康建议' }
          }
        }
      },
      {
        id: 'get-diagnostic-patterns',
        name: '获取诊断模式',
        description: '获取各种诊断模式信息',
        endpoint: '/diagnostic/patterns',
        method: 'GET',
        params: [
          {
            name: 'type',
            type: 'string',
            description: '模式类型(舌诊/脉诊)',
            required: false
          }
        ],
        returns: {
          type: 'object',
          properties: {
            patterns: { type: 'array', description: '诊断模式列表' }
          }
        }
      }
    ]
  })
})

// 健康数据资源端点
router.get('/health-data', (req, res) => {
  loggerService.info('访问健康数据资源端点')
  res.json({
    id: 'health-data',
    type: 'data-service',
    name: '健康数据服务',
    description: '管理用户健康记录和体质信息',
    version: '1.0.0',
    actions: [
      {
        id: 'get-user-health',
        name: '获取用户健康数据',
        description: '获取用户的健康数据',
        endpoint: '/health/users/{userId}',
        method: 'GET',
        params: [
          {
            name: 'userId',
            type: 'string',
            description: '用户ID',
            required: true
          },
          {
            name: 'dataType',
            type: 'string',
            description: '数据类型(体质/睡眠/饮食等)',
            required: false
          },
          {
            name: 'startDate',
            type: 'string',
            format: 'date',
            description: '开始日期',
            required: false
          },
          {
            name: 'endDate',
            type: 'string',
            format: 'date',
            description: '结束日期',
            required: false
          }
        ],
        returns: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            healthData: { type: 'array', description: '健康数据记录' },
            metadata: { type: 'object', description: '元数据信息' }
          }
        }
      },
      {
        id: 'update-user-health',
        name: '更新用户健康数据',
        description: '更新或添加用户健康数据',
        endpoint: '/health/users/{userId}',
        method: 'POST',
        params: [
          {
            name: 'userId',
            type: 'string',
            description: '用户ID',
            required: true
          },
          {
            name: 'data',
            type: 'object',
            description: '健康数据',
            required: true
          }
        ],
        returns: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            id: { type: 'string', description: '记录ID' }
          }
        }
      },
      {
        id: 'get-constitutions',
        name: '获取体质类型',
        description: '获取所有体质类型信息',
        endpoint: '/health/constitutions',
        method: 'GET',
        params: [],
        returns: {
          type: 'object',
          properties: {
            constitutions: { type: 'array', description: '体质类型列表' }
          }
        }
      },
      {
        id: 'analyze-constitution',
        name: '分析用户体质',
        description: '根据用户提供的信息分析体质类型',
        endpoint: '/health/analyze-constitution',
        method: 'POST',
        params: [
          {
            name: 'userData',
            type: 'object',
            description: '用户信息数据',
            required: true
          }
        ],
        returns: {
          type: 'object',
          properties: {
            primaryType: { type: 'string', description: '主要体质类型' },
            secondaryTypes: { type: 'array', description: '次要体质类型' },
            score: { type: 'object', description: '各体质评分' },
            recommendations: { type: 'object', description: '调理建议' }
          }
        }
      }
    ]
  })
})

// 中医知识库资源端点
router.get('/tcm-knowledge', (req, res) => {
  loggerService.info('访问中医知识库资源端点')
  res.json({
    id: 'tcm-knowledge',
    type: 'knowledge-base',
    name: '中医知识库',
    description: '提供中医经典理论、方剂、药材等知识',
    version: '1.0.0',
    actions: [
      {
        id: 'search',
        name: '搜索知识',
        description: '搜索中医知识库',
        endpoint: '/tcm/search',
        method: 'GET',
        params: [
          {
            name: 'query',
            type: 'string',
            description: '搜索关键词',
            required: true
          },
          {
            name: 'category',
            type: 'string',
            description: '知识分类',
            required: false,
            enum: ['理论', '方剂', '药材', '经络', '穴位', '疾病']
          },
          {
            name: 'limit',
            type: 'integer',
            description: '返回结果数量限制',
            required: false,
            default: 10
          }
        ],
        returns: {
          type: 'object',
          properties: {
            results: { type: 'array', description: '搜索结果' },
            total: { type: 'integer', description: '总结果数' },
            metadata: { type: 'object', description: '搜索元数据' }
          }
        }
      },
      {
        id: 'get-herbs',
        name: '获取药材列表',
        description: '获取中药材信息列表',
        endpoint: '/tcm/herbs',
        method: 'GET',
        params: [
          {
            name: 'category',
            type: 'string',
            description: '药材分类',
            required: false
          },
          {
            name: 'property',
            type: 'string',
            description: '药性',
            required: false
          },
          {
            name: 'limit',
            type: 'integer',
            description: '返回结果数量限制',
            required: false,
            default: 50
          }
        ],
        returns: {
          type: 'object',
          properties: {
            herbs: { type: 'array', description: '药材列表' }
          }
        }
      },
      {
        id: 'get-formulas',
        name: '获取方剂列表',
        description: '获取方剂信息列表',
        endpoint: '/tcm/formulas',
        method: 'GET',
        params: [
          {
            name: 'category',
            type: 'string',
            description: '方剂分类',
            required: false
          },
          {
            name: 'limit',
            type: 'integer',
            description: '返回结果数量限制',
            required: false,
            default: 50
          }
        ],
        returns: {
          type: 'object',
          properties: {
            formulas: { type: 'array', description: '方剂列表' }
          }
        }
      },
      {
        id: 'get-theories',
        name: '获取理论知识',
        description: '获取中医理论知识',
        endpoint: '/tcm/theories',
        method: 'GET',
        params: [
          {
            name: 'category',
            type: 'string',
            description: '理论分类',
            required: false
          }
        ],
        returns: {
          type: 'object',
          properties: {
            theories: { type: 'array', description: '理论知识列表' }
          }
        }
      }
    ]
  })
})

module.exports = router
