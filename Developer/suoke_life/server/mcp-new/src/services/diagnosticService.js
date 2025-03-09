/**
 * 诊断服务
 * 提供舌诊、脉诊、体质分析等中医诊断功能
 */

const fs = require('fs-extra')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const logger = require('./loggerService')

/**
 * 诊断类型枚举
 */
const DiagnosticType = {
  TONGUE: 'tongue', // 舌诊
  PULSE: 'pulse', // 脉诊
  CONSTITUTION: 'constitution', // 体质辨识
  FACE: 'face', // 面诊
  VOICE: 'voice', // 声诊
  COMPREHENSIVE: 'comprehensive' // 综合诊断
}

/**
 * 诊断服务类
 * 提供中医诊断相关功能
 */
class DiagnosticService {
  /**
   * 创建诊断服务
   * @param {Object} options - 服务选项
   * @param {string} options.dataDir - 数据存储目录
   */
  constructor (options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data', 'diagnostic')
    this.resultsDir = path.join(this.dataDir, 'results')
    this.patternsDir = path.join(this.dataDir, 'patterns')
    this.modelsDir = path.join(this.dataDir, 'models')

    this._initService()
  }

  /**
   * 初始化服务
   * @private
   */
  _initService () {
    // 确保数据目录存在
    fs.ensureDirSync(this.dataDir)
    fs.ensureDirSync(this.resultsDir)
    fs.ensureDirSync(this.patternsDir)
    fs.ensureDirSync(this.modelsDir)

    // 按诊断类型创建结果目录
    Object.values(DiagnosticType).forEach(type => {
      fs.ensureDirSync(path.join(this.resultsDir, type))
    })

    logger.info('诊断服务初始化完成')
  }

  /**
   * 舌诊分析
   * @param {Object} options - 分析选项
   * @param {string} options.imageData - 舌象图像数据（Base64）
   * @param {string} [options.userId] - 用户ID
   * @param {Object} [options.metadata] - 元数据
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeTongue (options) {
    const { imageData, userId, metadata = {} } = options

    if (!imageData) {
      throw new Error('舌象图像数据不能为空')
    }

    logger.info('进行舌诊分析', { userId })

    try {
      // 模拟图像分析处理延迟
      await this._delay(1500)

      // 生成分析结果ID和时间戳
      const analysisId = uuidv4()
      const timestamp = new Date().toISOString()

      // 模拟舌诊分析 (实际项目中这里应对接AI模型)
      const analysis = this._simulateTongueAnalysis(imageData)

      // 保存分析结果
      if (userId) {
        const resultData = {
          id: analysisId,
          userId,
          type: DiagnosticType.TONGUE,
          timestamp,
          imageData: imageData.substring(0, 100) + '...', // 只存储部分图像数据
          analysis,
          metadata,
          created_at: timestamp,
          updated_at: timestamp
        }

        await this._saveAnalysisResult(DiagnosticType.TONGUE, analysisId, resultData)
      }

      return {
        id: analysisId,
        timestamp,
        diagnosis: analysis.diagnosis,
        features: analysis.features,
        recommendations: analysis.recommendations,
        relatedPatterns: analysis.relatedPatterns || []
      }
    } catch (error) {
      logger.error('舌诊分析失败', error)
      throw new Error(`舌诊分析失败: ${error.message}`)
    }
  }

  /**
   * 脉诊分析
   * @param {Object} options - 分析选项
   * @param {Object} options.pulseData - 脉象数据
   * @param {string} [options.userId] - 用户ID
   * @param {Object} [options.metadata] - 元数据
   * @returns {Promise<Object>} 分析结果
   */
  async analyzePulse (options) {
    const { pulseData, userId, metadata = {} } = options

    if (!pulseData) {
      throw new Error('脉象数据不能为空')
    }

    logger.info('进行脉诊分析', { userId })

    try {
      // 模拟分析处理延迟
      await this._delay(1200)

      // 生成分析结果ID和时间戳
      const analysisId = uuidv4()
      const timestamp = new Date().toISOString()

      // 模拟脉诊分析 (实际项目中这里应对接AI模型)
      const analysis = this._simulatePulseAnalysis(pulseData)

      // 保存分析结果
      if (userId) {
        const resultData = {
          id: analysisId,
          userId,
          type: DiagnosticType.PULSE,
          timestamp,
          pulseData,
          analysis,
          metadata,
          created_at: timestamp,
          updated_at: timestamp
        }

        await this._saveAnalysisResult(DiagnosticType.PULSE, analysisId, resultData)
      }

      return {
        id: analysisId,
        timestamp,
        diagnosis: analysis.diagnosis,
        pulseType: analysis.pulseType,
        characteristics: analysis.characteristics,
        recommendations: analysis.recommendations,
        relatedPatterns: analysis.relatedPatterns || []
      }
    } catch (error) {
      logger.error('脉诊分析失败', error)
      throw new Error(`脉诊分析失败: ${error.message}`)
    }
  }

