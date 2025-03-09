/**
 * 中医知识库服务
 * 提供中医药理论、方剂、药材、诊断等知识的管理和查询功能
 */

const fs = require('fs-extra')
const path = require('path')
const logger = require('./loggerService')
const { VectorSearchService } = require('./vectorSearchService')

/**
 * 中医知识分类
 */
const TCMCategory = {
  THEORY: 'theory', // 中医理论
  HERB: 'herb', // 中药材
  FORMULA: 'formula', // 方剂
  ACUPOINT: 'acupoint', // 穴位
  DISEASE: 'disease', // 疾病
  DIAGNOSTIC: 'diagnostic', // 诊断
  CONSTITUTION: 'constitution', // 体质
  TREATMENT: 'treatment' // 治疗方法
}

/**
 * 中医知识库服务
 * 提供中医知识的存储、检索和管理功能
 */
class TCMKnowledgeService {
  /**
   * 创建中医知识库服务
   * @param {Object} options - 服务选项
   * @param {string} options.dataDir - 数据存储目录
   * @param {VectorSearchService} options.vectorSearchService - 向量搜索服务实例
   */
  constructor (options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data', 'tcm')
    this.knowledgeDir = path.join(this.dataDir, 'knowledge')
    this.vectorSearchService = options.vectorSearchService || new VectorSearchService({
      storePath: path.join(this.dataDir, 'vectors'),
      namespace: 'tcm'
    })

    // 知识库缓存
    this.cache = {
      herbs: null,
      formulas: null,
      theories: null,
      acupoints: null,
      diseases: null,
      constitutions: null
    }

    this._initService()
  }

  /**
   * 初始化服务
   * @private
   */
  _initService () {
    // 确保数据目录存在
    fs.ensureDirSync(this.dataDir)
    fs.ensureDirSync(this.knowledgeDir)

    // 确保各分类目录存在
    Object.values(TCMCategory).forEach(category => {
      fs.ensureDirSync(path.join(this.knowledgeDir, category))
    })

    logger.info('中医知识库服务初始化完成')
  }

  /**
   * 搜索知识
   * @param {Object} options - 搜索选项
   * @param {string} options.query - 搜索关键词
   * @param {string} [options.category] - 知识分类
   * @param {number} [options.limit=10] - 结果数量限制
   * @returns {Promise<Array>} 搜索结果
   */
  async searchKnowledge (options) {
    const { query, category, limit = 10 } = options

    if (!query) {
      throw new Error('搜索关键词不能为空')
    }

    const searchResults = await this.vectorSearchService.searchByText(query, {
      limit,
      filterType: category ? `tcm_${category}` : 'tcm'
    })

    return searchResults.map(item => ({
      id: item.document.id,
      title: item.document.title,
      content: item.document.content,
      category: item.document.category,
      tags: item.document.tags,
      score: item.score
    }))
  }

  /**
   * 获取所有药材列表
   * @returns {Promise<Array>} 药材列表
   */
  async getHerbList () {
    if (this.cache.herbs) {
      return this.cache.herbs
    }

    const herbs = await this._loadKnowledgeByCategory(TCMCategory.HERB)
    this.cache.herbs = herbs
    return herbs
  }

  /**
   * 按ID获取药材详情
   * @param {string} id - 药材ID
   * @returns {Promise<Object|null>} 药材详情
   */
  async getHerbById (id) {
    return this._getKnowledgeById(TCMCategory.HERB, id)
  }

  /**
   * 获取所有方剂列表
   * @returns {Promise<Array>} 方剂列表
   */
  async getFormulaList () {
    if (this.cache.formulas) {
      return this.cache.formulas
    }

    const formulas = await this._loadKnowledgeByCategory(TCMCategory.FORMULA)
    this.cache.formulas = formulas
    return formulas
  }

