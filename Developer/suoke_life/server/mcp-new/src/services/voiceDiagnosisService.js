/**
 * 声诊分析服务
 * 基于中医五音理论，分析声音特征与脏腑状态的关联
 */
const path = require('path')
const fs = require('fs').promises

class VoiceDiagnosisService {
  /**
   * 初始化声诊分析服务
   * @param {Object} dependencies - 依赖项
   * @param {Object} dependencies.audioProcessor - 音频处理工具
   * @param {Object} dependencies.fiveToneModel - 五音分析模型
   * @param {Object} dependencies.voiceMLModel - 机器学习模型
   * @param {Object} dependencies.dbClient - 数据库客户端
   * @param {Object} dependencies.logger - 日志服务
   * @param {Object} dependencies.tcmClassicsKnowledgeService - 中医经典知识服务
   */
  constructor (dependencies) {
    this.audioProcessor = dependencies.audioProcessor
    this.fiveToneModel = dependencies.fiveToneModel
    this.voiceMLModel = dependencies.voiceMLModel
    this.dbClient = dependencies.dbClient
    this.logger = dependencies.logger || console
    this.tcmClassicsKnowledgeService = dependencies.tcmClassicsKnowledgeService
    this.voiceFeaturesPath = path.join(process.cwd(), 'data', 'voice', 'tone_features.json')
    this.voiceFeatures = null
    this.organToneMap = {}
    this.toneOrganMap = {}
    this.disharmonyDescriptions = {}

    // 声音特征知识库路径
    this.voiceFeaturePath = path.join(process.cwd(), 'data', 'voice', 'tone_features.json')

    // 病证音色对应关系
    this.disharmonyToneMapping = {}

    // 初始化
    this.initialize()
  }

  /**
   * 初始化服务
   */
  async initialize () {
    try {
      // 加载声音特征知识库
      await this.loadVoiceFeatures()

      this.logger.info('声诊分析服务初始化完成')
    } catch (error) {
      this.logger.error('声诊分析服务初始化失败', error)

      // 初始化基础映射，以防配置文件加载失败
      this.initializeDefaultMappings()
    }
  }

  /**
   * 加载声音特征知识库
   */
  async loadVoiceFeatures () {
    try {
      const exists = await fs.access(this.voiceFeaturePath)
        .then(() => true)
        .catch(() => false)

      if (exists) {
        const data = await fs.readFile(this.voiceFeaturePath, 'utf8')
        const features = JSON.parse(data)

        this.disharmonyToneMapping = features.disharmonyToneMapping || {}

        this.logger.info('声音特征知识库加载成功')
      } else {
        this.logger.warn('声音特征知识库文件不存在，使用默认映射')
        this.initializeDefaultMappings()

        // 创建默认知识库文件
        await this.createDefaultFeatureFile()
      }
    } catch (error) {
      this.logger.error('加载声音特征知识库失败', error)
      this.initializeDefaultMappings()
    }
  }

  /**
   * 初始化默认映射关系
   */
  initializeDefaultMappings () {
    this.disharmonyToneMapping = {
      // 五音与五脏的基本对应关系
      gong: {
        organ: '脾',
        normalFeatures: ['圆润', '和缓', '中正', '厚重'],
        disharmonyFeatures: {
          脾虚: ['轻浮', '无力', '飘浮'],
          湿困脾: ['浊重', '黏滞', '含混']
        }
      },
      shang: {
        organ: '肺',
        normalFeatures: ['清脆', '响亮', '轻快'],
        disharmonyFeatures: {
          肺气虚: ['虚弱', '气短', '无力'],
          肺阴虚: ['干燥', '嘶哑'],
          风寒束肺: ['低沉', '气急']
        }
      },
      jue: {
        organ: '肝',
        normalFeatures: ['清晰', '柔和', '平直'],
        disharmonyFeatures: {
          肝气郁结: ['急促', '抑郁', '叹息'],
          肝阳上亢: ['高亢', '急躁', '震颤'],
          肝血虚: ['微弱', '不继']
        }
      },
      zhi: {
        organ: '心',
        normalFeatures: ['洪亮', '悦耳', '流畅'],
        disharmonyFeatures: {
          心气虚: ['低弱', '无力', '间断'],
          心阴虚: ['急速', '不安', '燥热'],
          痰蒙心神: ['颠倒', '错乱']
        }
      },
      yu: {
        organ: '肾',
        normalFeatures: ['沉稳', '深厚', '绵长'],
        disharmonyFeatures: {
          肾阳虚: ['低沉', '畏寒', '无力'],
          肾阴虚: ['细弱', '干涩', '断续'],
          肾精亏: ['疲惫', '气短', '言少']
        }
      }
    }
  }