  /**
   * 体质分析
   * @param {Object} options - 分析选项
   * @param {Object} options.userAnswers - 用户问卷回答
   * @param {Object} [options.healthData] - 健康数据
   * @param {string} [options.userId] - 用户ID
   * @param {Object} [options.metadata] - 元数据
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeConstitution (options) {
    const { userAnswers, healthData = {}, userId, metadata = {} } = options

    if (!userAnswers || Object.keys(userAnswers).length === 0) {
      throw new Error('用户问卷回答不能为空')
    }

    logger.info('进行体质分析', { userId })

    try {
      // 模拟分析处理延迟
      await this._delay(1800)

      // 生成分析结果ID和时间戳
      const analysisId = uuidv4()
      const timestamp = new Date().toISOString()

      // 模拟体质分析 (实际项目中这里应对接体质辨识模型)
      const analysis = this._simulateConstitutionAnalysis(userAnswers, healthData)

      // 保存分析结果
      if (userId) {
        const resultData = {
          id: analysisId,
          userId,
          type: DiagnosticType.CONSTITUTION,
          timestamp,
          userAnswers,
          healthDataSummary: healthData.summary,
          analysis,
          metadata,
          created_at: timestamp,
          updated_at: timestamp
        }

        await this._saveAnalysisResult(DiagnosticType.CONSTITUTION, analysisId, resultData)
      }

      return {
        id: analysisId,
        timestamp,
        primaryType: analysis.primaryType,
        primaryScore: analysis.primaryScore,
        secondaryTypes: analysis.secondaryTypes,
        constitutionScores: analysis.constitutionScores,
        recommendations: analysis.recommendations,
        dietSuggestions: analysis.dietSuggestions,
        lifestyleSuggestions: analysis.lifestyleSuggestions
      }
    } catch (error) {
      logger.error('体质分析失败', error)
      throw new Error(`体质分析失败: ${error.message}`)
    }
  }

  /**
   * 面诊分析
   * @param {Object} options - 分析选项
   * @param {string} options.imageData - 面部图像数据（Base64）
   * @param {string} [options.userId] - 用户ID
   * @param {Object} [options.metadata] - 元数据
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeFace (options) {
    const { imageData, userId, metadata = {} } = options

    if (!imageData) {
      throw new Error('面部图像数据不能为空')
    }

    logger.info('进行面诊分析', { userId })

    try {
      // 模拟图像分析处理延迟
      await this._delay(1600)

      // 生成分析结果ID和时间戳
      const analysisId = uuidv4()
      const timestamp = new Date().toISOString()

      // 模拟面诊分析 (实际项目中这里应对接AI模型)
      const analysis = this._simulateFaceAnalysis(imageData)

      // 保存分析结果
      if (userId) {
        const resultData = {
          id: analysisId,
          userId,
          type: DiagnosticType.FACE,
          timestamp,
          imageData: imageData.substring(0, 100) + '...', // 只存储部分图像数据
          analysis,
          metadata,
          created_at: timestamp,
          updated_at: timestamp
        }

        await this._saveAnalysisResult(DiagnosticType.FACE, analysisId, resultData)
      }

      return {
        id: analysisId,
        timestamp,
        diagnosis: analysis.diagnosis,
        features: analysis.features,
        complexion: analysis.complexion,
        faceShape: analysis.faceShape,
        recommendations: analysis.recommendations,
        relatedPatterns: analysis.relatedPatterns || []
      }
    } catch (error) {
      logger.error('面诊分析失败', error)
      throw new Error(`面诊分析失败: ${error.message}`)
    }
  }

  /**
   * 声诊分析
   * @param {Object} options - 分析选项
   * @param {string} options.audioData - 声音数据（Base64）
   * @param {Object} [options.voiceFeatures] - 预提取的声音特征
   * @param {string} [options.userId] - 用户ID
   * @param {Object} [options.metadata] - 元数据
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeVoice (options) {
    const { audioData, voiceFeatures = {}, userId, metadata = {} } = options

    if (!audioData && Object.keys(voiceFeatures).length === 0) {
      throw new Error('声音数据或声音特征不能为空')
    }

    logger.info('进行声诊分析', { userId })

    try {
      // 模拟声音分析处理延迟
      await this._delay(1700)

      // 生成分析结果ID和时间戳
      const analysisId = uuidv4()
      const timestamp = new Date().toISOString()

      // 模拟声诊分析 (实际项目中这里应对接AI模型)
      const analysis = this._simulateVoiceAnalysis(audioData, voiceFeatures)

      // 保存分析结果
      if (userId) {
        const resultData = {
          id: analysisId,
          userId,
          type: DiagnosticType.VOICE,
          timestamp,
          audioSummary: voiceFeatures || { sourceLengthSeconds: '未知', format: '未知' },
          analysis,
          metadata,
          created_at: timestamp,
          updated_at: timestamp
        }

        await this._saveAnalysisResult(DiagnosticType.VOICE, analysisId, resultData)
      }

      return {
        id: analysisId,
        timestamp,
        diagnosis: analysis.diagnosis,
        voiceType: analysis.voiceType,
        voiceCharacteristics: analysis.voiceCharacteristics,
        speechRate: analysis.speechRate,
        volume: analysis.volume,
        pitch: analysis.pitch,
        recommendations: analysis.recommendations,
        relatedPatterns: analysis.relatedPatterns || []
      }
    } catch (error) {
      logger.error('声诊分析失败', error)
      throw new Error(`声诊分析失败: ${error.message}`)
    }
  }

  /**
   * 综合诊断分析
   * @param {Object} options - 分析选项
   * @param {string} [options.userId] - 用户ID
   * @param {string} [options.tongueImageData] - 舌象图像数据（Base64）
   * @param {Object} [options.pulseData] - 脉象数据
   * @param {string} [options.faceImageData] - 面部图像数据（Base64）
   * @param {Object} [options.voiceFeatures] - 声音特征
   * @param {Object} [options.userAnswers] - 用户问卷回答
   * @param {Object} [options.healthData] - 健康数据
   * @param {Object} [options.metadata] - 元数据
   * @returns {Promise<Object>} 综合诊断结果
   */
  async analyzeComprehensive (options) {
    const {
      userId,
      tongueImageData,
      pulseData,
      faceImageData,
      voiceFeatures,
      userAnswers,
      healthData = {},
      metadata = {}
    } = options

    // 至少需要两种诊断数据
    const providedDataTypes = [
      tongueImageData,
      pulseData,
      faceImageData,
      voiceFeatures,
      userAnswers
    ].filter(data => data).length

    if (providedDataTypes < 2) {
      throw new Error('综合诊断至少需要两种诊断数据')
    }

    logger.info('进行综合诊断分析', { userId, providedDataTypes })

    try {
      // 生成分析结果ID和时间戳
      const analysisId = uuidv4()
      const timestamp = new Date().toISOString()

      // 单项诊断结果
      const diagnosticResults = {}
      const combinedFeatures = {}

      // 依次进行各项分析
      if (tongueImageData) {
        logger.info('综合诊断 - 进行舌诊分析')
        const tongueAnalysis = this._simulateTongueAnalysis(tongueImageData)
        diagnosticResults.tongue = tongueAnalysis
        combinedFeatures.tongue = tongueAnalysis.features
      }

      if (pulseData) {
        logger.info('综合诊断 - 进行脉诊分析')
        const pulseAnalysis = this._simulatePulseAnalysis(pulseData)
        diagnosticResults.pulse = pulseAnalysis
        combinedFeatures.pulse = pulseAnalysis.characteristics
      }

      if (faceImageData) {
        logger.info('综合诊断 - 进行面诊分析')
        const faceAnalysis = this._simulateFaceAnalysis(faceImageData)
        diagnosticResults.face = faceAnalysis
        combinedFeatures.face = faceAnalysis.features
      }

      if (voiceFeatures || options.audioData) {
        logger.info('综合诊断 - 进行声诊分析')
        const voiceAnalysis = this._simulateVoiceAnalysis(options.audioData, voiceFeatures)
        diagnosticResults.voice = voiceAnalysis
        combinedFeatures.voice = voiceAnalysis.voiceCharacteristics
      }

      if (userAnswers) {
        logger.info('综合诊断 - 进行体质分析')
        const constitutionAnalysis = this._simulateConstitutionAnalysis(userAnswers, healthData)
        diagnosticResults.constitution = constitutionAnalysis
        combinedFeatures.constitution = {
          primaryType: constitutionAnalysis.primaryType,
          secondaryTypes: constitutionAnalysis.secondaryTypes.map(t => t.type)
        }
      }

      // 综合分析
      logger.info('综合诊断 - 整合分析结果')
      const comprehensiveAnalysis = this._generateComprehensiveDiagnosis(diagnosticResults)

      // 保存分析结果
      if (userId) {
        const resultData = {
          id: analysisId,
          userId,
          type: DiagnosticType.COMPREHENSIVE,
          timestamp,
          sourceData: {
            hasTongueData: !!tongueImageData,
            hasPulseData: !!pulseData,
            hasFaceData: !!faceImageData,
            hasVoiceData: !!(voiceFeatures || options.audioData),
            hasConstitutionData: !!userAnswers
          },
          individualDiagnoses: Object.keys(diagnosticResults).reduce((acc, key) => {
            acc[key] = diagnosticResults[key].diagnosis
            return acc
          }, {}),
          analysis: comprehensiveAnalysis,
          metadata,
          created_at: timestamp,
          updated_at: timestamp
        }

        await this._saveAnalysisResult(DiagnosticType.COMPREHENSIVE, analysisId, resultData)
      }

      return {
        id: analysisId,
        timestamp,
        individualDiagnoses: Object.keys(diagnosticResults).reduce((acc, key) => {
          acc[key] = diagnosticResults[key].diagnosis
          return acc
        }, {}),
        diagnosis: comprehensiveAnalysis.diagnosis,
        disharmonies: comprehensiveAnalysis.disharmonies,
        recommendations: comprehensiveAnalysis.recommendations,
        herbRecommendations: comprehensiveAnalysis.herbRecommendations,
        dietaryAdvice: comprehensiveAnalysis.dietaryAdvice,
        lifestyleAdvice: comprehensiveAnalysis.lifestyleAdvice
      }
    } catch (error) {
      logger.error('综合诊断分析失败', error)
      throw new Error(`综合诊断分析失败: ${error.message}`)
    }
  }

