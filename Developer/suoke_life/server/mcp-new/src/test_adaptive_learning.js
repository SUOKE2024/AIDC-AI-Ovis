/**
 * 自适应学习服务单元测试脚本
 */
const MongoClient = require('mongodb').MongoClient
const dotenv = require('dotenv')
const path = require('path')

// 加载环境变量
dotenv.config()

// 引入服务
const EnhancedAdaptiveLearningService = require('./services/enhancedAdaptiveLearningService')
const LoggerService = require('./services/loggerService')
const VoiceDiagnosisService = require('./services/voiceDiagnosisService')
const TCMKnowledgeService = require('./services/tcmKnowledgeService')
const TCMClassicsKnowledgeService = require('./services/tcmClassicsKnowledgeService')

// 创建一个简单的依赖注入容器
const dependencies = {}

/**
 * 初始化测试环境
 */
async function initializeTestEnvironment () {
  console.log('初始化测试环境...')

  // 连接数据库
  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017'
  const dbName = process.env.DB_NAME || 'suoke_test'

  const client = await MongoClient.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const db = client.db(dbName)
  dependencies.db = db

  // 初始化日志服务
  dependencies.logger = new LoggerService({
    logLevel: 'debug',
    logToConsole: true
  })

  console.log('测试环境初始化完成')

  return {
    client,
    db,
    dependencies
  }
}

/**
 * 测试自适应学习服务
 */
async function testAdaptiveLearning (dependencies) {
  console.log('\n开始测试自适应学习服务...')

  // 创建服务实例
  const adaptiveLearningService = new EnhancedAdaptiveLearningService(dependencies)

  // 测试初始化
  console.log('1. 测试服务初始化...')
  await adaptiveLearningService.initialize()
  console.log('✓ 服务初始化成功')

  // 测试记录用户交互
  console.log('\n2. 测试记录用户交互...')
  const interactionData = {
    userId: 'test-user-1',
    interactionType: 'page_view',
    dataSource: 'APP_UI',
    data: {
      page: 'voice-diagnosis',
      duration: 120,
      timestamp: new Date()
    }
  }

  const interactionId = await adaptiveLearningService.recordUserInteraction(interactionData)
  console.log(`✓ 用户交互记录成功，ID: ${interactionId}`)

  // 测试记录声音诊断数据
  console.log('\n3. 测试记录声音诊断交互...')
  const voiceDiagnosisData = {
    userId: 'test-user-1',
    interactionType: 'diagnosis',
    dataSource: 'VOICE_DIAGNOSIS',
    data: {
      userId: 'test-user-1',
      voiceFeatures: {
        fundamentalFrequency: 220.5,
        amplitude: 0.75,
        rhythm: 0.5,
        formants: [500, 1200, 2400, 3600],
        fiveTones: {
          gong: 0.7,
          shang: 0.4,
          jue: 0.6,
          zhi: 0.3,
          yu: 0.5
        }
      },
      diagnosisResults: {
        dominantTone: 'gong',
        organMapping: '脾',
        confidence: 0.82,
        keyFeatures: ['fundamentalFrequency', 'formants'],
        recommendation: '脾胃功能正常，需保持均衡饮食'
      }
    }
  }

  const diagInteractionId = await adaptiveLearningService.recordUserInteraction(voiceDiagnosisData)
  console.log(`✓ 声音诊断数据记录成功，ID: ${diagInteractionId}`)

  // 测试用户反馈
  console.log('\n4. 测试用户反馈...')
  const feedbackData = {
    userId: 'test-user-1',
    interactionType: 'feedback',
    dataSource: 'USER_FEEDBACK',
    data: {
      feedbackType: 'voice_analysis_feedback',
      targetId: diagInteractionId,
      rating: 4,
      comments: '诊断结果准确，与我的感觉相符',
      userId: 'test-user-1'
    }
  }

  await adaptiveLearningService.recordUserInteraction(feedbackData)
  console.log('✓ 用户反馈记录成功')

  // 手动处理交互数据
  console.log('\n5. 测试处理交互数据...')
  await adaptiveLearningService.processPendingInteractions()
  console.log('✓ 交互数据处理成功')

  // 测试生成洞察
  console.log('\n6. 测试生成用户洞察...')
  const insights = await adaptiveLearningService.generatePersonalizedInsights('test-user-1')
  console.log(`✓ 生成了${insights.length}条个性化洞察`)
  if (insights.length > 0) {
    console.log(`   示例洞察: ${insights[0].title} - ${insights[0].description}`)
  }

  console.log('\n自适应学习服务测试完成')
}

/**
 * 测试中医经典知识服务
 */
async function testTCMClassicsKnowledge (dependencies) {
  console.log('\n开始测试中医经典知识服务...')

  // 创建服务实例
  const tcmClassicsService = new TCMClassicsKnowledgeService({
    dbClient: dependencies.db,
    vectorSearchService: {
      createVectorFromText: text => Promise.resolve(new Array(384).fill(0.1)),
      searchSimilarVectors: () => Promise.resolve([])
    },
    logger: dependencies.logger
  })

  // 测试初始化
  console.log('1. 测试服务初始化...')
  await tcmClassicsService.initialize()
  console.log('✓ 服务初始化成功')

  // 测试获取经典著作列表
  console.log('\n2. 测试获取经典著作...')
  const classics = await tcmClassicsService.getClassics()
  console.log(`✓ 获取到${classics.length}部经典著作`)
  if (classics.length > 0) {
    console.log(`   示例著作: ${classics[0].title}`)
  }

  // 测试知识点查询
  console.log('\n3. 测试知识点查询...')
  const knowledgePoints = await tcmClassicsService.searchKnowledgePoints('阴阳平衡')
  console.log(`✓ 查询到${knowledgePoints.length}个相关知识点`)

  // 测试现代映射查询
  console.log('\n4. 测试现代映射查询...')
  if (knowledgePoints.length > 0) {
    const mappings = await tcmClassicsService.getModernMappings(knowledgePoints[0]._id)
    console.log(`✓ 查询到${mappings.length}个现代医学映射`)
    if (mappings.length > 0) {
      console.log(`   传统概念: ${mappings[0].traditionalConcept.name} -> 现代概念: ${mappings[0].modernEquivalent.name}`)
      console.log(`   相关度: ${mappings[0].correlationDegree}`)
    }
  }

  console.log('\n中医经典知识服务测试完成')
}

/**
 * 清理测试数据
 */
async function cleanupTestData (db) {
  console.log('\n清理测试数据...')

  // 删除测试用户的交互数据
  await db.collection('user_interactions').deleteMany({ userId: 'test-user-1' })
  await db.collection('insight_patterns').deleteMany({ userId: 'test-user-1' })

  console.log('测试数据清理完成')
}

/**
 * 运行测试
 */
async function runTests () {
  let client

  try {
    // 初始化测试环境
    const { client: dbClient, dependencies } = await initializeTestEnvironment()
    client = dbClient

    // 运行自适应学习服务测试
    await testAdaptiveLearning(dependencies)

    // 运行中医经典知识服务测试
    await testTCMClassicsKnowledge(dependencies)

    // 清理测试数据
    await cleanupTestData(dependencies.db)

    console.log('\n所有测试完成')
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    // 关闭数据库连接
    if (client) {
      await client.close()
    }
  }
}

// 运行测试
runTests()
