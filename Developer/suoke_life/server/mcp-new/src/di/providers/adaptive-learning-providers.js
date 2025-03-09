const { Provider } = require('../../core/di/provider')
const EnhancedAdaptiveLearningService = require('../../services/enhancedAdaptiveLearningService')
const AdaptiveLearningScheduler = require('../../schedulers/adaptive-learning-scheduler')

// 自适应学习服务提供者
const adaptiveLearningServiceProvider = new Provider({
  name: 'adaptiveLearningService',
  useFactory: (container) => {
    const db = container.get('db')
    const logger = container.get('logger')
    const tcmKnowledgeService = container.get('tcmKnowledgeService')
    const userService = container.get('userService')
    const diagnosisService = container.get('diagnosisService')
    const voiceDiagnosisService = container.get('voiceDiagnosisService')

    const service = new EnhancedAdaptiveLearningService({
      db,
      logger,
      tcmKnowledgeService,
      userService,
      diagnosisService,
      voiceDiagnosisService
    })

    // 初始化服务
    service.initialize().catch(err => {
      logger.error(`初始化自适应学习服务失败: ${err.message}`)
    })

    return service
  },
  dependencies: ['db', 'logger', 'tcmKnowledgeService', 'userService', 'diagnosisService', 'voiceDiagnosisService']
})

// 自适应学习调度器提供者
const adaptiveLearningSchedulerProvider = new Provider({
  name: 'adaptiveLearningScheduler',
  useFactory: (container) => {
    const adaptiveLearningService = container.get('adaptiveLearningService')
    const logger = container.get('logger')
    const db = container.get('db')

    const scheduler = new AdaptiveLearningScheduler({
      adaptiveLearningService,
      logger,
      db
    })

    // 初始化调度器
    scheduler.initialize()

    return scheduler
  },
  dependencies: ['adaptiveLearningService', 'logger', 'db']
})

module.exports = {
  adaptiveLearningServiceProvider,
  adaptiveLearningSchedulerProvider
}