  /**
   * 获取用户诊断历史
   * @param {Object} options - 查询选项
   * @param {string} options.userId - 用户ID
   * @param {string} [options.type] - 诊断类型
   * @param {number} [options.limit=10] - 结果数量限制
   * @returns {Promise<Array>} 诊断结果列表
   */
  async getUserDiagnosticHistory (options) {
    const { userId, type, limit = 10 } = options

    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    try {
      let results = []

      if (type && Object.values(DiagnosticType).includes(type)) {
        // 如果指定了类型，只获取该类型的历史
        const typeDir = path.join(this.resultsDir, type)
        results = await this._loadUserTypeResults(typeDir, userId)
      } else {
        // 否则获取所有类型的历史
        for (const diagType of Object.values(DiagnosticType)) {
          const typeDir = path.join(this.resultsDir, diagType)

          if (await fs.pathExists(typeDir)) {
            const typeResults = await this._loadUserTypeResults(typeDir, userId)
            results = results.concat(typeResults)
          }
        }
      }

      // 按时间倒序排序
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      // 限制结果数量
      if (limit && limit > 0) {
        results = results.slice(0, limit)
      }

      return results.map(result => {
        // 移除敏感数据
        const { imageData, pulseData, userAnswers, ...safeResult } = result
        return safeResult
      })
    } catch (error) {
      logger.error('获取用户诊断历史失败', error)
      throw new Error(`获取用户诊断历史失败: ${error.message}`)
    }
  }

