const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
const morgan = require('morgan')
const winston = require('winston')
const http = require('http')

// 导入MCP核心组件
const {
  MCPResource,
  MCPRegistry,
  MCPProcessor,
  ResourceType
} = require('./lib/mcp/protocol')
const MCPWebSocketServer = require('./lib/mcp/ws-server')

// 导入身份验证组件
const { FileAuthProvider } = require('./lib/auth/auth-provider')
const { createOptionalAuthMiddleware } = require('./lib/auth/auth-middleware')
const createAuthRouter = require('./api/auth')

// 导入路由模块
const resourcesRouter = require('./api/resources')
const tcmRouter = require('./api/tcm')
const healthRouter = require('./api/health')
const diagnosticRouter = require('./api/diagnostic')
const operationsRouter = require('./api/operations')
const vectorSearchRouter = require('./routes/vectorSearch')
const createVectorSearchRouter = require('./routes/vectorSearch')
const createTCMKnowledgeRouter = require('./routes/tcmKnowledge')
const createHealthDataRouter = require('./routes/healthData')
const createDiagnosticRouter = require('./routes/diagnostic')
const createRecommendationRouter = require('./routes/recommendation')
const createFeedbackRouter = require('./routes/feedback')
const createRecipeRouter = require('./routes/recipe')
const voiceDiagnosisRoutes = require('./routes/voice-diagnosis')

// 导入服务
const AuthService = require('./services/authService')
const DiagnosticService = require('./services/diagnosticService')
const RecommendationService = require('./services/recommendationService')
const HealthDataService = require('./services/healthDataService')
const LoggerService = require('./services/loggerService')
const TCMService = require('./services/tcmService')
const TCMKnowledgeService = require('./services/tcmKnowledgeService')
const VectorSearchService = require('./services/vectorSearchService')
const UserHealthProfileService = require('./services/userHealthProfileService')
const RecommendationScoring = require('./services/recommendationScoring')
const AdaptiveLearningService = require('./services/adaptiveLearningService')
const RecipeGenerationService = require('./services/recipeGenerationService')
const VoiceDiagnosisService = require('./services/voiceDiagnosisService')

// 声诊分析相关
const AudioProcessor = require('./utils/audioProcessor')
const FiveToneModel = require('./models/fiveToneModel')

// 导入机器学习模型
const VoiceMLModel = require('./models/voiceMLModel')
const MFCCProcessor = require('./utils/mfccProcessor')

// 引入自适应学习服务
const EnhancedAdaptiveLearningService = require('./services/enhancedAdaptiveLearningService')
const AdaptiveLearningScheduler = require('./schedulers/adaptive-learning-scheduler')

// 自适应学习路由
const adaptiveLearningRoutes = require('./routes/adaptive-learning')

// 加载环境变量
dotenv.config()

// 创建应用实例
const app = express()
const server = http.createServer(app)

// 创建MCP核心组件
const mcpRegistry = new MCPRegistry()
const mcpProcessor = new MCPProcessor(mcpRegistry)

// 创建身份验证提供者
const authProvider = new FileAuthProvider({
  jwtSecret: process.env.JWT_SECRET,
  usersFile: path.join(__dirname, '../data/users.json')
})

// 配置日志记录
app.use(morgan('combined', { stream: { write: message => loggerService.info(message.trim()) } }))

// 配置中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 可选的身份验证中间件
const optionalAuth = createOptionalAuthMiddleware(authProvider)
app.use(optionalAuth)

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'public')))

// 管理控制台路由
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'))
})

// 添加基本路由
app.get('/', (req, res) => {
  let welcomeMessage = '索克生活MCP服务器正在运行'

  // 如果用户已认证，显示个性化信息
  if (req.user) {
    welcomeMessage = `${welcomeMessage}，欢迎回来，${req.user.roles.includes('admin') ? '管理员' : '用户'}`
  }

  res.json({
    message: welcomeMessage,
    server: {
      name: process.env.MCP_SERVER_NAME || '索克生活MCP服务器',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
      description: process.env.MCP_SERVER_DESCRIPTION || '基于Model Context Protocol的中医健康数据和知识管理服务',
      features: [
        'RESTful API',
        'WebSocket实时通信',
        'MCP资源与操作',
        '用户认证与授权'
      ]
    },
    links: {
      api: '/mcp',
      docs: '/docs',
      admin: '/admin'
    }
  })
})