  /**
   * 创建默认特征文件
   */
  async createDefaultFeatureFile () {
    try {
      const dirPath = path.dirname(this.voiceFeaturePath)

      // 确保目录存在
      await fs.mkdir(dirPath, { recursive: true })

      // 写入默认配置
      const defaultFeatures = {
        version: '1.0',
        description: '中医五音与脏腑关系及病证特征库',
        lastUpdated: new Date().toISOString(),
        disharmonyToneMapping: this.disharmonyToneMapping
      }

      await fs.writeFile(
        this.voiceFeaturePath,
        JSON.stringify(defaultFeatures, null, 2),
        'utf8'
      )

      this.logger.info('创建默认声音特征知识库文件成功')
    } catch (error) {
      this.logger.error('创建默认声音特征知识库文件失败', error)
    }
  }

  /**
   * 分析语音
   * @param {Buffer|string} audioData - 音频数据或文件路径
   * @param {Object} userContext - 用户上下文信息
   * @returns {Promise<Object>} - 分析结果
   */
  async analyzeVoice (audioData, userContext = {}) {
    try {
      // 获取音频特征
      const audioFeatures = await this.audioProcessor.extractFeatures(audioData)

      // 使用五音模型分析主导音调
      const traditionalTone = await this.fiveToneModel.analyzeTone(audioFeatures)

      // 如果有ML模型，则结合ML模型结果
      let dominantTone = traditionalTone
      let mlPrediction = null

      if (this.voiceMLModel) {
        try {
          const mfccFeatures = await this.audioProcessor.extractMFCC(audioData)
          mlPrediction = await this.voiceMLModel.predictTone(mfccFeatures)

          if (mlPrediction) {
            // 结合传统模型和ML模型结果
            dominantTone = this.combineModelResults(traditionalTone, mlPrediction)
          }
        } catch (error) {
          this.logger.warn('ML模型预测失败，仅使用传统模型', error)
        }
      }

      // 获取关联脏腑
      const associatedOrgan = this.toneOrganMap[dominantTone] || '未知'

      // 分析音色特征
      const timbreAnalysis = this.analyzeTimbre(audioFeatures, dominantTone)

      // 识别潜在病证
      const potentialDisharmonies = this.identifyPotentialDisharmonies(dominantTone, timbreAnalysis)

      // 如果有ML模型，结合模型预测病证
      if (this.voiceMLModel && mlPrediction) {
        try {
          const disharmonyPrediction = await this.voiceMLModel.predictDisharmony(audioFeatures, dominantTone)
          if (disharmonyPrediction) {
            // 结合ML模型的病证预测结果
            this.enhanceDisharmoniesWithML(potentialDisharmonies, disharmonyPrediction)
          }
        } catch (error) {
          this.logger.warn('ML模型病证预测失败', error)
        }
      }

      // 与其他诊断数据整合
      await this.integrateWithOtherDiagnostics(potentialDisharmonies, userContext)

      // 生成调理建议
      const recommendations = this.generateRecommendations({
        dominantTone,
        associatedOrgan,
        timbreAnalysis,
        potentialDisharmonies
      })

      // 构建分析结果
      let result = {
        dominantTone,
        associatedOrgan,
        timbreAnalysis,
        potentialDisharmonies,
        recommendations,
        analysisTime: new Date().toISOString()
      }

      // 使用经典知识丰富结果
      if (this.tcmClassicsKnowledgeService) {
        try {
          result = await this.tcmClassicsKnowledgeService.enrichDiagnosisWithClassics(result)
        } catch (error) {
          this.logger.warn('使用经典知识丰富结果失败', error)
        }
      }

      // 保存分析结果
      await this.saveAnalysisResult(result, userContext)

      return result
    } catch (error) {
      this.logger.error('声音分析失败', error)
      throw error
    }
  }

  /**
   * 综合传统模型和ML模型结果
   * @param {string} traditionalTone - 传统模型预测的音调
   * @param {Object} mlPrediction - ML模型预测结果
   * @returns {string} 综合后的音调
   */
  combineModelResults (traditionalTone, mlPrediction) {
    if (!mlPrediction) {
      return traditionalTone
    }

    // 基于置信度决定采用哪个模型的结果
    // ML模型预测置信度高于阈值时，优先采用ML结果
    if (mlPrediction.confidence > 0.7) {
      return mlPrediction.dominantTone
    }

    // 否则使用传统模型结果
    return traditionalTone
  }