  /**
   * 获取诊断模式
   * @param {Object} options - 查询选项
   * @param {string} [options.type] - 诊断类型
   * @param {string} [options.category] - 模式类别
   * @param {number} [options.limit=50] - 结果数量限制
   * @returns {Promise<Array>} 诊断模式列表
   */
  async getDiagnosticPatterns (options) {
    const { type, category, limit = 50 } = options

    try {
      // 加载所有模式文件
      const patterns = await this._loadDiagnosticPatterns(type)

      // 按类别过滤
      let filteredPatterns = patterns
      if (category) {
        filteredPatterns = patterns.filter(pattern => pattern.category === category)
      }

      // 限制结果数量
      if (limit && limit > 0 && filteredPatterns.length > limit) {
        filteredPatterns = filteredPatterns.slice(0, limit)
      }

      return filteredPatterns
    } catch (error) {
      logger.error('获取诊断模式失败', error)
      throw new Error(`获取诊断模式失败: ${error.message}`)
    }
  }

  /**
   * 模拟舌诊分析
   * @private
   * @param {string} imageData - 图像数据
   * @returns {Object} 分析结果
   */
  _simulateTongueAnalysis (imageData) {
    // 基于图像数据的哈希值随机生成结果
    const hash = this._simpleHash(imageData)

    // 根据哈希选择舌象特征
    const tongueFeatures = [
      { key: 'color', values: ['淡白', '淡红', '红', '绛', '青紫'] },
      { key: 'shape', values: ['胖大', '正常', '瘦薄', '齿痕', '裂纹'] },
      { key: 'coating', values: ['无苔', '薄白苔', '厚白苔', '黄苔', '黑苔'] },
      { key: 'moisture', values: ['湿润', '正常', '干燥', '很干'] }
    ]

    const features = {}
    tongueFeatures.forEach((feature, index) => {
      const valueIndex = (hash + index) % feature.values.length
      features[feature.key] = feature.values[valueIndex]
    })

    // 基于特征生成诊断和建议
    let diagnosis = ''
    const recommendations = []

    if (features.color === '淡白' && features.moisture === '湿润') {
      diagnosis = '脾胃虚寒'
      recommendations.push('饮食宜温热', '避免生冷食物', '可服用参苓白术散调理')
    } else if (features.color === '红' || features.color === '绛') {
      diagnosis = '热证'
      recommendations.push('饮食宜清淡', '避免辛辣刺激食物', '可服用清热类中药')
    } else if (features.coating === '黄苔') {
      diagnosis = '湿热内蕴'
      recommendations.push('饮食宜清淡', '避免油腻食物', '可服用三仁汤调理')
    } else if (features.color === '青紫') {
      diagnosis = '血瘀证'
      recommendations.push('保持情绪舒畅', '适当运动', '可服用活血化瘀类中药')
    } else {
      diagnosis = '基本健康'
      recommendations.push('保持规律作息', '均衡饮食', '适度运动')
    }

    const featureArray = Object.entries(features).map(([key, value]) => `${key}: ${value}`)

    return {
      diagnosis,
      features: featureArray,
      recommendations
    }
  }