// MCP资源发现接口
app.get('/mcp', (req, res) => {
  const resources = mcpRegistry.getAllResources().map(resource => ({
    id: resource.id,
    type: resource.type,
    name: resource.name,
    description: resource.description
  }))

  res.json({
    type: 'discovery',
    server: {
      name: process.env.MCP_SERVER_NAME || '索克生活MCP服务器',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
      description: process.env.MCP_SERVER_DESCRIPTION || '基于Model Context Protocol的中医健康数据和知识管理服务'
    },
    resources
  })
})

// 初始化服务
const vectorSearchService = new VectorSearchService()
const tcmKnowledgeService = new TCMKnowledgeService({
  vectorSearchService
})
const healthDataService = new HealthDataService()
const diagnosticService = new DiagnosticService()

// 创建用户健康画像服务
const userHealthProfileService = new UserHealthProfileService({
  tcmKnowledgeService,
  dataDir: path.join(process.cwd(), 'data', 'user_profiles')
})

// 创建自适应学习服务
const adaptiveLearningService = new EnhancedAdaptiveLearningService({
  db, // 数据库连接
  logger, // 日志服务
  tcmKnowledgeService, // 中医知识服务
  userService, // 用户服务
  diagnosisService, // 诊断服务
  voiceDiagnosisService // 声音诊断服务
})

// 创建推荐服务
const recommendationService = new RecommendationService({
  tcmKnowledgeService,
  vectorSearchService,
  diagnosticService,
  userHealthProfileService,
  adaptiveLearningService,
  dataDir: path.join(process.cwd(), 'data', 'recommendation')
})

// 创建食谱生成服务
const recipeGenerationService = new RecipeGenerationService({
  knowledgeBasePath: path.join(process.cwd(), 'data', 'recommendation', 'knowledge'),
  tcmKnowledgeService
})

// 初始化声诊分析服务
const audioProcessor = new AudioProcessor({ logger })
const fiveToneModel = new FiveToneModel({ logger })

// 初始化ML相关组件
const mfccProcessor = new MFCCProcessor({ logger })
const voiceMLModel = new VoiceMLModel({
  logger,
  mfccProcessor
})

// 更新声诊分析服务初始化
const voiceDiagnosisService = new VoiceDiagnosisService({
  audioProcessor,
  fiveToneModel,
  voiceMLModel,
  dbClient,
  logger
})
app.set('voiceDiagnosisService', voiceDiagnosisService)

// 注册API路由
app.use('/mcp/resources', resourcesRouter)
app.use('/tcm', tcmRouter)
app.use('/health', healthRouter)
app.use('/diagnostic', diagnosticRouter)
app.use('/mcp/operations', operationsRouter)
app.use('/auth', createAuthRouter(authProvider))
app.use('/api/vector-search', createVectorSearchRouter({ vectorSearchService, authProvider }))
app.use('/api/tcm-knowledge', createTCMKnowledgeRouter({ tcmKnowledgeService, authProvider }))
app.use('/api/health-data', createHealthDataRouter({ healthDataService, authProvider }))
app.use('/api/diagnostic', createDiagnosticRouter({ diagnosticService, authProvider }))
app.use('/api/recommendation', createRecommendationRouter({
  recommendationService,
  authProvider
}))
app.use('/api/feedback', createFeedbackRouter({ userHealthProfileService, adaptiveLearningService, authProvider }))
app.use('/api/recipe', createRecipeRouter({
  recipeGenerationService,
  authProvider
}))
app.use('/api/voice-diagnosis', voiceDiagnosisRoutes)

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mcp-server',
    timestamp: new Date().toISOString()
  })
})