  /**
   * 按ID获取方剂详情
   * @param {string} id - 方剂ID
   * @returns {Promise<Object|null>} 方剂详情
   */
  async getFormulaById (id) {
    return this._getKnowledgeById(TCMCategory.FORMULA, id)
  }

  /**
   * 获取所有理论列表
   * @returns {Promise<Array>} 理论列表
   */
  async getTheoryList () {
    if (this.cache.theories) {
      return this.cache.theories
    }

    const theories = await this._loadKnowledgeByCategory(TCMCategory.THEORY)
    this.cache.theories = theories
    return theories
  }

  /**
   * 按ID获取理论详情
   * @param {string} id - 理论ID
   * @returns {Promise<Object|null>} 理论详情
   */
  async getTheoryById (id) {
    return this._getKnowledgeById(TCMCategory.THEORY, id)
  }

  /**
   * 获取所有穴位列表
   * @returns {Promise<Array>} 穴位列表
   */
  async getAcupointList () {
    if (this.cache.acupoints) {
      return this.cache.acupoints
    }

    const acupoints = await this._loadKnowledgeByCategory(TCMCategory.ACUPOINT)
    this.cache.acupoints = acupoints
    return acupoints
  }

  /**
   * 按ID获取穴位详情
   * @param {string} id - 穴位ID
   * @returns {Promise<Object|null>} 穴位详情
   */
  async getAcupointById (id) {
    return this._getKnowledgeById(TCMCategory.ACUPOINT, id)
  }

  /**
   * 获取所有体质类型列表
   * @returns {Promise<Array>} 体质类型列表
   */
  async getConstitutionList () {
    if (this.cache.constitutions) {
      return this.cache.constitutions
    }

    const constitutions = await this._loadKnowledgeByCategory(TCMCategory.CONSTITUTION)
    this.cache.constitutions = constitutions
    return constitutions
  }

  /**
   * 按ID获取体质类型详情
   * @param {string} id - 体质类型ID
   * @returns {Promise<Object|null>} 体质类型详情
   */
  async getConstitutionById (id) {
    return this._getKnowledgeById(TCMCategory.CONSTITUTION, id)
  }