  /**
   * 模拟面诊分析
   * @private
   * @param {string} imageData - 图像数据
   * @returns {Object} 分析结果
   */
  _simulateFaceAnalysis (imageData) {
    // 基于图像数据的哈希值随机生成结果
    const hash = this._simpleHash(imageData)

    // 根据哈希选择面诊特征
    const faceFeatures = [
      { key: 'complexion', values: ['苍白', '萎黄', '潮红', '晦暗', '青紫', '正常'] },
      { key: 'luster', values: ['光泽', '无光', '油光', '暗沉'] },
      { key: 'texture', values: ['细腻', '粗糙', '松弛', '紧绷'] },
      { key: 'spirit', values: ['神采奕奕', '精神疲惫', '目光呆滞', '正常'] }
    ]

    const features = {}
    faceFeatures.forEach((feature, index) => {
      const valueIndex = (hash + index) % feature.values.length
      features[feature.key] = feature.values[valueIndex]
    })

    // 面型特征
    const faceShapes = ['圆形', '方形', '长方形', '三角形', '椭圆形', '菱形']
    const faceShapeIndex = hash % faceShapes.length
    const faceShape = faceShapes[faceShapeIndex]

    // 面色特征
    const complexion = features.complexion

    // 基于特征生成诊断和建议
    let diagnosis = ''
    const recommendations = []

    if (complexion === '苍白' && features.luster === '无光') {
      diagnosis = '气血两虚'
      recommendations.push('饮食宜温补', '可服用八珍汤调理', '保持情绪舒畅，避免过度疲劳')
    } else if (complexion === '潮红' && features.texture === '紧绷') {
      diagnosis = '肝火上炎'
      recommendations.push('饮食宜清淡凉润', '避免辛辣刺激食物', '保持心情舒畅，避免情绪激动')
    } else if (complexion === '萎黄' && features.spirit === '精神疲惫') {
      diagnosis = '脾虚湿困'
      recommendations.push('饮食宜温补健脾', '适当运动，增强体质', '可服用健脾祛湿类药物')
    } else if (complexion === '青紫') {
      diagnosis = '血瘀证'
      recommendations.push('保持情绪舒畅', '适当运动', '可服用活血化瘀类中药')
    } else if (complexion === '晦暗' && features.luster === '油光') {
      diagnosis = '湿热内蕴'
      recommendations.push('饮食宜清淡', '避免油腻食物', '保持大便通畅')
    } else {
      diagnosis = '基本健康'
      recommendations.push('保持规律作息', '均衡饮食', '适度运动')
    }

    const featureArray = Object.entries(features).map(([key, value]) => `${key}: ${value}`)

    return {
      diagnosis,
      features: featureArray,
      complexion,
      faceShape,
      recommendations
    }
  }