// 注册MCP资源
const recommendationResource = new MCPResource({
  id: 'recommendation-service',
  type: ResourceType.SERVICE,
  name: '智能推荐服务',
  description: '提供健康方案推荐、药食同源推荐和调理计划生成',
  version: '1.0.0',
  actions: [
    // 健康方案推荐
    {
      id: 'generate-health-plan',
      name: '生成健康方案',
      description: '根据诊断结果生成个性化健康方案',
      parameters: [
        { name: 'diagnosticResult', type: 'object', required: true, description: '诊断结果' },
        { name: 'userId', type: 'string', required: false, description: '用户ID' },
        { name: 'preferences', type: 'object', required: false, description: '用户偏好' },
        { name: 'healthData', type: 'object', required: false, description: '健康数据' },
        { name: 'userProfile', type: 'object', required: false, description: '用户配置文件' }
      ]
    },

    // 药食同源推荐
    {
      id: 'generate-herb-food',
      name: '生成药食同源推荐',
      description: '根据诊断结果生成药食同源食疗方案',
      parameters: [
        { name: 'diagnosticResult', type: 'object', required: true, description: '诊断结果' },
        { name: 'userId', type: 'string', required: false, description: '用户ID' },
        { name: 'preferences', type: 'object', required: false, description: '用户偏好' },
        { name: 'existingHerbs', type: 'array', required: false, description: '已有药材列表' },
        { name: 'userProfile', type: 'object', required: false, description: '用户配置文件' }
      ]
    },

    // 调理计划生成
    {
      id: 'generate-treatment-plan',
      name: '生成调理计划',
      description: '根据诊断结果生成个性化调理计划',
      parameters: [
        { name: 'diagnosticResult', type: 'object', required: true, description: '诊断结果' },
        { name: 'userId', type: 'string', required: false, description: '用户ID' },
        { name: 'preferences', type: 'object', required: false, description: '用户偏好' },
        { name: 'healthData', type: 'object', required: false, description: '健康数据' },
        { name: 'durationWeeks', type: 'number', required: false, description: '计划持续周数' },
        { name: 'userProfile', type: 'object', required: false, description: '用户配置文件' }
      ]
    },

    // 获取用户计划
    {
      id: 'get-user-plans',
      name: '获取用户推荐计划',
      description: '获取特定用户的所有推荐计划',
      parameters: [
        { name: 'userId', type: 'string', required: true, description: '用户ID' },
        { name: 'type', type: 'string', required: false, description: '推荐类型' },
        { name: 'limit', type: 'number', required: false, description: '结果数量限制' }
      ]
    }
  ]
})

// 注册资源
mcpRegistry.registerResource(recommendationResource)

// 注册处理器
// 健康方案推荐
mcpProcessor.registerHandler('recommendation-service', 'generate-health-plan', async (action, params, user) => {
  // 权限检查
  if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
    throw new Error('无权操作其他用户数据')
  }

  return await recommendationService.generateHealthPlan({
    diagnosticResult: params.diagnosticResult,
    userId: params.userId || user.id,
    preferences: params.preferences,
    healthData: params.healthData,
    userProfile: params.userProfile
  })
})

// 药食同源推荐
mcpProcessor.registerHandler('recommendation-service', 'generate-herb-food', async (action, params, user) => {
  // 权限检查
  if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
    throw new Error('无权操作其他用户数据')
  }

  return await recommendationService.generateHerbFoodRecommendation({
    diagnosticResult: params.diagnosticResult,
    userId: params.userId || user.id,
    preferences: params.preferences,
    existingHerbs: params.existingHerbs || [],
    userProfile: params.userProfile
  })
})

// 调理计划生成
mcpProcessor.registerHandler('recommendation-service', 'generate-treatment-plan', async (action, params, user) => {
  // 权限检查
  if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
    throw new Error('无权操作其他用户数据')
  }

  return await recommendationService.generateTreatmentPlan({
    diagnosticResult: params.diagnosticResult,
    userId: params.userId || user.id,
    preferences: params.preferences,
    healthData: params.healthData,
    durationWeeks: params.durationWeeks,
    userProfile: params.userProfile
  })
})

// 获取用户计划
mcpProcessor.registerHandler('recommendation-service', 'get-user-plans', async (action, params, user) => {
  // 权限检查
  if (params.userId !== user.id && !user.hasRole('admin')) {
    throw new Error('无权查询其他用户的推荐计划')
  }

  return await recommendationService.getUserPlans({
    userId: params.userId,
    type: params.type,
    limit: params.limit
  })
})

// 初始化自适应学习服务
await adaptiveLearningService.initialize()

// 创建并初始化调度器
const adaptiveLearningScheduler = new AdaptiveLearningScheduler({
  adaptiveLearningService,
  logger,
  db
})