  /**
   * 添加知识条目
   * @param {Object} knowledge - 知识条目
   * @param {string} knowledge.category - 知识分类
   * @param {string} knowledge.title - 标题
   * @param {string} knowledge.content - 内容
   * @param {Object} [knowledge.metadata] - 元数据
   * @returns {Promise<Object>} 添加的知识条目
   */
  async addKnowledge (knowledge) {
    if (!knowledge.category || !Object.values(TCMCategory).includes(knowledge.category)) {
      throw new Error('无效的知识分类')
    }

    if (!knowledge.title || !knowledge.content) {
      throw new Error('标题和内容不能为空')
    }

    // 生成知识ID
    const id = `${knowledge.category}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    const knowledgeItem = {
      id,
      title: knowledge.title,
      content: knowledge.content,
      category: knowledge.category,
      tags: knowledge.tags || [],
      metadata: knowledge.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 保存到文件
    await this._saveKnowledgeItem(knowledgeItem)

    // 添加到向量搜索
    await this.vectorSearchService.addDocument({
      id,
      title: knowledge.title,
      content: knowledge.content,
      category: knowledge.category,
      tags: knowledge.tags || [],
      type: `tcm_${knowledge.category}`
    })

    // 清除相关缓存
    this.cache[`${knowledge.category}s`] = null

    return knowledgeItem
  }

  /**
   * 更新知识条目
   * @param {string} id - 知识条目ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object>} 更新后的知识条目
   */
  async updateKnowledge (id, updates) {
    const [category] = id.split('_')

    if (!Object.values(TCMCategory).includes(category)) {
      throw new Error('无效的知识ID')
    }

    // 获取原知识条目
    const knowledge = await this._getKnowledgeById(category, id)

    if (!knowledge) {
      throw new Error('知识条目不存在')
    }

    // 更新字段
    const updatedKnowledge = {
      ...knowledge,
      ...updates,
      updated_at: new Date().toISOString()
    }

    // 保存到文件
    await this._saveKnowledgeItem(updatedKnowledge)

    // 更新向量搜索
    if (updates.title || updates.content) {
      await this.vectorSearchService.removeDocument(id)
      await this.vectorSearchService.addDocument({
        id,
        title: updatedKnowledge.title,
        content: updatedKnowledge.content,
        category: updatedKnowledge.category,
        tags: updatedKnowledge.tags || [],
        type: `tcm_${updatedKnowledge.category}`
      })
    }

    // 清除相关缓存
    this.cache[`${category}s`] = null

    return updatedKnowledge
  }

  /**
   * 删除知识条目
   * @param {string} id - 知识条目ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteKnowledge (id) {
    const [category] = id.split('_')

    if (!Object.values(TCMCategory).includes(category)) {
      throw new Error('无效的知识ID')
    }

    const filePath = path.join(this.knowledgeDir, category, `${id}.json`)

    try {
      // 检查文件是否存在
      await fs.access(filePath)

      // 删除文件
      await fs.unlink(filePath)

      // 从向量搜索中删除
      await this.vectorSearchService.removeDocument(id)

      // 清除相关缓存
      this.cache[`${category}s`] = null

      return true
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false // 文件不存在
      }
      throw error
    }
  }

  /**
   * 导入知识数据
   * @param {Array} knowledgeItems - 知识条目数组
   * @returns {Promise<Object>} 导入结果
   */
  async importKnowledge (knowledgeItems) {
    if (!Array.isArray(knowledgeItems) || knowledgeItems.length === 0) {
      throw new Error('导入数据不能为空')
    }

    const results = {
      total: knowledgeItems.length,
      success: 0,
      failed: 0,
      errors: []
    }

    for (const item of knowledgeItems) {
      try {
        await this.addKnowledge(item)
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          item: item.title,
          error: error.message
        })
      }
    }

    return results
  }

  /**
   * 获取知识库统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats () {
    const stats = {}

    // 获取各分类条目数量
    for (const category of Object.values(TCMCategory)) {
      const items = await this._loadKnowledgeByCategory(category)
      stats[category] = items.length
    }

    stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0)

    return stats
  }

  /**
   * 按分类加载知识条目
   * @private
   * @param {string} category - 知识分类
   * @returns {Promise<Array>} 知识条目列表
   */
  async _loadKnowledgeByCategory (category) {
    const categoryDir = path.join(this.knowledgeDir, category)

    try {
      const files = await fs.readdir(categoryDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))

      const items = []

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(categoryDir, file)
          const content = await fs.readFile(filePath, 'utf8')
          const item = JSON.parse(content)
          items.push(item)
        } catch (error) {
          logger.error(`加载知识文件失败: ${file}`, error)
        }
      }

      return items
    } catch (error) {
      logger.error(`加载知识分类失败: ${category}`, error)
      return []
    }
  }

  /**
   * 按ID获取知识条目
   * @private
   * @param {string} category - 知识分类
   * @param {string} id - 知识条目ID
   * @returns {Promise<Object|null>} 知识条目
   */
  async _getKnowledgeById (category, id) {
    const filePath = path.join(this.knowledgeDir, category, `${id}.json`)

    try {
      const content = await fs.readFile(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null // 文件不存在
      }
      logger.error(`获取知识条目失败: ${id}`, error)
      throw error
    }
  }

  /**
   * 保存知识条目到文件
   * @private
   * @param {Object} knowledge - 知识条目
   * @returns {Promise<void>}
   */
  async _saveKnowledgeItem (knowledge) {
    const { category, id } = knowledge
    const filePath = path.join(this.knowledgeDir, category, `${id}.json`)

    await fs.writeFile(filePath, JSON.stringify(knowledge, null, 2), 'utf8')
  }
}

module.exports = {
  TCMCategory,
  TCMKnowledgeService
}