  /**
   * 模拟声诊分析
   * @private
   * @param {string} audioData - 音频数据
   * @param {Object} voiceFeatures - 声音特征
   * @returns {Object} 分析结果
   */
  _simulateVoiceAnalysis (audioData, voiceFeatures) {
    // 基于音频数据的哈希值随机生成结果
    const hash = this._simpleHash(audioData || JSON.stringify(voiceFeatures))

    // 根据哈希选择声音特征
    const voiceTypes = ['洪亮', '低沉', '尖细', '嘶哑', '清脆', '混浊']
    const voiceTypeIndex = hash % voiceTypes.length
    const voiceType = voiceTypes[voiceTypeIndex]

    // 音量特征
    const volumes = ['高', '适中', '低']
    const volumeIndex = (hash + 1) % volumes.length
    const volume = volumes[volumeIndex]

    // 语速特征
    const speechRates = ['快', '正常', '慢', '不均匀']
    const speechRateIndex = (hash + 2) % speechRates.length
    const speechRate = speechRates[speechRateIndex]

    // 音调特征
    const pitches = ['高', '适中', '低', '多变']
    const pitchIndex = (hash + 3) % pitches.length
    const pitch = pitches[pitchIndex]

    // 声音特征标签
    const voiceCharacteristicsOptions = [
      { key: 'clarity', values: ['清晰', '模糊', '含混'] },
      { key: 'stability', values: ['稳定', '抖动', '不稳'] },
      { key: 'force', values: ['有力', '无力', '气短'] }
    ]

    const voiceCharacteristics = {}
    voiceCharacteristicsOptions.forEach((option, index) => {
      const valueIndex = (hash + index) % option.values.length
      voiceCharacteristics[option.key] = option.values[valueIndex]
    })

    // 基于特征生成诊断和建议
    let diagnosis = ''
    const recommendations = []

    if (voiceType === '嘶哑' && voiceCharacteristics.clarity === '模糊') {
      diagnosis = '肺热证'
      recommendations.push('避免辛辣刺激食物', '保持充分休息，少说话', '多饮温水')
    } else if (voiceType === '低沉' && voiceCharacteristics.force === '无力') {
      diagnosis = '肺气虚'
      recommendations.push('饮食宜温补', '适当进行深呼吸训练', '可服用玉屏风散等补肺益气药')
    } else if (voiceType === '尖细' && speechRate === '快') {
      diagnosis = '肝阳上亢'
      recommendations.push('保持心情舒畅，避免情绪激动', '饮食宜清淡', '可服用天麻钩藤饮等平肝潜阳药')
    } else if (voiceCharacteristics.force === '气短' && volume === '低') {
      diagnosis = '心肺气虚'
      recommendations.push('避免劳累，保持充分休息', '饮食宜温补', '可服用补气养心类中药')
    } else if (voiceType === '混浊' && voiceCharacteristics.stability === '不稳') {
      diagnosis = '痰湿内阻'
      recommendations.push('饮食宜清淡', '避免油腻食物', '可服用二陈汤等化痰祛湿类药物')
    } else {
      diagnosis = '基本健康'
      recommendations.push('保持规律作息', '均衡饮食', '适度运动')
    }

    const voiceCharacteristicsArray = Object.entries(voiceCharacteristics).map(([key, value]) => `${key}: ${value}`)

    return {
      diagnosis,
      voiceType,
      voiceCharacteristics: voiceCharacteristicsArray,
      speechRate,
      volume,
      pitch,
      recommendations
    }
  }