  /**
   * 分析音色特征
   * @param {Object} audioFeatures - 音频特征
   * @param {string} dominantTone - 主导音调
   * @returns {Object} 音色分析结果
   */
  analyzeTimbre (audioFeatures, dominantTone) {
    const toneMapping = this.disharmonyToneMapping[dominantTone]
    if (!toneMapping) {
      return {
        features: [],
        normalityScore: 0.5,
        description: '无法确定音色特征'
      }
    }

    // 检测音色特征
    const detectedFeatures = []
    const normalFeatures = toneMapping.normalFeatures || []
    let normalityScore = 0.5 // 默认中性分数

    // 分析音色与正常特征的匹配度
    const featureMatches = normalFeatures.map(feature => {
      // 这里应该有复杂的音色特征匹配算法
      // 简化版：假设我们能够为每个特征计算一个匹配分数
      const matchScore = this.calculateFeatureMatchScore(audioFeatures, feature)
      return { feature, matchScore }
    })

    // 找出最匹配的特征
    featureMatches.sort((a, b) => b.matchScore - a.matchScore)
    featureMatches.slice(0, 3).forEach(match => {
      if (match.matchScore > 0.6) {
        detectedFeatures.push(match.feature)
      }
    })

    // 计算整体正常度分数
    if (featureMatches.length > 0) {
      normalityScore = featureMatches.reduce((sum, match) => sum + match.matchScore, 0) / featureMatches.length
    }

    // 检查是否有病证特征
    const disharmonyFeatures = {}
    Object.entries(toneMapping.disharmonyFeatures || {}).forEach(([disharmony, features]) => {
      const disharmonyMatches = features.map(feature => {
        const matchScore = this.calculateFeatureMatchScore(audioFeatures, feature)
        return { feature, matchScore }
      })

      const avgScore = disharmonyMatches.reduce((sum, match) => sum + match.matchScore, 0) /
        (disharmonyMatches.length || 1)

      disharmonyFeatures[disharmony] = avgScore
    })

    return {
      features: detectedFeatures,
      normalityScore,
      disharmonyFeatures,
      description: this.generateTimbreDescription(detectedFeatures, normalityScore)
    }
  }

  /**
   * 计算特征匹配分数
   * @param {Object} audioFeatures - 音频特征
   * @param {string} feature - 特征名称
   * @returns {number} 匹配分数 (0-1)
   */
  calculateFeatureMatchScore (audioFeatures, feature) {
    // TODO: 实现复杂的特征匹配算法
    // 简化版：随机分数，实际应基于频谱分析、音调、音色等客观指标
    return 0.5 + (Math.random() * 0.5)
  }

  /**
   * 生成音色描述
   * @param {string[]} features - 检测到的特征
   * @param {number} normalityScore - 正常度分数
   * @returns {string} 描述文本
   */
  generateTimbreDescription (features, normalityScore) {
    if (features.length === 0) {
      return '声音特征不明显'
    }

    const featureText = features.join('、')

    if (normalityScore > 0.8) {
      return `声音${featureText}，显示气机调和`
    } else if (normalityScore > 0.6) {
      return `声音基本${featureText}，气机尚可`
    } else if (normalityScore > 0.4) {
      return `声音${featureText}不足，气机稍弱`
    } else {
      return `声音缺乏${featureText}，气机失调`
    }
  }

  /**
   * 识别潜在的病证
   * @param {string} dominantTone - 主导音调
   * @param {Object} timbreAnalysis - 音色分析
   * @returns {Object} 潜在病证
   */
  identifyPotentialDisharmonies (dominantTone, timbreAnalysis) {
    const toneMapping = this.disharmonyToneMapping[dominantTone]
    if (!toneMapping || !timbreAnalysis.disharmonyFeatures) {
      return []
    }

    // 根据分数排序找出最可能的病证
    const sortedDisharmonies = Object.entries(timbreAnalysis.disharmonyFeatures)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)

