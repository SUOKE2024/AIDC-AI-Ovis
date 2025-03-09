/**
 * 中医经典著作知识服务
 * 管理《黄帝内经》、《伤寒论》、《金匮要略》等经典医著知识
 */
const path = require('path')
const fs = require('fs').promises
const { v4: uuidv4 } = require('uuid')

class TCMClassicsKnowledgeService {
  /**
   * 创建中医经典知识服务
   * @param {Object} dependencies - 依赖项
   * @param {Object} dependencies.dbClient - 数据库客户端
   * @param {Object} dependencies.vectorSearchService - 向量搜索服务
   * @param {Object} dependencies.logger - 日志服务
   */
  constructor (dependencies) {
    this.dbClient = dependencies.dbClient
    this.vectorSearchService = dependencies.vectorSearchService
    this.logger = dependencies.logger || console

    // 集合名称
    this.collections = {
      classics: 'tcm_classics', // 经典著作
      chapters: 'tcm_classic_chapters', // 著作章节
      passages: 'tcm_classic_passages', // 著作段落
      knowledgePoints: 'tcm_knowledge_points', // 知识点
      relations: 'tcm_knowledge_relations', // 知识点关系
      modernMapping: 'tcm_modern_mapping' // 传统与现代概念映射
    }

    // 知识点类型
    this.knowledgeTypes = {
      DISEASE: 'disease', // 疾病
      SYNDROME: 'syndrome', // 证候
      HERB: 'herb', // 药物
      FORMULA: 'formula', // 方剂
      ACUPOINT: 'acupoint', // 穴位
      MERIDIAN: 'meridian', // 经络
      THERAPY: 'therapy', // 治疗方法
      DIAGNOSTIC_METHOD: 'diagnostic', // 诊断方法
      CONSTITUTION: 'constitution', // 体质
      THEORY: 'theory', // 理论
      PREVENTION: 'prevention' // 预防理念
    }

    // 关系类型
    this.relationTypes = {
      TREATS: 'treats', // 治疗
      CAUSES: 'causes', // 导致
      BELONGS_TO: 'belongs_to', // 属于
      CONTAINS: 'contains', // 包含
      SIMILAR_TO: 'similar_to', // 相似于
      CORRESPONDS_TO: 'corresponds_to', // 对应于
      PREVENTS: 'prevents', // 预防
      MODERN_EQUIVALENT: 'modern_equivalent', // 现代医学等价物
      SYNERGIZES_WITH: 'synergizes_with', // 协同作用
      ANTAGONIZES: 'antagonizes' // 拮抗作用
    }

    // 经典著作列表
    this.classicWorks = [
      {
        id: 'huangdi_neijing',
        name: '黄帝内经',
        parts: ['素问', '灵枢'],
        dynasty: '战国-汉',
        year: '约公元前200年',
        importance: 5,
        mainTheories: ['阴阳五行', '脏腑经络', '病因病机', '诊法', '养生']
      },
      {
        id: 'shang_han_lun',
        name: '伤寒论',
        author: '张仲景',
        dynasty: '东汉',
        year: '约200年',
        importance: 5,
        mainTheories: ['六经辨证', '方证相应']
      },
      {
        id: 'jin_kui_yao_lue',
        name: '金匮要略',
        author: '张仲景',
        dynasty: '东汉',
        year: '约200年',
        importance: 5,
        mainTheories: ['杂病辨治']
      },
      {
        id: 'ben_cao_gang_mu',
        name: '本草纲目',
        author: '李时珍',
        dynasty: '明',
        year: '1578年',
        importance: 5,
        mainTheories: ['药物分类', '药物性味功效']
      },
      {
        id: 'fu_qing_zhu_nv_ke',
        name: '傅青主女科',
        author: '傅山',
        dynasty: '清',
        year: '约1680年',
        importance: 4,
        mainTheories: ['妇科辨证论治']
      },
      {
        id: 'wen_bing_tiao_bian',
        name: '温病条辨',
        author: '吴鞠通',
        dynasty: '清',
        year: '1798年',
        importance: 4,
        mainTheories: ['卫气营血辨证', '三焦辨证']
      },
      {
        id: 'yi_zong_jin_jian',
        name: '医宗金鉴',
        author: '吴谦等',
        dynasty: '清',
        year: '1742年',
        importance: 4,
        mainTheories: ['诊断', '方剂', '针灸', '金匮', '伤寒']
      }
    ]
  }