  /**
   * 生成综合诊断结果
   * @private
   * @param {Object} diagnosticResults - 各项诊断结果
   * @returns {Object} 综合诊断结果
   */
  _generateComprehensiveDiagnosis (diagnosticResults) {
    // 提取各诊断方式的结果
    const tongueResult = diagnosticResults.tongue
    const pulseResult = diagnosticResults.pulse
    const faceResult = diagnosticResults.face
    const voiceResult = diagnosticResults.voice
    const constitutionResult = diagnosticResults.constitution

    // 所有单项诊断结果
    const allDiagnoses = []
    if (tongueResult) allDiagnoses.push(tongueResult.diagnosis)
    if (pulseResult) allDiagnoses.push(pulseResult.diagnosis)
    if (faceResult) allDiagnoses.push(faceResult.diagnosis)
    if (voiceResult) allDiagnoses.push(voiceResult.diagnosis)

    // 计算诊断结果的频率
    const diagnosisCounts = {}
    allDiagnoses.forEach(diagnosis => {
      diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1
    })

    // 找出最常见的诊断结果
    let primaryDiagnosis = ''
    let maxCount = 0

    for (const [diagnosis, count] of Object.entries(diagnosisCounts)) {
      if (count > maxCount) {
        maxCount = count
        primaryDiagnosis = diagnosis
      }
    }

    // 确定不和谐模式（病机）
    const disharmonies = []
    const knownPatterns = {
      脾胃虚寒: ['气虚证', '脾虚', '胃寒'],
      热证: ['肝火上炎', '胃热', '热扰心神'],
      湿热内蕴: ['湿热', '痰湿内阻'],
      血瘀证: ['血瘀', '气滞血瘀'],
      气血两虚: ['气虚', '血虚', '心脾两虚'],
      肝火上炎: ['肝阳上亢', '肝胆湿热'],
      肺热证: ['肺热', '燥热伤肺'],
      肺气虚: ['肺气亏虚', '卫表不固'],
      心肺气虚: ['心气虚', '肺气虚']
    }

    // 查找匹配的不和谐模式
    for (const [pattern, relatedDiagnoses] of Object.entries(knownPatterns)) {
      if (allDiagnoses.includes(pattern) || relatedDiagnoses.some(d => allDiagnoses.includes(d))) {
        disharmonies.push(pattern)
      }
    }

    // 如果没有明确的不和谐模式，使用主要诊断
    if (disharmonies.length === 0 && primaryDiagnosis) {
      disharmonies.push(primaryDiagnosis)
    }

    // 生成调理建议
    const allRecommendations = []
    if (tongueResult && tongueResult.recommendations) {
      allRecommendations.push(...tongueResult.recommendations)
    }
    if (pulseResult && pulseResult.recommendations) {
      allRecommendations.push(...pulseResult.recommendations)
    }
    if (faceResult && faceResult.recommendations) {
      allRecommendations.push(...faceResult.recommendations)
    }
    if (voiceResult && voiceResult.recommendations) {
      allRecommendations.push(...voiceResult.recommendations)
    }

    // 去重
    const uniqueRecommendations = [...new Set(allRecommendations)]

    // 根据体质推荐草药
    let herbRecommendations = []
    let dietaryAdvice = []
    let lifestyleAdvice = []

    // 如果有体质分析结果，使用其建议
    if (constitutionResult) {
      dietaryAdvice = constitutionResult.dietSuggestions || []
      lifestyleAdvice = constitutionResult.lifestyleSuggestions || []
    }

    // 针对主要诊断推荐草药
    const herbFormulations = {
      脾胃虚寒: ['参苓白术散', '四君子汤', '理中丸'],
      热证: ['清热解毒方', '黄连解毒汤', '龙胆泻肝汤'],
      湿热内蕴: ['三仁汤', '甘露消毒丹', '清热利湿方'],
      血瘀证: ['血府逐瘀汤', '桃红四物汤', '通窍活血汤'],
      气血两虚: ['八珍汤', '十全大补汤', '归脾汤'],
      肝火上炎: ['天麻钩藤饮', '镇肝熄风汤', '柴胡疏肝散'],
      肺热证: ['桑菊饮', '清肺止咳汤', '泻白散'],
      肺气虚: ['玉屏风散', '生脉散', '补肺汤'],
      心肺气虚: ['补肺定喘汤', '归脾汤', '炙甘草汤']
    }

    // 为每种不和谐模式添加一个推荐方剂
    disharmonies.forEach(disharmony => {
      const formulas = herbFormulations[disharmony]
      if (formulas && formulas.length > 0) {
        // 选择一个方剂推荐
        const formula = formulas[0]
        herbRecommendations.push(formula)
      }
    })

    // 去重
    herbRecommendations = [...new Set(herbRecommendations)]

    // 补充饮食建议
    if (dietaryAdvice.length === 0) {
      if (disharmonies.includes('脾胃虚寒')) {
        dietaryAdvice.push('宜食温补脾胃食物，如大枣、山药、粳米等')
        dietaryAdvice.push('避免生冷食物')
      } else if (disharmonies.includes('热证') || disharmonies.includes('肝火上炎')) {
        dietaryAdvice.push('宜食清热降火食物，如绿豆、荷叶、白菊花等')
        dietaryAdvice.push('避免辛辣刺激、油炸食物')
      } else if (disharmonies.includes('湿热内蕴')) {
        dietaryAdvice.push('宜食清热祛湿食物，如冬瓜、薏米、赤小豆等')
        dietaryAdvice.push('避免油腻、甜腻食物')
      } else if (disharmonies.includes('血瘀证')) {
        dietaryAdvice.push('宜食活血化瘀食物，如红枣、桃仁、玫瑰花等')
        dietaryAdvice.push('避免油腻、高脂肪食物')
      }
    }

    // 补充生活方式建议
    if (lifestyleAdvice.length === 0) {
      lifestyleAdvice.push('保持规律作息，早睡早起')
      lifestyleAdvice.push('适当运动，调节情志')

      if (disharmonies.includes('气血两虚') || disharmonies.includes('肺气虚')) {
        lifestyleAdvice.push('避免过度劳累，注重休息')
      } else if (disharmonies.includes('肝火上炎')) {
        lifestyleAdvice.push('保持心情舒畅，避免情绪激动')
      }
    }

    return {
      diagnosis: primaryDiagnosis || '待进一步检查',
      disharmonies,
      recommendations: uniqueRecommendations,
      herbRecommendations,
      dietaryAdvice,
      lifestyleAdvice
    }
  }