// 初始化调度器
adaptiveLearningScheduler.initialize()

// 注册自适应学习路由
app.use('/api/adaptive-learning', adaptiveLearningRoutes({
  adaptiveLearningService,
  authMiddleware
}))

// 将服务实例添加到应用依赖中
app.locals.adaptiveLearningService = adaptiveLearningService

// 错误处理中间件
app.use((err, req, res, next) => {
  loggerService.error(`Error: ${err.message}`, { stack: err.stack })
  res.status(err.status || 500).json({
    error: {
      message: err.message || '服务器内部错误',
      status: err.status || 500
    }
  })
})

// 404处理中间件
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: '请求的资源不存在',
      status: 404
    }
  })
})

/**
 * 注册MCP资源和处理器
 */
async function registerMCPResources () {
  // 注册健康数据资源
  const healthDataResource = new MCPResource({
    id: 'health-data',
    type: ResourceType.DATA_SOURCE,
    name: '健康数据',
    description: '提供用户健康数据的管理和分析功能',
    version: '1.0.0'
  })

  healthDataResource.addAction({
    id: 'get-data',
    name: '获取健康数据',
    description: '获取用户健康数据',
    params: {
      userId: {
        type: 'string',
        description: '用户ID',
        required: true
      },
      type: {
        type: 'string',
        description: '数据类型',
        required: false
      },
      startDate: {
        type: 'string',
        description: '开始日期',
        required: false
      },
      endDate: {
        type: 'string',
        description: '结束日期',
        required: false
      },
      limit: {
        type: 'number',
        description: '结果数量限制',
        required: false
      }
    }
  })

  healthDataResource.addAction({
    id: 'add-data',
    name: '添加健康数据',
    description: '添加用户健康数据',
    params: {
      userId: {
        type: 'string',
        description: '用户ID',
        required: true
      },
      type: {
        type: 'string',
        description: '数据类型',
        required: true
      },
      values: {
        type: 'object',
        description: '数据值',
        required: true
      },
      timestamp: {
        type: 'string',
        description: '时间戳',
        required: false
      },
      metadata: {
        type: 'object',
        description: '元数据',
        required: false
      }
    }
  })

  healthDataResource.addAction({
    id: 'analyze-trend',
    name: '分析健康趋势',
    description: '分析用户健康数据趋势',
    params: {
      userId: {
        type: 'string',
        description: '用户ID',
        required: true
      },
      type: {
        type: 'string',
        description: '数据类型',
        required: true
      },
      metric: {
        type: 'string',
        description: '指标名称',
        required: true
      },
      startDate: {
        type: 'string',
        description: '开始日期',
        required: false
      },
      endDate: {
        type: 'string',
        description: '结束日期',
        required: false
      },
      interval: {
        type: 'string',
        description: '时间间隔',
        required: false
      }
    }
  })

  healthDataResource.addAction({
    id: 'get-stats',
    name: '获取健康统计',
    description: '获取用户健康数据统计信息',
    params: {
      userId: {
        type: 'string',
        description: '用户ID',
        required: true
      }
    }
  })

  // 注册中医知识库资源
  const tcmKnowledgeResource = new MCPResource({
    id: 'tcm-knowledge',
    type: ResourceType.KNOWLEDGE_BASE,
    name: '中医知识库',
    description: '提供中医理论、方剂、药材等知识管理功能',
    version: '1.0.0'
  })

  tcmKnowledgeResource.addAction({
    id: 'search',
    name: '搜索知识',
    description: '根据关键词搜索中医知识',
    params: {
      query: {
        type: 'string',
        description: '搜索关键词',
        required: true
      },
      category: {
        type: 'string',
        description: '知识分类',
        required: false
      },
      limit: {
        type: 'number',
        description: '结果数量限制',
        required: false
      }
    }
  })

  tcmKnowledgeResource.addAction({
    id: 'get-herb-list',
    name: '获取药材列表',
    description: '获取所有中药材列表'
  })

  tcmKnowledgeResource.addAction({
    id: 'get-herb',
    name: '获取药材详情',
    description: '根据ID获取中药材详情',
    params: {
      id: {
        type: 'string',
        description: '药材ID',
        required: true
      }
    }
  })

  tcmKnowledgeResource.addAction({
    id: 'get-formula-list',
    name: '获取方剂列表',
    description: '获取所有中医方剂列表'
  })

  tcmKnowledgeResource.addAction({
    id: 'get-formula',
    name: '获取方剂详情',
    description: '根据ID获取中医方剂详情',
    params: {
      id: {
        type: 'string',
        description: '方剂ID',
        required: true
      }
    }
  })

  tcmKnowledgeResource.addAction({
    id: 'get-theory-list',
    name: '获取理论列表',
    description: '获取所有中医理论列表'
  })

  tcmKnowledgeResource.addAction({
    id: 'get-theory',
    name: '获取理论详情',
    description: '根据ID获取中医理论详情',
    params: {
      id: {
        type: 'string',
        description: '理论ID',
        required: true
      }
    }
  })

  // 诊断服务资源
  const diagnosticResource = new MCPResource({
    id: 'diagnostic-service',
    type: ResourceType.SERVICE,
    name: '中医诊断服务',
    description: '提供舌诊、脉诊、体质辨识等中医诊断功能',
    version: '1.0.0',
    actions: [
      // 舌诊分析
      {
        id: 'analyze-tongue',
        name: '舌诊分析',
        description: '分析舌象图像，提供中医诊断结果',
        parameters: [
          { name: 'imageData', type: 'string', required: true, description: '舌象图像的Base64编码' },
          { name: 'userId', type: 'string', required: false, description: '用户ID' },
          { name: 'metadata', type: 'object', required: false, description: '元数据' }
        ]
      },

      // 脉诊分析
      {
        id: 'analyze-pulse',
        name: '脉诊分析',
        description: '分析脉象数据，提供中医诊断结果',
        parameters: [
          { name: 'pulseData', type: 'object', required: true, description: '脉象数据' },
          { name: 'userId', type: 'string', required: false, description: '用户ID' },
          { name: 'metadata', type: 'object', required: false, description: '元数据' }
        ]
      },

      // 面诊分析
      {
        id: 'analyze-face',
        name: '面诊分析',
        description: '分析面部图像，提供中医诊断结果',
        parameters: [
          { name: 'imageData', type: 'string', required: true, description: '面部图像的Base64编码' },
          { name: 'userId', type: 'string', required: false, description: '用户ID' },
          { name: 'metadata', type: 'object', required: false, description: '元数据' }
        ]
      },

      // 声诊分析
      {
        id: 'analyze-voice',
        name: '声诊分析',
        description: '分析声音数据，提供中医诊断结果',
        parameters: [
          { name: 'audioData', type: 'string', required: false, description: '声音数据的Base64编码' },
          { name: 'voiceFeatures', type: 'object', required: false, description: '预提取的声音特征' },
          { name: 'userId', type: 'string', required: false, description: '用户ID' },
          { name: 'metadata', type: 'object', required: false, description: '元数据' }
        ]
      },

      // 综合诊断分析
      {
        id: 'analyze-comprehensive',
        name: '综合诊断',
        description: '整合四诊合参，提供综合诊断结果',
        parameters: [
          { name: 'userId', type: 'string', required: false, description: '用户ID' },
          { name: 'tongueImageData', type: 'string', required: false, description: '舌象图像的Base64编码' },
          { name: 'pulseData', type: 'object', required: false, description: '脉象数据' },
          { name: 'faceImageData', type: 'string', required: false, description: '面部图像的Base64编码' },
          { name: 'audioData', type: 'string', required: false, description: '声音数据的Base64编码' },
          { name: 'voiceFeatures', type: 'object', required: false, description: '预提取的声音特征' },
          { name: 'userAnswers', type: 'object', required: false, description: '用户问卷回答' },
          { name: 'healthData', type: 'object', required: false, description: '健康数据' },
          { name: 'metadata', type: 'object', required: false, description: '元数据' }
        ]
      },

      // 体质分析
      {
        id: 'analyze-constitution',
        name: '体质辨识',
        description: '分析问卷回答数据，辨识体质类型',
        parameters: [
          { name: 'userAnswers', type: 'object', required: true, description: '用户问卷回答' },
          { name: 'healthData', type: 'object', required: false, description: '健康数据' },
          { name: 'userId', type: 'string', required: false, description: '用户ID' },
          { name: 'metadata', type: 'object', required: false, description: '元数据' }
        ]
      },

      // 获取诊断历史
      {
        id: 'get-diagnostic-history',
        name: '获取诊断历史',
        description: '获取指定用户的诊断历史记录',
        parameters: [
          { name: 'userId', type: 'string', required: true, description: '用户ID' },
          { name: 'type', type: 'string', required: false, description: '诊断类型' },
          { name: 'limit', type: 'number', required: false, description: '结果数量限制' }
        ]
      }
    ]
  })

  // 注册诊断服务资源
  mcpRegistry.registerResource(diagnosticResource)

  // 诊断服务操作处理器
  mcpProcessor.registerHandler('diagnostic-service', 'analyze-tongue', async (action, params, user) => {
    // 检查权限
    if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
      throw new Error('无权操作其他用户数据')
    }

    return await diagnosticService.analyzeTongue({
      imageData: params.imageData,
      userId: params.userId,
      metadata: params.metadata
    })
  })

  mcpProcessor.registerHandler('diagnostic-service', 'analyze-pulse', async (action, params, user) => {
    // 检查权限
    if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
      throw new Error('无权操作其他用户数据')
    }

    return await diagnosticService.analyzePulse({
      pulseData: params.pulseData,
      userId: params.userId,
      metadata: params.metadata
    })
  })

  mcpProcessor.registerHandler('diagnostic-service', 'analyze-face', async (action, params, user) => {
    // 检查权限
    if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
      throw new Error('无权操作其他用户数据')
    }

    return await diagnosticService.analyzeFace({
      imageData: params.imageData,
      userId: params.userId,
      metadata: params.metadata
    })
  })

  mcpProcessor.registerHandler('diagnostic-service', 'analyze-voice', async (action, params, user) => {
    // 检查权限
    if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
      throw new Error('无权操作其他用户数据')
    }

    return await diagnosticService.analyzeVoice({
      audioData: params.audioData,
      voiceFeatures: params.voiceFeatures,
      userId: params.userId,
      metadata: params.metadata
    })
  })

  mcpProcessor.registerHandler('diagnostic-service', 'analyze-comprehensive', async (action, params, user) => {
    // 检查权限
    if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
      throw new Error('无权操作其他用户数据')
    }

    return await diagnosticService.analyzeComprehensive({
      userId: params.userId,
      tongueImageData: params.tongueImageData,
      pulseData: params.pulseData,
      faceImageData: params.faceImageData,
      audioData: params.audioData,
      voiceFeatures: params.voiceFeatures,
      userAnswers: params.userAnswers,
      healthData: params.healthData,
      metadata: params.metadata
    })
  })

  mcpProcessor.registerHandler('diagnostic-service', 'analyze-constitution', async (action, params, user) => {
    // 检查权限
    if (params.userId && params.userId !== user.id && !user.hasRole('admin')) {
      throw new Error('无权操作其他用户数据')
    }

    return await diagnosticService.analyzeConstitution({
      userAnswers: params.userAnswers,
      healthData: params.healthData,
      userId: params.userId,
      metadata: params.metadata
    })
  })

  mcpProcessor.registerHandler('diagnostic-service', 'get-diagnostic-history', async (action, params, user) => {
    // 检查权限：只能查询自己的历史或者管理员
    if (params.userId !== user.id && !user.hasRole('admin')) {
      throw new Error('无权查询其他用户的诊断历史')
    }

    return await diagnosticService.getUserDiagnosticHistory({
      userId: params.userId,
      type: params.type,
      limit: params.limit
    })
  })

  // 健康数据服务处理器
  mcpProcessor.registerHandler('health-data', 'get-data', async (params, userId) => {
    // 检查权限
    if (params.userId !== userId) {
      const hasPermission = await authProvider.checkPermission(
        userId,
        'health-data',
        'read',
        { targetUserId: params.userId }
      )

      if (!hasPermission) {
        throw new Error('无权查看其他用户的健康数据')
      }
    }

    return await healthDataService.getUserHealthData(params.userId, {
      type: params.type,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: params.limit,
      sort: params.sort
    })
  })

  mcpProcessor.registerHandler('health-data', 'add-data', async (params, userId) => {
    // 检查权限
    if (params.userId !== userId) {
      const hasPermission = await authProvider.checkPermission(
        userId,
        'health-data',
        'write',
        { targetUserId: params.userId }
      )

      if (!hasPermission) {
        throw new Error('无权操作其他用户的健康数据')
      }
    }

    return await healthDataService.addHealthData(params.userId, {
      type: params.type,
      values: params.values,
      timestamp: params.timestamp,
      metadata: params.metadata
    })
  })

  mcpProcessor.registerHandler('health-data', 'analyze-trend', async (params, userId) => {
    // 检查权限
    if (params.userId !== userId) {
      const hasPermission = await authProvider.checkPermission(
        userId,
        'health-data',
        'read',
        { targetUserId: params.userId }
      )

      if (!hasPermission) {
        throw new Error('无权查看其他用户的健康数据')
      }
    }

    return await healthDataService.analyzeHealthTrend(
      params.userId,
      params.type,
      params.metric,
      {
        startDate: params.startDate,
        endDate: params.endDate,
        interval: params.interval
      }
    )
  })

  mcpProcessor.registerHandler('health-data', 'get-stats', async (params, userId) => {
    // 检查权限
    if (params.userId !== userId) {
      const hasPermission = await authProvider.checkPermission(
        userId,
        'health-data',
        'read',
        { targetUserId: params.userId }
      )

      if (!hasPermission) {
        throw new Error('无权查看其他用户的健康数据')
      }
    }

    return await healthDataService.getUserHealthStats(params.userId)
  })

  // 中医知识库处理器
  mcpProcessor.registerHandler('tcm-knowledge', 'search', async (params) => {
    return await tcmKnowledgeService.searchKnowledge(params)
  })

  mcpProcessor.registerHandler('tcm-knowledge', 'get-herb-list', async () => {
    return await tcmKnowledgeService.getHerbList()
  })

  mcpProcessor.registerHandler('tcm-knowledge', 'get-herb', async (params) => {
    const herb = await tcmKnowledgeService.getHerbById(params.id)
    if (!herb) {
      throw new Error('药材不存在')
    }
    return herb
  })

  mcpProcessor.registerHandler('tcm-knowledge', 'get-formula-list', async () => {
    return await tcmKnowledgeService.getFormulaList()
  })

  mcpProcessor.registerHandler('tcm-knowledge', 'get-formula', async (params) => {
    const formula = await tcmKnowledgeService.getFormulaById(params.id)
    if (!formula) {
      throw new Error('方剂不存在')
    }
    return formula
  })

  mcpProcessor.registerHandler('tcm-knowledge', 'get-theory-list', async () => {
    return await tcmKnowledgeService.getTheoryList()
  })

  mcpProcessor.registerHandler('tcm-knowledge', 'get-theory', async (params) => {
    const theory = await tcmKnowledgeService.getTheoryById(params.id)
    if (!theory) {
      throw new Error('理论不存在')
    }
    return theory
  })
}