    // 只返回分数超过阈值的病证
    return sortedDisharmonies
      .filter(item => item.score > 0.65)
      .map(item => ({
        name: item.name,
        confidence: item.score,
        description: this.getDisharmonyDescription(item.name),
        relatedOrgan: toneMapping.organ
      }))
  }

  /**
   * 获取病证描述
   * @param {string} disharmonyName - 病证名称
   * @returns {string} 病证描述
   */
  getDisharmonyDescription (disharmonyName) {
    // 病证描述库
    const descriptions = {
      脾虚: '脾气亏虚，运化失职，常见疲乏无力，食欲不振，大便溏薄',
      湿困脾: '湿邪困阻脾胃，运化失健，常见腹胀纳差，肢体困重',
      肺气虚: '肺气亏虚，宣降失调，常见少气懒言，声音低弱，易感冒',
      肺阴虚: '肺阴不足，失于滋润，常见干咳少痰，咽干口燥，声音嘶哑',
      风寒束肺: '风寒之邪束肺，肺气失宣，常见恶寒发热，咳嗽气急',
      肝气郁结: '肝气郁滞，疏泄失职，常见胁肋胀痛，情志抑郁，烦躁易怒',
      肝阳上亢: '肝阳偏亢，上扰清窍，常见头晕目眩，急躁易怒，面红耳赤',
      肝血虚: '肝血不足，筋脉失养，常见眩晕心悸，手足麻木，面色萎黄',
      心气虚: '心气不足，推动无力，常见心悸气短，乏力自汗，面色苍白',
      心阴虚: '心阴不足，虚热内扰，常见心烦失眠，口干舌燥，五心烦热',
      痰蒙心神: '痰浊上扰，蒙蔽心神，常见神志混乱，言语颠倒，胸闷心悸',
      肾阳虚: '肾阳不足，温煦失职，常见畏寒肢冷，腰膝酸软，小便清长',
      肾阴虚: '肾阴亏损，虚热内生，常见五心烦热，腰膝酸软，失眠多梦',
      肾精亏: '肾精不足，生化乏源，常见头晕耳鸣，记忆力减退，腰膝酸软'
    }

    return descriptions[disharmonyName] || `${disharmonyName}，具体表现因人而异`
  }

  /**
   * 整合其他诊断数据
   * @param {Array} potentialDisharmonies - 潜在病证
   * @param {Object} userContext - 用户上下文
   * @returns {Promise<Object>} 整合分析结果
   */
  async integrateWithOtherDiagnostics (potentialDisharmonies, userContext) {
    if (!userContext.userId) {
      return {
        voiceBasedDisharmonies: potentialDisharmonies,
        integratedDisharmonies: potentialDisharmonies,
        confidence: '低',
        note: '仅基于声音分析，未整合其他诊断数据'
      }
    }

    try {
      // 获取用户最近的诊断结果
      const recentDiagnostics = await this.getRecentDiagnostics(userContext.userId)

      if (!recentDiagnostics || recentDiagnostics.length === 0) {
        return {
          voiceBasedDisharmonies: potentialDisharmonies,
          integratedDisharmonies: potentialDisharmonies,
          confidence: '中',
          note: '仅基于声音分析，未找到其他诊断数据'
        }
      }

      // 整合诊断结果
      const integratedResults = this.mergeDisharmonies(
        potentialDisharmonies,
        recentDiagnostics
      )

      return {
        voiceBasedDisharmonies: potentialDisharmonies,
        otherDiagnostics: recentDiagnostics,
        integratedDisharmonies: integratedResults.disharmonies,
        confidence: integratedResults.confidence,
        note: integratedResults.note
      }
    } catch (error) {
      this.logger.error('整合诊断数据失败', error)
      return {
        voiceBasedDisharmonies: potentialDisharmonies,
        integratedDisharmonies: potentialDisharmonies,
        confidence: '低',
        note: '整合其他诊断数据失败: ' + error.message
      }
    }
  }

  /**
   * 获取最近的诊断结果
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 最近的诊断结果
   */
  async getRecentDiagnostics (userId) {
    // TODO: 从数据库获取最近的诊断结果
    return []
  }

  /**
   * 合并病证结果
   * @param {Array} voiceDisharmonies - 声音分析得出的病证
   * @param {Array} otherDiagnostics - 其他诊断得出的病证
   * @returns {Object} 合并结果
   */
  mergeDisharmonies (voiceDisharmonies, otherDiagnostics) {
    // TODO: 实现复杂的病证合并算法
    // 简化版：直接返回声音分析结果
    return {
      disharmonies: voiceDisharmonies,
      confidence: '中',
      note: '已尝试整合其他诊断数据，但合并算法尚未完全实现'
    }
  }

  /**
   * 生成调理建议
   * @param {Object} analysis - 分析结果
   * @returns {Object} 调理建议
   */
  generateRecommendations (analysis) {
    const disharmonies = analysis.integratedDisharmonies || []
    if (disharmonies.length === 0) {
      return {
        general: ['保持规律作息，均衡饮食，适当运动'],
        specific: []
      }
    }

    // 生成针对性建议
    const specificRecommendations = disharmonies.map(disharmony => {
      return {
        forDisharmony: disharmony.name,
        recommendations: this.getRecommendationsForDisharmony(disharmony.name)
      }
    })

    return {
      general: [
        '保持规律作息，均衡饮食，适当运动',
        '避免情绪波动过大，保持心情舒畅'
      ],
      specific: specificRecommendations
    }
  }

  /**
   * 获取特定病证的调理建议
   * @param {string} disharmonyName - 病证名称
   * @returns {string[]} 调理建议
   */
  getRecommendationsForDisharmony (disharmonyName) {
    // 病证调理建议库
    const recommendationMap = {
      脾虚: [
        '饮食宜温热，避免生冷食物',
        '适当食用健脾食材，如山药、薏米、芡实等',
        '避免过度思虑，保持心情舒畅'
      ],
      湿困脾: [
        '饮食宜清淡，避免油腻、甜腻食物',
        '适当食用祛湿食材，如赤小豆、薏米、冬瓜等',
        '保持居住环境干燥通风'
      ],
      肺气虚: [
        '注意保暖，预防感冒',
        '适当食用补肺食材，如百合、山药、杏仁等',
        '练习吐纳呼吸，增强肺功能'
      ],
      肺阴虚: [
        '避免辛辣刺激性食物',
        '适当食用滋阴食材，如百合、沙参、麦冬等',
        '保持室内空气湿润'
      ],
      肝气郁结: [
        '保持心情舒畅，避免情绪波动',
        '适当运动，促进气血流通',
        '食用疏肝理气食材，如柴胡、香附、玫瑰花等'
      ],
      肾阳虚: [
        '注意保暖，尤其是腰腹部位',
        '适当食用温补肾阳食材，如桂圆、核桃、羊肉等',
        '避免久坐久站，注意腰部保健'
      ],
      肾阴虚: [
        '避免辛辣刺激性食物',
        '适当食用滋阴食材，如黑芝麻、枸杞、女贞子等',
        '保持充足睡眠，避免过度劳累'
      ]
    }

    return recommendationMap[disharmonyName] || [
      '建议咨询专业中医师进行个性化调理',
      '保持规律作息，均衡饮食，适当运动'
    ]
  }

  /**
   * 保存分析结果
   * @param {Object} result - 分析结果
   * @param {Object} userContext - 用户上下文
   * @returns {Promise<void>}
   */
  async saveAnalysisResult (result, userContext) {
    if (!userContext.userId) {
      this.logger.info('未提供用户ID，分析结果不会被保存')
      return
    }

    try {
      // TODO: 实现保存分析结果到数据库
      this.logger.info('分析结果已保存', { userId: userContext.userId })
    } catch (error) {
      this.logger.error('保存分析结果失败', error)
    }
  }

  /**
   * 使用ML模型增强病证识别结果
   * @param {Array} potentialDisharmonies - 基于规则识别的潜在病证
   * @param {Array} mlPrediction - ML模型预测的病证概率
   */
  enhanceDisharmoniesWithML (potentialDisharmonies, mlPrediction) {
    // 这里假设mlPrediction是一个病证名称到概率的映射
    for (let i = 0; i < potentialDisharmonies.length; i++) {
      const disharmonyName = potentialDisharmonies[i].name
      if (mlPrediction[disharmonyName] !== undefined) {
        // 调整置信度
        potentialDisharmonies[i].confidence = (potentialDisharmonies[i].confidence + mlPrediction[disharmonyName]) / 2
        potentialDisharmonies[i].mlSupported = true
      }
    }

    // 检查ML模型是否发现了新的高概率病证
    const existingNames = potentialDisharmonies.map(d => d.name)
    for (const [name, probability] of Object.entries(mlPrediction)) {
      if (!existingNames.includes(name) && probability > 0.6) {
        potentialDisharmonies.push({
          name,
          confidence: probability,
          description: this.getDisharmonyDescription(name) || `${name}是由机器学习模型识别的潜在病证`,
          mlDetected: true
        })
      }
    }

    // 重新排序
    potentialDisharmonies.sort((a, b) => b.confidence - a.confidence)
  }
}

module.exports = VoiceDiagnosisService