  /**
   * 生成生活方式建议
   * @private
   * @param {string} primaryType - 主要体质类型
   * @param {Array<string>} secondaryTypes - 次要体质类型
   * @returns {Array<string>} 生活方式建议
   */
  _generateLifestyleSuggestions (primaryType, secondaryTypes) {
    const suggestions = {
      平和质: [
        '保持规律作息，早睡早起',
        '适当进行各种运动，如太极、慢跑、游泳',
        '保持心情舒畅，调和情志'
      ],
      气虚质: [
        '保证充足睡眠，避免过度劳累',
        '适合温和运动，如太极、八段锦',
        '避免过度操劳，保持心情舒畅'
      ],
      阳虚质: [
        '注意保暖，尤其是脚部和腹部',
        '适合温和运动，如八段锦、慢走',
        '避免寒冷环境，保持居室温暖'
      ],
      阴虚质: [
        '保持心情平静，避免情绪激动',
        '适合柔和运动，如太极、瑜伽',
        '保证充足睡眠，避免熬夜'
      ],
      痰湿质: [
        '适当增加户外活动和有氧运动',
        '保持居室干燥通风',
        '避免长时间处于潮湿环境'
      ],
      湿热质: [
        '保持情绪平和，避免暴躁',
        '适当进行有氧运动，促进汗液排出',
        '保持大便通畅，注意个人卫生'
      ],
      血瘀质: [
        '适当进行有氧运动，如散步、慢跑',
        '避免长时间保持同一姿势',
        '保持情绪平和，避免激动'
      ],
      气郁质: [
        '培养兴趣爱好，参与社交活动',
        '适当进行户外运动，如交谊舞、太极',
        '学习情绪管理和压力缓解技巧'
      ],
      特禀质: [
        '保持环境清洁，避免接触过敏原',
        '适当进行温和运动，增强体质',
        '定期体检，关注过敏源变化'
      ]
    }

    // 获取主要体质的建议
    const result = suggestions[primaryType] || suggestions['平和质']

    // 考虑次要体质的影响
    if (secondaryTypes && secondaryTypes.length > 0) {
      // 从次要体质中选取最多两个补充建议
      for (let i = 0; i < Math.min(2, secondaryTypes.length); i++) {
        const type = secondaryTypes[i]
        const typeSuggestions = suggestions[type]
        if (typeSuggestions && typeSuggestions.length > 0) {
          result.push(`次要体质(${type})建议: ${typeSuggestions[0]}`)
        }
      }
    }

    return result
  }

  /**
   * 保存分析结果
   * @private
   * @param {string} type - 诊断类型
   * @param {string} id - 结果ID
   * @param {Object} data - 结果数据
   * @returns {Promise<void>}
   */
  async _saveAnalysisResult (type, id, data) {
    const typeDir = path.join(this.resultsDir, type)
    const filePath = path.join(typeDir, `${id}.json`)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
  }

  /**
   * 加载用户特定类型的诊断结果
   * @private
   * @param {string} typeDir - 类型目录
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 结果列表
   */
  async _loadUserTypeResults (typeDir, userId) {
    try {
      const files = await fs.readdir(typeDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))

      const results = []

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(typeDir, file)
          const content = await fs.readFile(filePath, 'utf8')
          const data = JSON.parse(content)

          if (data.userId === userId) {
            results.push(data)
          }
        } catch (error) {
          logger.error(`加载诊断结果文件失败: ${file}`, error)
        }
      }

      return results
    } catch (error) {
      logger.error(`加载用户诊断结果失败: ${typeDir}, ${userId}`, error)
      return []
    }
  }

  /**
   * 加载诊断模式
   * @private
   * @param {string} [type] - 诊断类型
   * @returns {Promise<Array>} 模式列表
   */
  async _loadDiagnosticPatterns (type) {
    try {
      const patterns = []

      // 如果指定了类型，只加载该类型的模式
      if (type && Object.values(DiagnosticType).includes(type)) {
        const typeDir = path.join(this.patternsDir, type)

        if (await fs.pathExists(typeDir)) {
          const typePatterns = await this._loadPatternsFromDir(typeDir)
          patterns.push(...typePatterns)
        }
      } else {
        // 否则加载所有类型的模式
        for (const diagType of Object.values(DiagnosticType)) {
          const typeDir = path.join(this.patternsDir, diagType)

          if (await fs.pathExists(typeDir)) {
            const typePatterns = await this._loadPatternsFromDir(typeDir)
            patterns.push(...typePatterns)
          }
        }
      }

      return patterns
    } catch (error) {
      logger.error('加载诊断模式失败', error)
      return []
    }
  }

  /**
   * 从目录加载模式文件
   * @private
   * @param {string} dir - 目录路径
   * @returns {Promise<Array>} 模式列表
   */
  async _loadPatternsFromDir (dir) {
    try {
      const files = await fs.readdir(dir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))

      const patterns = []

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(dir, file)
          const content = await fs.readFile(filePath, 'utf8')
          const data = JSON.parse(content)
          patterns.push(data)
        } catch (error) {
          logger.error(`加载模式文件失败: ${file}`, error)
        }
      }

      return patterns
    } catch (error) {
      logger.error(`加载目录模式失败: ${dir}`, error)
      return []
    }
  }

  /**
   * 简单的哈希函数，用于模拟
   * @private
   * @param {string} str - 输入字符串
   * @returns {number} 哈希值
   */
  _simpleHash (str) {
    let hash = 0
    for (let i = 0; i < Math.min(str.length, 100); i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * 模拟延迟
   * @private
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  _delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出诊断服务实例和类型枚举
module.exports = {
  DiagnosticType,
  DiagnosticService
}