/**
 * 启动服务器
 */
async function startServer () {
  try {
    // 确保必要的目录存在
    const publicDir = path.join(__dirname, 'public')
    const adminDir = path.join(publicDir, 'admin')

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    if (!fs.existsSync(adminDir)) {
      fs.mkdirSync(adminDir, { recursive: true })
    }

    // 注册MCP资源
    await registerMCPResources()

    // 创建WebSocket服务器
    const wsPort = process.env.WS_PORT || 3031
    const wsServer = new MCPWebSocketServer({
      port: wsPort,
      processor: mcpProcessor,
      authProvider
    })

    // 启动WebSocket服务器
    await wsServer.start()

    // 启动HTTP服务器
    const port = process.env.PORT || 3030
    server.listen(port, '0.0.0.0', () => {
      loggerService.info(`MCP服务器启动成功，HTTP端口：${port}，WebSocket端口：${wsPort}`)
      console.log(`MCP服务器启动成功，HTTP端口：${port}，WebSocket端口：${wsPort}`)
      console.log(`访问 http://localhost:${port}/mcp 查看资源列表`)
      console.log(`访问 http://localhost:${port}/admin 进入管理控制台`)
    })
  } catch (error) {
    loggerService.error(`服务器启动失败: ${error.message}`, { stack: error.stack })
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer()

module.exports = app