  /**
   * 初始化服务
   * @returns {Promise<void>}
   */
  async initialize () {
    try {
      // 确保所需的集合存在
      await this.ensureCollections()

      // 创建必要的索引
      await this.createIndexes()

      // 初始化基础数据(如果需要)
      await this.initializeBaseData()

      this.logger.info('中医经典知识服务初始化完成')
    } catch (error) {
      this.logger.error('中医经典知识服务初始化失败', error)
      throw error
    }
  }

  /**
   * 确保所需的集合存在
   * @returns {Promise<void>}
   */
  async ensureCollections () {
    try {
      const db = this.dbClient.db()
      const collections = await db.listCollections().toArray()
      const collectionNames = collections.map(c => c.name)

      for (const [key, name] of Object.entries(this.collections)) {
        if (!collectionNames.includes(name)) {
          await db.createCollection(name)
          this.logger.info(`创建集合: ${name}`)
        }
      }
    } catch (error) {
      this.logger.error('确保集合存在失败', error)
      throw error
    }
  }

  /**
   * 创建必要的索引
   * @returns {Promise<void>}
   */
  async createIndexes () {
    try {
      const db = this.dbClient.db()

      // 在经典著作集合上创建索引
      await db.collection(this.collections.classics).createIndex({ name: 1 })

      // 在章节集合上创建索引
      await db.collection(this.collections.chapters).createIndex({ classicId: 1 })
      await db.collection(this.collections.chapters).createIndex({ title: 'text' })

      // 在段落集合上创建索引
      await db.collection(this.collections.passages).createIndex({ chapterId: 1 })
      await db.collection(this.collections.passages).createIndex({ content: 'text' })

      // 在知识点集合上创建索引
      await db.collection(this.collections.knowledgePoints).createIndex({ name: 1 })
      await db.collection(this.collections.knowledgePoints).createIndex({ type: 1 })
      await db.collection(this.collections.knowledgePoints).createIndex({ name: 'text', description: 'text' })

      // 在关系集合上创建索引
      await db.collection(this.collections.relations).createIndex({ sourceId: 1 })
      await db.collection(this.collections.relations).createIndex({ targetId: 1 })
      await db.collection(this.collections.relations).createIndex({ type: 1 })

      // 在现代映射集合上创建索引
      await db.collection(this.collections.modernMapping).createIndex({ traditionalId: 1 })
      await db.collection(this.collections.modernMapping).createIndex({ modernTerm: 'text' })
    } catch (error) {
      this.logger.error('创建索引失败', error)
      throw error
    }
  }

  /**
   * 初始化基础数据
   * @returns {Promise<void>}
   */
  async initializeBaseData () {
    try {
      const db = this.dbClient.db()
      const classicsCount = await db.collection(this.collections.classics).countDocuments()

      // 如果经典著作集合为空，则初始化
      if (classicsCount === 0) {
        await db.collection(this.collections.classics).insertMany(this.classicWorks)
        this.logger.info('初始化经典著作数据')
      }
    } catch (error) {
      this.logger.error('初始化基础数据失败', error)
      throw error
    }
  }

  /**
   * 添加新的知识点
   * @param {Object} knowledgePoint - 知识点数据
   * @returns {Promise<Object>} 添加的知识点
   */
  async addKnowledgePoint (knowledgePoint) {
    try {
      const db = this.dbClient.db()

      // 验证知识点类型
      if (!Object.values(this.knowledgeTypes).includes(knowledgePoint.type)) {
        throw new Error(`无效的知识点类型: ${knowledgePoint.type}`)
      }

      // 准备知识点数据
      const newKnowledgePoint = {
        _id: knowledgePoint._id || uuidv4(),
        name: knowledgePoint.name,
        type: knowledgePoint.type,
        description: knowledgePoint.description || '',
        sources: knowledgePoint.sources || [], // 来源引用
        properties: knowledgePoint.properties || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 插入知识点
      await db.collection(this.collections.knowledgePoints).insertOne(newKnowledgePoint)

      // 如果提供了向量表示，添加到向量搜索服务
      if (knowledgePoint.vectorRepresentation && this.vectorSearchService) {
        await this.vectorSearchService.addDocument({
          id: newKnowledgePoint._id,
          text: `${newKnowledgePoint.name} ${newKnowledgePoint.description}`,
          vector: knowledgePoint.vectorRepresentation,
          metadata: {
            type: 'knowledge_point',
            knowledgeType: newKnowledgePoint.type,
            name: newKnowledgePoint.name
          }
        })
      }

      return newKnowledgePoint
    } catch (error) {
      this.logger.error('添加知识点失败', error)
      throw error
    }
  }

  /**
   * 添加知识点之间的关系
   * @param {Object} relation - 关系数据
   * @returns {Promise<Object>} 添加的关系
   */
  async addRelation (relation) {
    try {
      const db = this.dbClient.db()

      // 验证关系类型
      if (!Object.values(this.relationTypes).includes(relation.type)) {
        throw new Error(`无效的关系类型: ${relation.type}`)
      }

      // 验证源知识点和目标知识点是否存在
      const sourceExists = await db.collection(this.collections.knowledgePoints)
        .findOne({ _id: relation.sourceId })

      const targetExists = await db.collection(this.collections.knowledgePoints)
        .findOne({ _id: relation.targetId })

      if (!sourceExists) {
        throw new Error(`源知识点不存在: ${relation.sourceId}`)
      }

      if (!targetExists) {
        throw new Error(`目标知识点不存在: ${relation.targetId}`)
      }

      // 准备关系数据
      const newRelation = {
        _id: relation._id || uuidv4(),
        sourceId: relation.sourceId,
        targetId: relation.targetId,
        type: relation.type,
        properties: relation.properties || {},
        evidence: relation.evidence || [], // 支持证据
        confidence: relation.confidence || 1.0, // 置信度 (0-1)
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 插入关系
      await db.collection(this.collections.relations).insertOne(newRelation)

      return newRelation
    } catch (error) {
      this.logger.error('添加关系失败', error)
      throw error
    }
  }

  /**
   * 添加传统与现代医学概念的映射
   * @param {Object} mapping - 映射数据
   * @returns {Promise<Object>} 添加的映射
   */
  async addModernMapping (mapping) {
    try {
      const db = this.dbClient.db()

      // 验证传统知识点是否存在
      const traditionalExists = await db.collection(this.collections.knowledgePoints)
        .findOne({ _id: mapping.traditionalId })

      if (!traditionalExists) {
        throw new Error(`传统知识点不存在: ${mapping.traditionalId}`)
      }

      // 准备映射数据
      const newMapping = {
        _id: mapping._id || uuidv4(),
        traditionalId: mapping.traditionalId,
        modernTerm: mapping.modernTerm,
        modernDescription: mapping.modernDescription || '',
        modernClassification: mapping.modernClassification || '',
        similarityScore: mapping.similarityScore || 0.8, // 相似度 (0-1)
        references: mapping.references || [], // 参考文献
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 插入映射
      await db.collection(this.collections.modernMapping).insertOne(newMapping)

      return newMapping
    } catch (error) {
      this.logger.error('添加现代映射失败', error)
      throw error
    }
  }

  /**
   * 根据类型查询知识点
   * @param {string} type - 知识点类型
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 知识点列表
   */
  async getKnowledgePointsByType (type, options = {}) {
    try {
      const db = this.dbClient.db()
      const limit = options.limit || 50
      const skip = options.skip || 0

      const query = { type }

      if (options.namePattern) {
        query.name = { $regex: options.namePattern, $options: 'i' }
      }

      const knowledgePoints = await db.collection(this.collections.knowledgePoints)
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray()

      return knowledgePoints
    } catch (error) {
      this.logger.error('查询知识点失败', error)
      throw error
    }
  }

  /**
   * 搜索知识点
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async searchKnowledgePoints (query, options = {}) {
    try {
      const db = this.dbClient.db()
      const limit = options.limit || 20

      let results = []

      // 如果有向量搜索服务，尝试语义搜索
      if (this.vectorSearchService && options.useSemanticSearch) {
        results = await this.vectorSearchService.search({
          query,
          filter: { type: 'knowledge_point' },
          limit
        })
      } else {
        // 使用文本搜索
        results = await db.collection(this.collections.knowledgePoints)
          .find({ $text: { $search: query } })
          .project({ score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .toArray()
      }

      // 对结果进行后处理处理
      const enrichedResults = await this._enrichSearchResults(results)

      return enrichedResults
    } catch (error) {
      this.logger.error('搜索知识点失败', error)
      throw error
    }
  }

  /**
   * 获取知识点的相关关系
   * @param {string} knowledgePointId - 知识点ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 关系数据
   */
  async getKnowledgePointRelations (knowledgePointId, options = {}) {
    try {
      const db = this.dbClient.db()

      // 查询作为源的关系
      const outgoingRelations = await db.collection(this.collections.relations)
        .find({ sourceId: knowledgePointId })
        .toArray()

      // 查询作为目标的关系
      const incomingRelations = await db.collection(this.collections.relations)
        .find({ targetId: knowledgePointId })
        .toArray()

      // 获取相关知识点的详细信息
      const relatedIds = new Set()
      outgoingRelations.forEach(rel => relatedIds.add(rel.targetId))
      incomingRelations.forEach(rel => relatedIds.add(rel.sourceId))

      const relatedPoints = await db.collection(this.collections.knowledgePoints)
        .find({ _id: { $in: Array.from(relatedIds) } })
        .toArray()

      // 以ID为键创建知识点查找映射
      const pointsMap = {}
      relatedPoints.forEach(point => {
        pointsMap[point._id] = point
      })

      // 扩充关系数据
      const enrichedOutgoing = outgoingRelations.map(rel => ({
        relation: rel,
        relatedPoint: pointsMap[rel.targetId],
        direction: 'outgoing'
      }))

      const enrichedIncoming = incomingRelations.map(rel => ({
        relation: rel,
        relatedPoint: pointsMap[rel.sourceId],
        direction: 'incoming'
      }))

      return {
        knowledgePointId,
        outgoingRelations: enrichedOutgoing,
        incomingRelations: enrichedIncoming
      }
    } catch (error) {
      this.logger.error('获取知识点关系失败', error)
      throw error
    }
  }

  /**
   * 获取知识点的现代医学映射
   * @param {string} traditionalId - 传统知识点ID
   * @returns {Promise<Array>} 映射列表
   */
  async getModernMappings (traditionalId) {
    try {
      const db = this.dbClient.db()

      const mappings = await db.collection(this.collections.modernMapping)
        .find({ traditionalId })
        .toArray()

      return mappings
    } catch (error) {
      this.logger.error('获取现代映射失败', error)
      throw error
    }
  }

  /**
   * 为搜索结果添加额外信息
   * @param {Array} results - 搜索结果
   * @returns {Promise<Array>} 扩充后的结果
   * @private
   */
  async _enrichSearchResults (results) {
    try {
      const db = this.dbClient.db()
      const enriched = []

      for (const result of results) {
        // 获取相关联的信息
        const relationCount = await db.collection(this.collections.relations)
          .countDocuments({
            $or: [
              { sourceId: result._id },
              { targetId: result._id }
            ]
          })

        const modernMappings = await db.collection(this.collections.modernMapping)
          .find({ traditionalId: result._id })
          .toArray()

        enriched.push({
          ...result,
          relationCount,
          hasModernMapping: modernMappings.length > 0,
          modernMappings: modernMappings.slice(0, 3) // 只返回前三个
        })
      }

      return enriched
    } catch (error) {
      this.logger.error('扩充搜索结果失败', error)
      return results // 失败时返回原始结果
    }
  }

  /**
   * 获取经典著作列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 经典著作列表
   */
  async getClassics (options = {}) {
    try {
      const db = this.dbClient.db()
      const limit = options.limit || 50
      const skip = options.skip || 0

      const classics = await db.collection(this.collections.classics)
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray()

      return classics
    } catch (error) {
      this.logger.error('获取经典著作失败', error)
      throw error
    }
  }

  /**
   * 添加预防医学知识点映射到传统医学
   * @param {Object} preventionMapping - 预防医学映射数据
   * @returns {Promise<Object>} 添加的映射
   */
  async addPreventionMapping (preventionMapping) {
    try {
      // 首先添加预防医学知识点
      const preventionPoint = await this.addKnowledgePoint({
        name: preventionMapping.modernName,
        type: this.knowledgeTypes.PREVENTION,
        description: preventionMapping.modernDescription,
        properties: preventionMapping.modernProperties || {}
      })

      // 然后创建与传统知识点的映射关系
      const relation = await this.addRelation({
        sourceId: preventionMapping.traditionalId,
        targetId: preventionPoint._id,
        type: this.relationTypes.MODERN_EQUIVALENT,
        properties: {
          basis: preventionMapping.mappingBasis || '概念相似性',
          confidence: preventionMapping.confidence || 0.8
        }
      })

      return {
        preventionPoint,
        relation
      }
    } catch (error) {
      this.logger.error('添加预防医学映射失败', error)
      throw error
    }
  }

  /**
   * 批量导入知识点
   * @param {Array} knowledgePoints - 知识点数据数组
   * @returns {Promise<Object>} 导入结果
   */
  async bulkImportKnowledgePoints (knowledgePoints) {
    try {
      const db = this.dbClient.db()
      const results = {
        total: knowledgePoints.length,
        successful: 0,
        failed: 0,
        errors: []
      }

      for (const point of knowledgePoints) {
        try {
          await this.addKnowledgePoint(point)
          results.successful++
        } catch (error) {
          results.failed++
          results.errors.push({
            point: point.name,
            error: error.message
          })
        }
      }

      return results
    } catch (error) {
      this.logger.error('批量导入知识点失败', error)
      throw error
    }
  }
}

module.exports = TCMClassicsKnowledgeService
